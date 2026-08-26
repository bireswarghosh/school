"use client"

import { useState, useMemo } from "react"
import { Search, Save, Check } from "lucide-react"
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

const roles = ["Teacher", "Driver", "Librarian", "Accountant", "Clerk"]

const statusLabels: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  holiday: "Holiday",
}

const statusColors: Record<AttendanceStatus, string> = {
  present: "bg-green-100 text-green-700 border-green-300",
  late: "bg-yellow-100 text-yellow-700 border-yellow-300",
  absent: "bg-red-100 text-red-700 border-red-300",
  holiday: "bg-blue-100 text-blue-700 border-blue-300",
}

export default function StaffAttendancePage() {
  const { data: staffData } = useApi<Staff>("/api/human-resource/staff")
  const [selectedRole, setSelectedRole] = useState("")
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0])
  const [searched, setSearched] = useState(false)
  const [attendance, setAttendance] = useState<Record<number, AttendanceRecord>>({})
  const [saved, setSaved] = useState(false)

  const filteredStaff = useMemo(() => {
    if (!searched) return []
    return staffData.filter((s) => s.role === selectedRole)
  }, [searched, selectedRole])

  const handleSearch = () => {
    if (!selectedRole) return
    const initial: Record<number, AttendanceRecord> = {}
    staffData
      .filter((s) => s.role === selectedRole)
      .forEach((s) => {
        initial[s.id] = { staffId: s.id, status: "present", inTime: "09:00 AM", outTime: "04:00 PM" }
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

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Staff Attendance</h2>
          <p className="text-sm text-white/70 mt-0.5">Human Resource / Staff Attendance</p>
        </div>
      </div>

      <div className="glass-panel">
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--title-color)] flex items-center gap-2">
            <Search className="h-4 w-4 text-[var(--primary)]" /> Select Criteria
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--subtitle-color)]">Role <span className="text-red-500">*</span></label>
              <select
                value={selectedRole}
                onChange={(e) => { setSelectedRole(e.target.value); setSearched(false) }}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
              >
                <option value="">Select</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--subtitle-color)]">Attendance Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={!selectedRole}
                className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
              >
                <Search className="h-4 w-4" /> Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {searched && (
        <>
          <div className="grid grid-cols-5 gap-4">
            {(["total", "present", "late", "absent", "holiday"] as const).map((key) => (
              <div key={key} className="glass-panel p-4 text-center">
                <p className="text-2xl font-bold text-[var(--title-color)]">{summary[key]}</p>
                <p className="text-xs text-[var(--subtitle-color)] uppercase tracking-wider mt-1">{key}</p>
              </div>
            ))}
          </div>

          <div className="glass-panel">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--title-color)]">Staff Attendance List</h3>
              <div className="flex items-center gap-2 text-xs text-[var(--subtitle-color)]">
                <span>Date: {attendanceDate}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[var(--border)]">
                    {["#", "Staff ID", "Name", "Role", "Department", "Attendance", "In Time", "Out Time"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((staff, idx) => {
                    const record = attendance[staff.id]
                    return (
                      <tr key={staff.id} className={`border-b border-[var(--border)] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${idx % 2 === 1 ? "bg-gray-50/30 dark:bg-gray-800/10" : ""}`}>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{staff.staffId}</td>
                        <td className="px-4 py-3 font-medium text-[var(--title-color)]">{staff.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{staff.role}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{staff.department}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {(Object.entries(statusLabels) as [AttendanceStatus, string][]).map(([key, label]) => (
                              <button
                                key={key}
                                onClick={() => updateAttendance(staff.id, "status", key)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
                                  record?.status === key
                                    ? statusColors[key]
                                    : "border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-300"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={record?.inTime || ""}
                            onChange={(e) => updateAttendance(staff.id, "inTime", e.target.value)}
                            disabled={record?.status === "absent" || record?.status === "holiday"}
                            className="w-20 px-2 py-1 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)] disabled:opacity-50"
                            placeholder="09:00 AM"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={record?.outTime || ""}
                            onChange={(e) => updateAttendance(staff.id, "outTime", e.target.value)}
                            disabled={record?.status === "absent" || record?.status === "holiday"}
                            className="w-20 px-2 py-1 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)] disabled:opacity-50"
                            placeholder="04:00 PM"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-sm text-[var(--subtitle-color)]">Showing {filteredStaff.length} records</span>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
              >
                {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved!" : "Save Attendance"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
