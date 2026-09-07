import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)

  const result = await query(
    `SELECT c.id, c.name AS "title", c.description, c.image_url AS "thumbnail",
       c.teacher_name AS "teacher", c.is_free AS "free", c.price, c.discount,
       c.category_id AS "categoryId", cat.name AS "category",
       COALESCE(ce.enrolled, false) AS "enrolled",
       ce.enrolled_at AS "enrolledAt"
     FROM courses c
     LEFT JOIN course_categories cat ON cat.id = c.category_id
     LEFT JOIN (
       SELECT course_id, true AS "enrolled", enrolled_at
       FROM course_enrollments
       WHERE student_id = $1
     ) ce ON ce.course_id = c.id
     ORDER BY c.id DESC`,
    [student.id]
  )

  return { courses: result.rows }
})

export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)

  const body = await req.json()
  const { courseId } = body

  if (!courseId) {
    throw new ApiError(400, "courseId is required")
  }

  const existing = await query(
    `SELECT id FROM course_enrollments WHERE student_id = $1 AND course_id = $2 AND school_id = $3`,
    [student.id, courseId, student.school_id]
  )

  if (existing.rows.length > 0) {
    throw new ApiError(400, "You are already enrolled in this course")
  }

  await query(
    `INSERT INTO course_enrollments (student_id, course_id, school_id, enrolled_at)
     VALUES ($1, $2, $3, NOW())`,
    [student.id, courseId, student.school_id]
  )

  return { success: true, message: "Successfully enrolled" }
})
