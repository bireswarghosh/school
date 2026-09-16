import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

type ClassSectionLookup = {
  classByName: Map<string, number>
  sectionsByClass: Map<number, Map<string, number>>
  sectionByName: Map<string, number>
}

async function getClassSectionLookup(): Promise<ClassSectionLookup> {
  const classByName = new Map<string, number>()
  const sectionsByClass = new Map<number, Map<string, number>>()
  const sectionByName = new Map<string, number>()
  const classesRes = await query("SELECT id, name FROM classes")
  for (const c of classesRes.rows) classByName.set(String(c.name), Number(c.id))
  const sectionsRes = await query("SELECT id, name, class_id FROM sections")
  for (const s of sectionsRes.rows) {
    const sid = Number(s.id)
    if (!sectionByName.has(String(s.name))) sectionByName.set(String(s.name), sid)
    const cid = s.class_id === null ? null : Number(s.class_id)
    if (cid !== null) {
      if (!sectionsByClass.has(cid)) sectionsByClass.set(cid, new Map())
      if (!sectionsByClass.get(cid)!.has(String(s.name))) sectionsByClass.get(cid)!.set(String(s.name), sid)
    }
  }
  return { classByName, sectionsByClass, sectionByName }
}

function resolveClassSection(className: string, sectionName: string, lookup: ClassSectionLookup) {
  const class_id = className ? (lookup.classByName.get(className) ?? null) : null
  let section_id: number | null = null
  if (sectionName) {
    const byClass = class_id !== null ? lookup.sectionsByClass.get(class_id)?.get(sectionName) : undefined
    section_id = byClass !== undefined ? byClass : (lookup.sectionByName.get(sectionName) ?? null)
  }
  return { class_id, section_id }
}

// GET: load saved entry for a student, or batch-check which students have entries (comma-separated student_id)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const student_id = searchParams.get("student_id")
  const session_id = searchParams.get("session_id")
  const exam_group_id = searchParams.get("exam_group_id")
  if (!student_id) return NextResponse.json({ data: null })
  try {
    const lookup = await getClassSectionLookup()
    const { class_id, section_id } = resolveClassSection(
      searchParams.get("class_id") || "",
      searchParams.get("section_id") || "",
      lookup
    )
    const ids = student_id.split(",").map((x) => x.trim()).filter(Boolean)
    if (ids.length > 1) {
      const res = await query(
        `SELECT DISTINCT student_id FROM icse_custom_marksheets WHERE student_id = ANY($1::int[]) AND COALESCE(session_id,0)=COALESCE($2::int,0) AND COALESCE(class_id,0)=COALESCE($3::int,0) AND COALESCE(section_id,0)=COALESCE($4::int,0) AND COALESCE(exam_group_id,0)=COALESCE($5::int,0)`,
        [ids as any, session_id || null, class_id, section_id, exam_group_id || null]
      )
      return NextResponse.json({ entered: res.rows.map((r) => Number(r.student_id)) })
    }
    const res = await query(
      `SELECT data FROM icse_custom_marksheets WHERE student_id=$1 AND COALESCE(session_id,0)=COALESCE($2::int,0) AND COALESCE(class_id,0)=COALESCE($3::int,0) AND COALESCE(section_id,0)=COALESCE($4::int,0) AND COALESCE(exam_group_id,0)=COALESCE($5::int,0) ORDER BY updated_at DESC LIMIT 1`,
      [student_id, session_id || null, class_id, section_id, exam_group_id || null]
    )
    if (res.rows.length > 0) {
      return NextResponse.json({ data: res.rows[0].data })
    }
    return NextResponse.json({ data: null })
  } catch (e: any) {
    return NextResponse.json({ data: null })
  }
}

// POST: save entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const student_id = body.student_id
    const session_id = body.session_id ? Number(body.session_id) : null
    const exam_group_id = body.exam_group_id ? Number(body.exam_group_id) : null
    const category = body.category || "kg"
    const schoolId = getSessionSchoolId(req) ?? null
    if (!student_id) return NextResponse.json({ error: "student_id required" }, { status: 400 })

    const lookup = await getClassSectionLookup()
    const { class_id, section_id } = resolveClassSection(
      String(body.class_id || ""),
      String(body.section_id || ""),
      lookup
    )

    // Store the whole payload as JSONB in icse_custom_marksheets.data
    const data = {
      kg_english: body.kg_english || {},
      kg_math: body.kg_math || {},
      kg_language: body.kg_language || {},
      kg_other: body.kg_other || {},
      kg_work_habits: body.kg_work_habits || {},
      kg_sensorial: body.kg_sensorial || {},
      kg_social: body.kg_social || {},
      kg_attendance: body.kg_attendance || {},
      kg_remarks: body.kg_remarks || {},
    }

    // Upsert
    const existing = await query(
      `SELECT id FROM icse_custom_marksheets WHERE student_id=$1 AND COALESCE(session_id,0)=COALESCE($2::int,0) AND COALESCE(class_id,0)=COALESCE($3::int,0) AND COALESCE(section_id,0)=COALESCE($4::int,0) AND COALESCE(exam_group_id,0)=COALESCE($5::int,0)`,
      [student_id, session_id, class_id, section_id, exam_group_id]
    )
    if (existing.rows.length > 0) {
      await query(`UPDATE icse_custom_marksheets SET data=$1, category=$2, updated_at=NOW() WHERE id=$3`, [JSON.stringify(data), category, existing.rows[0].id])
    } else {
      await query(`INSERT INTO icse_custom_marksheets (school_id, student_id, class_id, section_id, session_id, exam_group_id, category, data) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [schoolId, student_id, class_id, section_id, session_id, exam_group_id, category, JSON.stringify(data)])
    }

    return NextResponse.json({ status: 1, message: "KG marks saved successfully" })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}