import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent, getClassSectionNames } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent"])
  const student = await requireStudent(ctx)

  const res = await query(
    `SELECT lp.id, lp.class_id AS "classId", lp.section_id AS "sectionId",
       lp.subject_id AS "subjectId", sub.name AS "subject",
       lp.lesson_id AS "lessonId", l.name AS "lesson", l.code AS "lessonCode",
       lp.topic_id AS "topicId", t.name AS "topic",
       lp.start_date AS "startDate", lp.end_date AS "endDate",
       lp.status AS "status", lp.description AS "description",
       ss.status AS "syllabusStatus", ss.percentage AS "percentage"
     FROM lesson_plans lp
     LEFT JOIN subjects sub ON sub.id = lp.subject_id
     LEFT JOIN lessons l ON l.id = lp.lesson_id
     LEFT JOIN topics t ON t.id = lp.topic_id
     LEFT JOIN syllabus_statuses ss ON ss.class_id = lp.class_id AND ss.section_id = lp.section_id
        AND ss.subject_id = lp.subject_id AND ss.lesson_id = lp.lesson_id AND ss.topic_id = lp.topic_id
     WHERE lp.class_id = $1 AND lp.section_id = $2
     ORDER BY lp.id`,
    [student.class_id, student.section_id]
  )

  const { className, sectionName } = await getClassSectionNames(student.class_id, student.section_id)

  const plans = res.rows.map((p: any) => ({
    id: Number(p.id),
    subject: p.subject || null,
    lesson: p.lesson || null,
    lessonCode: p.lessonCode || null,
    topic: p.topic || null,
    startDate: p.startDate,
    endDate: p.endDate,
    status: p.status || p.syllabusStatus || "Pending",
    percentage: p.percentage != null ? Number(p.percentage) : null,
    description: p.description || null,
  }))

  const completed = plans.filter((p: any) => /completed/i.test(p.status)).length
  const inProgress = plans.filter((p: any) => /in progress|started/i.test(p.status)).length

  return {
    studentId: Number(student.id),
    className,
    sectionName,
    summary: { total: plans.length, completed, inProgress },
    plans,
  }
})
