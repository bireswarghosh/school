"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Library as LibraryIcon,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  FileSpreadsheet,
  FileDown,
  Printer,
  Columns3,
  BookOpen,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  BookMarked,
  X,
  File,
  SearchCode,
} from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

type BookIssue = {
  id: number; book: string; bookNumber: string; author: string;
  issueDate: string; dueReturnDate: string; returnDate: string; status: string
}

type BookRecord = {
  id: number; bookName: string; bookNumber: string; isbn: string;
  author: string; publisher: string; subject: string; rackNumber: string;
  quantity: number; price: string; postDate: string; description: string;
  pdfFile: string; requestStatus: string; requestId: number
}

const PER_PAGE_OPTIONS = [50, 100, 200, 500, -1]

function fmtDate(d?: string | null) {
  if (!d) return "—"
  try { return new Date(String(d)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) } catch { return String(d) }
}
function fmtPrice(symbol: string, p?: string | null) {
  if (!p) return "—"; return `${symbol}${Number(p).toFixed(2)}`
}

export default function PortalLibrary() {
  const { symbol } = useCurrency()
  const [role, setRole] = useState("")
  const [kids, setKids] = useState<any[]>([])
  const [studentId, setStudentId] = useState("")

  const [activeTab, setActiveTab] = useState<"issued" | "request" | "read">("issued")
  const [issues, setIssues] = useState<BookIssue[]>([])
  const [books, setBooks] = useState<BookRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [savedMsg, setSavedMsg] = useState("")

  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [viewBook, setViewBook] = useState<BookRecord | null>(null)

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setRole(d.user?.role || "")).catch(() => {})
  }, [])

  useEffect(() => {
    if (role !== "parent") return
    fetch("/api/my/parent/kids").then(r => r.json()).then(d => {
      const kl = d.kids || []; setKids(kl)
      const qs = new URLSearchParams(window.location.search).get("studentId")
      setStudentId(qs || (kl[0] ? String(kl[0].id) : ""))
    }).catch(() => {})
  }, [role])

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const [issueRes, bookRes] = await Promise.all([
        role === "parent"
          ? fetch(`/api/my/parent/kids/library?studentId=${encodeURIComponent(studentId)}`)
          : fetch("/api/my/student/library"),
        fetch("/api/my/student/book-requests"),
      ])
      const issueData = await issueRes.json()
      const bookData = await bookRes.json()
      setIssues(issueData.books || [])
      setBooks(bookData.books || [])
    } catch { setError("Failed to load library data") }
    finally { setLoading(false) }
  }, [role, studentId])

  useEffect(() => { if (role) load() }, [role, load])

  const filteredIssues = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return issues
    return issues.filter(b => b.book?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.bookNumber?.toLowerCase().includes(q))
  }, [issues, query])

  const filteredBooks = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return books
    return books.filter(b => b.bookName?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.publisher?.toLowerCase().includes(q) || b.subject?.toLowerCase().includes(q))
  }, [books, query])

  const filteredPdfBooks = useMemo(() => {
    return books.filter(b => b.pdfFile)
  }, [books])

  const filteredPdfSearch = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return filteredPdfBooks
    return filteredPdfBooks.filter(b => b.bookName?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.subject?.toLowerCase().includes(q))
  }, [filteredPdfBooks, query])

  const currentItems = activeTab === "issued" ? filteredIssues : activeTab === "request" ? filteredBooks : filteredPdfSearch
  const effectivePerPage = perPage === -1 ? (currentItems.length || 1) : perPage
  const totalPages = Math.max(1, Math.ceil(currentItems.length / effectivePerPage))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * effectivePerPage
    return currentItems.slice(start, start + effectivePerPage)
  }, [currentItems, safePage, effectivePerPage])

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = []
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
    else {
      pages.push(1)
      if (safePage > 3) pages.push("...")
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i)
      if (safePage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }, [safePage, totalPages])

  const handleTab = (tab: "issued" | "request" | "read") => { setActiveTab(tab); setPage(1); setQuery("") }

  const requestBook = async (bookId: number) => {
    try {
      const res = await fetch("/api/my/student/book-requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      })
      const d = await res.json()
      if (res.ok) { setSavedMsg(d.message || "Request submitted"); setTimeout(() => setSavedMsg(""), 2000); load() }
      else { setError(d.error || "Failed"); setTimeout(() => setError(""), 3000) }
    } catch { setError("Network error"); setTimeout(() => setError(""), 3000) }
  }

  const handleExport = (type: string) => {
    const headers = activeTab === "issued"
      ? ["Book Title", "Book Number", "Author", "Issue Date", "Due Return Date", "Return Date", "Status"]
      : ["Book Title", "Publisher", "Author", "Subject", "Rack Number", "Qty", "Price"]
    const rows = currentItems.map((r: any, i) => activeTab === "issued"
      ? { "#": i + 1, "Book Title": r.book || "", "Book Number": r.bookNumber || "", Author: r.author || "", "Issue Date": fmtDate(r.issueDate), "Due Return Date": fmtDate(r.dueReturnDate), "Return Date": fmtDate(r.returnDate), Status: r.status || "" }
      : { "#": i + 1, "Book Title": r.bookName || "", Publisher: r.publisher || "", Author: r.author || "", Subject: r.subject || "", "Rack Number": r.rackNumber || "", Qty: r.quantity ?? "", Price: fmtPrice(symbol,r.price) }
    )
    if (type === "print") { window.print(); return }
    const csvHeaders = Object.keys(rows[0] || {})
    if (type === "csv" || type === "excel") {
      const csv = [csvHeaders.join(","), ...rows.map(r => csvHeaders.map(h => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n")
      const blob = new Blob([csv], { type: type === "excel" ? "application/vnd.ms-excel" : "text/csv" })
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "Library.csv"; a.click(); URL.revokeObjectURL(url)
    } else if (type === "copy") {
      navigator.clipboard.writeText([csvHeaders.join("\t"), ...rows.map(r => csvHeaders.map(h => r[h as keyof typeof r]).join("\t"))].join("\n"))
    }
  }

  const totalIssued = issues.length
  const currentlyIssued = issues.filter(b => b.status === "Issued").length

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-5 shadow-sm">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white"><LibraryIcon className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-bold text-white">Library</h1>
            <p className="mt-0.5 text-sm text-white/80">Browse, request books and read online</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 w-fit flex-wrap">
        {[
          { key: "issued" as const, icon: BookMarked, label: "Book Issued", count: issues.length },
          { key: "request" as const, icon: Send, label: "Request Book", count: books.length },
          { key: "read" as const, icon: Eye, label: "Read Online", count: filteredPdfBooks.length },
        ].map(t => (
          <button key={t.key} onClick={() => handleTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === t.key ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--subtitle-color)] hover:text-[var(--foreground)]"}`}>
            <t.icon className="h-4 w-4" />{t.label}
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === t.key ? "bg-white/20 text-white" : "bg-[var(--primary-light)] text-[var(--primary)]"}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Parent selector */}
      {role === "parent" && activeTab === "issued" && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--foreground)]">Child</label>
          <select value={studentId} onChange={e => { setStudentId(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]">
            {kids.map(k => <option key={k.id} value={k.id}>{k.name} · {k.class}-{k.section}</option>)}
          </select>
        </div>
      )}

      {/* Summary - Issued tab */}
      {activeTab === "issued" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
          <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
            <div className="flex items-center gap-2 mb-1"><BookOpen className="h-4 w-4" style={{ color: "var(--primary)" }} /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Total</span></div>
            <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{totalIssued}</p>
          </div>
          <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
            <div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-amber-500" /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Issued</span></div>
            <p className="text-xl font-bold text-amber-600">{currentlyIssued}</p>
          </div>
          <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
            <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Returned</span></div>
            <p className="text-xl font-bold text-green-600">{totalIssued - currentlyIssued}</p>
          </div>
        </div>
      )}

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {savedMsg && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{savedMsg}</div>}

      {/* DataTable */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--subtitle-color)]" />
              <input type="search" placeholder="Search..." value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}
                className="pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--subtitle-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-56" />
            </div>
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]">
              {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n === -1 ? "All" : n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            {[{ icon: Copy, label: "Copy", t: "copy" }, { icon: FileSpreadsheet, label: "Excel", t: "excel" }, { icon: FileText, label: "CSV", t: "csv" }, { icon: FileDown, label: "PDF", t: "pdf" }, { icon: Printer, label: "Print", t: "print" }].map(b => (
              <button key={b.t} onClick={() => handleExport(b.t)} title={b.label}
                className="p-2 rounded-lg border border-[var(--border)] text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
                <b.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Book Issued Table */}
        {activeTab === "issued" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-[var(--primary)] text-white">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide w-12">#</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Book Title</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Book Number</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Issue Date</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Due Return Date</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Return Date</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Status</th>
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={9} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" /></td></tr>
                : pageItems.length === 0 ? <tr><td colSpan={9} className="text-center py-12"><div className="flex flex-col items-center gap-3"><LibraryIcon className="h-12 w-12 text-[var(--primary-light)]" /><p className="text-sm text-[var(--subtitle-color)]">No books issued.</p></div></td></tr>
                : pageItems.map((b: any, idx) => (
                  <tr key={b.id ?? idx} className={`border-b border-[var(--border)] hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 1 ? "bg-[var(--background)]" : ""}`}>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{(safePage - 1) * effectivePerPage + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]"><BookOpen className="h-4 w-4" /></span>{b.book}</div></td>
                    <td className="px-4 py-3 text-[var(--foreground)]">{b.bookNumber}</td>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{b.author}</td>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{fmtDate(b.issueDate)}</td>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{fmtDate(b.dueReturnDate)}</td>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{fmtDate(b.returnDate)}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${b.status === "Issued" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{b.status === "Issued" ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Request Book Table */}
        {activeTab === "request" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-[var(--primary)] text-white">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide w-12">#</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Book Title</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Publisher</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Subject</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Qty</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Price</th>
                <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide">Action</th>
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={8} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" /></td></tr>
                : pageItems.length === 0 ? <tr><td colSpan={8} className="text-center py-12"><div className="flex flex-col items-center gap-3"><BookOpen className="h-12 w-12 text-[var(--primary-light)]" /><p className="text-sm text-[var(--subtitle-color)]">{query ? "No matching records." : "No books available."}</p></div></td></tr>
                : pageItems.map((b: any, idx) => (
                  <tr key={b.id ?? idx} className={`border-b border-[var(--border)] hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 1 ? "bg-[var(--background)]" : ""}`}>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{(safePage - 1) * effectivePerPage + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]"><BookOpen className="h-4 w-4" /></span>{b.bookName}</div></td>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{b.publisher || "—"}</td>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{b.author || "—"}</td>
                    <td className="px-4 py-3"><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary)]">{b.subject || "—"}</span></td>
                    <td className="px-4 py-3 text-right font-medium text-[var(--foreground)]">{b.quantity ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-[var(--foreground)]">{fmtPrice(symbol,b.price)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setViewBook(b)} className="p-1.5 rounded-lg text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors" title="View"><FileText className="h-4 w-4" /></button>
                        {b.pdfFile && <a href={b.pdfFile} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Read PDF"><Eye className="h-4 w-4" /></a>}
                        {!b.requestStatus ? (
                          <button onClick={() => requestBook(b.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"><Send className="h-3 w-3" />Request</button>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold ${b.requestStatus === "Accepted" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                            {b.requestStatus === "Accepted" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}{b.requestStatus}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Read Online Table */}
        {activeTab === "read" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-[var(--primary)] text-white">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide w-12">#</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Book Title</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Publisher</th>
                <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide">Action</th>
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" /></td></tr>
                : pageItems.length === 0 ? <tr><td colSpan={6} className="text-center py-12"><div className="flex flex-col items-center gap-3"><Eye className="h-12 w-12 text-[var(--primary-light)]" /><p className="text-sm text-[var(--subtitle-color)]">{query ? "No matching records." : "No PDF books available."}</p></div></td></tr>
                : pageItems.map((b: any, idx) => (
                  <tr key={b.id ?? idx} className={`border-b border-[var(--border)] hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 1 ? "bg-[var(--background)]" : ""}`}>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{(safePage - 1) * effectivePerPage + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><File className="h-4 w-4" /></span>{b.bookName}</div></td>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{b.author || "—"}</td>
                    <td className="px-4 py-3"><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary)]">{b.subject || "—"}</span></td>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{b.publisher || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <a href={b.pdfFile} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
                          <Eye className="h-3.5 w-3.5" />Read
                        </a>
                        <button onClick={() => setViewBook(b)} className="p-1.5 rounded-lg text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors" title="Details">
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--subtitle-color)]">
            Showing {pageItems.length === 0 ? 0 : (safePage - 1) * effectivePerPage + 1} to {Math.min(safePage * effectivePerPage, currentItems.length)} of {currentItems.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"><ChevronLeft className="h-4 w-4" /></button>
            {pageNumbers.map((n, i) => n === "..." ? <span key={`d${i}`} className="px-1 text-[var(--subtitle-color)]">...</span> : (
              <button key={n} onClick={() => setPage(n)} className={`min-w-[32px] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${n === safePage ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] hover:text-[var(--primary)]"}`}>{n}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* Book Detail Modal */}
      {viewBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewBook(null)} />
          <div className="relative bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 border border-[var(--border)]">
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-5">
              <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white"><BookOpen className="h-5 w-5" /></span>
                  <div><h3 className="text-lg font-bold text-white">{viewBook.bookName}</h3><p className="text-xs text-white/70">{viewBook.bookNumber}</p></div>
                </div>
                <button onClick={() => setViewBook(null)} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[{ l: "ISBN", v: viewBook.isbn }, { l: "Author", v: viewBook.author }, { l: "Publisher", v: viewBook.publisher }, { l: "Subject", v: viewBook.subject },
                  { l: "Rack Number", v: viewBook.rackNumber }, { l: "Quantity", v: String(viewBook.quantity ?? "—") }, { l: "Price", v: fmtPrice(symbol,viewBook.price) }, { l: "Post Date", v: fmtDate(viewBook.postDate) }
                ].map(item => (
                  <div key={item.l} className="rounded-xl p-3 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>{item.l}</span>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{item.v || "—"}</p>
                  </div>
                ))}
              </div>
              {viewBook.description && <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Description</span>
                <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{viewBook.description}</p>
              </div>}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
              {viewBook.pdfFile && <a href={viewBook.pdfFile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"><Eye className="h-4 w-4" />Read PDF</a>}
              {!viewBook.requestStatus ? (
                <button onClick={() => { requestBook(viewBook.id); setViewBook(null) }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"><Send className="h-4 w-4" />Request to Issue</button>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold ${viewBook.requestStatus === "Accepted" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {viewBook.requestStatus === "Accepted" ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}{viewBook.requestStatus}
                </span>
              )}
              <button onClick={() => setViewBook(null)} className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--primary-light)] transition-colors" style={{ color: "var(--foreground)" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
