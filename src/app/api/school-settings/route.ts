import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

// GET /api/school-settings -> merged key/value object for the logged-in school
export async function GET(req: NextRequest) {
  const schoolId = getSessionSchoolId(req)
  if (!schoolId) return NextResponse.json({})

  const res = await query(`SELECT key, value FROM school_settings WHERE school_id = $1`, [schoolId])
  const settings: Record<string, string> = {}
  for (const row of res.rows) settings[row.key] = row.value
  return NextResponse.json(settings)
}

// PUT /api/school-settings body: { "module.key": "value", ... } (upsert)
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
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
