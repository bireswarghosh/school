import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent, getParentKids, ApiError, type MyContext } from "@/lib/my-api"
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

// Resolve a student id the current user is allowed to see, throwing otherwise.
// student: self · parent: own child · teacher/staff/admin: any student in their school.
async function resolveStudentId(ctx: MyContext, studentId: number): Promise<number> {
  if (ctx.role === "student") {
    const me = await requireStudent(ctx)
    return Number(me.id)
  }
  if (ctx.role === "parent") {
    if (!studentId) throw new ApiError(400, "studentId is required")
    const kids = await getParentKids(ctx)
    const kid = kids.find((k) => Number(k.id) === Number(studentId))
    if (!kid) throw new ApiError(403, "This student is not linked to your login")
    return Number(kid.id)
  }
  // teacher / staff / admin — school scoping (x-school-id) isolates tenants
  return studentId
}

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent", "teacher", "staff", "admin"])
  const { searchParams } = new URL(req.url)
  const rawStudentId = parseInt(searchParams.get("studentId") || searchParams.get("student_id") || "0", 10)
  const studentId = await resolveStudentId(ctx, rawStudentId)
  const month = searchParams.get("month")
  const date = searchParams.get("date")

  if (date) {
    const res = await query(
      `SELECT id, student_id AS "studentId", date, note, created_by AS "createdBy"
       FROM student_attendance_notes WHERE student_id = $1 AND date = $2`,
      [studentId, date]
    )
    return { studentId, date, note: res.rows[0]?.note ?? null }
  }

  const range = monthRange(month)
  const res = await query(
    `SELECT id, student_id AS "studentId", date, note, created_by AS "createdBy"
     FROM student_attendance_notes
     WHERE student_id = $1 AND date >= $2 AND date <= $3
     ORDER BY date DESC`,
    [studentId, range.start, range.end]
  )
  return { studentId, month: range.start.slice(0, 7), notes: res.rows }
})

export const PUT = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent", "teacher", "staff", "admin"])
  const body = await req.json()
  const { studentId: rawStudentId, date, note } = body || {}
  if (!date) throw new ApiError(400, "date is required")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new ApiError(400, "invalid date")
  const studentId = await resolveStudentId(ctx, parseInt(String(rawStudentId || "0"), 10))

  const existing = await query(
    `SELECT id FROM student_attendance_notes WHERE student_id = $1 AND date = $2`,
    [studentId, date]
  )
  const cleaned = typeof note === "string" && note.trim() ? note.trim() : null

  if (existing.rows[0]) {
    if (cleaned == null) {
      await query(`DELETE FROM student_attendance_notes WHERE id = $1`, [existing.rows[0].id])
      return { studentId, date, note: null, deleted: true }
    }
    const res = await query(
      `UPDATE student_attendance_notes SET note = $1, updated_at = NOW() WHERE id = $2 RETURNING id, student_id AS "studentId", date, note`,
      [cleaned, existing.rows[0].id]
    )
    return res.rows[0]
  }

  const res = await query(
    `INSERT INTO student_attendance_notes (student_id, date, note, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, student_id AS "studentId", date, note`,
    [studentId, date, cleaned, ctx.userId]
  )
  return res.rows[0]
})