"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  NotebookPen,
  Save,
  X,
} from "lucide-react"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const pad = (n: number) => String(n).padStart(2, "0")
const TYPES = ["Present", "Absent", "Late", "Half Day"]

type KidRow = { id: number; name: string; class?: string | null; section?: string | null }
type ClassOption = { classId: number; sectionId: number; className: string; sectionName: string }
type NoteRow = { id: number; studentId: number; date: string; note: string | null }
type ViewerRecord = { date: string; attendanceType?: string | null; id?: number; studentId?: number; attendanceTypeId?: number | null }
type TeacherRecord = { id: number; attendanceId?: number; name: string; rollNo?: number | string | null; attendanceTypeId?: number | null; attendanceType?: string | null; inTime?: string | null; outTime?: string | null }

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error((d as any)?.error || `Request failed (${res.status})`)
  }
  return res.json() as T
}

function statusStyles(name: string) {
  const n = name.toLowerCase()
  if (/present/.test(n))
    return {
      badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
      cell: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30",
    }
  if (/late/.test(n))
    return {
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      cell: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30",
    }
  if (/absent/.test(n))
    return {
      badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      cell: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30",
    }
  if (/holiday|half/.test(n))
    return {
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
      cell: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30",
    }
  return { badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300", cell: "" }
}

function shortName(name: string) {
  const n = name.toLowerCase()
  if (n.includes("present")) return "P"
  if (n.includes("late")) return "L"
  if (n.includes("absent")) return "A"
  if (n.includes("half")) return "HD"
  if (n.includes("holiday")) return "H"
  return (name[0] || "?").toUpperCase()
}

function formatDate(date: string) {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const selectCls =
  "px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:outline-none disabled:opacity-50 w-full sm:w-auto"
const ghostBtn =
  "inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 border border-[var(--border)] bg-[var(--card)] px-3 py-2 rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
const iconBtn =
  "p-2 rounded-lg text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] border border-transparent hover:border-[var(--primary)]/20 transition-colors"

export default function PortalAttendance() {
  const [role, setRole] = useState("")
  const [me, setMe] = useState<{ name?: string; id?: number } | null>(null)
  const [kids, setKids] = useState<KidRow[]>([])
  const [myClasses, setMyClasses] = useState<ClassOption[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [studentId, setStudentId] = useState("")
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [lowLimit, setLowLimit] = useState<number | null>(null)

  const [viewerRecords, setViewerRecords] = useState<ViewerRecord[]>([])
  const [teacherRecords, setTeacherRecords] = useState<TeacherRecord[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [noteModal, setNoteModal] = useState<{ date: string; value: string } | null>(null)
  const [noteSaving, setNoteSaving] = useState(false)

  const isViewer = role === "student" || role === "parent"
  const isTeacherMode = role === "teacher" || role === "staff" || role === "admin"

  useEffect(() => {
    ;(async () => {
      try {
        const d = await fetchJson<{ user?: { role?: string; name?: string; id?: number } }>("/api/auth/me")
        setRole(d.user?.role || "")
        setMe(d.user || null)
      } catch {}
    })()
  }, [])

  useEffect(() => {
    fetch("/api/school-settings")
      .then((r) => r.json())
      .then((d) => {
        const v = d["attendance.lowAttendanceLimit"]
        if (v != null && v !== "" && !Number.isNaN(Number(v))) setLowLimit(Number(v))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!role) return
    if (role === "parent") {
      fetchJson<{ kids?: KidRow[] }>("/api/my/parent/kids")
        .then((d) => {
          const k = Array.isArray(d?.kids) ? d.kids : []
          setKids(k)
          const qs = new URLSearchParams(window.location.search).get("studentId")
          setStudentId(qs || (k[0] ? String(k[0].id) : ""))
        })
        .catch(() => {})
    } else if (role === "teacher") {
      fetchJson<{ classes?: ClassOption[] }>("/api/my/teacher/classes")
        .then((d) => {
          const c = Array.isArray(d?.classes) ? d.classes : []
          setMyClasses(c)
          const qs = new URLSearchParams(window.location.search)
          const qc = qs.get("classId")
          const qs2 = qs.get("sectionId")
          if (qc && qs2) {
            setClassId(qc)
            setSectionId(qs2)
          } else if (c[0]) {
            setClassId(String(c[0].classId))
            setSectionId(String(c[0].sectionId))
          }
        })
        .catch(() => {})
    } else if (role === "staff" || role === "admin") {
      fetchJson<any[]>("/api/classes")
        .then((c) => {
          const arr = Array.isArray(c) ? c : []
          setClasses(arr)
          const qs = new URLSearchParams(window.location.search).get("classId")
          if (qs) setClassId(qs)
          else if (arr[0]) setClassId(String(arr[0].id))
        })
        .catch(() => {})
    }
  }, [role])

  useEffect(() => {
    if (!isTeacherMode || !classId || role === "teacher") return
    fetchJson<any[]>(`/api/sections?class_id=${classId}`)
      .then((s) => {
        const arr = Array.isArray(s) ? s : []
        if (arr[0]) setSectionId(String(arr[0].id))
      })
      .catch(() => {})
  }, [role, classId, isTeacherMode])

  const viewerStudentId = isViewer
    ? role === "student"
      ? "0"
      : studentId
    : ""

  const loadViewer = useCallback(async () => {
    if (!isViewer) return
    if (role === "parent" && !studentId) {
      setViewerRecords([])
      setSummary({})
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    try {
      const url =
        role === "student"
          ? `/api/my/student/attendance?month=${month}`
          : `/api/my/parent/kids/attendance?studentId=${studentId}&month=${month}`
      const d = await fetchJson<{ records?: ViewerRecord[]; summary?: Record<string, number> }>(url)
      const recs = Array.isArray(d.records) ? d.records : []
      setViewerRecords(recs)
      const s: Record<string, number> = {}
      for (const r of recs) {
        const key = r.attendanceType || "Other"
        s[key] = (s[key] || 0) + 1
      }
      setSummary(d.summary || s)
    } catch (e: any) {
      setError(e?.message || "Failed to load attendance")
    } finally {
      setLoading(false)
    }
  }, [isViewer, role, month, studentId])

  useEffect(() => { loadViewer() }, [loadViewer])

  const loadTeacher = useCallback(async () => {
    if (!isTeacherMode) return
    if (!classId || !sectionId) {
      setTeacherRecords([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    try {
      const d = await fetchJson<{ records?: TeacherRecord[] }>(
        `/api/my/teacher/attendance?classId=${classId}&sectionId=${sectionId}&date=${date}`
      )
      setTeacherRecords(d.records || [])
    } catch (e: any) {
      setError(e?.message || "Failed to load attendance")
    } finally {
      setLoading(false)
    }
  }, [isTeacherMode, classId, sectionId, date])

  useEffect(() => { loadTeacher() }, [loadTeacher])

  const loadNotes = useCallback(async () => {
    if (!isViewer) return
    if (role === "parent" && !studentId) {
      setNotes({})
      return
    }
    try {
      const prefix = role === "student" ? "" : `studentId=${studentId}&`
      const d = await fetchJson<{ notes?: NoteRow[] }>(`/api/my/attendance-note?${prefix}month=${month}`)
      const m: Record<string, string> = {}
      for (const n of d.notes || []) if (n.note) m[n.date.slice(0, 10)] = n.note
      setNotes(m)
    } catch {
      setNotes({})
    }
  }, [role, studentId, month, isViewer])

  useEffect(() => { loadNotes() }, [loadNotes])

  const saveNote = async () => {
    if (!noteModal) return
    setNoteSaving(true)
    setError("")
    try {
      const res = await fetch("/api/my/attendance-note", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: role === "student" ? 0 : Number(studentId),
          date: noteModal.date,
          note: noteModal.value.trim(),
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e?.error || "Failed to save note")
      }
      const val = noteModal.value.trim()
      setNotes((prev) => {
        const next = { ...prev }
        if (val) next[noteModal.date] = val
        else delete next[noteModal.date]
        return next
      })
      setSaved(val ? `Note saved for ${noteModal.date}` : `Note removed for ${noteModal.date}`)
      setNoteModal(null)
    } catch (e: any) {
      setError(e?.message || "Network error")
    } finally {
      setNoteSaving(false)
    }
  }

  const attendancePct = (() => {
    if (!isViewer) return null
    let onTime = 0
    let total = 0
    const isOnTime = (t?: string | null) => {
      const n = (t || "").toLowerCase()
      return n === "present" || n === "late"
    }
    for (const r of viewerRecords) {
      total++
      if (isOnTime(r.attendanceType)) onTime++
    }
    if (!total) return null
    return Math.round((onTime / total) * 100)
  })()

  const monthStart = `${month}-01`
  const monthEnd = useMemo(() => {
    const [y, m] = month.split("-").map(Number)
    return `${month}-${pad(new Date(y, m, 0).getDate())}`
  }, [month])

  const shiftMonth = (dir: number) =>
    setMonth((prev) => {
      const [y, m] = prev.split("-").map(Number)
      const d = new Date(y, m - 1 + dir, 1)
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    })

  const goToday = () => setMonth(new Date().toISOString().slice(0, 7))

  const cells = useMemo(() => {
    const [y, m] = month.split("-").map(Number)
    const first = new Date(y, m - 1, 1).getDay()
    const dim = new Date(y, m, 0).getDate()
    const out: { day: number; date: string }[] = []
    for (let i = 0; i < first; i++) out.push({ day: 0, date: "" })
    for (let d = 1; d <= dim; d++) out.push({ day: d, date: `${month}-${pad(d)}` })
    while (out.length % 7 !== 0) out.push({ day: 0, date: "" })
    return out
  }, [month])

  const monthLabel = useMemo(() => {
    const [y, m] = month.split("-").map(Number)
    return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" })
  }, [month])

  const today = new Date().toISOString().slice(0, 10)

  const statusMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const r of viewerRecords) {
      const d = r.date?.slice(0, 10)
      if (d && r.attendanceType) m[d] = r.attendanceType
    }
    return m
  }, [viewerRecords])

  const teacherClassOptions = useMemo(() => {
    const seen = new Set<number>()
    const out: { classId: number; className: string }[] = []
    for (const c of myClasses) {
      if (seen.has(c.classId)) continue
      seen.add(c.classId)
      out.push({ classId: c.classId, className: c.className })
    }
    return out
  }, [myClasses])

  const teacherSections = useMemo(() => myClasses.filter((c) => String(c.classId) === classId), [myClasses, classId])

  const classOptions = useMemo(
    () =>
      role === "teacher"
        ? teacherClassOptions.map((c) => ({ key: c.classId, label: c.className }))
        : classes.map((c) => ({ key: c.id, label: c.name })),
    [role, teacherClassOptions, classes]
  )

  const sectionOptions = useMemo(
    () =>
      role === "teacher"
        ? teacherSections.map((c) => ({ key: c.sectionId, label: c.sectionName }))
        : [],
    [role, teacherSections]
  )

  const saveTeacherAttendance = async () => {
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
          records: teacherRecords.map((r) => ({
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
        loadTeacher()
      }
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  const subtitle = isTeacherMode
    ? "Mark student attendance"
    : role === "parent"
      ? "View your child's attendance and personal notes on the calendar"
      : "View your attendance and add personal notes on the calendar"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Attendance</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {role === "parent" && (
          <>
            <label className="text-sm font-medium text-[var(--foreground)]">Child</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={selectCls}
            >
              {kids.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} · {k.class}{k.section ? `-${k.section}` : ""}
                </option>
              ))}
            </select>
          </>
        )}
        {isViewer && (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={selectCls}
          />
        )}
        {isTeacherMode && (
          <>
            <label className="text-sm font-medium text-[var(--foreground)]">Class</label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                setSectionId("")
              }}
              className={selectCls}
            >
              {classOptions.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <label className="text-sm font-medium text-[var(--foreground)]">Section</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={!classId}
              className={selectCls}
            >
              {sectionOptions.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={selectCls}
            />
          </>
        )}
        {role === "student" && (
          <p className="text-sm text-[var(--subtitle-color)]">
            Showing attendance for <span className="font-medium text-[var(--title-color)]">{me?.name || "you"}</span>.
            Click the pencil icon on any day to add a personal note.
          </p>
        )}
      </div>

      {isViewer && lowLimit != null && attendancePct != null &&
        (attendancePct >= lowLimit ? (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Attendance at par — {attendancePct}% (required minimum {lowLimit}%).
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Low attendance — your attendance is {attendancePct}%, below the school&apos;s required minimum of {lowLimit}%.
          </div>
        ))}

      {isViewer && Object.keys(summary).length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(summary).map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)]"
            >
              {k}: {v}
            </span>
          ))}
          {attendancePct != null && (
            <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-semibold">
              {attendancePct}%
            </span>
          )}
        </div>
      )}

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      {isViewer && (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
            <button onClick={() => shiftMonth(-1)} className={iconBtn} title="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center min-w-0">
              <div className="text-lg font-bold text-[var(--title-color)]">{monthLabel}</div>
              <div className="text-xs text-[var(--subtitle-color)] hidden sm:block">
                Days are color coded by attendance status · click the pencil to add a personal note
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={goToday} className={ghostBtn} title="Jump to current month">
                Today
              </button>
              <button onClick={() => shiftMonth(1)} className={iconBtn} title="Next month">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--subtitle-color)]">
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="p-10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5 p-3">
              {cells.map((c, i) => {
                if (c.day === 0) return <div key={`e${i}`} aria-hidden="true" />
                const st = statusMap[c.date]
                const stl = st ? statusStyles(st) : null
                const hasNote = !!notes[c.date]
                const isToday = c.date === today
                const isWeekend = i % 7 === 0 || i % 7 === 6
                return (
                  <div
                    key={c.date}
                    className={`relative rounded-xl border min-h-[68px] p-1.5 flex flex-col ${
                      stl?.cell || (isWeekend ? "bg-gray-50/70 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800" : "border-[var(--border)]")
                    } ${isToday ? "ring-2 ring-[var(--primary)]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex flex-col items-start gap-0.5 min-w-0">
                        <span className={`text-sm font-semibold ${st ? "" : "text-[var(--subtitle-color)]"}`}>{c.day}</span>
                        {st && (
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${statusStyles(st).badge}`}>
                            {shortName(st)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setNoteModal({ date: c.date, value: notes[c.date] || "" })}
                        title={hasNote ? "Edit note" : "Add a personal note"}
                        className={`shrink-0 rounded-md p-1 transition-colors ${
                          hasNote ? "text-[var(--primary)]" : "text-gray-300 hover:text-[var(--primary)] dark:text-gray-600"
                        }`}
                      >
                        <NotebookPen className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {hasNote && (
                      <p className="mt-auto pt-1 text-[10px] leading-tight text-[var(--subtitle-color)] truncate" title={notes[c.date]}>
                        {notes[c.date]}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="px-4 py-3 border-t border-[var(--border)] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--subtitle-color)]">
            <span className="font-semibold text-[var(--title-color)]">Legend:</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Present</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Late</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Absent</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Half Day</span>
            <span className="inline-flex items-center gap-1.5">
              <NotebookPen className="h-3 w-3" />
              Note
            </span>
          </div>
        </div>
      )}

      {isTeacherMode && (
        <>
          <div className="glass-panel rounded-xl overflow-hidden">
            {loading ? (
              <p className="text-sm text-[var(--subtitle-color)] p-5">Loading…</p>
            ) : teacherRecords.length === 0 ? (
              <div className="p-10 flex flex-col items-center text-center gap-2">
                <CalendarDays className="h-10 w-10 text-[var(--primary-light)]" />
                <p className="text-sm text-[var(--subtitle-color)]">
                  {role === "teacher" ? "No students in this class, or attendance not recorded for this date." : "No attendance records for this date."}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--subtitle-color)] border-b border-[var(--border)]">
                    {role === "teacher" && <th className="px-5 py-2.5 font-medium">Roll</th>}
                    <th className="px-5 py-2.5 font-medium">Name</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {teacherRecords.map((r) => (
                    <tr key={r.id ?? r.attendanceId}>
                      {role === "teacher" && <td className="px-5 py-2.5 text-[var(--foreground)]">{r.rollNo ?? "—"}</td>}
                      <td className="px-5 py-2.5 font-medium text-[var(--foreground)]">{r.name}</td>
                      <td className="px-5 py-2.5">
                        <select
                          value={r.attendanceTypeId ?? ""}
                          onChange={(e) => {
                            const val = e.target.value
                            setTeacherRecords((prev) =>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {teacherRecords.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={saveTeacherAttendance}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Attendance
              </button>
              {saved && <span className="text-sm text-green-600">{saved}</span>}
            </div>
          )}
        </>
      )}

      {!isViewer && !isTeacherMode && (
        <div className="glass-panel rounded-xl p-5 text-center">
          <p className="text-sm text-[var(--subtitle-color)]">No attendance view available for your role.</p>
        </div>
      )}

      {noteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setNoteModal(null)}
        >
          <div
            className="w-full max-w-md glass-panel rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-[var(--title-color)]">
                Personal Note · {formatDate(noteModal.date)}
              </h3>
              <button onClick={() => setNoteModal(null)} className={iconBtn}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={noteModal.value}
              onChange={(e) => setNoteModal({ ...noteModal, value: e.target.value })}
              rows={4}
              autoFocus
              placeholder="Add a personal note for this day…"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--card)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <button onClick={() => setNoteModal(null)} className={ghostBtn}>
                Cancel
              </button>
              <button
                onClick={saveNote}
                disabled={noteSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {noteSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}