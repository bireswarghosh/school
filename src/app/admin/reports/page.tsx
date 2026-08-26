"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, Users, CalendarCheck, Wallet, Contact, GraduationCap, Laptop, BookOpen, Package, NotebookPen, ArrowRight, BarChart3 } from "lucide-react"
import { REPORT_GROUPS, reportPath, type ReportGroup } from "@/lib/report-registry"

const GROUP_ICONS: Record<string, any> = {
  "Student Information": Users,
  "Attendance": CalendarCheck,
  "Finance": Wallet,
  "Human Resource": Contact,
  "Examinations": GraduationCap,
  "Online Examinations": Laptop,
  "Library": BookOpen,
  "Inventory": Package,
  "Lesson Plan": NotebookPen,
  "Alumni": GraduationCap,
}

export default function ReportsPage() {
  const [query, setQuery] = useState("")

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return REPORT_GROUPS
    return REPORT_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (it) => it.label.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length > 0)
  }, [query])

  const total = useMemo(() => REPORT_GROUPS.reduce((n, g) => n + g.items.length, 0), [])

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
    }
  }, [])

  const renderGroup = (g: (ReportGroup & { items: ReportGroup["items"] })) => {
    const Icon = GROUP_ICONS[g.label] || BarChart3
    return (
      <section key={g.slug} id={g.slug} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden scroll-mt-24">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">{g.label}</h3>
              <p className="text-xs text-gray-400">{g.items.length} reports</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
          {g.items.map((it) => (
            <Link
              key={it.slug}
              href={reportPath(it.slug)}
              className="group relative rounded-xl border border-gray-200 p-4 hover:border-[var(--primary)] hover:shadow-md transition-all bg-white"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-[var(--primary-light)] group-hover:text-[var(--primary)] transition-colors">
                  <BarChart3 className="h-4 w-4" />
                </span>
                {it.stub ? (
                  <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-medium">SOON</span>
                ) : (
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[var(--primary)] transition-colors" />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-800 group-hover:text-[var(--primary)] transition-colors">
                {it.label}
              </p>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed">{it.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Reports</h2>
          <p className="text-sm text-white/80 mt-1">All school reports · {total} reports in {REPORT_GROUPS.length} categories</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-10 text-center text-gray-400">
          No reports match your search.
        </div>
      ) : (
        groups.map(renderGroup)
      )}
    </div>
  )
}
