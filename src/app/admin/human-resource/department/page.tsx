"use client"

import { useState, useMemo } from "react"
import { Pencil, Trash2, Upload, X } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Department = {
  id: number
  name: string
}

export default function DepartmentPage() {
  const { data: departments, add, update, remove, loading, refetch } = useApi<Department>("/api/human-resource/department")
  const [deptName, setDeptName] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showBulk, setShowBulk] = useState(false)
  const [bulkText, setBulkText] = useState("")
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkError, setBulkError] = useState("")

  const bulkPreview = useMemo(() => {
    const rawLines = bulkText.split("\n").map((s) => s.trim()).filter(Boolean)
    const seen = new Set<string>()
    const unique: string[] = []
    for (const n of rawLines) {
      const key = n.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(n)
    }
    const existingSet = new Set(departments.map((d) => d.name.trim().toLowerCase()))
    const willCreate = unique.filter((n) => !existingSet.has(n.toLowerCase())).length
    const willSkipExisting = unique.length - willCreate
    const dupInInput = rawLines.length - unique.length
    return { total: rawLines.length, unique: unique.length, willCreate, willSkipExisting, dupInInput, uniqueList: unique }
  }, [bulkText, departments])

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

  const handleBulkImport = async () => {
    const names = bulkPreview.uniqueList
    if (names.length === 0) {
      setBulkError("Enter at least one department name")
      return
    }
    setBulkSaving(true)
    setBulkError("")
    try {
      const res = await fetch("/api/human-resource/department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to import")
      // data.created is array, data.skipped is number
      await refetch()
      setShowBulk(false)
      setBulkText("")
    } catch (e: any) {
      setBulkError(e.message || "Failed to import")
    } finally {
      setBulkSaving(false)
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
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Department List</h3>
          <button
            onClick={() => { setBulkText(""); setBulkError(""); setShowBulk(true) }}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3.5 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            <Upload className="h-3.5 w-3.5" />
            Bulk Upload
          </button>
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

      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Bulk Upload Departments</h2>
                <p className="text-xs text-gray-500 mt-0.5">Each line is a Department Name — empty lines & duplicates are ignored</p>
              </div>
              <button onClick={() => setShowBulk(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {bulkError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{bulkError}</div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department Names (one per line) <span className="text-red-500">*</span></label>
              <textarea
                value={bulkText}
                onChange={(e) => { setBulkText(e.target.value); if (bulkError) setBulkError("") }}
                rows={10}
                placeholder={"Academics\nAdministration\nAccounts\nLibrary\nSports\nTransport"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">{bulkPreview.total} lines</span>
                <span className="rounded-full bg-[var(--primary-light)] px-2.5 py-1 text-[var(--primary)]">{bulkPreview.unique} unique</span>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">{bulkPreview.willCreate} will be created</span>
                {bulkPreview.willSkipExisting > 0 && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{bulkPreview.willSkipExisting} already exists</span>
                )}
                {bulkPreview.dupInInput > 0 && (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-600">{bulkPreview.dupInInput} duplicates in input</span>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowBulk(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={bulkSaving || bulkPreview.unique === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {bulkSaving ? "Importing..." : `Import ${bulkPreview.willCreate > 0 ? `${bulkPreview.willCreate} ` : ""}Departments`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
