import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { deriveLoginUsername, isPortalRole } from "@/lib/login-usernames"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "users"
const ORDER = "id DESC"
const SAFE_COLS = "id, username, name, email, role, status, role_id, permissions, last_login"

function getSchoolId(req: NextRequest): number | null {
  const raw = req.headers.get("x-school-id")
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized. Please log out and log back in with your school code." }, { status: 401 })
}

function statusToString(status: unknown): string {
  if (status === true || status === "active" || status === "Active" || status === "1") return "active"
  if (status === false || status === "inactive" || status === "Inactive" || status === "0" || status === "disabled") return "inactive"
  return String(status ?? "inactive")
}

function cleanPayload(raw: Record<string, any>) {
  const { id, password, confirmPassword, phone, lastLogin, permissions, school_id, schoolId, created_at, admissionNo, ...rest } = raw
  const data: Record<string, any> = { ...rest }
  if (typeof password === "string" && password.trim()) data.password_hash = hashPassword(password)
  if (data.status !== undefined) data.status = statusToString(data.status)
  if (Array.isArray(permissions)) data.permissions = JSON.stringify(permissions)
  return data
}

function publicUser(row: any) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    role_id: row.role_id,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    lastLogin: row.last_login,
  }
}

export async function GET(req: NextRequest) {
  try {
    const schoolId = getSchoolId(req)
    if (!schoolId) return unauthorized()

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get("id") || "0")
    if (id) {
      const result = await query(`SELECT ${SAFE_COLS} FROM ${TABLE} WHERE id = $1 AND school_id = $2`, [id, schoolId])
      const row = result.rows[0]
      return NextResponse.json(row ? publicUser(row) : { error: "Not found" }, { status: row ? 200 : 404 })
    }
    const result = await query(`SELECT ${SAFE_COLS} FROM ${TABLE} WHERE school_id = $1 ORDER BY ${ORDER}`, [schoolId])
    return NextResponse.json(result.rows.map(publicUser))
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const schoolId = getSchoolId(req)
    if (!schoolId) return unauthorized()

    const body = await req.json()
    const data = cleanPayload(body)
    data.school_id = schoolId

    if (isPortalRole(body.role)) {
      const derived = await deriveLoginUsername({
        role: body.role,
        admissionNo: body.admissionNo,
        schoolId,
      })
      if (derived) data.username = derived
    }

    const keys = Object.keys(data)
    if (keys.length === 0) return NextResponse.json({ error: "Nothing to create" }, { status: 400 })
    const values = Object.values(data)
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
    const result = await query(
      `INSERT INTO ${TABLE} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING ${SAFE_COLS}`,
      values
    )
    return NextResponse.json(publicUser(result.rows[0]), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const schoolId = getSchoolId(req)
    if (!schoolId) return unauthorized()

    const body = await req.json()
    const id = parseInt(body.id, 10)
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const data = cleanPayload(body)

    if (isPortalRole(body.role)) {
      const derived = await deriveLoginUsername({
        role: body.role,
        admissionNo: body.admissionNo,
        schoolId,
        userId: id,
      })
      if (derived) data.username = derived
    }

    const keys = Object.keys(data)
    if (keys.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })

    const values = Object.values(data)
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ")
    const result = await query(
      `UPDATE ${TABLE} SET ${setClause} WHERE id = $${keys.length + 1} AND school_id = $${keys.length + 2} RETURNING ${SAFE_COLS}`,
      [...values, id, schoolId]
    )
    const row = result.rows[0]
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(publicUser(row))
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const schoolId = getSchoolId(req)
    if (!schoolId) return unauthorized()

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const result = await query(`DELETE FROM ${TABLE} WHERE id = $1 AND school_id = $2`, [id, schoolId])
    return NextResponse.json({ success: (result.rowCount ?? 0) > 0 }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}