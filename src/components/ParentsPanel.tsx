"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, X, Save, Check, Filter, Users, LogIn, Ban, CheckCircle } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useAuth } from "@/lib/auth-context"

type ParentUser = {
  id: number
  username: string
  name: string
  email: string
  role: string
  status: string
  lastLogin: string
  children: string | null
  childrenCount: number
}

export default function ParentsPanel() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { data: parents, loading, update, remove } = useApi<ParentUser>("/api/system-setting/parent-users")
  const [filterStatus, setFilterStatus] = useState("All")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<ParentUser | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ name: "", email: "", status: true })
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [confirmAction, setConfirmAction] = useState<{ type: "disable" | "enable" | "bulk-disable" | "bulk-enable"; userId?: number } | null>(null)

  const canImpersonate = currentUser?.role === "admin" || currentUser?.role === "super_admin"

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const filtered = parents.filter((p) => {
    if (filterStatus !== "All" && String(p.status).toLowerCase() !== filterStatus.toLowerCase()) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.name?.toLowerCase().includes(q) ||
        p.username?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.children?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleEditOpen = (p: ParentUser) => {
    setEditing(p)
    setForm({ name: p.name, email: p.email || "", status: String(p.status).toLowerCase() === "active" })
    setShowModal(true)
  }

  const handleEditSave = async () => {
    if (!editing) return
    await update(editing.id, {
      name: form.name.trim(),
      email: form.email.trim(),
      status: form.status,
    })
    setShowModal(false)
    setEditing(null)
    showSuccess("Parent updated successfully!")
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDelete(false)
    setDeleteId(null)
    showSuccess("Parent user deleted successfully!")
  }

  const handleAutoLogin = async (userId: number) => {
    try {
      const res = await fetch("/api/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, returnUrl: "/admin/system-setting/users-permission" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Auto-login failed")
      router.push(data.redirect || "/admin")
      router.refresh()
    } catch (e) {
      showSuccess(e instanceof Error ? e.message : "Auto-login failed")
    }
  }

  const handleBulkAction = async () => {
    if (!confirmAction) return
    const newStatus = confirmAction.type === "enable" || confirmAction.type === "bulk-enable" ? "active" : "inactive"
    const ids = confirmAction.type.startsWith("bulk") ? selectedIds : (confirmAction.userId ? [confirmAction.userId] : [])
    for (const id of ids) {
      await update(id, { status: newStatus })
    }
    setSelectedIds([])
    setConfirmAction(null)
    showSuccess(`${ids.length} parent(s) ${newStatus === "active" ? "enabled" : "disabled"} successfully!`)
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map((p) => p.id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <input
            type="text"
            placeholder="Search by name, username, email, children..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)] w-72"
          />
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-gray-500">{selectedIds.length} selected</span>
              <button
                onClick={() => setConfirmAction({ type: "bulk-enable" })}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 flex items-center gap-1"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Enable
              </button>
              <button
                onClick={() => setConfirmAction({ type: "bulk-disable" })}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 flex items-center gap-1"
              >
                <Ban className="h-3.5 w-3.5" /> Disable
              </button>
            </div>
          )}
        </div>
        <span className="text-sm text-gray-500">{filtered.length} parent(s)</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                </th>
                {["Name", "Username", "Email", "Children", "Status", "Last Login", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No parents found</td></tr>
              ) : (
                filtered.map((p, idx) => {
                  const isActive = String(p.status).toLowerCase() === "active"
                  return (
                    <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.username}</td>
                      <td className="px-4 py-3 text-gray-600">{p.email || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">{p.childrenCount || 0}</span>
                          {p.children && (
                            <span className="text-xs text-gray-400 max-w-[250px] truncate" title={p.children}>
                              ({p.children})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setConfirmAction({ type: isActive ? "disable" : "enable", userId: p.id })}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            isActive
                              ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                              : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"
                          }`}
                          title={isActive ? "Click to disable" : "Click to enable"}
                        >
                          {isActive ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                          {isActive ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{p.lastLogin || "Never"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditOpen(p)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setDeleteId(p.id); setShowDelete(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {canImpersonate && (
                            <button onClick={() => handleAutoLogin(p.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Login as this parent">
                              <LogIn className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          Showing {filtered.length} of {parents.length} records
        </div>
      </div>

      {showModal && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Edit Parent</h3>
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.status} onChange={(e) => setForm({ ...form, status: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowModal(false); setEditing(null) }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
                <X className="h-4 w-4" /> Cancel
              </button>
              <button onClick={handleEditSave}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5">
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => { setShowDelete(false); setDeleteId(null) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this parent user account?
              {deleteId && <strong className="block mt-1 text-gray-800">{parents.find((p) => p.id === deleteId)?.name}</strong>}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowDelete(false); setDeleteId(null) }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
                <X className="h-4 w-4" /> Cancel
              </button>
              <button onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 flex items-center gap-1.5">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">
                {confirmAction.type.includes("disable") ? "Disable Parent" : "Enable Parent"}
              </h3>
              <button onClick={() => setConfirmAction(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              {confirmAction.type.includes("bulk")
                ? `Are you sure you want to ${confirmAction.type.includes("disable") ? "disable" : "enable"} ${selectedIds.length} selected parent(s)?`
                : `Are you sure you want to ${confirmAction.type === "disable" ? "disable" : "enable"} this parent?`
              }
              {confirmAction.type === "disable" && (
                <span className="block mt-2 text-xs text-amber-600">Disabled parents cannot log in until re-enabled.</span>
              )}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
                <X className="h-4 w-4" /> Cancel
              </button>
              <button onClick={handleBulkAction}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5 ${
                  confirmAction.type.includes("disable") ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}>
                {confirmAction.type.includes("disable") ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                {confirmAction.type.includes("disable") ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
