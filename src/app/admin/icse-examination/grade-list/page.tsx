"use client"

import { useState } from "react"
import { Save, Pencil, Trash2, X, Plus } from "lucide-react"
import { useApi } from "@/lib/use-api"

type GradeRow = { id: number; grade: string; minPercent: number; maxPercent: number; remarks: string }
type ExamGrade = { id: number; title: string; description: string; rows: GradeRow[] }

export default function IcseGradeListPage() {
  const { data: examGrades, add, update, remove, loading } = useApi<ExamGrade>("/api/icse/exam-grades")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [rows, setRows] = useState<{ grade: string; minPercent: string; maxPercent: string; remarks: string }[]>([
    { grade: "", minPercent: "", maxPercent: "", remarks: "" },
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [showEditModal, setShowEditModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editRows, setEditRows] = useState<{ grade: string; minPercent: string; maxPercent: string; remarks: string }[]>([])
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [toast, setToast] = useState("")

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  const validate = (data: { title: string; rows: any[] }) => {
    const errs: Record<string, string> = {}
    if (!data.title.trim()) errs.title = "Title is required"
    if (data.rows.length === 0 || !data.rows.some((r) => r.grade.trim())) errs.rows = "At least one grade row is required"
    return errs
  }

  const handleAdd = async () => {
    const errs = validate({ title, rows })
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      await add({
        title: title.trim(),
        description: description.trim(),
        rows: rows.filter((r) => r.grade.trim()).map((r, i) => ({
          id: i + 1,
          grade: r.grade.trim(),
          minPercent: parseInt(r.minPercent) || 0,
          maxPercent: parseInt(r.maxPercent) || 0,
          remarks: r.remarks.trim(),
        })),
      })
      setTitle(""); setDescription(""); setRows([{ grade: "", minPercent: "", maxPercent: "", remarks: "" }])
      showToast("Grade added successfully")
    } catch (e: any) {
      setErrors({ title: e.message })
    }
  }

  const openEdit = (g: ExamGrade) => {
    setEditId(g.id)
    setEditTitle(g.title)
    setEditDescription(g.description)
    setEditRows(g.rows.map((r) => ({ grade: r.grade, minPercent: String(r.minPercent), maxPercent: String(r.maxPercent), remarks: r.remarks })))
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs = validate({ title: editTitle, rows: editRows })
    setEditErrors(errs)
    if (Object.keys(errs).length) return
    try {
      await update(editId!, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        rows: editRows.filter((r) => r.grade.trim()).map((r, i) => ({
          id: i + 1,
          grade: r.grade.trim(),
          minPercent: parseInt(r.minPercent) || 0,
          maxPercent: parseInt(r.maxPercent) || 0,
          remarks: r.remarks.trim(),
        })),
      })
      setShowEditModal(false)
      setEditId(null)
      showToast("Grade updated successfully")
    } catch (e: any) {
      setEditErrors({ title: e.message })
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
      showToast("Grade deleted successfully")
    } catch (e: any) {
      setErrors({ title: e.message })
    }
  }

  const ModalOverlay = () => <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white">Grade List</h2>
          <p className="text-xs text-[var(--primary)]/80 mt-0.5">ICSE Examination / Grade List</p>
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Grade Title <span className="text-red-400">*</span></label>
                <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors({}) }}
                  placeholder="e.g. Primary Grades" className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                {errors.title && <p className="text-red-400 text-xs mt-0.5">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description" className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Grade Rows <span className="text-red-400">*</span></label>
                  <button onClick={() => setRows((p) => [...p, { grade: "", minPercent: "", maxPercent: "", remarks: "" }])}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"><Plus className="h-3 w-3" /> Add</button>
                </div>
                {errors.rows && <p className="text-red-400 text-xs mb-1">{errors.rows}</p>}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {rows.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex-1 grid grid-cols-2 gap-1">
                        <input type="text" value={r.grade} onChange={(e) => { const n = [...rows]; n[idx] = { ...n[idx], grade: e.target.value }; setRows(n) }} placeholder="A+" className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                        <input type="number" value={r.minPercent} onChange={(e) => { const n = [...rows]; n[idx] = { ...n[idx], minPercent: e.target.value }; setRows(n) }} placeholder="Min%" className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                        <input type="number" value={r.maxPercent} onChange={(e) => { const n = [...rows]; n[idx] = { ...n[idx], maxPercent: e.target.value }; setRows(n) }} placeholder="Max%" className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                        <input type="text" value={r.remarks} onChange={(e) => { const n = [...rows]; n[idx] = { ...n[idx], remarks: e.target.value }; setRows(n) }} placeholder="Remarks" className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                      </div>
                      {rows.length > 1 && <button onClick={() => setRows(rows.filter((_, i) => i !== idx))} className="p-1 text-red-500 hover:bg-red-50 rounded mt-2"><X className="h-3 w-3" /></button>}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleAdd}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-4 py-2 rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">
                <Save className="h-3.5 w-3.5" /> Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Grade Definitions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Title</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Description</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Grade Rows</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Loading...</td></tr>
                  ) : examGrades.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No grades defined</td></tr>
                  ) : (
                    examGrades.map((g, idx) => (
                      <tr key={g.id} className={`border-b border-gray-50 hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                        <td className="px-4 py-2.5 text-gray-600 align-top pt-3">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800 align-top pt-3">{g.title}</td>
                        <td className="px-4 py-2.5 text-gray-500 align-top pt-3 max-w-[160px] truncate">{g.description || "—"}</td>
                        <td className="px-4 py-2.5 align-top">
                          <div className="space-y-1">
                            {(!g.rows || g.rows.length === 0) ? (
                              <span className="text-xs text-gray-400">No rows</span>
                            ) : (
                              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="px-2 py-1 text-left font-semibold text-gray-600">Grade</th>
                                    <th className="px-2 py-1 text-left font-semibold text-gray-600">Min%</th>
                                    <th className="px-2 py-1 text-left font-semibold text-gray-600">Max%</th>
                                    <th className="px-2 py-1 text-left font-semibold text-gray-600">Remarks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(g.rows || []).map((r, ri) => (
                                    <tr key={ri} className="border-t border-gray-100">
                                      <td className="px-2 py-1 font-medium text-gray-700">{r.grade}</td>
                                      <td className="px-2 py-1 text-gray-600">{r.minPercent}%</td>
                                      <td className="px-2 py-1 text-gray-600">{r.maxPercent}%</td>
                                      <td className="px-2 py-1 text-gray-500">{r.remarks || "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right align-top pt-3">
                          <div className="flex items-center justify-end gap-0.5">
                            <button onClick={() => openEdit(g)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => openDelete(g.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
              <span>Showing {examGrades.length} records</span>
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
              <button onClick={() => setShowEditModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Grade Title <span className="text-red-400">*</span></label>
                <input type="text" value={editTitle} onChange={(e) => { setEditTitle(e.target.value); if (editErrors.title) setEditErrors({}) }}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                {editErrors.title && <p className="text-red-400 text-xs mt-0.5">{editErrors.title}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Grade Rows <span className="text-red-400">*</span></label>
                  <button onClick={() => setEditRows((p) => [...p, { grade: "", minPercent: "", maxPercent: "", remarks: "" }])}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"><Plus className="h-3 w-3" /> Add</button>
                </div>
                {editErrors.rows && <p className="text-red-400 text-xs mb-1">{editErrors.rows}</p>}
                <div className="space-y-2">
                  {editRows.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex-1 grid grid-cols-2 gap-1">
                        <input type="text" value={r.grade} onChange={(e) => { const n = [...editRows]; n[idx] = { ...n[idx], grade: e.target.value }; setEditRows(n) }} placeholder="A+" className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                        <input type="number" value={r.minPercent} onChange={(e) => { const n = [...editRows]; n[idx] = { ...n[idx], minPercent: e.target.value }; setEditRows(n) }} placeholder="Min%" className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                        <input type="number" value={r.maxPercent} onChange={(e) => { const n = [...editRows]; n[idx] = { ...n[idx], maxPercent: e.target.value }; setEditRows(n) }} placeholder="Max%" className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                        <input type="text" value={r.remarks} onChange={(e) => { const n = [...editRows]; n[idx] = { ...n[idx], remarks: e.target.value }; setEditRows(n) }} placeholder="Remarks" className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                      </div>
                      {editRows.length > 1 && <button onClick={() => setEditRows(editRows.filter((_, i) => i !== idx))} className="p-1 text-red-500 hover:bg-red-50 rounded mt-2"><X className="h-3 w-3" /></button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleEditSave} className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200"><Save className="h-3.5 w-3.5" /> Save</button>
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
              <button onClick={() => setShowDeleteModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3"><Trash2 className="h-6 w-6 text-red-500" /></div>
              <p className="text-sm text-gray-600">Are you sure you want to delete this grade?</p>
              {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{examGrades.find((g) => g.id === deleteId)?.title}</p>}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
