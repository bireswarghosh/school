"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
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

type AttendanceType = { id: number; type: string }
type StudentRow = { id: number; name: string; admissionNo?: string | null; rollNo?: number | string | null }
type ClassOption = { classId: number; sectionId: number; className: string; sectionName: string }
type ClassRow = { id: number; name: string }
type SectionRow = { id: number; name: string; class_id?: number }
type KidRow = { id: number; name: string; class?: string | null; section?: string | null }
type AttendanceRecord = {
  id?: number
  studentId: number
  date: string
  attendanceTypeId?: number | null
  attendanceType?: string | null
}
type NoteRow = { id: number; studentId: number; date: string; note: string | null }
type SelectedStudent = { id: number; name: string; rollNo?: number | string | null; class?: string | null; section?: string | null } | null

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error((d as { error?: string })?.error || `Request failed (${res.status})`)
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

function legendDot(name: string) {
  const n = name.toLowerCase()
  if (/present/.test(n)) return "bg-green-500"
  if (/late/.test(n)) return "bg-amber-500"
  if (/absent/.test(n)) return "bg-red-500"
  if (/holiday|half/.test(n)) return "bg-blue-500"
  return "bg-gray-300"
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

export default function UserAttendancePage() {
  const [role, setRole] = useState("")
  const [me, setMe] = useState<{ name?: string; id?: number } | null>(null)
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [types, setTypes] = useState<AttendanceType[]>([])
  const [lowLimit, setLowLimit] = useState<number | null>(null)

  const [kids, setKids] = useState<KidRow[]>([])
  const [myClasses, setMyClasses] = useState<ClassOption[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [sections, setSections] = useState<SectionRow[]>([])

  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [students, setStudents] = useState<StudentRow[]>([])

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [marks, setMarks] = useState<Record<string, number | null>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [noteModal, setNoteModal] = useState<{ date: string; value: string } | null>(null)
  const [noteSaving, setNoteSaving] = useState(false)

  const canMark = ["teacher", "staff", "admin"].includes(role)
  const isViewer = role === "student" || role === "parent"

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
    ;(async () => {
      try {
        const t = await fetchJson<AttendanceType[]>("/api/attendance/type")
        setTypes(Array.isArray(t) ? t : [])
      } catch {}
      try {
        const s = await fetchJson<Record<string, string>>("/api/school-settings")
        const v = s["attendance.lowAttendanceLimit"]
        if (v != null && v !== "" && !Number.isNaN(Number(v))) setLowLimit(Number(v))
      } catch {}
    })()
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
    } else if (role === "admin" || role === "staff") {
      fetchJson<ClassRow[]>("/api/classes")
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
    if ((role !== "admin" && role !== "staff") || !classId) {
      setSections([])
      return
    }
    fetchJson<SectionRow[]>(`/api/sections?class_id=${classId}`)
      .then((s) => {
        const arr = Array.isArray(s) ? s : []
        setSections(arr)
        setSectionId((prev) => (arr.some((x) => String(x.id) === prev) ? prev : arr[0] ? String(arr[0].id) : ""))
      })
      .catch(() => setSections([]))
  }, [role, classId])

  const monthStart = `${month}-01`
  const monthEnd = useMemo(() => {
    const [y, m] = month.split("-").map(Number)
    return `${month}-${pad(new Date(y, m, 0).getDate())}`
  }, [month])

  const buildMarks = useCallback((recs: AttendanceRecord[], sid: number | null) => {
    const m: Record<string, number | null> = {}
    for (const r of recs) {
      if (sid != null && Number(r.studentId) !== Number(sid)) continue
      const d = r.date?.slice(0, 10)
      if (d) m[d] = r.attendanceTypeId ?? null
    }
    return m
  }, [])

  const loadViewer = useCallback(async () => {
    if (!isViewer) return
    if (role === "parent" && !studentId) {
      setRecords([])
      setMarks({})
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
      const d = await fetchJson<{ records?: AttendanceRecord[] }>(url)
      const recs = Array.isArray(d.records) ? d.records : []
      setRecords(recs)
      setMarks(buildMarks(recs, null))
    } catch (e: any) {
      setError(e?.message || "Failed to load attendance")
    } finally {
      setLoading(false)
    }
  }, [isViewer, role, month, studentId, buildMarks])

  useEffect(() => {
    loadViewer()
  }, [loadViewer])

  const loadClass = useCallback(async () => {
    if (!canMark) return
    if (!classId || !sectionId) {
      setStudents([])
      setRecords([])
      setMarks({})
      return
    }
    setLoading(true)
    setError("")
    try {
      const [st, recs] = await Promise.all([
        fetchJson<StudentRow[]>(`/api/students?class_id=${classId}&section_id=${sectionId}`),
        fetchJson<AttendanceRecord[]>(
          `/api/attendance/student?class_id=${classId}&section_id=${sectionId}&from_date=${monthStart}&to_date=${monthEnd}`
        ),
      ])
      const studentsArr = Array.isArray(st) ? st.filter((x) => x && typeof x.id === "number") : []
      setStudents(studentsArr)
      setRecords(Array.isArray(recs) ? recs : [])
      setStudentId((prev) => {
        const keep = studentsArr.some((s) => String(s.id) === prev) ? prev : ""
        const next = keep || (studentsArr[0] ? String(studentsArr[0].id) : "")
        if (!next) setMarks({})
        return next
      })
    } catch (e: any) {
      setError(e?.message || "Failed to load class students")
    } finally {
      setLoading(false)
    }
  }, [canMark, classId, sectionId, monthStart, monthEnd])

  useEffect(() => {
    loadClass()
  }, [loadClass])

  useEffect(() => {
    if (!canMark) return
    if (!studentId) {
      setMarks({})
      return
    }
    setMarks(buildMarks(records, Number(studentId)))
  }, [canMark, studentId, records, buildMarks])

  const loadNotes = useCallback(async () => {
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
  }, [role, studentId, month])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const typeMap = useMemo(() => {
    const m = new Map<number, AttendanceType>()
    for (const t of types) m.set(t.id, t)
    return m
  }, [types])

  const statusOf = (date: string) => {
    const tid = marks[date]
    return tid == null ? null : typeMap.get(tid) ?? null
  }

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
        : sections.map((c) => ({ key: c.id, label: c.name })),
    [role, teacherSections, sections]
  )

  const cycleDate = (date: string) => {
    if (!canMark) return
    const ids = types.map((t) => t.id)
    if (ids.length === 0) return
    const cur = marks[date]
    let next: number | null
    if (cur == null) next = ids[0]
    else {
      const idx = ids.indexOf(Number(cur))
      next = idx >= ids.length - 1 ? null : ids[idx + 1]
    }
    setMarks((prev) => ({ ...prev, [date]: next }))
  }

  const summary = useMemo(() => {
    const s: Record<string, number> = {}
    for (const [date, tid] of Object.entries(marks)) {
      if (tid == null) continue
      const t = typeMap.get(Number(tid))
      if (!t) continue
      s[t.type] = (s[t.type] || 0) + 1
    }
    return s
  }, [marks, typeMap])

  const attendancePct = useMemo(() => {
    if (!isViewer) return null
    let onTime = 0
    let total = 0
    for (const [, tid] of Object.entries(marks)) {
      if (tid == null) continue
      const t = typeMap.get(Number(tid))
      if (!t) continue
      const n = t.type.toLowerCase()
      total++
      if (n === "present" || n === "late") onTime++
    }
    if (!total) return null
    return Math.round((onTime / total) * 100)
  }, [isViewer, marks, typeMap])

  const selectedStudent: SelectedStudent = useMemo(() => {
    if (role === "student") return { id: 0, name: me?.name || "You" }
    if (role === "parent") return kids.find((k) => String(k.id) === studentId) || null
    return students.find((s) => String(s.id) === studentId) || null
  }, [role, me, kids, studentId, students])

  const handleSave = async () => {
    const sid = Number(studentId)
    if (!sid || !classId || !sectionId) return
    const target: {
      studentId: number
      classId: number
      sectionId: number
      date: string
      attendanceTypeId: number
      status: string | null
      inTime: string | null
      outTime: string | null
    }[] = []
    const deletes: number[] = []
    for (const [date, typeId] of Object.entries(marks)) {
      if (!date.startsWith(month)) continue
      const existing = records.find((r) => Number(r.studentId) === sid && r.date.slice(0, 10) === date)
      if (typeId == null) {
        if (existing?.id) deletes.push(existing.id)
        continue
      }
      if (existing && Number(existing.attendanceTypeId) === Number(typeId)) continue
      const t = typeMap.get(Number(typeId))
      const off = !t || /absent|holiday|half/.test(t.type.toLowerCase())
      target.push({
        studentId: sid,
        classId: Number(classId),
        sectionId: Number(sectionId),
        date,
        attendanceTypeId: Number(typeId),
        status: t?.type ?? null,
        inTime: off ? null : "09:00",
        outTime: off ? null : "15:00",
      })
    }
    if (target.length === 0 && deletes.length === 0) {
      setSaved("No changes to save for this month")
      return
    }
    setSaving(true)
    setError("")
    setSaved("")
    try {
      if (target.length) {
        const res = await fetch("/api/attendance/student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(target),
        })
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error((e as { error?: string })?.error || "Failed to save attendance")
        }
      }
      if (deletes.length) {
        await Promise.all(deletes.map((id) => fetch(`/api/attendance/student?id=${id}`, { method: "DELETE" })))
      }
      setSaved(`Attendance saved for ${month} (${target.length} update${target.length === 1 ? "" : "s"})`)
      await loadClass()
    } catch (e: any) {
      setError(e?.message || "Network error")
    } finally {
      setSaving(false)
    }
  }

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
        throw new Error((e as { error?: string })?.error || "Failed to save note")
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

  const subtitle = canMark
    ? "Mark student attendance and add personal notes on the calendar"
    : role === "parent"
      ? "View your child's attendance and personal notes on the calendar"
      : "View your attendance and add personal notes on the calendar"

  const selectCls =
    "px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:outline-none disabled:opacity-50 w-full sm:w-auto"
  const ghostBtn =
    "inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 border border-[var(--border)] bg-[var(--card)] px-3 py-2 rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
  const iconBtn =
    "p-2 rounded-lg text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] border border-transparent hover:border-[var(--primary)]/20 transition-colors"

  if (!role)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
      </div>
    )

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[var(--title-color)]">Attendance Calendar</h2>
            <p className="text-sm text-[var(--subtitle-color)] mt-1">{subtitle}</p>
          </div>
          <Link
            href={canMark ? "/admin" : "/portal"}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--subtitle-color)] hover:text-[var(--primary)] px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] hover:bg-[var(--primary-light)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        <div className="glass-panel rounded-xl p-4 sm:p-5">
          <div className="text-sm font-semibold text-[var(--title-color)] mb-3">Select Student</div>
          <div className="flex flex-wrap items-end gap-3">
            {role === "parent" && (
              <label className="block">
                <span className="block text-xs font-medium text-[var(--subtitle-color)] mb-1.5">Child</span>
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={selectCls}>
                  <option value="">Select child</option>
                  {kids.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                      {k.class ? ` · ${k.class}${k.section ? `-${k.section}` : ""}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {canMark && (
              <>
                <label className="block">
                  <span className="block text-xs font-medium text-[var(--subtitle-color)] mb-1.5">Class</span>
                  <select
                    value={classId}
                    onChange={(e) => {
                      setClassId(e.target.value)
                      setSectionId("")
                      setStudentId("")
                    }}
                    className={selectCls}
                  >
                    <option value="">Select class</option>
                    {classOptions.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-[var(--subtitle-color)] mb-1.5">Section</span>
                  <select
                    value={sectionId}
                    onChange={(e) => {
                      setSectionId(e.target.value)
                      setStudentId("")
                    }}
                    disabled={!classId}
                    className={selectCls}
                  >
                    <option value="">Select section</option>
                    {sectionOptions.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-[var(--subtitle-color)] mb-1.5">Student</span>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={!sectionId || students.length === 0}
                    className={selectCls}
                  >
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.rollNo != null && s.rollNo !== "" ? ` · Roll ${s.rollNo}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {role === "student" && (
              <p className="text-sm text-[var(--subtitle-color)] py-2">
                Showing attendance for <span className="font-medium text-[var(--title-color)]">{me?.name || "you"}</span>.
                Use the pencil on any day to add a personal note.
              </p>
            )}
          </div>

          {selectedStudent && role !== "student" && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--primary-light)] px-3 py-1 text-sm text-[var(--primary)]">
              <span className="font-semibold">{selectedStudent.name}</span>
              {selectedStudent.rollNo != null && selectedStudent.rollNo !== "" && <span>· Roll {selectedStudent.rollNo}</span>}
              {selectedStudent.class ? <span>· {selectedStudent.class}{selectedStudent.section ? `-${selectedStudent.section}` : ""}</span> : null}
            </div>
          )}
        </div>

        {isViewer && lowLimit != null && attendancePct != null && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
              attendancePct >= lowLimit
                ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            }`}
          >
            {attendancePct >= lowLimit ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            {attendancePct >= lowLimit
              ? `Attendance at par — ${attendancePct}% (required minimum ${lowLimit}%).`
              : `Low attendance — your attendance is ${attendancePct}%, below the school's required minimum of ${lowLimit}%.`}
          </div>
        )}

        {Object.keys(summary).length > 0 && (
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

        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
            <button onClick={() => shiftMonth(-1)} className={iconBtn} title="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center min-w-0">
              <div className="text-lg font-bold text-[var(--title-color)]">{monthLabel}</div>
              <div className="text-xs text-[var(--subtitle-color)] hidden sm:block">
                {canMark ? "Click a day to cycle the attendance status" : "Days are color coded by attendance status"} · click
                the pencil to add a personal note
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

          <div className="grid grid-cols-7 gap-1.5 p-3">
            {cells.map((c, i) => {
              if (c.day === 0) return <div key={`e${i}`} aria-hidden="true" />
              const st = statusOf(c.date)
              const stl = st ? statusStyles(st.type) : null
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
                    {canMark ? (
                      <button
                        type="button"
                        onClick={() => cycleDate(c.date)}
                        title={st ? `Status: ${st.type} — click to change` : "Click to mark status"}
                        className="flex flex-col items-start gap-0.5 min-w-0 text-left"
                      >
                        <span className={`text-sm font-semibold ${st ? "" : "text-[var(--subtitle-color)]"}`}>{c.day}</span>
                        {st && (
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${statusStyles(st.type).badge}`}>
                            {shortName(st.type)}
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="flex flex-col items-start gap-0.5 min-w-0">
                        <span className={`text-sm font-semibold ${st ? "" : "text-[var(--subtitle-color)]"}`}>{c.day}</span>
                        {st && (
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${statusStyles(st.type).badge}`}>
                            {shortName(st.type)}
                          </span>
                        )}
                      </div>
                    )}
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

          {canMark && students.length === 0 && !loading && (
            <div className="px-4 pb-5 flex flex-col items-center text-center gap-2">
              <CalendarDays className="h-8 w-8 text-[var(--primary-light)]" />
              <p className="text-sm text-[var(--subtitle-color)]">No students found for the selected class &amp; section.</p>
            </div>
          )}

          <div className="px-4 py-3 border-t border-[var(--border)] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--subtitle-color)]">
            <span className="font-semibold text-[var(--title-color)]">Legend:</span>
            {types.map((t) => (
              <span key={t.id} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${legendDot(t.type)}`} />
                {t.type}
              </span>
            ))}
            {isViewer && (
              <span className="inline-flex items-center gap-1.5">
                <NotebookPen className="h-3 w-3" />
                Note
              </span>
            )}
            {canMark && <span className="ml-auto inline-flex items-center gap-1.5 text-[var(--primary)]">Click a day to mark / cycle</span>}
          </div>
        </div>

        {canMark && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || loading || !studentId}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Attendance
            </button>
            {saved && <span className="text-sm text-green-600">{saved}</span>}
          </div>
        )}

        {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

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
    </div>
  )
}