import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"


function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "currencies"
const ORDER = "id DESC"

// Custom field map for non-standard mappings
const fieldMap = {
  isActive: "is_active",
  isDefault: "is_default",
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(mapResponse(item, fieldMap) || { error: "Not found" }, { status: item ? 200 : 404 })
  }
  const items = await getAll(TABLE, ORDER)
  return NextResponse.json(mapResponse(items, fieldMap))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // If no currencies exist, make the first one default
    const existing = await getAll(TABLE, "id ASC")
    const mapped = camelToSnake(body, fieldMap)
    if (existing.length === 0) {
      mapped.is_default = true
    }
    const item = await create(TABLE, mapped)
    return NextResponse.json(mapResponse(item, fieldMap), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    // If setting as default, unset all others first
    if (data.isDefault === true) {
      await query("UPDATE currencies SET is_default = false WHERE is_default = true")
    }
    const mapped = camelToSnake(data, fieldMap)
    const item = await update(TABLE, id, mapped)
    return NextResponse.json(mapResponse(item, fieldMap) || { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const item = await getById<Record<string, any>>(TABLE, id)
  await remove(TABLE, id)
  // If deleted currency was default, set the next available as default
  if (item?.is_default) {
    const remaining = await getAll<Record<string, any>>(TABLE, "id ASC")
    if (remaining.length > 0) {
      const nextId = remaining[0].id
      await query("UPDATE currencies SET is_default = true WHERE id = $1", [nextId])
    }
  }
  return NextResponse.json({ success: true })
}