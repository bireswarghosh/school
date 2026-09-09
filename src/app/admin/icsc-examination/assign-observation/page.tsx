"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type ObservationTerm = {
  id: number
  name: string
  class: string
  section: string
  subject: string
  teacher: string
  description: string
}

const subjects = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Computer Science"]
const teachers = ["Dr. Rajesh Kumar", "Mrs. Sunita Sharma", "Mr. Amit Verma", "Ms. Priya Singh", "Mr. Vikram Patel"]

export default function IcscAssignObservationPage() {
  const { classNames: classes, sectionNames: sections } = useClassesAndSections()
  const { data: observations, add, update, remove, loading } = useApi<ObservationTerm>("/api/icsc/observation")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({ name: "", class: "", section: "", subject: "", teacher: "", description: "" })
  const [editForm, setEditForm] = useState({ id: 0, name: "", class: "", section: "", subject: "", teacher: "", description: "" })

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, isEdit: boolean) => {
    const { name, value } = e.target
    if (isEdit) {
      setEditForm((prev) => ({ ...prev, [name]: value }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const validateForm = (data: typeof form) => {
    const errs: Record<string, string> = {}
    if (!data.name.trim()) errs.name = "Observation name is required"
    if (!data.class) errs.class = "Class is required"
    if (!data.section) errs.section = "Section is required"
    if (!data.subject) errs.subject = "Subject is required"
    if (!data.teacher) errs.teacher = "Teacher is required"
    return errs
  }

  const handleAdd = async () => {
    const errs = validateForm(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      await add({ name: form.name.trim(), class: form.class, section: form.section, subject: form.subject, teacher: form.teacher, description: form.description.trim() })
      setShowAddModal(false)
      setForm({ name: "", class: "", section: "", subject: "", teacher: "", description: "" })
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const handleEditOpen = (obs: ObservationTerm) => {
    setEditForm({ id: obs.id, name: obs.name, class: obs.class, section: obs.section, subject: obs.subject, teacher: obs.teacher, description: obs.description })
    setErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs = validateForm(editForm)
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      await update(editForm.id, { name: editForm.name.trim(), class: editForm.class, section: editForm.section, subject: editForm.subject, teacher: editForm.teacher, description: editForm.description.trim() })
      setShowEditModal(false)
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const handleDeleteOpen = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }
  const confirmDelete = async () => {
    if (deleteId === null) return
    try {
      await remove(deleteId)
      setShowDeleteModal(false)
      setDeleteId(null)
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const FormFields = ({ data, onChange }: { data: typeof form; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void }) => (
    <div className="px-6 py-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Observation Name <span className="text-red-500">*</span></label>
          <input type="text" name="name" value={data.name} onChange={onChange} placeholder="e.g. PT1 Observation"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Teacher <span className="text-red-500">*</span></label>
          <select name="teacher" value={data.teacher} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
            <option value="">Select</option>
            {teachers.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.teacher && <p className="text-red-500 text-xs mt-1">{errors.teacher}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Class <span className="text-red-500">*</span></label>
          <select name="class" value={data.class} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
            <option value="">Select</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Section <span className="text-red-500">*</span></label>
          <select name="section" value={data.section} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
            <option value="">Select</option>
            {sections.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.section && <p className="text-red-500 text-xs mt-1">{errors.section}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Subject <span className="text-red-500">*</span></label>
          <select name="subject" value={data.subject} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
            <option value="">Select</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">Description</label>
        <textarea name="description" value={data.description} onChange={onChange} placeholder="Enter description" rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Assign Observation</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">ICSC Examination / Assign Observation</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-700">Observation List</h3>
          <button onClick={() => { setForm({ name: "", class: "", section: "", subject: "", teacher: "", description: "" }); setErrors({}); setShowAddModal(true) }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
            <Plus className="h-4 w-4" /> Assign Observation
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Observation Name", "Class", "Section", "Subject", "Teacher", "Description", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {observations.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No observations found</td></tr>
              ) : (
                observations.map((obs, idx) => (
                  <tr key={obs.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{obs.name}</td>
                    <td className="px-4 py-3 text-gray-600">{obs.class}</td>
                    <td className="px-4 py-3 text-gray-600">{obs.section}</td>
                    <td className="px-4 py-3 text-gray-600">{obs.subject}</td>
                    <td className="px-4 py-3 text-gray-600">{obs.teacher}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{obs.description || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditOpen(obs)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteOpen(obs.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>Showing {observations.length} records</span>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Assign Observation</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            {FormFields({ data: form, onChange: (e) => handleFormChange(e, false) })}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Save className="h-4 w-4" /> Save</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Edit Observation</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            {FormFields({ data: editForm, onChange: (e) => handleFormChange(e, true) })}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleEditSave} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Save className="h-4 w-4" /> Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Are you sure you want to delete this observation?
                {deleteId && <strong className="block mt-1 text-gray-800">{observations.find((o) => o.id === deleteId)?.name}</strong>}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
