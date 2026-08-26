import { NextRequest, NextResponse } from "next/server"
import { query, create, update, remove, getAll } from "@/lib/db"
import { camelToSnake } from "@/lib/field-mapping"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "fees_masters"
const fieldMap: Record<string, string> = {
  feesGroup: "fees_group_id",
  feesType: "fees_type_id",
  dueDate: "due_date",
  fineType: "fine_type",
  fineValue: "fine_value",
  perDay: "per_day",
  fineRows: "fine_rows",
  sortOrder: "sort_order",
}

async function resolveFk(value: string, table: string, nameColumn = "name") {
  if (!value) return null
  if (!isNaN(Number(value))) return parseInt(value)
  const result = await query(`SELECT id FROM ${table} WHERE ${nameColumn} = $1 LIMIT 1`, [value])
  return result.rows[0]?.id ?? null
}

async function resolveClassFromGroupName(name: string) {
  if (!name) return null
  const tail = name.split(" - ").pop()?.trim() || name.trim()
  const candidates = [tail, tail.replace(/\.+$/, "")]
  for (const candidate of candidates) {
    const result = await query(`SELECT id FROM classes WHERE name = $1 LIMIT 1`, [candidate])
    if (result.rows[0]?.id) return result.rows[0].id
  }
  return null
}

async function mapBody(body: Record<string, any>) {
  const mapped = camelToSnake(body, fieldMap)
  const data: Record<string, any> = {}
  for (const [key, value] of Object.entries(mapped)) {
    if (key === "id") continue
    if (key === "class") {
      data.class_id = await resolveFk(value, "classes")
    } else if (key === "fees_group_id" && value && typeof value === "string" && isNaN(Number(value))) {
      data.fees_group_id = await resolveFk(value, "fees_groups")
    } else if (key === "fees_type_id" && value && typeof value === "string" && isNaN(Number(value))) {
      data.fees_type_id = await resolveFk(value, "fees_types")
    } else if (key === "fine_rows" && Array.isArray(value)) {
      data.fine_rows = JSON.stringify(value)
    } else {
      data[key] = value ?? null
    }
  }
  if (!data.class_id && mapped.fees_group_id) {
    const raw = mapped.fees_group_id
    let groupName: string | null = null
    if (typeof raw === "string" && isNaN(Number(raw))) {
      groupName = raw
    } else {
      const id = typeof raw === "string" ? parseInt(raw) : raw
      if (id) {
        const group = await query(`SELECT name FROM fees_groups WHERE id = $1`, [id])
        groupName = group.rows[0]?.name ?? null
      }
    }
    if (groupName) data.class_id = (await resolveClassFromGroupName(groupName)) ?? null
  }
  return data
}

async function getWithJoins(id?: number) {
  const where = id ? `WHERE m.id = ${id}` : ""
  const sql = `
    SELECT m.id, fg.name AS "feesGroup", ft.name AS "feesType",
      c.name AS "class", m.amount,
      m.due_date::text AS "dueDate",
      m.fine_type AS "fineType", m.fine_value AS "fineValue",
      m.per_day AS "perDay", m.fine_rows AS "fineRows",
      m.status, m.sort_order AS "sortOrder"
    FROM ${TABLE} m
    LEFT JOIN fees_groups fg ON fg.id = m.fees_group_id
    LEFT JOIN fees_types ft ON ft.id = m.fees_type_id
    LEFT JOIN classes c ON c.id = m.class_id
    ${where}
    ORDER BY m.sort_order ASC, m.id DESC
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
        const created = await create(TABLE, await mapBody(item))
        const rows = created ? await getWithJoins(created.id) : []
        results.push(rows[0] || created)
      }
      return NextResponse.json(results, { status: 201 })
    }
    const item = await create(TABLE, await mapBody(body))
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
    const item = await update(TABLE, id, await mapBody(rest))
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
