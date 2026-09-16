import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"
import { getSessionSchoolId } from "@/lib/auth"


function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "leave_types"
const ORDER = "id DESC"
const fieldMap: Record<string, string> = {
  maxDays: "max_days",
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const schoolId = getSessionSchoolId(req)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById(TABLE, parseInt(id), schoolId ?? undefined)
    return NextResponse.json(item ? mapResponse(item as any, fieldMap) : { error: "Not found" }, { status: item ? 200 : 404 })
  }
  const items = await getAll(TABLE, ORDER, undefined, undefined, schoolId ?? undefined)
  return NextResponse.json(mapResponse(items as any, fieldMap))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const schoolId = getSessionSchoolId(req)
    const snake = camelToSnake(body, fieldMap)
    if (snake.max_days !== undefined) {
      const n = parseInt(String(snake.max_days), 10)
      snake.max_days = Number.isNaN(n) || n <= 0 ? null : n
    }
    if (!snake.name || !String(snake.name).trim()) {
      return NextResponse.json({ error: "Leave type name is required" }, { status: 400 })
    }
    if (snake.max_days === null || snake.max_days === undefined) {
      return NextResponse.json({ error: "Valid max days is required" }, { status: 400 })
    }
    // unique per school
    const existing = await query(`SELECT id FROM leave_types WHERE lower(name)=lower($1) AND school_id = $2 LIMIT 1`, [String(snake.name).trim(), schoolId])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: `Leave type "${String(snake.name).trim()}" already exists` }, { status: 400 })
    }
    const item = await create(TABLE, { name: String(snake.name).trim(), max_days: snake.max_days } as any, schoolId ?? undefined)
    return NextResponse.json(mapResponse(item as any, fieldMap), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const schoolId = getSessionSchoolId(req)
    const snake = camelToSnake(rest, fieldMap)
    if (snake.max_days !== undefined) {
      const n = parseInt(String(snake.max_days), 10)
      snake.max_days = Number.isNaN(n) || n <= 0 ? null : n
    }
    if (snake.name !== undefined && !String(snake.name).trim()) {
      return NextResponse.json({ error: "Leave type name cannot be empty" }, { status: 400 })
    }
    // check duplicate name
    if (snake.name) {
      const dup = await query(`SELECT id FROM leave_types WHERE lower(name)=lower($1) AND school_id=$2 AND id<>$3 LIMIT 1`, [String(snake.name).trim(), schoolId, id])
      if (dup.rows.length > 0) return NextResponse.json({ error: `Leave type "${String(snake.name).trim()}" already exists` }, { status: 400 })
    }
    const clean: any = {}
    if (snake.name !== undefined) clean.name = String(snake.name).trim()
    if (snake.max_days !== undefined) clean.max_days = snake.max_days
    const item = await update(TABLE, id, clean, schoolId ?? undefined)
    return NextResponse.json(item ? mapResponse(item as any, fieldMap) : { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const schoolId = getSessionSchoolId(req)
  // prevent delete if in use
  try {
    const inUse = await query(`SELECT id FROM leave_requests WHERE leave_type_id=$1 LIMIT 1`, [id])
    if (inUse.rows.length > 0) {
      return NextResponse.json({ error: "Cannot delete: leave type is in use by leave requests" }, { status: 400 })
    }
  } catch {}
  await remove(TABLE, id, schoolId ?? undefined)
  return NextResponse.json({ success: true })
}
