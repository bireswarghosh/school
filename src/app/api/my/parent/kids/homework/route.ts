import { NextRequest } from "next/server"
import { handle, requireRole, assertParentHasStudent, ApiError, getStudentById } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["parent"])
  const { searchParams } = new URL(req.url)
  const studentId = parseInt(searchParams.get("studentId") || searchParams.get("student_id") || "0", 10)
  if (!studentId) throw new ApiError(400, "studentId is required")
  await assertParentHasStudent(ctx, studentId)
  const student = await getStudentById(studentId)

  const res = await query(
    `SELECT h.id, h.subject_id AS "subjectId", su.name AS "subject", h.homework_date AS "homeworkDate",
       h.submission_date AS "submissionDate", h.description, h.document, h.created_at AS "createdAt"
     FROM homework h
     LEFT JOIN subjects su ON su.id = h.subject_id
     WHERE h.class_id = $1 AND h.section_id = $2
     ORDER BY h.homework_date DESC`,
    [student.class_id, student.section_id]
  )

  return { studentId, homework: res.rows }
})
