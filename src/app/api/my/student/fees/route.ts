import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)

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
    [student.id]
  )
  const statusL = (s: any) => String(s || "").toLowerCase()
  const paidRows = paymentRes.rows.filter((p: any) => ["paid", "success"].includes(statusL(p.status)))
  const pendingRows = paymentRes.rows.filter((p: any) => statusL(p.status) === "pending")

  const byType = new Map<number, { paid: number; paidAt: string | null; last: any }>()
  for (const p of paidRows) {
    const key = Number(p.feesTypeId)
    const cur = byType.get(key) || { paid: 0, paidAt: null, last: null }
    cur.paid += Number(p.paidAmount || p.amount || 0)
    if (p.paymentDate && (!cur.paidAt || p.paymentDate > cur.paidAt)) cur.paidAt = p.paymentDate
    cur.last = p
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

  const totalDue = dues.reduce((sum, d) => sum + d.balance, 0)
  const totalPaid = paidRows.reduce((sum: number, p: any) => sum + Number(p.paidAmount || p.amount || 0), 0)

  return {
    studentId: Number(student.id),
    summary: { totalDue, totalPaid, pendingCount: dues.filter((d) => d.balance > 0).length },
    dues,
    payments: [...pendingRows, ...paidRows],
  }
})
