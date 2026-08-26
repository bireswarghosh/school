import { NextRequest } from "next/server"
import { handle, requireRole, requireStaff } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["teacher", "staff", "admin"])
  const staff = await requireStaff(ctx)

  const classesRes = await query(
    `SELECT ct.id, ct.class_id AS "classId", c.name AS "className", ct.section_id AS "sectionId",
       s.name AS "sectionName", ct.teacher_name AS "teacher"
     FROM class_teachers ct
     LEFT JOIN classes c ON c.id = ct.class_id
     LEFT JOIN sections s ON s.id = ct.section_id
     WHERE ct.teacher_name = $1
     ORDER BY c.order_number, s.name`,
    [staff.name]
  )

  const subjectsRes = await query(
    `SELECT DISTINCT te.subject_name AS "subject"
     FROM timetable_entries te
     WHERE te.teacher_name = $1 AND te.subject_name IS NOT NULL`,
    [staff.name]
  )

  return {
    teacherId: Number(staff.id),
    name: staff.name,
    classes: classesRes.rows,
    subjects: subjectsRes.rows.map((r) => r.subject),
  }
})
