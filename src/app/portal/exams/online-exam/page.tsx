"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  Loader2,
  Search,
  Copy,
  Printer,
  FileText,
  FileSpreadsheet,
  FileDown,
  Columns3,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CheckCircle2,
  Clock,
  MonitorPlay,
  Calendar,
  Timer,
  BarChart3,
} from "lucide-react"

type Role = "student" | "parent" | "teacher" | "staff" | "admin" | ""

type OnlineExam = {
  id?: number
  name?: string
  duration?: number
  totalQuestions?: number
  attempts?: number
  passPercentage?: number
  description?: string
  published?: boolean
  subject?: string
  examFrom?: string
  examTo?: string
  autoResultPublishDate?: string
  answerWordLimit?: number
  publishExam?: boolean
  publishResult?: boolean
  negativeMarking?: boolean
  displayMarksInExam?: boolean
  randomQuestionOrder?: boolean
  isQuiz?: boolean
}

function useRole() {
  const [role, setRole] = useState<Role>("")
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole((d.user?.role as Role) || ""))
      .catch(() => {})
  }, [])
  return role
}

function todayISO() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

function fmtDate(d?: string | null) {
  if (!d) return "—"
  const date = new Date(String(d))
  if (isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
}

function isUpcoming(exam: OnlineExam) {
  const status = (exam.publishExam || false)
  if (!status) return false
  const today = todayISO()
  if (exam.examFrom && String(exam.examFrom).slice(0, 10) > today) return true
  if (exam.examTo && String(exam.examTo).slice(0, 10) >= today) return true
  return false
}

function statusBadge(exam: OnlineExam) {
  const today = todayISO()
  const from = exam.examFrom ? String(exam.examFrom).slice(0, 10) : ""
  const to = exam.examTo ? String(exam.examTo).slice(0, 10) : ""

  if (exam.publishExam === false) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
        <Clock className="h-3.5 w-3.5" />
        Draft
      </span>
    )
  }
  if (to && to < today) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Closed
      </span>
    )
  }
  if (from && from > today) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        <Clock className="h-3.5 w-3.5" />
        Upcoming
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Active
    </span>
  )
}

export default function PortalOnlineExam() {
  const role = useRole()
  const [kids, setKids] = useState<any[]>([])
  const [studentId, setStudentId] = useState("")
  const [list, setList] = useState<OnlineExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<"upcoming" | "closed">("upcoming")

  // DataTables controls
  const [query, setQuery] = useState("")
  const [perPage, setPerPage] = useState(50)
  const [page, setPage] = useState(1)

  // Detail view modal
  const [viewRecord, setViewRecord] = useState<OnlineExam | null>(null)

  // Column visibility
  const [columns, setColumns] = useState<Record<string, boolean>>({
    name: true, isQuiz: true, examFrom: true, examTo: true,
    duration: true, attempts: true, totalQuestions: true, status: true,
  })
  const [showColMenu, setShowColMenu] = useState(false)
  const colMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (role === "parent") {
      fetch("/api/my/parent/kids")
        .then((r) => r.json())
        .then((d) => {
          const kidsList = d.kids || []
          setKids(kidsList)
          const qs = new URLSearchParams(window.location.search).get("studentId")
          setStudentId(qs || (kidsList[0] ? String(kidsList[0].id) : ""))
        })
        .catch(() => {})
    }
  }, [role])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/online-exam")
      const d = await res.json()
      if (Array.isArray(d)) setList(d)
      else if (d.error) setError(d.error)
      else setList([])
    } catch {
      setError("Failed to load online exams")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (role) load()
  }, [role, load])

  const filtered = useMemo(() => {
    return list.filter((h) => {
      const q = query.trim().toLowerCase()
      if (q) {
        const haystack = [h.name, h.subject, h.description].filter(Boolean).join(" ").toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [list, query])

  const upcomingList = useMemo(() => filtered.filter(isUpcoming), [filtered])
  const closedList = useMemo(() => filtered.filter((h) => !isUpcoming(h)), [filtered])
  const activeList = tab === "upcoming" ? upcomingList : closedList

  const effectivePerPage = perPage === -1 ? activeList.length : perPage
  const totalPages = Math.max(1, Math.ceil(activeList.length / effectivePerPage))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * effectivePerPage
    return activeList.slice(start, start + effectivePerPage)
  }, [activeList, safePage, effectivePerPage])

  // Export helpers
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const rows = activeList.map((h) => ({
      Exam: h.name || "",
      Quiz: h.isQuiz ? "Yes" : "No",
      "Date From": fmtDate(h.examFrom),
      "Date To": fmtDate(h.examTo),
      Duration: h.duration ? `${h.duration} min` : "",
      "Total Attempt": h.attempts ?? "",
      Questions: h.totalQuestions ?? "",
      Status: h.publishExam ? "Published" : "Draft",
    }))
    const headers = Object.keys(rows[0] || {})
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => {
      const s = String(r[h as keyof typeof r] ?? "")
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }).join(","))].join("\n")
    downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), "Online-Exam-List.csv")
  }

  const exportExcel = () => {
    const rows = activeList.map((h) => ({
      Exam: h.name || "",
      Quiz: h.isQuiz ? "Yes" : "No",
      "Date From": fmtDate(h.examFrom),
      "Date To": fmtDate(h.examTo),
      Duration: h.duration ? `${h.duration} min` : "",
      "Total Attempt": h.attempts ?? "",
      Questions: h.totalQuestions ?? "",
      Status: h.publishExam ? "Published" : "Draft",
    }))
    const headers = Object.keys(rows[0] || {})
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Online Exam</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table><thead><tr>${headers.map((h) => `<th style="background:#ff7732;color:#fff">${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td>${String(r[h as keyof typeof r] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`
    downloadBlob(new Blob([html], { type: "application/vnd.ms-excel" }), "Online-Exam-List.xls")
  }

  const exportPDF = () => {
    const win = window.open("", "_blank")
    if (!win) return
    const headers = ["Exam", "Quiz", "Date From", "Date To", "Duration", "Total Attempt", "Questions", "Status"]
    const rows = activeList.map((h) => [h.name || "", h.isQuiz ? "Yes" : "No", fmtDate(h.examFrom), fmtDate(h.examTo), h.duration ? `${h.duration} min` : "", String(h.attempts ?? ""), String(h.totalQuestions ?? ""), h.publishExam ? "Published" : "Draft"])
    win.document.write(`<html><head><title>Online Exam List</title><style>body{font-family:Arial,sans-serif;padding:20px}h2{color:#ff7732}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#ff7732;color:#fff;padding:6px;text-align:left}td{border:1px solid #ddd;padding:6px}tr:nth-child(even){background:#f9f9f9}</style></head><body><h2>Online Exam List</h2><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.onload=function(){window.print()}</script></body></html>`)
    win.document.close()
  }

  const exportCopy = async () => {
    const headers = ["Exam", "Quiz", "Date From", "Date To", "Duration", "Total Attempt", "Questions", "Status"]
    const rows = activeList.map((h) => [h.name || "", h.isQuiz ? "Yes" : "No", fmtDate(h.examFrom), fmtDate(h.examTo), h.duration ? `${h.duration} min` : "", String(h.attempts ?? ""), String(h.totalQuestions ?? ""), h.publishExam ? "Published" : "Draft"].join("\t"))
    try {
      await navigator.clipboard.writeText([headers.join("\t"), ...rows].join("\n"))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setShowColMenu(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const pageNumbers = useMemo(() => {
    const nums: number[] = []
    for (let i = 1; i <= totalPages; i++) nums.push(i)
    if (totalPages > 7) {
      const cur = safePage
      const range: number[] = []
      const push = (n: number) => { if (!range.includes(n) && n >= 1 && n <= totalPages) range.push(n) }
      push(1)
      if (cur > 3) range.push(-1)
      for (let i = Math.max(2, cur - 1); i <= Math.min(totalPages - 1, cur + 1); i++) push(i)
      if (cur < totalPages - 2) range.push(-1)
      push(totalPages)
      return range
    }
    return nums
  }, [totalPages, safePage])

  const visibleColumns = [
    { key: "name", label: "Exam" },
    { key: "isQuiz", label: "Quiz" },
    { key: "examFrom", label: "Date From" },
    { key: "examTo", label: "Date To" },
    { key: "duration", label: "Duration" },
    { key: "attempts", label: "Total Attempt" },
    { key: "totalQuestions", label: "Questions" },
    { key: "status", label: "Status" },
  ]

  const visibleCount = visibleColumns.filter((c) => columns[c.key]).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-6 py-6 shadow-lg">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute top-4 right-24 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
                <MonitorPlay className="h-6 w-6" />
              </span>
              <h2 className="text-2xl font-bold text-white">Online Exam</h2>
            </div>
            <p className="text-sm text-white/80 mt-2">
              {role === "teacher" || role === "staff" || role === "admin"
                ? "Manage online examinations for your classes"
                : role === "parent"
                  ? "Online exams assigned to your children"
                  : "Your online examinations"}
            </p>
          </div>
        </div>
      </div>

      {/* Parent child selector */}
      {role === "parent" && kids.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-[var(--foreground)]">Child</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)] min-w-[200px]"
            >
              {kids.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} · {k.class}-{k.section}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      {/* Main table card */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] px-2 pt-2">
          <button
            onClick={() => { setTab("upcoming"); setPage(1) }}
            className={`inline-flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${
              tab === "upcoming" ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-light)]" : "border-transparent text-[var(--subtitle-color)] hover:text-[var(--foreground)]"
            }`}
          >
            <Clock className="h-4 w-4" />
            Upcoming Exams
            <span className="ml-1 rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-xs text-[var(--primary)]">{upcomingList.length}</span>
          </button>
          <button
            onClick={() => { setTab("closed"); setPage(1) }}
            className={`inline-flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${
              tab === "closed" ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-light)]" : "border-transparent text-[var(--subtitle-color)] hover:text-[var(--foreground)]"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Closed Exam
            <span className="ml-1 rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-xs text-[var(--primary)]">{closedList.length}</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-4 border-b border-[var(--border)] bg-[var(--card)]">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--subtitle-color)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
            >
              {[50, 100, 200, 500, -1].map((n) => (
                <option key={n} value={n}>{n === -1 ? "All" : n}</option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button onClick={exportCopy} title="Copy" className="p-2 rounded-lg border border-[var(--border)] text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
                <Copy className="h-4 w-4" />
              </button>
              <button onClick={exportExcel} title="Excel" className="p-2 rounded-lg border border-[var(--border)] text-[var(--subtitle-color)] hover:text-green-600 hover:border-green-500 transition-colors">
                <FileSpreadsheet className="h-4 w-4" />
              </button>
              <button onClick={exportCSV} title="CSV" className="p-2 rounded-lg border border-[var(--border)] text-[var(--subtitle-color)] hover:text-blue-600 hover:border-blue-500 transition-colors">
                <FileText className="h-4 w-4" />
              </button>
              <button onClick={exportPDF} title="PDF" className="p-2 rounded-lg border border-[var(--border)] text-[var(--subtitle-color)] hover:text-red-600 hover:border-red-500 transition-colors">
                <FileDown className="h-4 w-4" />
              </button>
              <button onClick={() => window.print()} title="Print" className="p-2 rounded-lg border border-[var(--border)] text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
                <Printer className="h-4 w-4" />
              </button>
              <div className="relative" ref={colMenuRef}>
                <button
                  onClick={() => setShowColMenu((v) => !v)}
                  title="Columns"
                  className="p-2 rounded-lg border border-[var(--border)] text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors flex items-center gap-1"
                >
                  <Columns3 className="h-4 w-4" />
                  <span className="text-xs hidden sm:inline">Columns</span>
                </button>
                {showColMenu && (
                  <div className="absolute right-0 top-full mt-2 z-30 w-56 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl p-2">
                    <p className="px-2 py-1 text-xs font-semibold text-[var(--subtitle-color)] uppercase tracking-wide">Toggle Columns</p>
                    {visibleColumns.map((c) => (
                      <label key={c.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--primary-light)] cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={columns[c.key]}
                          onChange={(e) => setColumns((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                          className="rounded border-[var(--border)] accent-[var(--primary)]"
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--primary)] text-white">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">#</th>
                {visibleColumns.map((c) => (
                  columns[c.key] && (
                    <th key={c.key} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                      {c.label}
                    </th>
                  )
                ))}
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleCount + 2} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[var(--primary)]" />
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={visibleCount + 2} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <MonitorPlay className="h-12 w-12 text-[var(--primary-light)]" />
                      <p className="text-sm text-[var(--subtitle-color)]">
                        {query ? "No matching records." : "No data available in table."}
                      </p>
                      <span className="text-xs text-[var(--subtitle-color)]">
                        Add a new record or search with different criteria.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((h, idx) => {
                  const globalIdx = (safePage - 1) * effectivePerPage + idx + 1
                  return (
                    <tr key={h.id ?? globalIdx} className={`border-b border-[var(--border)] hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 1 ? "bg-[var(--background)]" : ""}`}>
                      <td className="px-4 py-3 text-[var(--subtitle-color)]">{globalIdx}</td>
                      {columns.name && (
                        <td className="px-4 py-3 font-medium text-[var(--foreground)] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
                              <MonitorPlay className="h-4 w-4" />
                            </span>
                            <span>{h.name || "—"}</span>
                          </div>
                        </td>
                      )}
                      {columns.isQuiz && (
                        <td className="px-4 py-3">
                          {h.isQuiz ? (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Quiz</span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Exam</span>
                          )}
                        </td>
                      )}
                      {columns.examFrom && <td className="px-4 py-3 text-[var(--foreground)] whitespace-nowrap">{fmtDate(h.examFrom)}</td>}
                      {columns.examTo && <td className="px-4 py-3 text-[var(--foreground)] whitespace-nowrap">{fmtDate(h.examTo)}</td>}
                      {columns.duration && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {h.duration ? (
                            <span className="inline-flex items-center gap-1 text-[var(--foreground)]">
                              <Timer className="h-3.5 w-3.5 text-[var(--subtitle-color)]" />
                              {h.duration} min
                            </span>
                          ) : (
                            <span className="text-[var(--subtitle-color)]">—</span>
                          )}
                        </td>
                      )}
                      {columns.attempts && (
                        <td className="px-4 py-3 text-[var(--foreground)]">
                          {h.attempts ?? <span className="text-[var(--subtitle-color)]">—</span>}
                        </td>
                      )}
                      {columns.totalQuestions && (
                        <td className="px-4 py-3 text-[var(--foreground)]">
                          {h.totalQuestions ?? <span className="text-[var(--subtitle-color)]">—</span>}
                        </td>
                      )}
                      {columns.status && <td className="px-4 py-3 whitespace-nowrap">{statusBadge(h)}</td>}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setViewRecord(h)}
                          title="View"
                          className="p-2 rounded-lg text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[var(--border)] bg-[var(--card)] text-sm text-[var(--subtitle-color)]">
          <span>
            Showing {activeList.length === 0 ? 0 : (safePage - 1) * effectivePerPage + 1} to {Math.min(safePage * effectivePerPage, activeList.length)} of {activeList.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pageNumbers.map((n, i) =>
              n === -1 ? (
                <span key={`e${i}`} className="px-1 text-[var(--subtitle-color)]">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`min-w-[32px] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    n === safePage ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] hover:text-[var(--primary)]"
                  }`}
                >
                  {n}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Detail Modal */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewRecord(null)} />
          <div className="relative bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 border border-[var(--border)]">
            {/* Modal Header with gradient */}
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-6 py-5">
              <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-20 h-20 w-20 rounded-full bg-white/10 blur-xl" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white">
                    <MonitorPlay className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{viewRecord.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-medium text-white/70">#{viewRecord.id}</span>
                      <span className="text-white/40">·</span>
                      {statusBadge(viewRecord)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewRecord(null)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Key info cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: MonitorPlay, label: "Type", value: viewRecord.isQuiz ? "Quiz" : "Exam" },
                  { icon: Timer, label: "Duration", value: viewRecord.duration ? `${viewRecord.duration} min` : "—" },
                  { icon: BarChart3, label: "Questions", value: String(viewRecord.totalQuestions ?? "—") },
                  { icon: CheckCircle2, label: "Pass %", value: `${viewRecord.passPercentage ?? "—"}%` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl p-4 border border-[var(--border)] shadow-[0_0_12px_rgba(255,119,50,0.10),0_0_4px_rgba(255,119,50,0.06)] hover:shadow-[0_0_20px_rgba(255,119,50,0.18),0_0_6px_rgba(255,119,50,0.10)] transition-shadow" style={{ backgroundColor: "var(--background)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                        <item.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>{item.label}</span>
                    </div>
                    <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Date range */}
              <div className="rounded-xl p-4 border border-[var(--border)] shadow-[0_0_12px_rgba(255,119,50,0.10),0_0_4px_rgba(255,119,50,0.06)]" style={{ backgroundColor: "var(--background)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4" style={{ color: "var(--primary)" }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Exam Schedule</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Start Date</span>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--foreground)" }}>{fmtDate(viewRecord.examFrom)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>End Date</span>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--foreground)" }}>{fmtDate(viewRecord.examTo)}</p>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="rounded-xl p-4 border border-[var(--border)] shadow-[0_0_12px_rgba(255,119,50,0.10),0_0_4px_rgba(255,119,50,0.06)]" style={{ backgroundColor: "var(--background)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4" style={{ color: "var(--primary)" }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Exam Settings</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { active: viewRecord.negativeMarking, label: "Negative Marking", activeClass: "bg-red-100 text-red-700" },
                    { active: viewRecord.randomQuestionOrder, label: "Random Order", activeClass: "bg-blue-100 text-blue-700" },
                    { active: viewRecord.publishResult, label: "Auto Publish Result", activeClass: "bg-green-100 text-green-700" },
                    { active: viewRecord.displayMarksInExam, label: "Display Marks", activeClass: "bg-amber-100 text-amber-700" },
                  ].map((s) => (
                    <span key={s.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${s.active ? s.activeClass : "border-[var(--border)]"}`} style={!s.active ? { color: "var(--subtitle-color)", backgroundColor: "var(--card)" } : {}}>
                      {s.active ? "✓ " : "✗ "}{s.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              {viewRecord.description && (
                <div className="rounded-xl p-4 border border-[var(--border)] shadow-[0_0_12px_rgba(255,119,50,0.10),0_0_4px_rgba(255,119,50,0.06)]" style={{ backgroundColor: "var(--background)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4" style={{ color: "var(--primary)" }} />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Description</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {viewRecord.description}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button
                onClick={() => setViewRecord(null)}
                className="px-6 py-2.5 rounded-xl bg-[var(--background)] text-[var(--foreground)] text-sm font-semibold hover:bg-[var(--primary-light)] transition-colors border border-[var(--border)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
