import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById } from "@/lib/db"
import { getSessionRole } from "@/lib/auth"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function requireSuperAdmin(req: NextRequest): NextResponse | null {
  if (getSessionRole(req) !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

const ORDER = "price ASC, id ASC"

export async function GET(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById("plans", parseInt(id))
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
  }
  const items = await getAll("plans", ORDER)
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  try {
    const body = await req.json()
    const { name, code, price, billingPeriod, maxStudents, maxStaff, features, description, status } = body
    if (!name) return NextResponse.json({ error: "Plan name is required" }, { status: 400 })
    const planCode = (code || name).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30)

    const result = await query(
      `INSERT INTO plans (code, name, price, billing_period, max_students, max_staff, features, description, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [planCode, name, price ?? 0, billingPeriod || "monthly", maxStudents || 0, maxStaff || 0, JSON.stringify(Array.isArray(features) ? features : []), description || null, status || "Active"]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const allowed = ["name", "code", "price", "billing_period", "billingPeriod", "max_students", "maxStudents", "max_staff", "maxStaff", "features", "description", "status"]
    const updates: string[] = []
    const params: any[] = []
    for (const key of allowed) {
      if (data[key] === undefined) continue
      const column = key === "billingPeriod" ? "billing_period" : key === "maxStudents" ? "max_students" : key === "maxStaff" ? "max_staff" : key
      params.push(key === "features" ? JSON.stringify(data[key]) : data[key])
      updates.push(`${column} = $${params.length}`)
    }
    if (updates.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    params.push(id)
    const result = await query(
      `UPDATE plans SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    )
    return NextResponse.json(result.rows[0] || { error: "Not found" }, { status: result.rows[0] ? 200 : 404 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const used = await query(`SELECT COUNT(*)::int AS count FROM schools WHERE plan_id = $1`, [id])
  if (used.rows[0].count > 0) {
    return NextResponse.json({ error: `Plan is assigned to ${used.rows[0].count} school(s)` }, { status: 400 })
  }
  await query(`DELETE FROM plans WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
