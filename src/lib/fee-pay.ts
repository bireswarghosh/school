// Shared helpers for the online (Razorpay) student fee payment flow.
// Used by /api/my/fees/pay/order and /api/my/fees/pay/verify.
import { query } from "@/lib/db"
import {
  ApiError,
  requireStudent,
  assertParentHasStudent,
  getStudentById,
  type MyContext,
} from "@/lib/my-api"

export function today() {
  return new Date().toISOString().slice(0, 10)
}

// Resolve which student is being paid for.
// - student login: always the logged-in student (ignores studentId).
// - parent login: the studentId passed in body, which must be one of the parent's kids.
export async function resolvePayerStudent(ctx: MyContext, studentId?: number) {
  if (ctx.role === "student") {
    return requireStudent(ctx)
  }
  if (!studentId) throw new ApiError(400, "studentId is required for parent logins")
  const kid = await assertParentHasStudent(ctx, Number(studentId))
  const student = await getStudentById(Number(kid.id))
  if (!student) throw new ApiError(404, "Student not found")
  return student
}

export async function resolveActiveFeeMaster(student: any, feesTypeId: number) {
  const res = await query(
    `SELECT fm.id, fm.fees_group_id AS "feesGroupId", fm.amount,
       ft.name AS "feesTypeName", fg.name AS "feesGroupName"
     FROM fees_masters fm
     LEFT JOIN fees_types ft ON ft.id = fm.fees_type_id
     LEFT JOIN fees_groups fg ON fg.id = fm.fees_group_id
     WHERE fm.class_id = $1 AND fm.fees_type_id = $2 AND fm.status = 'Active'
     ORDER BY fm.id LIMIT 1`,
    [student.class_id, Number(feesTypeId)]
  )
  const master = res.rows[0]
  if (!master) {
    throw new ApiError(404, "No active fee master found for this student and fee type")
  }
  return master
}

// Money actually paid against one fee type (rows recorded as Paid/Success only).
export async function paidForType(studentId: number, feesTypeId: number): Promise<number> {
  const res = await query(
    `SELECT COALESCE(SUM(COALESCE(fp.paid_amount, fp.amount, 0)), 0) AS paid
     FROM fees_payments fp
     WHERE fp.student_id = $1 AND fp.fees_type_id = $2 AND LOWER(fp.status) IN ('paid', 'success')`,
    [studentId, Number(feesTypeId)]
  )
  return Number(res.rows[0]?.paid || 0)
}

// Full fee ledger for a student — same shape as GET /api/my/student/fees.
export async function getFeeLedger(student: any) {
  const mastersRes = await query(
    `SELECT fm.id, fm.amount, fm.due_date AS "dueDate", fm.status,
       ft.name AS "feesType", ft.id AS "feesTypeId", fg.name AS "feesGroup", fg.id AS "feesGroupId"
     FROM fees_masters fm
     LEFT JOIN fees_types ft ON ft.id = fm.fees_type_id
     LEFT JOIN fees_groups fg ON fg.id = fm.fees_group_id
     WHERE fm.class_id = $1 AND fm.status = 'Active'
     ORDER BY fm.id`,
    [student.class_id]
  )

  const paidRes = await query(
    `SELECT fp.id, fp.fees_type_id AS "feesTypeId", fp.amount, fp.discount_amount AS "discountAmount",
       fp.fine_amount AS "fineAmount", fp.paid_amount AS "paidAmount", fp.payment_mode AS "paymentMode",
       fp.payment_method AS "paymentMethod", fp.transaction_id AS "transactionId",
       fp.payment_date AS "paymentDate", fp.status, fp.created_at AS "createdAt"
     FROM fees_payments fp
     WHERE fp.student_id = $1 AND LOWER(fp.status) IN ('paid', 'success')
     ORDER BY fp.payment_date DESC`,
    [student.id]
  )

  const byType = new Map<number, { paid: number; paidAt: string | null; last: any }>()
  for (const p of paidRes.rows) {
    const key = Number(p.feesTypeId)
    const cur = byType.get(key) || { paid: 0, paidAt: null, last: null }
    cur.paid += Number(p.paidAmount || p.amount || 0)
    if (p.paymentDate && (!cur.paidAt || p.paymentDate > cur.paidAt)) cur.paidAt = p.paymentDate
    cur.last = p
    byType.set(key, cur)
  }

  // Deduplicate masters by feesTypeId — if same fee type appears multiple times for a class (duplicate master), keep one entry with its amount (don't sum duplicates)
  const byFeesType = new Map<number, { masters: any[]; first: any }>()
  for (const m of mastersRes.rows as any[]) {
    const key = Number(m.feesTypeId)
    const cur = byFeesType.get(key)
    if (cur) {
      cur.masters.push(m)
    } else {
      byFeesType.set(key, { masters: [m], first: m })
    }
  }
  const dues = Array.from(byFeesType.values()).map(({ masters, first }) => {
    const m = first
    const paid = byType.get(Number(m.feesTypeId))
    const paidAmount = paid ? paid.paid : 0
    const amount = Number(m.amount)
    return {
      masterId: Number(m.id),
      feesTypeId: Number(m.feesTypeId),
      feesGroupId: Number(m.feesGroupId) || null,
      feesType: m.feesType,
      feesGroup: m.feesGroup,
      amount,
      paidAmount,
      balance: Math.max(0, amount - paidAmount),
      dueDate: m.dueDate,
      paidOn: paid?.paidAt || null,
      masterIds: masters.map((x: any) => Number(x.id)),
    }
  })

  const totalDue = dues.reduce((sum, d) => sum + d.balance, 0)
  const totalPaid = paidRes.rows.reduce((sum: number, p: any) => sum + Number(p.paidAmount || p.amount || 0), 0)

  return {
    studentId: Number(student.id),
    summary: { totalDue, totalPaid, pendingCount: dues.filter((d) => d.balance > 0).length },
    dues,
    payments: paidRes.rows,
  }
}