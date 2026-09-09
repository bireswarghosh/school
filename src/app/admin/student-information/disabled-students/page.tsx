"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useMemo, useEffect } from "react"
import { Search, Users, UserCheck, X } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type DisabledStudent = {
  id: number
  admissionNo: string
  firstName: string
  lastName: string
  class: string
  section: string
  fatherName: string
  gender: string
  mobile: string
  note: string
  status: string
}

type DisableReason = { id: number; name: string }

const genderBadgeClass = (gender: string) => {
  switch (gender) {
    case "Male": return "bg-blue-100 text-blue-800"
    case "Female": return "bg-pink-100 text-pink-800"
    default: return "bg-gray-100 text-gray-600"
  }
}

const avatarColors = ["bg-blue-500", "bg-pink-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-teal-500"]

const initials = (first: string, last: string) => (first.charAt(0) + last.charAt(0)).toUpperCase()

export default function DisabledStudentsPage() {
  const { classNames, sectionNames } = useClassesAndSections()
  const classOptions = ["Select", ...classNames]
  const sectionOptions = ["Select", ...sectionNames]
  const { data: students, update, loading } = useApi<DisabledStudent>("/api/student-information/student")

  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [topKeyword, setTopKeyword] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [focusId, setFocusId] = useState<number | null>(null)
  const [enablingId, setEnablingId] = useState<number | null>(null)
  const [disableReasons, setDisableReasons] = useState<DisableReason[]>([])
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disableTarget, setDisableTarget] = useState<DisabledStudent | null>(null)
  const [disableReasonId, setDisableReasonId] = useState("")
  const [disabling, setDisabling] = useState(false)

  useEffect(() => {
    fetch("/api/student-information/disable-reason")
      .then((r) => r.json())
      .then((data) => setDisableReasons(Array.isArray(data) ? data : []))
      .catch(() => setDisableReasons([]))
  }, [])

  const disabledStudents = useMemo(() => {
    return students.filter((s) => s.status === "Disabled")
  }, [students])

  const searchMatches = useMemo(() => {
    const q = topKeyword.toLowerCase().trim()
    if (!q) return []
    return students.filter((s) => {
      const haystack = [
        s.firstName, s.lastName, s.admissionNo, s.class, s.section,
        s.fatherName, s.gender, s.mobile,
      ].join(" ").toLowerCase()
      return haystack.includes(q)
    })
  }, [students, topKeyword])

  const searchResults = useMemo(() => searchMatches.slice(0, 10), [searchMatches])

  const filtered = useMemo(() => {
    return disabledStudents.filter((s) => {
      if (filterClass && s.class !== filterClass) return false
      if (filterSection && s.section !== filterSection) return false
      return true
    })
  }, [disabledStudents, filterClass, filterSection])

  const selectFromSearch = (student: DisabledStudent) => {
    setSearchOpen(false)
    setTopKeyword("")
    setFilterClass("")
    setFilterSection("")
    setFocusId(student.id)
    setTimeout(() => setFocusId(null), 2500)
  }

  const handleDisable = (student: DisabledStudent) => {
    setDisableTarget(student)
    setDisableReasonId("")
    setShowDisableModal(true)
  }

  const confirmDisable = async () => {
    if (!disableTarget || !disableReasonId) {
      notify.error("Please select a disable reason")
      return
    }
    setDisabling(true)
    try {
      const reason = disableReasons.find((r) => r.id === Number(disableReasonId))?.name || "—"
      const today = new Date().toISOString().slice(0, 10)
      await update(disableTarget.id, {
        id: disableTarget.id,
        status: "Disabled",
        note: `Disabled: ${reason} on ${today}`,
      })
      notify.success(`${disableTarget.firstName} ${disableTarget.lastName} has been disabled`)
      setShowDisableModal(false)
      setDisableTarget(null)
      setSearchOpen(false)
      setTopKeyword("")
    } catch (e: any) {
      notify.error(e.message)
    } finally {
      setDisabling(false)
    }
  }

  const handleEnable = async (student: DisabledStudent) => {
    setEnablingId(student.id)
    try {
      await update(student.id, { id: student.id, status: "Active" })
      notify.success(`${student.firstName} ${student.lastName} has been enabled`)
    } catch (e: any) {
      notify.error(e.message)
    } finally {
      setEnablingId(null)
    }
  }

  const extractDisableInfo = (note: string | null) => {
    if (!note) return "-"
    const match = note.match(/^Disabled:\s*(.+?)\s*on\s+(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]
    if (note.startsWith("Disabled:")) return note.replace("Disabled:", "").trim()
    return note.length > 50 ? note.substring(0, 50) + "..." : note
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Disabled Students</h2>
            <p className="text-sm text-[var(--primary)]/80 mt-0.5">Student Information / Disabled Students</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="p-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                {classOptions.map((opt) => (
                  <option key={opt} value={opt === "Select" ? "" : opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                {sectionOptions.map((opt) => (
                  <option key={opt} value={opt === "Select" ? "" : opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">Find Student</label>
              <div className="relative">
                <input
                  type="text"
                  value={topKeyword}
                  onChange={(e) => {
                    setTopKeyword(e.target.value)
                    setSearchOpen(true)
                  }}
                  onFocus={() => { if (searchResults.length > 0) setSearchOpen(true) }}
                  placeholder="Search all students by name, admission no, class..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
                {searchOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSearchOpen(false)} />
                    <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                      {topKeyword.trim().length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">Type to search students</div>
                      ) : searchResults.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">No matching students</div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto">
                          {searchResults.map((r) => (
                            <div
                              key={r.id}
                              className="px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                    {r.firstName} {r.lastName}
                                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                      r.status === "Disabled"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-green-100 text-green-700"
                                    }`}>
                                      {r.status === "Disabled" ? "Disabled" : "Active"}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {r.admissionNo || "—"} · Class {r.class || "-"}{r.section ? ` - ${r.section}` : ""}
                                  </div>
                                </div>
                                {r.status === "Disabled" ? (
                                  <button
                                    onClick={() => selectFromSearch(r)}
                                    className="flex-shrink-0 text-xs font-medium text-[var(--primary)] hover:underline"
                                  >
                                    View
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleDisable(r)}
                                    disabled={enablingId === r.id}
                                    className="flex-shrink-0 px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {enablingId === r.id ? "Disabling..." : "Disable"}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                        {searchResults.length} match{searchResults.length === 1 ? "" : "es"} · Disable an active student or click View for a disabled one
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => { setFilterClass(""); setFilterSection(""); setTopKeyword(""); setSearchOpen(false) }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Admission No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Section</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Father Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Disable Reason</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Gender</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Mobile</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">No disabled students found</td>
                </tr>
              ) : (
                filtered.map((student, idx) => (
                  <tr key={student.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""} ${focusId === student.id ? "bg-[var(--primary-light)] ring-2 ring-[var(--primary)]" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{student.admissionNo}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white font-bold text-xs`}>
                          {initials(student.firstName, student.lastName)}
                        </div>
                        <span className="text-gray-800 font-medium">{student.firstName} {student.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{student.class}</td>
                    <td className="px-4 py-3 text-gray-600">{student.section}</td>
                    <td className="px-4 py-3 text-gray-600">{student.fatherName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {extractDisableInfo(student.note)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${genderBadgeClass(student.gender)}`}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{student.mobile}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEnable(student)}
                        disabled={enablingId === student.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        {enablingId === student.id ? "Enabling..." : "Enable Student"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} of {disabledStudents.length} disabled students</span>
        </div>
      </div>

      {showDisableModal && disableTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { if (!disabling) setShowDisableModal(false) }} />
          <div className="relative bg-[var(--card)] text-[var(--foreground)] rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold text-[var(--foreground)]">Disable Student</h3>
              <button onClick={() => { if (!disabling) setShowDisableModal(false) }} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full ${avatarColors[0]} flex items-center justify-center text-white font-bold text-sm`}>
                  {initials(disableTarget.firstName, disableTarget.lastName)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{disableTarget.firstName} {disableTarget.lastName}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {disableTarget.admissionNo} · Class {disableTarget.class} - {disableTarget.section}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Disable Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={disableReasonId}
                  onChange={(e) => setDisableReasonId(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
                >
                  <option value="" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">Select reason</option>
                  {disableReasons.map((r) => (
                    <option key={r.id} value={r.id} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">{r.name}</option>
                  ))}
                </select>
                {disableReasons.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No disable reasons found. Add them in Student Information / Disable Reason.</p>
                )}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button
                onClick={() => setShowDisableModal(false)}
                disabled={disabling}
                className="px-4 py-2 text-sm text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisable}
                disabled={disabling}
                className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {disabling ? "Disabling..." : "Disable Student"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
