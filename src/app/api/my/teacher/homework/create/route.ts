import { NextRequest } from "next/server"
import { handle, requireRole, requireStaff, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["teacher", "staff", "admin"])
  const staff = await requireStaff(ctx)
  const body = await req.json()
  const { classId, sectionId, subjectId, homeworkDate, submissionDate, description, document } = body || {}
  if (!classId || !sectionId || !description) {
    throw new ApiError(400, "classId, sectionId and description are required")
  }

  if (ctx.role !== "admin") {
    const assigned = await query(
      `SELECT id FROM class_teachers WHERE class_id = $1 AND section_id = $2 AND teacher_name = $3`,
      [Number(classId), Number(sectionId), staff.name]
    )
    if (assigned.rows.length === 0) {
      throw new ApiError(403, "You are not assigned to this class/section")
    }
  }

  const res = await query(
    `INSERT INTO homework (class_id, section_id, subject_id, homework_date, submission_date, description, document)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      Number(classId),
      Number(sectionId),
      subjectId ? Number(subjectId) : null,
      homeworkDate || new Date().toISOString().slice(0, 10),
      submissionDate || null,
      description,
      document || null,
    ]
  )

  return {
    success: true,
    homework: {
      id: Number(res.rows[0].id),
      classId: Number(classId),
      sectionId: Number(sectionId),
      subjectId: res.rows[0].subject_id ? Number(res.rows[0].subject_id) : null,
      homeworkDate: res.rows[0].homework_date,
      submissionDate: res.rows[0].submission_date,
      description: res.rows[0].description,
    },
  }
})
