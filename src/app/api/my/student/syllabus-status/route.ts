import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent, requireStaff, getClassSectionNames, assertParentHasStudent, getStudentById, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

function percentageFor(status: string, pct: number | null) {
  const p = Number(pct)
  if (!Number.isNaN(p)) return Math.min(100, Math.max(0, p))
  const s = String(status || "").toLowerCase()
  if (/^completed/.test(s)) return 100
  if (/in progress|started/.test(s)) return 50
  return 0
}

async function getFirstKid(ctx: any) {
  const res = await query(
    `SELECT s.* FROM students s
     JOIN student_guardians sg ON sg.student_id = s.id
     WHERE sg.parent_user_id = $1
     ORDER BY s.id DESC
     LIMIT 1`,
    [ctx.userId]
  )
  if (!res.rows[0]) throw new ApiError(404, "No student is linked to this login.")
  return res.rows[0]
}

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent", "teacher", "staff", "admin"])

  const { searchParams } = new URL(req.url)
  const reqClassId = parseInt(searchParams.get("class_id") || "0")
  const reqSectionId = parseInt(searchParams.get("section_id") || "0")
  const reqStudentId = parseInt(searchParams.get("student_id") || "0")

  let classId: number | null = null
  let sectionId: number | null = null
  let classes: any[] = []
  let activeStudentId: number | null = null

  if (ctx.role === "teacher" || ctx.role === "staff" || ctx.role === "admin") {
    const staff = await requireStaff(ctx)
    const taught = await query(
      `SELECT DISTINCT te.class_id AS "classId", c.name AS "className", te.section_id AS "sectionId", s.name AS "sectionName"
       FROM timetable_entries te
       LEFT JOIN classes c ON c.id = te.class_id
       LEFT JOIN sections s ON s.id = te.section_id
       WHERE te.teacher_name = $1 AND te.class_id IS NOT NULL
       ORDER BY c.name, s.name`,
      [staff.name]
    )
    classes = taught.rows

    if (reqClassId) {
      const match = classes.find((c: any) => Number(c.classId) === reqClassId && Number(c.sectionId) === reqSectionId)
      if (!match) throw new ApiError(403, "You do not teach this class/section")
      classId = reqClassId
      sectionId = reqSectionId
    } else if (classes.length > 0) {
      classId = Number(classes[0].classId)
      sectionId = Number(classes[0].sectionId)
    }
  } else if (ctx.role === "parent") {
    const kid = reqStudentId ? await assertParentHasStudent(ctx, reqStudentId) : null
    const sid = kid ? Number(kid.id) : (await getFirstKid(ctx)).id
    const student = await getStudentById(sid)
    activeStudentId = Number(student.id)
    classId = student.class_id
    sectionId = student.section_id
  } else {
    const student = await requireStudent(ctx)
    activeStudentId = Number(student.id)
    classId = student.class_id
    sectionId = student.section_id
  }

  const { className, sectionName } = await getClassSectionNames(classId, sectionId)

  const res = await query(
    `SELECT ss.id, ss.class_id AS "classId", ss.section_id AS "sectionId",
       ss.subject_id AS "subjectId", sub.name AS "subject",
       ss.lesson_id AS "lessonId", l.name AS "lesson",
       ss.topic_id AS "topicId", t.name AS "topic",
       ss.status AS "status", ss.percentage AS "percentage"
     FROM syllabus_statuses ss
     LEFT JOIN subjects sub ON sub.id = ss.subject_id
     LEFT JOIN lessons l ON l.id = ss.lesson_id
     LEFT JOIN topics t ON t.id = ss.topic_id
     WHERE ($1::int IS NULL OR ss.class_id = $1) AND ($2::int IS NULL OR ss.section_id = $2)
     ORDER BY sub.name, l.name, t.name, ss.id`,
    [classId, sectionId]
  )

  const items = res.rows.map((r: any) => ({
    id: Number(r.id),
    subjectId: r.subjectId != null ? Number(r.subjectId) : null,
    subject: r.subject || "—",
    lessonId: r.lessonId != null ? Number(r.lessonId) : null,
    lesson: r.lesson || "—",
    topicId: r.topicId != null ? Number(r.topicId) : null,
    topic: r.topic || "—",
    status: r.status || "Not Started",
    percentage: percentageFor(r.status, r.percentage),
  }))

  const subjects: any[] = []
  const subjectMap = new Map<number, any>()
  items.forEach((it: any) => {
    const key = it.subjectId ?? -1
    if (!subjectMap.has(key)) {
      const entry = {
        id: key,
        name: it.subject,
        items: [] as any[],
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        percentage: 0,
      }
      subjects.push(entry)
      subjectMap.set(key, entry)
    }
    const entry = subjectMap.get(key)
    entry.items.push(it)
    if (/^completed/i.test(it.status)) entry.completed++
    else if (/in progress|started/i.test(it.status)) entry.inProgress++
    else entry.notStarted++
    entry.total++
  })
  subjects.forEach((sub) => {
    sub.percentage = sub.total ? Math.round(((sub.completed + sub.inProgress * 0.5) / sub.total) * 100) : 0
  })

  const completed = items.filter((i: any) => /^completed/i.test(i.status)).length
  const inProgress = items.filter((i: any) => /in progress|started/i.test(i.status)).length
  const notStarted = items.filter((i: any) => !/^completed|in progress|started/i.test(i.status)).length
  const total = items.length

  return {
    classId,
    sectionId,
    className,
    sectionName,
    studentId: activeStudentId,
    summary: {
      total,
      completed,
      inProgress,
      notStarted,
      percentage: total ? Math.round(((completed + inProgress * 0.5) / total) * 100) : 0,
    },
    subjects,
    items,
    classes,
  }
})