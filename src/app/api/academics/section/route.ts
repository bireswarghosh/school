import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"


function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

async function sectionNameExists(name: string, excludeId?: number): Promise<boolean> {
  const result = await query(`SELECT id FROM sections WHERE LOWER(name) = LOWER($1)`, [name.trim()])
  const rows = result.rows as { id: number | string }[]
  if (rows.length === 0) return false
  if (excludeId === undefined) return true
  return rows.some((r) => Number(r.id) !== excludeId)
}

const TABLE = "sections"
const ORDER = "id ASC"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById(TABLE, parseInt(id))
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
  }
  const classId = searchParams.get("class_id")
  if (classId) {
    const result = await query("SELECT id, class_id, name FROM sections WHERE class_id = $1 ORDER BY name", [parseInt(classId)])
    return NextResponse.json(result.rows)
  }
  const items = await getAll(TABLE, ORDER)
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body.name || body.section || "").trim()
    if (!name) return NextResponse.json({ error: "Section name required" }, { status: 400 })
    if (await sectionNameExists(name)) {
      return NextResponse.json({ error: `Section "${name}" already exists` }, { status: 409 })
    }
    let class_id: number | null = null
    if (body.class_id !== undefined && body.class_id !== null && body.class_id !== "") {
      const n = Number(body.class_id)
      class_id = Number.isFinite(n) ? n : null
    }
    const item = await create(TABLE, { name, class_id })
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
    if (data.name) {
      const name = String(data.name).trim()
      if (await sectionNameExists(name, Number(id))) {
        return NextResponse.json({ error: `Section "${name}" already exists` }, { status: 409 })
      }
    }
    const item = await update(TABLE, id, data)
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
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
