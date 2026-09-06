import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { hashPassword, signSession, SESSION_COOKIE } from "@/lib/auth"
import { schoolUsernamePrefix, generateUniqueUsername, createSchoolRoles } from "@/lib/school-setup"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "school"
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, mobile, address, tagline, adminName } = body
    if (!name || !email || !mobile) {
      return NextResponse.json({ error: "Name, email and mobile are required" }, { status: 400 })
    }

    const existing = await query(`SELECT id FROM schools WHERE lower(email) = lower($1)`, [email])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "A school with this email already exists" }, { status: 409 })
    }

    const code = await generateUniqueCode(name)
    const schoolResult = await query(
      `INSERT INTO schools (code, name, email, phone, address, tagline, status)
       VALUES ($1,$2,$3,$4,$5,$6,'Active') RETURNING *`,
      [code, name, email, mobile, address || null, tagline || null]
    )
    const school = schoolResult.rows[0]

    const roles = await createSchoolRoles(school.id)
    const adminRoleId = roles["admin"] ?? null

    const password = "Admin@123"
    const hashed = hashPassword(password)
    const prefix = schoolUsernamePrefix(name)
    const adminUsername = await generateUniqueUsername(`${prefix}_admin`)
    const adminResult = await query(
      `INSERT INTO users (username, name, email, password_hash, role, role_id, school_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Active') RETURNING *`,
      [adminUsername, adminName || `Admin - ${name}`, email, hashed, "admin", adminRoleId, school.id]
    )
    const admin = adminResult.rows[0]

    const token = await signSession({ uid: admin.id, sid: school.id, role: "admin", name: admin.name })
    const response = NextResponse.json({
      success: true,
      school: { id: school.id, code: school.code, name: school.name },
      adminEmail: email,
      defaultPassword: password,
      redirect: "/admin",
    })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      secure: req.nextUrl.protocol === "https:",
    })
    return response
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 })
  }
}
