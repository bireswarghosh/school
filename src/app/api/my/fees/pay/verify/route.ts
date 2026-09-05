import { NextRequest } from "next/server"
import { handle, requireRole, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"
import { today, resolvePayerStudent, getFeeLedger } from "@/lib/fee-pay"
import { razorpayConfigured, verifyRazorpayPayment } from "@/lib/razorpay"

// Confirm an online fee payment and mark it paid.
// Body:
//   paymentId          (required) — the fees_payments row id returned by /api/my/fees/pay/order
//   studentId          (parent only) — the kid being paid for
//   razorpayPaymentId  — Razorpay payment id returned by the Flutter/web checkout
//                        (required when the gateway is configured)
// When the gateway is configured the paymentId is verified against Razorpay before
// the row is flipped to Paid. When it is not configured the row is trusted
// (dev/demo mode). The response includes the fresh fee ledger for the student.
export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent"])

  const body = await req.json()
  const paymentId = Number(body.paymentId || 0)
  const razorpayPaymentId = body.razorpayPaymentId || null
  if (!paymentId) throw new ApiError(400, "paymentId is required")

  const student = await resolvePayerStudent(ctx, body.studentId ? Number(body.studentId) : undefined)

  const row = (
    await query(`SELECT * FROM fees_payments WHERE id = $1 AND student_id = $2`, [paymentId, student.id])
  ).rows[0]
  if (!row) throw new ApiError(404, "Pending payment not found for this student")

  const status = String(row.status || "").toLowerCase()
  if (status === "paid" || status === "success") {
    return { success: true, alreadyPaid: true, ledger: await getFeeLedger(student) }
  }

  if (status !== "pending") {
    throw new ApiError(400, `Payment is not in a payable state (status=${row.status})`)
  }

  if (await razorpayConfigured()) {
    if (!razorpayPaymentId) throw new ApiError(400, "razorpayPaymentId is required")
    const verified = await verifyRazorpayPayment(razorpayPaymentId)
    if (!verified) throw new ApiError(400, "Payment not verified against Razorpay gateway")
  }

  const updated = (
    await query(
      `UPDATE fees_payments
       SET status = 'Paid', payment_method = $1, transaction_id = $2,
           paid_amount = $3, payment_mode = 'Online', payment_date = $4
       WHERE id = $5 AND student_id = $6
       RETURNING id, student_id AS "studentId", fees_type_id AS "feesTypeId",
         amount, paid_amount AS "paidAmount", payment_mode AS "paymentMode",
         payment_method AS "paymentMethod", transaction_id AS "transactionId",
         payment_date AS "paymentDate", status`,
      [razorpayPaymentId ? "razorpay" : row.payment_method || "offline", razorpayPaymentId || row.transaction_id || null, row.amount, today(), paymentId, student.id]
    )
  ).rows[0]

  return { success: true, payment: updated, ledger: await getFeeLedger(student) }
})