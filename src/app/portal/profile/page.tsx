"use client"

import { useState, useEffect } from "react"
import { User } from "lucide-react"

export default function PortalProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/my/student/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setProfile(d)
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false))
  }, [])

  const rows: [string, string][] = profile
    ? [
        ["Admission No", profile.admissionNo || "—"],
        ["Roll No", profile.rollNo != null ? String(profile.rollNo) : "—"],
        ["Name", profile.name || "—"],
        ["Email", profile.email || "—"],
        ["Gender", profile.gender || "—"],
        ["Date of Birth", profile.dob || "—"],
        ["Class", profile.className ? `${profile.className}-${profile.sectionName}` : "—"],
        ["Status", profile.status || "—"],
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">My Profile</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">Your student details</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-sm text-[var(--subtitle-color)]">Loading…</p>
      ) : profile ? (
        <div className="glass-panel rounded-xl overflow-hidden max-w-2xl">
          <div className="px-5 py-4 flex items-center gap-3 border-b border-[var(--border)]">
            <div className="h-12 w-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--title-color)]">{profile.name}</h3>
              <p className="text-xs text-[var(--subtitle-color)]">
                {profile.className}-{profile.sectionName} · {profile.admissionNo || "No admission no"}
              </p>
            </div>
          </div>
          <dl className="divide-y divide-[var(--border)]">
            {rows.map(([k, v]) => (
              <div key={k} className="px-5 py-3 flex items-center justify-between gap-4">
                <dt className="text-sm text-[var(--subtitle-color)]">{k}</dt>
                <dd className="text-sm font-medium text-[var(--foreground)]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  )
}
