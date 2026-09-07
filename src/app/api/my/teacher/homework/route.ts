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
    `SELECT h.id, h.subject_id AS "subjectId", su.name AS "subject", h.homework_date AS "homeworkDate",
       h.submission_date AS "submissionDate", h.evaluation_date AS "evaluationDate", h.max_marks AS "maxMarks",
       h.marks_obtained AS "marksObtained", h.note, h.status, h.description, h.document, h.created_at AS "createdAt"
     FROM homework h
     LEFT JOIN subjects su ON su.id = h.subject_id
     WHERE h.class_id = $1 AND h.section_id = $2
     ORDER BY h.homework_date DESC`,
    [classId, sectionId]
  )

  return { classId, sectionId, homework: res.rows }
})

export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["teacher", "staff", "admin"])
  const staff = await requireStaff(ctx)
  const body = await req.json()
  const { classId, sectionId, subjectId, subjectName, homeworkDate, submissionDate, description, document } = body || {}
  if (!classId || !sectionId) throw new ApiError(400, "classId and sectionId are required")
  if (!description) throw new ApiError(400, "description is required")

  const assigned = await query(
    `SELECT id FROM class_teachers WHERE class_id = $1 AND section_id = $2 AND teacher_name = $3`,
    [classId, sectionId, staff.name]
  )
  if (assigned.rows.length === 0) {
    throw new ApiError(403, "You are not assigned to this class/section")
  }

  let resolvedSubjectId = subjectId ? Number(subjectId) : null
  if (!resolvedSubjectId && subjectName) {
    const subj = (
      await query(`SELECT id FROM subjects WHERE lower(name) = lower($1) ORDER BY id LIMIT 1`, [subjectName])
    ).rows[0]
    resolvedSubjectId = subj ? subj.id : null
  }

  const res = await query(
    `INSERT INTO homework (class_id, section_id, subject_id, homework_date, submission_date, description, document)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [classId, sectionId, resolvedSubjectId, homeworkDate || new Date().toISOString().slice(0, 10), submissionDate || null, description, document || null]
  )

  return { success: true, id: res.rows[0].id }
})