"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
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

type TeacherInfo = {
  name: string
  department: string
}

const teachers: TeacherInfo[] = [
  { name: "Ms. Sunita Sharma", department: "Science" },
  { name: "Mr. Rajesh Verma", department: "Math" },
  { name: "Mr. Amit Kumar", department: "Computer" },
  { name: "Ms. Pooja Singh", department: "English" },
  { name: "Mr. Vikram Joshi", department: "Social Studies" },
  { name: "Ms. Neha Patel", department: "Hindi" },
  { name: "Mr. Suresh Gupta", department: "Physics" },
  { name: "Ms. Kavita Joshi", department: "Chemistry" },
]

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const periods = [1, 2, 3, 4, 5, 6, 7, 8]

export default function TeachersTimetablePage() {
  const { data: entries } = useApi<TimetableEntry>("/api/academics/timetable")
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [selectedDay, setSelectedDay] = useState("All")
  const [searched, setSearched] = useState(false)

  const handleSearch = () => {
    if (!selectedTeacher) return
    setSearched(true)
  }

  const selectedTeacherInfo = teachers.find((t) => t.name === selectedTeacher)

  const filteredEntries = useMemo(() => {
    let result = (entries || []).filter((e) => e.teacher === selectedTeacher)
    if (selectedDay !== "All") {
      result = result.filter((e) => e.day === selectedDay)
    }
    return result
  }, [selectedTeacher, selectedDay, searched])

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

  const getCellContent = (day: string, period: number) => {
    const entry = gridData[day]?.[period]
    if (!entry) return null
    return (
      <div className="w-full p-1.5 min-h-[60px]">
        <span className="text-xs font-semibold text-[var(--title-color)] block leading-tight">{entry.subject}</span>
        <span className="text-[10px] text-[var(--subtitle-color)] block leading-tight mt-0.5">{entry.teacher}</span>
        <span className="text-[9px] text-[var(--subtitle-color)]/70 block leading-tight mt-0.5">{entry.startTime} - {entry.endTime}</span>
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
                  <option key={t.name} value={t.name}>{t.name} ({t.department})</option>
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

      {searched && selectedTeacherInfo && (
        <>
          <div className="glass-panel">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--title-color)]">
                {selectedTeacherInfo.name}
                <span className="text-xs font-normal text-[var(--subtitle-color)] ml-2">({selectedTeacherInfo.department})</span>
              </h3>
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
                    {["#", "Day", "Period", "Subject", "Time"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No timetable entries found</td>
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
                      return sorted.map((entry, idx) => (
                        <tr
                          key={entry.id}
                          className={`border-b border-[var(--border)] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${idx % 2 === 1 ? "bg-gray-50/30 dark:bg-gray-800/10" : ""}`}
                        >
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-[var(--title-color)]">{entry.day}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Period {entry.period}</td>
                          <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{entry.subject}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{entry.startTime} - {entry.endTime}</td>
                        </tr>
                      ))
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
