"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar, Clock, FileText, Plus, Pencil, Trash2, X, Search, Check, AlertTriangle, Clock3, CheckCircle, XCircle, Hourglass, Plane } from "lucide-react"
import { useApi } from "@/lib/use-api"

type LeaveType = { id: number; name: string; maxDays: number }
type LeaveRow = {
  id: number
  leaveType: string
  leave_type?: string
  fromDate: string
  from_date?: string
  toDate: string
  to_date?: string
  days: number
  reason: string
  status: "Pending" | "Approved" | "Disapproved"
  appliedOn?: string
  appliedAt?: string
  created_at?: string
}

export default function ApplyLeavePage() {
  const { data: leaveTypes } = useApi<LeaveType>("/api/attendance/leave-type")
  const [leaves, setLeaves] = useState<LeaveRow[]>([])
  const [loading, setLoading] = useState(true)
  const [leaveTypeId, setLeaveTypeId] = useState<string>("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [reason, setReason] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState("All")
  const [search, setSearch] = useState("")

  const fetchLeaves = async () => {
    try {
      setLoading(true)
      // my/leave returns {leaves:[]}, attendance/leave returns []
      let res = await fetch("/api/my/leave")
      if (res.ok) {
        const data = await res.json()
        const arr = Array.isArray(data) ? data : data.leaves || []
        // normalize fields
        const norm = arr.map((r: any) => ({
          id: r.id,
          leaveType: r.leaveType || r.leave_type || r.teacherName || "",
          fromDate: r.fromDate || r.from_date || "",
          toDate: r.toDate || r.to_date || "",
          days: r.days,
          reason: r.reason,
          status: r.status,
          appliedOn: r.appliedAt || r.appliedOn || r.created_at || r.createdAt || "",
        }))
        setLeaves(norm)
      } else {
        // fallback to attendance/leave
        const r2 = await fetch("/api/attendance/leave")
        const arr2 = r2.ok ? await r2.json() : []
        setLeaves(Array.isArray(arr2) ? arr2 : [])
      }
    } catch {
      setLeaves([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeaves() }, [])
  useEffect(() => {
    if (leaveTypes.length && !leaveTypeId) setLeaveTypeId(String(leaveTypes[0].id))
  }, [leaveTypes, leaveTypeId])

  const calcDays = (from: string, to: string): number => {
    if (!from || !to) return 0
    const f = new Date(from), t = new Date(to)
    if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime()) || t < f) return 0
    return Math.ceil((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }
  const days = calcDays(fromDate, toDate)

  const filtered = useMemo(() => {
    let arr = leaves
    if (filterStatus !== "All") arr = arr.filter((l) => l.status === filterStatus)
    const q = search.trim().toLowerCase()
    if (q) arr = arr.filter((l) => [l.leaveType, l.reason, l.status, String(l.days)].join(" ").toLowerCase().includes(q))
    return arr
  }, [leaves, filterStatus, search])

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "Pending").length,
    approved: leaves.filter((l) => l.status === "Approved").length,
    disapproved: leaves.filter((l) => l.status === "Disapproved").length,
  }), [leaves])

  const handleApply = async () => {
    setError("")
    if (!leaveTypeId) { setError("Please select leave type"); return }
    if (!fromDate || !toDate) { setError("From and To dates are required"); return }
    if (!reason.trim()) { setError("Reason is required"); return }
    if (days <= 0) { setError("Invalid date range"); return }
    setSaving(true)
    try {
      if (editingId) {
        // update via attendance/leave (admin can edit pending)
        const res = await fetch("/api/attendance/leave", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, leaveTypeId: Number(leaveTypeId), fromDate, toDate, days, reason: reason.trim() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to update")
        setEditingId(null)
      } else {
        const res = await fetch("/api/my/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaveTypeId: Number(leaveTypeId), fromDate, toDate, reason: reason.trim() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || data.message || "Failed to apply")
      }
      setFromDate("")
      setToDate("")
      setReason("")
      await fetchLeaves()
    } catch (e: any) {
      setError(e.message || "Failed")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (l: LeaveRow) => {
    // find leaveTypeId by name
    const lt = leaveTypes.find((t) => t.name === l.leaveType)
    setEditingId(l.id)
    setLeaveTypeId(lt ? String(lt.id) : String(leaveTypes[0]?.id || ""))
    setFromDate(l.fromDate?.slice(0, 10) || "")
    setToDate(l.toDate?.slice(0, 10) || "")
    setReason(l.reason)
    setError("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFromDate("")
    setToDate("")
    setReason("")
    setError("")
    if (leaveTypes[0]) setLeaveTypeId(String(leaveTypes[0].id))
  }

  const handleCancelLeave = async (id: number) => {
    if (!confirm("Cancel this leave application?")) return
    try {
      const res = await fetch(`/api/attendance/leave?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        // try my/leave? but my/leave has no delete, so fallback
        throw new Error("Failed to cancel")
      }
      await fetchLeaves()
      if (editingId === id) handleCancelEdit()
    } catch (e: any) {
      setError(e.message || "Failed to cancel")
    }
  }

  const statusBadge = (s: string) =>
    s === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : s === "Disapproved" ? "bg-red-50 text-red-700 border-red-200"
    : "bg-amber-50 text-amber-700 border-amber-200"

  const statusIcon = (s: string) =>
    s === "Approved" ? <CheckCircle className="h-3.5 w-3.5" />
    : s === "Disapproved" ? <XCircle className="h-3.5 w-3.5" />
    : <Hourglass className="h-3.5 w-3.5" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-[var(--primary)] px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Plane className="h-4 w-4 text-white" /></span>
              Apply Leave
            </h2>
            <p className="text-sm text-white/80 mt-1">Human Resource / Request time off • Choose type, dates & reason</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <Calendar className="h-3.5 w-3.5" /> {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { k: "Total", v: stats.total, grad: "from-slate-50 to-gray-50 border-slate-200 text-slate-700", icon: FileText },
          { k: "Pending", v: stats.pending, grad: "from-amber-50 to-orange-50 border-amber-200 text-amber-700", icon: Hourglass },
          { k: "Approved", v: stats.approved, grad: "from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700", icon: CheckCircle },
          { k: "Disapproved", v: stats.disapproved, grad: "from-red-50 to-rose-50 border-red-200 text-red-700", icon: XCircle },
        ].map(({ k, v, grad, icon: Icon }) => (
          <div key={k} className={`rounded-2xl border bg-gradient-to-br ${grad} p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-current"><Icon className="h-4 w-4" /></span>
              <span className="h-2 w-2 rounded-full bg-current opacity-60" />
            </div>
            <p className="text-2xl font-black mt-2">{v}</p>
            <p className="text-[11px] font-bold tracking-widest uppercase opacity-60">{k}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all ${editingId ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/10" : "border-gray-200"}`}>
        <div className={`px-5 py-3 border-b flex items-center justify-between ${editingId ? "bg-orange-50 border-orange-100" : "bg-gray-50/70 border-gray-100"}`}>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${editingId ? "bg-[var(--primary)] text-white" : "bg-[var(--primary)]/10 text-[var(--primary)]"}`}><Plus className={`h-4 w-4 ${editingId ? "rotate-45" : ""} transition-transform`} /></span>
            {editingId ? "Edit Leave" : "Apply New Leave"}
          </h3>
          {editingId && <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full">Editing #{editingId}</span>}
        </div>
        <div className="p-5">
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600">Leave Type <span className="text-red-500">*</span></label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm">
                  {leaveTypes.length === 0 ? <option>Loading...</option> : leaveTypes.map((t) => <option key={t.id} value={String(t.id)}>{t.name} ({t.maxDays} days)</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600">From Date <span className="text-red-500">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600">To Date <span className="text-red-500">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600">Days</label>
              <div className="relative">
                <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={days || ""} readOnly placeholder="—"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-bold" />
              </div>
              <p className="text-[11px] text-gray-400">Auto-calculated inclusive</p>
            </div>
          </div>
          <div className="mb-4 space-y-1.5">
            <label className="block text-xs font-bold text-gray-600">Reason <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={(e) => { setReason(e.target.value); if (error) setError("") }} rows={3} placeholder="Enter reason for leave… e.g. Medical appointment, family function"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleApply} disabled={saving || !fromDate || !toDate || !reason.trim() || days <= 0}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[#ff8a4a] text-white text-sm font-bold rounded-xl shadow-md shadow-orange-200 hover:opacity-95 disabled:opacity-40 disabled:shadow-none">
              {saving ? <Clock className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {saving ? "Saving..." : editingId ? "Update Leave" : "Apply Leave"}
            </button>
            {editingId && (
              <button onClick={handleCancelEdit}
                className="px-4 py-2.5 text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 rounded-xl">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Clock className="h-4 w-4 text-[var(--primary)]" /> My Leave History</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search type, reason..."
                className="pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-full bg-white focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] w-48" />
              {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"><X className="h-3 w-3 text-gray-400" /></button>}
            </div>
            <div className="flex items-center gap-1 bg-white border rounded-full p-1">
              {["All", "Pending", "Approved", "Disapproved"].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-full ${filterStatus === s ? "bg-[var(--primary)] text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["#", "Leave Type", "From", "To", "Days", "Status", "Applied On", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border"><Search className="h-5 w-5 text-gray-400" /></div>
                  <p className="mt-2 text-sm font-medium text-gray-700">No leave history found</p>
                  <p className="text-xs text-gray-500">Apply your first leave above</p>
                </td></tr>
              ) : (
                filtered.map((l, idx) => (
                  <tr key={l.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border bg-violet-50 text-violet-700 border-violet-200">
                        <FileText className="h-3 w-3" />{l.leaveType || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{l.fromDate ? new Date(l.fromDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{l.toDate ? new Date(l.toDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center h-7 min-w-[28px] px-2 rounded-lg bg-gray-900 text-white text-xs font-bold">{l.days}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${statusBadge(l.status)}`}>
                        {statusIcon(l.status)}{l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{l.appliedOn ? new Date(l.appliedOn).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-4 py-3">
                      {l.status === "Pending" ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(l)} className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100" title="Edit"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleCancelLeave(l.id)} className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100" title="Cancel"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <span className="text-xs text-gray-500">Showing {filtered.length} of {leaves.length} records</span>
          <span className="text-xs text-gray-400 hidden sm:inline">Only pending leaves can be edited or cancelled</span>
        </div>
      </div>
    </div>
  )
}
