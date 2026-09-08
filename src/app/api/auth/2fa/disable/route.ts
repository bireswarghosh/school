import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyPassword } from "@/lib/auth"
import { currentUserId } from "@/app/api/auth/2fa/verify/route"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function POST(req: NextRequest) {
  try {
    const uid = await currentUserId(req)
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { password } = await req.json()
    const r = await query(`SELECT id, password_hash FROM users WHERE id = $1`, [uid])
    const user = r.rows[0]
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (!verifyPassword(String(password || ""), user.password_hash)) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
    }
    await query(
      `UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL, two_factor_backup_codes = NULL WHERE id = $1`,
      [uid]
    )
    return NextResponse.json({ success: true, message: "Two-factor authentication disabled" })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 })
  }
}
