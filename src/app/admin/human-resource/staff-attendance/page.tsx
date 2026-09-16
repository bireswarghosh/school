"use client"

import { useState, useMemo } from "react"
import { Search, Save, Check, Clock, Users, UserCheck, UserX, Timer, CalendarCheck, Building2, Briefcase, AlertCircle, Calendar, CheckCircle2, XCircle, Coffee } from "lucide-react"
import { useApi } from "@/lib/use-api"

type AttendanceStatus = "present" | "late" | "absent" | "holiday"

type Staff = {
  id: number
  staffId: string
  name: string
  role: string
  department: string
}

type AttendanceRecord = {
  staffId: number
  status: AttendanceStatus
  inTime: string
  outTime: string
}

const rolesFallback = ["Teacher", "Driver", "Librarian", "Accountant", "Clerk"]

const statusConfig: Record<AttendanceStatus, { label: string; icon: any; active: string; dot: string }> = {
  present: { label: "Present", icon: CheckCircle2, active: "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200", dot: "bg-emerald-500" },
  late: { label: "Late", icon: Timer, active: "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200", dot: "bg-amber-500" },
  absent: { label: "Absent", icon: XCircle, active: "bg-red-500 text-white border-red-500 shadow-sm shadow-red-200", dot: "bg-red-500" },
  holiday: { label: "Holiday", icon: Coffee, active: "bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-200", dot: "bg-sky-500" },
}

const summaryMeta: Record<string, { label: string; icon: any; grad: string; text: string }> = {
  total: { label: "Total", icon: Users, grad: "from-slate-50 to-slate-100 border-slate-200", text: "text-slate-700" },
  present: { label: "Present", icon: UserCheck, grad: "from-emerald-50 to-teal-50 border-emerald-200", text: "text-emerald-700" },
  late: { label: "Late", icon: Timer, grad: "from-amber-50 to-orange-50 border-amber-200", text: "text-amber-700" },
  absent: { label: "Absent", icon: UserX, grad: "from-red-50 to-rose-50 border-red-200", text: "text-red-700" },
  holiday: { label: "Holiday", icon: CalendarCheck, grad: "from-sky-50 to-blue-50 border-sky-200", text: "text-sky-700" },
}

const avatarColors = ["bg-[var(--primary)]", "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-rose-500", "bg-amber-500"]
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "S"

export default function StaffAttendancePage() {
  const { data: staffData } = useApi<Staff>("/api/human-resource/staff")
  const [selectedRole, setSelectedRole] = useState("")
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0])
  const [searched, setSearched] = useState(false)
  const [attendance, setAttendance] = useState<Record<number, AttendanceRecord>>({})
  const [saved, setSaved] = useState(false)

  const roleOptions = useMemo(() => {
    const fromData = Array.from(new Set(staffData.map((s) => s.role).filter(Boolean))).sort()
    return fromData.length ? fromData : rolesFallback
  }, [staffData])

  const filteredStaff = useMemo(() => {
    if (!searched) return []
    return staffData.filter((s) => s.role === selectedRole)
  }, [searched, selectedRole, staffData])

  const handleSearch = () => {
    if (!selectedRole) return
    const initial: Record<number, AttendanceRecord> = {}
    staffData
      .filter((s) => s.role === selectedRole)
      .forEach((s) => {
        initial[s.id] = { staffId: s.id, status: "present", inTime: "09:00", outTime: "17:00" }
      })
    setAttendance(initial)
    setSearched(true)
    setSaved(false)
  }

  const updateAttendance = (staffId: number, field: keyof AttendanceRecord, value: AttendanceStatus | string) => {
    setAttendance((prev) => ({
      ...prev,
      [staffId]: { ...prev[staffId], [field]: value },
    }))
  }

  const markAll = (status: AttendanceStatus) => {
    setAttendance((prev) => {
      const next: Record<number, AttendanceRecord> = {}
      for (const [id, rec] of Object.entries(prev)) {
        next[Number(id)] = { ...rec, status }
      }
      return next
    })
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const getSummary = () => {
    const records = Object.values(attendance)
    return {
      total: records.length,
      present: records.filter((r) => r.status === "present").length,
      late: records.filter((r) => r.status === "late").length,
      absent: records.filter((r) => r.status === "absent").length,
      holiday: records.filter((r) => r.status === "holiday").length,
    }
  }

  const summary = getSummary()
  const formattedDate = new Date(attendanceDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] via-[#ff7a3a] to-[#ff9a5c] px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><CalendarCheck className="h-4 w-4 text-white" /></span>
              Staff Attendance
            </h2>
            <p className="text-sm text-white/80 mt-1">Human Resource / Daily attendance marking</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <Calendar className="h-3.5 w-3.5" /> {formattedDate}
          </div>
        </div>
      </div>

      {/* Criteria */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/70 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]"><Search className="h-4 w-4" /></span>
          <h3 className="text-sm font-semibold text-gray-800">Select Criteria</h3>
          <span className="ml-auto text-xs text-gray-400 hidden sm:inline">Choose role and date to load staff</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_auto] gap-4 items-end">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">Role <span className="text-red-500">*</span></label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedRole}
                  onChange={(e) => { setSelectedRole(e.target.value); setSearched(false) }}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white text-gray-700 shadow-sm"
                >
                  <option value="">Select role</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">Attendance Date <span className="text-red-500">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white text-gray-700 shadow-sm"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={!selectedRole}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[#ff8a4a] text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-200 hover:opacity-95 transition-all disabled:opacity-40 disabled:shadow-none h-[44px]"
            >
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </div>

      {searched && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {(["total", "present", "late", "absent", "holiday"] as const).map((key) => {
              const meta = summaryMeta[key]
              const Icon = meta.icon
              return (
                <div key={key} className={`rounded-2xl border bg-gradient-to-br ${meta.grad} p-4 shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border ${meta.text} border-current/10`}><Icon className="h-4 w-4" /></span>
                    <span className={`h-2 w-2 rounded-full ${key === "total" ? "bg-slate-400" : statusConfig[key as AttendanceStatus].dot}`} />
                  </div>
                  <p className={`text-2xl font-bold mt-3 ${meta.text}`}>{summary[key]}</p>
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-gray-500 mt-0.5">{meta.label}</p>
                </div>
              )
            })}
          </div>

          {/* Table Card */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Users className="h-4 w-4 text-[var(--primary)]" /> Staff Attendance List</h3>
                <p className="text-xs text-gray-500 mt-0.5">{filteredStaff.length} staff • {selectedRole} • {formattedDate}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 mr-1 hidden sm:inline">Mark all:</span>
                {(Object.keys(statusConfig) as AttendanceStatus[]).map((s) => {
                  const cfg = statusConfig[s]
                  const Icon = cfg.icon
                  return (
                    <button key={s} onClick={() => markAll(s)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-full border bg-white hover:bg-gray-50 text-gray-600 border-gray-200">
                      <Icon className="h-3.5 w-3.5" /> {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {filteredStaff.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100"><AlertCircle className="h-6 w-6 text-gray-400" /></div>
                <p className="mt-3 text-sm font-medium text-gray-700">No staff found</p>
                <p className="text-xs text-gray-500">No staff members with role “{selectedRole}”</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {["#", "Staff", "Department", "Attendance", "In Time", "Out Time"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStaff.map((staff, idx) => {
                      const record = attendance[staff.id]
                      return (
                        <tr key={staff.id} className="hover:bg-orange-50/40 transition-colors">
                          <td className="px-4 py-3.5 text-gray-400 text-xs font-medium">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm ${avatarColors[idx % avatarColors.length]}`}>{initials(staff.name)}</div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 leading-none truncate">{staff.name}</p>
                                <p className="text-xs text-gray-500 truncate mt-1 flex items-center gap-1.5">
                                  <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 border">{staff.staffId}</span>
                                  <span className="truncate">{staff.role}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                              <Building2 className="h-3 w-3 text-gray-400" /> {staff.department || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {(Object.entries(statusConfig) as [AttendanceStatus, typeof statusConfig.present][]).map(([key, cfg]) => {
                                const Icon = cfg.icon
                                const active = record?.status === key
                                return (
                                  <button
                                    key={key}
                                    onClick={() => updateAttendance(staff.id, "status", key)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${active ? cfg.active : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                                  >
                                    <Icon className="h-3.5 w-3.5" /> {cfg.label}
                                  </button>
                                )
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                              <input
                                type="time"
                                value={record?.inTime || ""}
                                onChange={(e) => updateAttendance(staff.id, "inTime", e.target.value)}
                                disabled={record?.status === "absent" || record?.status === "holiday"}
                                className="w-[132px] pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white text-gray-700 disabled:opacity-40 disabled:bg-gray-50"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                              <input
                                type="time"
                                value={record?.outTime || ""}
                                onChange={(e) => updateAttendance(staff.id, "outTime", e.target.value)}
                                disabled={record?.status === "absent" || record?.status === "holiday"}
                                className="w-[132px] pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white text-gray-700 disabled:opacity-40 disabled:bg-gray-50"
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-5 py-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/30">
              <span className="text-xs text-gray-500 flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Showing {filteredStaff.length} records • {summary.present} present • {summary.absent} absent</span>
              <button
                onClick={handleSave}
                className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all ${saved ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-gradient-to-r from-[var(--primary)] to-[#ff8a4a] text-white shadow-orange-200 hover:shadow-lg"}`}
              >
                {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved Successfully!" : "Save Attendance"}
              </button>
            </div>
          </div>
        </>
      )}

      {!searched && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border"><Search className="h-5 w-5 text-gray-400" /></div>
          <p className="mt-3 text-sm font-semibold text-gray-700">Select criteria to view attendance</p>
          <p className="text-xs text-gray-500 mt-1">Choose a role and date, then click Search to load staff</p>
        </div>
      )}
    </div>
  )
}
