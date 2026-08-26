import { NextRequest } from "next/server"
import { handle, requireRole, assertParentHasStudent, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

function asNumber(v: any): number | null {
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["parent"])
  const { searchParams } = new URL(req.url)
  const studentId = parseInt(searchParams.get("studentId") || searchParams.get("student_id") || "0", 10)
  if (!studentId) throw new ApiError(400, "studentId is required")
  await assertParentHasStudent(ctx, studentId)

  const s = (await query(`SELECT * FROM students WHERE id = $1`, [studentId])).rows[0]
  if (!s) throw new Error("Student not found")

  const [cls, sec, attendance] = await Promise.all([
    s.class_id ? query(`SELECT name FROM classes WHERE id = $1`, [s.class_id]) : Promise.resolve({ rows: [] }),
    s.section_id ? query(`SELECT name FROM sections WHERE id = $1`, [s.section_id]) : Promise.resolve({ rows: [] }),
    query(
      `SELECT at.type AS "type", COUNT(*)::int AS total
       FROM student_attendance sa
       LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
       WHERE sa.student_id = $1 GROUP BY at.type`,
      [s.id]
    ),
  ])

  const fullName = s.name || [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ") || null

  const attendanceSummary: Record<string, number> = {}
  for (const r of attendance.rows) {
    const key = r.type || "Other"
    attendanceSummary[key] = (attendanceSummary[key] || 0) + r.total
  }

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
      mobile: s.mobile,
      email: s.email,
      category: s.category,
      religion: s.religion,
      house: s.house,
      admissionDate: s.admission_date,
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
      motherName: s.mother_name,
      motherPhone: s.mother_phone,
      guardianIs: s.guardian_is,
      guardianName: s.guardian_name,
      guardianRelation: s.guardian_relation,
      guardianEmail: s.guardian_email,
      guardianPhone: s.guardian_phone,
    },
    bank: {
      bankAccountNo: s.bank_account_no,
      bankName: s.bank_name,
      ifscCode: s.ifsc_code,
    },
    attendance: {
      total: attendance.rows.reduce((sum: number, r: any) => sum + r.total, 0),
      summary: attendanceSummary,
    },
  }
})
