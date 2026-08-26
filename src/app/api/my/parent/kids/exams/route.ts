import { NextRequest } from "next/server"
import { handle, requireRole, assertParentHasStudent, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["parent"])
  const { searchParams } = new URL(req.url)
  const studentId = parseInt(searchParams.get("studentId") || searchParams.get("student_id") || "0", 10)
  if (!studentId) throw new ApiError(400, "studentId is required")
  const kid = await assertParentHasStudent(ctx, studentId)

  const res = await query(
    `SELECT em.id, em.exam_id AS "examId", e.name AS "examName", e.publish_result AS "published",
       em.subject_id AS "subjectId", esub.name AS "subject",
       em.theory_marks AS "theoryMarks", em.practical_marks AS "practicalMarks", em.absent, em.notes
     FROM exam_marks em
     LEFT JOIN exams e ON e.id = em.exam_id
     LEFT JOIN exam_subjects esub ON esub.id = em.subject_id
     WHERE em.student_id = $1
     ORDER BY e.id DESC, esub.name`,
    [studentId]
  )

  return {
    studentId,
    student: kid,
    results: res.rows,
  }
})
