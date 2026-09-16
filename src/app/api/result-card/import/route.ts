import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"
import { computeRecord, toNum, TemplateSetting, FieldDef, TableDef, PageDef } from "@/lib/result-card"
import * as XLSX from "xlsx"

const META_SYNONYMS: Record<string, string[]> = {
  name: ["name", "student name", "student's name", "full name", "student"],
  rollNo: ["roll", "roll number", "admission no", "adm no"],
  motherName: ["mother's name", "mother name", "mothers name", "mother"],
  fatherName: ["father's name", "father name", "fathers name", "father"],
  class: ["class name", "class"],
  section: ["section", "sec"],
  session: ["session", "academic year"],
  dob: ["date of birth", "dob", "birth date"],
}

type HeaderTarget =
  | { kind: "meta"; key: string }
  | { kind: "field"; page: PageDef; field: FieldDef }
  | { kind: "table"; page: PageDef; table: TableDef; col: TableDef["cols"][number] }

export async function POST(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    if (!schoolId) return NextResponse.json({ error: "No school session" }, { status: 401 })

    const form = await req.formData()
    const template_id = Number(form.get("template_id") || 0)
    const file = form.get("file") as File | null
    if (!template_id || !file) return NextResponse.json({ error: "template_id and file are required" }, { status: 400 })

    const tRes = await query(
      `SELECT * FROM result_card_templates WHERE id=$1 AND school_id=$2`,
      [template_id, schoolId]
    )
    if (!tRes.rows[0]) return NextResponse.json({ error: "Template not found" }, { status: 404 })
    const template = tRes.rows[0] as TemplateSetting

    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buffer, { type: "buffer" })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" })
    if (rows.length === 0) return NextResponse.json({ error: "File has no rows" }, { status: 400 })

    const headers = Object.keys(rows[0])
    const targets = buildHeaderTargets(template, headers)

    const studentLookup = await buildStudentLookup(template, schoolId)

    let created = 0
    let updated = 0
    const imported: any[] = []
    for (const row of rows) {
      const { meta, data } = buildRecordData(row, targets)
      if (Object.keys(meta).length === 0 && Object.keys(data).length === 0) continue
      data["__meta"] = meta
      const student = resolveStudent(row, meta, studentLookup)
      const saved = await upsertRecord(template, student?.id || null, data, schoolId)
      if (saved._created) created++
      else updated++
      imported.push({ id: saved.id, student_id: saved.student_id, name: meta.name || "" })
    }

    return NextResponse.json({ status: 1, created, updated, imported: imported.slice(0, 100) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function contains(haystack: string, needle: string): boolean {
  return haystack.length > 2 && haystack.includes(needle)
}

function buildHeaderTargets(template: TemplateSetting, headers: string[]): Record<string, HeaderTarget> {
  const out: Record<string, HeaderTarget> = {}
  const pages: PageDef[] = template.pages || []
  const used = new Set<string>()
  for (const header of headers) {
    const h = header.trim()
    const low = h.toLowerCase()
    const nLow = norm(low)
    // 1. subject column
    if (norm(low) === "subject" || /^subjects?$/i.test(low)) {
      out[header] = { kind: "table", page: pages[0] || ({ id: "_" } as PageDef), table: { id: "_subject_" } as TableDef, col: { id: "subject", label: "Subject", type: "text" } }
      continue
    }
    // 2. meta columns
    let hit = false
    for (const [key, syns] of Object.entries(META_SYNONYMS)) {
      if (syns.some((s) => low === s || contains(nLow, norm(s)))) {
        out[header] = { kind: "meta", key }
        hit = true
        break
      }
    }
    if (hit) continue
    // 3. standalone fields (non-computed) in page order
    for (const page of pages) {
      for (const f of page.fields || []) {
        if (f.type === "computed") continue
        const fLow = norm(f.label || "")
        const fBind = norm(f.bind || "")
        if ((fLow.length > 2 && contains(nLow, fLow)) || (fBind.length > 2 && contains(nLow, fBind))) {
          const key = `${page.id}:${f.id}`
          if (!used.has(key)) {
            out[header] = { kind: "field", page, field: f }
            used.add(key)
            hit = true
            break
          }
        }
      }
      if (hit) break
      // 4. table columns
      for (const t of page.tables || []) {
        for (const c of t.cols) {
          const cLow = norm(c.label || "")
          if (cLow.length <= 2 || !contains(nLow, cLow)) continue
          const key = `${page.id}:${t.id}:${c.id}`
          if (!used.has(key)) {
            out[header] = { kind: "table", page, table: t, col: c }
            used.add(key)
            hit = true
            break
          }
        }
        if (hit) break
      }
      if (hit) break
    }
    if (!hit) out[header] = { kind: "meta", key: "__unmapped__" }
  }
  return out
}

function buildRecordData(row: Record<string, any>, targets: Record<string, HeaderTarget>) {
  const meta: Record<string, any> = {}
  const pageData: Record<string, any> = {}
  const tableRows: Record<string, Record<string, any>> = {} // pageId:tableId -> { subject: {colId: val} }

  const subjectTarget = Object.entries(targets).find(([h, t]) => t.kind === "table" && t.table.id === "_subject_")
  const subjectKey = subjectTarget?.[0] ?? ""

  for (const [header, target] of Object.entries(targets)) {
    if (target.kind === "meta") {
      if (target.key === "__unmapped__") continue
      const v = row[header]
      if (v !== "" && v !== undefined && v !== null) meta[target.key] = String(v)
      continue
    }
    if (target.kind === "field") {
      const v = row[header]
      if (v === "" || v === undefined || v === null) continue
      if (!pageData[target.page.id]) pageData[target.page.id] = {}
      if (target.field.type === "mark") pageData[target.page.id][target.field.id] = toNum(v)
      else pageData[target.page.id][target.field.id] = String(v)
      continue
    }
    if (target.kind === "table") {
      if (!target.page.id || !target.table.id || target.table.id === "_subject_") continue
      const key = `${target.page.id}|${target.table.id}`
      if (!tableRows[key]) tableRows[key] = {}
      const subj = subjectKey ? String(row[subjectKey] ?? "").trim() : ""
      if (!subj) continue
      if (!tableRows[key][subj]) tableRows[key][subj] = {}
      const v = row[header]
      if (target.col.type === "mark") tableRows[key][subj][target.col.id] = v === "" || v === undefined || v === null ? "" : toNum(v)
      else tableRows[key][subj][target.col.id] = v === undefined || v === null ? "" : String(v)
    }
  }

  for (const [key, bySubject] of Object.entries(tableRows)) {
    const [pageId, tableId] = key.split("|")
    const arr = Object.entries(bySubject)
      .filter(([, vals]) => Object.keys(vals).length > 0)
      .map(([subject, vals]) => ({ subject, ...vals }))
    if (arr.length === 0) continue
    if (!pageData[pageId]) pageData[pageId] = {}
    pageData[pageId][tableId] = arr
  }

  return { meta, data: pageData }
}

async function buildStudentLookup(template: TemplateSetting, schoolId: number) {
  const byId = new Map<number, any>()
  const byKey = new Map<string, any>()
  const res = await query(
    `SELECT s.*, c.name AS class_name, sec.name AS section_name
     FROM students s
     LEFT JOIN classes c ON c.id = s.class_id
     LEFT JOIN sections sec ON sec.id = s.section_id
     WHERE s.class_id = $1 AND s.school_id = $2`,
    [template.class_id || 0, schoolId]
  )
  for (const s of res.rows) {
    byId.set(Number(s.id), s)
    byKey.set(String(s.id), s)
    byKey.set(String(s.roll_no), s)
    const full = [s.first_name, s.last_name].filter(Boolean).join(" ").toLowerCase()
    if (full) byKey.set(full, s)
  }
  return { byId, byKey }
}

function resolveStudent(row: Record<string, any>, meta: Record<string, any>, lookup: { byId: Map<number, any>; byKey: Map<string, any> }) {
  const idRaw = row["student_id"] || row["Student ID"]
  if (idRaw) {
    const found = lookup.byId.get(Number(idRaw))
    if (found) return found
  }
  if (meta.name) {
    const byName = lookup.byKey.get(String(meta.name).toLowerCase())
    if (byName) return byName
  }
  if (meta.rollNo) {
    const byRoll = lookup.byKey.get(String(meta.rollNo).toLowerCase())
    if (byRoll) return byRoll
  }
  return null
}

async function upsertRecord(template: TemplateSetting, studentId: number | null, data: any, schoolId: number) {
  const session = template.session || null
  if (studentId) {
    const ex = await query(
      `SELECT id FROM result_card_records WHERE template_id=$1 AND student_id=$2 AND school_id=$3`,
      [template.id, studentId, schoolId]
    )
    if (ex.rows.length > 0) {
      const res = await query(
        `UPDATE result_card_records SET data=$1, session=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
        [JSON.stringify(data), session, ex.rows[0].id]
      )
      await saveComputed(res.rows[0], template, schoolId)
      return { ...res.rows[0], _created: false }
    }
  }
  const res = await query(
    `INSERT INTO result_card_records (school_id, template_id, student_id, session, data) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [schoolId, template.id, studentId, session, JSON.stringify(data)]
  )
  await saveComputed(res.rows[0], template, schoolId)
  return { ...res.rows[0], _created: true }
}

async function saveComputed(row: any, template: TemplateSetting, schoolId: number) {
  try {
    const computed = computeRecord(template, row.data)
    await query(
      `UPDATE result_card_records SET computed=$1 WHERE id=$2 AND school_id=$3`,
      [JSON.stringify(computed), row.id, schoolId]
    )
  } catch {
    // non-fatal
  }
}