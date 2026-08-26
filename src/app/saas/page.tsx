"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { School, Users, GraduationCap, UserCog, Activity, ArrowRight, Loader2 } from "lucide-react"

type Stats = {
  schools: number
  users: number
  students: number
  staff: number
  activeSchools: number
  recentSchools: { id: number; name: string; code: string; email: string; plan: string; status: string; created_at: string }[]
}

export default function SaasDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/saas/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setError("Failed to load stats"))
  }, [])

  const cards = stats
    ? [
        { label: "Total Schools", value: stats.schools, icon: School, color: "bg-[var(--primary)]" },
        { label: "Active Schools", value: stats.activeSchools, icon: Activity, color: "bg-emerald-500" },
        { label: "Users", value: stats.users, icon: Users, color: "bg-blue-500" },
        { label: "Students", value: stats.students, icon: GraduationCap, color: "bg-violet-500" },
        { label: "Staff", value: stats.staff, icon: UserCog, color: "bg-amber-500" },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--title-color)]">Overview</h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">Monitor every school from a single dashboard</p>
        </div>
        <Link
          href="/saas/schools"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90"
        >
          <School className="h-4 w-4" />
          Manage Schools
        </Link>
      </div>

      {!stats && !error && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="glass-panel rounded-2xl p-5">
                <div className={`h-11 w-11 rounded-xl ${c.color} flex items-center justify-center text-white mb-4`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-bold text-[var(--title-color)]">{c.value.toLocaleString()}</p>
                <p className="text-sm text-[var(--subtitle-color)] mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--title-color)]">Recent Schools</h3>
              <Link href="/saas/schools" className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--subtitle-color)] border-b border-[var(--border)]">
                    <th className="py-2.5 font-medium">School</th>
                    <th className="py-2.5 font-medium">Code</th>
                    <th className="py-2.5 font-medium">Plan</th>
                    <th className="py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSchools.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-[var(--foreground)]">{s.name}</p>
                        <p className="text-xs text-[var(--subtitle-color)]">{s.email || "—"}</p>
                      </td>
                      <td className="py-3 font-mono text-xs">{s.code}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--primary-light)] text-[var(--primary)]">
                          {s.plan}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs ${
                            s.status === "Active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" : "bg-red-50 text-red-600 dark:bg-red-950/40"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
