import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { query } from "@/lib/db"
import { getConfig as getRazorpayConfig, verifyRazorpayPayment } from "@/lib/razorpay"
import { sendMail, registrationEmailHtml, registrationEmailText } from "@/lib/mailer"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function makeToken() {
  return crypto.randomBytes(24).toString("hex")
}

function day() {
  return new Date().toISOString().slice(0, 10)
}

function verifySignature(orderId: string, paymentId: string, signature: string | undefined, secret: string) {
  if (!orderId || !paymentId || !signature || !secret) return false
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex")
  return expected === signature
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const registrationId = parseInt(String(body.registrationId || "0"), 10)
    const orderId = String(body.orderId || "")
    const paymentId = String(body.paymentId || "")
    const razorpaySignature = String(body.razorpaySignature || "")
    const testMode = Boolean(body.testMode)

    if (!registrationId) return NextResponse.json({ error: "registrationId required" }, { status: 400 })

    const row = (
      await query(`SELECT * FROM online_admission_registrations WHERE id = $1`, [registrationId])
    ).rows[0]
    if (!row) return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    if (row.payment_status === "Paid") {
      return NextResponse.json({
        error: "This form has already been paid for",
        regLink: row.token ? `/online-admission/register?ref=${row.token}` : null,
      }, { status: 400 })
    }

    let verified = false
    if (testMode) {
      verified = true
    } else {
      const cfg = await getRazorpayConfig()
      verified = verifySignature(orderId, paymentId, razorpaySignature, cfg.keySecret)
      if (!verified && orderId && paymentId) {
        verified = await verifyRazorpayPayment(paymentId)
      }
    }

    if (!verified) {
      await query(`UPDATE online_admission_registrations SET payment_status = 'Failed' WHERE id = $1`, [registrationId])
      return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 })
    }

    const token = row.token || makeToken()
    const origin = new URL(req.url).origin
    const regLink = `${origin}/online-admission/register?ref=${token}`

    await query(
      `UPDATE online_admission_registrations
       SET status = 'Paid', payment_status = 'Paid', token = $1, payment_id = $2, payment_date = $3
       WHERE id = $4`,
      [token, paymentId || null, day(), registrationId]
    )

    if (row.enquiry_id) {
      await query(
        `UPDATE admission_enquiries
         SET reg_form_purchased = true, reg_form_no = $1, reg_form_amount = $2,
             reg_form_payment_mode = 'Online (Razorpay)', reg_form_status = 'Purchased',
             reg_form_payment_date = $3, reg_form_transaction_id = $4
         WHERE id = $5 AND school_id = $6`,
        [row.reg_form_no, Number(row.amount) || 0, day(), paymentId || null, row.enquiry_id, row.school_id]
      )
    }

    const school = (
      await query(`SELECT name FROM schools WHERE id = $1`, [row.school_id])
    ).rows[0] as { name: string } | undefined

    let emailSent = false
    let emailReason = ""
    if (row.email) {
      const mail = await sendMail({
        to: row.email,
        subject: `${school?.name || "School"} – Your Admission Registration Form Link`,
        html: registrationEmailHtml({
          schoolName: school?.name || "School",
          name: row.name,
          regFormNo: row.reg_form_no,
          regLink,
          amount: Number(row.amount) || 0,
        }),
        text: registrationEmailText({
          schoolName: school?.name || "School",
          name: row.name,
          regFormNo: row.reg_form_no,
          regLink,
          amount: Number(row.amount) || 0,
        }),
      })
      emailSent = mail.sent
      emailReason = mail.reason || ""
    }

    return NextResponse.json({
      success: true,
      registrationId: row.id,
      regFormNo: row.reg_form_no,
      amount: Number(row.amount) || 0,
      schoolName: school?.name || "School",
      regLink,
      emailSent,
      emailReason,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}