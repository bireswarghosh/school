"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Filter, Download, Printer } from "lucide-react"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useSchoolInfo } from "@/lib/use-school-info"
import PrintDocModal from "@/components/PrintDocModal"
import { docCss, docHeaderHtml, docFoot, escHtml } from "@/lib/print-doc"

type ExamGroup = { id: number; name: string }
type Exam = { id: number; groupId: number; name: string; session: string; passingPercentage: number }
type Subject = { id: number; examId: number; name: string; theoryMax: number; practicalMax: number }
type StudentMark = { id: number; examId: number; subjectId: number; studentId: number; theoryMarks: number; practicalMarks: number; absent: boolean }

type ResultRow = {
  id: number
  admissionNo: string
  studentName: string
  className: string
  subject: string
  theoryMarks: number
  practicalMarks: number
  total: number
  maxMarks: number
  percentage: number
  grade: string
  result: "Pass" | "Fail"
}

const sessions = ["2024-25", "2025-26", "2026-27"]

const getGrade = (percentage: number): string => {
  if (percentage >= 90) return "A+"
  if (percentage >= 75) return "A"
  if (percentage >= 60) return "B+"
  if (percentage >= 50) return "B"
  if (percentage >= 40) return "C"
  if (percentage >= 33) return "D"
  return "F"
}

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  return res.json()
}

export default function ExamResultPage() {
  const { classNames: classes, sectionNames: sections } = useClassesAndSections()
  const { info } = useSchoolInfo()
  const [printOpen, setPrintOpen] = useState(false)
  const [examGroups, setExamGroups] = useState<ExamGroup[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [marks, setMarks] = useState<StudentMark[]>([])
  const [students, setStudents] = useState<any[]>([])

  const [filterGroup, setFilterGroup] = useState("")
  const [filterExam, setFilterExam] = useState("")
  const [filterSession, setFilterSession] = useState("")
  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchJson("/api/examinations/group"),
      fetchJson("/api/examinations/exam"),
      fetchJson("/api/examinations/subject"),
      fetchJson("/api/examinations/mark"),
      fetchJson("/api/students").catch(() => []),
    ]).then(([g, e, s, m, st]) => {
      setExamGroups(g)
      setExams(e)
      setSubjects(s)
      setMarks(m)
      setStudents(st)
    }).catch(console.error)
  }, [])

  const filteredExams = useMemo(() => {
    if (!filterGroup) return []
    return exams.filter((e) => e.groupId === parseInt(filterGroup))
  }, [filterGroup, exams])

  const resultRows = useMemo<ResultRow[]>(() => {
    if (!searched || !filterExam) return []
    const examId = parseInt(filterExam)
    const exam = exams.find((e) => e.id === examId)
    const passingPercentage = exam?.passingPercentage ?? 33
    const examSubjects = subjects.filter((s) => s.examId === examId)
    const examMarks = marks.filter((m) => m.examId === examId)

    const rows: ResultRow[] = []
    let rowId = 0

    for (const student of students) {
      if (filterClass && student.class !== filterClass) continue
      if (filterSection && student.section !== filterSection) continue
      for (const subject of examSubjects) {
        const mark = examMarks.find((m) => m.subjectId === subject.id && m.studentId === student.id)
        if (!mark) continue
        const theory = mark.absent ? 0 : mark.theoryMarks
        const practical = mark.absent ? 0 : mark.practicalMarks
        const maxMarks = subject.theoryMax + subject.practicalMax
        const total = theory + practical
        const percentage = maxMarks > 0 ? Math.round((total / maxMarks) * 100) : 0
        const grade = getGrade(percentage)
        rowId++
        rows.push({
          id: rowId,
          admissionNo: student.admissionNo || String(student.id),
          studentName: student.name || student.firstName + " " + (student.lastName || ""),
          className: `${student.class || ""} - ${student.section || ""}`,
          subject: subject.name,
          theoryMarks: theory,
          practicalMarks: practical,
          total,
          maxMarks,
          percentage,
          grade,
          result: percentage >= passingPercentage ? "Pass" : "Fail",
        })
      }
    }
    return rows
  }, [searched, filterExam, filterClass, filterSection, exams, subjects, marks, students])

  const buildResultHtml = (): string => {
    const exam = exams.find((e) => e.id === parseInt(filterExam))
    const groups = new Map<string, ResultRow[]>()
    for (const row of resultRows) {
      const key = `${row.admissionNo}|${row.studentName}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
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
        const grade = getGrade(pct)
        const result = rows.every((r) => r.result === "Pass") ? "Pass" : "Fail"
        return `<div class="student-block">
          <div class="info">
            <div><div class="lbl">Student</div><div class="name">${escHtml(first.studentName)}</div></div>
            <div><div class="lbl">Admission No</div><div class="name">${escHtml(first.admissionNo)}</div></div>
            <div><div class="lbl">Class</div><div class="name">${escHtml(first.className)}</div></div>
            <div><div class="lbl">Exam</div><div class="name">${escHtml(exam?.name || "")}</div></div>
          </div>
          <table>
            <thead><tr><th class="c">#</th><th>Subject</th><th class="c">Theory</th><th class="c">Practical</th><th class="c">Total</th><th class="c">%</th><th class="c">Grade</th><th class="c">Result</th></tr></thead>
            <tbody>${subjectRows}</tbody>
          </table>
          <div class="totals">
            <div class="row"><span>Overall Marks</span><span>${total}/${max}</span></div>
            <div class="row"><span>Overall Percentage</span><span>${pct}%</span></div>
            <div class="row grand"><span>Result</span><span>${result} (${grade})</span></div>
          </div>
        </div>`
      })
      .join("")

    return `<!doctype html>
<html>
<head><meta charset="utf-8" /><title>Exam Result</title>
<style>${docCss}</style>
</head>
<body>
  <div class="sheet">
    ${docHeaderHtml(info, exam?.name ? `EXAM RESULT · ${escHtml(exam.name)}` : "EXAM RESULT", info.session)}
    ${blocks || `<p class="c">No results found for the selected criteria.</p>`}
    ${docFoot("This is a computer-generated result sheet. Marks are exactly as entered in the Exam Result module.")}
  </div>
</body>
</html>`
  }

  const exportCsv = () => {
    if (resultRows.length === 0) return
    const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const head = ["Admission No", "Student Name", "Class", "Subject", "Theory Marks", "Practical Marks", "Total", "Max Marks", "Percentage", "Grade", "Result"]
    const lines = resultRows.map((r) =>
      [r.admissionNo, r.studentName, r.className, r.subject, r.theoryMarks, r.practicalMarks, r.total, r.maxMarks, `${r.percentage}%`, r.grade, r.result].map(q).join(",")
    )
    const blob = new Blob(["\uFEFF" + [head.map(q).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "exam-result.csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Exam Result</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Examinations / Exam Result</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setSearched(true) }}
          className="p-5"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Exam Group</label>
              <select value={filterGroup} onChange={(e) => { setFilterGroup(e.target.value); setFilterExam(""); setSearched(false) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {examGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Exam</label>
              <select value={filterExam} onChange={(e) => setFilterExam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {filteredExams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
              <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {sessions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
              <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-end gap-3 mt-4">
            <button type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
            <button type="button"
              onClick={() => { setFilterGroup(""); setFilterExam(""); setFilterSession(""); setFilterClass(""); setFilterSection(""); setSearched(false) }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-700">Exam Result List</h3>
          {resultRows.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrintOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:opacity-90 rounded-lg transition-colors">
                <Printer className="h-4 w-4" /> Print Result
              </button>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--primary)] border border-indigo-300 rounded-lg hover:bg-[var(--primary-light)] transition-colors">
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Admission No", "Student Name", "Class", "Subject", "Theory Marks", "Practical Marks", "Total", "Percentage", "Grade", "Result"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={11} className="text-center py-12 text-gray-400">Select criteria and click Search to view results</td></tr>
              ) : resultRows.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-gray-400">No results found for the selected criteria</td></tr>
              ) : (
                resultRows.map((row, idx) => (
                  <tr key={row.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-800">{row.admissionNo}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{row.className}</td>
                    <td className="px-4 py-3 text-gray-600">{row.subject}</td>
                    <td className="px-4 py-3 text-gray-700">{row.theoryMarks}</td>
                    <td className="px-4 py-3 text-gray-700">{row.practicalMarks}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.total}/{row.maxMarks}</td>
                    <td className="px-4 py-3">{row.percentage}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.grade === "A+" ? "bg-green-100 text-green-700" :
                        row.grade === "A" ? "bg-emerald-100 text-emerald-700" :
                        row.grade === "B+" ? "bg-blue-100 text-blue-700" :
                        row.grade === "B" ? "bg-indigo-100 text-indigo-700" :
                        row.grade === "C" ? "bg-amber-100 text-amber-700" :
                        row.grade === "D" ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      }`}>{row.grade}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.result === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>{row.result}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {searched && (
          <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
            <span>Showing {resultRows.length} records</span>
          </div>
        )}
      </div>

      <PrintDocModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Exam Result"
        subtitle={resultRows[0] ? `${resultRows[0].studentName} and ${Math.max(0, new Set(resultRows.map((r) => r.admissionNo)).size - 1)} more · ${info.name}` : info.name}
        html={buildResultHtml()}
      />
    </div>
  )
}
