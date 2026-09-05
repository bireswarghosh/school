import { NextRequest } from "next/server"
import { handle, requireRole, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"
import {
  today,
  resolvePayerStudent,
  resolveActiveFeeMaster,
  paidForType,
  getFeeLedger,
} from "@/lib/fee-pay"
import { razorpayConfigured, createRazorpayOrder, getConfig as getRazorpayConfig } from "@/lib/razorpay"

// Start an online fee payment for a student.
// Student or parent login. When Razorpay is configured this creates a Razorpay
// Order and records a Pending fees_payments row (idempotent per fee type), so the
// mobile (Flutter) SDK can run the checkout and then call /api/my/fees/pay/verify.
// When Razorpay is NOT configured the fee is recorded as paid immediately
// (offline mode) so development/demo keeps working.
export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent"])

  const body = await req.json()
  const studentId = body.studentId ? Number(body.studentId) : undefined
  const feesTypeId = Number(body.feesTypeId || 0)
  if (!feesTypeId) throw new ApiError(400, "feesTypeId is required")

  const student = await resolvePayerStudent(ctx, studentId)
  const master = await resolveActiveFeeMaster(student, feesTypeId)

  const paid = await paidForType(student.id, feesTypeId)
  const balance = Math.max(0, Number(master.amount) - paid)
  if (balance <= 0) throw new ApiError(400, "No pending balance for this fee type")

  const amount = body.amount ? Number(body.amount) : balance
  if (!amount || amount <= 0) throw new ApiError(400, "amount is required (positive number)")
  if (amount > balance) throw new ApiError(400, `amount exceeds pending balance (${balance})`)

  if (await razorpayConfigured()) {
    const existing = (
      await query(
        `SELECT id, transaction_id AS "orderId"
         FROM fees_payments
         WHERE student_id = $1 AND fees_type_id = $2 AND status = 'Pending' AND payment_method = 'razorpay'
         ORDER BY id DESC LIMIT 1`,
        [student.id, feesTypeId]
      )
    ).rows[0]

    let paymentId: number
    let orderId: string
    if (existing) {
      // Idempotent retry: reuse the pending order instead of creating a duplicate.
      paymentId = Number(existing.id)
      orderId = String(existing.orderId || "")
    } else {
      const order = await createRazorpayOrder(
        Math.round(amount * 100),
        `FEES-${student.id}-${feesTypeId}-${Date.now() % 100000}`,
        { student_id: String(student.id), fees_type_id: String(feesTypeId), school_id: String(ctx.schoolId ?? "") }
      )
      const ins = await query(
        `INSERT INTO fees_payments (student_id, class_id, fees_group_id, fees_type_id, amount, paid_amount, payment_mode, payment_method, transaction_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Online', 'razorpay', $7, 'Pending')
         RETURNING id`,
        [student.id, student.class_id, master.feesGroupId, feesTypeId, amount, amount, order.id]
      )
      paymentId = Number(ins.rows[0].id)
      orderId = order.id
    }

    if (!orderId) throw new ApiError(500, "Failed to create Razorpay order")
    const cfg = await getRazorpayConfig()
    const studentName = student.name || `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Student"
    return {
      mode: "razorpay_order",
      paymentId,
      studentId: Number(student.id),
      feesTypeId,
      orderId,
      amount,
      amountPaise: Math.round(amount * 100),
      currency: cfg.currency || "INR",
      keyId: cfg.keyId,
      name: studentName,
      prefillEmail: student.email || undefined,
      description: `${master.feesTypeName || "Fee"} payment`,
    }
  }

  // Gateway not configured → record instantly (offline capture, legacy behaviour).
  const ins = await query(
    `INSERT INTO fees_payments (student_id, class_id, fees_group_id, fees_type_id, amount, paid_amount, payment_mode, payment_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'Online', $7, 'Paid')
     RETURNING id, payment_date AS "paymentDate", amount, paid_amount AS "paidAmount", payment_mode AS "paymentMode", status`,
    [student.id, student.class_id, master.feesGroupId, feesTypeId, amount, amount, today()]
  )
  return { mode: "offline", success: true, payment: ins.rows[0], ledger: await getFeeLedger(student) }
})