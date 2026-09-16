"use client"
import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Eye, EyeOff, Check, Search, Loader2, ArrowLeft, School as SchoolIcon, X, Lock } from "lucide-react"
import { menuData } from "@/lib/menu-data"

type DbMenu = { id: number; label: string; icon: string; parent_id: number | null; path: string; sort_order: number; is_visible: boolean; locked?: boolean }

export default function SchoolModulesPage() {
  const rawParams = useParams() as { id?: string | string[] }
  const router = useRouter()
  const idRaw = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id
  const schoolId = Number(idRaw)

  const [schoolName, setSchoolName] = useState("")
  const [dbMenus, setDbMenus] = useState<DbMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [success, setSuccess] = useState("")
  const [keyword, setKeyword] = useState("")
  const [view, setView] = useState<"card" | "list">("card")
  const [subCat, setSubCat] = useState<string | null>(null)
  const [localVis, setLocalVis] = useState<Record<string, boolean>>({})

  const api = "/api/saas/modules"

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const schoolRes = await fetch(`/api/saas/schools?id=${schoolId}`, { credentials: "include" })
      const sdata = await schoolRes.json()
      const s = Array.isArray(sdata) ? sdata[0] : sdata
      if (s?.name) setSchoolName(s.name)
      const res = await fetch(`${api}?schoolId=${schoolId}`, { credentials: "include" })
      const data = await res.json()
      if (Array.isArray(data)) setDbMenus(data)
      else if (data?.error) setError(data.error)
    } catch {
      setError("Failed to load modules")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!idRaw || Number.isNaN(schoolId)) {
      setError("Invalid school id")
      setLoading(false)
      return
    }
    load()
  }, [schoolId, idRaw])

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const dbByLabel = useMemo(() => {
    const map: Record<string, DbMenu> = {}
    for (const m of dbMenus) if (m.parent_id === null) map[m.label.toLowerCase()] = m
    return map
  }, [dbMenus])

  const childMap = useMemo(() => {
    const map: Record<string, DbMenu[]> = {}
    for (const m of dbMenus) {
      if (m.parent_id === null) continue
      const parent = dbMenus.find((p) => p.id === m.parent_id)
      if (!parent) continue
      const key = parent.label.toLowerCase()
      if (!map[key]) map[key] = []
      map[key].push(m)
    }
    return map
  }, [dbMenus])

  const merged = useMemo(() => {
    return menuData.map((cat) => {
      const db = dbByLabel[cat.label.toLowerCase()]
      const children = childMap[cat.label.toLowerCase()] || []
      const childVis = cat.items.map((item) => {
        const c = children.find((m) => m.label.toLowerCase() === item.label.toLowerCase())
        return { label: item.label, isVisible: c?.is_visible ?? true }
      })
      return { ...cat, isVisible: db?.is_visible ?? true, locked: db?.locked ?? false, childVis }
    })
  }, [dbByLabel, childMap])

  const filtered = useMemo(() => {
    if (!keyword.trim()) return merged
    const kw = keyword.toLowerCase()
    return merged.filter((c) => c.label.toLowerCase().includes(kw))
  }, [merged, keyword])

  const toggle = async (label: string, childLabel: string | null, visible: boolean) => {
    const key = label + (childLabel || "")
    setSaving((prev) => ({ ...prev, [key]: true }))
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          schoolId,
          items: [{ label: childLabel || label, parentLabel: childLabel ? label : null, is_visible: visible }],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      await load()
      window.dispatchEvent(new Event("sidebar-visibility-changed"))
      showSuccess(`"${childLabel || label}" ${visible ? "activated" : "deactivated"}`)
    } catch (e: any) {
      showSuccess(e.message || "Save failed")
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  const openSub = (catLabel: string) => {
    const full = merged.find((c) => c.label === catLabel)
    if (!full) return
    const vis: Record<string, boolean> = { __main__: full.isVisible }
    for (const item of full.items) {
      const child = full.childVis.find((c) => c.label === item.label)
      vis[item.label] = child?.isVisible ?? true
    }
    setLocalVis(vis)
    setSubCat(catLabel)
  }

  const saveSub = async () => {
    if (!subCat) return
    const cat = merged.find((c) => c.label === subCat)
    if (!cat) return
    const items: any[] = []
    if (localVis["__main__"] !== undefined && localVis["__main__"] !== cat.isVisible) {
      items.push({ label: subCat, parentLabel: null, is_visible: localVis["__main__"] })
    }
    for (const item of cat.items) {
      const cur = cat.childVis.find((c) => c.label === item.label)
      if (localVis[item.label] !== undefined && localVis[item.label] !== cur?.isVisible) {
        items.push({ label: item.label, parentLabel: subCat, is_visible: localVis[item.label] })
      }
    }
    if (items.length > 0) {
      try {
        const res = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ schoolId, items }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Save failed")
        await load()
        window.dispatchEvent(new Event("sidebar-visibility-changed"))
        showSuccess(`"${subCat}" submenus updated`)
      } catch (e: any) {
        showSuccess(e.message || "Save failed")
      }
    }
    setSubCat(null)
  }

  const countVis = (cat: (typeof merged)[0]) => cat.childVis.filter((c) => c.isVisible).length

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" /></div>
  if (error) return <div className="p-6 text-center"><p className="text-sm text-red-600">{error}</p><button onClick={() => router.push(`/saas/schools/${schoolId}`)} className="mt-3 text-sm text-[var(--primary)] hover:underline">Back to School</button></div>

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/saas/schools/${schoolId}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--subtitle-color)] hover:text-[var(--primary)]">
            <ArrowLeft className="h-4 w-4" /> Back to School
          </Link>
          <h2 className="text-xl font-bold text-[var(--title-color)] mt-1 flex items-center gap-2">
            <SchoolIcon className="h-5 w-5 text-[var(--primary)]" />
            Modules — {schoolName || `School #${schoolId}`}
          </h2>
          <p className="text-xs text-[var(--subtitle-color)] mt-0.5">Switch modules ON/OFF for this school. The school's own admin panel will reflect the same switches.</p>
        </div>
        <div className="flex items-center gap-1 border border-[var(--border)] rounded-lg p-0.5 bg-white dark:bg-[var(--card)]">
          <button onClick={() => setView("card")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === "card" ? "bg-[var(--primary)] text-white" : "text-[var(--subtitle-color)] hover:text-[var(--foreground)]"}`}>Card</button>
          <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === "list" ? "bg-[var(--primary)] text-white" : "text-[var(--subtitle-color)] hover:text-[var(--foreground)]"}`}>List</button>
        </div>
      </div>

      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" /> {success}
        </div>
      )}

      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search module..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-[var(--border)] rounded-xl bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <button onClick={() => setKeyword("")} className="h-9 px-3 text-sm text-[var(--subtitle-color)] border border-[var(--border)] rounded-xl hover:bg-[var(--muted)]">Reset</button>
        </div>
      </div>

      {view === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[var(--subtitle-color)]">No modules found</div>
          ) : (
            filtered.map((cat) => {
              const isSaving = saving[cat.label] || false
              return (
                <div key={cat.label} className="glass-panel rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{cat.label}</h3>
                      {cat.items.length > 0 && (
                        <p className="text-xs text-[var(--subtitle-color)] mt-0.5">{countVis(cat)}/{cat.items.length} submenus active</p>
                      )}
                    </div>
                    <button onClick={() => toggle(cat.label, null, !cat.isVisible)} disabled={isSaving}
                      className={`p-1.5 rounded-lg shrink-0 disabled:opacity-50 ${cat.isVisible ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40" : "text-[var(--subtitle-color)] bg-[var(--muted)] hover:bg-gray-200"}`}
                      title={cat.isVisible ? "Deactivate" : "Activate"}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : cat.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cat.isVisible ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-[var(--muted)] text-[var(--subtitle-color)]"}`}>
                      {cat.isVisible ? "Active" : "Inactive"}
                    </span>
                    {cat.locked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" title="Locked for this school — the school admin cannot change this">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>
                  {cat.items.length > 0 && (
                    <button onClick={() => openSub(cat.label)} className="w-full mt-3 text-xs text-[var(--subtitle-color)] hover:text-[var(--primary)] bg-[var(--muted)] hover:bg-[var(--primary-light)] rounded-lg py-1.5 transition-colors">
                      Manage Submenus ({cat.items.length})
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--subtitle-color)] border-b border-[var(--border)]">
                {["#", "Module", "Submenus", "Status", "Action"].map((h) => <th key={h} className="px-4 py-3 font-semibold text-xs uppercase">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat, idx) => {
                const isSaving = saving[cat.label] || false
                return (
                  <tr key={cat.label} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{cat.label}</td>
                    <td className="px-4 py-3 text-[var(--subtitle-color)]">{cat.items.length > 0 ? `${countVis(cat)}/${cat.items.length} active` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cat.isVisible ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-[var(--muted)] text-[var(--subtitle-color)]"}`}>
                        {cat.isVisible ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {cat.items.length > 0 && (
                          <button onClick={() => openSub(cat.label)} className="px-2.5 py-1.5 text-xs font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]">Manage Submenus</button>
                        )}
                        <button onClick={() => toggle(cat.label, null, !cat.isVisible)} disabled={isSaving}
                          className={`p-1.5 rounded-lg disabled:opacity-50 ${cat.isVisible ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" : "text-[var(--subtitle-color)] bg-[var(--muted)]"}`}>
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : cat.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[var(--border)] text-sm text-[var(--subtitle-color)]">Showing {filtered.length} modules</div>
        </div>
      )}

      {subCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSubCat(null)} />
          <div className="relative bg-white dark:bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] sticky top-0 bg-white dark:bg-[var(--card)] z-10 rounded-t-2xl">
              <h3 className="text-base font-semibold text-[var(--foreground)]">{subCat} — Submenus</h3>
              <button onClick={() => setSubCat(null)} className="p-1.5 text-[var(--subtitle-color)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between px-3 py-2 bg-[var(--muted)] rounded-lg">
                <span className="text-sm font-medium text-[var(--foreground)]">{subCat} <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 ml-1">Main</span></span>
                <button onClick={() => setLocalVis((prev) => ({ ...prev, __main__: prev.__main__ !== false }))}
                  className={`p-1.5 rounded-lg ${localVis["__main__"] !== false ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" : "text-[var(--subtitle-color)] bg-[var(--muted)]"}`}>
                  {localVis["__main__"] !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {merged.find((c) => c.label === subCat)?.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-3 py-2 hover:bg-[var(--muted)] rounded-lg">
                  <span className="text-sm text-[var(--foreground)]">{item.label}</span>
                  <button onClick={() => setLocalVis((prev) => ({ ...prev, [item.label]: prev[item.label] !== false }))}
                    className={`p-1.5 rounded-lg ${localVis[item.label] !== false ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" : "text-[var(--subtitle-color)] bg-[var(--muted)]"}`}>
                    {localVis[item.label] !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[var(--border)] flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-[var(--card)] rounded-b-2xl">
              <button onClick={() => setSubCat(null)} className="px-4 py-2 text-xs font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]">Cancel</button>
              <button onClick={saveSub} className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:opacity-90">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
