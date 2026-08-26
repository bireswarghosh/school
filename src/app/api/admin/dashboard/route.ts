import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const sessionRes = await query(
      `SELECT id, name, start_date, end_date FROM sessions WHERE is_active = true ORDER BY id LIMIT 1`
    )
    const active = sessionRes.rows[0]

    const sessionName = active?.name ?? null

    const totalStudentsRes = await query(
      `SELECT COUNT(*)::int AS count FROM students WHERE $1::text IS NULL OR session = $1`,
      [sessionName]
    )

    const totalStaffRes = await query(`SELECT COUNT(*)::int AS count FROM staff`)

    const feesCollectedRes = await query(
      `SELECT COALESCE(SUM(paid_amount), 0)::float AS total FROM fees_payments WHERE $1::text IS NULL OR session = $1`,
      [sessionName]
    )

    const activeExamsRes = await query(
      `SELECT COUNT(*)::int AS count FROM exams WHERE $1::text IS NULL OR session = $1`,
      [sessionName]
    )

    const pendingLeavesRes = await query(
      `SELECT COUNT(*)::int AS count FROM leave_requests WHERE status IS DISTINCT FROM 'Approved'`
    )

    const recentStudentsRes = await query(
      `SELECT s.id, s.admission_no, s.name, c.name AS class_name, sec.name AS section_name, s.status
         FROM students s
         LEFT JOIN classes c ON c.id = s.class_id
         LEFT JOIN sections sec ON sec.id = s.section_id
        WHERE $1::text IS NULL OR s.session = $1
        ORDER BY s.id DESC LIMIT 5`,
      [sessionName]
    )

    const recentFeesRes = await query(
      `SELECT fp.id, s.name AS student_name, fp.paid_amount, fp.payment_date, fp.payment_mode
         FROM fees_payments fp
         LEFT JOIN students s ON s.id = fp.student_id
        WHERE $1::text IS NULL OR fp.session = $1
        ORDER BY fp.id DESC LIMIT 5`,
      [sessionName]
    )

    const feesByMonthRes = await query(
      `SELECT TO_CHAR(payment_date, 'YYYY-MM') AS month, COALESCE(SUM(paid_amount), 0)::float AS total
         FROM fees_payments
        WHERE ($1::text IS NULL OR session = $1) AND payment_date IS NOT NULL
        GROUP BY month ORDER BY month`,
      [sessionName]
    )

    return NextResponse.json({
      session: active
        ? {
            id: active.id,
            name: active.name,
            startDate: active.start_date,
            endDate: active.end_date,
          }
        : null,
      stats: {
        totalStudents: totalStudentsRes.rows[0]?.count ?? 0,
        totalStaff: totalStaffRes.rows[0]?.count ?? 0,
        feesCollected: feesCollectedRes.rows[0]?.total ?? 0,
        activeExams: activeExamsRes.rows[0]?.count ?? 0,
        pendingLeaves: pendingLeavesRes.rows[0]?.count ?? 0,
      },
      recentStudents: recentStudentsRes.rows,
      recentFees: recentFeesRes.rows,
      feesByMonth: feesByMonthRes.rows,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
