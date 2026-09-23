import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createRazorpayOrder, getConfig as getRazorpayConfig, razorpayConfigured } from "@/lib/razorpay"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const ENQUIRY_FEE = 1000
const str = (v: unknown) => (v === null || v === undefined ? null : String(v).trim() || null)

async function resolveSchool(code?: string | null) {
  const c = String(code || "DEFAULT").trim()
  const r = await query(`SELECT id, code, name FROM schools WHERE lower(code) = lower($1) LIMIT 1`, [c])
  return r.rows[0] as { id: number; code: string; name: string } | undefined
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, enquiryId } = body
    const name = str(body.name)
    const phone = str(body.phone)
    const email = str(body.email)

    if (!name || !phone || !email) {
      return NextResponse.json({ error: "Name, phone and email are required" }, { status: 400 })
    }

    const school = await resolveSchool(String(code || "DEFAULT"))
    if (!school) return NextResponse.json({ error: "Invalid school code" }, { status: 404 })

    let linkedEnquiryId: number | null = null
    const enquiryIdNum = parseInt(String(enquiryId || "0"), 10) || null
    if (enquiryIdNum) {
      const e = (
        await query(`SELECT id FROM admission_enquiries WHERE id = $1 AND school_id = $2`, [enquiryIdNum, school.id])
      ).rows[0]
      if (e) linkedEnquiryId = enquiryIdNum
    }
    if (!linkedEnquiryId) {
      let classId = null
      const wantedClass = str(body.classVal)
      if (wantedClass) {
        const cls = (
          await query(`SELECT id FROM classes WHERE school_id = $1 AND lower(name) = lower($2) LIMIT 1`, [school.id, wantedClass])
        ).rows[0]
        if (cls) classId = cls.id
      }
      const newEnq = (
        await query(
          `INSERT INTO admission_enquiries
             (school_id, name, phone, email, class_id, address, description, status, enquiry_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active', CURRENT_DATE)
           RETURNING id`,
          [school.id, name, phone, email, classId, str(body.address), str(body.description)]
        )
      ).rows[0]
      linkedEnquiryId = newEnq.id
    }

    const year = new Date().getFullYear()
    const regFormNo = `RG-${year}-${String(Math.floor(Math.random() * 9000) + 1000)}`

    const row =
      (
        await query(
          `INSERT INTO online_admission_registrations
             (school_id, enquiry_id, reg_form_no, name, phone, email, class_val, address, description, amount, status, payment_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending', 'Pending')
           RETURNING *`,
          [
            school.id,
            linkedEnquiryId,
            regFormNo,
            name,
            phone,
            email,
            str(body.classVal),
            str(body.address),
            str(body.description),
            ENQUIRY_FEE,
          ]
        )
      ).rows[0]

    const amountPaise = Math.round(Number(ENQUIRY_FEE) * 100)

    if (await razorpayConfigured()) {
      try {
        const order = await createRazorpayOrder(amountPaise, regFormNo, {
          type: "admission_registration",
          registration_id: String(row.id),
          school_id: String(school.id),
          enquiry_id: linkedEnquiryId ? String(linkedEnquiryId) : "",
        })
        await query(`UPDATE online_admission_registrations SET order_id = $1 WHERE id = $2`, [order.id, row.id])
        const cfg = await getRazorpayConfig()
        return NextResponse.json({
          mode: "razorpay",
          registrationId: row.id,
          regFormNo,
          orderId: order.id,
          keyId: cfg.keyId,
          amountPaise,
          amount: ENQUIRY_FEE,
          currency: cfg.currency || "INR",
          schoolName: school.name,
          redirectUrl: order?.short_url || null,
        })
      } catch (e) {
        // Demo/test keys (rzp_test_) can't create real orders — fall back to a
        // simulated flow so the feature stays testable. Live keys stay strict.
        const cfg = await getRazorpayConfig()
        if ((cfg.keyId || "").startsWith("rzp_live_")) throw e
      }
    }

    return NextResponse.json({
      mode: "test",
      registrationId: row.id,
      regFormNo,
      amountPaise,
      amount: ENQUIRY_FEE,
      currency: "INR",
      schoolName: school.name,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}