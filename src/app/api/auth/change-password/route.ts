import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUserId, verifyPassword, hashPassword } from "@/lib/auth"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

// POST /api/auth/change-password — change your own password
export async function POST(req: NextRequest) {
  try {
    const uid = getSessionUserId(req)
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const currentPassword = String(body.currentPassword || "")
    const newPassword = String(body.newPassword || "")

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
    }

    const result = await query(`SELECT id, password_hash FROM users WHERE id = $1`, [uid])
    const user = result.rows[0]
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    if (!verifyPassword(currentPassword, user.password_hash)) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashPassword(newPassword), uid])
    return NextResponse.json({ success: true, message: "Password updated" })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}