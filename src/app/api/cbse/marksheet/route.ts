import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { mapResponse } from "@/lib/field-mapping"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const examId = searchParams.get("exam_id")

    let sql = `
      SELECT
        st.id, st.name AS student_name, st.admission_no,
        e.class, e.section, e.name AS exam_name,
        COALESCE(m.total_marks, 0)::float AS grand_total,
        COALESCE(m.max_marks, 1)::float AS max_total,
        CASE WHEN COALESCE(m.max_marks, 0) > 0
          THEN ROUND((COALESCE(m.total_marks, 0)::numeric / m.max_marks) * 100, 1)::float
          ELSE 0::float
        END AS percentage,
        RANK() OVER (ORDER BY COALESCE(m.total_marks, 0) DESC)::int AS rank
      FROM cbse_exam_students es
      JOIN students st ON st.id = es.student_id
      JOIN cbse_exams e ON e.id = es.exam_id
      LEFT JOIN (
        SELECT em.student_id, em.exam_id,
          SUM(COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0)) AS total_marks,
          SUM(COALESCE(sub.theory_max, 0) + COALESCE(sub.practical_max, 0)) AS max_marks
        FROM cbse_exam_marks em
        JOIN cbse_exam_subjects sub ON sub.id = em.subject_id
        WHERE em.absent = false
        GROUP BY em.student_id, em.exam_id
      ) m ON m.student_id = es.student_id AND m.exam_id = es.exam_id
    `

    const params: (string | number)[] = []
    if (examId) {
      sql += ` WHERE es.exam_id = $${params.length + 1}::int`
      params.push(parseInt(examId))
    }
    sql += " ORDER BY rank"

    const result = await query(sql, params)
    return NextResponse.json(mapResponse(result.rows.map((r: any) => ({ ...r, subjects: [] }))))
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
