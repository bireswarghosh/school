import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"
import { computeRecord, toNum, TemplateSetting, TableCol } from "@/lib/result-card"

// Mapping: { <tableColId>: examId } — pulls marks from existing exams into a record's table rows.
export async function POST(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    if (!schoolId) return NextResponse.json({ error: "No school session" }, { status: 401 })
    const body = await req.json()
    const template_id = Number(body.template_id || 0)
    if (!template_id) return NextResponse.json({ error: "template_id required" }, { status: 400 })

    const tRes = await query(`SELECT * FROM result_card_templates WHERE id=$1 AND school_id=$2`, [template_id, schoolId])
    if (!tRes.rows[0]) return NextResponse.json({ error: "Template not found" }, { status: 404 })
    const template = tRes.rows[0] as TemplateSetting

    const markCols: { pageId: string; tableId: string; col: TableCol }[] = []
    for (const page of template.pages || []) {
      for (const t of page.tables || []) {
        for (const c of t.cols) if (c.type === "mark") markCols.push({ pageId: page.id, tableId: t.id, col: c })
      }
    }
    const markColIds = new Set(markCols.map((m) => m.col.id))
    let mapping = body.mapping || {}
    if (Object.keys(mapping).length === 0) {
      mapping = await autoMapping(template, markColIds)
    }
    const useMapping: Record<string, number> = {}
    for (const [colId, examId] of Object.entries(mapping)) {
      if (markColIds.has(colId) && examId) useMapping[colId] = Number(examId)
    }
    if (Object.keys(useMapping).length === 0) {
      return NextResponse.json({ error: "No exam mapping provided" }, { status: 400 })
    }

    // Load all needed exams at once
    const examIds = [...new Set(Object.values(useMapping))]
    const examRes = await query(`SELECT * FROM exams WHERE id = ANY($1::int[])`, [examIds as any])
    const examsById = new Map(examRes.rows.map((r) => [Number(r.id), r]))
    const subjectsRes = await query(`SELECT * FROM exam_subjects WHERE exam_id = ANY($1::int[])`, [examIds as any])
    const subjectsByExam = new Map<number, Map<number, string>>()
    for (const s of subjectsRes.rows) {
      if (!subjectsByExam.has(Number(s.exam_id))) subjectsByExam.set(Number(s.exam_id), new Map())
      subjectsByExam.get(Number(s.exam_id))!.set(Number(s.id), s.name)
    }
    const marksRes = await query(
      `SELECT * FROM exam_marks WHERE exam_id = ANY($1::int[]) AND school_id = $2`,
      [examIds as any, schoolId]
    )
    const marksByStudent = new Map<number, Map<string, number>>() // student_id -> colId -> scaled
    for (const m of marksRes.rows) {
      const examId = Number(m.exam_id)
      const colId = Object.keys(useMapping).find((k) => useMapping[k] === examId)
      if (!colId) continue
      const exam = examsById.get(examId)
      const maxTotal = Number(exam?.total_marks || exam?.theory_total || 0)
      const subjName = subjectsByExam.get(examId)?.get(Number(m.subject_id))
      if (!subjName) continue
      const col = markCols.find((x) => x.col.id === colId)?.col
      let value = toNum(m.theory_marks)
      if (maxTotal > 0 && col?.max) value = Math.min(col.max || 100, Math.round((value / maxTotal) * col.max))
      const key = `${subjName}::${colId}`
      if (!marksByStudent.has(Number(m.student_id))) marksByStudent.set(Number(m.student_id), new Map())
      marksByStudent.get(Number(m.student_id))!.set(key, value)
    }

    const tableById = new Map<string, { pageId: string; tableId: string }>()
    for (const m of markCols) tableById.set(`${m.pageId}::${m.tableId}`, m)

    let created = 0
    let updated = 0
    const skipped = 0
    const savedIds: number[] = []
    for (const [studentId, marks] of marksByStudent) {
      const pageMap = new Map<string, Record<string, any>>() // tableId -> subject -> {col:val}
      for (const [key, value] of marks) {
        const [subjName, colId] = key.split("::")
        const holder = markCols.find((m) => m.col.id === colId)!
        const tblKey = `${holder.pageId}::${holder.tableId}`
        if (!pageMap.has(tblKey)) pageMap.set(tblKey, {})
        const bySubject = pageMap.get(tblKey)!
        if (!bySubject[subjName]) bySubject[subjName] = {}
        bySubject[subjName][colId] = value === undefined ? "" : value
      }
      const data: Record<string, any> = {}
      for (const [tblKey, bySubject] of pageMap) {
        const [pageId, tableId] = tblKey.split("::")
        const arr = Object.entries(bySubject).map(([subject, vals]) => ({ subject, ...vals }))
        if (arr.length === 0) continue
        if (!data[pageId]) data[pageId] = {}
        data[pageId][tableId] = arr
      }
      if (Object.keys(data).length === 0) continue

      const ex = await query(
        `SELECT id, data FROM result_card_records WHERE template_id=$1 AND student_id=$2 AND school_id=$3`,
        [template_id, Number(studentId), schoolId]
      )
      if (ex.rows.length > 0) {
        const prev = ex.rows[0].data || {}
        for (const [pageId, vals] of Object.entries(data)) {
          prev[pageId] = { ...(prev[pageId] || {}), ...vals }
        }
        await query(
          `UPDATE result_card_records SET data=$1, updated_at=NOW() WHERE id=$2`,
          [JSON.stringify(prev), ex.rows[0].id]
        )
        const computed = computeRecord(template, prev)
        await query(`UPDATE result_card_records SET computed=$1 WHERE id=$2`, [JSON.stringify(computed), ex.rows[0].id])
        savedIds.push(ex.rows[0].id)
        updated++
      } else {
        const ins = await query(
          `INSERT INTO result_card_records (school_id, template_id, student_id, session, data) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [schoolId, template_id, Number(studentId), template.session, JSON.stringify(data)]
        )
        const computed = computeRecord(template, data)
        await query(`UPDATE result_card_records SET computed=$1 WHERE id=$2`, [JSON.stringify(computed), ins.rows[0].id])
        savedIds.push(ins.rows[0].id)
        created++
      }
    }

    return NextResponse.json({ status: 1, created, updated, skipped, saved: savedIds.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}

async function autoMapping(template: TemplateSetting, markColIds: Set<string>) {
  const m: Record<string, number> = {}
  if (!template.session) return m
  const exams = await query(`SELECT id, name FROM exams WHERE session=$1`, [template.session])
  const rows = exams.rows
  const unitIds = [...markColIds].filter((id) => /unit|ut/i.test(id)).sort()
  const midIds = [...markColIds].filter((id) => /mid|mt|half/i.test(id)).sort()
  const unitExams = rows.filter((r) => /unit/i.test(r.name)).sort((a, b) => a.name.localeCompare(b.name))
  const midExams = rows.filter((r) => /mid term|half yearly/i.test(r.name)).sort((a, b) => a.name.localeCompare(b.name))
  unitIds.forEach((id, i) => {
    if (unitExams[i]) m[id] = Number(unitExams[i].id)
  })
  midIds.forEach((id, i) => {
    if (midExams[i]) m[id] = Number(midExams[i].id)
  })
  return m
}