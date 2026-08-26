import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyPassword, signSession, SESSION_COOKIE } from "@/lib/auth"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, schoolCode } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const userResult = await query(
      `SELECT * FROM users WHERE lower(email) = lower($1)`,
      [email]
    )
    const user = userResult.rows[0]
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }
    if (user.status && String(user.status).toLowerCase() !== "active") {
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 })
    }

    const isSuperAdmin = user.role === "super_admin"
    let school: any = null
    let schoolId: number | null = user.school_id ?? null

    if (!isSuperAdmin) {
      const code = String(schoolCode || "").trim().toUpperCase()
      if (!code) {
        return NextResponse.json({ error: "School code is required" }, { status: 400 })
      }
      const schoolResult = await query(
        `SELECT * FROM schools WHERE lower(code) = lower($1)`,
        [code]
      )
      school = schoolResult.rows[0] || null
      if (!school) {
        return NextResponse.json({ error: "Invalid school code" }, { status: 400 })
      }
      if (school.status && String(school.status).toLowerCase() !== "active") {
        return NextResponse.json({ error: "School is not active" }, { status: 403 })
      }
      if (schoolId !== school.id) {
        return NextResponse.json({ error: "User does not belong to this school" }, { status: 403 })
      }
    }

    let role = user.role || "staff"
    let permissions: string[] = []
    if (user.role_id) {
      const roleResult = await query(`SELECT name, permissions FROM roles WHERE id = $1`, [user.role_id])
      if (roleResult.rows[0]) {
        role = roleResult.rows[0].name
        permissions = roleResult.rows[0].permissions || []
      }
    }

    const token = await signSession({
      uid: user.id,
      sid: schoolId,
      role,
      name: user.name || user.username || email,
    })

    await query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id])

    let redirect = "/admin"
    if (isSuperAdmin) {
      redirect = "/saas"
    } else if (role === "student" || role === "parent" || role === "teacher") {
      redirect = "/portal"
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        permissions,
        schoolId,
      },
      school,
      redirect,
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
