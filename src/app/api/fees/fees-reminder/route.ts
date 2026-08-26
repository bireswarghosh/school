import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "fees_reminders"
const ORDER = "id ASC"

function toCamel(row: any) {
  if (!row) return row
  return {
    id: row.id,
    type: row.reminder_type,
    days: row.day_via,
    isActive: row.is_active,
    message: row.message,
  }
}

function toSnake(body: any) {
  const data: any = {}
  if (body.type !== undefined) data.reminder_type = body.type
  if (body.days !== undefined) data.day_via = body.days
  if (body.isActive !== undefined) data.is_active = body.isActive
  if (body.message !== undefined) data.message = body.message
  return data
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  try {
    if (id) {
      const item = await getById(TABLE, parseInt(id))
      return NextResponse.json(toCamel(item) || { error: "Not found" }, { status: item ? 200 : 404 })
    }
    const items = await getAll(TABLE, ORDER)
    return NextResponse.json(items.map(toCamel))
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (Array.isArray(body)) {
      const items = await Promise.all(body.map((item) => create(TABLE, toSnake(item))))
      return NextResponse.json(items.map(toCamel), { status: 201 })
    }
    const item = await create(TABLE, toSnake(body))
    return NextResponse.json(toCamel(item), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const item = await update(TABLE, id, toSnake(data))
    return NextResponse.json(toCamel(item) || { error: "Not found" }, { status: item ? 200 : 404 })
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
