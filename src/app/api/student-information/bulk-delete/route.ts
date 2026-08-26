import { NextRequest, NextResponse } from "next/server"
import { query, remove } from "@/lib/db"

const TABLE = "students"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET() {
  try {
    const sql = `
      SELECT s.id,
        s.admission_no AS "admissionNo",
        COALESCE(s.first_name || ' ' || s.last_name, s.name) AS "name",
        c.name AS "className",
        sec.name AS "section",
        s.father_name AS "fatherName",
        s.roll_no AS "rollNo"
      FROM ${TABLE} s
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN sections sec ON sec.id = s.section_id
      ORDER BY s.id DESC
    `
    const result = await query(sql)
    return NextResponse.json(result.rows)
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  try {
    await remove(TABLE, id)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
