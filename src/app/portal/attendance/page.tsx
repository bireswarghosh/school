"use client"

import { useState, useEffect, useCallback } from "react"
import { CalendarDays, Loader2, Save } from "lucide-react"

const TYPES = ["Present", "Absent", "Late", "Half Day"]

export default function PortalAttendance() {
  const [role, setRole] = useState("")
  const [kids, setKids] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [studentId, setStudentId] = useState("")
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [records, setRecords] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d.user?.role || ""))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (role === "parent") {
      fetch("/api/my/parent/kids")
        .then((r) => r.json())
        .then((d) => {
          const kidsList = d.kids || []
          setKids(kidsList)
          const qs = new URLSearchParams(window.location.search).get("studentId")
          setStudentId(qs || (kidsList[0] ? String(kidsList[0].id) : ""))
        })
        .catch(() => {})
    }
    if (role === "teacher") {
      fetch("/api/my/teacher/classes")
        .then((r) => r.json())
        .then((d) => {
          const classesList = d.classes || []
          setClasses(classesList)
          const qs = new URLSearchParams(window.location.search)
          const qClass = qs.get("classId")
          const qSection = qs.get("sectionId")
          if (qClass && qSection) {
            setClassId(qClass)
            setSectionId(qSection)
          } else if (classesList[0]) {
            setClassId(String(classesList[0].classId))
            setSectionId(String(classesList[0].sectionId))
          }
        })
        .catch(() => {})
    }
  }, [role])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    let url = ""
    if (role === "student") url = `/api/my/student/attendance?month=${month}`
    if (role === "parent") {
      if (!studentId) return
      url = `/api/my/parent/kids/attendance?studentId=${studentId}&month=${month}`
    }
    if (role === "teacher") {
      if (!classId || !sectionId) return
      url = `/api/my/teacher/attendance?classId=${classId}&sectionId=${sectionId}&date=${date}`
    }
    if (!url) return
    try {
      const res = await fetch(url)
      const d = await res.json()
      if (d.error) setError(d.error)
      else {
        setRecords(d.records || [])
        setSummary(d.summary || null)
      }
    } catch {
      setError("Failed to load attendance")
    } finally {
      setLoading(false)
    }
  }, [role, month, studentId, classId, sectionId, date])

  useEffect(() => {
    if (role) load()
  }, [role, load])

  const saveAttendance = async () => {
    setSaving(true)
    setSaved("")
    setError("")
    try {
      const res = await fetch("/api/my/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: Number(classId),
          sectionId: Number(sectionId),
          date,
          records: records.map((r) => ({
            studentId: r.id,
            attendanceTypeId: r.attendanceTypeId ?? null,
            inTime: r.inTime ?? null,
            outTime: r.outTime ?? null,
          })),
        }),
      })
      const d = await res.json()
      if (!res.ok) setError(d.error || "Failed to save attendance")
      else {
        setSaved(`Attendance saved for ${date} (${d.saved} records)`)
        load()
      }
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Attendance</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">
          {role === "teacher" ? "Mark student attendance" : "View attendance records"}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {role === "parent" && (
          <>
            <label className="text-sm font-medium text-[var(--foreground)]">Child</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            >
              {kids.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} · {k.class}-{k.section}
                </option>
              ))}
            </select>
          </>
        )}
        {(role === "student" || role === "parent") && (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
          />
        )}
        {role === "teacher" && (
          <>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                const c = classes.find((x) => String(x.classId) === e.target.value)
                setSectionId(c ? String(c.sectionId) : "")
              }}
              className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            >
              {classes.map((c) => (
                <option key={`${c.classId}-${c.sectionId}`} value={c.classId}>
                  {c.className}-{c.sectionName}
                </option>
              ))}
            </select>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            >
              {classes
                .filter((c) => String(c.classId) === classId)
                .map((c) => (
                  <option key={c.sectionId} value={c.sectionId}>
                    {c.sectionName}
                  </option>
                ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            />
          </>
        )}
      </div>

      {summary && (role === "student" || role === "parent") && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary).map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)]"
            >
              {k}: {v as number}
            </span>
          ))}
        </div>
      )}

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-[var(--subtitle-color)] p-5">Loading…</p>
        ) : records.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-center gap-2">
            <CalendarDays className="h-10 w-10 text-[var(--primary-light)]" />
            <p className="text-sm text-[var(--subtitle-color)]">
              {role === "teacher" ? "No students in this class, or attendance not recorded for this date." : "No attendance records for this month."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--subtitle-color)] border-b border-[var(--border)]">
                {role === "teacher" && <th className="px-5 py-2.5 font-medium">Roll</th>}
                <th className="px-5 py-2.5 font-medium">Name</th>
                {role !== "teacher" ? (
                  <>
                    <th className="px-5 py-2.5 font-medium">Date</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </>
                ) : (
                  <th className="px-5 py-2.5 font-medium">Status</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {records.map((r) => (
                <tr key={r.id ?? r.attendanceId}>
                  {role === "teacher" && <td className="px-5 py-2.5 text-[var(--foreground)]">{r.rollNo ?? "—"}</td>}
                  <td className="px-5 py-2.5 font-medium text-[var(--foreground)]">{r.name}</td>
                  {role !== "teacher" ? (
                    <>
                      <td className="px-5 py-2.5 text-[var(--foreground)]">{r.date}</td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            r.attendanceType
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {r.attendanceType || "—"}
                        </span>
                      </td>
                    </>
                  ) : (
                    <td className="px-5 py-2.5">
                      <select
                        value={r.attendanceTypeId ?? ""}
                        onChange={(e) => {
                          const val = e.target.value
                          setRecords((prev) =>
                            prev.map((x) =>
                              x.id === r.id
                                ? {
                                    ...x,
                                    attendanceTypeId: val ? Number(val) : null,
                                    attendanceType: TYPES[Number(val) - 1] ?? null,
                                  }
                                : x
                            )
                          )
                        }}
                        className="px-2 py-1 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="">—</option>
                        {TYPES.map((t, i) => (
                          <option key={t} value={i + 1}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {role === "teacher" && records.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Attendance
          </button>
          {saved && <span className="text-sm text-green-600">{saved}</span>}
        </div>
      )}
    </div>
  )
}
