import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"
import { mapResponse } from "@/lib/field-mapping"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const GRADE_SECTIONS = [
  { key: "kg_english", label: "ENGLISH" },
  { key: "kg_math", label: "MATHEMATICS" },
  { key: "kg_language", label: "2ND LANGUAGE" },
  { key: "kg_other", label: "OTHER SUBJECTS" },
  { key: "kg_work_habits", label: "WORK HABITS" },
  { key: "kg_sensorial", label: "SENSORIAL" },
  { key: "kg_social", label: "SOCIAL & PERSONAL DEVELOPMENT" },
]

function countFilled(obj: any): number {
  let n = 0
  for (const v of Object.values(obj || {})) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const g = v as Record<string, unknown>
      if (g.half) n++
      if (g.annual) n++
    }
  }
  return n
}

export async function GET(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req) ?? -1
    const { searchParams } = new URL(req.url)
    const examId = searchParams.get("exam_id")

    const records: any[] = []

    // 1) Numeric exam pipeline (icse exams + marks)
    const params: (string | number)[] = [schoolId]
    let sql = `
      SELECT
        es.student_id, st.name AS student_name, st.admission_no,
        e.class, e.section, e.name AS exam_name,
        COALESCE(m.total_marks, 0)::float AS grand_total,
        COALESCE(m.max_marks, 1)::float AS max_total,
        CASE WHEN COALESCE(m.max_marks, 0) > 0
          THEN ROUND((COALESCE(m.total_marks, 0)::numeric / m.max_marks) * 100, 1)::float
          ELSE 0::float
        END AS percentage
      FROM icse_exam_students es
      JOIN students st ON st.id = es.student_id
      JOIN icse_exams e ON e.id = es.exam_id
      LEFT JOIN (
        SELECT em.student_id, em.exam_id,
          SUM(COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0)) AS total_marks,
          SUM(COALESCE(sub.theory_max, 0) + COALESCE(sub.practical_max, 0)) AS max_marks
        FROM icse_exam_marks em
        JOIN icse_exam_subjects sub ON sub.id = em.subject_id
        WHERE em.absent = false
        GROUP BY em.student_id, em.exam_id
      ) m ON m.student_id = es.student_id AND m.exam_id = es.exam_id
      WHERE es.school_id = $1
    `
    if (examId) {
      params.push(parseInt(examId, 10))
      sql += ` AND es.exam_id = $${params.length}::int`
    }
    sql += ` AND st.school_id = $1`
    const examResult = await query(sql, params)
    for (const r of examResult.rows) records.push({ ...r, subjects: [], source: "exam" })

    // 2) Custom marksheets (KG grade-based entries, e.g. icse_custom_marksheets)
    const customResult = await query(
      `SELECT m.id, m.category, m.data,
              st.name AS student_name, st.admission_no,
              c.name AS class, sec.name AS section
       FROM icse_custom_marksheets m
       LEFT JOIN students st ON st.id = m.student_id
       LEFT JOIN classes c ON c.id = m.class_id
       LEFT JOIN sections sec ON sec.id = m.section_id
       WHERE m.school_id = $1`,
      [schoolId]
    )
    for (const r of customResult.rows) {
      const data = r.data || {}
      const filled = GRADE_SECTIONS.reduce((sum, gs) => sum + countFilled(data[gs.key]), 0)
      const max = 66 // 33 grade points x half + annual
      const pct = max > 0 ? Math.round((filled / max) * 1000) / 10 : 0
      const subjects = GRADE_SECTIONS.map((gs) => {
        const n = countFilled(data[gs.key])
        return { name: gs.label, theory: n, practical: 0, total: n }
      })
      records.push({
        student_name: r.student_name,
        admission_no: r.admission_no,
        class: r.class,
        section: r.section,
        exam_name: r.category === "kg" ? "KG Custom Marksheet" : "Custom Marksheet",
        grand_total: filled,
        max_total: max,
        percentage: pct,
        subjects,
        source: "custom",
      })
    }

    // Rank across the combined list by percentage (desc)
    records.sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
    let lastPct: number | null = null
    let lastRank = 0
    records.forEach((r, i) => {
      if (r.percentage !== lastPct) {
        lastRank = i + 1
        lastPct = r.percentage
      }
      r.rank = lastRank
    })

    return NextResponse.json(mapResponse(records))
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}