import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)

  if (!student.class_id || !student.section_id) {
    return { teachers: [] }
  }

  const result = await query(
    `SELECT DISTINCT
       te.teacher_name AS "teacherName",
       te.subject_name AS "subject",
       MIN(te.start_time) AS "time",
       st.email,
       st.phone,
       COALESCE(tr.rating, 0) AS "myRating",
       COALESCE(tr.comments, '') AS "myComment",
       tr.id AS "reviewId"
     FROM timetable_entries te
     LEFT JOIN staff st ON st.name = te.teacher_name AND st.status = 'Active'
     LEFT JOIN teacher_reviews tr ON tr.teacher_name = te.teacher_name
       AND tr.student_id = $1 AND tr.school_id = $2
     WHERE te.class_id = $3 AND te.section_id = $4
     GROUP BY te.teacher_name, te.subject_name, st.email, st.phone, tr.rating, tr.comments, tr.id
     ORDER BY te.teacher_name`,
    [student.id, student.school_id, student.class_id, student.section_id]
  )

  return { teachers: result.rows }
})

export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)

  const body = await req.json()
  const { teacherName, subject, rating, comments } = body

  if (!teacherName || !rating) {
    throw new ApiError(400, "Teacher name and rating are required")
  }

  const ratingNum = parseInt(String(rating))
  if (ratingNum < 1 || ratingNum > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5")
  }

  const existing = await query(
    `SELECT id FROM teacher_reviews WHERE student_id = $1 AND teacher_name = $2 AND school_id = $3`,
    [student.id, teacherName, student.school_id]
  )

  if (existing.rows.length > 0) {
    await query(
      `UPDATE teacher_reviews SET rating = $1, comments = $2, review_date = CURRENT_DATE WHERE id = $3`,
      [ratingNum, comments || "", existing.rows[0].id]
    )
    return { success: true, message: "Review updated" }
  } else {
    await query(
      `INSERT INTO teacher_reviews (student_id, teacher_name, subject, rating, comments, review_date, school_id)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6)`,
      [student.id, teacherName, subject || null, ratingNum, comments || "", student.school_id]
    )
    return { success: true, message: "Review submitted" }
  }
})
