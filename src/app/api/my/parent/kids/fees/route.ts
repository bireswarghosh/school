import { NextRequest } from "next/server"
import { handle, requireRole, assertParentHasStudent, ApiError, getStudentById } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["parent"])
  const { searchParams } = new URL(req.url)
  const studentId = parseInt(searchParams.get("studentId") || searchParams.get("student_id") || "0", 10)
  if (!studentId) throw new ApiError(400, "studentId is required")
  await assertParentHasStudent(ctx, studentId)
  const student = await getStudentById(studentId)

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

  const paymentRes = await query(
    `SELECT fp.id, fp.fees_type_id AS "feesTypeId", fp.amount, fp.discount_amount AS "discountAmount",
       fp.fine_amount AS "fineAmount", fp.paid_amount AS "paidAmount", fp.payment_mode AS "paymentMode",
       fp.payment_method AS "paymentMethod", fp.transaction_id AS "transactionId", fp.payment_date AS "paymentDate", fp.status, fp.created_at AS "createdAt"
     FROM fees_payments fp
     WHERE fp.student_id = $1
     ORDER BY fp.payment_date DESC NULLS LAST, fp.id DESC`,
    [studentId]
  )
  const statusL = (s: any) => String(s || "").toLowerCase()
  const paidRows = paymentRes.rows.filter((p: any) => ["paid", "success"].includes(statusL(p.status)))
  const pendingRows = paymentRes.rows.filter((p: any) => statusL(p.status) === "pending")

  const byType = new Map<number, { paid: number; paidAt: string | null }>()
  for (const p of paidRows) {
    const key = Number(p.feesTypeId)
    const cur = byType.get(key) || { paid: 0, paidAt: null }
    cur.paid += Number(p.paidAmount || p.amount || 0)
    if (p.paymentDate && (!cur.paidAt || p.paymentDate > cur.paidAt)) cur.paidAt = p.paymentDate
    byType.set(key, cur)
  }

  const dues = (mastersRes.rows as any[]).map((m) => {
    const paid = byType.get(Number(m.feesTypeId))
    const paidAmount = paid ? paid.paid : 0
    return {
      masterId: Number(m.id),
      feesTypeId: Number(m.feesTypeId),
      feesGroupId: Number(m.feesGroupId) || null,
      feesType: m.feesType,
      feesGroup: m.feesGroup,
      amount: Number(m.amount),
      paidAmount,
      balance: Math.max(0, Number(m.amount) - paidAmount),
      dueDate: m.dueDate,
      paidOn: paid?.paidAt || null,
    }
  })

  return {
    studentId,
    student,
    summary: {
      totalDue: dues.reduce((s, d) => s + d.balance, 0),
      totalPaid: paidRows.reduce((s: number, p: any) => s + Number(p.paidAmount || p.amount || 0), 0),
      pendingCount: dues.filter((d) => d.balance > 0).length,
    },
    dues,
    payments: [...pendingRows, ...paidRows],
  }
})
