import { NextRequest, NextResponse } from "next/server"
import { query, create, update, remove } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "visitor_book"
const ORDER = "id DESC"

async function resolveFk(refTable: string, name: string): Promise<number | null> {
  if (!name || typeof name !== "string") return null
  const trimmed = name.trim()
  if (!trimmed) return null
  const result = await query(`SELECT id FROM ${refTable} WHERE name = $1`, [trimmed])
  if (result.rows.length > 0) return result.rows[0].id

  // Create the lookup row so the FK never silently nulls out (school-scoped via db.ts).
  if (refTable === "purpose_types") {
    const inserted = await query(
      `INSERT INTO purpose_types (name, status) VALUES ($1, 'Active') RETURNING id`,
      [trimmed]
    )
    return inserted.rows[0]?.id ?? null
  }
  return null
}

async function getWithJoins(id?: number) {
  const where = id ? `WHERE v.id = ${id}` : ""
  const sql = `
    SELECT v.id, pt.name AS "purpose",
      v.name AS "visitorName", v.phone, v.date,
      v.in_time AS "inTime", v.out_time AS "outTime",
      v.meeting_with AS "meetingWith",
      v.meeting_person AS "meetingPerson",
      v.meeting_person_id AS "meetingPersonId",
      v.class_name AS "classVal", v.section,
      v.id_card AS "idCard", v.no_of_person AS "noOfPerson",
      v.note, v.document, v.purpose_type_id
    FROM ${TABLE} v
    LEFT JOIN purpose_types pt ON pt.id = v.purpose_type_id
    ${where}
    ORDER BY v.id DESC
  `
  const result = await query(sql)
  return result.rows
}

async function mapBody(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const [key, value] of Object.entries(body)) {
    if (key === "visitorName") data.name = value
    else if (key === "purpose") data.purpose_type_id = await resolveFk("purpose_types", value as string)
    else if (key === "meetingWith") data.meeting_with = value
    else if (key === "meetingPerson") data.meeting_person = value || null
    else if (key === "meetingPersonId") data.meeting_person_id = value || null
    else if (key === "classVal") data.class_name = value || null
    else if (key === "section") data.section = value || null
    else if (key === "idCard") data.id_card = value
    else if (key === "noOfPerson") data.no_of_person = value
    else if (key === "inTime") data.in_time = value
    else if (key === "outTime") data.out_time = value
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
        const mapped = await mapBody(item)
        const created = await create(TABLE, mapped)
        const rows = await getWithJoins(created.id)
        results.push(rows[0] || created)
      }
      return NextResponse.json(results, { status: 201 })
    }
    const data = await mapBody(body)
    const item = await create(TABLE, data)
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
    const data = await mapBody(rest)
    const item = await update(TABLE, id, data)
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
