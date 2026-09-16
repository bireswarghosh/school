import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"
import { currencyFormatLabel, currencyCodeFromFormat, GENERAL_TIMEZONES } from "@/lib/school-setup"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

// GET /api/school-settings -> merged key/value object for the logged-in school.
// The profile-managed general.* keys are always sourced from the `schools`
// table (the super admin / school profile is the source of truth), so the
// General Setting page always shows the correct name, code, email, phone,
// address, currency and timezone for THIS school.
export async function GET(req: NextRequest) {
  const schoolId = getSessionSchoolId(req)
  if (!schoolId) return NextResponse.json({})

  const res = await query(`SELECT key, value FROM school_settings WHERE school_id = $1`, [schoolId])
  const settings: Record<string, string> = {}
  for (const row of res.rows) settings[row.key] = row.value

  const schoolRes = await query(
    `SELECT code, name, email, phone, address, currency, timezone FROM schools WHERE id = $1`,
    [schoolId]
  )
  const school = schoolRes.rows[0]
  if (school) {
    settings["general.schoolName"] = school.name
    settings["general.schoolCode"] = school.code
    settings["general.email"] = school.email ?? ""
    settings["general.phone"] = school.phone ?? ""
    settings["general.address"] = school.address ?? ""
    const fmt = currencyFormatLabel(school.currency)
    if (fmt) settings["general.currencyFormat"] = fmt
    if (school.timezone && GENERAL_TIMEZONES.includes(school.timezone)) settings["general.timezone"] = school.timezone
  }

  return NextResponse.json(settings)
}

// PUT /api/school-settings body: { "module.key": "value", ... } (upsert).
// Overlapping general.* keys are mirrored back into the `schools` profile so
// the super admin panel reflects the school admin's edits (and vice-versa).
export async function PUT(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    if (!schoolId) return NextResponse.json({ error: "No school context" }, { status: 400 })

    const body = await req.json()
    for (const [key, value] of Object.entries(body)) {
      await query(
        `INSERT INTO school_settings (school_id, key, value)
         VALUES ($1, $2, $3)
         ON CONFLICT (school_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [schoolId, key, value == null ? null : String(value)]
      )
    }

    // Mirror the profile-linked general.* keys into the schools row.
    // School code is intentionally NOT mirrored — it is the login code set by
    // the super admin and stays read-only on the General Setting page.
    const mirror: Record<string, string> = {}
    if (body["general.schoolName"] !== undefined) mirror.name = String(body["general.schoolName"])
    if (body["general.email"] !== undefined) mirror.email = String(body["general.email"])
    if (body["general.phone"] !== undefined) mirror.phone = String(body["general.phone"])
    if (body["general.address"] !== undefined) mirror.address = String(body["general.address"])
    const cur = currencyCodeFromFormat(body["general.currencyFormat"])
    if (cur) mirror.currency = cur
    if (body["general.timezone"] !== undefined && GENERAL_TIMEZONES.includes(String(body["general.timezone"]))) {
      mirror.timezone = String(body["general.timezone"])
    }

    const mirrorKeys = Object.keys(mirror)
    if (mirrorKeys.length > 0) {
      const sets = mirrorKeys.map((k, i) => `${k} = $${i + 1}`).join(", ")
      await query(`UPDATE schools SET ${sets}, updated_at = NOW() WHERE id = $${mirrorKeys.length + 1}`, [
        ...mirrorKeys.map((k) => mirror[k]),
        schoolId,
      ])
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}