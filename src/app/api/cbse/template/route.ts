import { NextRequest, NextResponse } from "next/server"
import { query, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

const TABLE = "cbse_templates"
const ORDER = "id DESC"
const fieldMap: Record<string, string> = {
  isDefault: "is_default",
}

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function jsonb(val: unknown): unknown {
  if (val && typeof val === "object" && !Array.isArray(val)) return val
  if (Array.isArray(val)) return JSON.stringify(val)
  return val
}

function parseRow(row: any) {
  if (!row) return row
  if (typeof row.fields === "string") try { row.fields = JSON.parse(row.fields) } catch { row.fields = [] }
  return row
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const { rows } = await query(`SELECT * FROM ${TABLE} WHERE id = $1`, [parseInt(id)])
    const item = parseRow(rows[0])
    return NextResponse.json(item ? mapResponse(item, fieldMap) : { error: "Not found" }, { status: item ? 200 : 404 })
  }
  const { rows } = await query(`SELECT * FROM ${TABLE} ORDER BY ${ORDER}`)
  return NextResponse.json(mapResponse(rows.map(parseRow), fieldMap))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = camelToSnake(body, fieldMap)
    if (data.fields) data.fields = jsonb(data.fields)
    const item = parseRow(await create(TABLE, data))
    return NextResponse.json(mapResponse(item, fieldMap), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const data = camelToSnake(rest, fieldMap)
    if (data.fields) data.fields = jsonb(data.fields)
    const item = parseRow(await update(TABLE, id, data))
    return NextResponse.json(mapResponse(item, fieldMap), { status: item ? 200 : 404 })
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
