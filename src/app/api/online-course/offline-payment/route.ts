import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "offline_payments"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await query(
      `SELECT p.*, c.name AS course_name FROM offline_payments p LEFT JOIN courses c ON c.id = p.course_id WHERE p.id = $1`,
      [parseInt(id)]
    )
    return NextResponse.json(item.rows[0] || { error: "Not found" }, { status: item.rows[0] ? 200 : 404 })
  }
  const result = await query(
    `SELECT p.*, c.name AS course_name FROM offline_payments p LEFT JOIN courses c ON c.id = p.course_id ORDER BY p.id DESC`
  )
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const item = await create(TABLE, body)
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const item = await update(TABLE, id, data)
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e) {
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
