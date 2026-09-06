import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent, requireStaff, getParentKids } from "@/lib/my-api"
import { query } from "@/lib/db"

function today() {
  return new Date().toISOString().slice(0, 10)
}

function dayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" })
}

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent", "teacher", "staff", "admin"])
  const role = ctx.role

  if (role === "student") {
    const student = await requireStudent(ctx)
    const todayStr = today()
    const dow = dayName()

    const data = await Promise.all([
      query(
        `SELECT at.type AS "type", COUNT(*)::int AS total FROM student_attendance sa LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id WHERE sa.student_id = $1 GROUP BY at.type`,
        [student.id]
      ),
      student.class_id ? query(`SELECT name FROM classes WHERE id = $1`, [student.class_id]) : Promise.resolve({ rows: [] }),
      student.section_id ? query(`SELECT name FROM sections WHERE id = $1`, [student.section_id]) : Promise.resolve({ rows: [] }),
      query(
        `SELECT at.type AS "type", COUNT(*)::int AS total FROM student_attendance sa LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id WHERE sa.student_id = $1 AND sa.date = $2 GROUP BY at.type`,
        [student.id, todayStr]
      ),
      query(`SELECT COUNT(*)::int AS total FROM homework WHERE class_id = $1 AND section_id = $2`, [student.class_id, student.section_id]),
      query(
        `SELECT h.id, h.homework_date AS "homeworkDate", h.submission_date AS "submissionDate", h.description, h.document,
           su.name AS "subject", c.name AS "className", s.name AS "sectionName"
         FROM homework h LEFT JOIN subjects su ON su.id = h.subject_id
         LEFT JOIN classes c ON c.id = h.class_id LEFT JOIN sections s ON s.id = h.section_id
         WHERE h.class_id = $1 AND h.section_id = $2 ORDER BY h.homework_date DESC LIMIT 5`,
        [student.class_id, student.section_id]
      ),
      query(
        `SELECT em.theory_marks AS "theoryMarks", em.practical_marks AS "practicalMarks", em.absent,
           esub.name AS "subject", esub.theory_max AS "theoryMax", esub.practical_max AS "practicalMax"
         FROM exam_marks em
         LEFT JOIN exam_subjects esub ON esub.id = em.subject_id
         LEFT JOIN exams ex ON ex.id = em.exam_id
         WHERE em.student_id = $1 AND ex.publish_result = true
         ORDER BY ex.id DESC, esub.name`,
        [student.id]
      ),
      query(
        `SELECT id, title, notice_date AS "noticeDate", publish_date AS "publishDate", message
         FROM notices ORDER BY publish_date DESC NULLS LAST, notice_date DESC NULLS LAST LIMIT 4`
      ),
      query(
        `SELECT id, subject_name AS "subject", day, period, start_time AS "startTime", end_time AS "endTime", teacher_name AS "teacher"
         FROM timetable_entries WHERE class_id = $1 AND section_id = $2 AND day = $3 ORDER BY period`,
        [student.class_id, student.section_id, dow]
      ),
      query(
        `SELECT bi.id, b.name AS "book", b.book_number AS "bookNumber", b.author,
           bi.issue_date AS "issueDate", bi.return_date AS "returnDate", bi.status
         FROM book_issues bi LEFT JOIN books b ON b.id = bi.book_id
         WHERE bi.member_type = 'student' AND bi.member_id = $1 AND bi.status = 'Issued' ORDER BY bi.id DESC`,
        [String(student.id)]
      ),
      query(
        `SELECT fm.amount, fm.due_date AS "dueDate", ft.name AS "feesType"
         FROM fees_masters fm LEFT JOIN fees_types ft ON ft.id = fm.fees_type_id
         WHERE fm.class_id = $1 AND fm.status = 'Active' ORDER BY fm.id`,
        [student.class_id]
      ),
      query(
        `SELECT fp.amount, fp.paid_amount AS "paidAmount", fp.status, ft.name AS "feesType"
         FROM fees_payments fp LEFT JOIN fees_types ft ON ft.id = fp.fees_type_id
         WHERE fp.student_id = $1 ORDER BY fp.id DESC`,
        [student.id]
      ),
      query(
        `SELECT DISTINCT ct.teacher_name AS "name"
         FROM class_teachers ct WHERE ct.class_id = $1 AND ct.section_id = $2`,
        [student.class_id, student.section_id]
      ),
      query(
        `SELECT s.name, s.email, s.phone FROM staff s WHERE s.status = 'Active'`
      ),
      query(`SELECT COUNT(*)::int AS total FROM students WHERE class_id = $1 AND section_id = $2 AND status = 'Active'`, [student.class_id, student.section_id]),
      query(
        `SELECT vb.id, vb.name, vb.date, vb.in_time AS "inTime", vb.out_time AS "outTime", vb.meeting_with AS "meetingWith",
                vb.class_name AS "className", vb.section, vb.meeting_person AS "meetingPerson",
                pt.name AS "purpose"
         FROM visitor_book vb LEFT JOIN purpose_types pt ON pt.id = vb.purpose_type_id
         ORDER BY vb.date DESC, vb.id DESC LIMIT 6`
      ),
    ])

    const attendance = data[0]
    const classRes = data[1]
    const sectionRes = data[2]
    const attToday = data[3]
    const hwCount = data[4]
    const hwRes = data[5]
    const examRes = data[6]
    const noticeRes = data[7]
    const timetableRes = data[8]
    const libraryRes = data[9]
    const feeMasterRes = data[10]
    const feePayRes = data[11]
    const teacherRes = data[12]
    const staffRes = data[13]
    const studentsCount = data[14]
    const visitorRes = data[15]

    const className = classRes.rows[0]?.name || null
    const sectionName = sectionRes.rows[0]?.name || null
    const fullName = student.name || [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ") || "Student"

    const attSummary: Record<string, number> = {}
    for (const r of attendance.rows) attSummary[r.type || "Other"] = (attSummary[r.type || "Other"] || 0) + r.total
    const attTotal = attendance.rows.reduce((s: number, r: any) => s + r.total, 0)
    const attPresent = (attSummary["Present"] || 0) + (attSummary["Late"] || 0)
    const attPct = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : null

    const presentToday = attToday.rows.reduce((s: number, r: any) => s + r.total, 0)

    const subjectMap = new Map<string, { marks: number; max: number }>()
    for (const r of examRes.rows) {
      const sub = r.subject || "Unknown"
      const prev = subjectMap.get(sub) || { marks: 0, max: 0 }
      prev.marks += Number(r.theoryMarks || 0) + Number(r.practicalMarks || 0)
      prev.max += Number(r.theoryMax || 100) + Number(r.practicalMax || 0)
      subjectMap.set(sub, prev)
    }
    const examSubjects = [...subjectMap.entries()].map(([subject, v]) => ({
      subject, percentage: v.max > 0 ? Math.round((v.marks / v.max) * 100) : 0,
    }))

    const totalDue = feeMasterRes.rows.reduce((s: number, m: any) => {
      const paid = feePayRes.rows.filter((p: any) => ["paid", "success"].includes(String(p.status || "").toLowerCase()) && p.feesType === m.feesType).reduce((ps: number, p: any) => ps + Number(p.paidAmount || p.amount || 0), 0)
      return s + Math.max(0, Number(m.amount) - paid)
    }, 0)

    const allTeacherNames = new Set<string>()
    teacherRes.rows.forEach((r: any) => allTeacherNames.add(r.name))
    staffRes.rows.forEach((r: any) => allTeacherNames.add(r.name))
    const teachers = [...allTeacherNames].map((name) => {
      const staff = staffRes.rows.find((s: any) => s.name === name)
      const isClassTeacher = teacherRes.rows.some((r: any) => r.name === name)
      return { name, isClassTeacher, email: staff?.email || null, phone: staff?.phone || null }
    })

    return {
      role,
      name: fullName,
      studentId: Number(student.id),
      className,
      sectionName,
      photo: student.student_photo || null,
      profile: { admissionNo: student.admission_no, rollNo: student.roll_no, gender: student.gender, dob: student.dob },
      attendance: { total: attTotal, summary: attSummary, percentage: attPct },
      summary: {
        homework: hwCount.rows[0]?.total ?? 0,
        attendanceToday: presentToday,
        results: examRes.rows.length,
        feesDue: Math.round(totalDue),
        classmates: studentsCount.rows[0]?.total ?? 0,
      },
      notices: noticeRes.rows,
      timetable: timetableRes.rows.map((t: any) => ({ ...t, roomNo: `Room ${t.period || 1}`, time: `${t.startTime?.slice(0, 5) || ""}-${t.endTime?.slice(0, 5) || ""}` })),
      homework: hwRes.rows,
      examSubjects,
      teachers,
      library: libraryRes.rows,
      visitors: visitorRes.rows,
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
         FROM fees_masters fm JOIN students s ON s.class_id = fm.class_id
         WHERE s.id IN (${ids}) AND fm.status = 'Active' GROUP BY fm.class_id, fm.fees_type_id`
      )
      const paid = await query(
        `SELECT fees_type_id AS "feesTypeId", SUM(COALESCE(paid_amount, amount))::float AS paid
         FROM fees_payments WHERE student_id IN (${ids}) GROUP BY fees_type_id`
      )
      const paidMap = new Map(paid.rows.map((p) => [Number(p.feesTypeId), Number(p.paid)]))
      feeBalance = masters.rows.reduce((s, m) => s + Math.max(0, Number(m.amount) - (paidMap.get(Number(m.feesTypeId)) || 0)), 0)
    }
    return {
      role,
      name: "Parent",
      kids: kids.length,
      summary: { kids: kids.length, homework: hwTotal, feesBalance: Math.round(feeBalance) },
    }
  }

  const staff = await requireStaff(ctx)
  const assignedClasses = await query(`SELECT COUNT(*)::int AS total FROM class_teachers WHERE teacher_name = $1`, [staff.name])
  const studentsInClass = await query(
    `SELECT COUNT(*)::int AS total FROM students s WHERE (s.class_id, s.section_id) IN (SELECT class_id, section_id FROM class_teachers WHERE teacher_name = $1)`,
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
