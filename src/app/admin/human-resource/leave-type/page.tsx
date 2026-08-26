"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { useApi } from "@/lib/use-api"

type LeaveType = {
  id: number
  name: string
  maxDays: number
}

export default function LeaveTypePage() {
  const { data: leaveTypes, add, update, remove, loading } = useApi<LeaveType>("/api/attendance/leave-type")
  const [name, setName] = useState("")
  const [maxDays, setMaxDays] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)

  const handleSave = async () => {
    if (!name || !maxDays) return
    const days = parseInt(maxDays)
    if (days <= 0) return
    if (editingId) {
      await update(editingId, { name, maxDays: days })
      setEditingId(null)
    } else {
      await add({ name, maxDays: days })
    }
    setName("")
    setMaxDays("")
  }

  const handleEdit = (l: LeaveType) => {
    setEditingId(l.id)
    setName(l.name)
    setMaxDays(l.maxDays.toString())
  }

  const handleDelete = async (id: number) => {
    if (confirm("Delete this leave type?")) {
      await remove(id)
      if (editingId === id) {
        setEditingId(null)
        setName("")
        setMaxDays("")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Leave Type</h2>
          <p className="text-sm text-white/70 mt-0.5">Human Resource / Leave Type</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">{editingId ? "Edit Leave Type" : "Add Leave Type"}</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Leave Type Name <span className="text-red-500">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter leave type"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Days <span className="text-red-500">*</span></label>
              <input type="number" value={maxDays} onChange={(e) => setMaxDays(e.target.value)} placeholder="Enter max days"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div className="flex items-end">
              <button onClick={handleSave} disabled={!name || !maxDays}
                className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                Save
              </button>
              {editingId && (
                <button onClick={() => { setEditingId(null); setName(""); setMaxDays("") }}
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
          <h3 className="text-sm font-semibold text-gray-800">Leave Types List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Leave Type", "Max Days", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map((l, idx) => (
                <tr key={l.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{l.name}</td>
                  <td className="px-4 py-3 text-gray-600">{l.maxDays}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(l)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(l.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
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
          <span className="text-sm text-gray-500">Showing {leaveTypes.length} records</span>
        </div>
      </div>
    </div>
  )
}
