import { NextRequest, NextResponse } from "next/server"
import { query, create, update, remove } from "@/lib/db"
import { camelToSnake, snakeToCamel } from "@/lib/field-mapping"


function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "hostel_rooms"
const ORDER = "id DESC"

const LIST_SQL = `SELECT r.*, t.name AS room_type FROM hostel_rooms r LEFT JOIN room_types t ON t.id = r.room_type_id`

async function loadList(where?: string, whereParams?: unknown[]) {
  const sql = where ? `${LIST_SQL} WHERE ${where} ORDER BY r.id DESC` : `${LIST_SQL} ORDER BY r.id DESC`
  const result = await query(sql, (whereParams || []) as any[])
  return result.rows.map((r) => snakeToCamel(r))
}

async function resolveRoomTypeId(name: string): Promise<number> {
  const found = (await query(`SELECT id FROM room_types WHERE name = $1 LIMIT 1`, [name])).rows[0]
  if (found?.id) return Number(found.id)
  const created = await create<any>("room_types", { name })
  return Number(created.id)
}

async function toDb(item: Record<string, any>) {
  const mapped = camelToSnake(item, { roomType: "room_type_id" })
  if (item.roomType) {
    mapped.room_type_id = await resolveRoomTypeId(String(item.roomType))
  }
  delete mapped.id
  return mapped
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const items = await loadList("r.id = $1", [parseInt(id, 10)])
    return NextResponse.json(items[0] || { error: "Not found" }, { status: items[0] ? 200 : 404 })
  }
  return NextResponse.json(await loadList())
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (Array.isArray(body)) {
      const created = []
      for (const item of body) {
        created.push(await create(TABLE, await toDb(item)))
      }
      return NextResponse.json(created.map((c) => snakeToCamel(c)), { status: 201 })
    }
    const item = await create(TABLE, await toDb(body))
    return NextResponse.json(snakeToCamel(item), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const item = await update(TABLE, parseInt(id), await toDb(data))
    return NextResponse.json(item ? snakeToCamel(item) : { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get("ids")
  const id = parseInt(searchParams.get("id") || "0")
  if (idsParam) {
    const ids = idsParam
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0)
    if (ids.length === 0) return NextResponse.json({ error: "ids required" }, { status: 400 })
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ")
    await query(`DELETE FROM hostel_rooms WHERE id IN (${placeholders})`, ids)
    return NextResponse.json({ success: true, deleted: ids.length })
  }
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await remove(TABLE, id)
  return NextResponse.json({ success: true })
}