import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

export type DrillColumn = {
  key: string
  label: string
  type?: "text" | "money" | "number" | "percent" | "date"
  align?: "left" | "right" | "center"
}

type DrillResult = {
  type: string
  title: string
  subtitle?: string
  columns: DrillColumn[]
  rows: Record<string, any>[]
}

const col = (key: string, label: string, type: DrillColumn["type"] = "text", align?: DrillColumn["align"]): DrillColumn => ({
  key,
  label,
  type,
  align: align ?? (type === "money" || type === "number" || type === "percent" ? "right" : "left"),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "students"
  const schoolId = getSessionSchoolId(req) ?? -1
  const opts: DrillFilters = {
    month: searchParams.get("month") || "",
    classId: searchParams.get("classId") || "",
    sectionId: searchParams.get("sectionId") || "",
  }
  try {
    return NextResponse.json(await build(type, schoolId, opts))
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}

type DrillFilters = { month?: string; classId?: string; sectionId?: string }

/** Builds the WHERE fragment + params for fee reports. */
function feeFilter(opts: DrillFilters, params: (string | number)[]) {
  let where = ""
  if (/^\d{4}-\d{2}$/.test(opts.month || "")) {
    params.push(opts.month as string)
    where += ` AND TO_CHAR(COALESCE(fp.payment_date, fp.created_at), 'YYYY-MM') = $${params.length}`
  }
  const classId = parseInt(opts.classId || "", 10)
  if (!Number.isNaN(classId)) {
    params.push(classId)
    where += ` AND fp.class_id = $${params.length}`
  }
  const sectionId = parseInt(opts.sectionId || "", 10)
  if (!Number.isNaN(sectionId)) {
    params.push(sectionId)
    where += ` AND s.section_id = $${params.length}`
  }
  return where
}

function feeScope(opts: DrillFilters) {
  const bits: string[] = []
  if (/^\d{4}-\d{2}$/.test(opts.month || "")) {
    const [y, m] = (opts.month as string).split("-")
    bits.push(new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" }))
  } else bits.push("All months")
  return bits.join(" · ")
}

async function build(type: string, sid: number, opts: DrillFilters = {}): Promise<DrillResult> {
  switch (type) {
    // ---------------------------------------------------------------- students
    case "students":
    case "admissions-new": {
      const onlyNew = type === "admissions-new"
      const res = await query(
        `SELECT s.name, s.admission_no AS "admissionNo", c.name AS class, sec.name AS section,
                s.status, s.admission_date AS "admissionDate"
           FROM students s
           LEFT JOIN classes c ON c.id = s.class_id
           LEFT JOIN sections sec ON sec.id = s.section_id
          WHERE s.school_id = $1
            ${onlyNew ? "AND s.admission_date >= date_trunc('month', CURRENT_DATE)" : ""}
          ORDER BY s.id DESC
          LIMIT 1000`,
        [sid]
      )
      return {
        type,
        title: onlyNew ? "New Admissions This Month" : "All Students",
        subtitle: onlyNew ? "Students admitted in the current month" : "Complete student register",
        columns: [
          col("name", "Student"),
          col("admissionNo", "Admission No"),
          col("class", "Class"),
          col("section", "Section"),
          col("admissionDate", "Admitted", "date"),
          col("status", "Status"),
        ],
        rows: res.rows,
      }
    }

    // -------------------------------------------------------------- attendance
    case "attendance-today":
    case "absent-today": {
      const absentOnly = type === "absent-today"
      const res = await query(
        `SELECT s.name, s.admission_no AS "admissionNo", c.name AS class, sec.name AS section,
                COALESCE(at.type, 'Unknown') AS status, sa.date
           FROM student_attendance sa
           JOIN students s ON s.id = sa.student_id
           LEFT JOIN classes c ON c.id = s.class_id
           LEFT JOIN sections sec ON sec.id = s.section_id
           LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
          WHERE sa.school_id = $1 AND sa.date = CURRENT_DATE
            ${absentOnly ? "AND at.type = 'Absent'" : ""}
          ORDER BY s.name`,
        [sid]
      )
      return {
        type,
        title: absentOnly ? "Students Absent Today" : "Today's Attendance Register",
        subtitle: `${res.rows.length} record${res.rows.length === 1 ? "" : "s"} for ${new Date().toLocaleDateString("en-IN")}`,
        columns: [
          col("name", "Student"),
          col("admissionNo", "Admission No"),
          col("class", "Class"),
          col("section", "Section"),
          col("status", "Attendance"),
          col("date", "Date", "date"),
        ],
        rows: res.rows,
      }
    }

    case "attendance-monthly": {
      const res = await query(
        `SELECT TO_CHAR(sa.date, 'Mon YYYY') AS month,
                COUNT(*) FILTER (WHERE at.type = 'Present')::int AS present,
                COUNT(*) FILTER (WHERE at.type = 'Late')::int AS late,
                COUNT(*) FILTER (WHERE at.type = 'Absent')::int AS absent,
                COUNT(*)::int AS total
           FROM student_attendance sa
           LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
          WHERE sa.school_id = $1 AND sa.date >= date_trunc('month', CURRENT_DATE - interval '5 months')
          GROUP BY TO_CHAR(sa.date, 'Mon YYYY'), date_trunc('month', sa.date)
          ORDER BY date_trunc('month', sa.date)`,
        [sid]
      )
      return {
        type,
        title: "Monthly Attendance Summary",
        subtitle: "Present / late / absent marks for the last six months",
        columns: [
          col("month", "Month"),
          col("present", "Present", "number"),
          col("late", "Late", "number"),
          col("absent", "Absent", "number"),
          col("total", "Total Marked", "number"),
        ],
        rows: res.rows,
      }
    }

    case "at-risk-attendance": {
      const res = await query(
        `SELECT s.name, c.name AS class,
                COUNT(*)::int AS days,
                ROUND(100.0 * COUNT(*) FILTER (WHERE at.type IN ('Present', 'Late')) / GREATEST(COUNT(*), 1))::int AS pct
           FROM student_attendance sa
           JOIN attendance_types at ON at.id = sa.attendance_type_id
           JOIN students s ON s.id = sa.student_id
           LEFT JOIN classes c ON c.id = s.class_id
          WHERE sa.school_id = $1 AND sa.date >= CURRENT_DATE - 30
          GROUP BY s.id, s.name, c.name
         HAVING COUNT(*) >= 5
            AND 100.0 * COUNT(*) FILTER (WHERE at.type IN ('Present', 'Late')) / COUNT(*) < 75
          ORDER BY pct ASC`,
        [sid]
      )
      return {
        type,
        title: "Students Below 75% Attendance",
        subtitle: "Last 30 days — at risk of academic gaps",
        columns: [col("name", "Student"), col("class", "Class"), col("days", "Days Marked", "number"), col("pct", "Attendance", "percent")],
        rows: res.rows,
      }
    }

    case "absence-patterns": {
      const res = await query(
        `SELECT s.name, c.name AS class, COUNT(*)::int AS absences
           FROM student_attendance sa
           JOIN attendance_types at ON at.id = sa.attendance_type_id AND at.type = 'Absent'
           JOIN students s ON s.id = sa.student_id
           LEFT JOIN classes c ON c.id = s.class_id
          WHERE sa.school_id = $1 AND sa.date >= CURRENT_DATE - 30
          GROUP BY s.id, s.name, c.name
         HAVING COUNT(*) >= 3
          ORDER BY absences DESC`,
        [sid]
      )
      return {
        type,
        title: "Unusual Absence Patterns",
        subtitle: "Students with 3 or more absences in the last 30 days",
        columns: [col("name", "Student"), col("class", "Class"), col("absences", "Absences", "number")],
        rows: res.rows,
      }
    }

    case "perfect-attendance": {
      const res = await query(
        `SELECT s.name, c.name AS class,
                COUNT(*) FILTER (WHERE at.type IN ('Present', 'Late'))::int AS present,
                COUNT(*)::int AS total
           FROM student_attendance sa
           JOIN attendance_types at ON at.id = sa.attendance_type_id
           JOIN students s ON s.id = sa.student_id
           LEFT JOIN classes c ON c.id = s.class_id
          WHERE sa.school_id = $1 AND sa.date >= CURRENT_DATE - 30
          GROUP BY s.id, s.name, c.name
         HAVING COUNT(*) FILTER (WHERE at.type = 'Absent') = 0 AND COUNT(*) >= 3
          ORDER BY present DESC, total DESC`,
        [sid]
      )
      return {
        type,
        title: "Perfect Attendance — Last 30 Days",
        subtitle: "Zero absences across all marked days",
        columns: [col("name", "Student"), col("class", "Class"), col("present", "Present", "number"), col("total", "Days Marked", "number")],
        rows: res.rows,
      }
    }

    // -------------------------------------------------------------------- fees
    case "fees-collected": {
      const params: (string | number)[] = [sid]
      const filter = feeFilter(opts, params)
      const res = await query(
        `SELECT s.name, c.name AS class, sec.name AS section, ft.name AS "feeType",
                fp.amount, fp.paid_amount AS paid,
                fp.payment_mode AS mode, fp.payment_date AS date
           FROM fees_payments fp
           LEFT JOIN students s ON s.id = fp.student_id
           LEFT JOIN classes c ON c.id = fp.class_id
           LEFT JOIN sections sec ON sec.id = s.section_id
           LEFT JOIN fees_types ft ON ft.id = fp.fees_type_id
          WHERE fp.school_id = $1 AND COALESCE(fp.paid_amount, 0) > 0${filter}
          ORDER BY fp.payment_date DESC NULLS LAST, fp.id DESC
          LIMIT 2000`,
        params
      )
      return {
        type,
        title: "Fees Collected",
        subtitle: `Received payments · ${feeScope(opts)}`,
        columns: [
          col("name", "Student"),
          col("class", "Class"),
          col("section", "Section"),
          col("feeType", "Fee Type"),
          col("amount", "Billed", "money"),
          col("paid", "Paid", "money"),
          col("mode", "Mode"),
          col("date", "Date", "date"),
        ],
        rows: res.rows,
      }
    }

    case "pending-fees":
    case "fee-health": {
      const params: (string | number)[] = [sid]
      const filter = feeFilter(opts, params)
      const res = await query(
        `SELECT s.name, c.name AS class, sec.name AS section, ft.name AS "feeType",
                fp.amount, fp.paid_amount AS paid,
                GREATEST(COALESCE(fp.amount, 0) - COALESCE(fp.paid_amount, 0) - COALESCE(fp.discount_amount, 0), 0) AS outstanding,
                fp.status, COALESCE(fp.payment_date, fp.created_at) AS date
           FROM fees_payments fp
           LEFT JOIN students s ON s.id = fp.student_id
           LEFT JOIN classes c ON c.id = fp.class_id
           LEFT JOIN sections sec ON sec.id = s.section_id
           LEFT JOIN fees_types ft ON ft.id = fp.fees_type_id
          WHERE fp.school_id = $1
            AND fp.status IS DISTINCT FROM 'Paid' AND fp.status IS DISTINCT FROM 'Success'${filter}
          ORDER BY outstanding DESC
          LIMIT 2000`,
        params
      )
      return {
        type,
        title: "Pending Fee Dues",
        subtitle: `Outstanding invoices · ${feeScope(opts)}`,
        columns: [
          col("name", "Student"),
          col("class", "Class"),
          col("section", "Section"),
          col("feeType", "Fee Type"),
          col("amount", "Billed", "money"),
          col("paid", "Paid", "money"),
          col("outstanding", "Outstanding", "money"),
          col("status", "Status"),
          col("date", "Date", "date"),
        ],
        rows: res.rows,
      }
    }

    case "fees-by-month": {
      const res = await query(
        `SELECT TO_CHAR(payment_date, 'Mon YYYY') AS month, COALESCE(SUM(paid_amount), 0)::float AS total
           FROM fees_payments
          WHERE school_id = $1 AND payment_date IS NOT NULL
          GROUP BY TO_CHAR(payment_date, 'Mon YYYY'), date_trunc('month', payment_date)
          ORDER BY date_trunc('month', payment_date)`,
        [sid]
      )
      return {
        type,
        title: "Fee Collection by Month",
        subtitle: "Received amount per calendar month",
        columns: [col("month", "Month"), col("total", "Collected", "money")],
        rows: res.rows,
      }
    }

    // ------------------------------------------------------------------- exams
    case "exam-scores":
    case "toppers": {
      const toppers = type === "toppers"
      const res = await query(
        `SELECT s.name, c.name AS class,
                ROUND(100.0 * SUM(COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0))
                      / NULLIF(SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)), 0))::int AS pct
           FROM exam_marks em
           JOIN students s ON s.id = em.student_id
           LEFT JOIN classes c ON c.id = s.class_id
           JOIN exam_subjects es ON es.id = em.subject_id
          WHERE s.school_id = $1 AND COALESCE(em.absent, false) = false
          GROUP BY s.id, s.name, s.class_id, c.name
         HAVING SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)) > 0
          ORDER BY pct ${toppers ? "DESC" : "ASC"}
          LIMIT 1000`,
        [sid]
      )
      return {
        type,
        title: toppers ? "Class Toppers — Exam Averages" : "Average Exam Scores",
        subtitle: "Aggregate score across all recorded exams",
        columns: [col("name", "Student"), col("class", "Class"), col("pct", "Score", "percent")],
        rows: res.rows,
      }
    }

    case "weak-performers": {
      const res = await query(
        `SELECT s.name, c.name AS class,
                ROUND(100.0 * SUM(COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0))
                      / GREATEST(SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)), 1))::int AS pct
           FROM exam_marks em
           JOIN exam_subjects es ON es.id = em.subject_id
           JOIN students s ON s.id = em.student_id
           LEFT JOIN classes c ON c.id = s.class_id
          WHERE s.school_id = $1 AND COALESCE(em.absent, false) = false
          GROUP BY s.id, s.name, c.name
         HAVING SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)) > 0
            AND 100.0 * SUM(COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0))
                / SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)) < 40
          ORDER BY pct ASC`,
        [sid]
      )
      return {
        type,
        title: "Weak Performers",
        subtitle: "Students scoring below 40% overall",
        columns: [col("name", "Student"), col("class", "Class"), col("pct", "Score", "percent")],
        rows: res.rows,
      }
    }

    case "upcoming-exams": {
      const res = await query(
        `SELECT e.name AS exam, es.name AS subject, es.date, es.time, es.room
           FROM exam_subjects es
           JOIN exams e ON e.id = es.exam_id
          WHERE es.school_id = $1 AND es.date IS NOT NULL AND es.date >= CURRENT_DATE
          ORDER BY es.date ASC, es.time ASC NULLS LAST`,
        [sid]
      )
      return {
        type,
        title: "Upcoming Exams",
        subtitle: "Scheduled subject papers from today",
        columns: [col("exam", "Exam"), col("subject", "Subject"), col("date", "Date", "date"), col("time", "Time"), col("room", "Room")],
        rows: res.rows,
      }
    }

    // -------------------------------------------------------------- people/org
    case "teachers": {
      const res = await query(
        `SELECT name, COALESCE(role, '') AS role, COALESCE(phone, contact_no, '') AS phone,
                COALESCE(email, '') AS email, status
           FROM staff
          WHERE school_id = $1 AND role ILIKE '%teacher%'
          ORDER BY name`,
        [sid]
      )
      return {
        type,
        title: "Teachers",
        subtitle: "Teaching faculty on record",
        columns: [col("name", "Teacher"), col("role", "Role"), col("phone", "Phone"), col("email", "Email"), col("status", "Status")],
        rows: res.rows,
      }
    }

    case "parents": {
      const res = await query(
        `SELECT name, username, email, status
           FROM users
          WHERE school_id = $1 AND role = 'parent'
          ORDER BY name`,
        [sid]
      )
      return {
        type,
        title: "Parent Accounts",
        subtitle: "Registered parent logins",
        columns: [col("name", "Parent"), col("username", "Username"), col("email", "Email"), col("status", "Status")],
        rows: res.rows,
      }
    }

    case "classes": {
      const res = await query(
        `SELECT c.name,
                COUNT(DISTINCT sec.id)::int AS sections,
                COUNT(DISTINCT s.id)::int AS students
           FROM classes c
           LEFT JOIN sections sec ON sec.class_id = c.id
           LEFT JOIN students s ON s.class_id = c.id AND s.status = 'Active'
          WHERE c.school_id = $1
          GROUP BY c.id, c.name
          ORDER BY c.order_number NULLS LAST, c.name`,
        [sid]
      )
      return {
        type,
        title: "Classes & Sections",
        subtitle: "Active enrollment per class",
        columns: [col("name", "Class"), col("sections", "Sections", "number"), col("students", "Students", "number")],
        rows: res.rows,
      }
    }

    case "class-performance": {
      const res = await query(
        `SELECT c.name AS class,
                COUNT(DISTINCT s.id)::int AS students,
                ROUND(100.0 * COUNT(sa.id) FILTER (WHERE at.type IN ('Present', 'Late')) / NULLIF(COUNT(sa.id), 0))::int AS "attendance",
                ROUND(100.0 * SUM(COALESCE(em.theory_marks, 0) + COALESCE(em.practical_marks, 0))
                      / NULLIF(SUM(COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)), 0))::int AS "score"
           FROM classes c
           LEFT JOIN students s ON s.class_id = c.id AND s.status = 'Active'
           LEFT JOIN student_attendance sa ON sa.student_id = s.id AND sa.date >= CURRENT_DATE - 30
           LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
           LEFT JOIN exam_marks em ON em.student_id = s.id AND COALESCE(em.absent, false) = false
           LEFT JOIN exam_subjects es ON es.id = em.subject_id
          WHERE c.school_id = $1
          GROUP BY c.id, c.name, c.order_number
          ORDER BY students DESC`,
        [sid]
      )
      return {
        type,
        title: "Class Performance",
        subtitle: "Attendance and exam score by class",
        columns: [
          col("class", "Class"),
          col("students", "Students", "number"),
          col("attendance", "Attendance", "percent"),
          col("score", "Avg Score", "percent"),
        ],
        rows: res.rows,
      }
    }

    case "teacher-workload": {
      const res = await query(
        `SELECT teacher_name AS teacher, COUNT(*)::int AS periods, COUNT(DISTINCT class_id)::int AS classes
           FROM timetable_entries
          WHERE school_id = $1 AND teacher_name IS NOT NULL AND teacher_name <> ''
          GROUP BY teacher_name
          ORDER BY periods DESC`,
        [sid]
      )
      return {
        type,
        title: "Teacher Workload",
        subtitle: "Weekly periods assigned per teacher",
        columns: [col("teacher", "Teacher"), col("periods", "Periods", "number"), col("classes", "Classes", "number")],
        rows: res.rows,
      }
    }

    case "transport": {
      const res = await query(
        `SELECT s.name, COALESCE(r.title, '-') AS route, COALESCE(v.name, v.number, '-') AS vehicle,
                stf.amount, stf.paid_status AS status, stf.payment_date AS date
           FROM student_transport_fees stf
           JOIN students s ON s.id = stf.student_id
           LEFT JOIN routes r ON r.id = stf.route_id
           LEFT JOIN vehicles v ON v.id = stf.vehicle_id
          WHERE stf.school_id = $1
          ORDER BY s.name`,
        [sid]
      )
      return {
        type,
        title: "Transport Users",
        subtitle: "Students availing school transport",
        columns: [col("name", "Student"), col("route", "Route"), col("vehicle", "Vehicle"), col("amount", "Fee", "money"), col("status", "Paid Status"), col("date", "Payment Date", "date")],
        rows: res.rows,
      }
    }

    // ---------------------------------------------------------- pending queues
    case "pending-leaves": {
      const res = await query(
        `SELECT name, role, from_date AS "from", to_date AS "to", days, reason, status
           FROM leave_requests
          WHERE school_id = $1 AND status = 'Pending'
          ORDER BY from_date ASC NULLS LAST, id DESC`,
        [sid]
      )
      return {
        type,
        title: "Pending Leave Requests",
        subtitle: "Awaiting approval",
        columns: [col("name", "Applicant"), col("role", "Role"), col("from", "From", "date"), col("to", "To", "date"), col("days", "Days", "number"), col("reason", "Reason"), col("status", "Status")],
        rows: res.rows,
      }
    }

    case "open-complaints": {
      const res = await query(
        `SELECT name, COALESCE(description, '') AS description,
                COALESCE(date::text, created_at::text) AS date, status
           FROM complaints
          WHERE school_id = $1 AND status IS DISTINCT FROM 'Resolved' AND status IS DISTINCT FROM 'Closed'
          ORDER BY id DESC`,
        [sid]
      )
      return {
        type,
        title: "Open Complaints",
        subtitle: "Unresolved complaints on record",
        columns: [col("name", "Complainant"), col("description", "Complaint"), col("date", "Raised", "date"), col("status", "Status")],
        rows: res.rows,
      }
    }

    case "pending-enquiries": {
      const res = await query(
        `SELECT e.name, e.phone, c.name AS class, e.enquiry_date AS date, e.status
           FROM admission_enquiries e
           LEFT JOIN classes c ON c.id = e.class_id
          WHERE e.school_id = $1 AND e.status = 'Pending'
          ORDER BY e.id DESC`,
        [sid]
      )
      return {
        type,
        title: "Admission Enquiries — Follow-up",
        subtitle: "Pending enquiries awaiting action",
        columns: [col("name", "Name"), col("phone", "Phone"), col("class", "Class"), col("date", "Enquiry Date", "date"), col("status", "Status")],
        rows: res.rows,
      }
    }

    case "notices": {
      const res = await query(
        `SELECT title, COALESCE(publish_date, notice_date) AS date
           FROM notices
          WHERE school_id = $1
          ORDER BY COALESCE(publish_date, notice_date) DESC NULLS LAST, id DESC
          LIMIT 200`,
        [sid]
      )
      return {
        type,
        title: "Notice Board",
        subtitle: "Published notices",
        columns: [col("title", "Notice"), col("date", "Date", "date")],
        rows: res.rows,
      }
    }

    // ---------------------------------------------------------------- fallback
    default: {
      const res = await query(
        `SELECT s.name, s.admission_no AS "admissionNo", c.name AS class, s.status
           FROM students s
           LEFT JOIN classes c ON c.id = s.class_id
          WHERE s.school_id = $1
          ORDER BY s.id DESC
          LIMIT 500`,
        [sid]
      )
      return {
        type: "students",
        title: "Records",
        subtitle: "Student records",
        columns: [col("name", "Student"), col("admissionNo", "Admission No"), col("class", "Class"), col("status", "Status")],
        rows: res.rows,
      }
    }
  }
}
