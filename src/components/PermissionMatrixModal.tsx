"use client"

import { useMemo, useState } from "react"
import { X, Save, Home, Search, ChevronRight, Settings, Check } from "lucide-react"
import { iconMap } from "@/lib/menu-icons"
import {
  permissionsTree,
  parsePermissions,
  collectPermissions,
  itemAllOn,
  PERM_ACTIONS,
  type PermMap,
  type PermCategory,
} from "@/lib/permissions"

const ACTION_LABELS: Record<string, string> = {
  view: "View",
  add: "Add",
  edit: "Edit",
  delete: "Delete",
}

type Props = {
  title: string
  subtitle?: string
  initialPermissions: string[]
  onClose: () => void
  onSave: (permissions: string[]) => Promise<void>
}

export default function PermissionMatrixModal({ title, subtitle, initialPermissions, onClose, onSave }: Props) {
  const [permMap, setPermMap] = useState<PermMap>(() => parsePermissions(initialPermissions))
  const [activeCat, setActiveCat] = useState<string>(permissionsTree[0].label)
  const [filter, setFilter] = useState("")
  const [saving, setSaving] = useState(false)

  const filteredItems = useMemo(() => {
    const cat = permissionsTree.find((c) => c.label === activeCat)
    if (!cat) return []
    const q = filter.trim().toLowerCase()
    return q ? cat.items.filter((i) => i.label.toLowerCase().includes(q)) : cat.items
  }, [activeCat, filter])

  const toggleAction = (code: string, action: (typeof PERM_ACTIONS)[number]) => {
    setPermMap((prev) => {
      if (!prev) return prev
      return { ...prev, [code]: { ...prev[code], [action]: !prev[code][action] } }
    })
  }

  const toggleItemAll = (code: string) => {
    setPermMap((prev) => {
      if (!prev) return prev
      const m = prev[code]
      const val = !itemAllOn(m)
      return { ...prev, [code]: { view: val, add: val, edit: val, delete: val } }
    })
  }

  const toggleCategoryAll = (cat: PermCategory) => {
    setPermMap((prev) => {
      if (!prev) return prev
      const allOn = cat.items.every((i) => itemAllOn(prev[i.code]))
      const val = !allOn
      const next = { ...prev }
      for (const i of cat.items) next[i.code] = { view: val, add: val, edit: val, delete: val }
      return next
    })
  }

  const catEnabledCount = (cat: PermCategory): number => {
    if (!permMap) return 0
    return cat.items.filter((i) => Object.values(permMap[i.code] || {}).some(Boolean)).length
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(collectPermissions(permMap))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl rounded-xl bg-white shadow-lg flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle || "Assign view / add / edit / delete permissions per menu item"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-64 shrink-0 border-r border-gray-200 overflow-y-auto py-2 bg-gray-50/50">
            {permissionsTree.map((cat) => {
              const Icon = cat.icon === "Home" ? Home : iconMap[cat.icon] || Settings
              const count = catEnabledCount(cat)
              const allOn = cat.items.length > 0 && cat.items.every((i) => itemAllOn(permMap[i.code]))
              const active = activeCat === cat.label
              return (
                <button
                  key={cat.label}
                  onClick={() => setActiveCat(cat.label)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${active ? "bg-[var(--primary-light)] text-[var(--primary)] font-medium" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{cat.label}</span>
                  <span className={`text-xs ${count > 0 ? "text-[var(--primary)]" : "text-gray-400"}`}>{count}</span>
                  <input
                    type="checkbox"
                    checked={allOn}
                    onChange={(e) => { e.stopPropagation(); toggleCategoryAll(cat) }}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${active ? "rotate-90" : ""}`} />
                </button>
              )
            })}
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search menu items..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
              <span className="text-xs text-gray-500">{filteredItems.length} items</span>
            </div>

            <div className="overflow-y-auto p-4 space-y-2">
              {filteredItems.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">No menu items found</p>
              )}
              {filteredItems.map((item) => {
                const m = permMap[item.code]
                return (
                  <div key={item.code} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <button onClick={() => toggleItemAll(item.code)} className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${itemAllOn(m) ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-gray-300"}`}>
                        {itemAllOn(m) && <Check className="h-3 w-3" />}
                      </button>
                      <span className="text-sm font-medium text-gray-800 truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      {PERM_ACTIONS.map((action) => (
                        <label key={action} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={m[action]}
                            onChange={() => toggleAction(item.code, action)}
                            className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                          {ACTION_LABELS[action]}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400">{enabledCountText(permMap)} selected</p>
          <div className="flex justify-end gap-2">
            <button onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 flex items-center gap-2">
              {saving && <Save className="h-4 w-4 animate-pulse" />}
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function enabledCountText(permMap: PermMap) {
  let count = 0
  for (const code of Object.keys(permMap)) count += Object.values(permMap[code]).filter(Boolean).length
  return `${count}`
}