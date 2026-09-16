"use client"

import { useEffect, useMemo, useState } from "react"
import { Save, Upload, RefreshCw, Printer, Plus, Trash2, FileSpreadsheet } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { TemplateSetting, FieldDef, TableDef, computeRecord, studentDefaultBindings } from "@/lib/result-card"

type Student = {
  id: number
  class_id?: number
  first_name?: string
  last_name?: string
  roll_no?: string | number
  class_name?: string
  section_name?: string
  mother_name?: string
  father_name?: string
  date_of_birth?: string
  student_photo?: string
}

type RecordRow = {
  id: number
  template_id: number
  student_id: number | null
  session: string | null
  data: Record<string, Record<string, any>>
  first_name?: string
  last_name?: string
  roll_no?: string
  class_name?: string
  section_name?: string
}

export default function ResultRecordsPage() {
  const { data: templates } = useApi<TemplateSetting>("/api/result-card/templates")
  const { data: records, loading, refetch } = useApi<RecordRow>(`/api/result-card/records`)
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<number | "manual" | null>(null)
  const [recordId, setRecordId] = useState<number | null>(null)
  const [data, setData] = useState<Record<string, Record<string, any>>>({})
  const [saving, setSaving] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [importErr, setImportErr] = useState<string | null>(null)
  const [importFromExamsMsg, setImportFromExamsMsg] = useState<string | null>(null)

  const template = templates.find((t) => t.id === templateId) || null

  useEffect(() => {
    if (!templateId) return
    fetch("/api/student-information/student")
      .then((r) => r.json())
      .then((list) => {
        const arr = Array.isArray(list) ? list : []
        const filtered = template
          ? arr.filter((s: Student) => (template.class_id ? String(s.class_name) === template.class_name || Number(s.class_id) === template.class_id : true))
          : arr
        setStudents(filtered)
      })
      .catch(() => {})
  }, [templateId, template])

  const templateRecords = useMemo(() => (templateId ? records.filter((r) => r.template_id === templateId) : []), [records, templateId])

  const student = useMemo(() => (typeof selectedStudentId === "number" ? students.find((s) => s.id === selectedStudentId) || null : null), [students, selectedStudentId])

  const selectStudent = (id: number | "manual" | null) => {
    setSelectedStudentId(id)
    setRecordId(null)
    const existing = id === "manual" ? null : id !== null ? templateRecords.find((r) => r.student_id === id) : null
    if (existing) {
      setRecordId(existing.id)
      setData(existing.data || {})
    } else {
      setData({})
    }
  }

  const selectRecord = (r: RecordRow) => {
    setSelectedStudentId(r.student_id || "manual")
    setRecordId(r.id)
    setData(r.data || {})
  }

  const save = async () => {
    if (!templateId) return
    setSaving(true)
    try {
      const res = await fetch("/api/result-card/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: recordId || undefined,
          template_id: templateId,
          student_id: typeof selectedStudentId === "number" ? selectedStudentId : null,
          session: template?.session,
          data,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save")
      setRecordId(json.id)
      await refetch()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const importFile = async (file: File) => {
    if (!templateId) return
    const fd = new FormData()
    fd.append("template_id", String(templateId))
    fd.append("file", file)
    setImportMsg(null)
    setImportErr(null)
    try {
      const res = await fetch("/api/result-card/import", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Import failed")
      setImportMsg(`${json.created} created, ${json.updated} updated.`)
      await refetch()
    } catch (e: any) {
      setImportErr(e.message)
    }
  }

  const importFromExams = async () => {
    if (!templateId) return
    setImportFromExamsMsg(null)
    try {
      const res = await fetch("/api/result-card/import-from-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, mapping: {} }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Import failed")
      setImportFromExamsMsg(`${json.created} created, ${json.updated} updated from exams.`)
      await refetch()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const computed = useMemo(() => (template ? computeRecord(template, data) : {}), [template, data])

  const setPageValue = (pageId: string, fieldId: string, value: any) => {
    setData((prev) => ({
      ...prev,
      [pageId]: { ...(prev[pageId] || {}), [fieldId]: value },
    }))
  }

  const setTableRows = (pageId: string, tableId: string, value: any) => {
    setData((prev) => ({
      ...prev,
      [pageId]: { ...(prev[pageId] || {}), [tableId]: value },
    }))
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Enter / Import Results</h1>
        <p className="mt-1 text-sm text-white/80">Custom Result / Enter / Import Results</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Result Template</label>
            <select value={templateId || ""} onChange={(e) => { setTemplateId(e.target.value ? Number(e.target.value) : null); setSelectedStudentId(null); setRecordId(null); setData({}) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Select template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} {t.class_name ? `(${t.class_name})` : ""}</option>
              ))}
            </select>
          </div>
          {template && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Student {students.length === 0 ? "(no students in this class — use Manual)" : ""}</label>
                <select value={selectedStudentId ?? ""} onChange={(e) => selectStudent(e.target.value === "" ? null : e.target.value === "manual" ? "manual" : Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">— Select —</option>
                  <option value="manual">Manual entry (no student link)</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{[s.first_name, s.last_name].filter(Boolean).join(" ")}{s.roll_no ? ` (${s.roll_no})` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving || !templateId} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50">
                  <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Result"}
                </button>
                <a href={`/admin/result-card/print?template_id=${templateId}`} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
                  <Printer className="h-4 w-4" /> Print
                </a>
              </div>
            </>
          )}
        </div>

        {template && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-dashed border-gray-300 p-4">
              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><FileSpreadsheet className="h-4 w-4 text-[var(--primary)]" /> Import from Excel / CSV</p>
              <p className="text-[11px] text-gray-500 mb-2">Columns: Name, Roll, Mother/Father Name, then subject sheet OR marks columns matching your field labels (e.g. &quot;Unit Test&quot;, &quot;Mid Term&quot;).</p>
              <label className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-medium text-white hover:opacity-90 cursor-pointer">
                <Upload className="h-4 w-4" /> Choose file
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = "" }} />
              </label>
              {importMsg && <p className="mt-2 text-xs text-green-600">{importMsg}</p>}
              {importErr && <p className="mt-2 text-xs text-red-600">{importErr}</p>}
            </div>
            <div className="rounded-lg border border-dashed border-gray-300 p-4">
              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><RefreshCw className="h-4 w-4 text-[var(--primary)]" /> Import from Exams</p>
              <p className="text-[11px] text-gray-500 mb-2">Pulls this template&apos;s session Unit Test / Mid Term exams from the Examinations module and writes marks into academic tables.</p>
              <button onClick={importFromExams} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--primary)] px-3 py-2 text-xs font-medium text-[var(--primary)] hover:bg-orange-50">
                <RefreshCw className="h-4 w-4" /> Pull marks from exams
              </button>
              {importFromExamsMsg && <p className="mt-2 text-xs text-green-600">{importFromExamsMsg}</p>}
            </div>
          </div>
        )}
      </div>

      {template && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Saved Records ({templateRecords.length})</h2>
            </div>
            <div className="max-h-[70vh] overflow-auto p-2 space-y-1">
              {loading && <p className="text-xs text-gray-400 p-2">Loading…</p>}
              {!loading && templateRecords.length === 0 && <p className="text-xs text-gray-400 p-2">No records yet.</p>}
              {templateRecords.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectRecord(r)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm ${recordId === r.id ? "bg-orange-50 border border-orange-200" : "hover:bg-gray-50 border border-transparent"}`}
                >
                  <div className="font-medium text-gray-800">
                    {r.class_name || r.first_name || r.last_name
                      ? [r.first_name, r.last_name].filter(Boolean).join(" ")
                      : (r.data?.__meta?.name || `Record #${r.id}`)}
                  </div>
                  <div className="text-xs text-gray-400">{r.roll_no ? `Roll: ${r.roll_no}` : ""}{r.class_name ? ` · ${r.class_name}${r.section_name ? `/ ${r.section_name}` : ""}` : ""}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {selectedStudentId !== null && (
              <EntryForm
                template={template}
                data={data}
                computed={computed}
                student={student}
                setPageValue={setPageValue}
                setTableRows={setTableRows}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EntryForm({
  template,
  data,
  computed,
  student,
  setPageValue,
  setTableRows,
}: {
  template: TemplateSetting
  data: Record<string, Record<string, any>>
  computed: Record<string, Record<string, any>>
  student: Student | null
  setPageValue: (pageId: string, fieldId: string, value: any) => void
  setTableRows: (pageId: string, tableId: string, value: any) => void
}) {
  const auto = useMemo(() => studentDefaultBindings(student as any, template.session || ""), [student, template.session])

  return (
    <>
      {(template.pages || []).map((page, pi) => (
        <div key={page.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Page {pi + 1}: {page.label}</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(page.fields || []).map((f) => (
                <FieldInput
                  key={f.id}
                  field={f}
                  value={data[page.id]?.[f.id]}
                  computedValue={computed[page.id]?.[f.id]}
                  autoValue={fieldAuto(f, auto, student)}
                  onChange={(v) => setPageValue(page.id, f.id, v)}
                />
              ))}
            </div>
            {(page.tables || []).map((t) => (
              <TableEntry key={t.id} table={t} rows={data[page.id]?.[t.id] || []} computedRows={computed[page.id]?.[t.id] || []} setRows={(v) => setTableRows(page.id, t.id, v)} />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

function fieldAuto(f: FieldDef, auto: Record<string, any>, student: Student | null): string {
  if (f.type === "photo") return auto.photo || student?.student_photo || ""
  if (f.bind && f.bind !== "session" && f.bind !== "name") return auto[f.bind] ?? ""
  if (f.bind === "name") return student ? `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Sample Student" : "Sample Student"
  if (f.bind === "session") return auto.session || ""
  return f.value || ""
}

function FieldInput({
  field,
  value,
  computedValue,
  autoValue,
  onChange,
}: {
  field: FieldDef
  value: any
  computedValue: any
  autoValue: string
  onChange: (v: any) => void
}) {
  const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
  if (field.type === "photo") {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
        {autoValue ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={autoValue} alt="photo" className="h-16 w-12 object-cover rounded-md border border-gray-200" />
        ) : (
          <p className="text-xs text-gray-400">No photo</p>
        )}
      </div>
    )
  }
  if (field.type === "computed") {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{field.label} <span className="text-gray-400 font-normal">(auto)</span></label>
        <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">{computedValue ?? ""}</div>
      </div>
    )
  }
  if (field.type === "text" && !field.bind) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
        <div className="w-full rounded-lg border border-gray-100 px-3 py-2 text-xs text-gray-400">{field.value || "(static)"}</div>
      </div>
    )
  }
  const shown = value !== undefined && value !== null && value !== "" ? value : autoValue
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}{field.bind ? " · auto-filled" : ""}</label>
      <input
        type={field.type === "mark" ? "number" : "text"}
        value={shown === undefined || shown === null ? "" : String(shown)}
        placeholder={autoValue || field.bind || ""}
        onChange={(e) => onChange(field.type === "mark" ? e.target.valueAsNumber || 0 : e.target.value)}
        className={input}
      />
    </div>
  )
}

function TableEntry({
  table,
  rows,
  computedRows,
  setRows,
}: {
  table: TableDef
  rows: Record<string, any>[]
  computedRows: (Record<string, any> & { _computed?: Record<string, string | number> })[]
  setRows: (v: Record<string, any>[]) => void
}) {
  const subjectCol = table.cols.find((c) => c.type === "text")

  const setCell = (ri: number, colId: string, v: any) => {
    setRows(rows.map((r, i) => (i === ri ? { ...r, [colId]: v } : r)))
  }
  const addRow = () => setRows([...rows, {}])
  const removeRow = (ri: number) => setRows(rows.filter((_, i) => i !== ri))

  const input = "w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-700">{table.label}</h3>
        <button onClick={addRow} className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
          <Plus className="h-3.5 w-3.5" /> Add row
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500">
              {table.cols.map((c) => (
                <th key={c.id} className={`px-2 py-2 font-medium ${c.type === "sum" || c.type === "percent" || c.type === "grade" ? "text-orange-600" : ""}`}>
                  {c.label}{c.sub ? ` (${c.sub})` : ""}
                  {c.type === "mark" ? " (entry)" : c.type === "sum" || c.type === "percent" || c.type === "grade" ? " (auto)" : ""}
                </th>
              ))}
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={table.cols.length + 1} className="px-3 py-3 text-xs text-gray-400">
                  No rows yet — add {subjectCol?.label?.toLowerCase() || "subject"} rows or import them.
                </td>
              </tr>
            )}
            {rows.map((r, ri) => (
              <tr key={ri} className="border-t border-gray-100">
                {table.cols.map((c) => (
                  <td key={c.id} className="px-2 py-1.5">
                    {c.type === "mark" || c.type === "text" ? (
                      <input
                        value={r[c.id] === undefined || r[c.id] === null ? "" : String(r[c.id])}
                        onChange={(e) => setCell(ri, c.id, c.type === "mark" ? e.target.valueAsNumber || 0 : e.target.value)}
                        className={input}
                      />
                    ) : (
                      <div className="px-2 py-1.5 text-sm font-semibold text-orange-600">{computedRows[ri]?._computed?.[c.id] ?? ""}</div>
                    )}
                  </td>
                ))}
                <td className="px-2 py-1.5">
                  <button onClick={() => removeRow(ri)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}