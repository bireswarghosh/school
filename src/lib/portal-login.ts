import { query } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { usernameFromAdmissionNo, parentUsernameFromAdmissionNo, uniqueLoginUsername } from "@/lib/login-usernames"
import { studentPasswordFrom } from "@/lib/student-password"

export const DEFAULT_STUDENT_PASSWORD = "Stud@123"
export const DEFAULT_PARENT_PASSWORD = "Parent@1"

function hasValidEmail(v: unknown): boolean {
  return typeof v === "string" && v.includes("@") && v.trim().length > 3
}

async function findRoleId(role: string, schoolId: number): Promise<number | null> {
  const scoped = await query(`SELECT id FROM roles WHERE name = $1 AND school_id = $2`, [role, schoolId])
  if (scoped.rows[0]) return Number(scoped.rows[0].id)
  const system = await query(`SELECT id FROM roles WHERE name = $1 AND school_id IS NULL`, [role])
  return system.rows[0] ? Number(system.rows[0].id) : null
}

async function uniqueEmail(preferred: string | null | undefined): Promise<string | null> {
  const base = String(preferred || "").trim().toLowerCase()
  const at = base.indexOf("@")
  const local = at > 0 ? base.slice(0, at) : ""
  const domain = at > 0 ? base.slice(at + 1) : ""
  if (!local || !domain) return null
  for (let i = 0; i < 500; i++) {
    const candidate = i === 0 ? base : `${local}${i}@${domain}`
    const found = await query(`SELECT id FROM users WHERE lower(email) = lower($1)`, [candidate])
    if (found.rows.length === 0) return candidate
  }
  return null
}

export type PortalLoginResult = {
  studentUserId?: number
  parentUserId?: number
  studentUsername?: string
  parentUsername?: string
  studentEmail?: string | null
  parentEmail?: string | null
  createdStudent?: boolean
  createdParent?: boolean
  skipped?: boolean
}

/**
 * Ensures a student and a parent login exist for a student record.
 * Username = admission number without dashes; parent username = same + "P".
 * New accounts get the 8-character default password. Creates the
 * students.user_id and student_guardians links when they are missing.
 */
export async function provisionPortalLogin(
  student: Record<string, any>,
  schoolId: number,
  schoolCode?: string
): Promise<PortalLoginResult> {
  const admissionBase = usernameFromAdmissionNo(student.admission_no)
  if (!admissionBase) return { skipped: true }

  const code = String(schoolCode || "school").toLowerCase().replace(/[^a-z0-9]/g, "")
  const synthDomain = `${code || "school"}.school`
  const studentRoleId = await findRoleId("student", schoolId)
  const parentRoleId = await findRoleId("parent", schoolId)

  const result: PortalLoginResult = {}
  const studentName = String(
    student.name || [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ") || "Student"
  ).trim()

  // ---------------- Student login ----------------
  if (student.user_id) {
    result.studentUserId = Number(student.user_id)
    result.studentUsername = await uniqueLoginUsername(admissionBase, result.studentUserId)
    await query(`UPDATE users SET username = $1 WHERE id = $2`, [result.studentUsername, result.studentUserId])
  } else {
    const username = await uniqueLoginUsername(admissionBase)
    const rawEmail = hasValidEmail(student.email) ? student.email : `${admissionBase}@${synthDomain}`
    const email = await uniqueEmail(rawEmail)
    const ins = await query(
      `INSERT INTO users (username, name, email, password_hash, role, role_id, school_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Active') RETURNING id`,
      [
        username,
        studentName,
        email,
        hashPassword(studentPasswordFrom(student.first_name, student.dob) || DEFAULT_STUDENT_PASSWORD),
        "student",
        studentRoleId,
        schoolId,
      ]
    )
    result.studentUserId = Number(ins.rows[0].id)
    result.studentUsername = username
    result.studentEmail = email
    result.createdStudent = true
    await query(`UPDATE students SET user_id = $1 WHERE id = $2`, [result.studentUserId, Number(student.id)])
  }

  // ---------------- Parent login ----------------
  const guard = await query(
    `SELECT parent_user_id FROM student_guardians WHERE student_id = $1 ORDER BY id LIMIT 1`,
    [Number(student.id)]
  )
  const existingParentId = guard.rows[0] ? Number(guard.rows[0].parent_user_id) : null

  if (existingParentId) {
    result.parentUserId = existingParentId
    result.parentUsername = await uniqueLoginUsername(parentUsernameFromAdmissionNo(student.admission_no), existingParentId)
    await query(`UPDATE users SET username = $1 WHERE id = $2`, [result.parentUsername, existingParentId])
  } else {
    const username = await uniqueLoginUsername(parentUsernameFromAdmissionNo(student.admission_no))
    const rawEmail = hasValidEmail(student.guardian_email)
      ? student.guardian_email
      : `${admissionBase.toLowerCase()}p@${synthDomain}`
    const email = await uniqueEmail(rawEmail)
    const parentName = String(
      student.guardian_name || student.father_name || student.mother_name || "Parent"
    ).trim() || "Parent"
    const ins = await query(
      `INSERT INTO users (username, name, email, password_hash, role, role_id, school_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Active') RETURNING id`,
      [username, parentName, email, hashPassword(DEFAULT_PARENT_PASSWORD), "parent", parentRoleId, schoolId]
    )
    result.parentUserId = Number(ins.rows[0].id)
    result.parentUsername = username
    result.parentEmail = email
    result.createdParent = true
    await query(
      `INSERT INTO student_guardians (student_id, parent_user_id, parent_type, school_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [Number(student.id), result.parentUserId, String(student.guardian_is || "Guardian").slice(0, 50), schoolId]
    )
  }

  return result
}