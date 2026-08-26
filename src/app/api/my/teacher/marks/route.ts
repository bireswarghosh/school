import { NextRequest } from "next/server"
import { handle, requireRole, requireStaff, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

async function assertAssigned(ctx: any, staff: any, classId: number, sectionId: number) {
  if (ctx.role === "admin") return
  const assigned = await query(
    `SELECT id FROM class_teachers WHERE class_id = $1 AND section_id = $2 AND teacher_name = $3`,
    [classId, sectionId, staff.name]
  )
  if (assigned.rows.length === 0) {
    throw new ApiError(403, "You are not assigned to this class/section")
  }
}

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["teacher", "staff", "admin"])
  const staff = await requireStaff(ctx)
  const { searchParams } = new URL(req.url)
  const examId = parseInt(searchParams.get("examId") || "0", 10)
  const subjectId = parseInt(searchParams.get("subjectId") || searchParams.get("examSubjectId") || "0", 10)
  const classId = parseInt(searchParams.get("classId") || "0", 10)
  const sectionId = parseInt(searchParams.get("sectionId") || "0", 10)
  if (!examId || !subjectId || !classId || !sectionId) {
    throw new ApiError(400, "examId, subjectId (exam_subjects.id), classId and sectionId are required")
  }
  await assertAssigned(ctx, staff, classId, sectionId)

  const res = await query(
    `SELECT s.id AS "studentId", s.roll_no AS "rollNo",
       COALESCE(TRIM(CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name)), s.name) AS "name",
       em.id AS "markId", em.theory_marks AS "theoryMarks", em.practical_marks AS "practicalMarks",
       em.absent, em.notes
     FROM students s
     LEFT JOIN exam_marks em ON em.student_id = s.id AND em.exam_id = $1 AND em.subject_id = $2
     WHERE s.class_id = $3 AND s.section_id = $4
     ORDER BY s.roll_no`,
    [examId, subjectId, classId, sectionId]
  )

  return {
    examId,
    subjectId,
    classId,
    sectionId,
    records: res.rows.map((r: any) => ({
      ...r,
      studentId: Number(r.studentId),
      markId: r.markId ? Number(r.markId) : null,
      theoryMarks: r.theoryMarks != null ? Number(r.theoryMarks) : null,
      practicalMarks: r.practicalMarks != null ? Number(r.practicalMarks) : null,
      absent: Boolean(r.absent),
    })),
  }
})

export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["teacher", "staff", "admin"])
  const staff = await requireStaff(ctx)
  const body = await req.json()
  const { examId, subjectId, classId, sectionId, records } = body || {}
  if (!examId || !subjectId || !classId || !sectionId) {
    throw new ApiError(400, "examId, subjectId, classId and sectionId are required")
  }
  if (!Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, "records[] is required")
  }
  await assertAssigned(ctx, staff, Number(classId), Number(sectionId))

  let saved = 0
  for (const rec of records as any[]) {
    const studentId = Number(rec.studentId)
    if (!studentId) continue
    const existing = await query(
      `SELECT id FROM exam_marks WHERE exam_id = $1 AND subject_id = $2 AND student_id = $3`,
      [Number(examId), Number(subjectId), studentId]
    )
    const vals = [
      rec.theoryMarks != null ? Number(rec.theoryMarks) : 0,
      rec.practicalMarks != null ? Number(rec.practicalMarks) : 0,
      Boolean(rec.absent),
      rec.notes || null,
    ]
    if (existing.rows[0]) {
      await query(
        `UPDATE exam_marks SET theory_marks=$1, practical_marks=$2, absent=$3, notes=$4 WHERE id=$5`,
        [...vals, existing.rows[0].id]
      )
    } else {
      await query(
        `INSERT INTO exam_marks (exam_id, subject_id, student_id, theory_marks, practical_marks, absent, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [Number(examId), Number(subjectId), studentId, ...vals]
      )
    }
    saved++
  }

  return { success: true, saved }
})
