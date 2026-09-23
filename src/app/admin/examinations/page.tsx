"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import { Search, Filter, Download, Users, Award, Save, Printer, FileText, Plus, LayoutTemplate, Copy, Trash2, X, Loader2, ClipboardEdit, FileSpreadsheet, CheckCircle2, Upload } from "lucide-react"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useApi } from "@/lib/use-api"
import Link from "next/link"
import ProgressReportCard from "@/components/result-card/ProgressReportCard"
import PrimaryFormatCard from "@/components/result-card/PrimaryFormatCard"
import PrePrimaryFormatCard from "@/components/result-card/PrePrimaryFormatCard"
import MiddleSchoolFormatCard from "@/components/result-card/MiddleSchoolFormatCard"
import { DEFAULT_PROGRESS_CONFIG, extractProgressConfig } from "@/lib/progress-config"
import { DEFAULT_PRIMARY_CONFIG as DEFAULT_PRIMARY, extractConfigFromTemplate } from "@/lib/primary-config"
import { DEFAULT_PREPRIMARY_CONFIG as DEFAULT_PREPRIMARY, extractPrePrimaryConfig } from "@/lib/preprimary-config"
import { DEFAULT_MIDDLE_CONFIG as DEFAULT_MIDDLE, extractMiddleConfig } from "@/lib/middle-config"

type Student = {
  id: number
  admissionNo?: string
  admission_no?: string
  name?: string
  firstName?: string
  lastName?: string
  class?: string
  className?: string
  section?: string
  sectionName?: string
  rollNo?: string
  roll_no?: string
  gender?: string
  dob?: string
}

type CustomResult = {
  studentId: number
  marks: string
  maxMarks: string
  grade: string
  remarks: string
}

type TemplateLite = { id: number; name: string; class_name?: string; session?: string; is_active?: boolean; pages?: any[] }

type ResultTemplate = { id: number; name: string; class_id?: number | null; class_name?: string; session?: string; pages?: any[] }

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

function currentSession(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String((now.getFullYear() + 1) % 100).padStart(2, "0")}`
}

function studentName(s: Student): string {
  return s.name || `${s.firstName || ""} ${s.lastName || ""}`.trim() || "—"
}

function studentClass(s: Student): string {
  return s.class || s.className || ""
}

function studentSection(s: Student): string {
  return s.section || s.sectionName || ""
}

function studentRoll(s: Student): string {
  return s.rollNo || s.roll_no || ""
}

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"

export default function ExaminationsPage() {
  const { classes, sectionNames, sectionsOf } = useClassesAndSections()
  const { data: students } = useApi<Student>("/api/students")
  const { data: templates } = useApi<TemplateLite>("/api/result-card/templates")
  const [activeTab, setActiveTab] = useState<"custom" | "search" | "templates">("search")

  // Search Student tab state
  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [searched, setSearched] = useState(false)

  // Custom Result tab state
  const [customClass, setCustomClass] = useState("")
  const [customSection, setCustomSection] = useState("")
  const [customSearched, setCustomSearched] = useState(false)
  const [customResults, setCustomResults] = useState<Record<number, CustomResult>>({})

  // Edit Result / Progress Report popups
  const [resultStudent, setResultStudent] = useState<Student | null>(null)
  const [progressStudent, setProgressStudent] = useState<Student | null>(null)

  // Search Student panel — bulk CSV download/import
  const [resultTemplateId, setResultTemplateId] = useState("")
  const [panelImportBusy, setPanelImportBusy] = useState(false)
  const [panelStatus, setPanelStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const panelFileRef = useRef<HTMLInputElement>(null)

  const availableSections = filterClass ? (() => {
    const cid = classes.find((c) => c.name === filterClass)?.id
    return cid ? sectionsOf(cid).map((s) => s.name) : sectionNames
  })() : sectionNames

  const customAvailableSections = customClass ? (() => {
    const cid = classes.find((c) => c.name === customClass)?.id
    return cid ? sectionsOf(cid).map((s) => s.name) : sectionNames
  })() : sectionNames

  const filteredStudents = useMemo(() => {
    if (!searched) return []
    return (students as any[]).filter((s: any) => {
      const cls = s.class || s.className || s.class_name || ""
      const sec = s.section || s.sectionName || s.section_name || ""
      if (filterClass && cls !== filterClass) return false
      if (filterSection && sec !== filterSection) return false
      return true
    })
  }, [searched, filterClass, filterSection, students])

  const classStudents = useMemo(() => {
    if (!filterClass) return []
    return (students as any[]).filter((s: any) => {
      const cls = s.class || s.className || s.class_name || ""
      return cls === filterClass
    })
  }, [filterClass, students])

  const panelClassId = useMemo(
    () => (filterClass ? classes.find((c) => c.name === filterClass)?.id ?? null : null),
    [filterClass, classes]
  )

  const panelTemplates = useMemo(() => {
    const all = Array.isArray(templates) ? templates : []
    const applied = all.filter((t) => templateAppliesTo(t, panelClassId))
    return applied.length ? applied : all
  }, [templates, panelClassId])

  useEffect(() => {
    if (panelTemplates.length) setResultTemplateId(String(panelTemplates[0].id))
    else setResultTemplateId("")
    setPanelStatus(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClass])

  const handlePanelDownloadFormat = () => {
    const tpl = (Array.isArray(templates) ? templates : []).find((t) => String(t.id) === resultTemplateId)
    if (!tpl) {
      setPanelStatus({ ok: false, text: "Select a result template first." })
      return
    }
    if (!filterClass || classStudents.length === 0) {
      setPanelStatus({ ok: false, text: "Select a class with students first." })
      return
    }
    const k = templateKind(tpl)
    const cfg = templateConfigOf(tpl, k)
    const headers = [...identityColumnsFor(k).map((h) => h.label), ...fieldColumnsFor(k, cfg).map((c) => c.label)]
    const rows = classStudents.map((st: any) => {
      const r: Record<string, string> = {
        "Student Name": studentName(st),
        "Class": studentClass(st),
        "Roll No": studentRoll(st),
        "Session": currentSession(),
      }
      if (k === "primary") r["Section"] = studentSection(st)
      return r
    })
    const slug = tpl.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()
    downloadCsvFile(rows, headers, `${slug}-format-${currentSession()}.csv`)
    setPanelStatus({ ok: true, text: `Downloaded "${tpl.name}" format — ${rows.length} student(s) of Class ${filterClass}.` })
  }

  const handlePanelImportFile = async (file: File) => {
    if (!resultTemplateId) {
      setPanelStatus({ ok: false, text: "Select a result template first." })
      return
    }
    if (!filterClass || classStudents.length === 0) {
      setPanelStatus({ ok: false, text: "Select a class with students first." })
      return
    }
    setPanelImportBusy(true)
    setPanelStatus(null)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length < 2) throw new Error("CSV must have a header row and at least one student row")
      const header = rows[0].map((h) => h.replace(/^\uFEFF/, "").trim())
      const colAt = (label: string) => header.findIndex((h) => h === label)
      const tpl = (Array.isArray(templates) ? templates : []).find((t) => String(t.id) === resultTemplateId)
      if (!tpl) throw new Error("Template not found")
      const k = templateKind(tpl)
      const cfg = templateConfigOf(tpl, k)
      const idCols = identityColumnsFor(k)
      const fieldCols = fieldColumnsFor(k, cfg)
      const pool = classStudents
      let saved = 0
      const skipped: string[] = []
      for (const r of rows.slice(1)) {
        const get = (label: string) => {
          const i = colAt(label)
          return i >= 0 ? String(r[i] ?? "").trim() : ""
        }
        const nameV = get("Student Name")
        const rollV = get("Roll No")
        const sesV = get("Session")
        let st = pool.find((s: any) => studentRoll(s) && String(studentRoll(s)) === String(rollV))
        if (!st && nameV) st = pool.find((s: any) => studentName(s).toLowerCase() === nameV.toLowerCase())
        if (!st) { skipped.push(nameV || rollV || "?"); continue }
        const data: Record<string, string> = {}
        const put = (key: string, v: string) => { if (v !== "") data[key] = v }
        for (const hc of idCols) put(hc.key, get(hc.label))
        if (!data.session) data.session = sesV || currentSession()
        for (const fc of fieldCols) put(fc.key, get(fc.label))
        if (Object.keys(data).length <= 3) { skipped.push(nameV || rollV || "?"); continue }
        const res = await fetch("/api/result-card/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: Number(resultTemplateId), student_id: Number(st.id), session: data.session, data }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => null)
          throw new Error(j?.error || `Failed to import ${studentName(st)}`)
        }
        saved++
      }
      setPanelStatus({ ok: true, text: `Imported ${saved} of ${pool.length} student(s) of Class ${filterClass}${skipped.length ? ` — ${skipped.length} row(s) skipped: ${skipped.join(", ")}` : ""}.` })
    } catch (e: any) {
      setPanelStatus({ ok: false, text: e.message || "Import failed" })
    } finally {
      setPanelImportBusy(false)
    }
  }

  const customFilteredStudents = useMemo(() => {
    if (!customSearched) return []
    return (students as any[]).filter((s: any) => {
      const cls = s.class || s.className || s.class_name || ""
      const sec = s.section || s.sectionName || s.section_name || ""
      if (customClass && cls !== customClass) return false
      if (customSection && sec !== customSection) return false
      return true
    })
  }, [customSearched, customClass, customSection, students])

  const handleCustomChange = (studentId: number, field: keyof CustomResult, value: string) => {
    setCustomResults((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { studentId, marks: "", maxMarks: "100", grade: "", remarks: "" }), [field]: value, studentId } as CustomResult,
    }))
  }

  const exportSearchCsv = () => {
    if (filteredStudents.length === 0) return
    const head = ["#", "Admission No", "Student Name", "Class", "Section", "Roll No"]
    const rows = filteredStudents.map((s: any, idx: number) => [
      idx + 1,
      s.admissionNo || s.admission_no || String(s.id),
      s.name || `${s.firstName || ""} ${s.lastName || ""}`.trim(),
      s.class || s.className || s.class_name || "",
      s.section || s.sectionName || s.section_name || "",
      s.rollNo || s.roll_no || "",
    ])
    const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `students-${filterClass || "all"}-${filterSection || "all"}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const classIdOf = (st: Student | null) => (st ? classes.find((c) => c.name === studentClass(st))?.id ?? null : null)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Examinations</h2>
          <p className="text-sm text-white/80 mt-0.5">Examinations / Overview · Custom Result & Search Student</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${activeTab === "custom" ? "bg-[var(--primary)] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
          >
            <Award className="h-4 w-4" /> Custom Result
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${activeTab === "search" ? "bg-[var(--primary)] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
          >
            <Users className="h-4 w-4" /> Search Student
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${activeTab === "templates" ? "bg-[var(--primary)] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
          >
            <LayoutTemplate className="h-4 w-4" /> Templates
          </button>
        </div>

        {activeTab === "search" && (
          <div className="p-0">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--primary)]" />
              <h3 className="text-sm font-semibold text-gray-700">Search Student — Select Class & Section</h3>
              <span className="ml-auto text-xs text-gray-400">{searched ? `${filteredStudents.length} found` : `${(students as any[]).length} total students`}</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class <span className="text-red-500">*</span></label>
                  <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setFilterSection(""); setSearched(false) }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                    <option value="">Select Class</option>
                    {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
                  <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                    <option value="">All Sections</option>
                    {availableSections.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button onClick={() => setSearched(true)} disabled={!filterClass}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50">
                    <Search className="h-4 w-4" /> Search
                  </button>
                  <button onClick={() => { setFilterClass(""); setFilterSection(""); setSearched(false) }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
                    Reset
                  </button>
                </div>
                {searched && filteredStudents.length > 0 && (
                  <div className="flex items-end justify-end">
                    <button onClick={exportSearchCsv}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--primary)] border border-indigo-300 rounded-lg hover:bg-[var(--primary-light)]">
                      <Download className="h-4 w-4" /> Export
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
                <div className="w-full md:w-72">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Result Template <span className="text-red-500">*</span></label>
                  <select value={resultTemplateId} onChange={(e) => { setResultTemplateId(e.target.value); setPanelStatus(null) }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                    {panelTemplates.length === 0 ? (
                      <option value="">No templates available</option>
                    ) : (
                      panelTemplates.map((t: any) => <option key={t.id} value={t.id}>{t.name}{t.class_name ? ` · ${t.class_name}` : ""}{t.session ? ` (${t.session})` : ""}</option>)
                    )}
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={handlePanelDownloadFormat} disabled={panelImportBusy || !resultTemplateId || !filterClass || classStudents.length === 0}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50">
                    <Download className="h-4 w-4" /> Download CSV Format
                  </button>
                  <button onClick={() => panelFileRef.current?.click()} disabled={panelImportBusy || !resultTemplateId || !filterClass || classStudents.length === 0}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-[var(--primary)] rounded-lg hover:opacity-90 disabled:opacity-50">
                    <Upload className="h-4 w-4" /> {panelImportBusy ? "Importing…" : "Import CSV"}
                  </button>
                  <input ref={panelFileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePanelImportFile(f); e.target.value = "" }} />
                  <span className="text-[11px] text-gray-400">Imports / downloads for all {classStudents.length} student(s) of Class {filterClass || "—"}.</span>
                </div>
                {panelStatus && (
                  <div className={`w-full text-xs rounded-lg px-3 py-2 ${panelStatus.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {panelStatus.text}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto border-t border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Admission No", "Student Name", "Class", "Section", "Roll No", "Gender"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                    ))}
                    <th className="text-left px-4 py-3 font-semibold text-[var(--primary)] text-xs uppercase whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!searched ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">Select class and click Search to view students</td></tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">No students found for {filterClass}{filterSection ? ` - ${filterSection}` : ""}</td></tr>
                  ) : (
                    filteredStudents.map((s: any, idx: number) => (
                      <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : "bg-white"}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs font-medium text-gray-800">{s.admissionNo || s.admission_no || String(s.id)}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{s.name || `${s.firstName || ""} ${s.lastName || ""}`.trim() || "—"}</td>
                        <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">{s.class || s.className || s.class_name || "—"}</span></td>
                        <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">{s.section || s.sectionName || s.section_name || "—"}</span></td>
                        <td className="px-4 py-3 text-gray-600">{s.rollNo || s.roll_no || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{s.gender || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button onClick={() => setResultStudent(s)} title="Edit subject-wise result for this student"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors whitespace-nowrap">
                              <ClipboardEdit className="h-3.5 w-3.5" /> Edit Result
                            </button>
                            <button onClick={() => setProgressStudent(s)} title="Edit the Progress Report template for this student"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-200 hover:bg-violet-100 transition-colors whitespace-nowrap">
                              <FileSpreadsheet className="h-3.5 w-3.5" /> Edit PROGRESS REPORT
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {searched && <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500 bg-gray-50/50">Showing {filteredStudents.length} students {filterClass ? `in ${filterClass}${filterSection ? ` - ${filterSection}` : ""}` : ""} — use the action buttons to edit each student&apos;s result or progress report</div>}
          </div>
        )}
        {activeTab === "custom" && (
          <div className="p-0">
            <div className="px-5 py-3 border-b border-gray-100 bg-amber-50/50 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-gray-700">Custom Result — Enter marks per student</h3>
              <span className="ml-auto text-xs text-gray-400">{customSearched ? `${customFilteredStudents.length} students` : "Select class & section"}</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class <span className="text-red-500">*</span></label>
                  <select value={customClass} onChange={(e) => { setCustomClass(e.target.value); setCustomSection(""); setCustomSearched(false) }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                    <option value="">Select Class</option>
                    {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
                  <select value={customSection} onChange={(e) => setCustomSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                    <option value="">All Sections</option>
                    {customAvailableSections.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button onClick={() => setCustomSearched(true)} disabled={!customClass}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] disabled:opacity-50">
                    <Search className="h-4 w-4" /> Load Students
                  </button>
                  <button onClick={() => { setCustomClass(""); setCustomSection(""); setCustomSearched(false); setCustomResults({}) }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Reset</button>
                </div>
                {customSearched && customFilteredStudents.length > 0 && (
                  <div className="flex items-end justify-end gap-2">
                    <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"><Printer className="h-4 w-4" /> Print</button>
                    <button onClick={() => {
                      const rows = customFilteredStudents.map((s: any) => {
                        const r = customResults[s.id] || { marks: "", maxMarks: "100", grade: "", remarks: "" }
                        return r
                      })
                      // simple save to console / could POST to API
                      alert(`Saving ${rows.length} custom results for ${customClass} ${customSection}`)
                    }} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">
                      <Save className="h-4 w-4" /> Save Custom Result
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto border-t border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Admission No", "Student Name", "Marks Obtained", "Max Marks", "Grade", "Remarks"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!customSearched ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">Select class and load students to enter custom results</td></tr>
                  ) : customFilteredStudents.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No students found</td></tr>
                  ) : (
                    customFilteredStudents.map((s: any, idx: number) => {
                      const r = customResults[s.id] || { marks: "", maxMarks: "100", grade: "", remarks: "" }
                      return (
                        <tr key={s.id} className={`border-b border-gray-100 hover:bg-amber-50/30 ${idx % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}>
                          <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs">{s.admissionNo || s.admission_no || String(s.id)}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{s.name || `${s.firstName || ""} ${s.lastName || ""}`.trim()}</td>
                          <td className="px-4 py-2"><input type="number" value={r.marks} onChange={(e) => handleCustomChange(s.id, "marks", e.target.value)} placeholder="0" className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)]" /></td>
                          <td className="px-4 py-2"><input type="number" value={r.maxMarks} onChange={(e) => handleCustomChange(s.id, "maxMarks", e.target.value)} placeholder="100" className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)]" /></td>
                          <td className="px-4 py-2"><input type="text" value={r.grade} onChange={(e) => handleCustomChange(s.id, "grade", e.target.value)} placeholder="A+" className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)]" /></td>
                          <td className="px-4 py-2"><input type="text" value={r.remarks} onChange={(e) => handleCustomChange(s.id, "remarks", e.target.value)} placeholder="Pass" className="w-32 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)]" /></td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            {customSearched && <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500 bg-amber-50/30">Custom result entry for {customFilteredStudents.length} students — marks will be saved as custom result</div>}
          </div>
        )}
        {activeTab === "templates" && (
          <div className="p-0">
            <div className="px-5 py-3 border-b border-gray-100 bg-violet-50/50 flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-semibold text-gray-700">Result Templates — Primary Format (Class I to V)</h3>
              <span className="ml-auto text-xs text-gray-400">{templates.length} templates</span>
              <Link href="/admin/result-card/templates" className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-full hover:opacity-90">
                <Plus className="h-3.5 w-3.5" /> Manage Templates
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Template Name", "Class", "Session", "Pages", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {templates.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">No templates found — create one at Result Templates</td></tr>
                  ) : (
                    templates.map((t: any, idx: number) => (
                      <tr key={t.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : "bg-white"}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2"><FileText className="h-4 w-4 text-violet-500" /> {t.name}</td>
                        <td className="px-4 py-3 text-gray-600">{t.class_name || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{t.session || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{t.pages?.[0]?.config ? "Dynamic" : (t.pages?.length ?? 0)}</td>
                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${t.is_active ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500"}`}>{t.is_active ? "Active" : "Inactive"}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">{templates.length} templates — Primary Format (Class I to V) dynamic builder at Result Templates</span>
              <Link href="/admin/result-card/templates" className="text-sm font-medium text-[var(--primary)] hover:underline">Open Template Builder →</Link>
            </div>
          </div>
        )}
      </div>

      {resultStudent && (
        <ResultTemplateModal
          student={resultStudent}
          classId={classIdOf(resultStudent)}
          onClose={() => setResultStudent(null)}
        />
      )}
      {progressStudent && (
        <ResultTemplateModal
          student={progressStudent}
          classId={classIdOf(progressStudent)}
          progressOnly
          onClose={() => setProgressStudent(null)}
        />
      )}
    </div>
  )
}

type TplKind = "primary" | "progress" | "preprimary" | "middle"

function parsePages(tpl: any): any[] {
  let p = tpl?.pages
  if (typeof p === "string") {
    try { p = JSON.parse(p) } catch { p = [] }
  }
  return Array.isArray(p) ? p : []
}

function templateKind(tpl: any): TplKind {
  const n = String(tpl?.name || "").toLowerCase()
  if (n.includes("progress")) return "progress"
  if (n.includes("middle")) return "middle"
  if (n.includes("pre-primary")) return "preprimary"
  return "primary"
}

function templateConfigOf(tpl: any, kind: TplKind): any {
  if (kind === "progress") return extractProgressConfig(tpl) || DEFAULT_PROGRESS_CONFIG
  if (kind === "middle") return extractMiddleConfig(tpl) || DEFAULT_MIDDLE
  if (kind === "preprimary") return extractPrePrimaryConfig(tpl) || DEFAULT_PREPRIMARY
  return extractConfigFromTemplate(tpl) || DEFAULT_PRIMARY
}

function templateAssignmentIds(tpl: any): number[] {
  const ids: number[] = []
  for (const p of parsePages(tpl)) {
    const as = p?.config?.assignments
    if (Array.isArray(as)) {
      for (const a of as) if (a && a.classId != null) ids.push(Number(a.classId))
    }
  }
  return ids
}

function templateAppliesTo(tpl: any, classId: number | null): boolean {
  if (!classId) return true
  if (tpl.class_id != null && Number(tpl.class_id) !== Number(classId)) return false
  const ids = templateAssignmentIds(tpl)
  if (ids.length) return ids.includes(Number(classId))
  return true
}

function blankDataFor(kind: TplKind, cfg: any, existing: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...existing }
  const ensure = (k: string) => { if (out[k] === undefined) out[k] = "" }
  if (kind === "progress") {
    for (const s of cfg.subjects || []) {
      if (s.hasSplit) {
        for (const suf of ["fa2_lit", "fa2_lang", "proj_lit", "proj_lang", "ct_lit", "ct_lang", "sa2_lit", "sa2_lang", "ct2_lit", "ct2_lang", "viva_lit", "viva_lang"]) ensure(`${s.id}_${suf}`)
      } else {
        for (const suf of ["fa2", "proj", "ct", "sa2", "ct2", "viva"]) ensure(`${s.id}_${suf}`)
      }
    }
    for (const o of cfg.otherSubjects || []) ensure(o.id)
    ensure("principalName")
    ensure("yearLabel")
  } else if (kind === "primary") {
    for (const s of cfg.academicSubjects || []) {
      if (s.hasSplit) {
        for (const suffix of ["f1_lit", "f1_lang", "s1_lit", "s1_lang", "t1_lit", "t1_lang", "f2_lit", "f2_lang", "s2_lit", "s2_lang", "t2_lit", "t2_lang", "ff_lit", "ff_lang", "ss_lit", "ss_lang", "overall_lit", "overall_lang"]) ensure(`${s.id}_${suffix}`)
      } else {
        for (const suffix of ["f1", "s1", "t1", "f2", "s2", "t2", "ff", "ss", "overall"]) ensure(`${s.id}_${suffix}`)
      }
    }
    for (const o of cfg.otherSubjects || []) {
      ensure(`${o.id}_half`); ensure(`${o.id}_half_grade`); ensure(`${o.id}_annual`); ensure(`${o.id}_annual_grade`); ensure(`${o.id}_overall`)
    }
    for (const w of cfg.workHabits || []) { ensure(`${w.id}_half`); ensure(`${w.id}_annual`) }
    for (const w of cfg.socialPersonal || []) { ensure(`${w.id}_half`); ensure(`${w.id}_annual`) }
    for (const w of cfg.regularity || []) { ensure(`${w.id}_half`); ensure(`${w.id}_annual`) }
    for (const w of cfg.coCurricular || []) { ensure(`${w.id}_half`); ensure(`${w.id}_annual`) }
    ensure("year")
  } else if (kind === "preprimary") {
    for (const g of cfg.leftGroups || []) for (const it of g.items || []) { ensure(`${it.id}_half`); ensure(`${it.id}_annual`) }
    for (const g of cfg.rightGroups || []) for (const it of g.items || []) { ensure(`${it.id}_half`); ensure(`${it.id}_annual`) }
    for (const k of ["overallGrade", "halfRemark", "annualRemark", "finalClass", "finalGranted", "principalHalf", "principalAnnual", "guardianAnnual"]) ensure(k)
  } else {
    for (const s of cfg.subjects || []) for (const suf of ["ut1", "mid1", "total1", "ut2", "mid2", "total2", "total200", "overall"]) ensure(`${s.id}_${suf}`)
    for (const p of cfg.personality || []) { ensure(`${p.id}_t1`); ensure(`${p.id}_t2`) }
    for (const c of cfg.coCurricular || []) { ensure(`${c.id}_t1`); ensure(`${c.id}_t2`) }
    for (const r of cfg.regularity || []) { ensure(`${r.id}_t1`); ensure(`${r.id}_t2`) }
    ensure("overallPercent")
  }
  return out
}

function identityDataFor(student: Student, kind: TplKind, existing: Record<string, string>): Record<string, string> {
  const n = studentName(student)
  const cls = studentClass(student)
  const sec = studentSection(student)
  const roll = studentRoll(student)
  if (kind === "progress") return { studentName: existing.studentName || n, class: existing.class || cls, rollNo: existing.rollNo || roll }
  if (kind === "primary") return { name: existing.name || n, class: existing.class || cls, section: existing.section || sec, rollNo: existing.rollNo || roll }
  return { name: existing.name || n, class: existing.class || cls, rollNo: existing.rollNo || roll }
}

const PRI_SPLIT: [string, string][] = [
  ["f1_lit", "F1 Lit"], ["f1_lang", "F1 Lang"], ["s1_lit", "S1 Lit"], ["s1_lang", "S1 Lang"],
  ["t1_lit", "T1 Lit"], ["t1_lang", "T1 Lang"], ["f2_lit", "F2 Lit"], ["f2_lang", "F2 Lang"],
  ["s2_lit", "S2 Lit"], ["s2_lang", "S2 Lang"], ["t2_lit", "T2 Lit"], ["t2_lang", "T2 Lang"],
  ["ff_lit", "FF Lit"], ["ff_lang", "FF Lang"], ["ss_lit", "SS Lit"], ["ss_lang", "SS Lang"],
  ["overall_lit", "Overall Lit"], ["overall_lang", "Overall Lang"],
]
const PRI_SIMPLE: [string, string][] = [["f1", "F1"], ["s1", "S1"], ["t1", "T1"], ["f2", "F2"], ["s2", "S2"], ["t2", "T2"], ["ff", "FF"], ["ss", "SS"], ["overall", "Overall"]]
const PROG_SPLIT: [string, string][] = [
  ["fa2_lit", "FA2 Lit"], ["fa2_lang", "FA2 Lang"], ["proj_lit", "Proj Lit"], ["proj_lang", "Proj Lang"],
  ["ct_lit", "CT Lit"], ["ct_lang", "CT Lang"], ["sa2_lit", "SA2 Lit"], ["sa2_lang", "SA2 Lang"],
  ["ct2_lit", "CT2 Lit"], ["ct2_lang", "CT2 Lang"], ["viva_lit", "Viva Lit"], ["viva_lang", "Viva Lang"],
]
const PROG_SIMPLE: [string, string][] = [["fa2", "FA2"], ["proj", "Proj"], ["ct", "CT"], ["sa2", "SA2"], ["ct2", "CT2"], ["viva", "Viva"]]
const MID_SUFFIX: [string, string][] = [["ut1", "UT1"], ["mid1", "Mid1"], ["total1", "Total1"], ["ut2", "UT2"], ["mid2", "Mid2"], ["total2", "Total2"], ["total200", "Total 200"], ["overall", "Overall"]]

function cleanLabel(l: string): string {
  return String(l || "").replace(/^\s*•\s*/, "").replace(/^\s*-\s*/, "").replace(/\n/g, " ").trim()
}

type FieldCol = { key: string; label: string }

function identityColumnsFor(kind: TplKind): FieldCol[] {
  const cols: FieldCol[] = [{ key: kind === "progress" ? "studentName" : "name", label: "Student Name" }, { key: "class", label: "Class" }]
  if (kind === "primary") cols.push({ key: "section", label: "Section" })
  cols.push({ key: "rollNo", label: "Roll No" }, { key: "session", label: "Session" })
  return cols
}

function fieldColumnsFor(kind: TplKind, cfg: any): FieldCol[] {
  const cols: FieldCol[] = []
  const push = (key: string, parent: string, human: string) => cols.push({ key, label: `${cleanLabel(parent)} ${human}` })
  if (kind === "progress") {
    for (const s of cfg.subjects || []) {
      if (s.hasSplit) { for (const [suf, human] of PROG_SPLIT) push(`${s.id}_${suf}`, s.label, human) }
      else { for (const [suf, human] of PROG_SIMPLE) push(`${s.id}_${suf}`, s.label, human) }
    }
    for (const o of cfg.otherSubjects || []) cols.push({ key: o.id, label: cleanLabel(o.label) })
    cols.push({ key: "principalName", label: "Principal's Name" })
  } else if (kind === "primary") {
    for (const s of cfg.academicSubjects || []) {
      if (s.hasSplit) { for (const [suf, human] of PRI_SPLIT) push(`${s.id}_${suf}`, s.label, human) }
      else { for (const [suf, human] of PRI_SIMPLE) push(`${s.id}_${suf}`, s.label, human) }
    }
    for (const o of cfg.otherSubjects || []) {
      const L0 = cleanLabel(o.label)
      cols.push({ key: `${o.id}_half`, label: `${L0} Half` })
      cols.push({ key: `${o.id}_half_grade`, label: `${L0} Half Grade` })
      cols.push({ key: `${o.id}_annual`, label: `${L0} Annual` })
      cols.push({ key: `${o.id}_annual_grade`, label: `${L0} Annual Grade` })
      cols.push({ key: `${o.id}_overall`, label: `${L0} Overall` })
    }
    const habit = (arr: any[]) => { for (const w of arr || []) { cols.push({ key: `${w.id}_half`, label: `${cleanLabel(w.label)} Half` }); cols.push({ key: `${w.id}_annual`, label: `${cleanLabel(w.label)} Annual` }) } }
    habit(cfg.workHabits); habit(cfg.socialPersonal); habit(cfg.regularity); habit(cfg.coCurricular)
  } else if (kind === "preprimary") {
    const group = (arr: any[]) => { for (const g of arr || []) for (const it of g.items || []) { cols.push({ key: `${it.id}_half`, label: `${cleanLabel(it.label)} Half` }); cols.push({ key: `${it.id}_annual`, label: `${cleanLabel(it.label)} Annual` }) } }
    group(cfg.leftGroups); group(cfg.rightGroups)
    const extra: [string, string][] = [["overallGrade", "Overall Grade"], ["halfRemark", "Half Year Remark"], ["annualRemark", "Annual Year Remark"], ["finalClass", "Final Class"], ["finalGranted", "Promoted / Granted"], ["principalHalf", "Principal's Signature (Half)"], ["principalAnnual", "Principal's Signature (Annual)"], ["guardianAnnual", "Guardian's Signature"]]
    for (const [k, lab] of extra) cols.push({ key: k, label: lab })
  } else {
    for (const s of cfg.subjects || []) for (const [suf, human] of MID_SUFFIX) push(`${s.id}_${suf}`, s.label, human)
    const group = (arr: any[]) => { for (const w of arr || []) { cols.push({ key: `${w.id}_t1`, label: `${cleanLabel(w.label)} T1` }); cols.push({ key: `${w.id}_t2`, label: `${cleanLabel(w.label)} T2` }) } }
    group(cfg.personality); group(cfg.coCurricular); group(cfg.regularity)
    cols.push({ key: "overallPercent", label: "Overall Percent" })
  }
  return cols
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ } else inQ = false
      } else cell += c
    } else if (c === '"') {
      inQ = true
    } else if (c === ",") {
      row.push(cell); cell = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(cell); cell = ""
      rows.push(row); row = []
    } else cell += c
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""))
}

function downloadCsvFile(rows: Record<string, string>[], headers: string[], filename: string) {
  const lines = [headers, ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))]
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

function ResultTemplateModal({ student, classId, progressOnly = false, onClose }: { student: Student; classId: number | null; progressOnly?: boolean; onClose: () => void }) {
  const [templates, setTemplates] = useState<ResultTemplate[]>([])
  const [tplId, setTplId] = useState("")
  const [recordId, setRecordId] = useState<number | null>(null)
  const [data, setData] = useState<Record<string, string>>({})
  const [config, setConfig] = useState<any>(DEFAULT_PRIMARY)
  const [kind, setKind] = useState<TplKind>("primary")
  const [recSession, setRecSession] = useState("")
  const [loading, setLoading] = useState(true)
  const [bodyMsg, setBodyMsg] = useState("")
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState("")
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    setMounted(true)
    if (startedRef.current) return
    startedRef.current = true
    loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (k: string, v: string) => setData((prev) => ({ ...prev, [k]: v }))

  const loadTemplate = async (id: string, tplOverride?: ResultTemplate | null) => {
    if (!id) return
    const tpl = tplOverride || templates.find((t) => String(t.id) === id) || null
    if (!tpl) return
    const k = templateKind(tpl)
    const cfg = templateConfigOf(tpl, k)
    setKind(k)
    setConfig(cfg)
    let existing: Record<string, string> = {}
    let s = tpl.session || ""
    let rid: number | null = null
    try {
      const recs = await getJson<any[]>("/api/result-card/records?template_id=" + id)
      const mine = (Array.isArray(recs) ? recs : []).find((r) => Number(r.student_id) === Number(student.id))
      if (mine) {
        existing = mine.data && typeof mine.data === "object" ? mine.data : {}
        rid = Number(mine.id)
        s = mine.session || s
      }
    } catch {
      existing = {}
    }
    const merged = { ...blankDataFor(k, cfg, {}), ...existing }
    setRecordId(rid)
    setRecSession(s)
    setData({ ...merged, ...identityDataFor(student, k, merged), session: merged.session || s || currentSession() })
    setSavedMsg("")
    setBodyMsg(`"${tpl.name}" loaded for ${studentName(student)} in Class ${studentClass(student) || "—"} — all input fields are blank. Enter the values and save.`)
  }

  const loadTemplates = async () => {
    setLoading(true)
    setError("")
    try {
      const allR = await getJson<ResultTemplate[]>("/api/result-card/templates")
      let all = Array.isArray(allR) ? allR : []
      all = progressOnly ? all.filter((t) => templateKind(t) === "progress") : all
      let created = false
      if (progressOnly && all.length === 0) {
        const res = await fetch("/api/result-card/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Progress Report (Primary)",
            class_id: classId,
            session: null,
            pages: [{ id: "progress-config", config: DEFAULT_PROGRESS_CONFIG }],
            is_active: true,
          }),
        })
        const row = await res.json()
        if (!res.ok) throw new Error(row.error || "Could not create a default progress template")
        all = [row]
        created = true
      }
      const assigned = all.filter((t) => templateAppliesTo(t, classId))
      const fallbackAll = assigned.length === 0 && all.length > 0
      const tpls = fallbackAll ? all : assigned
      setTemplates(tpls)
      setBodyMsg(
        created
          ? "Created a default Progress Report template for this class — fill the fields and save."
          : fallbackAll
            ? `None of the templates are assigned to Class ${studentClass(student)} — showing all templates. Use Assign Classes in Result Templates for a focused list.`
            : `${tpls.length} template${tpls.length === 1 ? "" : "s"} for Class ${studentClass(student)} — all fields blank for this student.`
      )
      if (tpls.length > 0) {
        setTplId(String(tpls[0].id))
        await loadTemplate(String(tpls[0].id), tpls[0])
      }
    } catch (e: any) {
      setError(e.message || "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  const onTemplateChange = async (id: string) => {
    setTplId(id)
    setSavedMsg("")
    setError("")
    await loadTemplate(id)
  }

  const handleSave = async () => {
    if (!tplId) {
      setError("Select a template first")
      return
    }
    setSaving(true)
    setError("")
    setSavedMsg("")
    try {
      const payload: Record<string, any> = {
        template_id: Number(tplId),
        student_id: Number(student.id),
        session: data.session || recSession || currentSession(),
        data,
      }
      if (recordId) payload.id = recordId
      const res = await fetch("/api/result-card/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save result")
      const row = await res.json()
      setRecordId(Number(row.id))
      setRecSession(row.session || "")
      setSavedMsg(`Saved for ${studentName(student)} — reopening will show the saved values for editing.`)
    } catch (e: any) {
      setError(e.message || "Failed to save result")
    } finally {
      setSaving(false)
    }
  }

  const accent = progressOnly ? "violet" : "var(--primary)"

  const printContent = !loading && templates.length > 0 && tplId ? (
    kind === "progress" ? (
      <ProgressReportCard data={data} config={config} editable={false} />
    ) : kind === "preprimary" ? (
      <PrePrimaryFormatCard data={data} config={config} editable={false} />
    ) : kind === "middle" ? (
      <MiddleSchoolFormatCard data={data} config={config} editable={false} />
    ) : (
      <PrimaryFormatCard data={data} config={config} editable={false} />
    )
  ) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {mounted && createPortal(
        <div className="exam-print-card bg-white">{printContent}</div>,
        document.body
      )}
      <style>{`
        .exam-print-card { display: none; }
        @media print {
          body * { visibility: hidden !important; }
          .exam-print-card, .exam-print-card * { visibility: visible !important; box-shadow: none !important; }
          .exam-print-card { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; z-index: 2147483647 !important; }
        }
      `}</style>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col z-10">
        <div className={`flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r ${progressOnly ? "from-violet-600 to-violet-500" : "from-[var(--primary)] to-[var(--primary)]/85"}`}>
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">{progressOnly ? <FileSpreadsheet className="h-5 w-5" /> : <ClipboardEdit className="h-5 w-5" />} {progressOnly ? "Edit PROGRESS REPORT" : "Edit Result"}</h3>
            <p className="text-sm text-white/85 mt-1">
              {studentName(student)}{studentClass(student) ? ` · Class ${studentClass(student)}` : ""}{studentSection(student) ? ` - ${studentSection(student)}` : ""} · Roll {studentRoll(student) || "—"} · Adm {student.admissionNo || student.admission_no || String(student.id)}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full md:w-96">
              <label className="block text-xs font-medium text-gray-600 mb-1">{progressOnly ? "Progress Report Template" : "Result Template (from Result Templates)"}</label>
              <select value={tplId} onChange={(e) => onTemplateChange(e.target.value)} className={inputCls}>
                {templates.length === 0 ? (
                  <option value="">Loading…</option>
                ) : (
                  templates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.class_name ? ` · ${t.class_name}` : ""}{t.session ? ` (${t.session})` : ""}</option>)
                )}
              </select>
            </div>
            {templates.length === 0 && !loading && (
              <button onClick={loadTemplates} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"><RefreshCwIcon /> Reload</button>
            )}
            <span className="ml-auto text-xs text-gray-400">{templates.length} template{templates.length === 1 ? "" : "s"} available{templates.length ? ` · ${tplId ? (templates.find((t) => String(t.id) === tplId)?.name || "") : ""} assigned for class` : ""}</span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading template…</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No templates available for this view — create one at Result Templates.</div>
          ) : (
            <>
              {bodyMsg && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {bodyMsg}
                </div>
              )}
              {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}
              {savedMsg && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {savedMsg}
                </div>
              )}
              <div className="rounded-xl border border-gray-200 shadow-inner overflow-hidden bg-gray-50 p-4">
                {kind === "progress" ? (
                  <ProgressReportCard data={data} config={config} editable onChange={handleChange} />
                ) : kind === "preprimary" ? (
                  <PrePrimaryFormatCard data={data} config={config} editable onChange={handleChange} />
                ) : kind === "middle" ? (
                  <MiddleSchoolFormatCard data={data} config={config} editable onChange={handleChange} />
                ) : (
                  <PrimaryFormatCard data={data} config={config} editable onChange={handleChange} />
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-2 bg-gray-50/60">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">{progressOnly ? "Saved per student per progress template." : "Result card is stored per student per template. Templates load with blank values."}</span>
            <button onClick={() => window.print()} disabled={templates.length === 0 || !tplId || loading}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <Printer className="h-4 w-4" /> Print Full Result
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving || templates.length === 0 || tplId === ""}
              className="inline-flex items-center gap-1.5 px-6 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              style={progressOnly ? undefined : { backgroundColor: accent }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? "Saving…" : recordId ? "Update" : "Save For Student"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RefreshCwIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}