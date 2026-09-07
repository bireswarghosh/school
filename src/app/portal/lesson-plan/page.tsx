"use client"

import { useState, useEffect, useCallback } from "react"
import { BookOpen, Loader2, ChevronLeft, ChevronRight, CalendarRange } from "lucide-react"

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function addDays(d: Date, n: number) {
  const next = new Date(d)
  next.setUTCDate(next.getUTCDate() + n)
  return next
}

function mondayOf(date: Date) {
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(date, diff)
}

function fmtShort(iso: string) {
  const p = iso.split("-")
  return `${p[2]}-${p[1]}-${p[0]}`
}

function weekdayName(iso: string) {
  const idx = parseISO(iso).getUTCDay()
  return WEEKDAYS[idx === 0 ? 6 : idx - 1]
}

export default function PortalLessonPlan() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [weekStart, setWeekStart] = useState<string>(() => mondayOf(new Date()).toISOString().slice(0, 10))

  useEffect(() => {
    fetch("/api/my/student/lesson-plans")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError("Failed to load lesson plan"))
      .finally(() => setLoading(false))
  }, [])

  const plans = data?.plans || []

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = parseISO(weekStart)
    return toISO(addDays(d, i))
  })

  const weekLabel = `${fmtShort(weekDays[0])} To ${fmtShort(weekDays[6])}`

  const datedPlans = plans
    .filter((p: any) => p.startDate && p.endDate)
    .map((p: any) => ({
      ...p,
      start: parseISO(String(p.startDate).slice(0, 10)),
      end: parseISO(String(p.endDate).slice(0, 10)),
    }))

  const plansForDay = (dayISO: string) => {
    const day = parseISO(dayISO)
    return datedPlans.filter((p: any) => day >= p.start && day <= p.end)
  }

  const statusBadge = (status: string) => {
    const s = String(status || "").toLowerCase()
    const cls = /completed/.test(s)
      ? "bg-green-100 text-green-800"
      : /in progress|started/.test(s)
        ? "bg-blue-100 text-blue-800"
        : "bg-yellow-100 text-yellow-800"
    return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{status || "Pending"}</span>
  }

  const weekRange = parseISO(weekDays[0])
  const todayISO = toISO(new Date())
  const isThisWeek = weekDays.includes(todayISO)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Lesson Plan</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">
          {data?.className ? `Syllabus for Class ${data.className}${data.sectionName ? ` - ${data.sectionName}` : ""}` : "Your syllabus and lesson plan"}
        </p>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWeekStart(toISO(addDays(weekRange, -7)))}
                  className="h-9 w-9 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors cursor-pointer"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                  <CalendarRange className="h-4 w-4" />
                  <span className="text-sm font-bold">{weekLabel}</span>
                </div>
                <button
                  onClick={() => setWeekStart(toISO(addDays(weekRange, 7)))}
                  className="h-9 w-9 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors cursor-pointer"
                  aria-label="Next week"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              {!isThisWeek && (
                <button
                  onClick={() => setWeekStart(mondayOf(new Date()).toISOString().slice(0, 10))}
                  className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  This Week
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            {weekDays.map((day) => {
              const items = plansForDay(day)
              const isToday = day === todayISO
              return (
                <div
                  key={day}
                  className={`glass-panel rounded-xl overflow-hidden ${isToday ? "ring-2 ring-[var(--primary)]" : ""}`}
                >
                  <div className={`px-4 py-3 border-b border-[var(--border)] ${isToday ? "bg-[var(--primary)]" : "bg-gray-50 dark:bg-white/5"}`}>
                    <p className={`text-sm font-bold ${isToday ? "text-white" : "text-[var(--title-color)]"}`}>
                      {weekdayName(day)}
                    </p>
                    <p className={`text-xs mt-0.5 ${isToday ? "text-white/80" : "text-[var(--subtitle-color)]"}`}>{fmtShort(day)}</p>
                  </div>
                  <div className="p-3 space-y-2 min-h-[120px]">
                    {items.length === 0 ? (
                      <div className="flex items-center justify-center h-full min-h-[80px] rounded-lg border border-dashed border-[var(--border)] text-[10px] text-[var(--subtitle-color)]">
                        Not Scheduled
                      </div>
                    ) : (
                      items.map((p: any) => (
                        <div key={p.id} className="rounded-lg border-l-4 border-[var(--primary)] bg-[var(--primary)]/5 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[var(--title-color)] truncate">{p.subject || "—"}</p>
                            {statusBadge(p.status)}
                          </div>
                          <p className="text-[11px] font-semibold text-[var(--foreground)] mt-0.5 truncate">{p.lesson || "—"}</p>
                          <p className="text-[11px] text-[var(--subtitle-color)] mt-0.5 leading-snug line-clamp-2">{p.topic || "—"}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-3">
              <h3 className="text-sm font-bold text-[var(--title-color)]">All Lesson Plans</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-[var(--border)]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">#</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">Subject</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">Lesson</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">Topic</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">Start</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">End</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--subtitle-color)] uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--subtitle-color)]">No lesson plans published for your class.</td>
                    </tr>
                  ) : (
                    plans.map((p: any, idx: number) => (
                      <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--primary)]/5">
                        <td className="px-4 py-3 text-[var(--subtitle-color)]">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--title-color)]">{p.subject || "—"}</td>
                        <td className="px-4 py-3 text-[var(--foreground)]">{p.lesson || "—"}</td>
                        <td className="px-4 py-3 text-[var(--foreground)] max-w-[220px]">
                          <span className="block truncate">{p.topic || "—"}</span>
                          {p.description && <span className="block text-xs text-[var(--subtitle-color)] truncate">{p.description}</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--subtitle-color)] whitespace-nowrap">{p.startDate || "—"}</td>
                        <td className="px-4 py-3 text-xs text-[var(--subtitle-color)] whitespace-nowrap">{p.endDate || "—"}</td>
                        <td className="px-4 py-3">{statusBadge(p.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}