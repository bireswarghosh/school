"use client"

import { useState, useEffect, useCallback } from "react"
import { GraduationCap } from "lucide-react"

export default function PortalStudents() {
  const [classes, setClasses] = useState<any[]>([])
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
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
      .catch(() => setError("Failed to load classes"))
  }, [])

  const load = useCallback(async () => {
    if (!classId || !sectionId) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/my/teacher/students?classId=${classId}&sectionId=${sectionId}`)
      const d = await res.json()
      if (d.error) setError(d.error)
      else setStudents(d.students || [])
    } catch {
      setError("Failed to load students")
    } finally {
      setLoading(false)
    }
  }, [classId, sectionId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Students</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">Students in your assigned class</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
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

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-[var(--subtitle-color)] p-5">Loading…</p>
        ) : students.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-center gap-2">
            <GraduationCap className="h-10 w-10 text-[var(--primary-light)]" />
            <p className="text-sm text-[var(--subtitle-color)]">No students found in this class.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--subtitle-color)] border-b border-[var(--border)]">
                <th className="px-5 py-2.5 font-medium">Roll</th>
                <th className="px-5 py-2.5 font-medium">Admission No</th>
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Gender</th>
                <th className="px-5 py-2.5 font-medium">DOB</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-2.5 text-[var(--foreground)]">{s.rollNo ?? "—"}</td>
                  <td className="px-5 py-2.5 text-[var(--foreground)]">{s.admissionNo || "—"}</td>
                  <td className="px-5 py-2.5 font-medium text-[var(--foreground)]">{s.name}</td>
                  <td className="px-5 py-2.5 text-[var(--foreground)]">{s.gender || "—"}</td>
                  <td className="px-5 py-2.5 text-[var(--foreground)]">{s.dob || "—"}</td>
                  <td className="px-5 py-2.5">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.status || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
