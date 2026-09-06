"use client"

import { useState, useEffect, useCallback } from "react"
import { ClipboardList, Loader2, Send } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
}

export default function PortalLeave() {
  const [role, setRole] = useState("")
  const [kids, setKids] = useState<any[]>([])
  const [studentId, setStudentId] = useState("")
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ leaveTypeId: "", fromDate: "", toDate: "", reason: "" })
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState("")

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
        setStudentId(kidsList[0] ? String(kidsList[0].id) : "")
      })
      .catch(() => {})
  }, [role])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/my/leave")
      const d = await res.json()
      if (d.error) setError(d.error)
      else setLeaves(d.leaves || [])
    } catch {
      setError("Failed to load leave records")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch("/api/attendance/leave-type")
      .then((r) => r.json())
      .then((d) => setLeaveTypes(Array.isArray(d) ? d : []))
      .catch(() => {})
    if (role) load()
  }, [role, load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fromDate || !form.reason) return
    setSaving(true)
    setSavedMsg("")
    setError("")
    try {
      const res = await fetch("/api/my/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveTypeId: form.leaveTypeId ? Number(form.leaveTypeId) : undefined,
          fromDate: form.fromDate,
          toDate: form.toDate || undefined,
          reason: form.reason,
          ...(role === "parent" && studentId ? { studentId: Number(studentId) } : {}),
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Failed to apply for leave")
      setSavedMsg("Leave application submitted")
      setForm({ leaveTypeId: "", fromDate: "", toDate: "", reason: "" })
      load()
    } catch (e: any) {
      setError(e.message || "Failed to apply for leave")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Leave</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">
          {role === "parent" ? "Apply for leave on behalf of your children" : "Apply for leave"}
        </p>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}
      {savedMsg && <div className="rounded-xl bg-green-50 dark:bg-green-950/40 px-4 py-3 text-sm text-green-700">{savedMsg}</div>}

      <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-5 max-w-2xl space-y-4">
        <h3 className="text-base font-semibold text-[var(--title-color)]">New Leave Application</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {role === "parent" && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Child</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
              >
                {kids.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} · {k.class}-{k.section}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Leave Type</label>
            <select
              value={form.leaveTypeId}
              onChange={(e) => setForm((p) => ({ ...p, leaveTypeId: e.target.value }))}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">Select type</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.type || t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">From Date</label>
            <input
              type="date"
              required
              value={form.fromDate}
              onChange={(e) => setForm((p) => ({ ...p, fromDate: e.target.value }))}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">To Date</label>
            <input
              type="date"
              value={form.toDate}
              onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Reason</label>
          <textarea
            required
            rows={3}
            value={form.reason}
            onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            placeholder="Write the reason for leave..."
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit Application
        </button>
      </form>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--title-color)]">My Leave Applications</h3>
          <span className="text-xs text-[var(--subtitle-color)]">
            {loading ? "Loading…" : `${leaves.length} application${leaves.length === 1 ? "" : "s"}`}
          </span>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--subtitle-color)] p-5 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : leaves.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-center gap-2">
            <ClipboardList className="h-10 w-10 text-[var(--primary-light)]" />
            <p className="text-sm text-[var(--subtitle-color)]">No leave applications yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--subtitle-color)] border-b border-[var(--border)]">
                <th className="px-5 py-2.5 font-medium">Type</th>
                <th className="px-5 py-2.5 font-medium">From</th>
                <th className="px-5 py-2.5 font-medium">To</th>
                <th className="px-5 py-2.5 font-medium">Days</th>
                <th className="px-5 py-2.5 font-medium">Reason</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {leaves.map((l) => (
                <tr key={l.id}>
                  <td className="px-5 py-2.5 font-medium text-[var(--foreground)]">{l.leaveType || "—"}</td>
                  <td className="px-5 py-2.5 text-[var(--foreground)]">{l.fromDate || "—"}</td>
                  <td className="px-5 py-2.5 text-[var(--foreground)]">{l.toDate || "—"}</td>
                  <td className="px-5 py-2.5 text-[var(--foreground)]">{l.days ?? 1}</td>
                  <td className="px-5 py-2.5 text-[var(--subtitle-color)] max-w-[260px] truncate">{l.reason || "—"}</td>
                  <td className="px-5 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[l.status] || "bg-gray-100 text-gray-600"}`}>
                      {l.status || "—"}
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