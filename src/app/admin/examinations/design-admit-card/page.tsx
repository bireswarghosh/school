"use client"

import { useState } from "react"
import { Save, Pencil, Trash2, X, Eye, Plus } from "lucide-react"
import { useApi } from "@/lib/use-api"

type AdmitCardDesign = {
  id: number
  templateName: string
  heading: string
  title: string
  examName: string
  schoolName: string
  examCentre: string
  footerText: string
  leftLogo: string
  rightLogo: string
  sign: string
  backgroundImage: string
  enabledFields: string[]
}

type AdmitCardForm = {
  templateName: string
  heading: string
  title: string
  examName: string
  schoolName: string
  examCentre: string
  footerText: string
  leftLogo: string
  rightLogo: string
  sign: string
  backgroundImage: string
  enabledFields: string[]
}

const availableFields = [
  "Student Name",
  "Father Name",
  "Date of Birth",
  "Class",
  "Section",
  "Roll No",
  "Photo",
  "Exam Name",
  "School Name",
  "Address",
]

const examNames = ["Periodic Test 1", "Periodic Test 2", "Half Yearly", "Annual Examination"]

const emptyForm: AdmitCardForm = {
  templateName: "",
  heading: "",
  title: "",
  examName: "",
  schoolName: "",
  examCentre: "",
  footerText: "",
  leftLogo: "",
  rightLogo: "",
  sign: "",
  backgroundImage: "",
  enabledFields: [],
}

export default function DesignAdmitCardPage() {
  const { data: designs, add, update, remove, loading } = useApi<AdmitCardDesign>("/api/examinations/exam")
  const [form, setForm] = useState<AdmitCardForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDesign, setPreviewDesign] = useState<AdmitCardDesign | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const handleFileChange = (name: string, _e: React.ChangeEvent<HTMLInputElement>) => {
    const file = _e.target.files?.[0]
    if (file) {
      setForm((prev) => ({ ...prev, [name]: file.name }))
    }
  }

  const toggleField = (field: string) => {
    setForm((prev) => ({
      ...prev,
      enabledFields: prev.enabledFields.includes(field)
        ? prev.enabledFields.filter((f) => f !== field)
        : [...prev.enabledFields, field],
    }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.templateName.trim()) errs.templateName = "Template name is required"
    if (!form.heading.trim()) errs.heading = "Heading is required"
    if (!form.title.trim()) errs.title = "Title is required"
    if (!form.examName) errs.examName = "Exam name is required"
    return errs
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setErrors({})
  }

  const handleSave = async () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    try {
      if (editingId !== null) {
        await update(editingId, { ...form })
      } else {
        await add({ ...form })
      }
      resetForm()
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const handleEdit = (design: AdmitCardDesign) => {
    setForm({
      templateName: design.templateName,
      heading: design.heading,
      title: design.title,
      examName: design.examName,
      schoolName: design.schoolName,
      examCentre: design.examCentre,
      footerText: design.footerText,
      leftLogo: design.leftLogo,
      rightLogo: design.rightLogo,
      sign: design.sign,
      backgroundImage: design.backgroundImage,
      enabledFields: [...design.enabledFields],
    })
    setEditingId(design.id)
    setErrors({})
  }

  const handleDeleteOpen = (id: number) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

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

  const openPreview = (design: AdmitCardDesign) => {
    setPreviewDesign(design)
    setShowPreviewModal(true)
  }

  const Modal = ({ title, show, onClose, children, wide }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative bg-white rounded-xl shadow-2xl z-10 w-full mx-4 ${wide ? "max-w-4xl" : "max-w-lg"}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
          </div>
          {children}
        </div>
      </div>
    )
  }

  const AdmitCardPreview = ({ design }: { design: AdmitCardDesign }) => (
    <div className="border-2 border-gray-300 rounded-xl overflow-hidden shadow-lg bg-white" style={design.backgroundImage ? { backgroundImage: `url(${design.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
      <div className="p-6 space-y-4" style={design.backgroundImage ? { backgroundColor: "rgba(255,255,255,0.92)" } : {}}>
        <div className="flex items-center justify-between">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 border">
            {design.leftLogo ? design.leftLogo : "Left Logo"}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">{design.heading}</h3>
            <p className="text-sm font-semibold text-indigo-700">{design.title}</p>
          </div>
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 border">
            {design.rightLogo ? design.rightLogo : "Right Logo"}
          </div>
        </div>

        <div className="border-t border-b border-gray-300 py-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {design.enabledFields.includes("Student Name") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-24">Student Name</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Father Name") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-24">Father Name</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Date of Birth") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-24">Date of Birth</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Class") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-24">Class</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Section") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-24">Section</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Roll No") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-24">Roll No</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Exam Name") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-24">Exam Name</span><span className="text-gray-800">: {design.examName}</span></div>
            )}
            {design.enabledFields.includes("School Name") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-24">School Name</span><span className="text-gray-800">: {design.schoolName}</span></div>
            )}
            {design.enabledFields.includes("Address") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-24">Address</span><span className="text-gray-800">: ________________</span></div>
            )}
            {design.enabledFields.includes("Photo") && (
              <div className="flex gap-2"><span className="font-medium text-gray-600 w-24">Photo</span><span className="text-gray-800">: [Photo]</span></div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            <p>Exam Centre: {design.examCentre}</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-10 bg-gray-100 rounded border mx-auto flex items-center justify-center text-xs text-gray-400">
              {design.sign ? design.sign : "Sign"}
            </div>
            <p className="mt-1 font-medium text-gray-600">Principal</p>
          </div>
        </div>

        {design.footerText && (
          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-3">
            {design.footerText}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Design Admit Card</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Examinations / Design Admit Card</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">{editingId !== null ? "Edit" : "Add"} Admit Card Design</h3>
          </div>
          <div className="p-5 space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Template Name <span className="text-red-500">*</span></label>
              <input type="text" name="templateName" value={form.templateName} onChange={handleChange} placeholder="Enter template name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.templateName && <p className="text-red-500 text-xs mt-1">{errors.templateName}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Heading <span className="text-red-500">*</span></label>
              <input type="text" name="heading" value={form.heading} onChange={handleChange} placeholder="e.g. SMART SCHOOL"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.heading && <p className="text-red-500 text-xs mt-1">{errors.heading}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Title <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="e.g. ADMIT CARD"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam Name <span className="text-red-500">*</span></label>
              <select name="examName" value={form.examName} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {examNames.map((en) => <option key={en} value={en}>{en}</option>)}
              </select>
              {errors.examName && <p className="text-red-500 text-xs mt-1">{errors.examName}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">School Name</label>
              <input type="text" name="schoolName" value={form.schoolName} onChange={handleChange} placeholder="Enter school name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam Centre</label>
              <input type="text" name="examCentre" value={form.examCentre} onChange={handleChange} placeholder="Enter exam centre"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Footer Text</label>
              <textarea name="footerText" value={form.footerText} onChange={handleChange} placeholder="Enter footer text" rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Left Logo</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange("leftLogo", e)}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {form.leftLogo && <p className="text-xs text-gray-400 mt-0.5">{form.leftLogo}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Right Logo</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange("rightLogo", e)}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {form.rightLogo && <p className="text-xs text-gray-400 mt-0.5">{form.rightLogo}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Sign</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange("sign", e)}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {form.sign && <p className="text-xs text-gray-400 mt-0.5">{form.sign}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Background Image</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange("backgroundImage", e)}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {form.backgroundImage && <p className="text-xs text-gray-400 mt-0.5">{form.backgroundImage}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-600">Enable / Disable Fields</label>
              <div className="grid grid-cols-2 gap-2">
                {availableFields.map((field) => (
                  <label key={field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form.enabledFields.includes(field)} onChange={() => toggleField(field)}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                    {field}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                <Save className="h-4 w-4" /> {editingId !== null ? "Update" : "Save"}
              </button>
              {editingId !== null && (
                <button onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-gray-700">Admit Card Designs</h3>
            <span className="text-xs text-gray-500">{designs.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["#", "Template", "Heading", "Exam Name", "School Name", "Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {designs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No admit card designs found</td></tr>
                ) : (
                  designs.map((design, idx) => (
                    <tr key={design.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{design.templateName}</td>
                      <td className="px-4 py-3 text-gray-600">{design.heading}</td>
                      <td className="px-4 py-3 text-gray-600">{design.examName}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{design.schoolName || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openPreview(design)} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleEdit(design)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteOpen(design.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
          <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
            <span>Showing {designs.length} of {designs.length} records</span>
          </div>
        </div>
      </div>

      <Modal title="Admit Card Preview" show={showPreviewModal} onClose={() => setShowPreviewModal(false)} wide>
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {previewDesign && <AdmitCardPreview design={previewDesign} />}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Close</button>
        </div>
      </Modal>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Are you sure you want to delete this admit card design?
                {deleteId !== null && <strong className="block mt-1 text-gray-800">{designs.find((d) => d.id === deleteId)?.templateName}</strong>}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
