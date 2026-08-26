"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { menuData } from "@/lib/menu-data"
import { useSession } from "@/lib/session-context"
import { useCurrency } from "@/lib/currency-context"
import {
  ArrowLeft,
  Plus,
  Download,
  Upload,
  Filter,
  Search,
  Calendar,
} from "lucide-react"
import Link from "next/link"

function findSubItem(path: string) {
  for (const category of menuData) {
    for (const item of category.items) {
      if (item.path === path) {
        return { category: category.label, item: item.label }
      }
    }
  }
  return null
}

export default function AdminPage() {
  const pathname = usePathname()
  const info = findSubItem(pathname)
  const isDashboard = pathname === "/admin"

  if (isDashboard) {
    return <DashboardContent />
  }

  const title = info?.item || "Page"
  const category = info?.category || ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {category} / {title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <button className="flex items-center gap-1.5 text-sm text-white bg-[var(--primary)] hover:bg-[var(--secondary)] px-4 py-1.5 rounded-lg transition-colors">
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent w-52"
              />
            </div>
            <button className="flex items-center gap-1.5 text-sm text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-sm text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button className="flex items-center gap-1.5 text-sm text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-full bg-[var(--primary-light)] flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-[var(--primary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 max-w-md">
            This is the {title} section under {category}. Use the &quot;Add New&quot; button to create
            records, or import data from a file.
          </p>
        </div>
      </div>
    </div>
  )
}

function DashboardContent() {
  const { current } = useSession()
  const { symbol } = useCurrency()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [current?.id])

  const sessionName = data?.session?.name ?? current?.name ?? "—"
  const feesCollected = data?.stats?.feesCollected ?? 0

  const stats = [
    {
      label: "Total Students",
      value: loading ? "…" : (data?.stats?.totalStudents ?? 0).toLocaleString(),
      sub: `Enrolled in ${sessionName}`,
      color: "bg-blue-500",
    },
    {
      label: "Total Staff",
      value: loading ? "…" : (data?.stats?.totalStaff ?? 0).toLocaleString(),
      sub: "All departments",
      color: "bg-green-500",
    },
    {
      label: "Fees Collected",
      value: loading ? "…" : `${symbol}${feesCollected.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      sub: `In ${sessionName}`,
      color: "bg-purple-500",
    },
    {
      label: "Active Exams",
      value: loading ? "…" : (data?.stats?.activeExams ?? 0).toLocaleString(),
      sub: `In ${sessionName}`,
      color: "bg-orange-500",
    },
    {
      label: "Pending Leave Requests",
      value: loading ? "…" : (data?.stats?.pendingLeaves ?? 0).toLocaleString(),
      sub: "Awaiting approval",
      color: "bg-red-500",
    },
  ]

  const recentStudents = data?.recentStudents ?? []
  const recentFees = data?.recentFees ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, Super Admin. Here&apos;s what&apos;s happening at Mount Carmel School.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-light)] px-4 py-1.5 text-sm font-semibold text-[var(--primary)]">
          <Calendar className="h-4 w-4" />
          Current Session: {sessionName}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${stat.color}`} />
            </div>
            <span className="text-2xl font-bold text-gray-800">{stat.value}</span>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Student Admission", path: "/admin/student-information/student-admission" },
              { label: "Collect Fees", path: "/admin/fees-collection/collect-fees" },
              { label: "Add Homework", path: "/admin/homework/add-homework" },
              { label: "Staff Directory", path: "/admin/human-resource/staff-directory" },
              { label: "Notice Board", path: "/admin/communicate/notice-board" },
              { label: "Book List", path: "/admin/library/book-list" },
            ].map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className="text-sm text-[var(--primary)] hover:text-[var(--secondary)] hover:underline py-2 px-3 rounded-lg hover:bg-[var(--primary-light)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Latest Students · {sessionName}
          </h3>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : recentStudents.length === 0 ? (
            <p className="text-sm text-gray-400">No students admitted this session.</p>
          ) : (
            <div className="space-y-3">
              {recentStudents.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-2 w-2 mt-0.5 rounded-full bg-[var(--primary)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 truncate">{s.name}</p>
                      <p className="text-xs text-gray-400">
                        {s.admission_no} · {s.class_name || "—"}
                        {s.section_name ? `-${s.section_name}` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Fee Payments · {sessionName}
        </h3>
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : recentFees.length === 0 ? (
          <p className="text-sm text-gray-400">No fee payments recorded this session.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentFees.map((f: any) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 truncate">{f.student_name || "Unknown"}</p>
                  <p className="text-xs text-gray-400">{f.payment_mode} · {f.payment_date}</p>
                </div>
                <span className="text-sm font-semibold text-[var(--primary)]">
                  {symbol}{Number(f.paid_amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Menu Overview</h3>
        <p className="text-sm text-gray-500 mb-4">
          This admin panel includes {menuData.length} menu categories with{" "}
          {menuData.reduce((acc, cat) => acc + cat.items.length, 0)} sub-menu items.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {menuData.map((cat) => (
            <div
              key={cat.label}
              className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
            >
              <span className="font-medium text-gray-800">{cat.label}</span>
              <span className="block text-gray-400">{cat.items.length} items</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
