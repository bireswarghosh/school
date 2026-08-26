import { NextRequest } from "next/server"
import { handle, requireRole, assertParentHasStudent, ApiError, getStudentById } from "@/lib/my-api"
import { query } from "@/lib/db"

function today() {
  return new Date().toISOString().slice(0, 10)
}

export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["parent"])
  const body = await req.json()
  const { studentId, feesTypeId, amount, paymentMode = "Online" } = body || {}
  if (!studentId) throw new ApiError(400, "studentId is required")
  if (!feesTypeId) throw new ApiError(400, "feesTypeId is required")
  if (!amount || Number(amount) <= 0) throw new ApiError(400, "amount is required (positive number)")

  await assertParentHasStudent(ctx, Number(studentId))
  const student = await getStudentById(Number(studentId))

  const master = (
    await query(
      `SELECT fm.id, fm.fees_group_id AS "feesGroupId", fm.amount
       FROM fees_masters fm
       WHERE fm.class_id = $1 AND fm.fees_type_id = $2 AND fm.status = 'Active'
       ORDER BY fm.id LIMIT 1`,
      [student.class_id, Number(feesTypeId)]
    )
  ).rows[0]

  if (!master) {
    throw new ApiError(404, "No active fee master found for this student and fee type")
  }

  const res = await query(
    `INSERT INTO fees_payments (student_id, class_id, fees_group_id, fees_type_id, amount, paid_amount, payment_mode, payment_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Paid')
     RETURNING id, payment_date AS "paymentDate", amount, paid_amount AS "paidAmount", payment_mode AS "paymentMode", status`,
    [
      Number(studentId),
      student.class_id,
      master.feesGroupId,
      Number(feesTypeId),
      Number(amount),
      Number(amount),
      String(paymentMode),
      today(),
    ]
  )

  return { success: true, payment: res.rows[0] }
})
