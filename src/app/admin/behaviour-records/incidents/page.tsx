"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Pencil, Trash2, X, Save } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface Incident {
  id: number
  title: string
  points: number
  isNegative: boolean
  description: string
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-lg mx-4">
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function IncidentsPage() {
  const { data: incidents, add, update, remove, loading } = useApi<Incident>("/api/behaviour/incident")
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Incident | null>(null)
  const [form, setForm] = useState<Partial<Incident>>({ title: "", points: 0, isNegative: false, description: "" })

  const filtered = useMemo(() => {
    if (!search.trim()) return incidents
    const q = search.toLowerCase()
    return incidents.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
  }, [search, incidents])

  const openAdd = () => {
    setEditId(null)
    setForm({ title: "", points: 0, isNegative: false, description: "" })
    setShowModal(true)
  }

  const openEdit = (incident: Incident) => {
    setEditId(incident.id)
    setForm({ title: incident.title, points: incident.points, isNegative: incident.isNegative, description: incident.description })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.description) return
    if (editId) {
      await update(editId, form)
    } else {
      await add(form)
    }
    setShowModal(false)
    setEditId(null)
    setForm({})
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await remove(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Incidents</h2>
          <p className="text-sm text-gray-500 mt-1">Behaviour Records / Incidents</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incidents..."
              className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent w-52" />
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Title", "Point", "Description", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No incidents found</td></tr>
              ) : (
                filtered.map((incident, idx) => (
                  <tr key={incident.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)] transition-colors`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{incident.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        incident.isNegative ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        {incident.isNegative ? "-" : "+"}{incident.points}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{incident.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(incident)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(incident)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ModalOverlay onClose={() => { setShowModal(false); setEditId(null) }}>
          <ModalHeader title={editId ? "Edit Incident" : "Add Incident"} onClose={() => { setShowModal(false); setEditId(null) }} />
          <div className="px-6 py-4 space-y-4">
            <Field label="Title" required>
              <input type="text" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter incident title" />
            </Field>
            <Field label="Point" required>
              <input type="number" value={form.points || ""} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter points" />
            </Field>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isNegative || false} onChange={(e) => setForm({ ...form, isNegative: e.target.checked })}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <span className="text-sm text-gray-700">Is This Negative Incident?</span>
            </label>
            <Field label="Description" required>
              <textarea rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" placeholder="Enter incident description" />
            </Field>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => { setShowModal(false); setEditId(null) }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </ModalOverlay>
      )}

      {deleteTarget && (
        <ModalOverlay onClose={() => setDeleteTarget(null)}>
          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Incident</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong className="text-gray-800">{deleteTarget.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
