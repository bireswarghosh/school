import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { pool } from "@/lib/db"
import { TENANT_TABLES } from "@/lib/tenant-tables"

const TABLE = "backup_records"
const MAX_BACKUPS = 5

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function mapRow(r: any) {
  return {
    id: r.id,
    fileName: r.filename,
    sizeKb: r.size_kb,
    sizeBytes: r.size_bytes,
    date: r.date,
  }
}

async function getSchoolId(): Promise<number> {
  const h = await headers()
  const n = parseInt(h.get("x-school-id") || "0", 10)
  return Number.isNaN(n) ? 0 : n
}

async function hasSchoolColumn(table: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name='school_id'`,
    [table]
  )
  return r.rows.length > 0
}

async function backupableTables(): Promise<string[]> {
  const out: string[] = []
  for (const t of TENANT_TABLES) {
    if (t === TABLE) continue
    if (await hasSchoolColumn(t)) out.push(t)
  }
  return out
}

async function buildBackup(schoolId: number): Promise<{ tables: string[]; data: Record<string, any[]>; rowCount: number }> {
  const tables = await backupableTables()
  const data: Record<string, any[]> = {}
  let rowCount = 0
  for (const t of tables) {
    const r = await pool.query(`SELECT * FROM ${t} WHERE school_id=$1`, [schoolId])
    if (r.rows.length > 0) {
      data[t] = r.rows
      rowCount += r.rows.length
    }
  }
  return { tables, data, rowCount }
}

export async function GET(req: NextRequest) {
  const schoolId = await getSchoolId()
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0", 10)

  if (id) {
    const r = await pool.query(`SELECT * FROM ${TABLE} WHERE id=$1 AND school_id=$2`, [id, schoolId])
    const row = r.rows[0]
    if (!row) return NextResponse.json({ error: "Backup not found" }, { status: 404 })
    if (searchParams.get("download")) {
      return new NextResponse(row.backup_data || "", {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${row.filename}"`,
        },
      })
    }
    return NextResponse.json(mapRow(row))
  }

  const r = await pool.query(
    `SELECT id, filename, size_kb, size_bytes, date FROM ${TABLE} WHERE school_id=$1 ORDER BY id DESC`,
    [schoolId]
  )
  return NextResponse.json(r.rows.map(mapRow))
}

export async function POST(req: NextRequest) {
  const schoolId = await getSchoolId()
  if (!schoolId) return NextResponse.json({ error: "School context required" }, { status: 403 })
  try {
    const count = await pool.query(`SELECT count(*)::int AS c FROM ${TABLE} WHERE school_id=$1`, [schoolId])
    if (count.rows[0].c >= MAX_BACKUPS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BACKUPS} backups per school. Delete an old backup to create a new one.` },
        { status: 400 }
      )
    }

    const { tables, data, rowCount } = await buildBackup(schoolId)
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`
    const filename = `backup_${dateStr}.json`
    const blob = JSON.stringify({ exportedAt: now.toISOString(), schoolId, tables, data })

    const ins = await pool.query(
      `INSERT INTO ${TABLE} (school_id, filename, size_kb, size_bytes, backup_data) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [schoolId, filename, Math.max(1, Math.round(blob.length / 1024)), blob.length, blob]
    )
    return NextResponse.json({ ...mapRow(ins.rows[0]), rowCount }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const schoolId = await getSchoolId()
  const id = parseInt(new URL(req.url).searchParams.get("id") || "0", 10)
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const r = await pool.query(`DELETE FROM ${TABLE} WHERE id=$1 AND school_id=$2 RETURNING id`, [id, schoolId])
  if (!r.rows[0]) return NextResponse.json({ error: "Backup not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
