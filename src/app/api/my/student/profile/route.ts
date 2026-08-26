import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)

  const cls = student.class_id
    ? (await query(`SELECT name FROM classes WHERE id = $1`, [student.class_id])).rows[0]
    : null
  const sec = student.section_id
    ? (await query(`SELECT name FROM sections WHERE id = $1`, [student.section_id])).rows[0]
    : null

  const name =
    student.name ||
    [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ") ||
    null

  const user = await query(`SELECT email FROM users WHERE id = $1`, [ctx.userId])

  return {
    id: Number(student.id),
    admissionNo: student.admission_no,
    rollNo: student.roll_no,
    name,
    email: user.rows[0]?.email ?? null,
    gender: student.gender,
    dob: student.dob,
    className: cls?.name ?? null,
    sectionName: sec?.name ?? null,
    status: student.status,
  }
})
