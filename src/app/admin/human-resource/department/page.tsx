"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Department = {
  id: number
  name: string
}

export default function DepartmentPage() {
  const { data: departments, add, update, remove, loading } = useApi<Department>("/api/human-resource/department")
  const [deptName, setDeptName] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)

  const handleSave = async () => {
    if (!deptName.trim()) return
    if (editingId) {
      await update(editingId, { name: deptName.trim() })
      setEditingId(null)
    } else {
      await add({ name: deptName.trim() })
    }
    setDeptName("")
  }

  const handleEdit = (d: Department) => {
    setEditingId(d.id)
    setDeptName(d.name)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Delete this department?")) {
      await remove(id)
      if (editingId === id) {
        setEditingId(null)
        setDeptName("")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Department</h2>
          <p className="text-sm text-white/70 mt-0.5">Human Resource / Department</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">{editingId ? "Edit Department" : "Add Department"}</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department Name <span className="text-red-500">*</span></label>
              <input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="Enter department name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div className="flex items-end">
              <button onClick={handleSave} disabled={!deptName.trim()}
                className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                Save
              </button>
              {editingId && (
                <button onClick={() => { setEditingId(null); setDeptName("") }}
                  className="ml-2 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Department List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Department Name", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map((d, idx) => (
                <tr key={d.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(d)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">Showing {departments.length} records</span>
        </div>
      </div>
    </div>
  )
}
