"use client"

import { useState, useEffect, useCallback } from "react"
import { BookOpen, Loader2 } from "lucide-react"

type Role = "student" | "parent" | "teacher" | ""

function useRole() {
  const [role, setRole] = useState<Role>("")
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d.user?.role || ""))
      .catch(() => {})
  }, [])
  return role
}

export default function PortalHomework() {
  const role = useRole()
  const [kids, setKids] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [studentId, setStudentId] = useState("")
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [subject, setSubject] = useState("")
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
    if (role === "student") url = `/api/my/student/homework${subject ? `?subjectId=${encodeURIComponent(subject)}` : ""}`
    if (role === "parent") {
      if (!studentId) return
      url = `/api/my/parent/kids/homework?studentId=${encodeURIComponent(studentId)}`
    }
    if (role === "teacher") {
      if (!classId || !sectionId) return
      url = `/api/my/teacher/homework?classId=${classId}&sectionId=${sectionId}`
    }
    if (!url) return
    try {
      const res = await fetch(url)
      const d = await res.json()
      if (d.error) setError(d.error)
      else setList(d.homework || [])
    } catch {
      setError("Failed to load homework")
    } finally {
      setLoading(false)
    }
  }, [role, subject, studentId, classId, sectionId])

  useEffect(() => {
    if (role) load()
  }, [role, load])

  const [form, setForm] = useState({ subjectName: "", homeworkDate: "", submissionDate: "", description: "" })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState("")

  const addHomework = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved("")
    try {
      const res = await fetch("/api/my/teacher/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: Number(classId),
          sectionId: Number(sectionId),
          subjectName: form.subjectName || null,
          homeworkDate: form.homeworkDate || new Date().toISOString().slice(0, 10),
          submissionDate: form.submissionDate || null,
          description: form.description,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error || "Failed to add homework")
      } else {
        setSaved("Homework added")
        setForm({ subjectName: "", homeworkDate: "", submissionDate: "", description: "" })
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
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Homework</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">
          {role === "teacher"
            ? "Homework for your assigned classes"
            : role === "parent"
              ? "Homework assigned to your children"
              : "Homework assigned to your class"}
        </p>
      </div>

      {role === "parent" && (
        <div className="flex items-center gap-3 flex-wrap">
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
        </div>
      )}

      {role === "teacher" && (
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium text-[var(--foreground)]">Class</label>
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
        </div>
      )}

      {role === "student" && (
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Filter by subject (e.g. Mathematics)"
          className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)] w-full sm:w-64"
        />
      )}

      {role === "teacher" && (
        <form onSubmit={addHomework} className="glass-panel rounded-xl p-5 space-y-3">
          <h3 className="text-lg font-semibold text-[var(--title-color)]">Add Homework</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={form.subjectName}
              onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
              placeholder="Subject name"
              className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            />
            <input
              type="date"
              value={form.homeworkDate}
              onChange={(e) => setForm({ ...form, homeworkDate: e.target.value })}
              className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            />
            <input
              type="date"
              value={form.submissionDate}
              onChange={(e) => setForm({ ...form, submissionDate: e.target.value })}
              className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Homework description"
            required
            rows={3}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Homework
            </button>
            {saved && <span className="text-sm text-green-600">{saved}</span>}
          </div>
        </form>
      )}

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-[var(--subtitle-color)] p-5">Loading…</p>
        ) : list.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-center gap-2">
            <BookOpen className="h-10 w-10 text-[var(--primary-light)]" />
            <p className="text-sm text-[var(--subtitle-color)]">No homework found.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {list.map((h) => (
              <div key={h.id} className="p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--primary)]">{h.subject || "General"}</span>
                    <span className="text-xs text-[var(--subtitle-color)]">
                      {h.homeworkDate}
                      {h.submissionDate ? ` · submit by ${h.submissionDate}` : ""}
                    </span>
                  </div>
                  {h.className && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
                      {h.className}-{h.sectionName}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[var(--foreground)] whitespace-pre-wrap">{h.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
