"use client"

import { useState } from "react"
import { Plus, X, Save, Shield, Search } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { toast as notify } from "@/lib/toast"
import { enabledPermissionCount } from "@/lib/permissions"
import PermissionMatrixModal from "@/components/PermissionMatrixModal"

type Role = {
  id: number
  name: string
  description: string
  permissions: string[]
}

export default function RolesPermissionsPanel() {
  const { data: roles, add, update, loading } = useApi<Role>("/api/roles")
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addName, setAddName] = useState("")
  const [addDescription, setAddDescription] = useState("")
  const [roleSearch, setRoleSearch] = useState("")

  const filteredRoles = roles.filter((r) =>
    (r.name + r.description).toLowerCase().includes(roleSearch.trim().toLowerCase())
  )

  const handleSavePermissions = async (permissions: string[]) => {
    if (!selectedRole) return
    try {
      await update(selectedRole.id, { ...selectedRole, permissions })
      notify.success("Permissions saved")
      setSelectedRole(null)
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

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            placeholder="Search roles..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>
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
              {filteredRoles.map((role, idx) => (
                <tr key={role.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{role.name}</td>
                  <td className="px-4 py-3 text-gray-600">{role.description}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)]">
                      {enabledPermissionCount(role.permissions)} permissions
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedRole(role)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Permissions">
                      <Shield className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRoles.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">{loading ? "Loading..." : "No roles found"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          Showing {filteredRoles.length} records
        </div>
      </div>

      {selectedRole && (
        <PermissionMatrixModal
          title={`Permissions - ${selectedRole.name}`}
          subtitle={selectedRole.description || "Assign view / add / edit / delete permissions per menu item"}
          initialPermissions={selectedRole.permissions}
          onClose={() => setSelectedRole(null)}
          onSave={handleSavePermissions}
        />
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