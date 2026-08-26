import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "subject-marks"

    if (type === "template-marks") {
      const result = await query(`
        SELECT id AS "templateId", name AS "templateName", 0 AS "totalUsed", '' AS class, '' AS section
        FROM cbse_templates ORDER BY name
      `)
      return NextResponse.json(result.rows)
    }

    const result = await query(`
      SELECT
        sub.name AS subject, e.class, e.section,
        COUNT(DISTINCT es.student_id) AS total_students,
        COUNT(DISTINCT CASE WHEN em.absent = false AND (COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0)) >= (sub.theory_pass + sub.practical_pass) THEN es.student_id END) AS passed,
        COUNT(DISTINCT CASE WHEN em.absent = false AND (COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0)) < (sub.theory_pass + sub.practical_pass) THEN es.student_id END) AS failed,
        COALESCE(ROUND(AVG(CASE WHEN em.absent = false THEN COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0) END), 1), 0) AS average_marks,
        COALESCE(MAX(CASE WHEN em.absent = false THEN COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0) END), 0) AS highest_marks,
        COALESCE(MIN(CASE WHEN em.absent = false THEN COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0) END), 0) AS lowest_marks
      FROM cbse_exam_subjects sub
      JOIN cbse_exams e ON e.id = sub.exam_id
      LEFT JOIN cbse_exam_students es ON es.exam_id = e.id
      LEFT JOIN cbse_exam_marks em ON em.subject_id = sub.id AND em.student_id = es.student_id
      GROUP BY sub.name, e.class, e.section
      ORDER BY sub.name
    `)
    return NextResponse.json(result.rows)
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
