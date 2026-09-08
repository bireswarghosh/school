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
