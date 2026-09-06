import { NextRequest } from "next/server"
import { handle, requireRole, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"
import { today, resolvePayerStudent, getFeeLedger } from "@/lib/fee-pay"
import { razorpayConfigured, verifyRazorpayPayment } from "@/lib/razorpay"

// Confirm an online fee payment and mark it paid.
// Body:
//   paymentId          — a fees_payments row id returned by /api/my/fees/pay/order
//   paymentIds         — multiple row ids (bulk "pay all" order)
//   studentId          (parent only) — the kid being paid for
//   razorpayPaymentId  — Razorpay payment id returned by the Flutter/web checkout
//                        (required when the gateway is configured)
//   paymentMode        — how the payer actually paid (manual flow only): Cash, UPI,
//                        Cheque, Card, Bank Transfer, Other. Defaults to 'Online'.
//   reference          — optional transaction / reference number the payer entered
//                        (manual flow only). Replaces the pending batch token.
// When the gateway is configured the paymentId(s) are verified against Razorpay
// before the rows are flipped to Paid. In manual mode the rows are trusted and the
// mode + reference supplied by the payer are stored so the school can reconcile.
export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent"])

  const body = await req.json()
  const razorpayPaymentId = body.razorpayPaymentId || null
  const paymentMode = typeof body.paymentMode === "string" ? body.paymentMode.trim() : ""
  const reference = typeof body.reference === "string" ? body.reference.trim() : ""
  const paymentIds: number[] = body.paymentIds
    ? (Array.isArray(body.paymentIds) ? body.paymentIds : [body.paymentIds]).map(Number)
    : []
  const singleId = Number(body.paymentId || 0)
  if (singleId) paymentIds.push(singleId)
  if (paymentIds.length === 0) throw new ApiError(400, "paymentId is required")

  const student = await resolvePayerStudent(ctx, body.studentId ? Number(body.studentId) : undefined)

  const rows = (
    await query(`SELECT * FROM fees_payments WHERE id = ANY($1) AND student_id = $2`, [paymentIds, student.id])
  ).rows
  if (rows.length === 0) throw new ApiError(404, "Pending payment not found for this student")

  const pending = rows.filter((r: any) => String(r.status || "").toLowerCase() === "pending")
  if (pending.length === 0 && rows.every((r: any) => ["paid", "success"].includes(String(r.status || "").toLowerCase()))) {
    return { success: true, alreadyPaid: true, ledger: await getFeeLedger(student) }
  }
  if (pending.length !== rows.length) {
    throw new ApiError(400, "Payment is not in a payable state")
  }

  if (await razorpayConfigured()) {
    if (!razorpayPaymentId) throw new ApiError(400, "razorpayPaymentId is required")
    const verified = await verifyRazorpayPayment(razorpayPaymentId)
    if (!verified) throw new ApiError(400, "Payment not verified against Razorpay gateway")
  }

  const updated = []
  for (const rowB of rows) {
    // Keep the payment method recorded when the order was created (the gateway the
    // payer chose, e.g. 'phonepe'/'cashfree', or 'manual'). Razorpay real payments
    // are always labelled 'razorpay'.
    const newMethod = razorpayPaymentId ? "razorpay" : (rowB.payment_method || "manual")
    const newMode = razorpayPaymentId ? "Online" : paymentMode || rowB.payment_mode || "Online"
    const newTxn = razorpayPaymentId || reference || rowB.transaction_id || null
    const ump = (
      await query(
        `UPDATE fees_payments
         SET status = 'Paid', payment_method = $1, transaction_id = $2,
             paid_amount = $3, payment_mode = $4, payment_date = $5
         WHERE id = $6 AND student_id = $7
         RETURNING id, student_id AS "studentId", fees_type_id AS "feesTypeId",
           amount, paid_amount AS "paidAmount", payment_mode AS "paymentMode",
           payment_method AS "paymentMethod", transaction_id AS "transactionId",
           payment_date AS "paymentDate", status`,
        [newMethod, newTxn, rowB.amount, newMode, today(), rowB.id, student.id]
      )
    ).rows[0]
    updated.push(ump)
  }

  return { success: true, payment: updated.length === 1 ? updated[0] : updated, ledger: await getFeeLedger(student) }
})