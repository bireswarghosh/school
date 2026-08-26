"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"

export default function PortalNotices() {
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/my/student/notices")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setNotices(d.notices || [])
      })
      .catch(() => setError("Failed to load notices"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">Notices</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">School announcements</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-sm text-[var(--subtitle-color)]">Loading…</p>
      ) : notices.length === 0 ? (
        <div className="glass-panel rounded-xl p-10 flex flex-col items-center text-center gap-2">
          <Bell className="h-10 w-10 text-[var(--primary-light)]" />
          <p className="text-sm text-[var(--subtitle-color)]">No notices published.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <div key={n.id} className="glass-panel rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-[var(--title-color)]">{n.title}</h3>
                <span className="text-xs text-[var(--subtitle-color)] shrink-0">{n.publishDate || n.noticeDate}</span>
              </div>
              {n.message && <p className="mt-2 text-sm text-[var(--foreground)] whitespace-pre-wrap">{n.message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
