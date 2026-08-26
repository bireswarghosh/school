import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "cbse_settings"

export async function GET() {
  try {
    const result = await query(`SELECT key, value FROM ${TABLE} ORDER BY key`)
    const settings: Record<string, string> = {}
    for (const row of result.rows) {
      settings[row.key] = row.value
    }
    return NextResponse.json(settings)
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    for (const [key, value] of Object.entries(body)) {
      await query(
        `INSERT INTO ${TABLE} (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2`,
        [key, String(value)]
      )
    }
    const settings: Record<string, string> = {}
    for (const [key, value] of Object.entries(body)) {
      settings[key] = String(value)
    }
    return NextResponse.json(settings)
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
