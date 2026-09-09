"use client"

import { useState, useCallback } from "react"
import { Plus, Pencil, Trash2, X, Save, Eye, Copy, Check } from "lucide-react"
import { useApi } from "@/lib/use-api"

type TemplateField = {
  key: string
  label: string
}

type Template = {
  id: number
  name: string
  type: string
  content: string
  status: string
  description: string
  fields: TemplateField[]
  isDefault: boolean
}

const templateTypes = ["report", "admit", "marksheet", "certificate"]
const statusOptions = ["Active", "Inactive"]

export default function ICSCExamTemplatePage() {
  const { data: templates, add, update, remove, loading } = useApi<Template>("/api/icsc/template")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [previewItem, setPreviewItem] = useState<Template | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const defaultFields = [{ key: "", label: "" }]
  const defaultForm = { name: "", type: "report", content: "", status: "Active", description: "", isDefault: false, fields: defaultFields }
  const [form, setForm] = useState<typeof defaultForm>({ ...defaultForm })
  const [editForm, setEditForm] = useState<typeof defaultForm & { id: number }>({ id: 0, ...defaultForm })

  const handleFieldChange = (idx: number, field: "key" | "label", value: string, isEdit: boolean) => {
    const setter = isEdit ? setEditForm : setForm
    setter((prev: any) => {
      const newFields = [...prev.fields]
      newFields[idx] = { ...newFields[idx], [field]: value }
      return { ...prev, fields: newFields }
    })
  }

  const addField = (isEdit: boolean) => {
    const setter = isEdit ? setEditForm : setForm
    setter((prev: any) => ({ ...prev, fields: [...prev.fields, { key: "", label: "" }] }))
  }

  const removeField = (idx: number, isEdit: boolean) => {
    const setter = isEdit ? setEditForm : setForm
    setter((prev: any) => ({ ...prev, fields: prev.fields.filter((_: any, i: number) => i !== idx) }))
  }

  const validate = (data: typeof defaultForm) => {
    const errs: Record<string, string> = {}
    if (!data.name.trim()) errs.name = "Template name is required"
    if (!data.type) errs.type = "Type is required"
    if (!data.content.trim()) errs.content = "Content is required"
    return errs
  }

  const handleAdd = async () => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      await add({ name: form.name.trim(), type: form.type, content: form.content.trim(), status: form.status, description: form.description.trim(), fields: form.fields.filter((f) => f.key.trim() || f.label.trim()), isDefault: form.isDefault })
      setShowAddModal(false)
      setForm({ ...defaultForm })
    } catch (e: any) { setErrors({ name: e.message }) }
  }

  const handleEditOpen = (t: Template) => {
    setEditForm({ id: t.id, name: t.name, type: t.type || "report", content: t.content || "", status: t.status || "Active", description: t.description || "", isDefault: t.isDefault, fields: t.fields?.length ? t.fields.map((f) => ({ ...f })) : defaultFields })
    setErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs = validate(editForm)
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      await update(editForm.id, { name: editForm.name.trim(), type: editForm.type, content: editForm.content.trim(), status: editForm.status, description: editForm.description.trim(), fields: editForm.fields.filter((f) => f.key.trim() || f.label.trim()), isDefault: editForm.isDefault })
      setShowEditModal(false)
    } catch (e: any) { setErrors({ name: e.message }) }
  }

  const handleCopy = async (t: Template) => {
    try {
      await add({ name: t.name + " (Copy)", type: t.type, content: t.content, status: "Inactive", description: t.description, fields: t.fields, isDefault: false })
      setCopiedId(t.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (e: any) { console.error(e) }
  }

  const handleDeleteOpen = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }
  const confirmDelete = async () => {
    if (deleteId === null) return
    try {
      await remove(deleteId)
      setShowDeleteModal(false)
      setDeleteId(null)
    } catch (e: any) { setErrors({ name: e.message }) }
  }

  const Modal = useCallback(({ title, show, onClose, children, wide }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative bg-white rounded-xl shadow-2xl z-10 w-full mx-4 ${wide ? "max-w-3xl" : "max-w-lg"}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
          </div>
          {children}
        </div>
      </div>
    )
  }, [])

  const renderForm = (data: typeof defaultForm & { id?: number }, isEdit: boolean) => (
    <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Name <span className="text-red-500">*</span></label>
          <input type="text" value={data.name} onChange={(e) => { const setter = isEdit ? setEditForm : setForm; setter({ ...data, name: e.target.value } as any); if (errors.name) setErrors({}) }}
            placeholder="Enter template name" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
          <select value={data.type} onChange={(e) => { (isEdit ? setEditForm : setForm)({ ...data, type: e.target.value } as any) }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
            {templateTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input type="text" value={data.description} onChange={(e) => { (isEdit ? setEditForm : setForm)({ ...data, description: e.target.value } as any) }} placeholder="Enter description"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content <span className="text-red-500">*</span></label>
        <textarea value={data.content} onChange={(e) => { (isEdit ? setEditForm : setForm)({ ...data, content: e.target.value } as any) }} rows={4}
          placeholder="<h2>{{exam_name}}</h2><p>{{student_name}}</p>"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-mono" />
        {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={data.status} onChange={(e) => { (isEdit ? setEditForm : setForm)({ ...data, status: e.target.value } as any) }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={data.isDefault} onChange={(e) => { (isEdit ? setEditForm : setForm)({ ...data, isDefault: e.target.checked } as any) }}
              className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
            Set as Default Template
          </label>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Placeholder Fields</label>
          <button type="button" onClick={() => addField(isEdit)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"><Plus className="h-3 w-3" /> Add Field</button>
        </div>
        <div className="space-y-2">
          {data.fields.map((field, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input type="text" value={field.key} onChange={(e) => handleFieldChange(idx, "key", e.target.value, isEdit)} placeholder="Key (e.g. student_name)"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-mono" />
              <input type="text" value={field.label} onChange={(e) => handleFieldChange(idx, "label", e.target.value, isEdit)} placeholder="Label (e.g. Student Name)"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {data.fields.length > 1 && (
                <button onClick={() => removeField(idx, isEdit)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remove"><X className="h-4 w-4" /></button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Template</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">ICSC Examination / Template</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-700">Template List</h3>
          <button onClick={() => { setForm({ ...defaultForm }); setErrors({}); setShowAddModal(true) }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
            <Plus className="h-4 w-4" /> Add Template
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Template Name", "Type", "Status", "Default", "Fields", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : templates.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No templates found</td></tr>
              ) : (
                templates.map((t, idx) => (
                  <tr key={t.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{t.type || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{t.status || "Inactive"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {t.isDefault ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Default</span> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(t.fields || []).map((f, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-mono">{f.key || f.label}</span>
                        ))}
                        {(!t.fields || t.fields.length === 0) && <span className="text-xs text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setPreviewItem(t); setShowPreviewModal(true) }} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="Preview"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleCopy(t)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Copy">
                          {copiedId === t.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <button onClick={() => handleEditOpen(t)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteOpen(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>Showing {templates.length} records</span>
        </div>
      </div>

      <Modal title="Add Template" show={showAddModal} onClose={() => setShowAddModal(false)} wide>
        {renderForm(form, false)}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <Modal title="Edit Template" show={showEditModal} onClose={() => setShowEditModal(false)} wide>
        {renderForm(editForm, true)}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleEditSave} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <Modal title="Confirm Delete" show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="px-6 py-6 text-center text-gray-600">
          Are you sure you want to delete this template?
          {deleteId && <strong className="block mt-1 text-gray-800">{templates.find((t) => t.id === deleteId)?.name}</strong>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={confirmDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      </Modal>

      <Modal title={`Template Preview - ${previewItem?.name || ""}`} show={showPreviewModal} onClose={() => setShowPreviewModal(false)} wide>
        {previewItem && (
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold text-gray-600">Name:</span> <span className="text-gray-800">{previewItem.name}</span></div>
              <div><span className="font-semibold text-gray-600">Type:</span> <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{previewItem.type}</span></div>
              <div><span className="font-semibold text-gray-600">Status:</span> <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${previewItem.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{previewItem.status}</span></div>
              <div><span className="font-semibold text-gray-600">Default:</span> {previewItem.isDefault ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Yes</span> : "No"}</div>
            </div>
            {previewItem.description && <p className="text-sm text-gray-500">{previewItem.description}</p>}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Content</h4>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm font-mono whitespace-pre-wrap">{previewItem.content || "—"}</div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Placeholder Fields</h4>
              <table className="w-full text-sm border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Key</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Label</th>
                  </tr>
                </thead>
                <tbody>
                  {(previewItem.fields || []).length === 0 ? (
                    <tr><td colSpan={3} className="border border-gray-200 px-3 py-4 text-center text-gray-400">No fields defined</td></tr>
                  ) : (
                    previewItem.fields.map((f, i) => (
                      <tr key={i}>
                        <td className="border border-gray-200 px-3 py-2 text-gray-600">{i + 1}</td>
                        <td className="border border-gray-200 px-3 py-2 font-mono text-sm text-[var(--primary)]">{f.key}</td>
                        <td className="border border-gray-200 px-3 py-2 text-gray-800">{f.label || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Close</button>
        </div>
      </Modal>
    </div>
  )
}
