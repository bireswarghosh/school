import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { currentUserId } from "@/app/api/auth/2fa/verify/route"
import { verifyTotp, generateBackupCodes, hashBackupCode } from "@/lib/two-factor"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function POST(req: NextRequest) {
  try {
    const uid = await currentUserId(req)
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { code } = await req.json()
    const r = await query(`SELECT id, two_factor_secret, two_factor_enabled FROM users WHERE id = $1`, [uid])
    const user = r.rows[0]
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (user.two_factor_enabled) {
      return NextResponse.json({ error: "Two-factor authentication is already enabled" }, { status: 400 })
    }
    if (!user.two_factor_secret || !verifyTotp(user.two_factor_secret, String(code || ""))) {
      return NextResponse.json({ error: "Invalid code. Check your authenticator app and try again." }, { status: 401 })
    }
    const backupCodes = generateBackupCodes(8)
    await query(`UPDATE users SET two_factor_enabled = TRUE, two_factor_backup_codes = $1 WHERE id = $2`, [
      JSON.stringify(backupCodes.map(hashBackupCode)),
      uid,
    ])
    return NextResponse.json({
      success: true,
      message: "Two-factor authentication enabled",
      backupCodes,
    })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 })
  }
}
