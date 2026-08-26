"use client"

import { useState, useEffect, useCallback } from "react"
import { FileSpreadsheet } from "lucide-react"

export default function PortalExams() {
  const [role, setRole] = useState("")
  const [kids, setKids] = useState<any[]>([])
  const [studentId, setStudentId] = useState("")
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d.user?.role || ""))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (role !== "parent") return
    fetch("/api/my/parent/kids")
      .then((r) => r.json())
      .then((d) => {
        const kidsList = d.kids || []
        setKids(kidsList)
        const qs = new URLSearchParams(window.location.search).get("studentId")
        setStudentId(qs || (kidsList[0] ? String(kidsList[0].id) : ""))
      })
      .catch(() => {})
  }, [role])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    let url = ""
    if (role === "student") url = "/api/my/student/exams"
    if (role === "parent") {
      if (!studentId) return
      url = `/api/my/parent/kids/exams?studentId=${encodeURIComponent(studentId)}`
    }
    if (!url) return
    try {
      const res = await fetch(url)
      const d = await res.json()
      if (d.error) setError(d.error)
      else setRows(d.results || [])
    } catch {
      setError("Failed to load results")
    } finally {
      setLoading(false)
    }
  }, [role, studentId])

  useEffect(() => {
    if (role) load()
  }, [role, load])

  const byExam: { name: string; published: boolean; subjects: any[] }[] = []
  for (const r of rows) {
    let exam = byExam.find((e) => e.name === r.examName)
    if (!exam) {
      exam = { name: r.examName || `Exam #${r.examId}`, published: !!r.published, subjects: [] }
      byExam.push(exam)
    }
    exam.subjects.push(r)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Exam Results</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">
          {role === "parent" ? "Published results for your children" : "Your published exam results"}
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

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-sm text-[var(--subtitle-color)]">Loading…</p>
      ) : byExam.length === 0 ? (
        <div className="glass-panel rounded-xl p-10 flex flex-col items-center text-center gap-2">
          <FileSpreadsheet className="h-10 w-10 text-[var(--primary-light)]" />
          <p className="text-sm text-[var(--subtitle-color)]">No results published yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {byExam.map((exam) => (
            <div key={exam.name} className="glass-panel rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="font-semibold text-[var(--title-color)]">{exam.name}</h3>
                {!exam.published && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                    Not published yet
                  </span>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--subtitle-color)] border-b border-[var(--border)]">
                    <th className="px-5 py-2.5 font-medium">Subject</th>
                    <th className="px-5 py-2.5 font-medium">Theory</th>
                    <th className="px-5 py-2.5 font-medium">Practical</th>
                    <th className="px-5 py-2.5 font-medium">Total</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {exam.subjects.map((s, i) => {
                    const total = (Number(s.theoryMarks) || 0) + (Number(s.practicalMarks) || 0)
                    return (
                      <tr key={i}>
                        <td className="px-5 py-2.5 font-medium text-[var(--foreground)]">{s.subject || "—"}</td>
                        <td className="px-5 py-2.5 text-[var(--foreground)]">{s.absent ? "—" : (s.theoryMarks ?? 0)}</td>
                        <td className="px-5 py-2.5 text-[var(--foreground)]">{s.absent ? "—" : (s.practicalMarks ?? 0)}</td>
                        <td className="px-5 py-2.5 text-[var(--foreground)]">{s.absent ? "—" : total}</td>
                        <td className="px-5 py-2.5">
                          {s.absent ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Absent</span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Pass</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
