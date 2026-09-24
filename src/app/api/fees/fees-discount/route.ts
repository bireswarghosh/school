import { NextRequest, NextResponse } from "next/server"
import { query, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"
import { getCurrentSession } from "@/lib/auth"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "fees_discounts"
const fieldMap: Record<string, string> = {
  discountCode: "code",
  discountType: "type",
  expiryDate: "expiry_date",
  maxDiscount: "max_discount",
  applyOn: "apply_on",
  isActive: "is_active",
  feesGroup: "fees_group_id",
  feesType: "fees_type_id",
  studentId: "student_id",
  discountTypeKind: "discount_type",
  approvedBy: "approved_by",
  approvedAt: "approved_at",
}

function esc(val: string) {
  return val.replace(/'/g, "''")
}

function mapBody(body: Record<string, any>) {
  const mapped = camelToSnake(body, fieldMap)
  const data: Record<string, any> = {}
  for (const [key, value] of Object.entries(mapped)) {
    if (key === "id") continue
    if ((key === "fees_group_id" || key === "fees_type_id" || key === "class_id") && value && typeof value === "string" && isNaN(Number(value))) {
      const tbl = key === "fees_group_id" ? "fees_groups" : key === "fees_type_id" ? "fees_types" : "classes"
      data[key] = `(SELECT id FROM ${tbl} WHERE name = '${esc(value)}')`
    } else {
      data[key] = value === "" ? null : value ?? null
    }
  }
  return data
}

async function fetchUsage(ids: number[]): Promise<Map<number, any>> {
  const map = new Map<number, any>()
  if (ids.length === 0) return map
  const result = await query(
    `SELECT
       fp.discount_id AS "discountId",
       fp.id AS "feePaymentId",
       i.invoice_no AS "invoiceNo",
       i.date AS "incomeDate",
       ft.name AS "feeTypeName",
       fg.name AS "groupName",
       fp.amount AS "amount",
       fp.discount_amount AS "discountAmount",
       fp.paid_amount AS "paidAmount",
       fp.payment_date AS "paymentDate",
       fp.payment_mode AS "paymentMode",
       fp.status AS "paymentStatus"
     FROM fees_payments fp
     LEFT JOIN incomes i ON i.fee_payment_id = fp.id
     LEFT JOIN fees_types ft ON ft.id = fp.fees_type_id
     LEFT JOIN fees_groups fg ON fg.id = fp.fees_group_id
     WHERE fp.discount_id = ANY($1) AND fp.discount_amount > 0
     ORDER BY fp.payment_date DESC, fp.id DESC`,
    [ids] as any
  )
  // Aggregate usage per payment (date + invoice) so a Fix discount shows as ONE
  // full amount applied on the total selected fees, not one row per fee item.
  for (const row of result.rows) {
    const did = Number(row.discountId)
    const entry = map.get(did)
    const key = `${row.paymentDate || row.incomeDate || ""}|${row.invoiceNo || ""}|${row.paymentMode || ""}`
    if (!entry) {
      map.set(did, { used: true, usedAt: row.paymentDate || row.incomeDate || null, usageCount: 0, usage: [], byPayment: new Map() })
    }
    const cur = map.get(did)
    cur.usageCount += 1
    const group = cur.byPayment.get(key)
    if (!group) {
      cur.byPayment.set(key, {
        paymentDate: row.paymentDate || row.incomeDate || null,
        invoiceNo: row.invoiceNo || null,
        paymentMode: row.paymentMode || null,
        feeCount: 0,
        discountAmount: 0,
        paidAmount: 0,
      })
    }
    const g = cur.byPayment.get(key)
    g.feeCount += 1
    g.discountAmount = round2(g.discountAmount + Number(row.discountAmount || 0))
    g.paidAmount = round2(g.paidAmount + Number(row.paidAmount || 0))
    cur.usage.push(row)
  }
  for (const cur of map.values()) {
    cur.payments = Array.from(cur.byPayment.values())
    delete cur.byPayment
  }
  return map
}

const round2 = (n: number) => Math.round(n * 100) / 100

const usageFor = (u: any) =>
  u && u.used
    ? { used: true, usedAt: u.usedAt, usageCount: u.usageCount, usage: u.usage, payments: u.payments || [] }
    : { used: false, usedAt: null, usageCount: 0, usage: [], payments: [] }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const studentId = searchParams.get("studentId")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    const base = mapResponse(item, fieldMap) as any || null
    if (!base) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const usage = await fetchUsage([Number(base.id)])
    return NextResponse.json({ ...base, ...usageFor(usage.get(Number(base.id))) }, { status: 200 })
  }
  const where = studentId ? `WHERE fd.student_id = ${parseInt(studentId, 10)}` : ""
  const result = await query(`
    SELECT fd.*,
      s.first_name AS "firstName", s.middle_name AS "middleName", s.last_name AS "lastName",
      s.admission_no AS "admissionNo", s.roll_no AS "rollNo"
    FROM ${TABLE} fd
    LEFT JOIN students s ON s.id = fd.student_id
    ${where}
    ORDER BY fd.id DESC
  `)
  const rows = (mapResponse(result.rows, fieldMap) as any[]) || []
  const ids = rows.map((r: any) => Number(r.id))
  const usageMap = await fetchUsage(ids)
  const enriched = rows.map((r: any) => ({ ...r, ...usageFor(usageMap.get(Number(r.id))) }))
  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const session = await getCurrentSession()
    const approvedBy = session?.name || null
    const approvedAt = new Date().toISOString()
    if (Array.isArray(body)) {
      const items = await Promise.all(body.map((item) => create(TABLE, mapBody({ ...item, approvedBy, approvedAt }))))
      return NextResponse.json(items, { status: 201 })
    }
    const item = await create(TABLE, mapBody({ ...body, approvedBy, approvedAt }))
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const item = await update(TABLE, id, mapBody(data))
    return NextResponse.json(mapResponse(item, fieldMap) || { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await remove(TABLE, id)
  return NextResponse.json({ success: true })
}
