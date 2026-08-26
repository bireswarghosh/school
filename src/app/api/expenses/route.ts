import { NextRequest, NextResponse } from "next/server"
import { query, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

const fieldMap: Record<string, string> = {
  expenseHeadId: "expense_head_id",
  invoiceNo: "invoice_no",
  paymentMode: "payment_mode",
  expenseHead: "expense_head",
}

const SELECT = `
  SELECT e.*, h.name AS expense_head
  FROM expenses e
  LEFT JOIN expense_heads h ON h.id = e.expense_head_id
`

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (id) {
      const result = await query(`${SELECT} WHERE e.id = $1`, [parseInt(id)])
      const item = result.rows[0] || null
      return NextResponse.json(item ? mapResponse(item, fieldMap) : { error: "Not found" }, { status: item ? 200 : 404 })
    }
    const result = await query(`${SELECT} ORDER BY e.id DESC`)
    return NextResponse.json(mapResponse(result.rows, fieldMap))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = camelToSnake(body, fieldMap)
    delete data.expense_head
    const item = await create("expenses", data)
    const full = await query(`${SELECT} WHERE e.id = $1`, [item.id])
    return NextResponse.json(mapResponse(full.rows[0], fieldMap), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const data = camelToSnake(rest, fieldMap)
    delete data.expense_head
    const item = await update("expenses", id, data)
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const full = await query(`${SELECT} WHERE e.id = $1`, [id])
    return NextResponse.json(mapResponse(full.rows[0], fieldMap))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    await remove("expenses", id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
