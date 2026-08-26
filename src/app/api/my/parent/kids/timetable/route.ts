import { NextRequest } from "next/server"
import { handle, requireRole, assertParentHasStudent, getStudentById, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["parent"])
  const { searchParams } = new URL(req.url)
  const studentId = parseInt(searchParams.get("studentId") || searchParams.get("student_id") || "0", 10)
  if (!studentId) throw new ApiError(400, "studentId is required")
  await assertParentHasStudent(ctx, studentId)
  const student = await getStudentById(studentId)

  const res = await query(
    `SELECT te.id, te.subject_name AS "subject", te.day, te.period,
       te.start_time AS "startTime", te.end_time AS "endTime", te.teacher_name AS "teacher"
     FROM timetable_entries te
     WHERE te.class_id = $1 AND te.section_id = $2
     ORDER BY CASE te.day
       WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4
       WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7 ELSE 8 END, te.period`,
    [student.class_id, student.section_id]
  )

  return { studentId, timetable: res.rows }
})
