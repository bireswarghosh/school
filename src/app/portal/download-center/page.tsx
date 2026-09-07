"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  FileSpreadsheet,
  FileDown,
  Printer,
  Columns3,
  Play,
  Film,
  ExternalLink,
  Eye,
  X,
  CheckCircle2,
} from "lucide-react"
import { useApi } from "@/lib/use-api"

type ContentItem = {
  id: number
  title: string
  contentType: string
  className: string
  section: string
  subject: string
  uploadDate: string
  file: string
  description: string
  sharedBy: string
}

type VideoTutorial = {
  id: number
  title: string
  videoUrl: string
  className: string
  subject: string
  description: string
  sharedBy: string
  shareDate: string
}

type Columns = {
  title: boolean
  shareDate: boolean
  validUpto: boolean
  sharedBy: boolean
}

const ALL_COLUMNS: { key: keyof Columns; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "shareDate", label: "Share Date" },
  { key: "validUpto", label: "Valid Upto" },
  { key: "sharedBy", label: "Shared By" },
]

const DEFAULT_COLUMNS: Columns = {
  title: true,
  shareDate: true,
  validUpto: true,
  sharedBy: true,
}

const PER_PAGE_OPTIONS = [50, 100, 200, 500, -1]

export default function DownloadCenterPage() {
  const { data: contentItems, loading: contentLoading } = useApi<ContentItem>("/api/download-center/content")
  const { data: videoTutorials, loading: videoLoading } = useApi<VideoTutorial>("/api/download-center/video")

  const [activeTab, setActiveTab] = useState<"content" | "video">("content")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [columns, setColumns] = useState<Columns>(DEFAULT_COLUMNS)
  const [showColMenu, setShowColMenu] = useState(false)
  const [viewItem, setViewItem] = useState<ContentItem | VideoTutorial | null>(null)
  const [studentProfile, setStudentProfile] = useState<{ className?: string; sectionName?: string; classId?: number; sectionId?: number } | null>(null)

  useEffect(() => {
    fetch("/api/my/student/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.className) setStudentProfile({ className: d.className, sectionName: d.sectionName, classId: d.classId, sectionId: d.sectionId })
      })
      .catch(() => {})
  }, [])

  const filteredContent = useMemo(() => {
    if (!contentItems) return []
    const q = query.toLowerCase()
    return contentItems.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.contentType?.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q) ||
        c.sharedBy?.toLowerCase().includes(q) ||
        c.className?.toLowerCase().includes(q)
    )
  }, [contentItems, query])

  const filteredVideos = useMemo(() => {
    if (!videoTutorials) return []
    const q = query.toLowerCase()
    return videoTutorials.filter(
      (v) =>
        v.title?.toLowerCase().includes(q) ||
        v.subject?.toLowerCase().includes(q) ||
        v.sharedBy?.toLowerCase().includes(q) ||
        v.className?.toLowerCase().includes(q)
    )
  }, [videoTutorials, query])

  const effectivePerPage = perPage === -1 ? (activeTab === "content" ? filteredContent.length : filteredVideos.length) || 1 : perPage

  const contentTotalPages = Math.max(1, Math.ceil(filteredContent.length / effectivePerPage))
  const videoTotalPages = Math.max(1, Math.ceil(filteredVideos.length / effectivePerPage))

  const safePage = activeTab === "content" ? Math.min(page, contentTotalPages) : Math.min(page, videoTotalPages)
  const contentPageItems = filteredContent.slice((safePage - 1) * effectivePerPage, safePage * effectivePerPage)
  const videoPageItems = filteredVideos.slice((safePage - 1) * effectivePerPage, safePage * effectivePerPage)

  const visibleCount = Object.values(columns).filter(Boolean).length
  const currentTotal = activeTab === "content" ? filteredContent.length : filteredVideos.length
  const currentTotalPages = activeTab === "content" ? contentTotalPages : videoTotalPages
  const currentItems = activeTab === "content" ? contentPageItems : videoPageItems
  const loading = activeTab === "content" ? contentLoading : videoLoading

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = []
    if (currentTotalPages <= 7) {
      for (let i = 1; i <= currentTotalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (safePage > 3) pages.push("...")
      const start = Math.max(2, safePage - 1)
      const end = Math.min(currentTotalPages - 1, safePage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (safePage < currentTotalPages - 2) pages.push("...")
      pages.push(currentTotalPages)
    }
    return pages
  }, [safePage, currentTotalPages])

  const handleTab = (tab: "content" | "video") => {
    setActiveTab(tab)
    setPage(1)
    setQuery("")
  }

  const handleExport = (type: string) => {
    const rows = activeTab === "content"
      ? filteredContent.map((c, i) => ({
          "#": i + 1,
          Title: c.title || "",
          "Share Date": c.uploadDate || "",
          "Valid Upto": "",
          "Shared By": c.sharedBy || "",
        }))
      : filteredVideos.map((v, i) => ({
          "#": i + 1,
          Title: v.title || "",
          "Share Date": v.shareDate || "",
          Subject: v.subject || "",
          "Shared By": v.sharedBy || "",
        }))

    if (type === "print") {
      window.print()
      return
    }

    const headers = Object.keys(rows[0] || {})
    if (type === "csv" || type === "excel") {
      const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n")
      const blob = new Blob([csv], { type: type === "excel" ? "application/vnd.ms-excel" : "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${activeTab === "content" ? "content-list" : "video-tutorials"}.${type === "excel" ? "xls" : "csv"}`
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "pdf") {
      alert("PDF export coming soon")
    } else if (type === "copy") {
      const text = [headers.join("\t"), ...rows.map((r) => headers.map((h) => r[h as keyof typeof r]).join("\t"))].join("\n")
      navigator.clipboard.writeText(text)
    }
  }

  const fmtDate = (d?: string) => {
    if (!d) return "—"
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    } catch {
      return d
    }
  }

  const extractVideoId = (url?: string): string | null => {
    if (!url) return null
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/)
    if (ytMatch) return ytMatch[1]
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) return vimeoMatch[1]
    return null
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-5 shadow-sm">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
            <Download className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">Download Center</h1>
            <p className="mt-0.5 text-sm text-white/80">Access shared content and video tutorials</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 w-fit">
        <button
          onClick={() => handleTab("content")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "content"
              ? "bg-[var(--primary)] text-white shadow-md"
              : "text-[var(--subtitle-color)] hover:text-[var(--foreground)]"
          }`}
        >
          <FileText className="h-4 w-4" />
          Content List
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "content" ? "bg-white/20 text-white" : "bg-[var(--primary-light)] text-[var(--primary)]"}`}>
            {filteredContent.length}
          </span>
        </button>
        <button
          onClick={() => handleTab("video")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "video"
              ? "bg-[var(--primary)] text-white shadow-md"
              : "text-[var(--subtitle-color)] hover:text-[var(--foreground)]"
          }`}
        >
          <Film className="h-4 w-4" />
          Video Tutorial List
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "video" ? "bg-white/20 text-white" : "bg-[var(--primary-light)] text-[var(--primary)]"}`}>
            {filteredVideos.length}
          </span>
        </button>
      </div>

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
              {showColMenu && activeTab === "content" && (
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

        {/* Content List Table */}
        {activeTab === "content" && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--primary)] text-white">
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide w-12">#</th>
                    {columns.title && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Title</th>}
                    {columns.shareDate && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Share Date</th>}
                    {columns.validUpto && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Valid Upto</th>}
                    {columns.sharedBy && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Shared By</th>}
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={visibleCount + 2} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
                          <span className="text-sm text-[var(--subtitle-color)]">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : contentPageItems.length === 0 ? (
                    <tr>
                      <td colSpan={visibleCount + 2} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Download className="h-12 w-12 text-[var(--primary-light)]" />
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
                    contentPageItems.map((item, idx) => {
                      const globalIdx = (safePage - 1) * effectivePerPage + idx + 1
                      return (
                        <tr key={item.id ?? globalIdx} className={`border-b border-[var(--border)] hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 1 ? "bg-[var(--background)]" : ""}`}>
                          <td className="px-4 py-3 text-[var(--subtitle-color)]">{globalIdx}</td>
                          {columns.title && (
                            <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
                                  <FileText className="h-4 w-4" />
                                </span>
                                <span>{item.title || "—"}</span>
                              </div>
                            </td>
                          )}
                          {columns.shareDate && (
                            <td className="px-4 py-3 text-[var(--subtitle-color)]">{fmtDate(item.uploadDate)}</td>
                          )}
                          {columns.validUpto && (
                            <td className="px-4 py-3 text-[var(--subtitle-color)]">—</td>
                          )}
                          {columns.sharedBy && (
                            <td className="px-4 py-3 text-[var(--subtitle-color)]">{item.sharedBy || "—"}</td>
                          )}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setViewItem(item)}
                                title="View"
                                className="p-1.5 rounded-lg text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {item.file && (
                                <a
                                  href={item.file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Download"
                                  className="p-1.5 rounded-lg text-[var(--subtitle-color)] hover:text-green-600 hover:bg-green-50 transition-colors"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              )}
                            </div>
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
                Showing {contentPageItems.length === 0 ? 0 : (safePage - 1) * effectivePerPage + 1} to {Math.min(safePage * effectivePerPage, filteredContent.length)} of {filteredContent.length} entries
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
                <button onClick={() => setPage((p) => Math.min(contentTotalPages, p + 1))} disabled={safePage === contentTotalPages} className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Video Tutorial List */}
        {activeTab === "video" && (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
                <span className="text-sm text-[var(--subtitle-color)]">Loading...</span>
              </div>
            ) : videoPageItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Film className="h-12 w-12 text-[var(--primary-light)]" />
                <p className="text-sm text-[var(--subtitle-color)]">
                  {query ? "No matching records." : "No Record Found"}
                </p>
              </div>
            ) : (
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videoPageItems.map((video) => {
                    const videoId = extractVideoId(video.videoUrl)
                    return (
                      <div key={video.id} className="group rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden hover:shadow-lg transition-all hover:border-[var(--primary)]">
                        <div className="relative aspect-video bg-gray-900">
                          {videoId ? (
                            <img
                              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : video.videoUrl ? (
                            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
                              <Play className="h-12 w-12 text-white/60" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
                              <Film className="h-12 w-12 text-white/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            {video.videoUrl && (
                              <a
                                href={video.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg hover:scale-110 transition-transform"
                              >
                                <Play className="h-5 w-5 ml-0.5" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          <h3 className="font-semibold text-sm text-[var(--foreground)] line-clamp-2 leading-snug">{video.title || "Untitled"}</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {video.subject && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--primary-light)] text-[var(--primary)]">
                                {video.subject}
                              </span>
                            )}
                            {video.className && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                Class {video.className}
                              </span>
                            )}
                          </div>
                          {video.sharedBy && (
                            <p className="text-[11px] text-[var(--subtitle-color)]">By {video.sharedBy}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Video Pagination */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-[var(--border)]">
                  <span className="text-xs text-[var(--subtitle-color)]">
                    Showing {videoPageItems.length === 0 ? 0 : (safePage - 1) * effectivePerPage + 1} to {Math.min(safePage * effectivePerPage, filteredVideos.length)} of {filteredVideos.length} entries
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
                    <button onClick={() => setPage((p) => Math.min(videoTotalPages, p + 1))} disabled={safePage === videoTotalPages} className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* GK Quiz Questions Modal */}
      {viewItem && "file" in viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewItem(null)} />
          <div className="relative bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 border border-[var(--border)]">
            {/* Header */}
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-5">
              <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-20 h-20 w-20 rounded-full bg-white/10 blur-xl" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">GK Quiz Questions</h3>
                    <p className="text-xs text-white/70">Content shared by teacher</p>
                  </div>
                </div>
                <button onClick={() => setViewItem(null)} className="text-white/70 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Student Info (auto-filled from logged-in student) */}
              <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Student Info (Auto-filled)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Class</span>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>
                      {studentProfile?.className ? `Class ${studentProfile.className}` : (viewItem as ContentItem).className || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Section</span>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>
                      {studentProfile?.sectionName || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Info (from teacher) */}
              <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Content Detail (From Teacher)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Title</span>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{viewItem.title || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Content Type</span>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{(viewItem as ContentItem).contentType || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Subject</span>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{(viewItem as ContentItem).subject || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Shared By</span>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{(viewItem as ContentItem).sharedBy || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Upload Date</span>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{fmtDate((viewItem as ContentItem).uploadDate)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Class</span>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{(viewItem as ContentItem).className || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {(viewItem as ContentItem).description && (
                <div className="rounded-xl p-4 border border-[var(--border)]" style={{ backgroundColor: "var(--background)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--subtitle-color)" }}>Description</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {(viewItem as ContentItem).description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
              {(viewItem as ContentItem).file && (
                <a
                  href={(viewItem as ContentItem).file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <Download className="h-4 w-4" /> Download File
                </a>
              )}
              <button
                onClick={() => setViewItem(null)}
                className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--primary-light)] transition-colors"
                style={{ color: "var(--foreground)" }}
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
