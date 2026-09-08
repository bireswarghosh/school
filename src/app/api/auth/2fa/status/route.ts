import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { currentUserId } from "@/app/api/auth/2fa/verify/route"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  try {
    const uid = await currentUserId(req)
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const r = await query(`SELECT two_factor_enabled FROM users WHERE id = $1`, [uid])
    if (!r.rows[0]) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json({ enabled: Boolean(r.rows[0].two_factor_enabled) })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 })
  }
}
