import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

/**
 * Pending (unpaid / partially paid) fee invoices for the print report.
 * Query: ?month=YYYY-MM&classId=<id>
 * Pending payments are intentionally NOT part of the payment change log list;
 * they are only surfaced through the daily/monthly print report.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const schoolId = getSessionSchoolId(req) ?? -1
  const month = searchParams.get("month") || ""
  const classIdRaw = searchParams.get("classId") || ""
  const classId = classIdRaw ? parseInt(classIdRaw, 10) : NaN

  try {
    const params: (string | number)[] = [schoolId]
    let where = `fp.school_id = $1
      AND fp.status IS DISTINCT FROM 'Paid'
      AND fp.status IS DISTINCT FROM 'Success'`

    if (/^\d{4}-\d{2}$/.test(month)) {
      params.push(month)
      where += ` AND TO_CHAR(COALESCE(fp.payment_date, fp.created_at), 'YYYY-MM') = $${params.length}`
    }
    if (!Number.isNaN(classId)) {
      params.push(classId)
      where += ` AND fp.class_id = $${params.length}`
    }

    const res = await query(
      `SELECT s.name AS "studentName", s.admission_no AS "admissionNo",
              c.name AS "className", ft.name AS "feeType",
              fp.amount, fp.paid_amount AS "paid",
              GREATEST(COALESCE(fp.amount, 0) - COALESCE(fp.paid_amount, 0) - COALESCE(fp.discount_amount, 0), 0) AS "outstanding",
              fp.status,
              COALESCE(fp.payment_date, fp.created_at) AS "date"
         FROM fees_payments fp
         JOIN students s ON s.id = fp.student_id
         LEFT JOIN classes c ON c.id = fp.class_id
         LEFT JOIN fees_types ft ON ft.id = fp.fees_type_id
        WHERE ${where}
        ORDER BY c.name NULLS LAST, s.name, ft.name`,
      params
    )

    const total = res.rows.reduce((sum, r) => sum + (Number(r.outstanding) || 0), 0)
    return NextResponse.json({ rows: res.rows, total, month, classId: Number.isNaN(classId) ? null : classId })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
