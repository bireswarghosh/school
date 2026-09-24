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

function statusKey(v: any): string {
  return String(v || "").toLowerCase()
}

const PAID_STATUSES = new Set(["paid", "success"])

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// Aggregate a student's fees_payments rows into per-fee-type dues.
//
// fees_payments is the per-student fee ledger: the school assigns a fee head by
// inserting an 'Unpaid' row (amount = the assigned amount). Paid rows are either
// the same row updated in place (admin cash collection) or a separate row created
// by the online pay flow (order → verify). To avoid double counting we treat a
// Paid/Success row as a payment that only covers its own amount - paid_amount
// (usually zero), while Unpaid/Partial rows are the "assignment" that defines the
// amount still owed. Pending rows are in-flight payments and add nothing yet.
export function buildFeeDues(rows: any[], dueByType?: Map<number, string | null>) {
  const byType = new Map<number, any[]>()
  for (const r of rows) {
    const key = Number(r.feesTypeId)
    if (!byType.has(key)) byType.set(key, [])
    byType.get(key)!.push(r)
  }

  const dues: any[] = []
  for (const [feesTypeId, typeRows] of byType) {
    const first = typeRows[0]
    let amount = 0
    let discount = 0
    let paid = 0
    let paidAt: string | null = null
    for (const r of typeRows) {
      const st = statusKey(r.status)
      const amt = Number(r.amount || 0)
      const paidAmt = Number(r.paidAmount || 0)
      if (PAID_STATUSES.has(st)) {
        amount += Math.max(0, amt - paidAmt)
        paid += paidAmt
        if (r.paymentDate && (!paidAt || r.paymentDate > paidAt)) paidAt = r.paymentDate
      } else if (st === "pending") {
        amount += Math.max(0, amt - paidAmt)
      } else {
        amount += amt
        discount += Number(r.discountAmount || 0)
        paid += paidAmt
        if (st === "partial" && r.paymentDate && (!paidAt || r.paymentDate > paidAt)) paidAt = r.paymentDate
      }
    }
    const gross = amount
    // A head fully paid in place has no unpaid rows left — show the paid amount as its gross for display.
    if (gross === 0 && paid > 0) amount = paid
    dues.push({
      feesTypeId,
      feesGroupId: first.feesGroupId != null ? Number(first.feesGroupId) : null,
      feesType: first.feesType || null,
      feesGroup: first.feesGroup || null,
      amount: round2(amount),
      paidAmount: round2(paid),
      balance: round2(Math.max(0, gross - discount - paid)),
      dueDate: dueByType?.get(feesTypeId) ?? null,
      paidOn: paidAt,
    })
  }

  dues.sort(
    (a, b) =>
      (Number(a.balance) > 0 ? 0 : 1) - (Number(b.balance) > 0 ? 0 : 1) ||
      a.feesTypeId - b.feesTypeId
  )
  return dues
}

// Totals (gross / paid / balance) for a set of a student's fees_payments rows.
export function summarizeFeeRows(rows: any[]) {
  const dues = buildFeeDues(rows)
  return {
    gross: round2(dues.reduce((s, d) => s + Number(d.amount), 0)),
    paid: round2(dues.reduce((s, d) => s + Number(d.paidAmount), 0)),
    balance: round2(dues.reduce((s, d) => s + Number(d.balance), 0)),
    pending: dues.filter((d) => Number(d.balance) > 0).length,
  }
}

export interface FeeLedgerRow {
  id: number
  feesTypeId: number
  feesType: string | null
  amount: number
  discountAmount: number
  fineAmount: number
  paidAmount: number
  paymentMode: string | null
  paymentMethod: string | null
  transactionId: string | null
  paymentDate: string | null
  status: string | null
  createdAt: string | null
}

// Full fee ledger for a student — same shape as GET /api/my/student/fees.
// Dues come from fees_payments (the fees actually assigned to this student),
// matching the admin student profile. Class-level fees_masters are only used to
// resolve the due date for display.
export async function getFeeLedger(student: any) {
  const ledgerRes = await query(
    `SELECT fp.id, fp.fees_type_id AS "feesTypeId", fp.fees_group_id AS "feesGroupId",
       fp.amount, fp.discount_amount AS "discountAmount", fp.fine_amount AS "fineAmount",
       fp.paid_amount AS "paidAmount", fp.payment_mode AS "paymentMode",
       fp.payment_method AS "paymentMethod", fp.transaction_id AS "transactionId",
       fp.payment_date AS "paymentDate", fp.status, fp.created_at AS "createdAt",
       ft.name AS "feesType", fg.name AS "feesGroup"
     FROM fees_payments fp
     LEFT JOIN fees_types ft ON ft.id = fp.fees_type_id
     LEFT JOIN fees_groups fg ON fg.id = fp.fees_group_id
     WHERE fp.student_id = $1
     ORDER BY fp.id`,
    [student.id]
  )
  const rows = ledgerRes.rows as any[]

  const dueRes = await query(
    `SELECT fm.fees_type_id AS "feesTypeId", fm.due_date AS "dueDate"
     FROM fees_masters fm
     WHERE fm.class_id = $1 AND fm.status = 'Active'
     ORDER BY fm.id`,
    [student.class_id]
  )
  const dueByType = new Map<number, string | null>()
  for (const m of dueRes.rows) dueByType.set(Number(m.feesTypeId), m.dueDate ?? null)

  const dues = buildFeeDues(rows, dueByType)
  const totalDue = dues.reduce((sum, d) => sum + Number(d.balance), 0)
  const totalPaid = round2(
    rows
      .filter((r) => PAID_STATUSES.has(statusKey(r.status)))
      .reduce((sum: number, p: any) => sum + Number(p.paidAmount || p.amount || 0), 0)
  )

  const payments: FeeLedgerRow[] = rows
    .filter((r) => {
      const st = statusKey(r.status)
      return st === "pending" || PAID_STATUSES.has(st)
    })
    .sort((a, b) => (b.paymentDate || "").localeCompare(a.paymentDate || "") || Number(b.id) - Number(a.id))
    .map((r) => ({
      id: Number(r.id),
      feesTypeId: Number(r.feesTypeId),
      feesType: r.feesType || null,
      amount: Number(r.amount || 0),
      discountAmount: Number(r.discountAmount || 0),
      fineAmount: Number(r.fineAmount || 0),
      paidAmount: Number(r.paidAmount || 0),
      paymentMode: r.paymentMode,
      paymentMethod: r.paymentMethod,
      transactionId: r.transactionId,
      paymentDate: r.paymentDate,
      status: r.status,
      createdAt: r.createdAt,
    }))

  return {
    studentId: Number(student.id),
    summary: { totalDue, totalPaid, pendingCount: dues.filter((d) => Number(d.balance) > 0).length },
    dues,
    payments,
  }
}