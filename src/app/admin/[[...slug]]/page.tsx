"use client"

import { usePathname } from "next/navigation"
import { menuData } from "@/lib/menu-data"
import {
  ArrowLeft,
  Plus,
  Download,
  Upload,
  Filter,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  Settings2,
} from "lucide-react"
import Link from "next/link"
import ExecutiveDashboard from "@/components/executive-dashboard"

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
    return <ExecutiveDashboard />
  }

  const title = info?.item || "Page"
  const category = info?.category || ""

  return (
    <div className="space-y-5">
      {/* breadcrumb + actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-3 py-1 rounded-full uppercase">
            <Layers className="h-3 w-3" /> {category || "Admin"} <span className="opacity-40">/</span> <span className="text-[var(--title-color)]">{title}</span>
          </div>
          <h2 className="mt-2 text-[22px] font-extrabold tracking-tight text-[var(--title-color)] flex items-center gap-2.5">
            {title}
            <span className="hidden sm:inline-flex h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 items-center justify-center text-white shadow"><Sparkles className="h-3.5 w-3.5" /></span>
          </h2>
          <p className="text-sm text-[var(--subtitle-color)] mt-1">Manage <b className="text-[var(--title-color)]">{title}</b> — create, search, filter and export records.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--subtitle-color)] hover:text-[var(--title-color)] px-3.5 py-2 rounded-full border border-[var(--border)] bg-white dark:bg-slate-800 hover:shadow-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <button className="inline-flex items-center gap-1.5 text-sm font-black text-white bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-5 py-2 rounded-full shadow-md hover:shadow-lg hover:-translate-y-px transition-all">
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-[var(--border)] bg-[var(--accent)]/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Search in ${title}…`}
                className="pl-9 pr-4 py-2 text-sm border border-[var(--border)] rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300 w-64 bg-white dark:bg-slate-900 text-[var(--title-color)] placeholder:text-slate-400"
              />
            </div>
            <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--title-color)] px-3.5 py-2 rounded-full border border-[var(--border)] bg-white dark:bg-slate-800 hover:bg-[var(--accent)] transition-colors">
              <Filter className="h-4 w-4 text-slate-500" />
              Filter
            </button>
            <button className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--title-color)] px-3 py-2 rounded-full border border-[var(--border)] bg-white dark:bg-slate-800 hover:bg-[var(--accent)] transition-colors">
              <Settings2 className="h-4 w-4 text-slate-500" /> Columns
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--subtitle-color)] hover:text-[var(--title-color)] px-3.5 py-2 rounded-full border border-[var(--border)] bg-white dark:bg-slate-800 hover:shadow-sm transition-all">
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 px-3.5 py-2 rounded-full border border-orange-200 bg-orange-50 dark:bg-orange-500/10 dark:border-orange-500/20 hover:bg-orange-100 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="p-10 lg:p-14 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* soft gradient behind */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.06] via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-40 w-64 bg-orange-400/10 blur-3xl rounded-full pointer-events-none" />
          <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-5 shadow-lg shadow-orange-200 dark:shadow-none">
            <Layers className="h-9 w-9 text-white" />
          </div>
          <h3 className="relative text-[18px] font-extrabold text-[var(--title-color)]">{title}</h3>
          <p className="relative text-sm text-[var(--subtitle-color)] max-w-lg mt-2 leading-relaxed">
            This is the <b className="text-[var(--title-color)]">{title}</b> section under <b className="text-[var(--title-color)]">{category}</b>. Start by adding your first record or import data from a file. Your table and filters will appear here.
          </p>
          <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
            <button className="inline-flex items-center gap-2 text-sm font-black text-white bg-gradient-to-br from-orange-500 to-amber-500 px-6 py-2.5 rounded-full shadow-md hover:shadow-lg hover:-translate-y-px transition-all">
              <Plus className="h-4 w-4" /> Create {title} <ArrowRight className="h-4 w-4" />
            </button>
            <span className="text-xs text-[var(--subtitle-color)] px-2">or</span>
            <button className="inline-flex items-center gap-2 text-sm font-bold text-[var(--title-color)] bg-white dark:bg-slate-800 border border-[var(--border)] px-5 py-2.5 rounded-full hover:shadow-sm transition-all">
              <Upload className="h-4 w-4" /> Import CSV
            </button>
          </div>
          <p className="relative mt-4 text-[11px] font-medium text-[var(--subtitle-color)]">Tip: use the search and filters above to quickly find records once you add data.</p>
        </div>
      </div>
    </div>
  )
}
