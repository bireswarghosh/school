import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "custom_fields"
const ORDER = "id DESC"

const fieldMap: Record<string, string> = {
  fieldName: "name",
  fieldType: "type",
  belongsTo: "belongs_to",
  required: "is_required",
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const items = id
    ? [await getById(TABLE, parseInt(id))].filter(Boolean)
    : await getAll(TABLE, ORDER)
  return NextResponse.json(mapResponse(items, fieldMap))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = camelToSnake(body, fieldMap)
    const item = await create(TABLE, data)
    return NextResponse.json(mapResponse(item, fieldMap), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const data = camelToSnake(rest, fieldMap)
    const item = await update(TABLE, id, data)
    return NextResponse.json(mapResponse(item, fieldMap), { status: item ? 200 : 404 })
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