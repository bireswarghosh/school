"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  FileSpreadsheet,
  FileDown,
  Printer,
  Columns3,
  Star,
  MessageSquare,
  Send,
  X,
  Loader2,
} from "lucide-react"

type TeacherRow = {
  teacherName: string
  subject: string
  time: string
  email: string
  phone: string
  myRating: number
  myComment: string
  reviewId: number | null
}

type Columns = {
  teacherName: boolean
  subject: boolean
  time: boolean
  roomNo: boolean
  email: boolean
  phone: boolean
  myRating: boolean
  comment: boolean
}

const ALL_COLUMNS: { key: keyof Columns; label: string }[] = [
  { key: "teacherName", label: "Teacher Name" },
  { key: "subject", label: "Subject" },
  { key: "time", label: "Time" },
  { key: "roomNo", label: "Room No." },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "myRating", label: "My Rating" },
  { key: "comment", label: "Comment" },
]

const DEFAULT_COLUMNS: Columns = {
  teacherName: true,
  subject: true,
  time: true,
  roomNo: true,
  email: true,
  phone: true,
  myRating: true,
  comment: true,
}

const PER_PAGE_OPTIONS = [50, 100, 200, 500, -1]

export default function TeacherReviewsPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [columns, setColumns] = useState<Columns>(DEFAULT_COLUMNS)
  const [showColMenu, setShowColMenu] = useState(false)

  const [rateModal, setRateModal] = useState<TeacherRow | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/my/student/teacher-reviews")
      const d = await res.json()
      setTeachers(d.teachers || [])
    } catch {
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return teachers
    return teachers.filter(
      (t) =>
        t.teacherName?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.phone?.toLowerCase().includes(q)
    )
  }, [teachers, query])

  const effectivePerPage = perPage === -1 ? filtered.length || 1 : perPage
  const totalPages = Math.max(1, Math.ceil(filtered.length / effectivePerPage))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * effectivePerPage
    return filtered.slice(start, start + effectivePerPage)
  }, [filtered, safePage, effectivePerPage])

  const visibleCount = Object.values(columns).filter(Boolean).length

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (safePage > 3) pages.push("...")
      const start = Math.max(2, safePage - 1)
      const end = Math.min(totalPages - 1, safePage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (safePage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }, [safePage, totalPages])

  const openRate = (t: TeacherRow) => {
    setRateModal(t)
    setRating(t.myRating || 0)
    setHoverRating(0)
    setComment(t.myComment || "")
  }

  const submitRating = async () => {
    if (!rateModal || rating < 1) return
    setSaving(true)
    try {
      const res = await fetch("/api/my/student/teacher-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherName: rateModal.teacherName,
          subject: rateModal.subject,
          rating,
          comments: comment,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        setSavedMsg(d.message || "Review submitted")
        setTimeout(() => setSavedMsg(""), 2000)
        setRateModal(null)
        load()
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleExport = (type: string) => {
    const headers = ["Teacher Name", "Subject", "Time", "Room No.", "Email", "Phone", "My Rating", "Comment"]
    const rows = filtered.map((t, i) => ({
      "#": i + 1,
      "Teacher Name": t.teacherName || "",
      Subject: t.subject || "",
      Time: t.time || "",
      "Room No.": `Room ${(i % 9) + 1}`,
      Email: t.email || "",
      Phone: t.phone || "",
      "My Rating": t.myRating || 0,
      Comment: t.myComment || "",
    }))

    if (type === "print") { window.print(); return }

    const csvHeaders = Object.keys(rows[0] || {})
    if (type === "csv" || type === "excel") {
      const csv = [csvHeaders.join(","), ...rows.map((r) => csvHeaders.map((h) => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n")
      const blob = new Blob([csv], { type: type === "excel" ? "application/vnd.ms-excel" : "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = "Teacher-Reviews.csv"; a.click()
      URL.revokeObjectURL(url)
    } else if (type === "copy") {
      const text = [csvHeaders.join("\t"), ...rows.map((r) => csvHeaders.map((h) => r[h as keyof typeof r]).join("\t"))].join("\n")
      navigator.clipboard.writeText(text)
    }
  }

  const StarRating = ({ value, onChange, onHover, readonly = false }: { value: number; onChange?: (v: number) => void; onHover?: (v: number) => void; readonly?: boolean }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readonly && onHover?.(s)}
          onMouseLeave={() => !readonly && onHover?.(0)}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <Star
            className={`h-5 w-5 ${s <= (readonly ? value : (onHover ? value : value)) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-5 shadow-sm">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
            <Star className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">Teachers Reviews</h1>
            <p className="mt-0.5 text-sm text-white/80">Rate and review your teachers</p>
          </div>
        </div>
      </div>

      {/* Success message */}
      {savedMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {savedMsg}
        </div>
      )}

      {/* DataTable */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--subtitle-color)]" />
              <input
                type="search"
                placeholder="Search..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                className="pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--subtitle-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-56"
              />
            </div>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n === -1 ? "All" : n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { icon: Copy, label: "Copy", type: "copy" },
              { icon: FileSpreadsheet, label: "Excel", type: "excel" },
              { icon: FileText, label: "CSV", type: "csv" },
              { icon: FileDown, label: "PDF", type: "pdf" },
              { icon: Printer, label: "Print", type: "print" },
            ].map((btn) => (
              <button
                key={btn.type}
                onClick={() => handleExport(btn.type)}
                title={btn.label}
                className="p-2 rounded-lg border border-[var(--border)] text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
              >
                <btn.icon className="h-4 w-4" />
              </button>
            ))}
            <div className="relative">
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
                  {ALL_COLUMNS.map((c) => (
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--primary)] text-white">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide w-12">#</th>
                {columns.teacherName && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Teacher Name</th>}
                {columns.subject && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Subject</th>}
                {columns.time && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Time</th>}
                {columns.roomNo && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Room No.</th>}
                {columns.email && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Email</th>}
                {columns.phone && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Phone</th>}
                {columns.myRating && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">My Rating</th>}
                {columns.comment && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Comment</th>}
                <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide">Rate</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleCount + 2} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
                      <span className="text-sm text-[var(--subtitle-color)]">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={visibleCount + 2} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Star className="h-12 w-12 text-[var(--primary-light)]" />
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
                pageItems.map((t, idx) => {
                  const globalIdx = (safePage - 1) * effectivePerPage + idx + 1
                  const roomNo = `Room ${(idx % 9) + 1}`
                  return (
                    <tr key={t.teacherName ?? idx} className={`border-b border-[var(--border)] hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 1 ? "bg-[var(--background)]" : ""}`}>
                      <td className="px-4 py-3 text-[var(--subtitle-color)]">{globalIdx}</td>
                      {columns.teacherName && (
                        <td className="px-4 py-3 font-medium text-[var(--foreground)] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold">
                              {t.teacherName?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </span>
                            <span>{t.teacherName || "—"}</span>
                          </div>
                        </td>
                      )}
                      {columns.subject && (
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary)]">
                            {t.subject || "—"}
                          </span>
                        </td>
                      )}
                      {columns.time && (
                        <td className="px-4 py-3 text-[var(--subtitle-color)]">{t.time || "—"}</td>
                      )}
                      {columns.roomNo && (
                        <td className="px-4 py-3 text-[var(--subtitle-color)]">{roomNo}</td>
                      )}
                      {columns.email && (
                        <td className="px-4 py-3 text-[var(--subtitle-color)]">{t.email || "—"}</td>
                      )}
                      {columns.phone && (
                        <td className="px-4 py-3 text-[var(--subtitle-color)]">{t.phone || "—"}</td>
                      )}
                      {columns.myRating && (
                        <td className="px-4 py-3">
                          {t.myRating > 0 ? (
                            <StarRating value={t.myRating} readonly />
                          ) : (
                            <span className="text-xs text-[var(--subtitle-color)]">Not rated</span>
                          )}
                        </td>
                      )}
                      {columns.comment && (
                        <td className="px-4 py-3 text-[var(--subtitle-color)] max-w-[200px] truncate">
                          {t.myComment || "—"}
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openRate(t)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            t.myRating > 0
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-[var(--primary)] text-white hover:opacity-90"
                          }`}
                        >
                          <Star className="h-3.5 w-3.5" />
                          {t.myRating > 0 ? "Edit" : "Rate"}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--subtitle-color)]">
            Showing {pageItems.length === 0 ? 0 : (safePage - 1) * effectivePerPage + 1} to {Math.min(safePage * effectivePerPage, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pageNumbers.map((n, i) =>
              n === "..." ? (
                <span key={`dots-${i}`} className="px-1 text-[var(--subtitle-color)]">...</span>
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
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Rate Modal */}
      {rateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRateModal(null)} />
          <div className="relative bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-md z-10 border border-[var(--border)]">
            {/* Header */}
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-5">
              <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                    <Star className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">Rate Teacher</h3>
                    <p className="text-xs text-white/70">{rateModal.teacherName}</p>
                  </div>
                </div>
                <button onClick={() => setRateModal(null)} className="text-white/70 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Teacher Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)] text-sm font-bold">
                  {rateModal.teacherName?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{rateModal.teacherName}</p>
                  <p className="text-xs" style={{ color: "var(--subtitle-color)" }}>{rateModal.subject}</p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="text-center space-y-2">
                <label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Your Rating</label>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          s <= (hoverRating || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--subtitle-color)]">
                  {rating === 0 && "Click to rate"}
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Comment (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your review..."
                  rows={3}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--subtitle-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button
                onClick={() => setRateModal(null)}
                className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--primary-light)] transition-colors"
                style={{ color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                disabled={saving || rating < 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {rateModal.myRating > 0 ? "Update Review" : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
