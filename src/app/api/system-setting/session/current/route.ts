import { NextRequest, NextResponse } from "next/server"
import { query, pool } from "@/lib/db"

export type SessionInfo = {
  id: number
  name: string
  startDate: string
  endDate: string
}

function rowToInfo(row: any): SessionInfo | null {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
  }
}

export async function GET() {
  try {
    const result = await query(
      `SELECT id, name, start_date, end_date FROM sessions WHERE is_active = true ORDER BY id LIMIT 1`
    )
    return NextResponse.json({ session: rowToInfo(result.rows[0]) })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = Number(body?.id)
    if (!id) return NextResponse.json({ error: "Session id is required" }, { status: 400 })

    const conn = await pool.connect()
    try {
      await conn.query("BEGIN")
      const exists = await conn.query("SELECT id, name, start_date, end_date FROM sessions WHERE id = $1", [id])
      if (exists.rows.length === 0) {
        await conn.query("ROLLBACK")
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }
      await conn.query("UPDATE sessions SET is_active = false WHERE is_active = true")
      await conn.query("UPDATE sessions SET is_active = true WHERE id = $1", [id])
      await conn.query("COMMIT")
      return NextResponse.json({ session: rowToInfo(exists.rows[0]) })
    } catch (e) {
      await conn.query("ROLLBACK")
      throw e
    } finally {
      conn.release()
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    )
  }
}
