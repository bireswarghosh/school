import { NextRequest, NextResponse } from "next/server"
import { query, remove } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "leave_requests"

const leaveTypeNames: Record<string, number> = {
  "Sick Leave": 1,
  "Casual Leave": 2,
  "Earned Leave": 3,
  "Maternity Leave": 4,
  "Paternity Leave": 5,
}

async function getAll() {
  const sql = `
    SELECT lr.*, lt.name AS leave_type
    FROM ${TABLE} lr
    LEFT JOIN leave_types lt ON lt.id = lr.leave_type_id
    ORDER BY lr.id DESC
  `
  const result = await query(sql)
  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    role: row.role,
    leaveType: row.leave_type,
    leaveTypeId: row.leave_type_id,
    fromDate: row.from_date,
    toDate: row.to_date,
    days: row.days,
    reason: row.reason,
    status: row.status,
    document: row.document || "",
    remarks: row.remarks || "",
    createdAt: row.created_at,
  }))
}

function toDb(body: any) {
  const data: Record<string, any> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.role !== undefined) data.role = body.role
  if (body.leaveType !== undefined) data.leave_type_id = leaveTypeNames[body.leaveType] || null
  if (body.fromDate !== undefined) data.from_date = body.fromDate
  if (body.toDate !== undefined) data.to_date = body.toDate
  if (body.days !== undefined) data.days = body.days
  if (body.reason !== undefined) data.reason = body.reason
  if (body.status !== undefined) data.status = body.status
  if (body.document !== undefined) data.document = body.document || null
  if (body.remarks !== undefined) data.remarks = body.remarks || null
  if (body.userId !== undefined) data.user_id = body.userId
  return data
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const sql = `
      SELECT lr.*, lt.name AS leave_type
      FROM ${TABLE} lr
      LEFT JOIN leave_types lt ON lt.id = lr.leave_type_id
      WHERE lr.id = $1::int
    `
    const result = await query(sql, [parseInt(id)])
    const row = result.rows[0]
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({
      id: row.id, userId: row.user_id, name: row.name, role: row.role,
      leaveType: row.leave_type, leaveTypeId: row.leave_type_id,
      fromDate: row.from_date, toDate: row.to_date, days: row.days,
      reason: row.reason, status: row.status,
      document: row.document || "", remarks: row.remarks || "",
    })
  }
  const items = await getAll()
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = toDb(body)
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
    const columns = keys.join(", ")
    const result = await query(
      `INSERT INTO ${TABLE} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    )
    const row = result.rows[0]
    const typeResult = await query("SELECT name FROM leave_types WHERE id = $1::int", [row.leave_type_id])
    return NextResponse.json({
      id: row.id, userId: row.user_id, name: row.name, role: row.role,
      leaveType: typeResult.rows[0]?.name || null, leaveTypeId: row.leave_type_id,
      fromDate: row.from_date, toDate: row.to_date, days: row.days,
      reason: row.reason, status: row.status,
      document: row.document || "", remarks: row.remarks || "",
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const data = toDb(rest)
    const keys = Object.keys(data)
    if (keys.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    const values = Object.values(data)
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ")
    const result = await query(
      `UPDATE ${TABLE} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    )
    const row = result.rows[0]
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const typeResult = await query("SELECT name FROM leave_types WHERE id = $1::int", [row.leave_type_id])
    return NextResponse.json({
      id: row.id, userId: row.user_id, name: row.name, role: row.role,
      leaveType: typeResult.rows[0]?.name || null, leaveTypeId: row.leave_type_id,
      fromDate: row.from_date, toDate: row.to_date, days: row.days,
      reason: row.reason, status: row.status,
      document: row.document || "", remarks: row.remarks || "",
    })
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
