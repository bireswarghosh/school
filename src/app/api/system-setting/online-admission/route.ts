import { NextRequest, NextResponse } from "next/server"
import { query, create, update } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function getSchoolId(req: NextRequest): number | null {
  const raw = req.headers.get("x-school-id")
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

const DEFAULTS = {
  enabled: false,
  startDate: "",
  endDate: "",
  maxStudents: 30,
  requireParentEmail: true,
  requireDocuments: true,
  selectedClasses: [],
}

function toCamel(row: any) {
  return {
    enabled: Boolean(row.enabled),
    startDate: row.start_date ? String(row.start_date).slice(0, 10) : "",
    endDate: row.end_date ? String(row.end_date).slice(0, 10) : "",
    maxStudents: row.max_students ?? DEFAULTS.maxStudents,
    requireParentEmail: Boolean(row.require_parent_email),
    requireDocuments: Boolean(row.require_documents),
    selectedClasses: Array.isArray(row.selected_classes) ? row.selected_classes : [],
  }
}

export async function GET(req: NextRequest) {
  try {
    const schoolId = getSchoolId(req)
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const res = await query(`SELECT * FROM online_admission_settings WHERE school_id = $1`, [schoolId])
    if (!res.rows[0]) return NextResponse.json({ ...DEFAULTS })
    return NextResponse.json(toCamel(res.rows[0]))
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const schoolId = getSchoolId(req)
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const data = {
      enabled: Boolean(body.enabled),
      start_date: body.startDate ? String(body.startDate).slice(0, 10) : null,
      end_date: body.endDate ? String(body.endDate).slice(0, 10) : null,
      max_students: Number(body.maxStudents ?? DEFAULTS.maxStudents),
      require_parent_email: Boolean(body.requireParentEmail),
      require_documents: Boolean(body.requireDocuments),
      selected_classes: JSON.stringify(Array.isArray(body.selectedClasses) ? body.selectedClasses : []),
    }

    const existing = await query(`SELECT * FROM online_admission_settings WHERE school_id = $1`, [schoolId])
    if (existing.rows[0]) {
      const updated = await update<any>("online_admission_settings", existing.rows[0].id, data, schoolId)
      return NextResponse.json(toCamel(updated))
    }
    const created = await create<any>("online_admission_settings", data, schoolId)
    return NextResponse.json(toCamel(created), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
