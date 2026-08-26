"use client"

import { useState, useMemo } from "react"
import { Plus, Edit3, Trash2, Eye, X, Search } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Alumni = {
  id: number
  name: string
  email: string
  phone: string
  passoutYear: number
  occupation: string
  company: string
  location: string
  address: string
  status: string
}

type AlumniForm = {
  name: string
  email: string
  phone: string
  passoutYear: number
  occupation: string
  company: string
  location: string
  address: string
  status: string
}

const emptyForm: AlumniForm = { name: "", email: "", phone: "", passoutYear: 2026, occupation: "", company: "", location: "", address: "", status: "Active" }

const passoutYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

export default function ManageAlumniPage() {
  const { data: alumni, add, update, remove, loading } = useApi<Alumni>("/api/alumni")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewAlumni, setViewAlumni] = useState<Alumni | null>(null)
  const [form, setForm] = useState<AlumniForm>(emptyForm)
  const [filterYear, setFilterYear] = useState("")

  const filteredAlumni = useMemo(() => {
    if (!filterYear) return alumni
    return alumni.filter((a) => a.passoutYear === parseInt(filterYear))
  }, [alumni, filterYear])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (a: Alumni) => {
    setEditingId(a.id)
    setForm({ name: a.name, email: a.email, phone: a.phone, passoutYear: a.passoutYear, occupation: a.occupation, company: a.company, location: a.location, address: a.address, status: a.status })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (editingId) {
      await update(editingId, form)
    } else {
      await add(form)
    }
    setShowModal(false)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this alumni record?")) {
      await remove(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Manage Alumni</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Manage Alumni</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All Passout Years</option>
              {passoutYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Search className="h-4 w-4" /> Search</button>
          </div>
          <button onClick={openAdd} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Plus className="h-4 w-4" /> Add Alumni</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Passout Year</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Current Occupation</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Current Location</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlumni.map((a, idx) => (
                <tr key={a.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{a.name}</td>
                  <td className="px-4 py-3 text-gray-600">{a.email}</td>
                  <td className="px-4 py-3 text-gray-600">{a.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{a.passoutYear}</td>
                  <td className="px-4 py-3 text-gray-600">{a.occupation} at {a.company}</td>
                  <td className="px-4 py-3 text-gray-600">{a.location}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewAlumni(a)} className="text-blue-600 hover:text-blue-800"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(a)} className="text-amber-600 hover:text-amber-800"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAlumni.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No alumni records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-sm text-gray-500">Showing {filteredAlumni.length} records</div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{editingId ? "Edit Alumni" : "Add Alumni"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passout Year</label>
                <select value={form.passoutYear} onChange={(e) => setForm({ ...form, passoutYear: parseInt(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  {passoutYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Occupation</label>
                <input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">Save</button>
            </div>
          </div>
        </div>
      )}

      {viewAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewAlumni(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Alumni Details</h2>
              <button onClick={() => setViewAlumni(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Name:</span><span className="text-gray-800">{viewAlumni.name}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Email:</span><span className="text-gray-800">{viewAlumni.email}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Phone:</span><span className="text-gray-800">{viewAlumni.phone}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Passout Year:</span><span className="text-gray-800">{viewAlumni.passoutYear}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Occupation:</span><span className="text-gray-800">{viewAlumni.occupation} at {viewAlumni.company}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Location:</span><span className="text-gray-800">{viewAlumni.location}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Address:</span><span className="text-gray-800">{viewAlumni.address}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Status:</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${viewAlumni.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{viewAlumni.status}</span></div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setViewAlumni(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
