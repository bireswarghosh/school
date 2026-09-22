import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { mapResponse } from "@/lib/field-mapping"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const className = searchParams.get("class")
    const sectionName = searchParams.get("section")
    const studentId = searchParams.get("studentId")

    let sql = `
      SELECT
        p.id AS payment_id,
        p.student_id AS student_id,
        p.fees_group_id AS fees_group_id,
        p.fees_type_id AS fees_type_id,
        p.amount AS amount,
        COALESCE(p.paid_amount, 0) AS paid_amount,
        COALESCE(p.discount_amount, 0) AS discount_amount,
        COALESCE(p.fine_amount, 0) AS fine_amount,
        p.status AS status,
        p.payment_mode AS payment_mode,
        p.payment_date AS payment_date,
        s.name AS student_name,
        s.admission_no AS admission_no,
        c.name AS class_name,
        sec.name AS section_name,
        ft.name AS fee_type_name,
        (p.amount - COALESCE(p.paid_amount, 0) - COALESCE(p.discount_amount, 0)) AS balance
      FROM fees_payments p
      JOIN students s ON s.id = p.student_id
      JOIN classes c ON c.id = COALESCE(p.class_id, s.class_id)
      JOIN sections sec ON sec.id = s.section_id
      JOIN fees_types ft ON ft.id = p.fees_type_id
      WHERE p.paid_amount > 0
        AND p.amount - COALESCE(p.discount_amount, 0) - COALESCE(p.paid_amount, 0) > 0
    `
    const params: (string | number)[] = []
    if (className) {
      sql += ` AND c.name = $${params.length + 1}`
      params.push(className)
    }
    if (sectionName) {
      sql += ` AND sec.name = $${params.length + 1}`
      params.push(sectionName)
    }
    if (studentId) {
      sql += ` AND p.student_id = $${params.length + 1}`
      params.push(parseInt(studentId))
    }
    sql += " ORDER BY c.name, sec.name, s.name, p.id DESC"

    const result = await query(sql, params)
    return NextResponse.json(mapResponse(result.rows))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}