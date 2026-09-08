import { NextResponse } from "next/server"
import { query } from "@/lib/db"

const num = (v: unknown) => Number(v ?? 0)

export async function GET() {
  try {
    const sessionRes = await query(
      `SELECT id, name, start_date, end_date FROM sessions WHERE is_active = true ORDER BY id LIMIT 1`
    )
    const active = sessionRes.rows[0]
    const sessionName = active?.name ?? null

    const studentsRes = await query(
      `SELECT COUNT(*)::int AS count,
              COUNT(*) FILTER (WHERE status = 'Active')::int AS active_count,
              COUNT(*) FILTER (WHERE admission_date >= date_trunc('month', CURRENT_DATE))::int AS new_this_month,
              COUNT(*) FILTER (WHERE admission_date >= date_trunc('month', CURRENT_DATE - interval '1 month')
                                 AND admission_date <  date_trunc('month', CURRENT_DATE))::int AS new_last_month
         FROM students WHERE $1::text IS NULL OR session = $1`,
      [sessionName]
    )

    const staffRes = await query(
      `SELECT COUNT(*)::int AS count,
              COUNT(*) FILTER (WHERE status = 'Active')::int AS active_count,
              COUNT(*) FILTER (WHERE role ILIKE '%teacher%' AND status = 'Active')::int AS teachers
         FROM staff`
    )

    const classesRes = await query(`SELECT COUNT(*)::int AS count FROM classes`)
    const sectionsRes = await query(`SELECT COUNT(*)::int AS count FROM sections`)

    const parentsRes = await query(
      `SELECT COUNT(*)::int AS count FROM users WHERE role = 'parent' AND status = 'Active'`
    )

    const todayAttRes = await query(
      `SELECT COALESCE(at.type, 'Unknown') AS type, COUNT(*)::int AS count
         FROM student_attendance sa
         LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
        WHERE sa.date = CURRENT_DATE
        GROUP BY at.type`
    )
    const todayAttendance = { present: 0, absent: 0, late: 0, holiday: 0, total: 0 }
    for (const r of todayAttRes.rows) {
      const t = String(r.type).toLowerCase()
      if (t === "present") todayAttendance.present = r.count
      else if (t === "absent") todayAttendance.absent = r.count
      else if (t === "late") todayAttendance.late = r.count
      else if (t === "holiday") todayAttendance.holiday = r.count
      todayAttendance.total += r.count
    }

    const feesRes = await query(
      `SELECT COALESCE(SUM(COALESCE(paid_amount, 0)) FILTER (WHERE ($1::text IS NULL OR session = $1) AND payment_date >= date_trunc('month', CURRENT_DATE)), 0)::float AS this_month,
              COALESCE(SUM(COALESCE(paid_amount, 0)) FILTER (WHERE ($1::text IS NULL OR session = $1) AND payment_date >= date_trunc('month', CURRENT_DATE - interval '1 month')
                                                               AND payment_date <  date_trunc('month', CURRENT_DATE)), 0)::float AS last_month,
              COALESCE(SUM(GREATEST(COALESCE(amount, 0) - COALESCE(paid_amount, 0) - COALESCE(discount_amount, 0), 0))
                FILTER (WHERE status IS DISTINCT FROM 'Paid' AND status IS DISTINCT FROM 'Success'), 0)::float AS pending,
              COUNT(*) FILTER (WHERE status IS DISTINCT FROM 'Paid' AND status IS DISTINCT FROM 'Success')::int AS pending_count
         FROM fees_payments`,
      [sessionName]
    )

    const feesCollectedRes = await query(
      `SELECT COALESCE(SUM(paid_amount), 0)::float AS total FROM fees_payments WHERE $1::text IS NULL OR session = $1`,
      [sessionName]
    )

    const examsRes = await query(
      `SELECT COUNT(*)::int AS count FROM exams WHERE $1::text IS NULL OR session = $1`,
      [sessionName]
    )

    const upcomingExamsRes = await query(
      `SELECT es.id, e.name AS exam_name, es.name AS subject, es.date, es.time, es.room
         FROM exam_subjects es
         JOIN exams e ON e.id = es.exam_id
        WHERE es.date IS NOT NULL AND es.date >= CURRENT_DATE
        ORDER BY es.date ASC, es.time ASC NULLS LAST
        LIMIT 5`
    )

    const homeworkRes = await query(
      `SELECT COUNT(*)::int AS assigned_this_month,
              COUNT(*) FILTER (WHERE status = 'Assigned' AND submission_date >= CURRENT_DATE)::int AS pending,
              COUNT(*) FILTER (WHERE status ILIKE '%evaluat%' OR status ILIKE '%complete%')::int AS evaluated
         FROM homework
        WHERE homework_date >= date_trunc('month', CURRENT_DATE)`
    )

    const transportRes = await query(`SELECT COUNT(*)::int AS vehicles FROM vehicles`)
    const routesRes = await query(`SELECT COUNT(*)::int AS routes FROM routes`)
    const transportStudentsRes = await query(
      `SELECT COUNT(DISTINCT student_id)::int AS count FROM student_transport_fees`
    )

    const leavesRes = await query(
      `SELECT COUNT(*)::int AS pending,
              COUNT(*) FILTER (WHERE role = 'student')::int AS student_pending,
              COUNT(*) FILTER (WHERE role IS DISTINCT FROM 'student')::int AS staff_pending
         FROM leave_requests WHERE status = 'Pending'`
    )

    const noticesRes = await query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE publish_date >= date_trunc('month', CURRENT_DATE))::int AS this_month
         FROM notices`
    )
    const recentNoticesRes = await query(
      `SELECT id, title, notice_date, publish_date FROM notices ORDER BY COALESCE(publish_date, notice_date) DESC NULLS LAST, id DESC LIMIT 4`
    )

    const enquiriesRes = await query(
      `SELECT COUNT(*)::int AS pending FROM admission_enquiries WHERE status = 'Pending'`
    )
    const complaintsRes = await query(
      `SELECT COUNT(*)::int AS open FROM complaints WHERE status IS DISTINCT FROM 'Resolved' AND status IS DISTINCT FROM 'Closed'`
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
        WHERE ($1::text IS NULL OR fp.session = $1) AND COALESCE(fp.paid_amount, 0) > 0
        ORDER BY fp.id DESC LIMIT 6`,
      [sessionName]
    )

    const feesByMonthRes = await query(
      `SELECT TO_CHAR(payment_date, 'YYYY-MM') AS month, COALESCE(SUM(paid_amount), 0)::float AS total
         FROM fees_payments
        WHERE ($1::text IS NULL OR session = $1) AND payment_date IS NOT NULL
        GROUP BY month ORDER BY month`,
      [sessionName]
    )

    const absenceAlertsRes = await query(
      `SELECT s.id, s.name, c.name AS class_name, COUNT(*)::int AS absences
         FROM student_attendance sa
         JOIN attendance_types at ON at.id = sa.attendance_type_id AND at.type = 'Absent'
         JOIN students s ON s.id = sa.student_id
         LEFT JOIN classes c ON c.id = s.class_id
        WHERE sa.date >= CURRENT_DATE - 30
        GROUP BY s.id, s.name, c.name
       HAVING COUNT(*) >= 3
        ORDER BY absences DESC LIMIT 5`
    )

    const atRiskRes = await query(
      `SELECT s.id, s.name, c.name AS class_name,
              COUNT(*)::int AS days,
              ROUND(100.0 * COUNT(*) FILTER (WHERE at.type IN ('Present', 'Late')) / GREATEST(COUNT(*), 1))::int AS pct
         FROM student_attendance sa
         JOIN attendance_types at ON at.id = sa.attendance_type_id
         JOIN students s ON s.id = sa.student_id
         LEFT JOIN classes c ON c.id = s.class_id
        WHERE sa.date >= CURRENT_DATE - 30
        GROUP BY s.id, s.name, c.name
       HAVING COUNT(*) >= 5
          AND 100.0 * COUNT(*) FILTER (WHERE at.type IN ('Present', 'Late')) / COUNT(*) < 75
        ORDER BY pct ASC LIMIT 5`
    )

    const weakPerformersRes = await query(
      `SELECT s.id, s.name, c.name AS class_name,
              ROUND(100.0 * SUM(COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0))
                    / GREATEST(SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)), 1))::int AS pct
         FROM exam_marks em
         JOIN exam_subjects es ON es.id = em.subject_id
         JOIN students s ON s.id = em.student_id
         LEFT JOIN classes c ON c.id = s.class_id
        WHERE COALESCE(em.absent, false) = false
        GROUP BY s.id, s.name, c.name
       HAVING SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)) > 0
          AND 100.0 * SUM(COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0))
              / SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)) < 40
        ORDER BY pct ASC LIMIT 5`
    )

    const workloadRes = await query(
      `SELECT teacher_name, COUNT(*)::int AS periods, COUNT(DISTINCT class_id)::int AS classes
         FROM timetable_entries
        WHERE teacher_name IS NOT NULL AND teacher_name <> ''
        GROUP BY teacher_name
        ORDER BY periods DESC LIMIT 5`
    )

    const classPerfRes = await query(
      `SELECT c.id AS "classId", c.name AS "className",
              COUNT(DISTINCT s.id)::int AS students,
              ROUND(100.0 * COUNT(sa.id) FILTER (WHERE at.type IN ('Present', 'Late')) / NULLIF(COUNT(sa.id), 0))::int AS "avgAtt",
              ROUND(100.0 * SUM(COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0))
                    / NULLIF(SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)), 0))::int AS "avgScore"
         FROM classes c
         LEFT JOIN students s ON s.class_id = c.id AND s.status = 'Active' AND ($1::text IS NULL OR s.session = $1)
         LEFT JOIN student_attendance sa ON sa.student_id = s.id AND sa.date >= CURRENT_DATE - 30
         LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
         LEFT JOIN exam_marks em ON em.student_id = s.id AND COALESCE(em.absent, false) = false
         LEFT JOIN exam_subjects es ON es.id = em.subject_id
        GROUP BY c.id, c.name
        ORDER BY students DESC`,
      [sessionName]
    )

    const overallScoreRes = await query(
      `SELECT ROUND(100.0 * SUM(COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0))
                    / NULLIF(SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)), 0), 1)::float AS "avgScore"
         FROM exam_marks em
         JOIN exam_subjects es ON es.id = em.subject_id
        WHERE COALESCE(em.absent, false) = false`
    )

    const attendanceMonthlyRes = await query(
      `SELECT TO_CHAR(sa.date, 'YYYY-MM') AS month,
              COUNT(*) FILTER (WHERE at.type = 'Present')::int AS present,
              COUNT(*) FILTER (WHERE at.type = 'Absent')::int AS absent,
              COUNT(*) FILTER (WHERE at.type = 'Late')::int AS late,
              COUNT(*)::int AS total
         FROM student_attendance sa
         LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
        WHERE sa.date >= date_trunc('month', CURRENT_DATE - interval '5 months')
        GROUP BY 1
        ORDER BY 1`
    )

    const studentAveragesRes = await query(
      `SELECT s.id AS "studentId", s.name AS name, s.class_id AS "classId", c.name AS "className",
              ROUND(100.0 * SUM(COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0))
                    / NULLIF(SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)), 0))::int AS pct
         FROM exam_marks em
         JOIN students s ON s.id = em.student_id
         LEFT JOIN classes c ON c.id = s.class_id
         JOIN exam_subjects es ON es.id = em.subject_id
        WHERE COALESCE(em.absent, false) = false
        GROUP BY s.id, s.name, s.class_id, c.name
       HAVING SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)) > 0`
    )

    const perfectAttendanceRes = await query(
      `SELECT s.id, s.name AS name, c.name AS "className",
              COUNT(*) FILTER (WHERE at.type IN ('Present', 'Late'))::int AS present,
              COUNT(*)::int AS total
         FROM student_attendance sa
         JOIN attendance_types at ON at.id = sa.attendance_type_id
         JOIN students s ON s.id = sa.student_id
         LEFT JOIN classes c ON c.id = s.class_id
        WHERE sa.date >= CURRENT_DATE - 30
        GROUP BY s.id, s.name, c.name
       HAVING COUNT(*) FILTER (WHERE at.type = 'Absent') = 0 AND COUNT(*) >= 3
        ORDER BY present DESC, total DESC
        LIMIT 10`
    )

    const totalStudents = num(studentsRes.rows[0]?.count)
    const feesThisMonth = num(feesRes.rows[0]?.this_month)
    const feesPending = num(feesRes.rows[0]?.pending)
    const dayOfMonth = new Date().getDate()
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const feeProjection = dayOfMonth > 0 ? Math.round((feesThisMonth / dayOfMonth) * daysInMonth) : 0

    const pendingLeaves = num(leavesRes.rows[0]?.pending)
    const pendingEnquiries = num(enquiriesRes.rows[0]?.pending)
    const openComplaints = num(complaintsRes.rows[0]?.open)

    const alerts: { level: "danger" | "warning" | "info"; text: string }[] = []
    if (feesPending > 0)
      alerts.push({ level: "danger", text: `Outstanding fees of ₹${feesPending.toLocaleString("en-IN", { maximumFractionDigits: 0 })} across ${num(feesRes.rows[0]?.pending_count)} unpaid invoices` })
    if (todayAttendance.absent > 0)
      alerts.push({ level: "warning", text: `${todayAttendance.absent} students marked absent today` })
    if (atRiskRes.rows.length > 0)
      alerts.push({ level: "warning", text: `${atRiskRes.rows.length}+ students below 75% attendance in the last 30 days` })
    if (pendingLeaves > 0)
      alerts.push({ level: "info", text: `${pendingLeaves} leave requests awaiting approval` })
    if (pendingEnquiries > 0)
      alerts.push({ level: "info", text: `${pendingEnquiries} admission enquiries need follow-up` })
    if (openComplaints > 0)
      alerts.push({ level: "warning", text: `${openComplaints} complaints still open` })
    if (absenceAlertsRes.rows.length > 0)
      alerts.push({ level: "warning", text: `${absenceAlertsRes.rows.length}+ students with unusual absence patterns this month` })
    if (alerts.length === 0)
      alerts.push({ level: "info", text: "No urgent issues — everything looks healthy today." })

    const attPct = todayAttendance.total > 0
      ? Math.round((100 * (todayAttendance.present + todayAttendance.late)) / todayAttendance.total)
      : null
    const dailySummary = [
      todayAttendance.total > 0
        ? `Attendance is ${attPct}% today (${todayAttendance.present} present, ${todayAttendance.absent} absent, ${todayAttendance.late} late).`
        : `No attendance has been marked yet today.`,
      feesThisMonth > 0
        ? `₹${feesThisMonth.toLocaleString("en-IN", { maximumFractionDigits: 0 })} collected in fees this month, projected ₹${feeProjection.toLocaleString("en-IN")} by month end.`
        : `No fee collection recorded yet this month.`,
      num(homeworkRes.rows[0]?.pending) > 0
        ? `${num(homeworkRes.rows[0]?.pending)} assignments await submission.`
        : `All assignments are up to date.`,
      pendingLeaves > 0 ? `${pendingLeaves} leave requests pending.` : `No pending leave requests.`,
    ].join(" ")

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
        totalStudents,
        activeStudents: num(studentsRes.rows[0]?.active_count),
        newStudentsThisMonth: num(studentsRes.rows[0]?.new_this_month),
        newStudentsLastMonth: num(studentsRes.rows[0]?.new_last_month),
        totalStaff: num(staffRes.rows[0]?.count),
        activeStaff: num(staffRes.rows[0]?.active_count),
        totalTeachers: num(staffRes.rows[0]?.teachers),
        totalClasses: num(classesRes.rows[0]?.count),
        totalSections: num(sectionsRes.rows[0]?.count),
        totalParents: num(parentsRes.rows[0]?.count),
        todayAttendance,
        feesCollected: num(feesCollectedRes.rows[0]?.total),
        feesThisMonth,
        feesLastMonth: num(feesRes.rows[0]?.last_month),
        pendingFees: feesPending,
        pendingFeeCount: num(feesRes.rows[0]?.pending_count),
        activeExams: num(examsRes.rows[0]?.count),
        upcomingExams: upcomingExamsRes.rows,
        homeworkAssignedThisMonth: num(homeworkRes.rows[0]?.assigned_this_month),
        homeworkPending: num(homeworkRes.rows[0]?.pending),
        homeworkEvaluated: num(homeworkRes.rows[0]?.evaluated),
        totalVehicles: num(transportRes.rows[0]?.vehicles),
        totalRoutes: num(routesRes.rows[0]?.routes),
        transportStudents: num(transportStudentsRes.rows[0]?.count),
        pendingLeaves,
        studentLeavesPending: num(leavesRes.rows[0]?.student_pending),
        staffLeavesPending: num(leavesRes.rows[0]?.staff_pending),
        totalNotices: num(noticesRes.rows[0]?.total),
        noticesThisMonth: num(noticesRes.rows[0]?.this_month),
        pendingEnquiries,
        openComplaints,
        overallAvgScore: overallScoreRes.rows[0]?.avgScore ?? null,
        classPerformance: classPerfRes.rows,
        attendanceMonthly: attendanceMonthlyRes.rows,
        studentAverages: studentAveragesRes.rows,
        perfectAttendance: perfectAttendanceRes.rows,
      },
      insights: {
        absenceAlerts: absenceAlertsRes.rows,
        atRiskStudents: atRiskRes.rows,
        weakPerformers: weakPerformersRes.rows,
        teacherWorkload: workloadRes.rows,
        feeProjection,
        alerts,
        dailySummary,
      },
      recentStudents: recentStudentsRes.rows,
      recentFees: recentFeesRes.rows,
      recentNotices: recentNoticesRes.rows,
      feesByMonth: feesByMonthRes.rows,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
