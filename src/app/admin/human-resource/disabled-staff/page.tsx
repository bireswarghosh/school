"use client"

import { useState, useMemo } from "react"
import { Search, X, Ban, ShieldCheck, Building2, Mail, Phone, Briefcase, UserX, Check, AlertTriangle, Calendar, Shield, Clock } from "lucide-react"
import { useApi } from "@/lib/use-api"

type DisabledStaff = {
  id: number
  staffId: string
  staff_id?: string
  name: string
  email: string
  department: string
  disabledDate: string
  disabled_date?: string
  reason: string
}

type Staff = {
  id: number
  staffId: string
  staff_id?: string
  name: string
  surname?: string
  email: string
  phone?: string
  contactNo?: string
  department: string
  designation?: string
  role: string
  status?: string
}

const avatarColors = ["bg-[var(--primary)]", "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-rose-500", "bg-amber-500"]
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "S"

export default function DisabledStaffPage() {
  const { data: disabledList, remove: removeDisabled, refetch: refetchDisabled } = useApi<DisabledStaff>("/api/human-resource/disabled-staff")
  const { data: staffData, refetch: refetchStaff } = useApi<Staff>("/api/human-resource/staff")

  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Staff | null>(null)
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showPopup, setShowPopup] = useState(false)
  const [enablingId, setEnablingId] = useState<number | null>(null)

  const disabledStaffIds = useMemo(() => {
    const s = new Set<string>()
    for (const d of disabledList) {
      const sid = (d.staffId || (d as any).staff_id || "").toString().trim().toLowerCase()
      if (sid) s.add(sid)
      const email = (d.email || "").trim().toLowerCase()
      if (email) s.add(email)
    }
    return s
  }, [disabledList])

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    // exclude already disabled
    const activeStaff = staffData.filter((s) => {
      const sid = (s.staffId || (s as any).staff_id || "").toString().trim().toLowerCase()
      const email = (s.email || "").trim().toLowerCase()
      if (sid && disabledStaffIds.has(sid)) return false
      if (email && disabledStaffIds.has(email)) return false
      if (s.status && String(s.status).toLowerCase() === "disabled") return false
      return true
    })
    return activeStaff.filter((s) => {
      const hay = [
        s.name, (s as any).surname, s.staffId, (s as any).staff_id, s.email, (s as any).phone, (s as any).contactNo, s.department, (s as any).designation, s.role
      ].filter(Boolean).join(" ").toLowerCase()
      return hay.includes(q)
    }).slice(0, 20)
  }, [search, staffData, disabledStaffIds])

  const openDisablePopup = (s: Staff) => {
    setSelected(s)
    setReason("")
    setError("")
    setShowPopup(true)
  }

  const handleDisable = async () => {
    if (!selected) return
    if (!reason.trim() || reason.trim().length < 3) {
      setError("Please enter a reason (at least 3 characters)")
      return
    }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/human-resource/disabled-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: selected.id, reason: reason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to disable staff")
      setShowPopup(false)
      setSelected(null)
      setReason("")
      setSearch("")
      await Promise.all([refetchDisabled(), refetchStaff()])
    } catch (e: any) {
      setError(e.message || "Failed to disable")
    } finally {
      setSaving(false)
    }
  }

  const handleEnable = async (id: number) => {
    if (!confirm("Enable this staff? They will be able to login again.")) return
    setEnablingId(id)
    try {
      await removeDisabled(id)
      await Promise.all([refetchDisabled(), refetchStaff()])
    } catch (e: any) {
      alert(e.message || "Failed to enable")
    } finally {
      setEnablingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-[var(--primary)] px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><UserX className="h-4 w-4 text-white" /></span>
            Disabled Staff
          </h2>
          <p className="text-sm text-white/80 mt-1">Human Resource / Search, disable and enable staff access</p>
        </div>
      </div>

      {/* Search & Disable */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/70 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]"><Search className="h-4 w-4" /></span>
          <h3 className="text-sm font-bold text-gray-800">Search Staff to Disable</h3>
          <span className="ml-auto text-xs text-gray-400 hidden sm:inline">Search by any part of name, staff ID, phone, email, department, role</span>
        </div>
        <div className="p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type anything… e.g. 'Rahul', 'EMP00', '98765', 'Accounts', 'Teacher' — results appear instantly"
              className="w-full pl-10 pr-10 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">Showing staff once search matches • Click Select to disable</p>

          {search.trim() ? (
            <div className="mt-4">
              {filteredStaff.length === 0 ? (
                <div className="py-10 text-center rounded-xl border border-dashed bg-gray-50/50">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border"><AlertTriangle className="h-5 w-5 text-gray-400" /></div>
                  <p className="mt-2 text-sm font-medium text-gray-700">No matching staff found</p>
                  <p className="text-xs text-gray-500">Try another name, ID or number • Already disabled staff are hidden</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  <p className="text-xs font-semibold text-gray-500">{filteredStaff.length} result{filteredStaff.length !== 1 ? "s" : ""} {filteredStaff.length === 20 ? "(showing first 20)" : ""}</p>
                  {filteredStaff.map((s, idx) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-[var(--primary)]/30 hover:bg-orange-50/30 transition-colors">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm shrink-0 ${avatarColors[idx % avatarColors.length]}`}>{initials(s.name)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{s.name} {(s as any).surname || ""}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700 border">{s.staffId || (s as any).staff_id}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600"><Mail className="h-3 w-3 text-gray-400" />{s.email || "—"}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600"><Phone className="h-3 w-3 text-gray-400" />{(s as any).phone || (s as any).contactNo || "—"}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600"><Building2 className="h-3 w-3 text-gray-400" />{s.department || "—"}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600"><Briefcase className="h-3 w-3 text-gray-400" />{s.role}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openDisablePopup(s)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-red-500 text-white shadow-sm hover:bg-red-600"
                      >
                        <Ban className="h-3.5 w-3.5" /> Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed bg-white py-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border"><Search className="h-5 w-5 text-gray-400" /></div>
              <p className="mt-2 text-sm text-gray-600">Start typing to search staff</p>
              <p className="text-xs text-gray-400">Example: “Payel”, “9001”, “736485”, “Library”, “Assistant Teacher”</p>
            </div>
          )}
        </div>
      </div>

      {/* Disabled List */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-red-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Shield className="h-4 w-4 text-red-500" /> Disabled Staff List <span className="ml-1 inline-flex items-center rounded-full bg-red-500 text-white text-[11px] font-bold px-2 py-0.5">{disabledList.length}</span></h3>
          <span className="text-xs text-gray-500 hidden sm:inline">Disabled users cannot login • Enable to restore</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["#", "Staff", "Contact", "Department", "Disabled Date", "Reason", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {disabledList.map((s, idx) => {
                const disabledDate = (s.disabledDate || (s as any).disabled_date || "") as string
                const sid = s.staffId || (s as any).staff_id || ""
                return (
                  <tr key={s.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500 text-white text-xs font-bold">{initials(s.name)}</div>
                        <div>
                          <p className="font-semibold text-gray-800 leading-none">{s.name}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><span className="rounded bg-gray-100 border px-1 py-0.5 text-[10px]">{sid}</span> {s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.email}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs bg-gray-50 border rounded-full px-2.5 py-1"><Building2 className="h-3 w-3 text-gray-400" />{s.department || "—"}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-600 flex items-center gap-1"><Calendar className="h-3 w-3 text-gray-400" />{disabledDate ? new Date(disabledDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-4 py-3 max-w-[260px]"><span className="text-xs text-gray-700 line-clamp-2" title={s.reason}>{s.reason || "—"}</span></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEnable(s.id)}
                        disabled={enablingId === s.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> {enablingId === s.id ? "Enabling..." : "Enable"}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {disabledList.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100"><Check className="h-5 w-5 text-emerald-500" /></div>
                  <p className="mt-2 text-sm font-medium text-gray-700">No disabled staff</p>
                  <p className="text-xs text-gray-500">All staff are active and can login</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Showing {disabledList.length} disabled record{disabledList.length !== 1 ? "s" : ""}</span>
          <span className="text-xs text-gray-400">Disabled users are blocked at login</span>
        </div>
      </div>

      {/* Disable Popup */}
      {showPopup && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
              <div>
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Ban className="h-4 w-4 text-red-500" /> Disable Staff</h3>
                <p className="text-xs text-gray-500 mt-0.5">User will not be able to login after disabling</p>
              </div>
              <button onClick={() => setShowPopup(false)} className="p-1.5 rounded-xl hover:bg-white"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white text-xs font-bold">{initials(selected.name)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{selected.name} {(selected as any).surname || ""}</p>
                  <p className="text-xs text-gray-600 truncate flex flex-wrap gap-2">
                    <span className="rounded bg-white border px-1.5 py-0.5">{selected.staffId || (selected as any).staff_id}</span>
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email || "—"}</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{selected.department || "—"}</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{selected.role}</span>
                  </p>
                </div>
              </div>
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />{error}</div>}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reason for disable <span className="text-red-500">*</span></label>
                <textarea
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); if (error) setError("") }}
                  rows={4}
                  placeholder="Type reason for disabling this staff... e.g. Left organization, On long leave, Policy violation"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300"
                />
                <p className="text-xs text-gray-400 mt-1">{reason.trim().length} characters • Minimum 3 required</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              <button onClick={() => setShowPopup(false)} className="px-4 py-2 text-sm font-medium border border-gray-200 bg-white rounded-xl hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleDisable}
                disabled={saving || reason.trim().length < 3}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl bg-red-500 text-white shadow-md shadow-red-200 hover:bg-red-600 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" /> {saving ? "Disabling..." : "Disable Staff"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
