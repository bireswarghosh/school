"use client"

import { useState } from "react"
import { Save, Pencil, Trash2, X, Eye, Plus } from "lucide-react"
import { useApi } from "@/lib/use-api"

type MarksheetDesign = {
  id: number
  templateName: string
  heading: string
  title: string
  examName: string
  schoolName: string
  examCentre: string
  bodyText: string
  footerText: string
  printingDate: string
  leftLogo: string | null
  rightLogo: string | null
  leftSign: string | null
  middleSign: string | null
  rightSign: string | null
  backgroundImage: string | null
  enabledFields: string[]
}

type MarksheetForm = {
  templateName: string
  heading: string
  title: string
  examName: string
  schoolName: string
  examCentre: string
  bodyText: string
  footerText: string
  printingDate: string
  leftLogo: string | null
  rightLogo: string | null
  leftSign: string | null
  middleSign: string | null
  rightSign: string | null
  backgroundImage: string | null
  enabledFields: string[]
}

const fieldOptions = [
  "Student Name",
  "Father Name",
  "Date of Birth",
  "Subject",
  "Theory Marks",
  "Practical Marks",
  "Total",
  "Grade",
  "Percentage",
  "Attendance",
  "Rank",
]

const examNames = [
  "Periodic Test 1",
  "Periodic Test 2",
  "Half Yearly Examination",
  "Annual Examination",
  "Pre Board Examination",
]

const initialForm: MarksheetForm = {
  templateName: "",
  heading: "",
  title: "",
  examName: "",
  schoolName: "",
  examCentre: "",
  bodyText: "",
  footerText: "",
  printingDate: "",
  leftLogo: null,
  rightLogo: null,
  leftSign: null,
  middleSign: null,
  rightSign: null,
  backgroundImage: null,
  enabledFields: fieldOptions.slice(0, 5),
}

export default function DesignMarksheetPage() {
  const { data: designs, add, update, remove, loading } = useApi<MarksheetDesign>("/api/examinations/exam")
  const [form, setForm] = useState<MarksheetForm>({ ...initialForm })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [showViewModal, setShowViewModal] = useState(false)
  const [viewDesign, setViewDesign] = useState<MarksheetDesign | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const handleFileChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm((prev) => ({ ...prev, [name]: URL.createObjectURL(file) }))
    }
  }

  const handleCheckboxChange = (field: string) => {
    setForm((prev) => ({
      ...prev,
      enabledFields: prev.enabledFields.includes(field)
        ? prev.enabledFields.filter((f) => f !== field)
        : [...prev.enabledFields, field],
    }))
  }

  const validate = (data: MarksheetForm) => {
    const errs: Record<string, string> = {}
    if (!data.templateName.trim()) errs.templateName = "Template name is required"
    if (!data.heading.trim()) errs.heading = "Heading is required"
    if (!data.title.trim()) errs.title = "Title is required"
    if (!data.examName) errs.examName = "Exam name is required"
    return errs
  }

  const resetForm = () => {
    setForm({ ...initialForm })
    setEditingId(null)
    setErrors({})
  }

  const handleSave = async () => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return

    try {
      if (editingId !== null) {
        await update(editingId, {
          templateName: form.templateName.trim(),
          heading: form.heading.trim(),
          title: form.title.trim(),
          examName: form.examName,
          schoolName: form.schoolName.trim(),
          examCentre: form.examCentre.trim(),
          bodyText: form.bodyText.trim(),
          footerText: form.footerText.trim(),
          printingDate: form.printingDate,
          leftLogo: form.leftLogo,
          rightLogo: form.rightLogo,
          leftSign: form.leftSign,
          middleSign: form.middleSign,
          rightSign: form.rightSign,
          backgroundImage: form.backgroundImage,
          enabledFields: form.enabledFields,
        })
      } else {
        await add({
          templateName: form.templateName.trim(),
          heading: form.heading.trim(),
          title: form.title.trim(),
          examName: form.examName,
          schoolName: form.schoolName.trim(),
          examCentre: form.examCentre.trim(),
          bodyText: form.bodyText.trim(),
          footerText: form.footerText.trim(),
          printingDate: form.printingDate,
          leftLogo: form.leftLogo,
          rightLogo: form.rightLogo,
          leftSign: form.leftSign,
          middleSign: form.middleSign,
          rightSign: form.rightSign,
          backgroundImage: form.backgroundImage,
          enabledFields: form.enabledFields,
        })
      }
      resetForm()
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const handleEdit = (design: MarksheetDesign) => {
    setForm({
      templateName: design.templateName,
      heading: design.heading,
      title: design.title,
      examName: design.examName,
      schoolName: design.schoolName,
      examCentre: design.examCentre,
      bodyText: design.bodyText,
      footerText: design.footerText,
      printingDate: design.printingDate,
      leftLogo: design.leftLogo,
      rightLogo: design.rightLogo,
      leftSign: design.leftSign,
      middleSign: design.middleSign,
      rightSign: design.rightSign,
      backgroundImage: design.backgroundImage,
      enabledFields: design.enabledFields,
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
      if (editingId === deleteId) resetForm()
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const handleView = (design: MarksheetDesign) => {
    setViewDesign(design)
    setShowViewModal(true)
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

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Design Marksheet</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Examinations / Design Marksheet</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">{editingId ? "Edit" : "Add"} Design</h3>
          </div>
          <div className="p-5 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Template Name <span className="text-red-500">*</span></label>
              <input type="text" name="templateName" value={form.templateName} onChange={handleChange} placeholder="Enter template name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.templateName && <p className="text-red-500 text-xs mt-1">{errors.templateName}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Heading <span className="text-red-500">*</span></label>
              <input type="text" name="heading" value={form.heading} onChange={handleChange} placeholder="e.g. REPORT CARD"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.heading && <p className="text-red-500 text-xs mt-1">{errors.heading}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Title <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Academic Year 2025-26"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam Name <span className="text-red-500">*</span></label>
              <select name="examName" value={form.examName} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {examNames.map((n) => <option key={n} value={n}>{n}</option>)}
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
              <label className="block text-xs font-medium text-gray-600">Body Text</label>
              <textarea name="bodyText" value={form.bodyText} onChange={handleChange} placeholder="Enter body text" rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Footer Text</label>
              <textarea name="footerText" value={form.footerText} onChange={handleChange} placeholder="Enter footer text" rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Printing Date</label>
              <input type="date" name="printingDate" value={form.printingDate} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Left Logo</label>
              <input type="file" accept="image/*" onChange={handleFileChange("leftLogo")}
                className="w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Right Logo</label>
              <input type="file" accept="image/*" onChange={handleFileChange("rightLogo")}
                className="w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Left Sign</label>
              <input type="file" accept="image/*" onChange={handleFileChange("leftSign")}
                className="w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Middle Sign</label>
              <input type="file" accept="image/*" onChange={handleFileChange("middleSign")}
                className="w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Right Sign</label>
              <input type="file" accept="image/*" onChange={handleFileChange("rightSign")}
                className="w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Background Image</label>
              <input type="file" accept="image/*" onChange={handleFileChange("backgroundImage")}
                className="w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-600">Enable/Disable Fields</label>
              <div className="grid grid-cols-1 gap-1.5">
                {fieldOptions.map((field) => (
                  <label key={field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enabledFields.includes(field)}
                      onChange={() => handleCheckboxChange(field)}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    {field}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                <Save className="h-4 w-4" /> {editingId ? "Update" : "Save"}
              </button>
              {editingId && (
                <button onClick={resetForm}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  <X className="h-4 w-4" /> Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Design List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["#", "Template", "Heading", "Title", "Exam Name", "School Name", "Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {designs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No designs added yet</td></tr>
                ) : (
                  designs.map((design, idx) => (
                    <tr key={design.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{design.templateName}</td>
                      <td className="px-4 py-3 text-gray-600">{design.heading}</td>
                      <td className="px-4 py-3 text-gray-600">{design.title}</td>
                      <td className="px-4 py-3 text-gray-600">{design.examName}</td>
                      <td className="px-4 py-3 text-gray-600">{design.schoolName || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleView(design)} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="View">
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
            <span>Showing {designs.length} records</span>
          </div>
        </div>
      </div>

      <Modal title="Marksheet Preview" show={showViewModal} onClose={() => setShowViewModal(false)} wide>
        {viewDesign && (
          <div className="p-6">
            <div className="border-2 border-gray-300 rounded-lg p-8 bg-white relative overflow-hidden" style={viewDesign.backgroundImage ? { backgroundImage: `url(${viewDesign.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-20 h-20 border border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400 bg-white/90">
                    {viewDesign.leftLogo ? <img src={viewDesign.leftLogo} alt="Left Logo" className="max-w-full max-h-full" /> : "Left Logo"}
                  </div>
                  <div className="w-20 h-20 border border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400 bg-white/90">
                    {viewDesign.rightLogo ? <img src={viewDesign.rightLogo} alt="Right Logo" className="max-w-full max-h-full" /> : "Right Logo"}
                  </div>
                </div>

                <h2 className="text-center text-xl font-bold text-gray-800 mb-1">{viewDesign.heading}</h2>
                <p className="text-center text-sm text-gray-600 mb-6">{viewDesign.title}</p>

                {viewDesign.schoolName && (
                  <p className="text-center text-sm font-medium text-gray-700 mb-1">School: {viewDesign.schoolName}</p>
                )}
                {viewDesign.examCentre && (
                  <p className="text-center text-sm text-gray-600 mb-1">Centre: {viewDesign.examCentre}</p>
                )}
                <p className="text-center text-sm text-gray-600 mb-6">Exam: {viewDesign.examName}</p>

                {viewDesign.enabledFields.length > 0 && (
                  <table className="w-full text-sm mb-6 border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        {viewDesign.enabledFields.map((f) => (
                          <th key={f} className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase border border-gray-200">{f}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {viewDesign.enabledFields.map((f) => (
                          <td key={f} className="px-3 py-2 text-gray-500 border border-gray-200">—</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                )}

                {viewDesign.bodyText && (
                  <p className="text-sm text-gray-700 mb-4 italic">{viewDesign.bodyText}</p>
                )}

                <div className="flex items-center justify-around mt-8 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="w-16 h-10 border-b border-gray-400 mb-1 mx-auto">
                      {viewDesign.leftSign && <img src={viewDesign.leftSign} alt="Left Sign" className="max-w-full max-h-full mx-auto" />}
                    </div>
                    <p className="text-xs text-gray-500">{viewDesign.footerText || "Left Sign"}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-10 border-b border-gray-400 mb-1 mx-auto">
                      {viewDesign.middleSign && <img src={viewDesign.middleSign} alt="Middle Sign" className="max-w-full max-h-full mx-auto" />}
                    </div>
                    <p className="text-xs text-gray-500">Middle Sign</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-10 border-b border-gray-400 mb-1 mx-auto">
                      {viewDesign.rightSign && <img src={viewDesign.rightSign} alt="Right Sign" className="max-w-full max-h-full mx-auto" />}
                    </div>
                    <p className="text-xs text-gray-500">Right Sign</p>
                  </div>
                </div>

                {viewDesign.printingDate && (
                  <p className="text-right text-xs text-gray-400 mt-4">Printing Date: {viewDesign.printingDate}</p>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Close</button>
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
              <p className="text-sm text-gray-600">Are you sure you want to delete this design?
                {deleteId && <strong className="block mt-1 text-gray-800">{designs.find((d) => d.id === deleteId)?.templateName}</strong>}
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
