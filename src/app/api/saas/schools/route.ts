import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById } from "@/lib/db"
import { getSessionRole, hashPassword } from "@/lib/auth"
import { schoolUsernamePrefix, generateUniqueUsername, createSchoolRoles } from "@/lib/school-setup"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function requireSuperAdmin(req: NextRequest): NextResponse | null {
  if (getSessionRole(req) !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "school"
}

async function generateUniqueCode(name: string): Promise<string> {
  const base = slugify(name).replace(/-/g, "").slice(0, 10).toUpperCase() || "SCH"
  const check = await query(`SELECT id FROM schools WHERE code = $1`, [base])
  if (check.rows.length === 0) return base
  for (let i = 1; i < 1000; i++) {
    const candidate = `${base}${i}`
    const found = await query(`SELECT id FROM schools WHERE code = $1`, [candidate])
    if (found.rows.length === 0) return candidate
  }
  return `${base}${Date.now()}`
}

const SCHOOL_ORDER = "id DESC"

async function enrichSchool(school: any) {
  let plan: any = null
  if (school.plan_id) {
    const p = await query(`SELECT id, code, name, price, billing_period, max_students, max_staff, status FROM plans WHERE id = $1`, [school.plan_id])
    plan = p.rows[0] || null
    if (plan) school.plan = plan.name
  } else if (!school.plan) {
    const p = await query(`SELECT id, code, name, price, billing_period, status FROM plans WHERE code = 'FREE'`)
    plan = p.rows[0] || null
    school.plan = plan?.name || "Free"
  }
  school.planDetails = plan
  return school
}

export async function GET(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById("schools", parseInt(id))
    const enriched = item ? await enrichSchool(item) : null
    return NextResponse.json(enriched || { error: "Not found" }, { status: item ? 200 : 404 })
  }
  const items = await getAll("schools", SCHOOL_ORDER)
  const enriched = await Promise.all(items.map((s: any) => enrichSchool(s)))
  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  try {
    const body = await req.json()
    const { name, email, phone, address, tagline, currency, timezone, plan, maxStudents, adminEmail, adminPassword } = body
    if (!name) return NextResponse.json({ error: "School name is required" }, { status: 400 })

    const code = body.code || (await generateUniqueCode(name))
    const planId = body.planId ? parseInt(body.planId, 10) : null
    const planRow = planId ? (await query(`SELECT id, name FROM plans WHERE id = $1`, [planId])).rows[0] : null
    const planName = planRow?.name || plan || "Free"

    const schoolResult = await query(
      `INSERT INTO schools (code, name, email, phone, address, tagline, currency, timezone, plan, plan_id, max_students)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [code, name, email || null, phone || null, address || null, tagline || null, currency || "INR", timezone || "UTC", planName, planId, maxStudents || 0]
    )
    const school = schoolResult.rows[0]

    const roles = await createSchoolRoles(school.id)
    const adminRoleId = roles["admin"] ?? null

    const admin = adminEmail || email
    if (admin) {
      const hashed = hashPassword(adminPassword || "Admin@123")
      const prefix = schoolUsernamePrefix(name)
      const adminUsername = await generateUniqueUsername(`${prefix}_admin`)
      const adminUserResult = await query(
        `INSERT INTO users (username, name, email, password_hash, role, role_id, school_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [adminUsername, `Admin - ${name}`, admin, hashed, "admin", adminRoleId, school.id, "Active"]
      )
      school.adminUser = { email: admin, password: adminPassword || "Admin@123", username: adminUsername, id: adminUserResult.rows[0].id }
    }

    return NextResponse.json(await enrichSchool(school), { status: 201 })
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
    const allowed = ["name", "email", "phone", "address", "tagline", "currency", "timezone", "plan", "max_students", "status", "logo", "plan_id"]
    const updates: string[] = []
    const params: any[] = []
    for (const key of allowed) {
      if (data[key] === undefined) continue
      // When assigning a plan, also sync the plan name into the text column
      if (key === "plan_id" && data[key]) {
        const planRow = (await query(`SELECT id, name FROM plans WHERE id = $1`, [parseInt(data[key], 10)])).rows[0]
        if (planRow) {
          params.push(parseInt(data[key], 10))
          updates.push(`plan_id = $${params.length}`)
          params.push(planRow.name)
          updates.push(`plan = $${params.length}`)
        }
        continue
      }
      if (key === "plan_id" && !data[key]) {
        params.push(null)
        updates.push(`plan_id = $${params.length}`)
        params.push("Free")
        updates.push(`plan = $${params.length}`)
        continue
      }
      params.push(data[key])
      updates.push(`${key} = $${params.length}`)
    }
    if (updates.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    params.push(id)
    const result = await query(
      `UPDATE schools SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    )
    const updated = result.rows[0] ? await enrichSchool(result.rows[0]) : null
    return NextResponse.json(updated || { error: "Not found" }, { status: updated ? 200 : 404 })
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

  const school = await getById("schools", id)
  if (!school) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (String(school.code).toUpperCase() === "DEFAULT") {
    return NextResponse.json({ error: "Default school cannot be deleted" }, { status: 400 })
  }

  await query(`DELETE FROM schools WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
