import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { mapResponse } from "@/lib/field-mapping"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const className = searchParams.get("class")
    const sectionName = searchParams.get("section")
    const classId = searchParams.get("class_id")
    const sectionId = searchParams.get("section_id")
    const q = searchParams.get("q")

    let sql = `
      SELECT s.id, s.admission_no, s.name, c.name AS class, sec.name AS section,
        s.roll_no, s.class_id, s.section_id,
        COALESCE(s.gender, '') AS gender, COALESCE(s.phone, '') AS phone,
        COALESCE(s.mobile, s.phone, '') AS mobile, COALESCE(s.dob::text, '') AS dob,
        COALESCE(s.house, '') AS house,
        COALESCE(s.father_name, '') AS father_name, COALESCE(s.category, '') AS category
      FROM students s
      JOIN classes c ON c.id = s.class_id
      JOIN sections sec ON sec.id = s.section_id
      WHERE s.status = 'Active'
    `
    const params: (string | number)[] = []
    if (id) {
      sql += ` AND s.id = $${params.length + 1}::int`
      params.push(parseInt(id))
    } else if (classId) {
      sql += ` AND s.class_id = $${params.length + 1}::int`
      params.push(parseInt(classId))
    } else if (className) {
      sql += ` AND c.name = $${params.length + 1}`
      params.push(className)
    }
    if (sectionId) {
      sql += ` AND s.section_id = $${params.length + 1}::int`
      params.push(parseInt(sectionId))
    } else if (sectionName) {
      sql += ` AND sec.name = $${params.length + 1}`
      params.push(sectionName)
    }
    if (q) {
      const idx = params.length + 1
      sql += ` AND (s.name ILIKE $${idx} OR CAST(s.roll_no AS text) ILIKE $${idx} OR s.admission_no ILIKE $${idx} OR c.name ILIKE $${idx} OR sec.name ILIKE $${idx})`
      params.push(`%${q}%`)
    }
    sql += " ORDER BY s.name LIMIT 25"

    const result = await query(sql, params)
    if (id) return NextResponse.json(mapResponse(result.rows[0]) || { error: "Not found" }, { status: result.rows[0] ? 200 : 404 })
    return NextResponse.json(mapResponse(result.rows))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
