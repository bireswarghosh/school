"use client"

import { useState } from "react"
import { Search, Printer, Download } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useSchoolInfo } from "@/lib/use-school-info"
import PrintDocModal from "@/components/PrintDocModal"
import { docCss, docHeaderHtml, docFoot, escHtml } from "@/lib/print-doc"

type ExamGroup = {
  id: number
  name: string
}

type Exam = {
  id: number
  name: string
  groupId: number
}

type StudentMark = {
  id: number
  admissionNo: string
  studentName: string
  className: string
  section: string
  subject: string
  theoryMarks: number
  practicalMarks: number
  total: number
  maxMarks: number
  percentage: number
  grade: string
  result: "Pass" | "Fail"
}

const sessions = ["2025-26", "2024-25", "2023-24"]

export default function PrintMarksheetPage() {
  const { classNames: classes, sectionNames: sections } = useClassesAndSections()
  const { info } = useSchoolInfo()
  const [printOpen, setPrintOpen] = useState(false)
  const [printTitle, setPrintTitle] = useState("Marksheet")
  const [printRows, setPrintRows] = useState<StudentMark[]>([])
  const { data: examGroups, loading } = useApi<ExamGroup>("/api/examinations/exam")
  const { data: exams } = useApi<Exam>("/api/examinations/exam")
  const { data: allMarks } = useApi<StudentMark>("/api/examinations/exam")
  const [selectedGroup, setSelectedGroup] = useState("")
  const [selectedExam, setSelectedExam] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [selectedSession, setSelectedSession] = useState("")
  const [searched, setSearched] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const filteredMarks = allMarks.filter((m) => {
    if (selectedClass && m.className !== selectedClass) return false
    if (selectedSection && m.section !== selectedSection) return false
    return true
  })

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMarks.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredMarks.map((m) => m.id)))
    }
  }

  const handleSearch = () => {
    setSearched(true)
  }

  const openPrint = (rows: StudentMark[], title: string) => {
    if (rows.length === 0) return
    setPrintRows(rows)
    setPrintTitle(title)
    setPrintOpen(true)
  }

  const buildMarksheetHtml = (): string => {
    const groups = new Map<string, StudentMark[]>()
    for (const m of printRows) {
      const key = `${m.admissionNo}|${m.studentName}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(m)
    }
    const blocks = [...groups.values()]
      .map((rows) => {
        const first = rows[0]
        const subjectRows = rows
          .map(
            (r, i) =>
              `<tr><td class="c">${i + 1}</td><td>${escHtml(r.subject)}</td><td class="c">${r.theoryMarks}</td><td class="c">${r.practicalMarks}</td><td class="c strong">${r.total}/${r.maxMarks}</td><td class="c">${r.percentage}%</td><td class="c">${escHtml(r.grade)}</td><td class="c">${escHtml(r.result)}</td></tr>`
          )
          .join("")
        const total = rows.reduce((s, r) => s + r.total, 0)
        const max = rows.reduce((s, r) => s + r.maxMarks, 0)
        const pct = max ? Math.round((total / max) * 100) : 0
        const marksheetResult = rows.every((r) => r.result === "Pass") ? "Pass" : "Fail"
        return `<div class="student-block">
          <div class="info">
            <div><div class="lbl">Student</div><div class="name">${escHtml(first.studentName)}</div></div>
            <div><div class="lbl">Admission No</div><div class="name">${escHtml(first.admissionNo)}</div></div>
            <div><div class="lbl">Class</div><div class="name">${escHtml(first.className + (first.section ? " - " + first.section : ""))}</div></div>
            <div><div class="lbl">Exam</div><div class="name">${escHtml(selectedExam || "-")}</div></div>
          </div>
          <table>
            <thead><tr><th class="c">#</th><th>Subject</th><th class="c">Theory</th><th class="c">Practical</th><th class="c">Total</th><th class="c">%</th><th class="c">Grade</th><th class="c">Result</th></tr></thead>
            <tbody>${subjectRows}</tbody>
          </table>
          <div class="totals">
            <div class="row"><span>Overall Marks</span><span>${total}/${max}</span></div>
            <div class="row"><span>Overall Percentage</span><span>${pct}%</span></div>
            <div class="row grand"><span>Result</span><span>${marksheetResult}</span></div>
          </div>
        </div>`
      })
      .join("")

    return `<!doctype html>
<html>
<head><meta charset="utf-8" /><title>Marksheet</title>
<style>${docCss}</style>
</head>
<body>
  <div class="sheet">
    ${docHeaderHtml(info, "MARKSHEET", info.session)}
    ${blocks || `<p class="c">No marks found for the selected criteria.</p>`}
    ${docFoot("This is a computer-generated marksheet. Marks are exactly as entered in the marks entry module.")}
  </div>
</body>
</html>`
  }

  const exportCsv = () => {
    if (filteredMarks.length === 0) return
    const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const head = ["Admission No", "Student Name", "Class", "Section", "Subject", "Theory Marks", "Practical Marks", "Total", "Max Marks", "Percentage", "Grade", "Result"]
    const lines = filteredMarks.map((m) =>
      [m.admissionNo, m.studentName, m.className, m.section, m.subject, m.theoryMarks, m.practicalMarks, m.total, m.maxMarks, `${m.percentage}%`, m.grade, m.result].map(q).join(",")
    )
    const blob = new Blob(["\uFEFF" + [head.map(q).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "marksheet.csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-6 text-white"
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
        }}
      >
        <div className="flex items-center gap-2 text-sm text-[var(--primary)]/80 mb-2">
          <span>Examinations</span>
          <span>/</span>
          <span className="text-white font-medium">Print Marksheet</span>
        </div>
        <h2 className="text-2xl font-bold">Print Marksheet</h2>
        <p className="text-[var(--primary)]/80 text-sm mt-1">Generate and print marksheets for students</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Group</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="">Select Exam Group</option>
              {examGroups.map((g) => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="">Select Exam</option>
              {exams.map((e) => (
                <option key={e.id} value={e.name}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="">Select Section</option>
              {sections.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="">Select Session</option>
              {sessions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSearch}
            className="flex items-center gap-1.5 text-sm text-white bg-[var(--primary)] hover:bg-[var(--secondary)] px-5 py-2 rounded-lg transition-colors"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>

      {searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredMarks.length}</span> records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openPrint(selectedIds.size > 0 ? filteredMarks.filter((m) => selectedIds.has(m.id)) : filteredMarks, `Marksheet · ${selectedExam || "All Exams"}`)}
                className="flex items-center gap-1.5 text-sm text-white bg-[var(--primary)] hover:bg-[var(--secondary)] px-4 py-1.5 rounded-lg transition-colors">
                <Printer className="h-4 w-4" />
                Print Selected ({selectedIds.size})
              </button>
              <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredMarks.length && filteredMarks.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Admission No</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Student Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Class</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Section</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Theory Marks</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Practical Marks</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Percentage</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Grade</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Result</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarks.map((mark, idx) => (
                  <tr
                    key={mark.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(mark.id)}
                        onChange={() => toggleSelect(mark.id)}
                        className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{idx + 1}</td>
                    <td className="px-4 py-2.5 text-gray-700">{mark.admissionNo}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{mark.studentName}</td>
                    <td className="px-4 py-2.5 text-gray-700">{mark.className}</td>
                    <td className="px-4 py-2.5 text-gray-700">{mark.section}</td>
                    <td className="px-4 py-2.5 text-gray-700">{mark.subject}</td>
                    <td className="px-4 py-2.5 text-center text-gray-700">{mark.theoryMarks}</td>
                    <td className="px-4 py-2.5 text-center text-gray-700">{mark.practicalMarks}</td>
                    <td className="px-4 py-2.5 text-center font-medium text-gray-800">{mark.total}</td>
                    <td className="px-4 py-2.5 text-center text-gray-700">{mark.percentage}%</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {mark.grade}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          mark.result === "Pass"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {mark.result}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button onClick={() => openPrint(filteredMarks.filter((m) => m.id === mark.id), `Marksheet · ${mark.studentName}`)} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="Print">
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMarks.length === 0 && (
                  <tr>
                    <td colSpan={14} className="px-4 py-12 text-center text-gray-500">
                      No records found matching the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PrintDocModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        title={printTitle}
        subtitle={info.name}
        html={buildMarksheetHtml()}
      />
    </div>
  )
}
