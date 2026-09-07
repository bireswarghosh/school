"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, CheckCircle2, XCircle, Clock, Loader2, BookOpen } from "lucide-react"

type BookRequest = {
  id: number; studentId: number; bookId: number; status: string;
  requestDate: string; responseDate: string;
  studentName: string; admissionNo: string; className: string; sectionName: string; studentEmail: string;
  bookName: string; bookNumber: string; author: string; subject: string;
}

export default function BookRequestsPage() {
  const [requests, setRequests] = useState<BookRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("Pending")
  const [query, setQuery] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/library/book-requests${filter ? `?status=${filter}` : ""}`)
      const d = await res.json()
      setRequests(d.requests || [])
    } catch { setRequests([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return requests
    return requests.filter(r => r.studentName?.toLowerCase().includes(q) || r.bookName?.toLowerCase().includes(q) || r.admissionNo?.toLowerCase().includes(q))
  }, [requests, query])

  const handleAction = async (id: number, status: "Accepted" | "Rejected") => {
    try {
      const res = await fetch("/api/library/book-requests", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      const d = await res.json()
      if (res.ok) load()
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white"><BookOpen className="h-5 w-5" /></span>
          <div><h1 className="text-xl font-bold text-white">Book Requests</h1><p className="mt-0.5 text-sm text-white/80">Manage student book issue requests</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {["Pending", "Accepted", "Rejected", "All"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f ? "bg-[var(--primary)] text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="search" placeholder="Search student or book..." value={query} onChange={e => setQuery(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[var(--primary)] w-64" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[var(--primary)] text-white">
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">#</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Student</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Class</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Book</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Author</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Request Date</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-xs uppercase">Action</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" /></td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="text-center py-12"><p className="text-sm text-gray-500">No requests found.</p></td></tr>
              : filtered.map((r, idx) => (
                <tr key={r.id} className={`border-b border-gray-100 hover:bg-orange-50/50 transition-colors ${idx % 2 === 1 ? "bg-gray-50" : ""}`}>
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div><p className="font-medium text-gray-900">{r.studentName}</p><p className="text-xs text-gray-500">{r.admissionNo}</p></div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.className}-{r.sectionName}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.bookName}</td>
                  <td className="px-4 py-3 text-gray-600">{r.author || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{r.requestDate ? new Date(r.requestDate).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      r.status === "Accepted" ? "bg-green-100 text-green-700" : r.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {r.status === "Accepted" ? <CheckCircle2 className="h-3 w-3" /> : r.status === "Rejected" ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.status === "Pending" ? (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleAction(r.id, "Accepted")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors">
                          <CheckCircle2 className="h-3.5 w-3.5" />Accept
                        </button>
                        <button onClick={() => handleAction(r.id, "Rejected")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors">
                          <XCircle className="h-3.5 w-3.5" />Reject
                        </button>
                      </div>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
