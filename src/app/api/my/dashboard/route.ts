import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent, requireStaff, getParentKids, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

function today() {
  return new Date().toISOString().slice(0, 10)
}

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent", "teacher", "staff", "admin"])
  const role = ctx.role

  if (role === "student") {
    const student = await requireStudent(ctx)
    const [hw, att, results, classes] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS total FROM homework WHERE class_id = $1 AND section_id = $2`,
        [student.class_id, student.section_id]
      ),
      query(
        `SELECT attendance_type_id AS "typeId", COUNT(*)::int AS total FROM student_attendance
         WHERE student_id = $1 AND date = $2 GROUP BY attendance_type_id`,
        [student.id, today()]
      ),
      query(`SELECT COUNT(*)::int AS total FROM exam_marks WHERE student_id = $1`, [student.id]),
      query(`SELECT name FROM classes WHERE id = $1`, [student.class_id]),
    ])

    const classInfo = classes.rows[0]?.name || null
    const presentToday = att.rows.find((r) => r.typeId != null) ? att.rows.reduce((s, r) => s + r.total, 0) : 0
    return {
      role,
      name: student.name || `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Student",
      className: classInfo,
      summary: {
        homework: hw.rows[0]?.total ?? 0,
        attendanceToday: presentToday,
        results: results.rows[0]?.total ?? 0,
      },
    }
  }

  if (role === "parent") {
    const kids = await getParentKids(ctx)
    const studentIds = kids.map((k) => Number(k.id))
    let hwTotal = 0
    let feeBalance = 0
    if (studentIds.length > 0) {
      const ids = studentIds.join(",")
      const hw = await query(
        `SELECT COUNT(*)::int AS total FROM homework h
         JOIN students s ON s.class_id = h.class_id AND s.section_id = h.section_id
         WHERE s.id IN (${ids})`
      )
      hwTotal = hw.rows[0]?.total ?? 0
      const masters = await query(
        `SELECT fm.class_id AS "classId", fm.fees_type_id AS "feesTypeId", SUM(fm.amount)::float AS amount
         FROM fees_masters fm
         JOIN students s ON s.class_id = fm.class_id
         WHERE s.id IN (${ids}) AND fm.status = 'Active'
         GROUP BY fm.class_id, fm.fees_type_id`
      )
      const paid = await query(
        `SELECT fees_type_id AS "feesTypeId", SUM(COALESCE(paid_amount, amount))::float AS paid
         FROM fees_payments WHERE student_id IN (${ids})
         GROUP BY fees_type_id`
      )
      const paidMap = new Map(paid.rows.map((p) => [Number(p.feesTypeId), Number(p.paid)]))
      feeBalance = masters.rows.reduce((s, m) => s + Math.max(0, Number(m.amount) - (paidMap.get(Number(m.feesTypeId)) || 0)), 0)
    }
    return {
      role,
      name: "Parent",
      kids: kids.length,
      summary: {
        kids: kids.length,
        homework: hwTotal,
        feesBalance: Math.round(feeBalance),
      },
    }
  }

  const staff = await requireStaff(ctx)
  const assignedClasses = await query(
    `SELECT COUNT(*)::int AS total FROM class_teachers WHERE teacher_name = $1`,
    [staff.name]
  )
  const studentsInClass = await query(
    `SELECT COUNT(*)::int AS total FROM students s
     WHERE (s.class_id, s.section_id) IN (
       SELECT class_id, section_id FROM class_teachers WHERE teacher_name = $1
     )`,
    [staff.name]
  )
  return {
    role,
    name: staff.name,
    summary: {
      classes: assignedClasses.rows[0]?.total ?? 0,
      students: studentsInClass.rows[0]?.total ?? 0,
    },
  }
})
