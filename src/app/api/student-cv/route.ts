import { NextRequest, NextResponse } from "next/server"
import { query, create, update, remove } from "@/lib/db"
import { camelToSnake, snakeToCamel } from "@/lib/field-mapping"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "student_cvs"
const fieldMap: Record<string, string> = {
  name: "name",
  dob: "dob",
  gender: "gender",
  address: "address",
  education: "education",
  achievements: "achievements",
  skills: "skills",
  hobbies: "hobbies",
}

function dateOk(v: unknown): boolean {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)
}

function toDb(data: Record<string, any>) {
  const mapped: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    const col = fieldMap[key] || key.replace(/([A-Z])/g, "_$1").toLowerCase()
    if (col === "id" || col === "created_at" || col === "updated_at") continue
    if (value === undefined || value === null || value === "") {
      mapped[col] = null
    } else if (col === "education") {
      mapped[col] = JSON.stringify(value)
    } else if (col === "dob") {
      mapped[col] = dateOk(value) ? value : null
    } else {
      mapped[col] = value
    }
  }
  return mapped
}

function toCv(row: Record<string, any>) {
  const cv = snakeToCamel(row, { education: "education" })
  if (typeof cv.education === "string") {
    try {
      cv.education = JSON.parse(cv.education)
    } catch {
      cv.education = []
    }
  }
  return cv
}

const LIST_SQL = `SELECT * FROM student_cvs`

async function loadList(where?: string, whereParams?: unknown[]) {
  const sql = where ? `${LIST_SQL} WHERE ${where} ORDER BY id DESC` : `${LIST_SQL} ORDER BY id DESC`
  const result = await query(sql, (whereParams || []) as any[])
  return result.rows.map(toCv)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const items = await loadList("id = $1", [parseInt(id, 10)])
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
        created.push(await create(TABLE, toDb(item)))
      }
      return NextResponse.json(created.map(toCv), { status: 201 })
    }
    const item = await create(TABLE, toDb(body))
    return NextResponse.json(toCv(item), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const item = await update(TABLE, parseInt(id), toDb(data))
    return NextResponse.json(item ? toCv(item) : { error: "Not found" }, { status: item ? 200 : 404 })
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
    for (const i of ids) await remove(TABLE, i)
    return NextResponse.json({ success: true, deleted: ids.length })
  }
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await remove(TABLE, id)
  return NextResponse.json({ success: true })
}