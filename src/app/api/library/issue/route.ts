import { NextRequest, NextResponse } from "next/server"
import { query, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

const TABLE = "book_issues"
const ORDER = "bi.id DESC"

const fieldMap: Record<string, string> = {
  bookName: "book_name",
  bookNumber: "book_number",
  memberName: "member_name",
  memberType: "member_type",
  memberId: "member_id",
  issueDate: "issue_date",
  returnDate: "return_date",
}

async function getJoined(id: number) {
  const result = await query(
    `SELECT bi.*, b.name AS book_name, b.book_number FROM book_issues bi LEFT JOIN books b ON bi.book_id = b.id WHERE bi.id = $1 LIMIT 1`,
    [id]
  )
  return result.rows[0] || null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(mapResponse(item, fieldMap) || { error: "Not found" }, { status: item ? 200 : 404 })
  }
  const result = await query(
    `SELECT bi.*, b.name AS book_name, b.book_number FROM book_issues bi LEFT JOIN books b ON bi.book_id = b.id ORDER BY ${ORDER}`
  )
  return NextResponse.json(mapResponse(result.rows, fieldMap))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = camelToSnake(body, fieldMap)
    delete data.book_name
    delete data.book_number
    const item = await create(TABLE, data)
    const joined = await getJoined(item.id)
    return NextResponse.json(mapResponse(joined || item, fieldMap), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const data = camelToSnake(rest, fieldMap)
    delete data.book_name
    delete data.book_number
    const item = await update(TABLE, id, data)
    const joined = item ? await getJoined(id) : null
    return NextResponse.json(mapResponse(joined || item, fieldMap) || { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await remove(TABLE, id)
  return NextResponse.json({ success: true })
}
