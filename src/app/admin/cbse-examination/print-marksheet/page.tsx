"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Search, Printer, Download, Eye, X, ChevronDown } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useSchoolInfo } from "@/lib/use-school-info"
import { schoolPrintHeader } from "@/lib/school-print-branding"

type MarkSheetRecord = {
  id: number
  studentName: string
  admissionNo: string
  class: string
  section: string
  examName: string
  subjects: { name: string; theory: number; practical: number; total: number }[]
  grandTotal: number
  percentage: number
  grade: string
  rank: number
}

type CbseTemplate = {
  id: number
  name: string
  type: string
}

export default function CBSEPrintMarksheetPage() {
  const { classNames, sectionNames } = useClassesAndSections()
  const { info } = useSchoolInfo()
  const classes = ["All", ...classNames]
  const sections = ["All", ...sectionNames]
  const { data: marksheets, loading } = useApi<MarkSheetRecord>("/api/cbse/marksheet")
  const { data: apiTemplates } = useApi<CbseTemplate>("/api/cbse/template")
  const templates = useMemo(() => {
    const all = (apiTemplates || []).filter((t) => t.type === "marksheet" || t.type === "report")
    return all.length ? all : [{ id: 0, name: "Standard Marksheet", type: "marksheet" }]
  }, [apiTemplates])
  const [search, setSearch] = useState("")
  const [filterClass, setFilterClass] = useState("All")
  const [filterSection, setFilterSection] = useState("All")
  const [filterTemplate, setFilterTemplate] = useState("")
  const [previewItem, setPreviewItem] = useState<MarkSheetRecord | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showExportMenu) return
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showExportMenu])

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  function csvRow(obj: any, cols: string[]): string {
    return cols.map((k) => `"${(obj[k] ?? "").toString().replace(/"/g, '""')}"`).join(",")
  }

  const exportCSV = () => {
    const cols = ["studentName", "admissionNo", "class", "section", "examName", "grandTotal", "percentage", "grade", "rank"]
    const labels = ["Student Name", "Admission No", "Class", "Section", "Exam", "Grand Total", "Percentage", "Grade", "Rank"]
    const data = filtered.map((r) => ({ ...r, grade: getGrade(r.percentage).grade }))
    const csv = [csvRow(Object.fromEntries(labels.map((l, i) => [l, l])), labels), ...data.map((r) => csvRow(r, cols))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    downloadBlob(blob, "marksheet.csv")
    setShowExportMenu(false)
  }

  const exportExcel = () => {
    const labels = ["Student Name", "Admission No", "Class", "Section", "Exam", "Grand Total", "Percentage", "Grade", "Rank"]
    const keys = ["studentName", "admissionNo", "class", "section", "examName", "grandTotal", "percentage", "grade", "rank"]
    let html = `<table><tr>${labels.map((l) => `<th>${l}</th>`).join("")}</tr>`
    filtered.forEach((r) => {
      const g = getGrade(r.percentage)
      html += `<tr>${keys.map((k) => `<td>${k === "grade" ? g.grade : k === "percentage" ? r.percentage.toFixed(1) : (r as any)[k] ?? ""}</td>`).join("")}</tr>`
    })
    html += `</table>`
    const blob = new Blob([html], { type: "application/vnd.ms-excel" })
    downloadBlob(blob, "marksheet.xls")
    setShowExportMenu(false)
  }

  const exportPDF = () => {
    setShowExportMenu(false)
    window.print()
  }

  function getGrade(percentage: number) {
    if (percentage >= 90) return { grade: "A+", color: "text-green-700 bg-green-50" }
    if (percentage >= 80) return { grade: "A", color: "text-blue-700 bg-blue-50" }
    if (percentage >= 70) return { grade: "B+", color: "text-[var(--primary)] bg-[var(--primary-light)]" }
    if (percentage >= 60) return { grade: "B", color: "text-purple-700 bg-purple-50" }
    if (percentage >= 50) return { grade: "C+", color: "text-amber-700 bg-amber-50" }
    if (percentage >= 40) return { grade: "C", color: "text-orange-700 bg-orange-50" }
    return { grade: "F", color: "text-red-600 bg-red-50" }
  }

  const printRecord = (m: MarkSheetRecord) => {
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(`
      <html><head><title>Marksheet - ${m.studentName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
        .sub { text-align: center; color: #666; font-size: 13px; margin-bottom: 24px; }
        .info { display: flex; gap: 40px; font-size: 13px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
        th { background: #f5f5f5; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .footer { margin-top: 20px; font-size: 12px; color: #888; text-align: center; }
      </style></head><body>
      ${schoolPrintHeader(info, "CBSE Affiliated School")}
      <div class="info">
        <div><strong>Student:</strong> ${m.studentName}</div>
        <div><strong>Admission No:</strong> ${m.admissionNo}</div>
        <div><strong>Class:</strong> ${m.class} - ${m.section}</div>
        <div><strong>Exam:</strong> ${m.examName}</div>
      </div>
      <table>
        <tr><th>Subject</th><th class="center">Theory</th><th class="center">Practical</th><th class="center">Total</th></tr>
        ${(m.subjects || []).map((s) => `<tr><td>${s.name}</td><td class="center">${s.theory}</td><td class="center">${s.practical}</td><td class="center">${s.total}</td></tr>`).join("")}
        <tr class="bold"><td colspan="3">Grand Total / Percentage</td><td class="center">${m.grandTotal} (${m.percentage.toFixed(1)}%)</td></tr>
        <tr class="bold"><td colspan="3">Grade</td><td class="center">${getGrade(m.percentage).grade}</td></tr>
      </table>
      <div class="footer">Generated on ${new Date().toLocaleDateString()}</div>
      <script>window.onload = function() { window.print(); window.close(); }<\\/script>
      </body></html>
    `)
    w.document.close()
  }

  const downloadPDF = (m: MarkSheetRecord) => {
    const g = getGrade(m.percentage)
    const subjectRows = (m.subjects || []).map((s) =>
      `<tr><td style="border:1px solid #ccc;padding:6px 10px;">${s.name}</td><td style="border:1px solid #ccc;padding:6px 10px;text-align:center;">${s.theory}</td><td style="border:1px solid #ccc;padding:6px 10px;text-align:center;">${s.practical}</td><td style="border:1px solid #ccc;padding:6px 10px;text-align:center;">${s.total}</td></tr>`
    ).join("")
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Marksheet - ${m.studentName}</title><style>
      body { font-family: Arial, sans-serif; padding: 40px; }
      h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
      .sub { text-align: center; color: #666; font-size: 13px; margin-bottom: 24px; }
      .info { display: flex; gap: 40px; font-size: 13px; margin-bottom: 20px; flex-wrap: wrap; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
      th { background: #f5f5f5; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .footer { margin-top: 20px; font-size: 12px; color: #888; text-align: center; }
    </style></head><body>
      ${schoolPrintHeader(info, "CBSE Affiliated School")}
      <div class="info">
        <div><strong>Student:</strong> ${m.studentName}</div>
        <div><strong>Admission No:</strong> ${m.admissionNo}</div>
        <div><strong>Class:</strong> ${m.class} - ${m.section}</div>
        <div><strong>Exam:</strong> ${m.examName}</div>
      </div>
      <table>
        <tr><th>Subject</th><th class="center">Theory</th><th class="center">Practical</th><th class="center">Total</th></tr>
        ${subjectRows}
        <tr class="bold"><td colspan="3">Grand Total / Percentage</td><td class="center">${m.grandTotal} (${m.percentage.toFixed(1)}%)</td></tr>
        <tr class="bold"><td colspan="3">Grade</td><td class="center">${g.grade}</td></tr>
      </table>
      <div class="footer">Generated on ${new Date().toLocaleDateString()}</div>
    </body></html>`
    const blob = new Blob([html], { type: "text/html" })
    downloadBlob(blob, `marksheet-${m.admissionNo}.html`)
  }

  const filtered = useMemo(() => {
    const arr = Array.isArray(marksheets) ? marksheets : []
    return arr.filter((m) => {
      try {
        const name = (m.studentName ?? "").toLowerCase()
        const adm = (m.admissionNo ?? "").toLowerCase()
        const q = search.toLowerCase()
        const matchSearch = name.includes(q) || adm.includes(q)
        const matchClass = filterClass === "All" || m.class === filterClass
        const matchSection = filterSection === "All" || m.section === filterSection
        const matchTemplate = !filterTemplate || m.examName?.toLowerCase().includes(filterTemplate.toLowerCase())
        return matchSearch && matchClass && matchSection && matchTemplate
      } catch { return false }
    })
  }, [marksheets, search, filterClass, filterSection, filterTemplate])

  const GradeCell = ({ percentage }: { percentage: number }) => {
    const g = getGrade(percentage)
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${g.color}`}>{g.grade}</span>
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm no-print">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Print Marksheet</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">CBSE Examination / Print Marksheet</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 no-print">
          <h3 className="text-sm font-semibold text-gray-700">Marksheet List</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..."
                className="w-48 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterTemplate} onChange={(e) => setFilterTemplate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
              <option value="">All Templates</option>
              {templates.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <div className="relative" ref={exportRef}>
              <button onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="h-3.5 w-3.5" /> Export <ChevronDown className="h-3 w-3" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
                  <button onClick={exportCSV} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
                  <button onClick={exportExcel} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel</button>
                  <button onClick={exportPDF} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Student Name", "Admission No", "Class", "Exam", "Grand Total", "Percentage", "Grade", "Rank", "Action"].map((h) => (
                  <th key={h} className={`text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase ${h === "Action" ? "no-print" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">No marksheet records found</td></tr>
              ) : (
                filtered.map((m, idx) => (
                  <tr key={`${m.admissionNo}-${m.examName}-${idx}`} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{m.studentName}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{m.admissionNo}</td>
                    <td className="px-4 py-3 text-gray-600">{m.class} - {m.section}</td>
                    <td className="px-4 py-3 text-gray-600">{m.examName}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{m.grandTotal}</td>
                    <td className="px-4 py-3 text-gray-600">{m.percentage.toFixed(1)}%</td>
                    <td className="px-4 py-3"><GradeCell percentage={m.percentage} /></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${m.rank === 1 ? "bg-yellow-400 text-yellow-900" : m.rank === 2 ? "bg-gray-300 text-gray-700" : m.rank === 3 ? "bg-amber-200 text-amber-800" : "text-gray-600"}`}>
                        {m.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 no-print">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setPreviewItem(m)} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="Preview"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => printRecord(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Print"><Printer className="h-4 w-4" /></button>
                        <button onClick={() => downloadPDF(m)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download PDF"><Download className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>Showing {filtered.length} of {marksheets.length} records</span>
        </div>
      </div>

      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto no-print">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPreviewItem(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-3xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Marksheet Preview - {previewItem.studentName}</h2>
              <button onClick={() => setPreviewItem(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-6">
              <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
                <div className="text-center mb-4 border-b-2 border-gray-300 pb-3">
                  {info.logoSrc && <img src={info.logoSrc} alt={`${info.name} logo`} className="h-12 w-12 object-contain mx-auto mb-1" />}
                  <h3 className="text-lg font-bold text-gray-900 uppercase">{info.name || "Smart School"}</h3>
                  <p className="text-sm text-gray-500">CBSE Affiliated School</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{filterTemplate}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div><span className="font-semibold text-gray-600">Student Name:</span> {previewItem.studentName}</div>
                  <div><span className="font-semibold text-gray-600">Admission No:</span> {previewItem.admissionNo}</div>
                  <div><span className="font-semibold text-gray-600">Class:</span> {previewItem.class}</div>
                  <div><span className="font-semibold text-gray-600">Section:</span> {previewItem.section}</div>
                  <div><span className="font-semibold text-gray-600">Exam:</span> {previewItem.examName}</div>
                  <div><span className="font-semibold text-gray-600">Rank:</span> {previewItem.rank}</div>
                </div>
                <table className="w-full text-sm border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600 text-xs uppercase">Subject</th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-600 text-xs uppercase">Theory</th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-600 text-xs uppercase">Practical</th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-600 text-xs uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewItem.subjects.map((subj, i) => (
                      <tr key={i}>
                        <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{subj.name}</td>
                        <td className="border border-gray-200 px-3 py-2 text-center text-gray-600">{subj.theory}</td>
                        <td className="border border-gray-200 px-3 py-2 text-center text-gray-600">{subj.practical}</td>
                        <td className="border border-gray-200 px-3 py-2 text-center text-gray-800 font-medium">{subj.total}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="border border-gray-200 px-3 py-2 text-gray-700" colSpan={3}>Grand Total / Percentage</td>
                      <td className="border border-gray-200 px-3 py-2 text-center text-gray-900">{previewItem.grandTotal} ({previewItem.percentage.toFixed(1)}%)</td>
                    </tr>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="border border-gray-200 px-3 py-2 text-gray-700" colSpan={3}>Grade</td>
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        <GradeCell percentage={previewItem.percentage} />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => { printRecord(previewItem) }} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Printer className="h-4 w-4" /> Print</button>
              <button onClick={() => { downloadPDF(previewItem) }} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"><Download className="h-4 w-4" /> Download PDF</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          nav, header, .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}
 