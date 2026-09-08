import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { currentUserId } from "@/app/api/auth/2fa/verify/route"
import { randomBase32, otpauthUrl } from "@/lib/two-factor"
import QRCode from "qrcode"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function POST(req: NextRequest) {
  try {
    const uid = await currentUserId(req)
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const r = await query(`SELECT id, email, name, two_factor_enabled FROM users WHERE id = $1`, [uid])
    const user = r.rows[0]
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (user.two_factor_enabled) {
      return NextResponse.json({ error: "Two-factor authentication is already enabled" }, { status: 400 })
    }
    const secret = randomBase32(32)
    await query(`UPDATE users SET two_factor_secret = $1, two_factor_enabled = FALSE WHERE id = $2`, [secret, uid])
    const url = otpauthUrl(secret, user.email || user.name || `user-${uid}`)
    const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 220 })
    return NextResponse.json({ secret, otpauthUrl: url, qrDataUrl })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 })
  }
}
