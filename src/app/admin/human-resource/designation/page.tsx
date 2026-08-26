"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Designation = {
  id: number
  name: string
  department: string
}

const departments = ["Science", "Mathematics", "English", "Social Studies", "Languages", "Computer Science", "Physical Education", "Administration", "Transport", "Library"]

export default function DesignationPage() {
  const { data: designations, add, update, remove, loading } = useApi<Designation>("/api/human-resource/designation")
  const [desigName, setDesigName] = useState("")
  const [desigDept, setDesigDept] = useState(departments[0])
  const [editingId, setEditingId] = useState<number | null>(null)

  const handleSave = async () => {
    if (!desigName.trim()) return
    if (editingId) {
      await update(editingId, { name: desigName.trim(), department: desigDept })
      setEditingId(null)
    } else {
      await add({ name: desigName.trim(), department: desigDept })
    }
    setDesigName("")
    setDesigDept(departments[0])
  }

  const handleEdit = (d: Designation) => {
    setEditingId(d.id)
    setDesigName(d.name)
    setDesigDept(d.department)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Delete this designation?")) {
      await remove(id)
      if (editingId === id) {
        setEditingId(null)
        setDesigName("")
        setDesigDept(departments[0])
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Designation</h2>
          <p className="text-sm text-white/70 mt-0.5">Human Resource / Designation</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">{editingId ? "Edit Designation" : "Add Designation"}</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Designation Name <span className="text-red-500">*</span></label>
              <input value={desigName} onChange={(e) => setDesigName(e.target.value)} placeholder="Enter designation name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <select value={desigDept} onChange={(e) => setDesigDept(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleSave} disabled={!desigName.trim()}
                className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                Save
              </button>
              {editingId && (
                <button onClick={() => { setEditingId(null); setDesigName(""); setDesigDept(departments[0]) }}
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
          <h3 className="text-sm font-semibold text-gray-800">Designation List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Designation", "Department", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {designations.map((d, idx) => (
                <tr key={d.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                  <td className="px-4 py-3 text-gray-600">{d.department}</td>
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
          <span className="text-sm text-gray-500">Showing {designations.length} records</span>
        </div>
      </div>
    </div>
  )
}
