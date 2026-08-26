import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "fees_payments"
const ORDER = "id DESC"
const fieldMap: Record<string, string> = {
  studentId: "student_id",
  feesGroup: "fees_group_id",
  feesType: "fees_type_id",
  paidAmount: "paid_amount",
  paymentMode: "payment_mode",
  paymentDate: "payment_date",
  discountAmount: "discount_amount",
  fineAmount: "fine_amount",
  transactionId: "transaction_id",
  bankName: "bank_name",
  chequeNo: "cheque_no",
}

function esc(val: string) {
  return val.replace(/'/g, "''")
}

function mapBody(body: Record<string, any>) {
  const mapped = camelToSnake(body, fieldMap)
  const data: Record<string, any> = {}
  for (const [key, value] of Object.entries(mapped)) {
    if (key === "id") continue
    if ((key === "student_id" || key === "class_id" || key === "fees_group_id" || key === "fees_type_id" || key === "discount_id") && value && typeof value === "string" && isNaN(Number(value))) {
      const tbl = key === "student_id" ? "students" : key === "class_id" ? "classes" : key === "fees_group_id" ? "fees_groups" : key === "fees_type_id" ? "fees_types" : "fees_discounts"
      const nameCol = key === "student_id" ? "CONCAT(first_name, ' ', last_name)" : "name"
      data[key] = `(SELECT id FROM ${tbl} WHERE ${nameCol} = '${esc(value)}' LIMIT 1)`
    } else {
      data[key] = value ?? null
    }
  }
  return data
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const studentId = searchParams.get("studentId")
  try {
    if (id) {
      const item = await getById(TABLE, parseInt(id))
      return NextResponse.json(mapResponse(item, fieldMap) || { error: "Not found" }, { status: item ? 200 : 404 })
    }
    if (studentId) {
      const items = await getAll(TABLE, ORDER, "student_id = $1", [parseInt(studentId)])
      return NextResponse.json(mapResponse(items, fieldMap))
    }
    const items = await getAll(TABLE, ORDER)
    return NextResponse.json(mapResponse(items, fieldMap))
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (Array.isArray(body)) {
      const results = await Promise.all(body.map((item) => create(TABLE, mapBody(item))))
      return NextResponse.json(results, { status: 201 })
    }
    const item = await create(TABLE, mapBody(body))
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
