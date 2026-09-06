import { query } from "@/lib/db"

export type IdGenConfig = {
  enabled: boolean
  prefix: string
  digit: number
  startFrom: number
}

export async function loadIdConfig(
  schoolId: number | null | undefined,
  kind: "student" | "staff"
): Promise<IdGenConfig> {
  const pre = kind === "student" ? "idautogen.student" : "idautogen.staff"
  const defaults = kind === "student" ? { enabled: "1", prefix: "S", digit: "4" } : { enabled: "0", prefix: "STAFF", digit: "4" }

  if (!schoolId) {
    return {
      enabled: defaults.enabled === "1",
      prefix: defaults.prefix,
      digit: parseInt(defaults.digit, 10) || 4,
      startFrom: 1,
    }
  }

  const r = await query(`SELECT key, value FROM school_settings WHERE school_id = $1`, [schoolId])
  const m: Record<string, string> = {}
  for (const row of r.rows) m[row.key] = row.value

  const enabledRaw = m[`${pre}Enabled`] ?? defaults.enabled
  const digit = Math.max(1, parseInt(m[`${pre}Digit`] ?? defaults.digit, 10) || 4)
  return {
    enabled: enabledRaw === "1",
    prefix: String(m[`${pre}Prefix`] ?? defaults.prefix),
    digit,
    startFrom: Math.max(1, parseInt(m[`${pre}StartFrom`] ?? "1", 10) || 1),
  }
}

function escRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Returns the next auto-generated ID (admission no / staff id) based on the
 * school's ID auto-generation settings, or null when auto-generation is off.
 */
export async function nextAutoId(
  kind: "student" | "staff",
  schoolId: number | null | undefined,
  column = kind === "student" ? "admission_no" : "employee_id"
): Promise<string | null> {
  const cfg = await loadIdConfig(schoolId, kind)
  if (!cfg.enabled) return null

  const table = kind === "student" ? "students" : "staff"
  const pattern = `^${escRegex(cfg.prefix)}([0-9]+)$`
  let rows: { rows: { [key: string]: unknown }[] } = { rows: [] }
  try {
    if (schoolId != null) {
      rows = await query(`SELECT ${column} AS id FROM ${table} WHERE school_id = $1 AND ${column} ~ $2`, [schoolId, pattern])
    } else {
      rows = await query(`SELECT ${column} AS id FROM ${table} WHERE ${column} ~ $1`, [pattern])
    }
  } catch {
    return null
  }

  let maxN = cfg.startFrom - 1
  for (const row of rows.rows) {
    const m = String(row.id ?? "").match(/(\d+)$/)
    if (m) maxN = Math.max(maxN, parseInt(m[1], 10))
  }
  return `${cfg.prefix}${String(maxN + 1).padStart(cfg.digit, "0")}`
}