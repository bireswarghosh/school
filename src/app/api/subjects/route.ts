import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query("SELECT id, name, code FROM subjects ORDER BY name")
    return NextResponse.json(result.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
