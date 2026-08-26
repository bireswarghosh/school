import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Full student rows (joined with class/section names) for report pages.
// Auto-scoped to the current school via db.query.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("class_id")
    const sectionId = searchParams.get("section_id")
    const fromDate = searchParams.get("from_date")
    const toDate = searchParams.get("to_date")

    let sql = `
      SELECT s.id, s.admission_no, s.first_name, s.middle_name, s.last_name,
        CONCAT(COALESCE(s.first_name,''), ' ', COALESCE(s.middle_name,''), ' ', COALESCE(s.last_name,'')) AS name,
        s.gender, s.dob, s.email, s.phone, s.mobile, s.category, s.religion, s.caste,
        s.blood_group, s.house, s.admission_date, s.status, s.session,
        c.name AS class, sec.name AS section, s.roll_no, s.class_id, s.section_id,
        s.father_name, s.father_phone, s.father_occupation,
        s.mother_name, s.mother_phone, s.mother_occupation,
        s.guardian_is, s.guardian_name, s.guardian_relation, s.guardian_email, s.guardian_phone,
        s.guardian_occupation, s.guardian_address,
        s.current_address, s.permanent_address, s.address, s.previous_school, s.note,
        s.bank_account_no, s.bank_name, s.ifsc_code, s.national_identification_no, s.local_identification_no
      FROM students s
      JOIN classes c ON c.id = s.class_id
      JOIN sections sec ON sec.id = s.section_id
      WHERE 1=1
    `
    const params: (string | number)[] = []
    if (classId) {
      params.push(parseInt(classId))
      sql += ` AND s.class_id = $${params.length}::int`
    }
    if (sectionId) {
      params.push(parseInt(sectionId))
      sql += ` AND s.section_id = $${params.length}::int`
    }
    if (fromDate) {
      params.push(fromDate)
      sql += ` AND s.admission_date >= $${params.length}`
    }
    if (toDate) {
      params.push(toDate)
      sql += ` AND s.admission_date <= $${params.length}`
    }
    sql += " ORDER BY c.order_number, sec.name, s.name"

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
