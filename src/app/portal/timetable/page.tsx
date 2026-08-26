"use client"

import { useState, useEffect } from "react"
import { CalendarDays } from "lucide-react"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function PortalTimetable() {
  const [role, setRole] = useState("")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d.user?.role || ""))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!role) return
    let cancelled = false
    const url = role === "teacher" ? "/api/my/teacher/timetable" : "/api/my/student/timetable"
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.error) setError(d.error)
        else setData(d.timetable || [])
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load timetable")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [role])

  const grouped = DAYS.map((day) => ({
    day,
    entries: data.filter((e) => e.day === day).sort((a, b) => (a.period ?? 0) - (b.period ?? 0)),
  })).filter((g) => g.entries.length > 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Timetable</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">
          {role === "teacher" ? "Your teaching schedule" : "Your class schedule"}
        </p>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-sm text-[var(--subtitle-color)]">Loading…</p>
      ) : grouped.length === 0 ? (
        <div className="glass-panel rounded-xl p-10 flex flex-col items-center text-center gap-2">
          <CalendarDays className="h-10 w-10 text-[var(--primary-light)]" />
          <p className="text-sm text-[var(--subtitle-color)]">No timetable published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {grouped.map((g) => (
            <div key={g.day} className="glass-panel rounded-xl p-5">
              <h3 className="text-sm font-bold text-[var(--title-color)] uppercase tracking-wide mb-3">{g.day}</h3>
              <div className="space-y-2">
                {g.entries.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{e.subject}</p>
                      <p className="text-xs text-[var(--subtitle-color)]">
                        {e.className ? `${e.className}-${e.sectionName} · ` : ""}
                        {e.startTime || e.period ? `Period ${e.period || ""}${e.startTime ? ` · ${e.startTime}` : ""}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--primary)] shrink-0">
                      {e.startTime && e.endTime ? `${e.startTime}-${e.endTime}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
