"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Check, Save } from "lucide-react"

interface BranchSetting {
  id: number
  name: string
  hostname: string
  databaseName: string
  username: string
  isDefault: boolean
  status: string
  purchaseCode: string
}

const initialBranches: BranchSetting[] = [
  { id: 1, name: "Main Campus", hostname: "main.smartschool.edu", databaseName: "ss_main", username: "root", isDefault: true, status: "Active", purchaseCode: "XXXXXXXXXXXX" },
  { id: 2, name: "North Campus", hostname: "north.smartschool.edu", databaseName: "ss_north", username: "root", isDefault: false, status: "Active", purchaseCode: "XXXXXXXXXXXX" },
  { id: 3, name: "South Campus", hostname: "south.smartschool.edu", databaseName: "ss_south", username: "root", isDefault: false, status: "Active", purchaseCode: "XXXXXXXXXXXX" },
]

function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">OK</button>
        </div>
      </div>
    </div>
  )
}

export default function MultiBranchSettingPage() {
  const [branches, setBranches] = useState<BranchSetting[]>(initialBranches)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState<BranchSetting | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" })
  const [formData, setFormData] = useState({ purchaseCode: "", hostname: "", databaseName: "", username: "", password: "", isDefault: false })

  const showToast = (message: string) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: "" }), 3000)
  }

  const handleAddBranch = () => {
    const newId = Math.max(...branches.map((b) => b.id), 0) + 1
    const branchName = formData.hostname.split(".")[0]
    const name = branchName.charAt(0).toUpperCase() + branchName.slice(1) + " Campus"
    const newBranch: BranchSetting = {
      id: newId, name, hostname: formData.hostname, databaseName: formData.databaseName,
      username: formData.username, isDefault: formData.isDefault, status: "Active", purchaseCode: formData.purchaseCode,
    }
    setBranches(formData.isDefault ? branches.map((b) => ({ ...b, isDefault: false })).concat(newBranch) : [...branches, newBranch])
    setShowAddModal(false)
    setFormData({ purchaseCode: "", hostname: "", databaseName: "", username: "", password: "", isDefault: false })
    showToast("Branch added successfully!")
  }

  const handleEditBranch = () => {
    if (!editingBranch) return
    setBranches(branches.map((b) => (b.id === editingBranch.id ? editingBranch : b)))
    setShowEditModal(false)
    setEditingBranch(null)
    showToast("Branch updated successfully!")
  }

  const handleDeleteBranch = (id: number) => {
    setBranches(branches.filter((b) => b.id !== id))
    setDeleteConfirmId(null)
    showToast("Branch deleted successfully!")
  }

  return (
    <div className="space-y-6">
      {toast.show && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-in">
          <Check className="h-4 w-4" />
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Multi Branch Setting</h2>
          <p className="text-sm text-gray-500 mt-1">Multi Branch / Setting</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> Add New
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">Branch Management</h3>
          <p className="text-xs text-gray-500 mt-0.5">Manage all school branches, add new branches, edit or delete existing ones</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "Branch Name", "Hostname", "Database Name", "Username", "Purchase Code", "Status", "Default", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.map((b, idx) => (
                <tr key={b.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                  <td className="px-4 py-2.5 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{b.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{b.hostname}</td>
                  <td className="px-4 py-2.5 text-gray-600">{b.databaseName}</td>
                  <td className="px-4 py-2.5 text-gray-600">{b.username}</td>
                  <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{b.purchaseCode}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {b.isDefault ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)] rounded">Default</span>
                    ) : (
                      <span className="text-xs text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingBranch({ ...b }); setShowEditModal(true) }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(b.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-400">No branches found. Click "Add New" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">Multi Branch Settings</h3>
          <p className="text-xs text-gray-500 mt-0.5">Configure multi branch module behaviour</p>
        </div>
        <div className="p-5 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked
              className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
            <span className="text-sm text-gray-700">Enable Multi Branch Module</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked
              className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
            <span className="text-sm text-gray-700">Show Branch Switch Button in Header</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox"
              className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
            <span className="text-sm text-gray-700">Allow Cross Branch Data Access</span>
          </label>
        </div>
        <div className="flex justify-end px-5 py-4 border-t border-gray-200">
          <button onClick={() => showToast("Settings saved successfully!")}
            className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2">
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Add New Branch</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <p className="text-xs text-gray-500">Fill in the details below to add a new branch. The database username and password must be the same as the home branch.</p>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Envato Purchase Code <span className="text-red-500">*</span></label>
                <input type="text" value={formData.purchaseCode} onChange={(e) => setFormData({ ...formData, purchaseCode: e.target.value })}
                  placeholder="Enter your Envato purchase code" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                <span className="text-sm text-gray-700">Make Default Branch</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Hostname <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.hostname} onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                    placeholder="e.g. branch.example.com" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Database Name <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.databaseName} onChange={(e) => setFormData({ ...formData, databaseName: e.target.value })}
                    placeholder="e.g. ss_branch_name" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Username <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Database username" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Password <span className="text-red-500">*</span></label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Database password" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleAddBranch}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">Verify & Save</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingBranch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowEditModal(false); setEditingBranch(null) }} />
          <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Edit Branch - {editingBranch.name}</h2>
              <button onClick={() => { setShowEditModal(false); setEditingBranch(null) }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Branch Name</label>
                  <input type="text" value={editingBranch.name} onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Purchase Code</label>
                  <input type="text" value={editingBranch.purchaseCode} onChange={(e) => setEditingBranch({ ...editingBranch, purchaseCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Hostname <span className="text-red-500">*</span></label>
                  <input type="text" value={editingBranch.hostname} onChange={(e) => setEditingBranch({ ...editingBranch, hostname: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Database Name <span className="text-red-500">*</span></label>
                  <input type="text" value={editingBranch.databaseName} onChange={(e) => setEditingBranch({ ...editingBranch, databaseName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Username <span className="text-red-500">*</span></label>
                  <input type="text" value={editingBranch.username} onChange={(e) => setEditingBranch({ ...editingBranch, username: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Status</label>
                  <select value={editingBranch.status} onChange={(e) => setEditingBranch({ ...editingBranch, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => { setShowEditModal(false); setEditingBranch(null) }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleEditBranch}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">Verify & Save</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <ConfirmDialog
          title="Confirm Delete"
          message={`Are you sure you want to delete "${branches.find((b) => b.id === deleteConfirmId)?.name}"? This action cannot be undone.`}
          onConfirm={() => handleDeleteBranch(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  )
}
