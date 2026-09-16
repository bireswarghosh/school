"use client"

import { useState, useMemo } from "react"
import { Pencil, Trash2, Search, X, Calendar, Clock, Award, Plus, AlertTriangle, Check } from "lucide-react"
import { useApi } from "@/lib/use-api"

type LeaveType = {
  id: number
  name: string
  maxDays: number
  max_days?: number
}

export default function LeaveTypePage() {
  const { data: leaveTypes, add, update, remove, loading } = useApi<LeaveType>("/api/attendance/leave-type")
  const [name, setName] = useState("")
  const [maxDays, setMaxDays] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return leaveTypes
    return leaveTypes.filter((l) => l.name.toLowerCase().includes(q) || String(l.maxDays ?? (l as any).max_days).includes(q))
  }, [leaveTypes, search])

  const stats = useMemo(() => {
    const total = leaveTypes.length
    const sum = leaveTypes.reduce((s, l) => s + Number(l.maxDays ?? (l as any).max_days ?? 0), 0)
    const avg = total ? (sum / total).toFixed(1) : "0"
    const max = total ? Math.max(...leaveTypes.map((l) => Number(l.maxDays ?? (l as any).max_days ?? 0))) : 0
    return { total, sum, avg, max }
  }, [leaveTypes])

  const getDaysBadge = (days: number) => {
    if (days >= 90) return "bg-red-50 text-red-700 border-red-200"
    if (days >= 30) return "bg-amber-50 text-amber-700 border-amber-200"
    if (days >= 15) return "bg-blue-50 text-blue-700 border-blue-200"
    return "bg-emerald-50 text-emerald-700 border-emerald-200"
  }

  const handleSave = async () => {
    setError("")
    if (!name.trim()) { setError("Leave type name is required"); return }
    if (!maxDays.trim()) { setError("Max days is required"); return }
    const days = parseInt(maxDays)
    if (Number.isNaN(days) || days <= 0) { setError("Max days must be a positive number"); return }
    setSaving(true)
    try {
      if (editingId) {
        await update(editingId, { name: name.trim(), maxDays: days })
        setEditingId(null)
      } else {
        await add({ name: name.trim(), maxDays: days })
      }
      setName("")
      setMaxDays("")
    } catch (e: any) {
      setError(e.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (l: LeaveType) => {
    setEditingId(l.id)
    setName(l.name)
    setMaxDays(String(l.maxDays ?? (l as any).max_days ?? ""))
    setError("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancel = () => {
    setEditingId(null)
    setName("")
    setMaxDays("")
    setError("")
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this leave type? This cannot be undone.")) return
    try {
      await remove(id)
      if (editingId === id) handleCancel()
    } catch (e: any) {
      setError(e.message || "Failed to delete")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-[var(--primary)] px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Calendar className="h-4 w-4 text-white" /></span>
              Leave Type
            </h2>
            <p className="text-sm text-white/80 mt-1">Human Resource / Manage leave categories & entitlements</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <Award className="h-3.5 w-3.5" /> {stats.total} types • {stats.sum} days total
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-emerald-600"><Calendar className="h-4 w-4" /></span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{stats.total}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-600/70">Total Types</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-blue-600"><Clock className="h-4 w-4" /></span>
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{stats.sum}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-blue-600/70">Total Days</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-amber-600"><Award className="h-4 w-4" /></span>
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{stats.avg}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-600/70">Avg Days</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-slate-600"><AlertTriangle className="h-4 w-4" /></span>
            <span className="h-2 w-2 rounded-full bg-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-700 mt-2">{stats.max}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Max Allowed</p>
        </div>
      </div>

      {/* Add / Edit Card */}
      <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all ${editingId ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/10" : "border-gray-200"}`}>
        <div className={`px-5 py-3 border-b flex items-center justify-between ${editingId ? "bg-orange-50 border-orange-100" : "bg-gray-50/70 border-gray-100"}`}>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${editingId ? "bg-[var(--primary)] text-white" : "bg-[var(--primary)]/10 text-[var(--primary)]"}`}><Plus className={`h-4 w-4 ${editingId ? "rotate-45" : ""} transition-transform`} /></span>
            {editingId ? "Edit Leave Type" : "Add Leave Type"}
          </h3>
          {editingId && <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full">Editing #{editingId}</span>}
        </div>
        <div className="p-5">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.8fr_auto] gap-4 items-end">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600">Leave Type Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={name} onChange={(e) => { setName(e.target.value); if (error) setError("") }} placeholder="e.g. Casual Leave, Sick Leave, Earned Leave"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600">Max Days <span className="text-red-500">*</span></label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="number" min={1} value={maxDays} onChange={(e) => { setMaxDays(e.target.value); if (error) setError("") }} placeholder="e.g. 12"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSave} disabled={saving || !name.trim() || !maxDays.trim()}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[#ff8a4a] text-white text-sm font-bold rounded-xl shadow-md shadow-orange-200 hover:opacity-95 disabled:opacity-40 disabled:shadow-none h-[42px]">
                {saving ? <Clock className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {saving ? "Saving..." : editingId ? "Update" : "Save"}
              </button>
              {editingId && (
                <button onClick={handleCancel}
                  className="px-4 py-2.5 text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 rounded-xl h-[42px]">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Calendar className="h-4 w-4 text-[var(--primary)]" /> Leave Types List</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leave type..."
                className="pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-full bg-white focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] w-44" />
              {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"><X className="h-3 w-3 text-gray-400" /></button>}
            </div>
            <span className="text-xs font-medium text-gray-500 bg-white border px-2.5 py-1 rounded-full">{filtered.length} / {leaveTypes.length}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["#", "Leave Type", "Max Days", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-sm">Loading leave types...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border"><Search className="h-5 w-5 text-gray-400" /></div>
                  <p className="mt-2 text-sm font-medium text-gray-700">{search ? "No matching leave types" : "No leave types yet"}</p>
                  <p className="text-xs text-gray-500">{search ? `No results for "${search}"` : "Add your first leave type above"}</p>
                </td></tr>
              ) : (
                filtered.map((l, idx) => {
                  const days = Number(l.maxDays ?? (l as any).max_days ?? 0)
                  return (
                    <tr key={l.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="px-4 py-3.5 text-gray-400 text-xs font-medium">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm"><Award className="h-4 w-4" /></span>
                          <span className="font-semibold text-gray-800">{l.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${getDaysBadge(days)}`}>
                          <Clock className="h-3 w-3" /> {days} {days === 1 ? "day" : "days"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(l)} className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100" title="Edit"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(l.id)} className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-500" /> Showing {filtered.length} of {leaveTypes.length} records</span>
          <span className="text-xs text-gray-400 hidden sm:inline">Max days is per-year entitlement</span>
        </div>
      </div>
    </div>
  )
}
