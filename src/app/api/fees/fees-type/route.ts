import { NextRequest, NextResponse } from "next/server"
import { query, create, update, remove, getAll } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "fees_types"
const fieldMap: Record<string, string> = {
  feesGroup: "fees_group_id",
  feesCode: "fees_code",
}

function esc(val: string) {
  return val.replace(/'/g, "''")
}

function mapBody(body: Record<string, any>) {
  const mapped = camelToSnake(body, fieldMap)
  const data: Record<string, any> = {}
  for (const [key, value] of Object.entries(mapped)) {
    if (key === "id") continue
    if (key === "fees_group_id" && value && typeof value === "string" && isNaN(Number(value))) {
      data.fees_group_id = `(SELECT id FROM fees_groups WHERE name = '${esc(value)}')`
    } else {
      data[key] = value ?? null
    }
  }
  return data
}

async function getWithJoins(id?: number) {
  const where = id ? `WHERE t.id = ${id}` : ""
  const sql = `
    SELECT t.id, t.name, t.fees_code AS "feesCode", fg.name AS "feesGroup",
      t.description, t.amount, t.status
    FROM ${TABLE} t
    LEFT JOIN fees_groups fg ON fg.id = t.fees_group_id
    ${where}
    ORDER BY t.id DESC
  `
  const result = await query(sql)
  return result.rows
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  try {
    const items = await getWithJoins(id ? parseInt(id) : undefined)
    const result = id ? (items[0] || { error: "Not found" }) : items
    return NextResponse.json(result, { status: id && !items[0] ? 404 : 200 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (Array.isArray(body)) {
      const results = []
      for (const item of body) {
        const created = await create(TABLE, mapBody(item))
        const rows = created ? await getWithJoins(created.id) : []
        results.push(rows[0] || created)
      }
      return NextResponse.json(results, { status: 201 })
    }
    const item = await create(TABLE, mapBody(body))
    const rows = await getWithJoins(item.id)
    return NextResponse.json(rows[0] || item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const item = await update(TABLE, id, mapBody(rest))
    const rows = item ? await getWithJoins(item.id) : []
    return NextResponse.json(rows[0] || item || { error: "Not found" }, { status: item ? 200 : 404 })
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
