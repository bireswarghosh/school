import { query } from "@/lib/db"

export function usernameFromAdmissionNo(admissionNo: string): string {
  return String(admissionNo || "").trim()
}

export function parentUsernameFromAdmissionNo(admissionNo: string): string {
  return `${usernameFromAdmissionNo(admissionNo)}P`
}

export async function uniqueLoginUsername(preferred: string, excludeId?: number): Promise<string> {
  const base = usernameFromAdmissionNo(preferred) || "user"
  for (let i = 1; i < 1000; i++) {
    const candidate = i === 1 ? base : `${base}${i}`
    const sql = excludeId
      ? `SELECT id FROM users WHERE lower(username) = lower($1) AND id <> $2`
      : `SELECT id FROM users WHERE lower(username) = lower($1)`
    const args = excludeId ? [candidate, excludeId] : [candidate]
    const found = await query(sql, args)
    if (found.rows.length === 0) return candidate
  }
  return `${base}${Date.now()}`
}

export function isPortalRole(role: unknown): boolean {
  return role === "student" || role === "parent" || role === "Student" || role === "Parent"
}

export async function deriveLoginUsername(opts: {
  role: unknown
  admissionNo?: string
  schoolId: number
  userId?: number
}): Promise<string | null> {
  if (!isPortalRole(opts.role)) return null

  const role = String(opts.role).toLowerCase()

  if (opts.admissionNo) {
    const base = role === "parent"
      ? parentUsernameFromAdmissionNo(opts.admissionNo)
      : usernameFromAdmissionNo(opts.admissionNo)
    return uniqueLoginUsername(base, opts.userId)
  }

  if (!opts.userId) return null

  if (role === "student") {
    const r = await query(
      `SELECT admission_no FROM students WHERE user_id = $1 AND school_id = $2`,
      [opts.userId, opts.schoolId]
    )
    const admissionNo = r.rows[0]?.admission_no
    if (admissionNo) return uniqueLoginUsername(usernameFromAdmissionNo(String(admissionNo)), opts.userId)
  } else if (role === "parent") {
    const r = await query(
      `SELECT s.admission_no FROM student_guardians sg
       JOIN students s ON s.id = sg.student_id
       WHERE sg.parent_user_id = $1 AND sg.school_id = $2
       ORDER BY sg.id LIMIT 1`,
      [opts.userId, opts.schoolId]
    )
    const admissionNo = r.rows[0]?.admission_no
    if (admissionNo) return uniqueLoginUsername(parentUsernameFromAdmissionNo(String(admissionNo)), opts.userId)
  }

  return null
}