import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { pool } from "@/lib/db"
import { isTenantTable } from "@/lib/tenant-tables"

const TABLE = "backup_records"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

async function getSchoolId(): Promise<number> {
  const h = await headers()
  const n = parseInt(h.get("x-school-id") || "0", 10)
  return Number.isNaN(n) ? 0 : n
}

async function hasSchoolColumn(client: any, table: string): Promise<boolean> {
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name='school_id'`,
    [table]
  )
  return r.rows.length > 0
}

async function restoreData(schoolId: number, blob: any) {
  const tables: string[] = Array.isArray(blob?.tables) ? blob.tables : blob ? Object.keys(blob.data || {}) : []
  const data: Record<string, any[]> = blob?.data || {}

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const targets: string[] = []
    for (const t of tables) {
      if (t === TABLE || !isTenantTable(t)) continue
      if (!/^[a-z_][a-z0-9_]*$/i.test(t)) continue
      if (await hasSchoolColumn(client, t)) targets.push(t)
    }

    // Drop FK enforcement so child rows can be loaded before parents.
    for (const t of targets) {
      await client.query(`ALTER TABLE ${t} DISABLE TRIGGER ALL`)
    }

    try {
      for (const t of targets) {
        await client.query(`DELETE FROM ${t} WHERE school_id=$1`, [schoolId])

        const colRes = await client.query(
          `SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1`,
          [t]
        )
        const jsonCols = new Set(
          colRes.rows.filter((c) => c.data_type === "json" || c.data_type === "jsonb").map((c) => c.column_name)
        )

        const rows: any[] = Array.isArray(data[t]) ? data[t] : []
        for (const row of rows) {
          const keys = Object.keys(row).filter((k) => /^[a-z_][a-z0-9_]*$/i.test(k))
          if (keys.length === 0) continue
          const record: Record<string, any> = { ...row }
          record.school_id = schoolId
          const finalKeys = keys.includes("school_id") ? keys : [...keys, "school_id"]
          const cols = finalKeys.map((k) => `"${k}"`).join(", ")
          const vals = finalKeys.map((_, i) => `$${i + 1}`).join(", ")
          const values = finalKeys.map((k) => {
            const v = record[k]
            if (v === undefined || v === null) return null
            if (jsonCols.has(k)) return JSON.stringify(v)
            return v
          })
          await client.query(
            `INSERT INTO ${t} (${cols}) VALUES (${vals})`,
            values
          )
        }

        try {
          await client.query(
            `SELECT setval(pg_get_serial_sequence($1, 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM ${t}), 1), true)`,
            [t]
          )
        } catch {
          // no serial sequence on this table
        }
      }
    } finally {
      for (const t of targets) {
        await client.query(`ALTER TABLE ${t} ENABLE TRIGGER ALL`)
      }
    }

    await client.query("COMMIT")
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
  }
}

export async function POST(req: NextRequest) {
  const schoolId = await getSchoolId()
  if (!schoolId) return NextResponse.json({ error: "School context required" }, { status: 403 })
  try {
    const body = await req.json()

    if (body?.data) {
      // Restore from an uploaded backup file (validated JSON blob)
      await restoreData(schoolId, body.data)
      return NextResponse.json({ success: true, source: "upload" })
    }

    const id = parseInt(body?.id, 10)
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const r = await pool.query(`SELECT backup_data FROM ${TABLE} WHERE id=$1 AND school_id=$2`, [id, schoolId])
    const row = r.rows[0]
    if (!row) return NextResponse.json({ error: "Backup not found" }, { status: 404 })

    let blob: any
    try {
      blob = JSON.parse(row.backup_data)
    } catch {
      return NextResponse.json({ error: "Backup file is corrupted" }, { status: 400 })
    }
    await restoreData(schoolId, blob)
    return NextResponse.json({ success: true, source: "backup" })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
