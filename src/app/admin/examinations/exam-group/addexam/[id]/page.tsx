"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, X, Save, ArrowLeft, Search } from "lucide-react"

type ExamGroup = { id: number; name: string; examType: string; description: string }
type Exam = { id: number; groupId: number; name: string; session: string; publishExam: boolean; publishResult: boolean; admitCardRollNo: boolean; passingPercentage: number; description: string }

const sessions = ["2024-25", "2025-26", "2026-27"]

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  return res.json()
}

async function postJson(url: string, body: any) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Request failed") }
  return res.json()
}

async function putJson(url: string, body: any) {
  const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Request failed") }
  return res.json()
}

async function deleteReq(url: string) {
  const res = await fetch(url, { method: "DELETE" })
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Request failed") }
}

export default function AddExamPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = parseInt(params.id as string)

  const [group, setGroup] = useState<ExamGroup | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [showModal, setShowModal] = useState(false)
  const [editExamId, setEditExamId] = useState<number | null>(null)
  const [examForm, setExamForm] = useState({ name: "", session: "", publishExam: false, publishResult: false, admitCardRollNo: false, passingPercentage: "33", description: "" })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [deleteExamId, setDeleteExamId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [groupData, examsData] = await Promise.all([
          fetchJson(`/api/examinations/group?id=${groupId}`),
          fetchJson(`/api/examinations/exam?group_id=${groupId}`),
        ])
        setGroup(groupData)
        setExams(examsData)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [groupId])

  const loadExams = async () => {
    const examsData = await fetchJson(`/api/examinations/exam?group_id=${groupId}`)
    setExams(examsData)
  }

  const validateExamForm = (data: typeof examForm) => {
    const errs: Record<string, string> = {}
    if (!data.name.trim()) errs.name = "Exam name is required"
    if (!data.session) errs.session = "Session is required"
    return errs
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target
    const name = target.name
    const value = target.value
    const checked = target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : undefined
    setExamForm((prev) => ({ ...prev, [name]: target instanceof HTMLInputElement && target.type === "checkbox" ? checked : value }))
    if (formErrors[name]) setFormErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const resetForm = () => {
    setExamForm({ name: "", session: "", publishExam: false, publishResult: false, admitCardRollNo: false, passingPercentage: "33", description: "" })
    setEditExamId(null)
    setFormErrors({})
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (exam: Exam) => {
    setExamForm({
      name: exam.name,
      session: exam.session,
      publishExam: exam.publishExam,
      publishResult: exam.publishResult,
      admitCardRollNo: exam.admitCardRollNo,
      passingPercentage: exam.passingPercentage.toString(),
      description: exam.description,
    })
    setEditExamId(exam.id)
    setFormErrors({})
    setShowModal(true)
  }

  const handleSave = async () => {
    const errs = validateExamForm(examForm)
    setFormErrors(errs)
    if (Object.keys(errs).length) return
    try {
      const body = { groupId, ...examForm, passingPercentage: parseInt(examForm.passingPercentage) || 33 }
      if (editExamId !== null) {
        await putJson("/api/examinations/exam", { id: editExamId, ...body })
      } else {
        await postJson("/api/examinations/exam", body)
      }
      await loadExams()
      setShowModal(false)
      resetForm()
    } catch (e: any) {
      setFormErrors({ name: e.message })
    }
  }

  const handleDeleteOpen = (id: number) => { setDeleteExamId(id); setShowDeleteModal(true) }
  const confirmDelete = async () => {
    if (deleteExamId === null) return
    try {
      await deleteReq(`/api/examinations/exam?id=${deleteExamId}`)
      await loadExams()
      setShowDeleteModal(false)
      setDeleteExamId(null)
    } catch (e: any) {
      console.error(e)
    }
  }

  const filteredExams = exams.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))

  const Modal = ({ title, show, onClose, children }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
          </div>
          {children}
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" /></div>
  }

  if (!group) {
    return <div className="text-center py-12 text-gray-500">Exam group not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sm text-white/80 mb-1">
            <button onClick={() => router.push("/admin/examinations/exam-group")} className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Exam Groups
            </button>
            <span>/</span>
            <span className="text-white font-medium">{group.name}</span>
          </div>
          <h2 className="text-xl font-bold text-white">Manage Exams</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-700">Exam List</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exams..."
                className="w-56 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <button onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors whitespace-nowrap">
              <Plus className="h-4 w-4" /> New Exam
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Exam Name", "Session", "Publish", "Publish Result", "Passing %", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredExams.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No exams added yet</td></tr>
              ) : (
                filteredExams.map((exam, idx) => (
                  <tr key={exam.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{exam.name}</td>
                    <td className="px-4 py-3 text-gray-600">{exam.session}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${exam.publishExam ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {exam.publishExam ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${exam.publishResult ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                        {exam.publishResult ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{exam.passingPercentage}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(exam)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteOpen(exam.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
          <span>Showing {filteredExams.length} of {exams.length} records</span>
        </div>
      </div>

      <Modal title={editExamId ? "Edit Exam" : "Add Exam"} show={showModal} onClose={() => { setShowModal(false); resetForm() }}>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Exam Name <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={examForm.name} onChange={handleFormChange} placeholder="Enter exam name"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Session <span className="text-red-500">*</span></label>
            <select name="session" value={examForm.session} onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
              <option value="">Select</option>
              {sessions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {formErrors.session && <p className="text-red-500 text-xs mt-1">{formErrors.session}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Passing Percentage</label>
            <input type="number" name="passingPercentage" value={examForm.passingPercentage} onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" min="0" max="100" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Description</label>
            <textarea name="description" value={examForm.description} onChange={handleFormChange} placeholder="Enter description" rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="publishExam" checked={examForm.publishExam} onChange={handleFormChange} className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Publish Exam
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="publishResult" checked={examForm.publishResult} onChange={handleFormChange} className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Publish Result
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="admitCardRollNo" checked={examForm.admitCardRollNo} onChange={handleFormChange} className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Show Roll No
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => { setShowModal(false); resetForm() }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
            <Save className="h-4 w-4" /> {editExamId ? "Update" : "Save"}
          </button>
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
              <p className="text-sm text-gray-600">Are you sure you want to delete this exam?
                {deleteExamId && <strong className="block mt-1 text-gray-800">{exams.find((e) => e.id === deleteExamId)?.name}</strong>}
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
