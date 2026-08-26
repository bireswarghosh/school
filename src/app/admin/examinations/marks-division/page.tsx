"use client"

import { useState } from "react"
import { Save, Pencil, Trash2, X } from "lucide-react"
import { useApi } from "@/lib/use-api"

type MarksDivision = {
  id: number
  name: string
  percentFrom: number
  percentUpto: number
  description: string
}

const emptyForm = (): MarksDivision => ({
  id: 0,
  name: "",
  percentFrom: 0,
  percentUpto: 0,
  description: "",
})

export default function MarksDivisionPage() {
  const { data: divisions, add, update, remove, loading } = useApi<MarksDivision>("/api/examinations/marks-division")
  const [form, setForm] = useState<MarksDivision>(emptyForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof MarksDivision, string>>>({})

  const handleChange = (field: keyof MarksDivision, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MarksDivision, string>> = {}
    if (!form.name.trim()) newErrors.name = "Division name is required"
    if (isNaN(Number(form.percentFrom))) newErrors.percentFrom = "Valid percent is required"
    if (isNaN(Number(form.percentUpto))) newErrors.percentUpto = "Valid percent is required"
    if (Number(form.percentFrom) > Number(form.percentUpto))
      newErrors.percentUpto = "Upto must be >= From"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      if (editingId) {
        await update(editingId, { name: form.name, percentFrom: form.percentFrom, percentUpto: form.percentUpto, description: form.description })
        setEditingId(null)
      } else {
        await add({ name: form.name, percentFrom: form.percentFrom, percentUpto: form.percentUpto, description: form.description })
      }
      setForm(emptyForm())
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const handleEdit = (division: MarksDivision) => {
    setForm(division)
    setEditingId(division.id)
    setErrors({})
  }

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return
    try {
      await remove(deleteId)
      if (editingId === deleteId) {
        setForm(emptyForm())
        setEditingId(null)
      }
      setDeleteId(null)
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const handleCancel = () => {
    setForm(emptyForm())
    setEditingId(null)
    setErrors({})
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-linear-to-r from-[var(--primary)] to-[var(--primary)]/80 px-8 py-6">
        <div className="flex items-center gap-2 text-sm text-[var(--primary)]/80">
          <span>Examinations</span>
          <span>/</span>
          <span className="text-white font-medium">Marks Division</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">Marks Division</h1>
      </div>

      <div className="mx-auto max-w-7xl px-8 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingId ? "Edit Division" : "Add Division"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Division Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-[var(--primary)]"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Percent From</label>
                  <input
                    type="number"
                    value={form.percentFrom}
                    onChange={(e) => handleChange("percentFrom", Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  {errors.percentFrom && <p className="mt-1 text-xs text-red-500">{errors.percentFrom}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Percent Upto</label>
                  <input
                    type="number"
                    value={form.percentUpto}
                    onChange={(e) => handleChange("percentUpto", Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  {errors.percentUpto && <p className="mt-1 text-xs text-red-500">{errors.percentUpto}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--secondary)]"
                >
                  <Save size={16} />
                  {editingId ? "Update" : "Save"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">Divisions List</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Division Name</th>
                    <th className="px-4 py-3">Percent From</th>
                    <th className="px-4 py-3">Percent Upto</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {divisions.map((division, index) => (
                    <tr key={division.id} className="hover:bg-gray-50 even:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{division.name}</td>
                      <td className="px-4 py-3 text-gray-600">{division.percentFrom}%</td>
                      <td className="px-4 py-3 text-gray-600">{division.percentUpto}%</td>
                      <td className="px-4 py-3 text-gray-600">{division.description}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(division)}
                            className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(division.id)}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {divisions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        No divisions defined yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setDeleteId(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Are you sure you want to delete this division? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
