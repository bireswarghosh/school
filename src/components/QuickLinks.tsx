"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Search, X } from "lucide-react"
import { menuData, MenuCategory } from "@/lib/menu-data"
import { iconMap } from "@/lib/menu-icons"

type SidebarMenuRow = {
  id: number
  label: string
  parent_id: number | null
  is_visible: boolean
}

export default function QuickLinks() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [visMap, setVisMap] = useState<Record<string, boolean>>({})
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const fetchVis = useCallback(() => {
    fetch("/api/system-setting/sidebar-menu")
      .then((r) => r.json())
      .then((data: SidebarMenuRow[]) => {
        const map: Record<string, boolean> = {}
        for (const row of data) {
          if (row.parent_id === null) {
            map[row.label.toLowerCase()] = row.is_visible
          } else {
            const parent = data.find((p) => p.id === row.parent_id)
            if (parent) {
              map[parent.label.toLowerCase() + "::" + row.label.toLowerCase()] = row.is_visible
            }
          }
        }
        setVisMap(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { fetchVis() }, [fetchVis, open])

  useEffect(() => {
    const handler = () => fetchVis()
    window.addEventListener("sidebar-visibility-changed", handler)
    return () => window.removeEventListener("sidebar-visibility-changed", handler)
  }, [fetchVis])

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  useEffect(() => { setOpen(false) }, [pathname])

  const catVisible = (cat: MenuCategory) => visMap[cat.label.toLowerCase()] ?? true
  const itemVisible = (cat: MenuCategory, label: string) =>
    visMap[cat.label.toLowerCase() + "::" + label.toLowerCase()] ?? true

  const q = query.trim().toLowerCase()
  const categories = q
    ? menuData
        .filter(catVisible)
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((i) => itemVisible(cat, i.label) && (i.label.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q))),
        }))
        .filter((cat) => cat.items.length > 0)
    : menuData.filter(catVisible)

  const totalLinks = menuData.reduce((sum, cat) => sum + cat.items.filter((i) => itemVisible(cat, i.label)).length, 0)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open)
          setQuery("")
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
          open
            ? "bg-[var(--primary)] text-white border-transparent"
            : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
        }`}
        title="Quick Links"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden xl:inline">Quick Links</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(92vw,940px)] max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl z-50">
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search quick links..."
              className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-gray-400"
            />
            {query ? (
              <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            ) : (
              <span className="text-xs text-gray-400 whitespace-nowrap">{totalLinks} links</span>
            )}
          </div>

          <div className="p-4">
            {categories.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No links found for "{query}"</p>
            ) : (
              <div className="columns-1 sm:columns-2 xl:columns-3 gap-3">
                {categories.map((cat) => {
                  const Icon = iconMap[cat.icon] || LayoutGrid
                  return (
                    <div key={cat.label} className="break-inside-avoid mb-3 rounded-lg border border-[var(--border)] p-3">
                      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--primary)] mb-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </h4>
                      <ul className="space-y-0.5">
                        {cat.items.map((item) => (
                          <li key={item.path}>
                            <Link
                              href={item.path}
                              onClick={() => setOpen(false)}
                              className="block rounded px-2 py-1.5 text-sm text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors truncate"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
