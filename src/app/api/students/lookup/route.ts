import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const admissionNo = searchParams.get("admission_no")
    if (!admissionNo) return NextResponse.json({ error: "admission_no required" }, { status: 400 })

    const result = await query(
      `SELECT s.id, s.admission_no, s.name, s.gender, s.roll_no,
              c.name AS class_name, sec.name AS section_name
       FROM students s
       LEFT JOIN classes c ON c.id = s.class_id
       LEFT JOIN sections sec ON sec.id = s.section_id
       WHERE s.admission_no = $1 AND s.status = 'Active'`,
      [admissionNo]
    )

    const student = result.rows[0]
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    return NextResponse.json({
      id: student.id,
      admissionNo: student.admission_no,
      name: student.name,
      gender: student.gender,
      rollNo: student.roll_no,
      className: student.class_name,
      sectionName: student.section_name,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
