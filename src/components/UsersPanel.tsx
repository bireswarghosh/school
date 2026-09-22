"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, X, Save, Check, Filter, Shield, LogIn, Ban, CheckCircle, Loader2 } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useAuth } from "@/lib/auth-context"
import { enabledPermissionCount } from "@/lib/permissions"
import PermissionMatrixModal from "@/components/PermissionMatrixModal"

type User = {
  id: number
  username: string
  name: string
  email: string
  role: string
  status: string
  lastLogin: string
  permissions: string[]
}

const roleOptions = ["Admin", "Staff", "Teacher", "Accountant", "Librarian", "Receptionist"]

const emptyForm = { username: "", password: "", confirmPassword: "", name: "", email: "", role: "Teacher", status: true }

export default function UsersPanel() {
  const router = useRouter()
  const { user: currentUser, refresh: refreshUser } = useAuth()
  const { data: users, add, update, remove, loading } = useApi<User>("/api/system-setting/user")
  const [filterRole, setFilterRole] = useState("All")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [permUser, setPermUser] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [success, setSuccess] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loginAsId, setLoginAsId] = useState<number | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: "disable" | "enable" | "bulk-disable" | "bulk-enable"; userId?: number } | null>(null)

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const nonPortalUsers = users.filter((u) => {
    const r = (u.role || "").toLowerCase()
    return r !== "student" && r !== "parent"
  })

  const canImpersonate = currentUser?.role === "admin" || currentUser?.role === "super_admin"

  const filteredUsers = filterRole === "All" ? nonPortalUsers : nonPortalUsers.filter((u) => u.role === filterRole)

  const handleAdd = async () => {
    if (!form.username.trim() || !form.name.trim() || !form.email.trim() || !form.password) return
    if (form.password !== form.confirmPassword) { showSuccess("Passwords do not match!"); return }
    await add({ username: form.username.trim(), name: form.name.trim(), email: form.email.trim(), role: form.role, status: form.status, password: form.password })
    setShowModal(false)
    setForm(emptyForm)
    showSuccess("User added successfully!")
  }

  const handleEditOpen = (u: User) => {
    setEditing(u)
    setForm({ username: u.username, password: "", confirmPassword: "", name: u.name, email: u.email, role: u.role, status: u.status !== "inactive" })
    setShowModal(true)
  }

  const handleEditSave = async () => {
    if (!editing || !form.username.trim() || !form.name.trim() || !form.email.trim()) return
    if (form.password && form.password !== form.confirmPassword) { showSuccess("Passwords do not match!"); return }
    const payload: Record<string, unknown> = { username: form.username.trim(), name: form.name.trim(), email: form.email.trim(), role: form.role, status: form.status }
    if (form.password) payload.password = form.password
    await update(editing.id, payload)
    setShowModal(false)
    setEditing(null)
    showSuccess("User updated successfully!")
  }

  const handleDeleteOpen = (id: number) => {
    setDeleteId(id)
    setShowDelete(true)
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDelete(false)
    setDeleteId(null)
    showSuccess("User deleted successfully!")
  }

  const handleSavePermissions = async (permissions: string[]) => {
    if (!permUser) return
    await update(permUser.id, { permissions })
    setPermUser(null)
    showSuccess("Permissions saved")
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
      setLoginAsId(userId)
      await refreshUser()
      router.push(data.redirect || "/admin")
      router.refresh()
    } catch (e) {
      showSuccess(e instanceof Error ? e.message : "Auto-login failed")
    } finally {
      setLoginAsId(null)
    }
  }

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const newStatus = String(currentStatus).toLowerCase() === "active" ? "inactive" : "active"
    await update(userId, { status: newStatus })
    showSuccess(`User ${newStatus === "active" ? "enabled" : "disabled"} successfully!`)
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
    showSuccess(`${ids.length} user(s) ${newStatus === "active" ? "enabled" : "disabled"} successfully!`)
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredUsers.map((u) => u.id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  const getUser = (id: number) => users.find((u) => u.id === id)

  const clearForm = () => {
    setForm(emptyForm)
    setEditing(null)
  }

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="All">All Roles</option>
            {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
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
        <button
          onClick={() => { clearForm(); setShowModal(true) }}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                </th>
                {["Username", "Name", "Email", "Role", "Permissions", "Status", "Last Login", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && filteredUsers.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No users found</td></tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const permCount = Array.isArray(u.permissions) && u.permissions.length > 0
                    ? enabledPermissionCount(u.permissions)
                    : null
                  const isActive = String(u.status).toLowerCase() === "active"
                  return (
                    <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(u.id)}
                          onChange={() => toggleSelect(u.id)}
                          className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                      <td className="px-4 py-3 text-gray-800">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {permCount !== null ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)]">
                            {permCount} custom
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Uses role</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setConfirmAction({ type: isActive ? "disable" : "enable", userId: u.id })}
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
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.lastLogin || "Never"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setPermUser(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Assign Permissions">
                            <Shield className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleEditOpen(u)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteOpen(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {canImpersonate && (
                            <button onClick={() => handleAutoLogin(u.id)} disabled={loginAsId === u.id} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Login as this user">
                              {loginAsId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
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
          Showing {filteredUsers.length} of {nonPortalUsers.length} records
        </div>
      </div>

      {permUser && (
        <PermissionMatrixModal
          title={`Permissions - ${permUser.name}`}
          subtitle="Custom permissions override the user's role. Leave everything unchecked and save to revert to the role's permissions."
          initialPermissions={permUser.permissions}
          onClose={() => setPermUser(null)}
          onSave={handleSavePermissions}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">{editing ? "Edit User" : "Add User"}</h3>
              <button onClick={() => { setShowModal(false); clearForm() }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password {editing && "(leave blank to keep current)"}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowModal(false); clearForm() }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
                <X className="h-4 w-4" /> Cancel
              </button>
              <button onClick={editing ? handleEditSave : handleAdd}
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
              Are you sure you want to delete this user?
              {deleteId && <strong className="block mt-1 text-gray-800">{getUser(deleteId)?.name}</strong>}
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
                {confirmAction.type.includes("disable") ? "Disable User" : "Enable User"}
              </h3>
              <button onClick={() => setConfirmAction(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              {confirmAction.type.includes("bulk")
                ? `Are you sure you want to ${confirmAction.type.includes("disable") ? "disable" : "enable"} ${selectedIds.length} selected user(s)?`
                : `Are you sure you want to ${confirmAction.type === "disable" ? "disable" : "enable"} this user?`
              }
              {confirmAction.type === "disable" && confirmAction.userId && (
                <strong className="block mt-1 text-gray-800">{getUser(confirmAction.userId)?.name}</strong>
              )}
              {confirmAction.type === "disable" && (
                <span className="block mt-2 text-xs text-amber-600">Disabled users cannot log in until re-enabled.</span>
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