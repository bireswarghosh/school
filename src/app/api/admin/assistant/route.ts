import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

type Table = { title?: string; headers: string[]; rows: (string | number)[][]; note?: string }
type Answer = { reply: string; tables?: Table[] }

const inr = (n: unknown) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
const CAP = 50

const toRows = (rows: any[], pick: string[]): (string | number)[][] =>
  rows.slice(0, CAP).map((r) => pick.map((k) => (r[k] ?? "—") as string | number))

async function getClasses() {
  const r = await query(`SELECT id, name FROM classes ORDER BY id`)
  return r.rows as { id: number; name: string }[]
}

function matchClass(q: string, classes: { id: number; name: string }[]) {
  const lower = q.toLowerCase()
  for (const c of classes) {
    if (c.name && lower.includes(String(c.name).toLowerCase())) return c
  }
  const m = lower.match(/class\s*[-\s]?([a-z0-9]+)/)
  if (m) {
    const token = m[1]
    const hit = classes.find((c) => String(c.name).toLowerCase().replace(/[^a-z0-9]/g, "") === token.replace(/[^a-z0-9]/g, ""))
    if (hit) return hit
    const hit2 = classes.find((c) => String(c.name).toLowerCase().includes(token))
    if (hit2) return hit2
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const raw = String(body?.question || body?.message || "").trim()
    const q = raw.toLowerCase()
    if (!q) return NextResponse.json({ reply: "Ask me anything about your school — try “pending fees”, “today's absentees” or “help”." } as Answer)
    const tables: Table[] = []
    const push = (t: Table) => { if (t.rows.length > 0) tables.push(t) }
    let reply = ""

    const classes = await getClasses()
    const cls = matchClass(q, classes)
    const clsFilter = (alias: string) => (cls ? ` AND ${alias}.class_id = ${Number(cls.id)}` : "")

    const wantsPendingFees = /fee|dues|defaulter|payment|outstanding/.test(q) && /pending|due|unpaid|outstanding|defaulter|owe|owing/.test(q)
    const wantsCollected = /collect|revenue|income|received|payment.*today|today.*payment/.test(q) && /fee|payment|collect|revenue|income/.test(q)
    const wantsFees = /fee/.test(q)

    if (wantsPendingFees) {
      if (/group|class.?wise|by class|summary|total/.test(q)) {
        const r = await query(
          `SELECT c.name AS class, sec.name AS section,
                  COUNT(DISTINCT s.id)::int AS students,
                  COUNT(*)::int AS bills,
                  COALESCE(SUM(GREATEST(COALESCE(fp.amount,0) - COALESCE(fp.paid_amount,0) - COALESCE(fp.discount_amount,0), 0)), 0)::float AS pending
             FROM fees_payments fp
             JOIN students s ON s.id = fp.student_id
             LEFT JOIN classes c ON c.id = s.class_id
             LEFT JOIN sections sec ON sec.id = s.section_id
            WHERE fp.status IS DISTINCT FROM 'Paid' AND fp.status IS DISTINCT FROM 'Success'${clsFilter("s")}
            GROUP BY c.name, sec.name
           HAVING COALESCE(SUM(GREATEST(COALESCE(fp.amount,0) - COALESCE(fp.paid_amount,0) - COALESCE(fp.discount_amount,0), 0)), 0) > 0
            ORDER BY pending DESC`
        )
        const total = r.rows.reduce((a: number, x: any) => a + Number(x.pending || 0), 0)
        reply = `Outstanding fees ${cls ? `for ${cls.name} ` : ""}total ${inr(total)} across ${r.rows.length} class-sections. Breakdown below.`
        push({ title: "Pending fees by class / section", headers: ["Class", "Section", "Students", "Bills", "Pending"], rows: toRows(r.rows, ["class", "section", "students", "bills", "pending"]) })
      } else {
        const r = await query(
          `SELECT s.name AS student, s.admission_no AS adm, c.name AS class, sec.name AS section,
                  COALESCE(SUM(GREATEST(COALESCE(fp.amount,0) - COALESCE(fp.paid_amount,0) - COALESCE(fp.discount_amount,0), 0)), 0)::float AS pending
             FROM fees_payments fp
             JOIN students s ON s.id = fp.student_id
             LEFT JOIN classes c ON c.id = s.class_id
             LEFT JOIN sections sec ON sec.id = s.section_id
            WHERE fp.status IS DISTINCT FROM 'Paid' AND fp.status IS DISTINCT FROM 'Success'${clsFilter("s")}
            GROUP BY s.name, s.admission_no, c.name, sec.name
           HAVING COALESCE(SUM(GREATEST(COALESCE(fp.amount,0) - COALESCE(fp.paid_amount,0) - COALESCE(fp.discount_amount,0), 0)), 0) > 0
            ORDER BY pending DESC LIMIT ${CAP}`
        )
        const total = r.rows.reduce((a: number, x: any) => a + Number(x.pending || 0), 0)
        reply = `${r.rows.length} students owe a total of ${inr(total)}${cls ? ` in ${cls.name}` : ""}. Top defaulters below.`
        push({ title: "Fee defaulters", headers: ["Student", "Adm No", "Class", "Sec", "Pending"], rows: toRows(r.rows, ["student", "adm", "class", "section", "pending"]) })
      }
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (wantsCollected) {
      const r = await query(
        `SELECT COALESCE(SUM(COALESCE(paid_amount,0)) FILTER (WHERE payment_date = CURRENT_DATE), 0)::float AS today,
                COALESCE(SUM(COALESCE(paid_amount,0)) FILTER (WHERE payment_date >= date_trunc('month', CURRENT_DATE)), 0)::float AS month,
                COALESCE(SUM(COALESCE(paid_amount,0)), 0)::float AS total
           FROM fees_payments`
      )
      const m = await query(
        `SELECT COALESCE(payment_mode, 'Unknown') AS mode, COALESCE(SUM(COALESCE(paid_amount,0)), 0)::float AS amount, COUNT(*)::int AS txns
           FROM fees_payments WHERE COALESCE(paid_amount, 0) > 0 AND payment_date >= date_trunc('month', CURRENT_DATE)
           GROUP BY payment_mode ORDER BY amount DESC`
      )
      const t = r.rows[0] || { today: 0, month: 0, total: 0 }
      reply = `Collected ${inr(t.today)} today, ${inr(t.month)} this month, ${inr(t.total)} overall. This month by mode below.`
      push({ title: "This month by payment mode", headers: ["Mode", "Amount", "Transactions"], rows: toRows(m.rows, ["mode", "amount", "txns"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/absent/.test(q) && /today|now/.test(q)) {
      const r = await query(
        `SELECT s.name AS student, s.admission_no AS adm, c.name AS class, sec.name AS section
           FROM student_attendance sa
           JOIN attendance_types at ON at.id = sa.attendance_type_id AND at.type = 'Absent'
           JOIN students s ON s.id = sa.student_id
           LEFT JOIN classes c ON c.id = s.class_id
           LEFT JOIN sections sec ON sec.id = s.section_id
          WHERE sa.date = CURRENT_DATE${clsFilter("s")}
          ORDER BY c.name, s.name LIMIT ${CAP}`
      )
      reply = r.rows.length === 0 ? "Nobody marked absent today. Attendance may not be marked yet." : `${r.rows.length} students absent today${cls ? ` in ${cls.name}` : ""}.`
      push({ title: "Absent today", headers: ["Student", "Adm No", "Class", "Sec"], rows: toRows(r.rows, ["student", "adm", "class", "section"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    const dateM = q.match(/(\d{4}-\d{2}-\d{2})/)
    if (/attendance/.test(q) && dateM) {
      const r = await query(
        `SELECT COALESCE(at.type, 'Unknown') AS status, COUNT(*)::int AS count
           FROM student_attendance sa
           LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
          WHERE sa.date = '${dateM[1]}'
          GROUP BY at.type ORDER BY count DESC`
      )
      const parts = r.rows.map((x: any) => `${x.status}: ${x.count}`).join(", ")
      reply = r.rows.length === 0 ? `No attendance marked on ${dateM[1]}.` : `Attendance on ${dateM[1]} — ${parts}.`
      push({ title: `Attendance ${dateM[1]}`, headers: ["Status", "Count"], rows: toRows(r.rows, ["status", "count"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/attendance/.test(q) && /month|monthly|trend/.test(q)) {
      const r = await query(
        `SELECT TO_CHAR(sa.date, 'YYYY-MM') AS month,
                COUNT(*) FILTER (WHERE at.type = 'Present')::int AS present,
                COUNT(*) FILTER (WHERE at.type = 'Absent')::int AS absent,
                COUNT(*) FILTER (WHERE at.type = 'Late')::int AS late
           FROM student_attendance sa
           LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
          WHERE sa.date >= date_trunc('month', CURRENT_DATE - interval '5 months')
          GROUP BY 1 ORDER BY 1`
      )
      reply = r.rows.length === 0 ? "No attendance records in the last 6 months." : `Month-wise attendance for the last ${r.rows.length} months.`
      push({ title: "Monthly attendance", headers: ["Month", "Present", "Absent", "Late"], rows: toRows(r.rows, ["month", "present", "absent", "late"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/attendance/.test(q) && /low|poor|risk|below|defaulter/.test(q)) {
      const r = await query(
        `SELECT s.name AS student, s.admission_no AS adm, c.name AS class,
                COUNT(*)::int AS days,
                ROUND(100.0 * COUNT(*) FILTER (WHERE at.type IN ('Present','Late')) / GREATEST(COUNT(*),1))::int AS pct
           FROM student_attendance sa
           JOIN attendance_types at ON at.id = sa.attendance_type_id
           JOIN students s ON s.id = sa.student_id
           LEFT JOIN classes c ON c.id = s.class_id
          WHERE sa.date >= CURRENT_DATE - 30${clsFilter("s")}
          GROUP BY s.name, s.admission_no, c.name
         HAVING COUNT(*) >= 5 AND 100.0 * COUNT(*) FILTER (WHERE at.type IN ('Present','Late')) / COUNT(*) < 75
          ORDER BY pct ASC LIMIT ${CAP}`
      )
      reply = r.rows.length === 0 ? "Nobody below 75% attendance in the last 30 days. Healthy!" : `${r.rows.length} students below 75% attendance (30 days).`
      push({ title: "Low attendance (<75%)", headers: ["Student", "Adm No", "Class", "Days", "Att %"], rows: toRows(r.rows, ["student", "adm", "class", "days", "pct"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/leave/.test(q)) {
      const r = await query(
        `SELECT name, role, leave_type_id AS type, from_date AS from, to_date AS to, days, reason, status
           FROM leave_requests
          WHERE ${/pending|await|approv/.test(q) ? "status = 'Pending'" : "status IS NOT NULL"}
          ORDER BY id DESC LIMIT ${CAP}`
      )
      const pend = /pending|await|approv/.test(q)
      reply = r.rows.length === 0 ? (pend ? "No leave requests awaiting approval." : "No leave requests found.") : `${r.rows.length} leave request${r.rows.length > 1 ? "s" : ""}${pend ? " awaiting approval" : ""}.`
      push({ title: pend ? "Pending leaves" : "Leave requests", headers: ["Name", "Role", "Type", "From", "To", "Days", "Reason", "Status"], rows: toRows(r.rows, ["name", "role", "type", "from", "to", "days", "reason", "status"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/enquir|admission/.test(q) && /new|pending|follow|list|show/.test(q)) {
      const r = await query(
        `SELECT name, phone, class_id AS class, status, enquiry_date AS date FROM admission_enquiries
          WHERE ${/pending|follow/.test(q) ? "status = 'Pending'" : "id IS NOT NULL"}
          ORDER BY id DESC LIMIT ${CAP}`
      )
      reply = r.rows.length === 0 ? "No admission enquiries found." : `${r.rows.length} admission enquiries.`
      push({ title: "Admission enquiries", headers: ["Name", "Phone", "Class", "Status", "Date"], rows: toRows(r.rows, ["name", "phone", "class", "status", "date"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/complaint/.test(q)) {
      const r = await query(
        `SELECT name, phone, description, status, date FROM complaints
          WHERE ${/open|pending|unresolv/.test(q) ? "status IS DISTINCT FROM 'Resolved' AND status IS DISTINCT FROM 'Closed'" : "id IS NOT NULL"}
          ORDER BY id DESC LIMIT ${CAP}`
      )
      reply = r.rows.length === 0 ? "No complaints found. All clear!" : `${r.rows.length} complaint${r.rows.length > 1 ? "s" : ""} on record.`
      push({ title: "Complaints", headers: ["Name", "Phone", "Description", "Status", "Date"], rows: toRows(r.rows, ["name", "phone", "description", "status", "date"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/topper|top |rank|result|score|marks|best student/.test(q)) {
      const r = await query(
        `SELECT s.name AS student, c.name AS class,
                ROUND(100.0 * SUM(COALESCE(em.theory_marks,0) + COALESCE(em.practical_marks,0)) / NULLIF(SUM(COALESCE(es.theory_max,0) + COALESCE(es.practical_max,0)),0))::int AS pct
           FROM exam_marks em
           JOIN students s ON s.id = em.student_id
           LEFT JOIN classes c ON c.id = s.class_id
           JOIN exam_subjects es ON es.id = em.subject_id
          WHERE COALESCE(em.absent, false) = false${clsFilter("s")}
          GROUP BY s.name, c.name
         HAVING SUM(COALESCE(es.theory_max,0) + COALESCE(es.practical_max,0)) > 0
          ORDER BY pct DESC NULLS LAST LIMIT 10`
      )
      reply = r.rows.length === 0 ? "No exam marks recorded yet." : `Top ${r.rows.length} students by exam average${cls ? ` in ${cls.name}` : ""}.`
      push({ title: "Top students", headers: ["Student", "Class", "Avg %"], rows: toRows(r.rows, ["student", "class", "pct"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/strength|how many student|total student|students in|class list|student list/.test(q)) {
      if (cls) {
        const r = await query(
          `SELECT s.name AS student, s.admission_no AS adm, sec.name AS section, s.status
             FROM students s LEFT JOIN sections sec ON sec.id = s.section_id
            WHERE s.class_id = ${Number(cls.id)} ORDER BY s.name LIMIT ${CAP}`
        )
        const c = await query(`SELECT COUNT(*)::int AS n FROM students WHERE class_id = ${Number(cls.id)}`)
        reply = `${cls.name} has ${c.rows[0]?.n ?? 0} students.`
        push({ title: `Students — ${cls.name}`, headers: ["Student", "Adm No", "Section", "Status"], rows: toRows(r.rows, ["student", "adm", "section", "status"]) })
        return NextResponse.json({ reply, tables } as Answer)
      }
      const r = await query(
        `SELECT c.name AS class, COUNT(*)::int AS students, COUNT(*) FILTER (WHERE s.status = 'Active')::int AS active
           FROM students s LEFT JOIN classes c ON c.id = s.class_id GROUP BY c.name ORDER BY students DESC`
      )
      const total = r.rows.reduce((a: number, x: any) => a + Number(x.students || 0), 0)
      reply = `${total} students in total. Class-wise strength below.`
      push({ title: "Class strength", headers: ["Class", "Students", "Active"], rows: toRows(r.rows, ["class", "students", "active"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/teacher|staff|employee/.test(q)) {
      const r = await query(
        `SELECT name, role, email, phone, status FROM staff ORDER BY name LIMIT ${CAP}`
      )
      const t = await query(`SELECT COUNT(*) FILTER (WHERE role ILIKE '%teacher%')::int AS teachers, COUNT(*)::int AS all FROM staff`)
      reply = `${t.rows[0]?.teachers ?? 0} teachers out of ${t.rows[0]?.all ?? 0} staff. Directory below.`
      push({ title: "Staff directory", headers: ["Name", "Role", "Email", "Phone", "Status"], rows: toRows(r.rows, ["name", "role", "email", "phone", "status"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/exam|schedule|test/.test(q)) {
      const r = await query(
        `SELECT e.name AS exam, es.name AS subject, es.date, es.time, es.room
           FROM exam_subjects es JOIN exams e ON e.id = es.exam_id
          WHERE es.date IS NOT NULL AND es.date >= CURRENT_DATE ORDER BY es.date ASC, es.time ASC NULLS LAST LIMIT 20`
      )
      reply = r.rows.length === 0 ? "No upcoming exam schedule published." : `${r.rows.length} upcoming exam papers scheduled.`
      push({ title: "Upcoming exams", headers: ["Exam", "Subject", "Date", "Time", "Room"], rows: toRows(r.rows, ["exam", "subject", "date", "time", "room"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/homework|assignment/.test(q)) {
      const r = await query(
        `SELECT c.name AS class, sec.name AS section, sub.name AS subject, homework_date AS given, submission_date AS due, status
           FROM homework h LEFT JOIN classes c ON c.id = h.class_id LEFT JOIN sections sec ON sec.id = h.section_id LEFT JOIN subjects sub ON sub.id = h.subject_id
          WHERE ${/pending|await|due/.test(q) ? "status = 'Assigned' AND submission_date >= CURRENT_DATE" : "id IS NOT NULL"}
          ORDER BY submission_date DESC NULLS LAST LIMIT ${CAP}`
      )
      reply = r.rows.length === 0 ? "No homework records found." : `${r.rows.length} homework entries.`
      push({ title: "Homework", headers: ["Class", "Sec", "Subject", "Given", "Due", "Status"], rows: toRows(r.rows, ["class", "section", "subject", "given", "due", "status"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/transport|bus|vehicle|route/.test(q)) {
      const v = await query(`SELECT number, name, capacity, driver_name AS driver, driver_contact AS contact FROM vehicles ORDER BY id`)
      const r = await query(`SELECT COUNT(DISTINCT student_id)::int AS riders FROM student_transport_fees`)
      reply = `${v.rows.length} vehicles, ${r.rows[0]?.riders ?? 0} students using transport. Fleet below.`
      push({ title: "Transport fleet", headers: ["Number", "Name", "Capacity", "Driver", "Contact"], rows: toRows(v.rows, ["number", "name", "capacity", "driver", "contact"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/notice|announcement|notification/.test(q)) {
      const r = await query(`SELECT title, notice_date AS date, publish_date AS published FROM notices ORDER BY COALESCE(publish_date, notice_date) DESC NULLS LAST, id DESC LIMIT 10`)
      reply = r.rows.length === 0 ? "No notices published yet." : `${r.rows.length} latest notices.`
      push({ title: "Notice board", headers: ["Title", "Date", "Published"], rows: toRows(r.rows, ["title", "date", "published"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/birthday|born|dob/.test(q)) {
      const r = await query(
        `SELECT s.name AS name, dob, c.name AS class FROM students s LEFT JOIN classes c ON c.id = s.class_id
          WHERE TO_CHAR(dob, 'MM-DD') = TO_CHAR(CURRENT_DATE, 'MM-DD') ORDER BY name LIMIT 20`
      )
      reply = r.rows.length === 0 ? "No student birthdays today." : `${r.rows.length} birthday${r.rows.length > 1 ? "s" : ""} today — wish them!`
      push({ title: "Birthdays today", headers: ["Student", "DOB", "Class"], rows: toRows(r.rows, ["name", "dob", "class"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/new admission|latest student|recent.*student|admission.*recent/.test(q)) {
      const r = await query(
        `SELECT s.name AS student, s.admission_no AS adm, c.name AS class, s.admission_date AS date, s.status
           FROM students s LEFT JOIN classes c ON c.id = s.class_id ORDER BY s.id DESC LIMIT 15`
      )
      reply = "Latest admissions below."
      push({ title: "Latest admissions", headers: ["Student", "Adm No", "Class", "Date", "Status"], rows: toRows(r.rows, ["student", "adm", "class", "date", "status"]) })
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/parent/.test(q)) {
      const schoolId = getSessionSchoolId(req) ?? -1
      const r = await query(`SELECT COUNT(*)::int AS n FROM users WHERE role = 'parent' AND school_id = $1`, [schoolId])
      reply = `${r.rows[0]?.n ?? 0} registered parent accounts in your school. Ask “class strength”, “pending fees” or “today's absentees” for details.`
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (/^(hi|hello|hey|namaste)\b/.test(q)) {
      return NextResponse.json({ reply: "Hello! I can look up anything in your school database — pending fees, attendance, leaves, results, staff and more. What do you need?" } as Answer)
    }

    if (/help|what can you|how|commands|options/.test(q) || /thank|thanks|ok|great|nice/.test(q)) {
      reply = /thank|thanks|ok|great|nice/.test(q)
        ? "You're welcome! Anything else I can look up?"
        : "I can answer things like:\n• “pending fees group by class”\n• “fee defaulters in Class 10”\n• “collected this month”\n• “absent today” / “attendance 2026-09-01” / “monthly attendance”\n• “low attendance students”\n• “pending leaves”\n• “admission enquiries” / “open complaints”\n• “top students” / “toppers of Class 8”\n• “class strength” / “students in Class 5”\n• “teachers list” / “upcoming exams”\n• “pending homework” / “transport fleet”\n• “notices” / “birthdays today” / “latest admissions”"
      return NextResponse.json({ reply, tables } as Answer)
    }

    if (wantsFees) {
      const r = await query(
        `SELECT COALESCE(SUM(COALESCE(paid_amount,0)) FILTER (WHERE payment_date >= date_trunc('month', CURRENT_DATE)), 0)::float AS month,
                COALESCE(SUM(GREATEST(COALESCE(amount,0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0), 0)) FILTER (WHERE status IS DISTINCT FROM 'Paid' AND status IS DISTINCT FROM 'Success'), 0)::float AS pending
           FROM fees_payments`
      )
      reply = `This month collected ${inr(r.rows[0]?.month)}, outstanding ${inr(r.rows[0]?.pending)}. Try “pending fees group by class” for the full list.`
      return NextResponse.json({ reply, tables } as Answer)
    }

    return NextResponse.json({
      reply: "I couldn't match that to school data. Try “help” to see everything I can look up — fees, attendance, leaves, results, staff, transport and more.",
    } as Answer)
  } catch (e) {
    return NextResponse.json({ reply: `Something went wrong: ${e instanceof Error ? e.message : String(e)}` } as Answer, { status: 200 })
  }
}
