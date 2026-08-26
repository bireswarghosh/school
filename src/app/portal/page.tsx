"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, CalendarDays, FileSpreadsheet, Users, Wallet, GraduationCap } from "lucide-react"

export default function PortalDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    fetch("/api/my/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load dashboard")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const role = data?.role || ""

  const cards: any[] = []
  if (role === "student") {
    const s = data?.summary || {}
    cards.push(
      { label: "Homework", value: s.homework ?? 0, sub: "Assigned to your class", href: "/portal/homework", icon: BookOpen, color: "bg-blue-500" },
      { label: "Today's Attendance", value: s.attendanceToday ?? 0, sub: "Records today", href: "/portal/attendance", icon: CalendarDays, color: "bg-green-500" },
      { label: "Exam Results", value: s.results ?? 0, sub: "Published subjects", href: "/portal/exams", icon: FileSpreadsheet, color: "bg-purple-500" },
    )
  } else if (role === "parent") {
    const s = data?.summary || {}
    cards.push(
      { label: "My Kids", value: s.kids ?? 0, sub: "Linked students", href: "/portal/kids", icon: Users, color: "bg-blue-500" },
      { label: "Homework", value: s.homework ?? 0, sub: "Across your kids", href: "/portal/homework", icon: BookOpen, color: "bg-purple-500" },
      { label: "Fees Balance", value: `₹${(s.feesBalance ?? 0).toLocaleString("en-IN")}`, sub: "Total outstanding", href: "/portal/fees", icon: Wallet, color: "bg-orange-500" },
    )
  } else if (role === "teacher") {
    const s = data?.summary || {}
    cards.push(
      { label: "My Classes", value: s.classes ?? 0, sub: "Assigned to you", href: "/portal/classes", icon: Users, color: "bg-blue-500" },
      { label: "Students", value: s.students ?? 0, sub: "Across your classes", href: "/portal/students", icon: GraduationCap, color: "bg-green-500" },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">
          {loading ? "Welcome" : `Welcome, ${data?.name || "User"}`}
        </h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">
          {role ? `Signed in as ${role.replace(/_/g, " ")}` : "Your self-service portal"}
          {data?.className ? ` · ${data.className}` : ""}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--subtitle-color)]">Loading dashboard…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="glass-panel rounded-xl p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--subtitle-color)]">{c.label}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${c.color}`} />
              </div>
              <span className="text-2xl font-bold text-[var(--title-color)]">{c.value}</span>
              <p className="text-xs text-[var(--subtitle-color)] mt-1">{c.sub}</p>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-lg font-semibold text-[var(--title-color)] mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {cards.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--secondary)] px-3 py-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors"
              >
                <c.icon className="h-4 w-4" />
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
