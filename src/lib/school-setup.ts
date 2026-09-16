import { query } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export function schoolUsernamePrefix(name: string): string {
  const words = String(name || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const letters = words.slice(0, 3).map((w) => w[0] || "").join("")
  return letters || String(name || "").slice(0, 3).toLowerCase() || "sch"
}

export function schoolSlug(name: string): string {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "school"
}

export async function generateUniqueUsername(preferred: string): Promise<string> {
  const base = String(preferred || "user").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 30) || "user"
  const check = await query(`SELECT id FROM users WHERE lower(username) = lower($1)`, [base])
  if (check.rows.length === 0) return base
  for (let i = 1; i < 1000; i++) {
    const candidate = `${base}${i}`
    const found = await query(`SELECT id FROM users WHERE lower(username) = lower($1)`, [candidate])
    if (found.rows.length === 0) return candidate
  }
  return `${base}${Date.now()}`
}

export type DemoRoleSpec = {
  role: string
  label: string
  password: string
}

// General-setting page currency formats (general.currencyFormat) that can be
// derived from the school profile's ISO currency code.
const CURRENCY_FORMAT: Record<string, string> = {
  INR: "₹ (INR)",
  USD: "$ (USD)",
  EUR: "€ (EUR)",
  GBP: "£ (GBP)",
  AED: "AED",
  JPY: "¥ (JPY)",
}

const GENERAL_TIMEZONES = [
  "UTC", "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "America/New_York",
  "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London",
  "Europe/Paris", "Australia/Sydney",
]

export { GENERAL_TIMEZONES }

export function currencyFormatLabel(code: string | null | undefined): string | undefined {
  if (!code) return undefined
  return CURRENCY_FORMAT[String(code).toUpperCase()]
}

export function currencyCodeFromFormat(format: string | undefined | null): string | undefined {
  if (!format) return undefined
  for (const [code, fmt] of Object.entries(CURRENCY_FORMAT)) {
    if (fmt === format) return code
  }
  return undefined
}

export type GeneralSyncFields = {
  name?: string | null
  code?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  currency?: string | null
  timezone?: string | null
}

/**
 * Mirrors the school profile (managed by the super admin) into the school's
 * own General Setting rows (school_settings, `general.*` keys) so the school
 * admin's System Setting / General Setting page auto-fills from the profile.
 */
export async function syncSchoolGeneralSettings(schoolId: number, fields: GeneralSyncFields): Promise<void> {
  const entries: [string, string][] = []
  if (fields.name) entries.push(["general.schoolName", fields.name])
  if (fields.code) entries.push(["general.schoolCode", fields.code])
  if (fields.phone != null) entries.push(["general.phone", fields.phone])
  if (fields.email != null) entries.push(["general.email", fields.email])
  if (fields.address != null) entries.push(["general.address", fields.address])
  const fmt = fields.currency ? CURRENCY_FORMAT[String(fields.currency).toUpperCase()] : undefined
  if (fmt) entries.push(["general.currencyFormat", fmt])
  if (fields.timezone && GENERAL_TIMEZONES.includes(fields.timezone)) entries.push(["general.timezone", fields.timezone])
  if (entries.length === 0) return

  for (const [key, value] of entries) {
    await query(
      `INSERT INTO school_settings (school_id, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (school_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [schoolId, key, value]
    )
  }
}

export const DEMO_ROLES: DemoRoleSpec[] = [
  { role: "admin", label: "Admin", password: "Admin@123" },
  { role: "teacher", label: "Teacher", password: "Teacher@123" },
  { role: "staff", label: "Staff", password: "Staff@123" },
  { role: "student", label: "Student", password: "Student@123" },
  { role: "parent", label: "Parent", password: "Parent@123" },
]

export type DemoUserRow = {
  id: number
  role: string
  username: string
  email: string
  password: string
  name: string
}

/**
 * Creates one demo login per role for a school, skipping roles that already
 * have at least one user in the school. Returns the created accounts.
 */
export async function ensureDemoUsersForSchool(school: { id: number; name?: string; code?: string }): Promise<DemoUserRow[]> {
  const rolesResult = await query(`SELECT name, id FROM roles WHERE school_id = $1`, [school.id])
  const roleIds: Record<string, number> = {}
  for (const r of rolesResult.rows) roleIds[r.name] = r.id

  const existingResult = await query(`SELECT DISTINCT role FROM users WHERE school_id = $1`, [school.id])
  const existingRoles = new Set(existingResult.rows.map((r) => r.role))

  const prefix = schoolUsernamePrefix(school.name || school.code || "school")
  const slug = schoolSlug(school.name || school.code || "school")
  const created: DemoUserRow[] = []

  for (const spec of DEMO_ROLES) {
    const roleId = roleIds[spec.role]
    if (!roleId) continue
    if (existingRoles.has(spec.role)) continue
    const username = await generateUniqueUsername(`${prefix}_${spec.role}`)
    const email = `${prefix}_${spec.role}@${slug}.school`
    try {
      const ins = await query(
        `INSERT INTO users (username, name, email, password_hash, role, role_id, school_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, username, email`,
        [username, `${spec.label} - ${school.name || school.code}`, email, hashPassword(spec.password), spec.role, roleId, school.id, "Active"]
      )
      created.push({ id: ins.rows[0].id, role: spec.role, username: ins.rows[0].username, email: ins.rows[0].email, password: spec.password, name: `${spec.label} - ${school.name || school.code}` })
      existingRoles.add(spec.role)
    } catch {
      // unique constraint collision — skip
    }
  }
  return created
}

export async function createSchoolRoles(schoolId: number): Promise<Record<string, number>> {
  const result = await query(
    `SELECT id, name, label, permissions FROM roles WHERE is_system = true AND school_id IS NULL`
  )
  const roles: Record<string, number> = {}
  for (const r of result.rows) {
    if (r.name === "super_admin") continue
    const inserted = await query(
      `INSERT INTO roles (name, label, permissions, school_id, is_system)
       VALUES ($1, $2, $3, $4, false) RETURNING id`,
      [r.name, r.label, JSON.stringify(r.permissions || []), schoolId]
    )
    roles[r.name] = inserted.rows[0].id
  }
  return roles
}