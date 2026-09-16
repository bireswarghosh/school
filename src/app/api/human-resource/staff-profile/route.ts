import { NextRequest, NextResponse } from "next/server"
import { query, getById, create, update } from "@/lib/db"
import { hashPassword, verifyPassword, getSessionRole, getSessionSchoolId } from "@/lib/auth"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function noSchool() {
  return NextResponse.json({ error: "Unauthorized. Please log out and log back in with your school code." }, { status: 401 })
}

async function loadStaff(id: number) {
  const staff = await getById<any>("staff", id)
  if (!staff) return null
  const dept = staff.department_id ? await getById<any>("departments", staff.department_id) : null
  const desg = staff.designation_id ? await getById<any>("designations", staff.designation_id) : null
  return { ...staff, department_name: dept?.name || null, designation_name: desg?.name || null }
}

async function findStaffByEmail(email: string) {
  if (!email) return null
  const res = await query(`SELECT * FROM staff WHERE lower(email) = lower($1)`, [email])
  if (!res.rows[0]) return null
  return loadStaff(Number(res.rows[0].id))
}

async function findUserByEmail(email: string, schoolId: number) {
  if (!email) return null
  const res = await query(
    `SELECT id, username, name, email, role, role_id, status, school_id, last_login
     FROM users WHERE lower(email) = lower($1) AND school_id = $2`,
    [email, schoolId]
  )
  return res.rows[0] || null
}

async function findUserById(id: number, schoolId: number) {
  const res = await query(
    `SELECT u.id, u.username, u.name, u.email, u.role, u.role_id, u.status, u.school_id, u.last_login,
            s.name AS school_name
     FROM users u
     LEFT JOIN schools s ON s.id = u.school_id
     WHERE u.id = $1 AND u.school_id = $2`,
    [id, schoolId]
  )
  return res.rows[0] || null
}

export async function GET(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    if (!schoolId) return noSchool()

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const user = await findUserById(id, schoolId)
    if (user) {
      const staff = user.email ? await findStaffByEmail(user.email) : null
      return NextResponse.json({ user, staff, mode: "user" })
    }

    const staff = await loadStaff(id)
    if (staff) {
      const linked = await findUserByEmail(staff.email, schoolId)
      return NextResponse.json({ user: linked, staff, mode: "staff" })
    }

    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    if (!schoolId) return noSchool()

    const body = await req.json()
    const staffId = parseInt(body.id || "0")
    if (!staffId) return NextResponse.json({ error: "id required" }, { status: 400 })
    const staff = await loadStaff(staffId)
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    if (!staff.email) {
      return NextResponse.json({ error: "Staff email is required to create a login account" }, { status: 400 })
    }
    const existing = await findUserByEmail(staff.email, schoolId)
    if (existing) {
      return NextResponse.json({ error: "A login account already exists for this staff member" }, { status: 409 })
    }
    const password = String(body.password || "")
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const base = String(body.username || staff.email.split("@")[0] || "staff")
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, "")
      .replace(/^[^a-z0-9]+/g, "") || "staff"
    let username = base
    for (let i = 1; ; i++) {
      const check = await query(`SELECT id FROM users WHERE username = $1`, [username])
      if (check.rows.length === 0) break
      username = `${base}${i}`
    }

    const user = await create<any>("users", {
      username,
      name: String(body.name || staff.name || "").trim(),
      email: String(body.email || staff.email).trim(),
      password_hash: hashPassword(password),
      role: "staff",
      school_id: staff.school_id,
      status: "Active",
    })
    const { password_hash, ...safe } = user
    return NextResponse.json({ user: safe }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    if (!schoolId) return noSchool()

    const body = await req.json()
    const id = parseInt(body.id || "0")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const res = await query(`SELECT * FROM users WHERE id = $1 AND school_id = $2`, [id, schoolId])
    const user = res.rows[0]
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const newPassword = String(body.newPassword || "")
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const currentPassword = String(body.currentPassword || "")
    const callerRole = (getSessionRole(req) || "").toLowerCase()
    const isAdmin = callerRole === "admin" || callerRole === "super_admin"
    if (currentPassword) {
      if (!verifyPassword(currentPassword, user.password_hash)) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }
    } else if (!isAdmin) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 })
    }

    await update("users", user.id, { password_hash: hashPassword(newPassword) })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
