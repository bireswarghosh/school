import { NextRequest } from "next/server"
import { handle, requireRole, requireStaff } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["teacher", "staff", "admin"])
  const staff = await requireStaff(ctx)

  const res = await query(
    `SELECT te.id, te.class_id AS "classId", c.name AS "className", te.section_id AS "sectionId",
       s.name AS "sectionName", te.subject_name AS "subject", te.day, te.period,
       te.start_time AS "startTime", te.end_time AS "endTime"
     FROM timetable_entries te
     LEFT JOIN classes c ON c.id = te.class_id
     LEFT JOIN sections s ON s.id = te.section_id
     WHERE te.teacher_name = $1
     ORDER BY CASE te.day
       WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4
       WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7 ELSE 8 END, te.period`,
    [staff.name]
  )

  return { teacherId: Number(staff.id), timetable: res.rows }
})
