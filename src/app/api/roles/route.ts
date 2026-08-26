import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function getSchoolId(req: NextRequest): number | null {
  const raw = req.headers.get("x-school-id")
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized. Please log out and log back in with your school code." }, { status: 401 })
}

export async function GET(req: NextRequest) {
  try {
    const schoolId = getSchoolId(req)
    if (!schoolId) return unauthorized()

    // School roles + seeded system roles (is_system, school_id IS NULL)
    const result = await query(
      `SELECT id, name, label, permissions, is_system, school_id, created_at
       FROM roles
       WHERE school_id = $1 OR school_id IS NULL
       ORDER BY is_system DESC, id ASC`,
      [schoolId]
    )

    const roles = result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.label || "",
      permissions: Array.isArray(r.permissions) ? r.permissions : [],
      isSystem: !!r.is_system,
      schoolId: r.school_id,
    }))

    return NextResponse.json(roles)
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const schoolId = getSchoolId(req)
    if (!schoolId) return unauthorized()

    const body = await req.json()
    const name = String(body.name || "").trim()
    if (!name) return NextResponse.json({ error: "Role name is required" }, { status: 400 })

    const description = String(body.description || "").trim()
    const permissions = Array.isArray(body.permissions) ? body.permissions : []

    const result = await query(
      `INSERT INTO roles (name, label, permissions, school_id, is_system)
       VALUES ($1, $2, $3, $4, false) RETURNING *`,
      [name, description, JSON.stringify(permissions), schoolId]
    )

    const r = result.rows[0]
    return NextResponse.json(
      { id: r.id, name: r.name, description: r.label || "", permissions: Array.isArray(r.permissions) ? r.permissions : [], isSystem: !!r.is_system, schoolId: r.school_id },
      { status: 201 }
    )
  } catch (e: unknown) {
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

    const sets: string[] = []
    const params: (string | number | boolean | null)[] = [schoolId]
    if (body.name !== undefined) { params.push(String(body.name).trim()); sets.push(`name = $${params.length}`) }
    if (body.description !== undefined) { params.push(String(body.description).trim()); sets.push(`label = $${params.length}`) }
    if (body.permissions !== undefined) { params.push(JSON.stringify(body.permissions)); sets.push(`permissions = $${params.length}`) }
    if (sets.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })

    params.push(id)
    const result = await query(
      `UPDATE roles SET ${sets.join(", ")} WHERE id = $${params.length} AND school_id = $1 RETURNING *`,
      params
    )
    const r = result.rows[0]
    if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json(
      { id: r.id, name: r.name, description: r.label || "", permissions: Array.isArray(r.permissions) ? r.permissions : [], isSystem: !!r.is_system, schoolId: r.school_id }
    )
  } catch (e: unknown) {
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

    const result = await query(
      `DELETE FROM roles WHERE id = $2 AND school_id = $1`,
      [schoolId, id]
    )
    return NextResponse.json({ success: (result.rowCount ?? 0) > 0 }, { status: 200 })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}