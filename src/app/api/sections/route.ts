import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("class_id")
    if (!classId) {
      return NextResponse.json({ error: "class_id is required" }, { status: 400 })
    }
    const result = await query("SELECT id, class_id, name FROM sections WHERE class_id = $1 ORDER BY name", [parseInt(classId)])
    return NextResponse.json(result.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
