"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import {
  BookOpen,
  Loader2,
  Search,
  Copy,
  Printer,
  FileText,
  FileSpreadsheet,
  FileDown,
  Columns3,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CheckCircle2,
  Clock,
  ArrowLeft,
  CalendarRange,
} from "lucide-react"

type Role = "student" | "parent" | "teacher" | "staff" | "admin" | ""

type HomeworkItem = {
  id?: number
  subjectId?: number | null
  subject?: string | null
  classId?: number
  sectionId?: number
  className?: string
  sectionName?: string
  homeworkDate?: string
  submissionDate?: string | null
  evaluationDate?: string | null
  maxMarks?: number | null
  marksObtained?: number | null
  note?: string | null
  status?: string
  description?: string
  document?: string | null
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

const SUBJECT_OPTIONS = ["", "Math", "Mathematics", "Science", "English", "Hindi", "Social Studies", "Computer", "Physics", "Chemistry", "Biology"]

function fmtDate(d?: string | null) {
  if (!d) return "—"
  const date = new Date(String(d))
  if (isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
}

function statusBadge(status?: string) {
  const s = (status || "Assigned").toLowerCase()
  if (["closed", "completed", "evaluated", "submitted"].includes(s)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {status || "Closed"}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
      <Clock className="h-3.5 w-3.5" />
      {status || "Assigned"}
    </span>
  )
}

function filterCardInputs() {
  return "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
}

export default function PortalDailyAssignment() {
  const role = useRole()
  const [kids, setKids] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [studentId, setStudentId] = useState("")
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [subject, setSubject] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const [list, setList] = useState<HomeworkItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // DataTables controls
  const [query, setQuery] = useState("")
  const [perPage, setPerPage] = useState(50)
  const [page, setPage] = useState(1)

  // Add Daily Assignment form
  const [form, setForm] = useState({ subjectName: "", homeworkDate: "", submissionDate: "", description: "" })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState("")

  // Detail view modal
  const [viewRecord, setViewRecord] = useState<HomeworkItem | null>(null)

  // Column visibility toggle
  const [columns, setColumns] = useState<Record<string, boolean>>({
    className: true, sectionName: true, subject: true, homeworkDate: true,
    submissionDate: true, description: true, status: true,
  })
  const [showColMenu, setShowColMenu] = useState(false)
  const colMenuRef = useRef<HTMLDivElement>(null)

  const canAdd = role === "teacher" || role === "staff" || role === "admin"

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
    if (canAdd) {
      fetch("/api/my/teacher/classes")
        .then((r) => r.json())
        .then((d) => {
          const classesList = d.classes || []
          setClasses(classesList)
          const qs = new URLSearchParams(window.location.search)
          const qClass = qs.get("classId")
          const qSection = qs.get("sectionId")
          if (qClass && qSection) {
            setClassId(qClass)
            setSectionId(qSection)
          } else if (classesList[0]) {
            setClassId(String(classesList[0].classId))
            setSectionId(String(classesList[0].sectionId))
          }
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    let url = ""
    if (role === "student") url = `/api/my/student/homework${subject ? `?subjectId=${encodeURIComponent(subject)}` : ""}`
    if (role === "parent") {
      if (!studentId) return
      url = `/api/my/parent/kids/homework?studentId=${encodeURIComponent(studentId)}`
    }
    if (canAdd) {
      if (!classId || !sectionId) return
      url = `/api/my/teacher/homework?classId=${classId}&sectionId=${sectionId}`
    }
    if (!url) return
    try {
      const res = await fetch(url)
      const d = await res.json()
      if (d.error) setError(d.error)
      else setList(d.homework || [])
    } catch {
      setError("Failed to load assignments")
    } finally {
      setLoading(false)
    }
  }, [role, subject, studentId, classId, sectionId, canAdd])

  useEffect(() => {
    if (role) load()
  }, [role, load])

  const filtered = useMemo(() => {
    return list.filter((h) => {
      const q = query.trim().toLowerCase()
      if (q) {
        const haystack = [h.subject, h.description, h.note, h.className, h.sectionName, String(h.status || "")]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (subject && role === "student") {
        const sub = String(h.subject || "").toLowerCase()
        if (sub !== subject.toLowerCase() && String(h.subjectId || "") !== subject) return false
      }
      if (fromDate && h.homeworkDate && String(h.homeworkDate) < fromDate) return false
      if (toDate && h.homeworkDate && String(h.homeworkDate) > toDate) return false
      return true
    })
  }, [list, query, subject, role, fromDate, toDate])

  // Sort newest first
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => String(b.homeworkDate || "").localeCompare(String(a.homeworkDate || "")))
  }, [filtered])

  const effectivePerPage = perPage === -1 ? sorted.length : perPage
  const totalPages = Math.max(1, Math.ceil(sorted.length / effectivePerPage))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * effectivePerPage
    return sorted.slice(start, start + effectivePerPage)
  }, [sorted, safePage, effectivePerPage])

  // Export helpers
  const rowsForExport = useMemo(() => {
    type ExportRow = Record<string, string | number>
    return sorted.map((h): ExportRow => ({
      Class: h.className || "",
      Section: h.sectionName || "",
      Subject: h.subject || "General",
      "Homework Date": fmtDate(h.homeworkDate),
      "Submission Date": fmtDate(h.submissionDate),
      Homework: h.description || "",
      Status: h.status || "Assigned",
    }))
  }, [sorted])

  const escapeCsv = (v: string | number) => {
    const s = String(v ?? "")
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

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
    const headers = Object.keys(rowsForExport[0] || {})
    const csv = [headers.join(","), ...rowsForExport.map((r) => headers.map((h) => escapeCsv(r[h])).join(","))].join("\n")
    downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), "Daily-Assignment.csv")
  }

  const exportExcel = () => {
    const headers = Object.keys(rowsForExport[0] || {})
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Daily Assignment</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table><thead><tr>${headers.map((h) => `<th style="background:#ff7732;color:#fff">${h}</th>`).join("")}</tr></thead><tbody>${rowsForExport.map((r) => `<tr>${headers.map((h) => `<td>${String(r[h] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`
    downloadBlob(new Blob([html], { type: "application/vnd.ms-excel" }), "Daily-Assignment.xls")
  }

  const exportPDF = () => {
    const win = window.open("", "_blank")
    if (!win) return
    const headers = Object.keys(rowsForExport[0] || {})
    win.document.write(`<html><head><title>Daily Assignment List</title><style>body{font-family:Arial,sans-serif;padding:20px}h2{color:#ff7732}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#ff7732;color:#fff;padding:6px;text-align:left}td{border:1px solid #ddd;padding:6px}tr:nth-child(even){background:#f9f9f9}</style></head><body><h2>Daily Assignment List</h2><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rowsForExport.map((r) => `<tr>${headers.map((h) => `<td>${String(r[h] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.onload=function(){window.print()}</script></body></html>`)
    win.document.close()
  }

  const exportCopy = async () => {
    const headers = Object.keys(rowsForExport[0] || {})
    const lines = [headers.join("\t"), ...rowsForExport.map((r) => headers.map((h) => String(r[h] ?? "")).join("\t"))]
    try {
      await navigator.clipboard.writeText(lines.join("\n"))
      setSaved("Copied to clipboard")
      setTimeout(() => setSaved(""), 2000)
    } catch {
      setSaved("Copy not supported")
    }
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setShowColMenu(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const addAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved("")
    try {
      const res = await fetch("/api/my/teacher/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: Number(classId),
          sectionId: Number(sectionId),
          subjectName: form.subjectName || null,
          homeworkDate: form.homeworkDate || new Date().toISOString().slice(0, 10),
          submissionDate: form.submissionDate || null,
          description: form.description,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error || "Failed to add daily assignment")
      } else {
        setSaved("Daily assignment added")
        setForm({ subjectName: "", homeworkDate: "", submissionDate: "", description: "" })
        load()
      }
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

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
    { key: "className", label: "Class" },
    { key: "sectionName", label: "Section" },
    { key: "subject", label: "Subject" },
    { key: "homeworkDate", label: "Homework Date" },
    { key: "submissionDate", label: "Submission Date" },
    { key: "description", label: "Homework" },
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
                <BookOpen className="h-6 w-6" />
              </span>
              <h2 className="text-2xl font-bold text-white">Daily Assignment</h2>
            </div>
            <p className="text-sm text-white/80 mt-2">
              {canAdd ? "Create and manage daily homework assignments" : "View daily homework assignments for your class"}
            </p>
          </div>
          <Link
            href="/portal/homework"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--primary)] shadow hover:shadow-lg transition-shadow"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Homework
          </Link>
        </div>
      </div>

      {/* Role filters */}
      <div className="glass-panel rounded-xl p-4">
        {role === "parent" && (
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-[var(--foreground)]">Child</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={filterCardInputs() + " min-w-[210px]"}
            >
              {kids.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} · {k.class}-{k.section}
                </option>
              ))}
            </select>
          </div>
        )}

        {canAdd && (
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-[var(--foreground)]">Class</label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                const c = classes.find((x) => String(x.classId) === e.target.value)
                setSectionId(c ? String(c.sectionId) : "")
              }}
              className={filterCardInputs()}
            >
              {classes.map((c) => (
                <option key={`${c.classId}-${c.sectionId}`} value={c.classId}>
                  {c.className}-{c.sectionName}
                </option>
              ))}
            </select>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className={filterCardInputs()}
            >
              {classes
                .filter((c) => String(c.classId) === classId)
                .map((c) => (
                  <option key={c.sectionId} value={c.sectionId}>
                    {c.sectionName}
                  </option>
                ))}
            </select>
          </div>
        )}

        {role === "student" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--subtitle-color)]">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={filterCardInputs() + " min-w-[200px]"}
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>{s || "All Subjects"}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium text-[var(--foreground)]">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={filterCardInputs()}
          />
          <label className="text-sm font-medium text-[var(--foreground)]">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={filterCardInputs()}
          />
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}
      {saved && <div className="rounded-xl bg-green-50 dark:bg-green-950/40 px-4 py-3 text-sm text-green-600">{saved}</div>}

      {/* Add Daily Assignment form (teacher/staff/admin) */}
      {canAdd && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
            <Plus className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--title-color)]">Add Daily Assignment</h3>
          </div>
          <form onSubmit={addAssignment} className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Subject</label>
                <input
                  type="text"
                  value={form.subjectName}
                  onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                  placeholder="e.g. Mathematics"
                  className={filterCardInputs()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Homework Date</label>
                <input
                  type="date"
                  value={form.homeworkDate}
                  onChange={(e) => setForm({ ...form, homeworkDate: e.target.value })}
                  className={filterCardInputs()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Submission Date</label>
                <input
                  type="date"
                  value={form.submissionDate}
                  onChange={(e) => setForm({ ...form, submissionDate: e.target.value })}
                  className={filterCardInputs()}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Plus className="h-4 w-4" />
                  Save
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Homework Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter homework details..."
                required
                rows={3}
                className={filterCardInputs()}
              />
            </div>
          </form>
        </div>
      )}

      {/* Daily Assignment list */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* Table header with search + export toolbar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-4 border-b border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--title-color)]">
              Daily Assignments
              <span className="ml-2 text-xs font-normal text-[var(--subtitle-color)]">({fromDate || "All"} → {toDate || "All"})</span>
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--subtitle-color)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
              >
                {[50, 100, 200, 500, -1].map((n) => (
                  <option key={n} value={n}>{n === -1 ? "All" : n}</option>
                ))}
              </select>
            </div>

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
                      <BookOpen className="h-12 w-12 text-[var(--primary-light)]" />
                      <p className="text-sm text-[var(--subtitle-color)]">
                        {query || fromDate || toDate ? "No matching records." : "No data available in table."}
                      </p>
                      {canAdd ? (
                        <span className="text-xs text-[var(--subtitle-color)]">Add a new record or search with different criteria.</span>
                      ) : (
                        <span className="text-xs text-[var(--subtitle-color)]">No assignments yet. Please check back later.</span>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((h, idx) => {
                  const globalIdx = (safePage - 1) * effectivePerPage + idx + 1
                  return (
                    <tr key={h.id ?? globalIdx} className={`border-b border-[var(--border)] hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 1 ? "bg-[var(--background)]" : ""}`}>
                      <td className="px-4 py-3 text-[var(--subtitle-color)]">{globalIdx}</td>
                      {columns.className && <td className="px-4 py-3 font-medium text-[var(--foreground)] whitespace-nowrap">{h.className || "—"}</td>}
                      {columns.sectionName && <td className="px-4 py-3 text-[var(--foreground)] whitespace-nowrap">{h.sectionName || "—"}</td>}
                      {columns.subject && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary)]">
                            {h.subject || "General"}
                          </span>
                        </td>
                      )}
                      {columns.homeworkDate && <td className="px-4 py-3 text-[var(--foreground)] whitespace-nowrap">{fmtDate(h.homeworkDate)}</td>}
                      {columns.submissionDate && <td className="px-4 py-3 text-[var(--foreground)] whitespace-nowrap">{fmtDate(h.submissionDate)}</td>}
                      {columns.description && <td className="px-4 py-3 text-[var(--foreground)] max-w-[260px] truncate">{h.description || "—"}</td>}
                      {columns.status && <td className="px-4 py-3 whitespace-nowrap">{statusBadge(h.status)}</td>}
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
            Showing {sorted.length === 0 ? 0 : (safePage - 1) * effectivePerPage + 1} to {Math.min(safePage * effectivePerPage, sorted.length)} of {sorted.length} entries
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--title-color)]">Assignment Details</h3>
                  <p className="text-xs text-[var(--subtitle-color)]">#{viewRecord.id}</p>
                </div>
              </div>
              <button onClick={() => setViewRecord(null)} className="text-[var(--subtitle-color)] hover:text-[var(--foreground)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-[var(--primary-light)] text-[var(--primary)]">
                  {viewRecord.subject || "General"}
                </span>
                {statusBadge(viewRecord.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[var(--background)] rounded-xl p-3">
                  <label className="text-xs font-medium text-[var(--subtitle-color)]">Class</label>
                  <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{viewRecord.className || "—"}</p>
                </div>
                <div className="bg-[var(--background)] rounded-xl p-3">
                  <label className="text-xs font-medium text-[var(--subtitle-color)]">Section</label>
                  <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{viewRecord.sectionName || "—"}</p>
                </div>
                <div className="bg-[var(--background)] rounded-xl p-3">
                  <label className="text-xs font-medium text-[var(--subtitle-color)]">Homework Date</label>
                  <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{fmtDate(viewRecord.homeworkDate)}</p>
                </div>
                <div className="bg-[var(--background)] rounded-xl p-3">
                  <label className="text-xs font-medium text-[var(--subtitle-color)]">Submission Date</label>
                  <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{fmtDate(viewRecord.submissionDate)}</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-medium text-[var(--subtitle-color)] mb-1">Homework</label>
                <div className="bg-[var(--background)] rounded-xl p-4 text-sm text-[var(--foreground)] whitespace-pre-wrap">
                  {viewRecord.description || "No description provided."}
                </div>
              </div>

              {viewRecord.document && (
                <div className="mt-4">
                  <label className="block text-xs font-medium text-[var(--subtitle-color)] mb-1">Document</label>
                  <div className="flex items-center gap-2 bg-[var(--background)] rounded-xl p-3 text-sm">
                    <FileText className="h-4 w-4 text-[var(--primary)]" />
                    <span className="text-[var(--foreground)]">{viewRecord.document}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
              <button onClick={() => setViewRecord(null)} className="px-6 py-2 rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--primary-light)] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}