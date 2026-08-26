import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Subjects mapped per class/section.
// Source: timetable_entries when class mappings exist; otherwise falls back
// to the global subjects table so the report is never empty.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("class_id")

    const mapped = await query(
      `
      SELECT c.name AS class, sec.name AS section, te.subject_name AS subject,
        c.id AS class_id, sec.id AS section_id, 1 AS kind
      FROM timetable_entries te
      JOIN classes c ON c.id = te.class_id
      LEFT JOIN sections sec ON sec.id = te.section_id
      WHERE te.subject_name IS NOT NULL AND te.subject_name <> ''
      GROUP BY c.name, sec.name, te.subject_name, c.id, sec.id
      ORDER BY c.name, sec.name, te.subject_name
      `
    )

    if (mapped.rows.length > 0) {
      if (classId) {
        return NextResponse.json(mapped.rows.filter((r: any) => String(r.class_id) === classId))
      }
      return NextResponse.json(mapped.rows)
    }

    const all = await query(
      `
      SELECT 'All' AS class, '' AS section, s.name AS subject,
        0 AS class_id, 0 AS section_id, 2 AS kind
      FROM subjects s
      WHERE s.name IS NOT NULL AND s.name <> ''
      ORDER BY s.name
      `
    )
    return NextResponse.json(all.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
