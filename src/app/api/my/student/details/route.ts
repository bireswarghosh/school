import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent } from "@/lib/my-api"
import { query } from "@/lib/db"

function asNumber(v: any): number | null {
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const s = await requireStudent(ctx)

  const [cls, sec, guardians, attendance, fees, exams, homework] = await Promise.all([
    s.class_id ? query(`SELECT name FROM classes WHERE id = $1`, [s.class_id]) : Promise.resolve({ rows: [] }),
    s.section_id ? query(`SELECT name FROM sections WHERE id = $1`, [s.section_id]) : Promise.resolve({ rows: [] }),
    query(
      `SELECT sg.parent_type AS "parentType", u.name, u.email, u.role
       FROM student_guardians sg
       LEFT JOIN users u ON u.id = sg.parent_user_id
       WHERE sg.student_id = $1`,
      [s.id]
    ),
    query(
      `SELECT at.type AS "type", COUNT(*)::int AS total
       FROM student_attendance sa
       LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
       WHERE sa.student_id = $1
       GROUP BY at.type`,
      [s.id]
    ),
    query(
      `SELECT fm.id, fm.amount, fm.due_date AS "dueDate", fm.status,
         ft.name AS "feesType", fg.name AS "feesGroup"
       FROM fees_masters fm
       LEFT JOIN fees_types ft ON ft.id = fm.fees_type_id
       LEFT JOIN fees_groups fg ON fg.id = fm.fees_group_id
       WHERE fm.class_id = $1 AND fm.status = 'Active'
       ORDER BY fm.id`,
      [s.class_id]
    ),
    query(
      `SELECT em.exam_id AS "examId", e.name AS "examName", e.publish_result AS "published",
         esub.name AS "subject", em.theory_marks AS "theoryMarks", em.practical_marks AS "practicalMarks", em.absent
       FROM exam_marks em
       LEFT JOIN exams e ON e.id = em.exam_id
       LEFT JOIN exam_subjects esub ON esub.id = em.subject_id
       WHERE em.student_id = $1
       ORDER BY e.id DESC, esub.name`,
      [s.id]
    ),
    query(
      `SELECT COUNT(*)::int AS total FROM homework WHERE class_id = $1 AND section_id = $2`,
      [s.class_id, s.section_id]
    ),
  ])

  const fullName = s.name || [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ") || null

  const attendanceSummary: Record<string, number> = {}
  for (const r of attendance.rows) {
    const key = r.type || "Other"
    attendanceSummary[key] = (attendanceSummary[key] || 0) + r.total
  }
  const attendanceTotal = attendance.rows.reduce((sum: number, r: any) => sum + r.total, 0)

  const dues = fees.rows.map((m: any) => ({
    masterId: Number(m.id),
    feesType: m.feesType,
    feesGroup: m.feesGroup,
    amount: Number(m.amount),
    dueDate: m.dueDate,
  }))
  const totalDue = dues.reduce((sum: number, d: any) => sum + d.amount, 0)

  const results = exams.rows
    .filter((r: any) => r.published)
    .map((r: any) => ({
      examId: Number(r.examId),
      examName: r.examName,
      subject: r.subject,
      theoryMarks: asNumber(r.theoryMarks),
      practicalMarks: asNumber(r.practicalMarks),
      absent: Boolean(r.absent),
    }))

  return {
    id: Number(s.id),
    student: {
      admissionNo: s.admission_no,
      rollNo: s.roll_no,
      name: fullName,
      firstName: s.first_name,
      middleName: s.middle_name,
      lastName: s.last_name,
      gender: s.gender,
      dob: s.dob,
      bloodGroup: s.blood_group,
      height: s.height,
      weight: s.weight,
      measureDate: s.measure_date,
      mobile: s.mobile,
      phone: s.phone,
      email: s.email,
      category: s.category,
      religion: s.religion,
      caste: s.caste,
      house: s.house,
      admissionDate: s.admission_date,
      previousSchool: s.previous_school,
      address: s.address,
      currentAddress: s.current_address,
      permanentAddress: s.permanent_address,
      note: s.note,
      session: s.session,
      rte: s.rte,
      studentPhoto: s.student_photo,
      status: s.status,
    },
    academic: {
      classId: asNumber(s.class_id),
      sectionId: asNumber(s.section_id),
      className: cls.rows[0]?.name ?? null,
      sectionName: sec.rows[0]?.name ?? null,
      session: s.session,
    },
    parent: {
      fatherName: s.father_name,
      fatherPhone: s.father_phone,
      fatherOccupation: s.father_occupation,
      motherName: s.mother_name,
      motherPhone: s.mother_phone,
      motherOccupation: s.mother_occupation,
      guardianIs: s.guardian_is,
      guardianName: s.guardian_name,
      guardianRelation: s.guardian_relation,
      guardianEmail: s.guardian_email,
      guardianPhone: s.guardian_phone,
      guardianOccupation: s.guardian_occupation,
      guardianAddress: s.guardian_address,
    },
    bank: {
      bankAccountNo: s.bank_account_no,
      bankName: s.bank_name,
      ifscCode: s.ifsc_code,
      nationalIdentificationNo: s.national_identification_no,
      localIdentificationNo: s.local_identification_no,
    },
    guardians: guardians.rows.map((g: any) => ({
      name: g.name,
      email: g.email,
      role: g.role,
      parentType: g.parentType,
    })),
    attendance: {
      total: attendanceTotal,
      summary: attendanceSummary,
    },
    fees: {
      totalDue,
      dues,
    },
    exams: {
      total: results.length,
      results,
    },
    homeworkCount: homework.rows[0]?.total ?? 0,
  }
})
