import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Public login/branding settings for a school (no secrets). Used by the public
// /login page and portal so students/parents see the correct logo & background.
const ALLOWED_KEYS = [
  "logo.printLogo",
  "logo.adminLogo",
  "logo.adminSmallLogo",
  "logo.appLogo",
  "loginbg.adminBg",
  "loginbg.userBg",
  "loginbg.overlayColor",
  "theme.backendTheme",
  "mobile.primaryColor",
  "mobile.secondaryColor",
  "loginbg.adminOverlayColor",
  "studentlogin.studentEnabled",
  "studentlogin.parentEnabled",
  "studentlogin.guardianEnabled",
  "studentlogin.additionalUsername",
  "maintenance.enabled",
  "misc.idCardScanCode",
  "misc.frontSiteExamResult",
  "chat.enabled",
]

async function resolveSchool(code?: string | null) {
  const c = String(code || "DEFAULT").trim()
  if (c) {
    const r = await query(`SELECT * FROM schools WHERE lower(code) = lower($1) LIMIT 1`, [c])
    if (r.rows[0]) return r.rows[0] as { id: number; name: string; code: string }
  }
  const r = await query(`SELECT * FROM schools ORDER BY id LIMIT 1`)
  return r.rows[0] as { id: number; name: string; code: string } | undefined
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const school = await resolveSchool(searchParams.get("code"))
    if (!school) return NextResponse.json({ schoolName: "Smart School" })

    const res = await query(`SELECT key, value FROM school_settings WHERE school_id = $1`, [school.id])
    const rows = res.rows as { key: string; value: string }[]

    const flat: Record<string, string> = { schoolName: school.name, schoolCode: school.code }
    for (const row of rows) {
      if (ALLOWED_KEYS.includes(row.key)) flat[row.key.replace(/\./g, "_")] = row.value
    }

    return NextResponse.json(flat)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}