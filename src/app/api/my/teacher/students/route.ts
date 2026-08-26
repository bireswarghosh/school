import { NextRequest } from "next/server"
import { handle, requireRole, requireStaff, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["teacher", "staff", "admin"])
  const staff = await requireStaff(ctx)
  const { searchParams } = new URL(req.url)
  const classId = parseInt(searchParams.get("classId") || searchParams.get("class_id") || "0", 10)
  const sectionId = parseInt(searchParams.get("sectionId") || searchParams.get("section_id") || "0", 10)
  if (!classId || !sectionId) {
    throw new ApiError(400, "classId and sectionId are required")
  }

  const assigned = await query(
    `SELECT id FROM class_teachers WHERE class_id = $1 AND section_id = $2 AND teacher_name = $3`,
    [classId, sectionId, staff.name]
  )
  if (assigned.rows.length === 0) {
    throw new ApiError(403, "You are not assigned to this class/section")
  }

  const res = await query(
    `SELECT s.id, s.admission_no AS "admissionNo", s.roll_no AS "rollNo",
       COALESCE(TRIM(CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name)), s.name) AS "name",
       s.gender, s.dob, s.status
     FROM students s
     WHERE s.class_id = $1 AND s.section_id = $2
     ORDER BY s.roll_no`,
    [classId, sectionId]
  )

  return { classId, sectionId, students: res.rows }
})
