"use client"

import { useState, useMemo } from "react"
import { Search, Clock } from "lucide-react"
import { useApi } from "@/lib/use-api"

type TimetableEntry = {
  id: number
  day: string
  period: number
  subject: string
  teacher: string
  startTime: string
  endTime: string
}

type StaffLite = { id: number; name: string; surname?: string; role: string; designation?: string; department?: string; department_name?: string }

type TeacherInfo = {
  name: string
  department: string
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const periods = [1, 2, 3, 4, 5, 6, 7, 8]

export default function TeachersTimetablePage() {
  const { data: entries } = useApi<TimetableEntry>("/api/academics/timetable")
  const { data: staffData } = useApi<StaffLite>("/api/human-resource/staff")
  const { data: classesData } = useApi<{ id: number; name: string }>("/api/academics/class")
  const { data: sectionsData } = useApi<{ id: number; name: string; class_id: number }>("/api/academics/section")
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [selectedDay, setSelectedDay] = useState("All")
  const [searched, setSearched] = useState(false)

  const teachers: TeacherInfo[] = useMemo(() => {
    const staff = (staffData || []) as any[]
    // use staff-directory teachers (role === Teacher)
    const teacherStaff = staff.filter((s: any) => String(s.role || "").trim().toLowerCase() === "teacher")
    const staffMap = new Map<string, string>()
    for (const s of teacherStaff) {
      const full = `${s.name || ""}${s.surname ? " " + s.surname : ""}`.trim()
      if (!full) continue
      const dept = s.department || s.department_name || ""
      if (!staffMap.has(full)) staffMap.set(full, dept)
    }
    // include any teacher assigned in class-timetable (so match is guaranteed even if staff name slightly differs)
    for (const e of (entries as any[]) || []) {
      const t = (e.teacher ?? e.teacher_name ?? "").toString().trim()
      if (t && !staffMap.has(t)) staffMap.set(t, "")
    }
    return Array.from(staffMap.entries()).map(([name, department]) => ({ name, department })).sort((a, b) => a.name.localeCompare(b.name))
  }, [staffData, entries])

  const handleSearch = () => {
    if (!selectedTeacher) return
    setSearched(true)
  }

  const selectedTeacherInfo = teachers.find((t) => t.name === selectedTeacher)

  const filteredEntries = useMemo(() => {
    if (!selectedTeacher) return []
    let result = (entries || []).filter((e: any) => {
      const t = (e.teacher ?? e.teacher_name ?? "").toString().trim().toLowerCase()
      const sel = selectedTeacher.trim().toLowerCase()
      return t === sel
    })
    if (selectedDay !== "All") {
      result = result.filter((e) => e.day === selectedDay)
    }
    return result
  }, [selectedTeacher, selectedDay, entries])

  const gridData = useMemo(() => {
    const map: Record<string, Record<number, TimetableEntry>> = {}
    days.forEach((d) => {
      map[d] = {}
      periods.forEach((p) => {
        const entry = filteredEntries.find((e) => e.day === d && e.period === p)
        if (entry) map[d][p] = entry
      })
    })
    return map
  }, [filteredEntries])

  const classMap = useMemo(() => new Map((classesData as any[] || []).map((c: any) => [String(c.id), c.name])), [classesData])
  const sectionMap = useMemo(() => new Map((sectionsData as any[] || []).map((s: any) => [String(s.id), s])), [sectionsData])

  const getClassLabel = (e: any) => {
    const cid = e.classId ?? e.class_id ?? e.classId
    const sid = e.sectionId ?? e.section_id
    const cname = cid ? classMap.get(String(cid)) || `Class ${cid}` : ""
    const sec = sid ? sectionMap.get(String(sid)) : null
    const sname = sec?.name || ""
    if (cname && sname) return `${cname} - ${sname}`
    return cname || sname || "—"
  }

  const getCellContent = (day: string, period: number) => {
    const entry: any = gridData[day]?.[period]
    if (!entry) return null
    const subj = entry.subject ?? entry.subject_name ?? ""
    const teach = entry.teacher ?? entry.teacher_name ?? ""
    const st = entry.startTime ?? entry.start_time ?? ""
    const et = entry.endTime ?? entry.end_time ?? ""
    const clsLabel = getClassLabel(entry)
    return (
      <div className="w-full p-1.5 min-h-[78px] flex flex-col justify-center gap-1">
        <span className="inline-flex text-[10px] font-black tracking-widest uppercase text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full w-fit truncate max-w-full">{clsLabel}</span>
        <span className="inline-flex text-[10px] font-black tracking-widest uppercase text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full w-fit truncate max-w-full">{subj || "—"}</span>
        <span className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full w-fit inline-flex items-center gap-1 truncate max-w-full">{teach || "—"}</span>
        <span className="text-[10px] text-gray-500 inline-flex items-center gap-1"><Clock className="h-3 w-3" />{(st || et) ? `${st} - ${et}` : "—"}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Teachers Timetable</h2>
          <p className="text-sm text-white/70 mt-0.5">Academics / Teachers Timetable</p>
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
              <label className="block text-xs font-medium text-[var(--subtitle-color)]">
                Teacher <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => { setSelectedTeacher(e.target.value); setSearched(false) }}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)]"
              >
                <option value="">Select</option>
                {teachers.map((t) => (
                  <option key={t.name} value={t.name}>{t.department ? `${t.name} (${t.department})` : t.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--subtitle-color)]">Day</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                disabled={!selectedTeacher}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)] disabled:opacity-50"
              >
                <option value="All">All</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1" />
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={!selectedTeacher}
                className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
              >
                <Search className="h-4 w-4" /> Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedTeacherInfo && (
        <>
          <div className="glass-panel">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--title-color)]">
                {selectedTeacherInfo.name}
                {selectedTeacherInfo.department ? <span className="text-xs font-normal text-[var(--subtitle-color)] ml-2">({selectedTeacherInfo.department})</span> : null}
              </h3>
              <span className="text-xs bg-white border px-2.5 py-1 rounded-full font-medium">{filteredEntries.length} periods assigned — matches Class Timetable</span>
            </div>
            <div className="overflow-x-auto p-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-xs font-semibold text-[var(--subtitle-color)] uppercase border border-[var(--border)] bg-gray-50 dark:bg-gray-800/50 w-16">Period</th>
                    {days.map((day) => (
                      <th key={day} className="px-2 py-2 text-xs font-semibold text-[var(--subtitle-color)] uppercase border border-[var(--border)] bg-gray-50 dark:bg-gray-800/50">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period}>
                      <td className="px-2 py-2 text-xs font-semibold text-[var(--title-color)] border border-[var(--border)] bg-gray-50 dark:bg-gray-800/50 text-center">
                        Period {period}
                      </td>
                      {days.map((day) => (
                        <td key={`${day}-${period}`} className="px-1 py-1 border border-[var(--border)] align-top min-w-[120px]">
                          {getCellContent(day, period)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--title-color)]">Timetable Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[var(--border)]">
                    {["#", "Day", "Period", "Class", "Subject", "Teacher", "Time"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No timetable entries found — this teacher has no periods assigned in Class Timetable. Assign via Class Timetable first.</td>
                    </tr>
                  ) : (
                    (() => {
                      const dayOrder: Record<string, number> = {
                        Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
                      }
                      const sorted = [...filteredEntries].sort((a, b) => {
                        const dayDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0)
                        if (dayDiff !== 0) return dayDiff
                        return a.period - b.period
                      })
                      return sorted.map((entry: any, idx) => {
                        const subj = entry.subject ?? entry.subject_name ?? ""
                        const teach = entry.teacher ?? entry.teacher_name ?? ""
                        const st = entry.startTime ?? entry.start_time ?? ""
                        const et = entry.endTime ?? entry.end_time ?? ""
                        return (
                        <tr
                          key={entry.id}
                          className={`border-b border-[var(--border)] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${idx % 2 === 1 ? "bg-gray-50/30 dark:bg-gray-800/10" : ""}`}
                        >
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-[var(--title-color)]">{entry.day}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Period {entry.period}</td>
                          <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">{getClassLabel(entry)}</span></td>
                          <td className="px-4 py-3"><span className="inline-flex text-xs font-black text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">{subj || "—"}</span></td>
                          <td className="px-4 py-3"><span className="inline-flex text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">{teach || "—"}</span></td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400"><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{(st || et) ? `${st} - ${et}` : "—"}</span></td>
                        </tr>
                        )
                      })
                    })()
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--subtitle-color)] bg-gray-50/50">
              <span>Showing {filteredEntries.length} records</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
