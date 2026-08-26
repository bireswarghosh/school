import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

function monthRange(month?: string | null) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number)
    const start = new Date(Date.UTC(y, m - 1, 1))
    const end = new Date(Date.UTC(y, m, 0))
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
  }
  const now = new Date()
  return monthRange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
}

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)
  const { searchParams } = new URL(req.url)
  const range = monthRange(searchParams.get("month"))

  const res = await query(
    `SELECT sa.id, sa.date, sa.in_time AS "inTime", sa.out_time AS "outTime",
       at.type AS "attendanceType", sa.created_at AS "recordedAt"
     FROM student_attendance sa
     LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
     WHERE sa.student_id = $1 AND sa.date >= $2 AND sa.date <= $3
     ORDER BY sa.date DESC`,
    [student.id, range.start, range.end]
  )

  const summary: Record<string, number> = {}
  for (const r of res.rows) {
    const key = r.attendanceType || "Other"
    summary[key] = (summary[key] || 0) + 1
  }

  return {
    studentId: Number(student.id),
    month: range.start.slice(0, 7),
    summary,
    records: res.rows,
  }
})
