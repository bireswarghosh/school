"use client"

import { useState, useEffect, useCallback } from "react"
import { Library as LibraryIcon, Loader2 } from "lucide-react"

export default function PortalLibrary() {
  const [role, setRole] = useState("")
  const [kids, setKids] = useState<any[]>([])
  const [studentId, setStudentId] = useState("")
  const [data, setData] = useState<any>(null)
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
    try {
      const url =
        role === "parent"
          ? `/api/my/parent/kids/library?studentId=${encodeURIComponent(studentId)}`
          : "/api/my/student/library"
      const res = await fetch(url)
      const d = await res.json()
      if (d.error) setError(d.error)
      else setData(d)
    } catch {
      setError("Failed to load library records")
    } finally {
      setLoading(false)
    }
  }, [role, studentId])

  useEffect(() => {
    if (role) load()
  }, [role, load])

  const summary: Record<string, number> = data?.summary || {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Library</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">
          {role === "parent" ? "Books issued to your children" : "Books issued to you"}
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

      {summary && Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl">
          <div className="glass-panel rounded-xl p-4">
            <p className="text-xs text-[var(--subtitle-color)]">Total Issues</p>
            <p className="text-xl font-bold text-[var(--title-color)] mt-1">{summary.total ?? 0}</p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="text-xs text-[var(--subtitle-color)]">Currently Issued</p>
            <p className="text-xl font-bold text-[var(--primary)] mt-1">{summary.currentlyIssued ?? 0}</p>
          </div>
        </div>
      )}

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-[var(--subtitle-color)] p-5 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : !data || (data.books || []).length === 0 ? (
          <div className="p-10 flex flex-col items-center text-center gap-2">
            <LibraryIcon className="h-10 w-10 text-[var(--primary-light)]" />
            <p className="text-sm text-[var(--subtitle-color)]">No books issued yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--subtitle-color)] border-b border-[var(--border)]">
                <th className="px-5 py-2.5 font-medium">Book</th>
                <th className="px-5 py-2.5 font-medium">Book No</th>
                <th className="px-5 py-2.5 font-medium">Author</th>
                <th className="px-5 py-2.5 font-medium">Issued</th>
                <th className="px-5 py-2.5 font-medium">Due / Return</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(data.books || []).map((b: any, i: number) => (
                <tr key={b.id ?? i}>
                  <td className="px-5 py-2.5 font-medium text-[var(--foreground)]">{b.book || "—"}</td>
                  <td className="px-5 py-2.5 text-[var(--foreground)]">{b.bookNumber || "—"}</td>
                  <td className="px-5 py-2.5 text-[var(--subtitle-color)]">{b.author || "—"}</td>
                  <td className="px-5 py-2.5 text-[var(--foreground)]">{b.issueDate || "—"}</td>
                  <td className="px-5 py-2.5 text-[var(--foreground)]">{b.returnDate || "—"}</td>
                  <td className="px-5 py-2.5">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        b.status === "Issued" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {b.status || "—"}
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