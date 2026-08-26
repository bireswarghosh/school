import { NextRequest } from "next/server"
import { handle, requireRole, requireStaff, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

function today() {
  return new Date().toISOString().slice(0, 10)
}

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["teacher", "staff", "admin"])
  const staff = await requireStaff(ctx)
  const { searchParams } = new URL(req.url)
  const classId = parseInt(searchParams.get("classId") || searchParams.get("class_id") || "0", 10)
  const sectionId = parseInt(searchParams.get("sectionId") || searchParams.get("section_id") || "0", 10)
  const date = searchParams.get("date") || today()
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
    `SELECT s.id, s.roll_no AS "rollNo",
       COALESCE(TRIM(CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name)), s.name) AS "name",
       sa.id AS "attendanceId", sa.attendance_type_id AS "attendanceTypeId", sa.in_time AS "inTime",
       sa.out_time AS "outTime", at.type AS "attendanceType"
     FROM students s
     LEFT JOIN student_attendance sa ON sa.student_id = s.id AND sa.date = $3
     LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
     WHERE s.class_id = $1 AND s.section_id = $2
     ORDER BY s.roll_no`,
    [classId, sectionId, date]
  )

  return { classId, sectionId, date, records: res.rows }
})

export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["teacher", "staff", "admin"])
  const staff = await requireStaff(ctx)
  const body = await req.json()
  const { classId, sectionId, date = today(), records } = body || {}
  if (!classId || !sectionId) throw new ApiError(400, "classId and sectionId are required")
  if (!Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, "records[] is required")
  }

  const assigned = await query(
    `SELECT id FROM class_teachers WHERE class_id = $1 AND section_id = $2 AND teacher_name = $3`,
    [classId, sectionId, staff.name]
  )
  if (assigned.rows.length === 0) {
    throw new ApiError(403, "You are not assigned to this class/section")
  }

  const saved: any[] = []
  for (const rec of records) {
    const studentId = Number(rec.studentId || rec.student_id)
    if (!studentId) continue
    const typeId = rec.attendanceTypeId != null ? Number(rec.attendanceTypeId) : null
    const existing = await query(
      `SELECT id FROM student_attendance WHERE student_id = $1 AND date = $2`,
      [studentId, date]
    )
    if (existing.rows[0]) {
      await query(
        `UPDATE student_attendance SET attendance_type_id = $1, in_time = $2, out_time = $3 WHERE id = $4`,
        [typeId, rec.inTime || null, rec.outTime || null, existing.rows[0].id]
      )
    } else {
      await query(
        `INSERT INTO student_attendance (student_id, class_id, section_id, date, attendance_type_id, in_time, out_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [studentId, classId, sectionId, date, typeId, rec.inTime || null, rec.outTime || null]
      )
    }
    saved.push({ studentId, date })
  }

  return { success: true, date, saved: saved.length }
})
