import { query } from "@/lib/db"

export function schoolUsernamePrefix(name: string): string {
  const words = String(name || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const letters = words.slice(0, 3).map((w) => w[0] || "").join("")
  return letters || String(name || "").slice(0, 3).toLowerCase() || "sch"
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