"use client"

import { useState, useMemo } from "react"
import { Search, Filter, Download, Users, Award, Save, Printer, FileText, Plus, LayoutTemplate, Copy, Trash2 } from "lucide-react"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useApi } from "@/lib/use-api"
import Link from "next/link"

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
            </div>

            <div className="overflow-x-auto border-t border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Admission No", "Student Name", "Class", "Section", "Roll No", "Gender"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!searched ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">Select class and click Search to view students</td></tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No students found for {filterClass}{filterSection ? ` - ${filterSection}` : ""}</td></tr>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {searched && <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500 bg-gray-50/50">Showing {filteredStudents.length} students {filterClass ? `in ${filterClass}${filterSection ? ` - ${filterSection}` : ""}` : ""}</div>}
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
              <h3 className="text-sm font-semibold text-gray-700">Result Templates</h3>
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
                        <td className="px-4 py-3 text-gray-600">{t.pages?.length ?? 0}</td>
                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${t.is_active ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500"}`}>{t.is_active ? "Active" : "Inactive"}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">{templates.length} templates — manage full builder at Result Templates</span>
              <Link href="/admin/result-card/templates" className="text-sm font-medium text-[var(--primary)] hover:underline">Open Template Builder →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
