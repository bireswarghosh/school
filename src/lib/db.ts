import { Pool, types } from "pg"
import { headers } from "next/headers"
import { isTenantTable } from "@/lib/tenant-tables"

// Return DATE columns as YYYY-MM-DD strings (avoid JS Date → UTC day shift)
types.setTypeParser(1082, (val: string) => val)
// Parse JSON/JSONB columns automatically
types.setTypeParser(114, JSON.parse)
types.setTypeParser(3802, JSON.parse)

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://postgres:123@localhost/appstrice_school",
  max: 20,
  idleTimeoutMillis: 30000,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
})

// ----------------------------------------------------------------
// Automatic tenant scoping
// Reads the x-school-id header set by proxy.ts and rewrites simple
// single-table SQL statements to filter/inject school_id.
// System-level calls (outside a request, or without the header) are
// left untouched.
// ----------------------------------------------------------------
async function getRequestSchoolId(): Promise<number | null> {
  try {
    const h = await headers()
    const raw = h.get("x-school-id")
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isNaN(n) ? null : n
  } catch {
    return null
  }
}

type Statement = { kind: "SELECT" | "INSERT" | "UPDATE" | "DELETE"; table: string }

function parseStatement(sql: string): Statement | null {
  const s = sql.trim()
  if (/^INSERT\s+INTO\s+([a-z_][a-z0-9_]*)/i.test(s)) return { kind: "INSERT", table: RegExp.$1 }
  if (/^UPDATE\s+([a-z_][a-z0-9_]*)/i.test(s)) return { kind: "UPDATE", table: RegExp.$1 }
  if (/^DELETE\s+FROM\s+([a-z_][a-z0-9_]*)/i.test(s)) return { kind: "DELETE", table: RegExp.$1 }
  const sel = s.match(/\bFROM\s+([a-z_][a-z0-9_]*)/i)
  if (sel && /^SELECT/i.test(s)) return { kind: "SELECT", table: sel[1] }
  return null
}

function firstKeywordAfter(sql: string, from: number, keywords: string[]): number {
  let best = -1
  for (const kw of keywords) {
    const idx = sql.toUpperCase().indexOf(kw, from)
    if (idx !== -1 && (best === -1 || idx < best)) best = idx
  }
  return best
}

const CLAUSE_END = ["GROUP BY", "HAVING", "ORDER BY", "LIMIT", "OFFSET", "FETCH", "UNION"]

/**
 * Appends `school_id = $n` filtering to a single-table statement.
 * Returns [sql, params] with the school id appended to params, or null
 * when the statement is too complex / already scoped.
 */
export type DbParam = string | number | boolean | null | Uint8Array

function scopeStatement(sql: string, params: DbParam[], schoolId: number): [string, DbParam[]] | null {
  if (/\bschool_id\b/i.test(sql)) return null
  if ((sql.match(/;/g) || []).length > 0) return null
  if (/\(SELECT\b|\(WITH\b/i.test(sql)) return null

  const st = parseStatement(sql)
  if (!st || !isTenantTable(st.table)) return null

  const idx = params.length + 1
  const s = sql.trimEnd()

  if (st.kind === "INSERT") {
    const colMatch = s.match(/^INSERT\s+INTO\s+[a-z_][a-z0-9_]*\s*\(([^)]*)\)/i)
    if (!colMatch) return null
    const newCols = colMatch[1] ? `${colMatch[1]}, school_id` : `school_id`
    const scoped = s.replace(colMatch[0], `INSERT INTO ${st.table} (${newCols})`)
    const withValue = scoped.replace(/\(([^()]*)\)/g, (tuple) => {
      const inner = tuple.slice(1, -1)
      if (!/^\s*\$?\d/i.test(inner)) return tuple
      return `(${inner}, $${idx})`
    })
    return [withValue, [...params, schoolId]]
  }

  if (st.kind === "UPDATE" || st.kind === "DELETE") {
    if (/USING\b|JOIN\b/i.test(s)) return null
    const whereIdx = s.toUpperCase().indexOf("WHERE")
    if (whereIdx === -1) {
      return [`${s} WHERE school_id = $${idx}`, [...params, schoolId]]
    }
    const scoped = `${s.slice(0, whereIdx)}WHERE school_id = $${idx} AND ${s.slice(whereIdx + 5)}`
    return [scoped, [...params, schoolId]]
  }

  // SELECT (single table, optionally with JOINs)
  const fromIdx = s.toUpperCase().indexOf("FROM")
  if (fromIdx === -1) return null
  const fromRest = s.slice(fromIdx + 4)
  const fm = fromRest.match(/^\s+([a-z_][a-z0-9_]*)(?:\s+([a-z_][a-z0-9_]*))?/i)
  if (!fm) return null
  if (fm[1].toLowerCase() !== st.table.toLowerCase()) return null
  const aliasToken = (fm[2] || "").toLowerCase()
  const alias = aliasToken && !/^(where|join|inner|left|right|full|cross|on|group|order|having|limit|offset|union|fetch|,)$/.test(aliasToken) ? fm[2] : null
  const ref = alias ? `${alias}.school_id` : `school_id`

  const whereIdx = s.toUpperCase().indexOf("WHERE", fromIdx)
  if (whereIdx !== -1) {
    const scoped = `${s.slice(0, whereIdx)}WHERE ${ref} = $${idx} AND ${s.slice(whereIdx + 5)}`
    return [scoped, [...params, schoolId]]
  }
  const end = firstKeywordAfter(s, fromIdx, CLAUSE_END)
  if (end !== -1) {
    return [`${s.slice(0, end)} WHERE ${ref} = $${idx} ${s.slice(end)}`, [...params, schoolId]]
  }
  return [`${s} WHERE ${ref} = $${idx}`, [...params, schoolId]]
}

export async function query(text: string, params?: DbParam[]) {
  const schoolId = await getRequestSchoolId()
  let finalSql = text
  let finalParams: DbParam[] | undefined = params
  if (schoolId) {
    const scoped = scopeStatement(text, params || [], schoolId)
    if (scoped) {
      finalSql = scoped[0]
      finalParams = scoped[1]
    }
  }
  const client = await pool.connect()
  try {
    const result = await client.query(finalSql, finalParams)
    return result
  } finally {
    client.release()
  }
}

export async function getAll<T = any>(table: string, orderBy = "id ASC", where?: string, whereParams?: DbParam[], schoolId?: number | null): Promise<T[]> {
  const tenant = isTenantTable(table)
  let sql: string
  let params: DbParam[] = []
  if (where) {
    sql = `SELECT * FROM ${table} WHERE ${where}`
    params = [...(whereParams || [])]
    if (tenant && schoolId) {
      sql += ` AND school_id = $${params.length + 1}`
      params.push(schoolId)
    }
  } else if (tenant && schoolId) {
    sql = `SELECT * FROM ${table} WHERE school_id = $1`
    params = [schoolId]
  } else {
    sql = `SELECT * FROM ${table}`
  }
  sql += ` ORDER BY ${orderBy}`
  const result = await query(sql, params)
  return result.rows as T[]
}

export async function getById<T = any>(table: string, id: number, schoolId?: number | null): Promise<T | null> {
  const tenant = isTenantTable(table)
  const sql = tenant && schoolId ? `SELECT * FROM ${table} WHERE id = $1 AND school_id = $2` : `SELECT * FROM ${table} WHERE id = $1`
  const params = tenant && schoolId ? [id, schoolId] : [id]
  const result = await query(sql, params)
  return result.rows[0] as T || null
}

export async function create<T extends Record<string, any>>(table: string, data: T, schoolId?: number | null): Promise<T> {
  const tenant = isTenantTable(table)
  const record: Record<string, any> = { ...data }
  if (tenant && schoolId !== undefined && schoolId !== null) {
    record.school_id = schoolId
  }
  const keys = Object.keys(record)
  const values = Object.values(record)
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
  const columns = keys.join(", ")
  const result = await query(
    `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values
  )
  return result.rows[0] as T
}

export async function update<T extends Record<string, any>>(table: string, id: number, data: Partial<T>, schoolId?: number | null): Promise<T | null> {
  const tenant = isTenantTable(table)
  const record: Record<string, any> = { ...data }
  if (tenant && record.school_id !== undefined) delete record.school_id
  const keys = Object.keys(record)
  const values = Object.values(record)
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ")
  let sql: string
  let params: any[]
  if (tenant && schoolId) {
    sql = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} AND school_id = $${keys.length + 2} RETURNING *`
    params = [...values, id, schoolId]
  } else {
    sql = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`
    params = [...values, id]
  }
  const result = await query(sql, params)
  return result.rows[0] as T || null
}

export async function remove(table: string, id: number, schoolId?: number | null): Promise<boolean> {
  const tenant = isTenantTable(table)
  const sql = tenant && schoolId ? `DELETE FROM ${table} WHERE id = $1 AND school_id = $2` : `DELETE FROM ${table} WHERE id = $1`
  const params = tenant && schoolId ? [id, schoolId] : [id]
  const result = await query(sql, params)
  return (result.rowCount ?? 0) > 0
}

export async function tableExists(table: string): Promise<boolean> {
  const result = await query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
    [table]
  )
  return result.rows[0].exists
}
