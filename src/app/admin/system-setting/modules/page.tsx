"use client"

import { useState, useMemo, useEffect } from "react"
import { Eye, EyeOff, Check, X, Search, Loader2 } from "lucide-react"
import { menuData, type MenuCategory } from "@/lib/menu-data"

type SidebarMenu = {
  id: number
  label: string
  icon: string
  parent_id: number | null
  path: string
  sort_order: number
  is_visible: boolean
}

export default function ModulesPage() {
  const [dbMenus, setDbMenus] = useState<SidebarMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [success, setSuccess] = useState("")
  const [keyword, setKeyword] = useState("")
  const [selectedCat, setSelectedCat] = useState<MenuCategory | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [localVis, setLocalVis] = useState<Record<string, boolean>>({})

  const api = "/api/system-setting/sidebar-menu"

  useEffect(() => {
    fetch(api)
      .then((r) => r.json())
      .then((data: SidebarMenu[]) => setDbMenus(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const dbByLabel = useMemo(() => {
    const map: Record<string, SidebarMenu> = {}
    for (const m of dbMenus) {
      map[m.label.toLowerCase()] = m
    }
    return map
  }, [dbMenus])

  const childMenus = useMemo(() => {
    const map: Record<number, SidebarMenu[]> = {}
    for (const m of dbMenus) {
      if (m.parent_id) {
        if (!map[m.parent_id]) map[m.parent_id] = []
        map[m.parent_id].push(m)
      }
    }
    return map
  }, [dbMenus])

  const childByParentLabel = useMemo(() => {
    const map: Record<string, SidebarMenu[]> = {}
    for (const m of dbMenus) {
      if (m.parent_id) {
        const parent = dbMenus.find((p) => p.id === m.parent_id)
        if (parent) {
          if (!map[parent.label]) map[parent.label] = []
          map[parent.label].push(m)
        }
      }
    }
    return map
  }, [dbMenus])

  const mergedCategories = useMemo(() => {
    return menuData.map((cat) => {
      const db = dbByLabel[cat.label.toLowerCase()]
      return {
        ...cat,
        dbId: db?.id ?? null,
        isVisible: db?.is_visible ?? true,
        childVis: cat.items.map((item) => {
          const cdb = dbMenus.find(
            (m) => m.label === item.label && m.parent_id === db?.id
          )
          return { label: item.label, dbId: cdb?.id ?? null, isVisible: cdb?.is_visible ?? true }
        }),
      }
    })
  }, [menuData, dbByLabel, dbMenus])

  const filtered = useMemo(() => {
    if (!keyword.trim()) return mergedCategories
    const kw = keyword.toLowerCase()
    return mergedCategories.filter((c) => c.label.toLowerCase().includes(kw))
  }, [mergedCategories, keyword])

  const syncToDb = async (catLabel: string, childLabel: string | null, visible: boolean) => {
    setSaving((prev) => ({ ...prev, [catLabel + (childLabel || "")]: true }))
    try {
      const existing = childLabel
        ? dbMenus.find(
            (m) =>
              m.label === childLabel &&
              m.parent_id === (dbByLabel[catLabel.toLowerCase()]?.id ?? null)
          )
        : dbByLabel[catLabel.toLowerCase()]

      if (existing) {
        await fetch(api, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existing.id, is_visible: visible }),
        })
        setDbMenus((prev) =>
          prev.map((m) => (m.id === existing.id ? { ...m, is_visible: visible } : m))
        )
      } else {
        const catDb = dbByLabel[catLabel.toLowerCase()]
        const parentId = childLabel && catDb ? catDb.id : null
        const payload: any = {
          label: childLabel || catLabel,
          icon: "Menu",
          path: "",
          sort_order: 1,
          is_visible: visible,
        }
        if (parentId) payload.parent_id = parentId

        const res = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const saved = await res.json()

        setDbMenus((prev) => [...prev, saved])
      }
    } catch {}
    setSaving((prev) => ({ ...prev, [catLabel + (childLabel || "")]: false }))
  }

  const toggleModule = async (cat: (typeof mergedCategories)[0]) => {
    const next = !cat.isVisible
    await syncToDb(cat.label, null, next)
    window.dispatchEvent(new Event("sidebar-visibility-changed"))
    showSuccess(`"${cat.label}" ${next ? "activated" : "deactivated"} successfully!`)
  }

  const openSubmenuModal = (cat: (typeof mergedCategories)[0]) => {
    const fullCat = menuData.find((c) => c.label === cat.label)!
    setSelectedCat(fullCat)
    const vis: Record<string, boolean> = {}
    vis["__main__"] = cat.isVisible
    for (const item of fullCat.items) {
      const child = cat.childVis.find((c) => c.label === item.label)
      vis[item.label] = child?.isVisible ?? true
    }
    setLocalVis(vis)
    setShowModal(true)
  }

  const toggleLocal = (key: string) => {
    setLocalVis((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const saveSubmenuChanges = async () => {
    if (!selectedCat) return
    const cat = mergedCategories.find((c) => c.label === selectedCat.label)
    if (!cat) return

    const mainVis = localVis["__main__"] ?? cat.isVisible
    if (mainVis !== cat.isVisible) {
      await syncToDb(selectedCat.label, null, mainVis)
    }

    for (const item of selectedCat.items) {
      const itemVis = localVis[item.label]
      const current = cat.childVis.find((c) => c.label === item.label)
      if (itemVis !== undefined && itemVis !== current?.isVisible) {
        await syncToDb(selectedCat.label, item.label, itemVis)
      }
    }

    window.dispatchEvent(new Event("sidebar-visibility-changed"))
    showSuccess(`"${selectedCat.label}" submenu updated successfully!`)
    setShowModal(false)
    setSelectedCat(null)
  }

  const getChildCount = (catLabel: string) => {
    const cat = menuData.find((c) => c.label === catLabel)
    return cat?.items.length ?? 0
  }

  const getVisibleChildCount = (cat: (typeof mergedCategories)[0]) => {
    return cat.childVis.filter((c) => c.isVisible).length
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Modules</h2>
          <p className="text-xs text-gray-500 mt-0.5">System Setting / Modules</p>
        </div>
      </div>

      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-2.5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-indigo-500" />
            Search
          </h3>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search module..."
                className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <button type="button" onClick={() => setKeyword("")}
              className="h-9 px-3 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Reset</button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <div className="flex flex-col items-center gap-2">
                <Search className="h-8 w-8 text-gray-300" />
                <span className="text-sm">No modules found</span>
              </div>
            </div>
          ) : (
            filtered.map((cat) => {
              const childCount = getChildCount(cat.label)
              const visibleCount = getVisibleChildCount(cat)
              const isSaving = saving[cat.label] || false
              return (
                <div key={cat.label}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-800 truncate">{cat.label}</h3>
                        {childCount > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {visibleCount}/{childCount} submenus active
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleModule(cat)}
                        disabled={isSaving}
                        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 ${
                          cat.isVisible
                            ? "text-green-600 bg-green-50 hover:bg-green-100"
                            : "text-gray-300 bg-gray-50 hover:bg-gray-100"
                        }`}
                        title={cat.isVisible ? "Deactivate" : "Activate"}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : cat.isVisible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cat.isVisible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {cat.isVisible ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  {childCount > 0 && (
                    <div className="px-4 pb-4">
                      <button onClick={() => openSubmenuModal(cat)}
                        className="w-full text-xs text-gray-500 hover:text-[var(--primary)] bg-gray-50 hover:bg-[var(--primary-light)] rounded-lg py-1.5 transition-colors">
                        Manage Submenus ({childCount})
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {showModal && selectedCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
              <h3 className="text-base font-semibold text-gray-800">{selectedCat.label} - Submenus</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{selectedCat.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Main</span>
                  </div>
                  <button onClick={() => toggleLocal("__main__")}
                    className={`p-1.5 rounded-lg transition-colors ${localVis["__main__"] !== false ? "text-green-600 bg-green-50" : "text-gray-300 bg-gray-50"}`}>
                    {localVis["__main__"] !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
                {selectedCat.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">└─</span>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <button onClick={() => toggleLocal(item.label)}
                      className={`p-1.5 rounded-lg transition-colors ${localVis[item.label] !== false ? "text-green-600 hover:bg-green-50" : "text-gray-300 hover:bg-gray-100"}`}>
                      {localVis[item.label] !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-xl">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveSubmenuChanges}
                className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
