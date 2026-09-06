import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { AI_PROVIDERS } from "@/lib/ai-providers"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

async function callOpenAICompatible(url: string, apiKey: string, model: string, prompt: string): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 4096 }),
  })
  if (!res.ok) throw new Error(`AI provider error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

async function callGemini(apiKey: string, prompt: string, url: string): Promise<string> {
  const res = await fetch(`${url}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 4096 } }),
  })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}

async function callOpenRouter(apiKey: string, prompt: string, url: string): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "openai/gpt-4o-mini", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 4096 }),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

async function generateInsights(providerId: string, apiKey: string, dataPayload: string): Promise<string> {
  const cfg = AI_PROVIDERS.find((p) => p.id === providerId) || AI_PROVIDERS[0]
  const prompt = `You are an expert school data analyst AI. Analyze the following student data for a class/section and produce a comprehensive Student Insights Report.

DATA:
${dataPayload}

Produce a detailed report with these sections (use markdown headings):

## Executive Summary
Brief overview of the class health — attendance rate, average exam performance, fee collection status. One paragraph.

## At-Risk Students
List any students who have: attendance below 75%, failing exam marks, or unpaid fees over ₹500. For each student, give name + specific issue + recommended intervention.

## Attendance Analysis
- Overall class attendance percentage
- Students with poor attendance (<75%) — name, attendance %, days present/absent
- Any attendance trends (chronic absentees vs improving)

## Academic Performance
- Average marks percentage across the class
- Top 3 performing students with their marks
- Bottom 3 students with marks and weakest subjects
- Subject-wise class average if multiple subjects

## Fee Collection
- Total fees assigned vs collected vs pending
- Students with highest pending amounts
- Overdue payments (past due date)

## Recommendations
3-5 actionable steps for the teacher/admin to improve outcomes. Be specific and reference student names where relevant.

Keep the tone professional but helpful. Use ₹ for currency. Format numbers with commas.`

  switch (cfg.special) {
    case "gemini":
      return callGemini(apiKey, prompt, cfg.url)
    case "openrouter":
      return callOpenRouter(apiKey, prompt, cfg.url)
    default:
      return callOpenAICompatible(cfg.url, apiKey, cfg.model, prompt)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { classId, sectionId, provider: rawProvider } = body
    if (!classId) return NextResponse.json({ error: "classId is required" }, { status: 400 })

    const provider = rawProvider || "gemini"

    const keyResult = await query("SELECT value FROM system_settings WHERE key = $1", [`ai_key_${provider}`])
    const apiKey = keyResult.rows[0]?.value || ""
    const cfg = AI_PROVIDERS.find((p) => p.id === provider)
    if (cfg?.needsKey !== false && !apiKey) {
      return NextResponse.json({ error: `No API key for ${cfg?.name || provider}. Save one in AI Settings first.` }, { status: 400 })
    }

    const classRes = await query("SELECT id, name FROM classes WHERE id = $1", [classId])
    const className = classRes.rows[0]?.name || `Class ${classId}`
    let sectionName = "All Sections"
    if (sectionId) {
      const secRes = await query("SELECT id, name FROM sections WHERE id = $1", [sectionId])
      sectionName = secRes.rows[0]?.name || `Section ${sectionId}`
    }

    const studentWhere = ["s.class_id = $1", "s.status = 'Active'"]
    const studentParams: any[] = [classId]
    if (sectionId) { studentWhere.push("s.section_id = $2"); studentParams.push(sectionId) }
    const studentsRes = await query(
      `SELECT s.id, s.admission_no, s.name, s.roll_no, s.gender, s.class_id, s.section_id
       FROM students s WHERE ${studentWhere.join(" AND ")} ORDER BY s.name`,
      studentParams
    )
    const students = studentsRes.rows
    if (students.length === 0) {
      return NextResponse.json({ error: "No active students found in this class/section." }, { status: 404 })
    }
    const studentIds = students.map((s: any) => s.id)

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    const attRes = await query(
      `SELECT sa.student_id, sa.attendance_type_id,
              at.type AS attendance_type, COUNT(*)::int AS cnt
       FROM student_attendance sa
       LEFT JOIN attendance_types at ON at.id = sa.attendance_type_id
       WHERE sa.student_id = ANY($1) AND sa.date >= $2
       GROUP BY sa.student_id, sa.attendance_type_id, at.type
       ORDER BY sa.student_id, sa.attendance_type_id`,
      [studentIds as any, thirtyDaysAgo]
    )
    const attendanceMap: Record<number, { present: number; absent: number; late: number; total: number }> = {}
    for (const row of attRes.rows) {
      const sid = row.student_id
      if (!attendanceMap[sid]) attendanceMap[sid] = { present: 0, absent: 0, late: 0, total: 0 }
      const t = (row.attendance_type || "").toLowerCase()
      if (t === "present") attendanceMap[sid].present += row.cnt
      else if (t === "absent") attendanceMap[sid].absent += row.cnt
      else if (t === "late") attendanceMap[sid].late += row.cnt
      attendanceMap[sid].total += row.cnt
    }

    const examsRes = await query(
      `SELECT em.student_id, em.theory_marks AS "theoryMarks", em.practical_marks AS "practicalMarks",
              em.absent, es.name AS "subjectName", ex.name AS "examName",
              (COALESCE(es.theory_max, 0) + COALESCE(es.practical_max, 0)) AS "maxMarks"
       FROM exam_marks em
       LEFT JOIN exam_subjects es ON es.id = em.subject_id
       LEFT JOIN exams ex ON ex.id = em.exam_id
       WHERE em.student_id = ANY($1)
       ORDER BY ex.id DESC NULLS LAST, em.student_id
       LIMIT 500`,
      [studentIds as any]
    )
    const examMap: Record<number, { total: number; max: number; subjects: { subject: string; marks: number; max: number }[] }> = {}
    for (const row of examsRes.rows) {
      const sid = row.student_id
      if (!examMap[sid]) examMap[sid] = { total: 0, max: 0, subjects: [] }
      const marks = Number(row.theoryMarks || 0) + Number(row.practicalMarks || 0)
      const max = Number(row.maxMarks || 100)
      if (!row.absent) {
        examMap[sid].total += marks
        examMap[sid].max += max
        examMap[sid].subjects.push({ subject: row.subjectName, marks, max })
      }
    }

    const feesRes = await query(
      `SELECT fp.student_id, fp.amount, fp.paid_amount AS "paidAmount", fp.status,
              ft.name AS "feesType", fm.due_date AS "dueDate"
       FROM fees_payments fp
       LEFT JOIN fees_types ft ON ft.id = fp.fees_type_id
       LEFT JOIN fees_masters fm ON fm.fees_type_id = fp.fees_type_id AND fm.class_id = $1
       WHERE fp.student_id = ANY($2)`,
      [classId, studentIds as any]
    )
    const feesMap: Record<number, { totalDue: number; totalPaid: number; pendingItems: string[] }> = {}
    for (const row of feesRes.rows) {
      const sid = row.student_id
      if (!feesMap[sid]) feesMap[sid] = { totalDue: 0, totalPaid: 0, pendingItems: [] }
      const amount = Number(row.amount || 0)
      const paid = Number(row.paidAmount || 0)
      if ((row.status || "").toLowerCase() === "paid" || (row.status || "").toLowerCase() === "success") {
        feesMap[sid].totalPaid += paid || amount
      } else {
        const balance = amount - paid
        if (balance > 0) {
          feesMap[sid].totalDue += balance
          feesMap[sid].pendingItems.push(`${row.feesType} (₹${balance.toLocaleString("en-IN")})`)
        }
      }
    }

    const payload = {
      class: className,
      section: sectionName,
      session: new Date().getFullYear().toString(),
      totalStudents: students.length,
      analysisPeriod: `Last 30 days (from ${thirtyDaysAgo})`,
      students: students.map((s: any) => {
        const name = s.name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || `Student #${s.id}`
        const att = attendanceMap[s.id]
        const attPct = att && att.total > 0 ? Math.round(((att.present + att.late) / att.total) * 100) : null
        const exam = examMap[s.id]
        const examPct = exam && exam.max > 0 ? Math.round((exam.total / exam.max) * 100) : null
        const fee = feesMap[s.id]
        return {
          name,
          rollNo: s.roll_no,
          gender: s.gender,
          attendance: att ? { present: att.present, absent: att.absent, late: att.late, total: att.total, percentage: attPct } : null,
          exam: exam ? { totalMarks: exam.total, maxMarks: exam.max, percentage: examPct, subjects: exam.subjects } : null,
          fees: fee ? { totalPaid: fee.totalPaid, totalDue: fee.totalDue, pendingItems: fee.pendingItems } : null,
        }
      }),
      classSummary: {
        attendanceRate: (() => {
          const rates = students.map((s: any) => attendanceMap[s.id]).filter(Boolean).filter((a) => a!.total > 0).map((a: any) => ((a.present + a.late) / a.total) * 100)
          return rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null
        })(),
        avgExamPercentage: (() => {
          const rates = students.map((s: any) => examMap[s.id]).filter(Boolean).filter((e) => e!.max > 0).map((e: any) => (e.total / e.max) * 100)
          return rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null
        })(),
        totalPendingFees: Object.values(feesMap).reduce((sum, f) => sum + f.totalDue, 0),
        totalCollectedFees: Object.values(feesMap).reduce((sum, f) => sum + f.totalPaid, 0),
      },
    }

    let insights = ""
    try {
      insights = await generateInsights(provider, apiKey, JSON.stringify(payload, null, 2))
    } catch (aiErr) {
      insights = `AI analysis failed: ${getErrorMessage(aiErr)}. Data summary is still available below.`
    }

    return NextResponse.json({ success: true, insights, data: payload })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}