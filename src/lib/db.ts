import { Pool, types } from "pg"
import dns from "node:dns"
import net from "node:net"
import { headers } from "next/headers"
import { isTenantTable } from "@/lib/tenant-tables"

// ----------------------------------------------------------------
// DNS fix for ISPs (e.g. Reliance/Jio) whose default resolvers refuse
// Neon pooler hostnames with ENOTFOUND / Query refused.
// Root cause verified on this PC:
//   default DNS (192.168.29.1 → Reliance) => "Query refused"
//   8.8.8.8                            => OK (52.76.x.x)
// Node's dns.lookup()/net.connect() use the OS resolver and IGNORE
// dns.setServers(). pg v8 hardcodes dns.lookup, so the Pool `lookup`
// option is ignored. Fix: monkey-patch dns.lookup to fall back to
// Google DNS via resolve4/resolve6 (c-ares honours setServers).
// No admin rights needed for this in-app fix.
// Permanent system-wide fix (run PowerShell AS ADMINISTRATOR once):
//   Set-DnsClientServerAddress -InterfaceIndex 4 -ServerAddresses ("8.8.8.8","8.8.4.4","1.1.1.1")
//   ipconfig /flushdns
// ----------------------------------------------------------------
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"])
} catch {
  // ignore — falls back to OS resolver
}

const _origLookup = dns.lookup.bind(dns)

function lookupWithGoogleFallback(
  hostname: string,
  options: any,
  callback?: any
): any {
  let opts: any = {}
  let cb: any = callback
  if (typeof options === "function") {
    cb = options
  } else if (typeof options === "number") {
    opts = { family: options }
  } else if (options) {
    opts = options
  }
  if (net.isIP(hostname)) {
    const family = net.isIPv4(hostname) ? 4 : 6
    if (opts.all) return cb(null, [{ address: hostname, family }])
    return cb(null, hostname, family)
  }
  // 1) Try OS resolver first (fast when it works)
  return (_origLookup as any)(hostname, opts, (err: any, address: any, family: any) => {
    if (!err) {
      if (opts.all) return cb(null, address, family)
      return cb(null, address, family)
    }
    // 2) Fallback to Google DNS via resolve4/resolve6
    dns.resolve4(hostname, (e4, v4) => {
      if (!e4 && v4?.length) {
        if (opts.all) return cb(null, v4.map((a) => ({ address: a, family: 4 })))
        return cb(null, v4[0], 4)
      }
      dns.resolve6(hostname, (e6, v6) => {
        if (!e6 && v6?.length) {
          if (opts.all) return cb(null, v6.map((a) => ({ address: a, family: 6 })))
          return cb(null, v6[0], 6)
        }
        const enhanced: any = new Error(
          `getaddrinfo ENOTFOUND ${hostname} (OS DNS refused; Google DNS 8.8.8.8 fallback also failed: ` +
            `${e4?.message || (e6 as any)?.message || err.message}. Fix: run PowerShell as Admin → ` +
            `Set-DnsClientServerAddress -ServerAddresses ("8.8.8.8","8.8.4.4","1.1.1.1"))`
        )
        enhanced.code = "ENOTFOUND"
        enhanced.hostname = hostname
        return cb(enhanced)
      })
    })
  })
}

// Patch process-wide so pg's net.connect() picks it up (pg ignores Pool.lookup)
try {
  ;(dns as any).lookup = lookupWithGoogleFallback
} catch {
  // ignore
}

const googleFallbackLookup: any = lookupWithGoogleFallback

// Return DATE columns as YYYY-MM-DD strings (avoid JS Date → UTC day shift)
types.setTypeParser(1082, (val: string) => val)
// Parse JSON/JSONB columns automatically
types.setTypeParser(114, JSON.parse)
types.setTypeParser(3802, JSON.parse)

function getDbHost(): string | undefined {
  try {
    const url = process.env.DATABASE_URL
    if (!url) return undefined
    return new URL(url).hostname
  } catch {
    return undefined
  }
}

const dbHost = getDbHost()
const isNeon = !!dbHost?.includes("neon.tech")

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://postgres:123@localhost/appstrice_school",
  max: 20,
  idleTimeoutMillis: 30000,
  ssl: process.env.DATABASE_URL
    ? {
        rejectUnauthorized: false,
        // Neon routes by SNI. When our custom lookup returns a raw IP,
        // pg would send the IP as SNI and Neon rejects it. Pin SNI to
        // the real hostname so IP fallback still routes correctly.
        ...(isNeon && dbHost ? { servername: dbHost } : {}),
      }
    : undefined,
  // NOTE: pg v8 ignores Pool `lookup` (uses dns.lookup directly);
  // the process-wide dns.lookup patch above is the real fix. Kept here
  // for future pg versions that honour it.
  lookup: googleFallbackLookup,
} as any)

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
