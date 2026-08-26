"use client"

import { useState } from "react"
import { Save, Pencil, Trash2, X } from "lucide-react"
import { useApi } from "@/lib/use-api"

type ExamType = "general" | "school_grade" | "college_grade"

type Grade = {
  id: number
  examType: ExamType
  gradeName: string
  percentFrom: number
  percentUpto: number
  gradePoint: number
  description: string
}

const examTypes: { value: ExamType; label: string }[] = [
  { value: "general", label: "General Purpose (Pass/Fail)" },
  { value: "school_grade", label: "School Based Grading System" },
  { value: "college_grade", label: "College Based Grading System" },
]

const examTypeLabel = (type: ExamType) => examTypes.find((t) => t.value === type)?.label ?? type

export default function MarksGradePage() {
  const { data: grades, add, update, remove, loading } = useApi<Grade>("/api/examinations/marks-grade")
  const [examType, setExamType] = useState<ExamType | "">("")
  const [gradeName, setGradeName] = useState("")
  const [percentFrom, setPercentFrom] = useState("")
  const [percentUpto, setPercentUpto] = useState("")
  const [gradePoint, setGradePoint] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [showEditModal, setShowEditModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editExamType, setEditExamType] = useState<ExamType | "">("")
  const [editGradeName, setEditGradeName] = useState("")
  const [editPercentFrom, setEditPercentFrom] = useState("")
  const [editPercentUpto, setEditPercentUpto] = useState("")
  const [editGradePoint, setEditGradePoint] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [toast, setToast] = useState("")

  const validate = (data: { examType: string; gradeName: string; percentFrom: string; percentUpto: string; gradePoint: string }) => {
    const errs: Record<string, string> = {}
    if (!data.examType) errs.examType = "Exam type is required"
    if (!data.gradeName.trim()) errs.gradeName = "Grade name is required"
    if (!data.percentFrom.trim()) errs.percentFrom = "Percent from is required"
    if (!data.percentUpto.trim()) errs.percentUpto = "Percent upto is required"
    if (!data.gradePoint.trim()) errs.gradePoint = "Grade point is required"
    return errs
  }

  const handleAdd = async () => {
    const errs = validate({ examType, gradeName, percentFrom, percentUpto, gradePoint })
    setErrors(errs)
    if (Object.keys(errs).length) return

    try {
      await add({
        examType: examType as ExamType,
        gradeName: gradeName.trim(),
        percentFrom: Number(percentFrom),
        percentUpto: Number(percentUpto),
        gradePoint: Number(gradePoint),
        description: description.trim(),
      })
      setExamType(""); setGradeName(""); setPercentFrom(""); setPercentUpto(""); setGradePoint(""); setDescription("")
      setToast("Grade added successfully")
      setTimeout(() => setToast(""), 3000)
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const openEdit = (g: Grade) => {
    setEditId(g.id)
    setEditExamType(g.examType)
    setEditGradeName(g.gradeName)
    setEditPercentFrom(String(g.percentFrom))
    setEditPercentUpto(String(g.percentUpto))
    setEditGradePoint(String(g.gradePoint))
    setEditDescription(g.description)
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs = validate({ examType: editExamType, gradeName: editGradeName, percentFrom: editPercentFrom, percentUpto: editPercentUpto, gradePoint: editGradePoint })
    setEditErrors(errs)
    if (Object.keys(errs).length) return

    try {
      await update(editId!, {
        examType: editExamType as ExamType,
        gradeName: editGradeName.trim(),
        percentFrom: Number(editPercentFrom),
        percentUpto: Number(editPercentUpto),
        gradePoint: Number(editGradePoint),
        description: editDescription.trim(),
      })
      setShowEditModal(false)
      setEditId(null)
      setToast("Grade updated successfully")
      setTimeout(() => setToast(""), 3000)
    } catch (e: any) {
      setEditErrors({ name: e.message })
    }
  }

  const openDelete = (id: number) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    try {
      await remove(deleteId)
      setShowDeleteModal(false)
      setDeleteId(null)
      setToast("Grade deleted successfully")
      setTimeout(() => setToast(""), 3000)
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const ModalOverlay = () => <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white">Marks Grade</h2>
          <p className="text-xs text-[var(--primary)]/80 mt-0.5">Examinations / Marks Grade</p>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-5 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Add Grade</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Exam Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={examType}
                  onChange={(e) => { setExamType(e.target.value as ExamType); if (errors.examType) setErrors({}) }}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  <option value="">Select</option>
                  {examTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errors.examType && <p className="text-red-400 text-xs mt-0.5">{errors.examType}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Grade Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={gradeName}
                  onChange={(e) => { setGradeName(e.target.value); if (errors.gradeName) setErrors({}) }}
                  placeholder="e.g. A+"
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
                {errors.gradeName && <p className="text-red-400 text-xs mt-0.5">{errors.gradeName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Percent From <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={percentFrom}
                    onChange={(e) => { setPercentFrom(e.target.value); if (errors.percentFrom) setErrors({}) }}
                    placeholder="0"
                    min={0}
                    max={100}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {errors.percentFrom && <p className="text-red-400 text-xs mt-0.5">{errors.percentFrom}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Percent Upto <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={percentUpto}
                    onChange={(e) => { setPercentUpto(e.target.value); if (errors.percentUpto) setErrors({}) }}
                    placeholder="100"
                    min={0}
                    max={100}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {errors.percentUpto && <p className="text-red-400 text-xs mt-0.5">{errors.percentUpto}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Grade Point <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={gradePoint}
                  onChange={(e) => { setGradePoint(e.target.value); if (errors.gradePoint) setErrors({}) }}
                  placeholder="e.g. 9.0"
                  min={0}
                  step={0.1}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
                {errors.gradePoint && <p className="text-red-400 text-xs mt-0.5">{errors.gradePoint}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                />
              </div>
              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-4 py-2 rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Grade List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Exam Type</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Grade Name</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Percent From</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Percent Upto</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Grade Point</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Description</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No grades found</td>
                    </tr>
                  ) : (
                    grades.map((g, idx) => (
                      <tr
                        key={g.id}
                        className={`border-b border-gray-50 hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                      >
                        <td className="px-4 py-2.5 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{examTypeLabel(g.examType)}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{g.gradeName}</td>
                        <td className="px-4 py-2.5 text-gray-600">{g.percentFrom}%</td>
                        <td className="px-4 py-2.5 text-gray-600">{g.percentUpto}%</td>
                        <td className="px-4 py-2.5 text-gray-600">{g.gradePoint}</td>
                        <td className="px-4 py-2.5 text-gray-500 max-w-[160px] truncate">{g.description || "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              onClick={() => openEdit(g)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openDelete(g.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
              <span>Showing {grades.length} records</span>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowEditModal(false)}><ModalOverlay /></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Edit Grade</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Exam Type <span className="text-red-400">*</span></label>
                <select
                  value={editExamType}
                  onChange={(e) => { setEditExamType(e.target.value as ExamType); if (editErrors.examType) setEditErrors({}) }}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  <option value="">Select</option>
                  {examTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {editErrors.examType && <p className="text-red-400 text-xs mt-0.5">{editErrors.examType}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Grade Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={editGradeName}
                  onChange={(e) => { setEditGradeName(e.target.value); if (editErrors.gradeName) setEditErrors({}) }}
                  placeholder="e.g. A+"
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
                {editErrors.gradeName && <p className="text-red-400 text-xs mt-0.5">{editErrors.gradeName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Percent From <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    value={editPercentFrom}
                    onChange={(e) => { setEditPercentFrom(e.target.value); if (editErrors.percentFrom) setEditErrors({}) }}
                    min={0}
                    max={100}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {editErrors.percentFrom && <p className="text-red-400 text-xs mt-0.5">{editErrors.percentFrom}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Percent Upto <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    value={editPercentUpto}
                    onChange={(e) => { setEditPercentUpto(e.target.value); if (editErrors.percentUpto) setEditErrors({}) }}
                    min={0}
                    max={100}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {editErrors.percentUpto && <p className="text-red-400 text-xs mt-0.5">{editErrors.percentUpto}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Grade Point <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  value={editGradePoint}
                  onChange={(e) => { setEditGradePoint(e.target.value); if (editErrors.gradePoint) setEditErrors({}) }}
                  min={0}
                  step={0.1}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
                {editErrors.gradePoint && <p className="text-red-400 text-xs mt-0.5">{editErrors.gradePoint}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleEditSave} className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowDeleteModal(false)}><ModalOverlay /></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm text-gray-600">Are you sure you want to delete this grade?</p>
              {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{grades.find((g) => g.id === deleteId)?.gradeName}</p>}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
