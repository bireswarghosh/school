import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { razorpayConfigured, verifyRazorpayPayment } from "@/lib/razorpay"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("invoice") || "0")
  if (!id) return NextResponse.json({ error: "invoice required" }, { status: 400 })
  const inv = (await query(`SELECT * FROM invoices WHERE id = $1`, [id])).rows[0]
  if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  const school = (await query(`SELECT name, email FROM schools WHERE id = $1`, [inv.school_id])).rows[0]
  return NextResponse.json({
    id: inv.id,
    invoiceNo: inv.invoice_no,
    planName: inv.plan_name,
    amount: Number(inv.amount),
    currency: inv.currency,
    status: inv.status,
    dueDate: inv.due_date,
    paidAt: inv.paid_at,
    schoolName: school?.name || "School",
    razorpayOrderId: inv.razorpay_order_id,
    razorpayConfigured: await razorpayConfigured(),
  })
}

// Simulate / verify a completed payment against an invoice.
// Body: { invoice, paymentId? } — paymentId is the Razorpay payment id when configured.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = parseInt(body.invoice || "0")
    const paymentId = body.paymentId || null
    if (!id) return NextResponse.json({ error: "invoice required" }, { status: 400 })

    const inv = (await query(`SELECT * FROM invoices WHERE id = $1`, [id])).rows[0]
    if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    if (inv.status === "paid") return NextResponse.json({ success: true, alreadyPaid: true })

    // If Razorpay configured and a paymentId is supplied, verify it against the gateway.
    if (paymentId && (await razorpayConfigured())) {
      const verified = await verifyRazorpayPayment(paymentId)
      if (!verified) return NextResponse.json({ error: "Payment not verified" }, { status: 400 })
    }

    await query(
      `UPDATE invoices SET status = 'paid', paid_at = $1, payment_method = $2 WHERE id = $3`,
      [new Date().toISOString(), paymentId ? "razorpay" : "cash", id]
    )
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
