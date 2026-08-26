"use client"

import { useMemo, useState } from "react"
import { Plus, X, Save, Shield, Home, Search, ChevronRight, Settings, Check } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { toast as notify } from "@/lib/toast"
import { menuData } from "@/lib/menu-data"
import { iconMap } from "@/lib/menu-icons"

type Role = {
  id: number
  name: string
  description: string
  permissions: string[]
}

type PermActions = { view: boolean; add: boolean; edit: boolean; delete: boolean }
type PermMap = Record<string, PermActions>

const ACTIONS = ["view", "add", "edit", "delete"] as const
type ActionKey = (typeof ACTIONS)[number]

const ACTION_LABELS: Record<ActionKey, string> = {
  view: "View",
  add: "Add",
  edit: "Edit",
  delete: "Delete",
}

const baseCode = (path: string) =>
  path === "/admin"
    ? "dashboard"
    : path.replace(/^\/admin\//, "").replace(/\//g, "_").replace(/-/g, "_")

type PermItem = { label: string; path: string; code: string }
type PermCategory = { label: string; icon: string; items: PermItem[] }

const categories: PermCategory[] = [
  {
    label: "Dashboard",
    icon: "Home",
    items: [{ label: "Dashboard", path: "/admin", code: baseCode("/admin") }],
  },
  ...menuData.map((cat) => ({
    label: cat.label,
    icon: cat.icon,
    items: cat.items.map((item) => ({
      label: item.label,
      path: item.path,
      code: baseCode(item.path),
    })),
  })),
]

const allItems = categories.flatMap((c) => c.items)

function buildEmptyPermMap(): PermMap {
  const map: PermMap = {}
  for (const item of allItems) map[item.code] = { view: false, add: false, edit: false, delete: false }
  return map
}

function parsePermissions(perms: string[]): PermMap {
  const map = buildEmptyPermMap()
  if (perms.includes("*")) {
    for (const code of Object.keys(map)) map[code] = { view: true, add: true, edit: true, delete: true }
    return map
  }
  for (const raw of perms) {
    if (typeof raw !== "string") continue
    const sep = raw.indexOf(":")
    const code = sep === -1 ? raw : raw.slice(0, sep)
    const action = sep === -1 ? "" : raw.slice(sep + 1)
    if (!map[code]) continue
    if (action === "") {
      map[code] = { view: true, add: true, edit: true, delete: true }
    } else if ((ACTIONS as readonly string[]).includes(action)) {
      map[code][action as ActionKey] = true
    }
  }
  return map
}

function collectPermissions(map: PermMap): string[] {
  const out: string[] = []
  let allOn = true
  for (const item of allItems) {
    const m = map[item.code]
    if (!m) continue
    if (m.view) out.push(`${item.code}:view`)
    if (m.add) out.push(`${item.code}:add`)
    if (m.edit) out.push(`${item.code}:edit`)
    if (m.delete) out.push(`${item.code}:delete`)
    if (!(m.view && m.add && m.edit && m.delete)) allOn = false
  }
  return allOn ? ["*"] : out
}

function enabledCount(perms: string[]): number {
  if (!Array.isArray(perms)) return 0
  if (perms.includes("*")) return allItems.length
  return perms.filter((p) => typeof p === "string").length
}

const itemAllOn = (m: PermActions) => m.view && m.add && m.edit && m.delete

export default function RolesPermissionsPanel() {
  const { data: roles, add, update, loading } = useApi<Role>("/api/roles")
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [permMap, setPermMap] = useState<PermMap | null>(null)
  const [activeCat, setActiveCat] = useState<string>(categories[0].label)
  const [filter, setFilter] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [addName, setAddName] = useState("")
  const [addDescription, setAddDescription] = useState("")

  const filteredItems = useMemo(() => {
    const cat = categories.find((c) => c.label === activeCat)
    if (!cat) return []
    const q = filter.trim().toLowerCase()
    return q ? cat.items.filter((i) => i.label.toLowerCase().includes(q)) : cat.items
  }, [activeCat, filter])

  const openPermissions = (role: Role) => {
    setSelectedRole(role)
    setPermMap(parsePermissions(Array.isArray(role.permissions) ? role.permissions.filter((p) => typeof p === "string") : []))
    setActiveCat(categories[0].label)
    setFilter("")
  }

  const toggleAction = (code: string, action: ActionKey) => {
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

  const handleSavePermissions = async () => {
    if (!selectedRole || !permMap) return
    try {
      await update(selectedRole.id, { ...selectedRole, permissions: collectPermissions(permMap) })
      notify.success("Permissions saved")
      setSelectedRole(null)
      setPermMap(null)
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : "Failed to save permissions")
    }
  }

  const handleAddRole = async () => {
    if (!addName.trim()) return
    try {
      await add({ name: addName.trim(), description: addDescription.trim(), permissions: [] })
      notify.success("Role added")
      setShowAddModal(false)
      setAddName("")
      setAddDescription("")
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : "Failed to add role")
    }
  }

  const catEnabledCount = (cat: PermCategory): number => {
    if (!permMap) return 0
    return cat.items.filter((i) => Object.values(permMap[i.code] || {}).some(Boolean)).length
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div></div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Role
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "Role Name", "Description", "Permissions", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(roles || []).map((role, idx) => (
                <tr key={role.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{role.name}</td>
                  <td className="px-4 py-3 text-gray-600">{role.description}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)]">
                      {enabledCount(role.permissions)} permissions
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openPermissions(role)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Permissions">
                      <Shield className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">{loading ? "Loading..." : "No roles found"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          Showing {roles.length} records
        </div>
      </div>

      {selectedRole && permMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl rounded-xl bg-white shadow-lg flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Permissions - {selectedRole.name}</h3>
                <p className="text-xs text-gray-500">{selectedRole.description || "Assign view / add / edit / delete permissions per menu item"}</p>
              </div>
              <button onClick={() => { setSelectedRole(null); setPermMap(null) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              <div className="w-64 shrink-0 border-r border-gray-200 overflow-y-auto py-2 bg-gray-50/50">
                {categories.map((cat) => {
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
                          {ACTIONS.map((action) => (
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

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => { setSelectedRole(null); setPermMap(null) }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSavePermissions}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2">
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Add Role</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Manager"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAddRole}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2">
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}