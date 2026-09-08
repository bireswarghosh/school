import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { signSession, SESSION_COOKIE, getCurrentSession, getSessionUserId } from "@/lib/auth"
import {
  verifyChallenge,
  verifyTotp,
  hashBackupCode,
  parseBackupHashes,
} from "@/lib/two-factor"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function POST(req: NextRequest) {
  try {
    const { challengeToken, code, backupCode } = await req.json()
    const challenge = verifyChallenge(String(challengeToken || ""))
    if (!challenge) {
      return NextResponse.json({ error: "Verification session expired. Please sign in again." }, { status: 401 })
    }

    const userResult = await query(`SELECT * FROM users WHERE id = $1`, [challenge.uid])
    const user = userResult.rows[0]
    if (!user || (user.status && String(user.status).toLowerCase() !== "active")) {
      return NextResponse.json({ error: "Account unavailable" }, { status: 403 })
    }

    let verified = false
    if (user.two_factor_enabled && user.two_factor_secret && code) {
      verified = verifyTotp(user.two_factor_secret, String(code))
    }
    if (!verified && backupCode && user.two_factor_enabled) {
      const hashes = parseBackupHashes(user.two_factor_backup_codes)
      const digest = hashBackupCode(String(backupCode))
      const idx = hashes.indexOf(digest)
      if (idx !== -1) {
        hashes.splice(idx, 1)
        await query(`UPDATE users SET two_factor_backup_codes = $1 WHERE id = $2`, [JSON.stringify(hashes), user.id])
        verified = true
      }
    }
    if (!verified) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 401 })
    }

    let role = challenge.role || user.role || "staff"
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

    const schoolId = challenge.sid ?? user.school_id ?? null
    let school: any = null
    if (schoolId) {
      const schoolResult = await query(`SELECT * FROM schools WHERE id = $1`, [schoolId])
      school = schoolResult.rows[0] || null
    }

    const token = await signSession({
      uid: user.id,
      sid: schoolId,
      role,
      name: user.name || user.username || user.email,
    })
    await query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id])

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role, permissions, schoolId },
      school,
      redirect: challenge.redirect || "/admin",
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

export async function currentUserId(req: NextRequest): Promise<number | null> {
  try {
    const session = await getCurrentSession()
    if (session?.uid) return session.uid
  } catch {
    // fall through to header
  }
  return getSessionUserId(req)
}
