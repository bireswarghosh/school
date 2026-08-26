import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)

  const res = await query(
    `SELECT h.id, h.class_id AS "classId", h.section_id AS "sectionId", h.subject_id AS "subjectId",
       h.homework_date AS "homeworkDate", h.submission_date AS "submissionDate", h.description, h.document,
       su.name AS "subject", c.name AS "className", s.name AS "sectionName", h.created_at AS "createdAt"
     FROM homework h
     LEFT JOIN subjects su ON su.id = h.subject_id
     LEFT JOIN classes c ON c.id = h.class_id
     LEFT JOIN sections s ON s.id = h.section_id
     WHERE h.class_id = $1 AND h.section_id = $2
     ORDER BY h.homework_date DESC`,
    [student.class_id, student.section_id]
  )

  return { studentId: Number(student.id), homework: res.rows }
})
