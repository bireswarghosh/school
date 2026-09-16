"use client"

import { useState, useMemo } from "react"
import { Search, X, CheckCircle, XCircle, Clock, Users, ShieldCheck, Calendar, FileText, Hourglass, Filter, Eye, Check, Ban } from "lucide-react"
import { useApi } from "@/lib/use-api"

type LeaveRequest = {
  id: number
  name?: string
  staffName?: string
  staff_name?: string
  leaveType: string
  leave_type?: string
  fromDate: string
  from_date?: string
  toDate: string
  to_date?: string
  days: number
  reason: string
  status: "Pending" | "Approved" | "Disapproved"
  role?: string
  createdAt?: string
}

const avatarColors = ["bg-[var(--primary)]", "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-rose-500", "bg-amber-500"]
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "S"

const leaveTypeStyle = (t: string) => {
  const s = String(t || "").toLowerCase()
  if (s.includes("sick") || s.includes("medical")) return "bg-red-50 text-red-700 border-red-200"
  if (s.includes("casual")) return "bg-blue-50 text-blue-700 border-blue-200"
  if (s.includes("earned")) return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (s.includes("maternity") || s.includes("paternity")) return "bg-purple-50 text-purple-700 border-purple-200"
  return "bg-amber-50 text-amber-700 border-amber-200"
}

const statusConfig: Record<string, { cls: string; icon: any }> = {
  Pending: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Hourglass },
  Approved: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  Disapproved: { cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
}

export default function ApproveLeaveRequestPage() {
  const { data: requests, update, loading } = useApi<LeaveRequest>("/api/attendance/leave")
  const [filterStatus, setFilterStatus] = useState("All")
  const [search, setSearch] = useState("")
  const [actingId, setActingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<LeaveRequest | null>(null)

  const normalized = useMemo(() => {
    return requests.map((r: any) => ({
      ...r,
      staffName: r.staffName || r.name || r.staff_name || "—",
      leaveType: r.leaveType || r.leave_type || "—",
      fromDate: r.fromDate || r.from_date || "",
      toDate: r.toDate || r.to_date || "",
    }))
  }, [requests])

  const summary = {
    total: normalized.length,
    pending: normalized.filter((r) => r.status === "Pending").length,
    approved: normalized.filter((r) => r.status === "Approved").length,
    disapproved: normalized.filter((r) => r.status === "Disapproved").length,
  }

  const filtered = useMemo(() => {
    let arr = normalized
    if (filterStatus !== "All") arr = arr.filter((r) => r.status === filterStatus)
    const q = search.trim().toLowerCase()
    if (q) {
      arr = arr.filter((r) => [r.staffName, r.leaveType, r.reason, String(r.days), r.status].join(" ").toLowerCase().includes(q))
    }
    return arr
  }, [normalized, filterStatus, search])

  const handleStatusChange = async (id: number, newStatus: "Approved" | "Disapproved") => {
    setActingId(id)
    try {
      await update(id, { status: newStatus })
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><ShieldCheck className="h-4 w-4 text-white" /></span>
              Approve Leave Request
            </h2>
            <p className="text-sm text-white/80 mt-1">Human Resource / Review and approve staff leave applications</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <Clock className="h-3.5 w-3.5" /> {summary.pending} pending • {summary.total} total
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", count: summary.total, grad: "from-slate-50 to-gray-50 border-slate-200 text-slate-700", icon: Users },
          { label: "Pending", count: summary.pending, grad: "from-amber-50 to-orange-50 border-amber-200 text-amber-700", icon: Hourglass },
          { label: "Approved", count: summary.approved, grad: "from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700", icon: CheckCircle },
          { label: "Disapproved", count: summary.disapproved, grad: "from-red-50 to-rose-50 border-red-200 text-red-700", icon: XCircle },
        ].map(({ label, count, grad, icon: Icon }) => (
          <div key={label} className={`rounded-2xl border bg-gradient-to-br ${grad} p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-current"><Icon className="h-4 w-4" /></span>
              <span className="h-2 w-2 rounded-full bg-current opacity-60" />
            </div>
            <p className="text-2xl font-black mt-2">{count}</p>
            <p className="text-[11px] font-bold tracking-widest uppercase opacity-60">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Filter className="h-4 w-4 text-[var(--primary)]" /> Leave Requests</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff, leave type, reason..." className="pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-full bg-white focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] w-56" />
              {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"><X className="h-3 w-3 text-gray-400" /></button>}
            </div>
            <div className="flex items-center gap-1 bg-white border rounded-full p-1">
              {["All", "Pending", "Approved", "Disapproved"].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${filterStatus === s ? "bg-[var(--primary)] text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["#", "Staff", "Leave Type", "From", "To", "Days", "Reason", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">Loading requests...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border"><Search className="h-5 w-5 text-gray-400" /></div>
                  <p className="mt-2 text-sm font-medium text-gray-700">No leave requests found</p>
                  <p className="text-xs text-gray-500">{search || filterStatus !== "All" ? `No results for "${search || filterStatus}"` : "No requests have been submitted yet"}</p>
                </td></tr>
              ) : (
                filtered.map((r, idx) => {
                  const staffName = (r as any).staffName || (r as any).name || "—"
                  const stIcon = statusConfig[r.status] || statusConfig.Pending
                  const StatusIcon = stIcon.icon
                  return (
                    <tr key={r.id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm ${avatarColors[idx % avatarColors.length]}`}>{initials(staffName)}</span>
                          <div>
                            <p className="font-semibold text-gray-800 leading-none">{staffName}</p>
                            {(r as any).role && <p className="text-xs text-gray-500">{(r as any).role}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${leaveTypeStyle(r.leaveType)}`}>
                          <FileText className="h-3 w-3" />{r.leaveType || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap flex items-center gap-1"><Calendar className="h-3 w-3 text-gray-400" />{r.fromDate ? new Date(r.fromDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.toDate ? new Date(r.toDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center h-7 min-w-[28px] px-2 rounded-lg bg-gray-900 text-white text-xs font-bold">{r.days}</span></td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="text-xs text-gray-600 truncate" title={r.reason}>{r.reason || "—"}</p>
                        <button onClick={() => setSelected(r)} className="text-[11px] text-[var(--primary)] hover:underline inline-flex items-center gap-1 mt-0.5"><Eye className="h-3 w-3" /> view</button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${stIcon.cls}`}>
                          <StatusIcon className="h-3.5 w-3.5" />{r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "Pending" ? (
                          <div className="flex items-center gap-1.5">
                            <button disabled={actingId === r.id} onClick={() => handleStatusChange(r.id, "Approved")} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 shadow-sm">
                              <Check className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button disabled={actingId === r.id} onClick={() => handleStatusChange(r.id, "Disapproved")} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-red-200 text-red-600 bg-white hover:bg-red-50 rounded-full disabled:opacity-50">
                              <Ban className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <span className="text-xs text-gray-500">Showing {filtered.length} of {normalized.length} records</span>
          <span className="text-xs text-gray-400 hidden sm:inline">Pending requests require action</span>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><FileText className="h-4 w-4 text-[var(--primary)]" /> Leave Details</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white font-bold">{initials((selected as any).staffName || (selected as any).name || "")}</span>
                <div>
                  <p className="font-bold text-gray-800">{(selected as any).staffName || (selected as any).name}</p>
                  <p className="text-xs text-gray-500">{(selected as any).role || ""} • {selected.leaveType}</p>
                </div>
                <span className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${statusConfig[selected.status].cls}`}>{selected.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3 border"><p className="text-xs text-gray-500">From</p><p className="font-semibold">{selected.fromDate ? new Date(selected.fromDate).toLocaleDateString("en-IN") : "—"}</p></div>
                <div className="rounded-xl bg-gray-50 p-3 border"><p className="text-xs text-gray-500">To</p><p className="font-semibold">{selected.toDate ? new Date(selected.toDate).toLocaleDateString("en-IN") : "—"}</p></div>
                <div className="rounded-xl bg-gray-900 text-white p-3"><p className="text-xs opacity-70">Days</p><p className="font-bold text-lg">{selected.days}</p></div>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3"><p className="text-xs font-bold text-amber-800">Reason</p><p className="text-sm text-gray-700 mt-1">{selected.reason || "—"}</p></div>
              {selected.status === "Pending" && (
                <div className="flex gap-2">
                  <button onClick={async () => { await handleStatusChange(selected.id, "Approved"); setSelected(null) }} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-1"><Check className="h-4 w-4" /> Approve</button>
                  <button onClick={async () => { await handleStatusChange(selected.id, "Disapproved"); setSelected(null) }} className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-bold flex items-center justify-center gap-1"><Ban className="h-4 w-4" /> Reject</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
