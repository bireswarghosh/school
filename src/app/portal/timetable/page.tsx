"use client"

import { useState, useEffect } from "react"
import { CalendarDays, Printer } from "lucide-react"
import { useSchoolInfo } from "@/lib/use-school-info"

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DAY_STYLES: Record<string, string> = {
  Monday: "bg-blue-50 text-blue-700 border-blue-200",
  Tuesday: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Wednesday: "bg-amber-50 text-amber-700 border-amber-200",
  Thursday: "bg-purple-50 text-purple-700 border-purple-200",
  Friday: "bg-rose-50 text-rose-700 border-rose-200",
  Saturday: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Sunday: "bg-gray-100 text-gray-600 border-gray-200",
}

const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export default function PortalTimetable() {
  const [role, setRole] = useState("")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { info: schoolInfo } = useSchoolInfo()

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

  const isTeacher = role === "teacher"
  const entriesForDay = (day: string) =>
    data.filter((e) => e.day === day).sort((a, b) => (a.period ?? 0) - (b.period ?? 0))
  const hasAny = data.length > 0

  const buildPrintHtml = (): string => {
    const esc = escapeHtml
    const sName = esc(schoolInfo.name || "Smart School")
    const sAddress = schoolInfo.address ? esc(schoolInfo.address) : ""
    const title = "Class Timetable"
    const genDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })

    const periodSet = new Set<number>()
    data.forEach((e) => {
      const p = Number(e.period || 0)
      if (p > 0) periodSet.add(p)
    })
    const periods = [...periodSet].sort((a, b) => a - b)
    const days = WEEKDAYS

    const tableRows =
      periods.length === 0
        ? `<tr><td style="padding:18px;border:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:12px;" colspan="8">No timetable published yet.</td></tr>`
        : periods
            .map((p) => {
              const cells = days
                .map((d) => {
                  const e = data.find((x) => x.day === d && Number(x.period || 0) === p)
                  if (!e) return `<td class="empty">Not Scheduled</td>`
                  const subj = esc(e.subject || "")
                  const extra: string[] = []
                  if (isTeacher && e.className) extra.push(`<span class="cls">${esc(e.className)}-${esc(e.sectionName || "")}</span>`)
                  if (e.startTime && e.endTime) extra.push(`<span class="tm">${esc(e.startTime)} - ${esc(e.endTime)}</span>`)
                  return `<td>${subj}${extra.length ? extra.map((x) => x).join("") : ""}</td>`
                })
                .join("")
              return `<tr><td class="period">Period ${p}</td>${cells}</tr>`
            })
            .join("")

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title} - ${esc(sName)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 12px; padding: 32px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ff7732; padding-bottom: 14px; margin-bottom: 18px; }
  .head h1 { font-size: 21px; color: #111827; }
  .head .sub { color: #4b5563; font-size: 11px; margin-top: 3px; }
  .head .meta { text-align: right; font-size: 12px; color: #4b5563; line-height: 1.6; }
  .head .meta .doc-title { font-size: 14px; font-weight: 700; color: #111827; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ff7732; margin: 16px 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #ff7732; color: #fff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; border: 1px solid #e8b28a; text-align: left; }
  td { border: 1px solid #e5e7eb; padding: 8px 10px; vertical-align: top; }
  td.period { width: 70px; background: #fff7f2; font-weight: 700; color: #ff7732; }
  td.empty { color: #c0c4cc; font-style: italic; text-align: center; }
  .cls { display: block; color: #6b7280; font-size: 10px; margin-top: 2px; }
  .tm { display: block; color: #ff7732; font-size: 10px; margin-top: 2px; }
  .foot { margin-top: 26px; text-align: center; color: #6b7280; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style>
</head>
<body>
  <div class="head">
    <div>
      <h1>${sName}</h1>
      ${sAddress ? `<div class="sub">${sAddress}</div>` : ""}
    </div>
    <div class="meta">
      <div class="doc-title">${title}</div>
      <div>Generated: ${genDate}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Period</th>
        ${days.map((d) => `<th>${d}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="foot">This is a computer-generated class timetable. Generated on ${genDate}.</div>
</body>
</html>`
  }

  const printTimetable = () => {
    const frame = document.getElementById("timetable-print-frame") as HTMLIFrameElement | null
    if (!frame) return
    frame.onload = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    }
    frame.srcdoc = buildPrintHtml()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--title-color)]">Class Timetable</h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">
            {isTeacher ? "Your weekly teaching schedule" : "Your weekly class schedule"}
          </p>
        </div>
        <button
          onClick={printTimetable}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Printer className="h-4 w-4" /> Print Timetable
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-sm text-[var(--subtitle-color)]">Loading…</p>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 min-w-[1080px] xl:min-w-0">
            {WEEKDAYS.map((day) => {
              const entries = entriesForDay(day)
              const today = new Date().getDay()
              const dayIndex = WEEKDAYS.indexOf(day)
              const isToday = today === (dayIndex === 6 ? 0 : dayIndex + 1)
              return (
                <div key={day} className={`glass-panel rounded-xl overflow-hidden ${isToday ? "ring-2 ring-[var(--primary)]" : ""}`}>
                  <div className={`px-3 py-2.5 border-b border-[var(--border)] ${isToday ? "bg-[var(--primary)]" : DAY_STYLES[day]}`}>
                    <p className={`text-sm font-bold ${isToday ? "text-white" : ""}`}>{day}</p>
                  </div>
                  <div className="p-2.5 space-y-2 min-h-[120px]">
                    {entries.length === 0 ? (
                      <div className="flex items-center justify-center h-full min-h-[90px] rounded-lg border border-dashed border-[var(--border)] text-[10px] text-[var(--subtitle-color)]">
                        Not Scheduled
                      </div>
                    ) : (
                      entries.map((e) => (
                        <div key={e.id} className="rounded-lg border-l-4 border-[var(--primary)] bg-[var(--primary)]/5 px-2.5 py-2">
                          <p className="text-xs font-bold text-[var(--title-color)] leading-snug">{e.subject}</p>
                          {isTeacher && e.className && (
                            <p className="mt-0.5 text-[10px] text-[var(--subtitle-color)]">
                              {e.className}-{e.sectionName}
                            </p>
                          )}
                          {e.startTime && e.endTime ? (
                            <p className="mt-0.5 text-[10px] font-semibold text-[var(--primary)]">
                              {e.startTime} - {e.endTime}
                            </p>
                          ) : null}
                          {Number(e.period || 0) > 0 && (
                            <p className="mt-0.5 text-[10px] text-[var(--subtitle-color)]">Period {e.period}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <iframe
        id="timetable-print-frame"
        title="Class timetable print frame"
        style={{ position: "fixed", left: -9999, top: 0, width: 860, height: 1100, border: 0 }}
      />
    </div>
  )
}