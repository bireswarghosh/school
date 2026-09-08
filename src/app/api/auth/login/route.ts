import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyPassword, signSession, SESSION_COOKIE } from "@/lib/auth"
import { signChallenge } from "@/lib/two-factor"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, schoolCode } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const cleanEmail = String(email || "").trim()
    let lookupEmail = cleanEmail

    // When a non-email identifier is used (admission no / mobile) and a school
    // code is supplied, resolve it to the matching student login first.
    if (!cleanEmail.includes("@")) {
      const codeRaw = String(schoolCode || "").trim().toUpperCase()
      if (codeRaw) {
        const sc = await query(`SELECT id FROM schools WHERE lower(code) = lower($1)`, [codeRaw])
        const sid = sc.rows[0] ? Number(sc.rows[0].id) : null
        if (sid) {
          const ident = cleanEmail
          const byAdm = await query(
            `SELECT user_id FROM students WHERE admission_no = $1 AND school_id = $2 AND user_id IS NOT NULL LIMIT 1`,
            [ident, sid]
          )
          if (byAdm.rows[0]) {
            const u = await query(`SELECT email FROM users WHERE id = $1`, [byAdm.rows[0].user_id])
            lookupEmail = u.rows[0]?.email || cleanEmail
          } else {
            const byMobile = await query(
              `SELECT user_id FROM students
               WHERE (mobile = $1 OR guardian_phone = $1) AND school_id = $2 AND user_id IS NOT NULL LIMIT 1`,
              [ident, sid]
            )
            if (byMobile.rows[0]) {
              const u = await query(`SELECT email FROM users WHERE id = $1`, [byMobile.rows[0].user_id])
              lookupEmail = u.rows[0]?.email || cleanEmail
            }
          }
        }
      }
    }

    const userResult = await query(
      `SELECT * FROM users WHERE lower(email) = lower($1)`,
      [lookupEmail]
    )
    const user = userResult.rows[0]
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }
    if (user.status && String(user.status).toLowerCase() !== "active") {
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 })
    }

    const isSuperAdmin = user.role === "super_admin"
    const isPortalRole = user.role === "student" || user.role === "parent"
    let school: any = null
    let schoolId: number | null = user.school_id ?? null

    if (!isSuperAdmin) {
      const code = String(schoolCode || "").trim().toUpperCase()

      // Students and parents do not need a school code — the school is derived
      // from their linked student / guardian record.
      if (isPortalRole && !code) {
        if (!schoolId) {
          const linkResult =
            user.role === "student"
              ? await query(`SELECT school_id FROM students WHERE user_id = $1 LIMIT 1`, [user.id])
              : await query(
                  `SELECT s.school_id FROM student_guardians sg JOIN students s ON s.id = sg.student_id WHERE sg.parent_user_id = $1 LIMIT 1`,
                  [user.id]
                )
          schoolId = linkResult.rows[0]?.school_id ? Number(linkResult.rows[0].school_id) : null
        }
        if (!schoolId) {
          return NextResponse.json(
            { error: "No school is linked to this account. Please contact your school admin." },
            { status: 403 }
          )
        }
        const schoolResult = await query(`SELECT * FROM schools WHERE id = $1`, [schoolId])
        school = schoolResult.rows[0] || null
        if (!school) {
          return NextResponse.json({ error: "School not found for this account" }, { status: 403 })
        }
        if (school.status && String(school.status).toLowerCase() !== "active") {
          return NextResponse.json({ error: "School is not active" }, { status: 403 })
        }
      } else {
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
    }

    // Enforce per-school login policies (maintenance mode + student/parent login).
    if (!isSuperAdmin && schoolId) {
      const cfgRes = await query(`SELECT key, value FROM school_settings WHERE school_id = $1`, [schoolId])
      const cfg: Record<string, string> = {}
      for (const row of cfgRes.rows) cfg[row.key] = row.value

      const maintenanceOn = cfg["maintenance.enabled"] === "1"
      const maintenanceEnds = cfg["maintenance.endsAt"]
      const maintenanceActive = maintenanceOn && (!maintenanceEnds || new Date(maintenanceEnds).getTime() > Date.now())
      if (maintenanceActive) {
        return NextResponse.json({ error: "Site is under maintenance. Please try again later." }, { status: 403 })
      }
      if (isPortalRole) {
        if (user.role === "student" && cfg["studentlogin.studentEnabled"] === "0") {
          return NextResponse.json({ error: "Student login has been disabled by your school." }, { status: 403 })
        }
        if (user.role === "parent" && cfg["studentlogin.parentEnabled"] === "0") {
          return NextResponse.json({ error: "Parent login has been disabled by your school." }, { status: 403 })
        }
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
    if (Array.isArray(user.permissions) && user.permissions.length > 0) {
      permissions = user.permissions
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

    if (user.two_factor_enabled && user.two_factor_secret) {
      const challengeToken = signChallenge({
        uid: user.id,
        sid: schoolId,
        role,
        name: user.name || user.username || email,
        redirect,
      })
      return NextResponse.json({
        requiresTwoFactor: true,
        challengeToken,
        user: { id: user.id, name: user.name, email: user.email, role },
      })
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
      token,
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
