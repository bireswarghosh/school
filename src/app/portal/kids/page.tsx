"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, CalendarDays, Wallet, BookOpen, FileSpreadsheet } from "lucide-react"

const LINKS = [
  { label: "Attendance", href: "/portal/attendance", icon: CalendarDays },
  { label: "Fees & Payments", href: "/portal/fees", icon: Wallet },
  { label: "Homework", href: "/portal/homework", icon: BookOpen },
  { label: "Exam Results", href: "/portal/exams", icon: FileSpreadsheet },
]

export default function PortalKids() {
  const [kids, setKids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/my/parent/kids")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setKids(d.kids || [])
      })
      .catch(() => setError("Failed to load children"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">My Kids</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">Students linked to your login</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-sm text-[var(--subtitle-color)]">Loading…</p>
      ) : kids.length === 0 ? (
        <div className="glass-panel rounded-xl p-10 flex flex-col items-center text-center gap-2">
          <Users className="h-10 w-10 text-[var(--primary-light)]" />
          <p className="text-sm text-[var(--subtitle-color)]">
            No students are linked to your login yet. Ask the school to link your child.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kids.map((k) => (
            <div key={k.id} className="glass-panel rounded-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[var(--title-color)]">{k.name}</h3>
                  <p className="text-xs text-[var(--subtitle-color)] mt-0.5">
                    {k.class}-{k.section}
                    {k.rollNo != null ? ` · Roll ${k.rollNo}` : ""}
                    {k.admissionNo ? ` · ${k.admissionNo}` : ""}
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
                  {k.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={`${l.href}?studentId=${k.id}`}
                    className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--secondary)] px-3 py-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors"
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
