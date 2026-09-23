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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const studentId = searchParams.get("studentId")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(mapResponse(item, fieldMap) || { error: "Not found" }, { status: item ? 200 : 404 })
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
  return NextResponse.json(mapResponse(result.rows, fieldMap))
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
