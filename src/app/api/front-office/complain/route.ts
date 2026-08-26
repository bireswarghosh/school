import { NextRequest, NextResponse } from "next/server"
import { query, create, update, remove } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "complaints"

async function resolveFk(refTable: string, name: string): Promise<number | null> {
  if (!name) return null
  const result = await query(`SELECT id FROM ${refTable} WHERE name = $1`, [name])
  return result.rows.length > 0 ? result.rows[0].id : null
}

async function getWithJoins(id?: number) {
  const where = id ? `WHERE c.id = ${id}` : ""
  const sql = `
    SELECT c.id, ct.name AS "complaintType", st.name AS "source",
      c.name, c.phone, c.date, c.description, c.action_taken AS "actionTaken",
      c.assigned_to AS "assigned", c.note, c.document, c.status, c.email, c.created_at
    FROM ${TABLE} c
    LEFT JOIN complaint_types ct ON ct.id = c.complaint_type_id
    LEFT JOIN source_types st ON st.id = c.source_type_id
    ${where}
    ORDER BY c.id DESC
  `
  const result = await query(sql)
  return result.rows
}

function mapBody(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const [key, value] of Object.entries(body)) {
    if (key === "id") continue
    if (key === "complaintType") data.complaint_type_id = value ? `(SELECT id FROM complaint_types WHERE name = '${value.replace(/'/g, "''")}')` : null
    else if (key === "source") data.source_type_id = value ? `(SELECT id FROM source_types WHERE name = '${value.replace(/'/g, "''")}')` : null
    else if (key === "assigned") data.assigned_to = value
    else if (key === "actionTaken") data.action_taken = value
    else data[key] = value
  }
  return data
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