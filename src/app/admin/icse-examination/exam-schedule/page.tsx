"use client"

import { useState, useCallback, useEffect } from "react"
import { Plus, Pencil, Trash2, X, Save, Search, Loader2 } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Exam = {
  id: number
  name: string
  term: string
  class: string
  section: string
}

type ScheduleItem = {
  id: number
  examId: number
  subjectId: number
  date: string
  startTime: string
  endTime: string
  room: string
  examName: string
  subjectName: string
}

type Subject = {
  id: number
  name: string
  code: string
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function ICSEExamSchedulePage() {
  const { data: exams } = useApi<Exam>("/api/icse/exam")
  const { data: subjects } = useApi<Subject>("/api/academics/subject")
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState("")
  const [search, setSearch] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ examId: 0, subjectId: 0, date: "", startTime: "", endTime: "", room: "" })
  const [editForm, setEditForm] = useState({ id: 0, examId: 0, subjectId: 0, date: "", startTime: "", endTime: "", room: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchSchedules = useCallback(async (examId: string) => {
    setLoading(true)
    try {
      const url = examId ? `/api/icse/schedule?exam_id=${examId}` : "/api/icse/schedule"
      const res = await fetch(url)
      if (res.ok) setSchedules(await res.json())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSchedules(selectedExamId) }, [selectedExamId, fetchSchedules])

  const filtered = schedules.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.subjectName?.toLowerCase().includes(q) || s.room?.toLowerCase().includes(q) || s.examName?.toLowerCase().includes(q)
  })

  const groupedByExam: Record<string, ScheduleItem[]> = {}
  filtered.forEach((s) => {
    const key = s.examName || "Unknown"
    if (!groupedByExam[key]) groupedByExam[key] = []
    groupedByExam[key].push(s)
  })
  const examGroupKeys = Object.keys(groupedByExam).sort()

  const getDayName = (dateStr: string) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    return daysOfWeek[d.getDay()]
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, isEdit: boolean) => {
    const { name, value } = e.target
    const val = name === "examId" || name === "subjectId" ? parseInt(value) || 0 : value
    if (isEdit) {
      setEditForm((prev: typeof editForm) => ({ ...prev, [name]: val }))
    } else {
      setForm((prev: typeof form) => ({ ...prev, [name]: val }))
    }
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const defaultForm = { examId: 0, subjectId: 0, date: "", startTime: "", endTime: "", room: "" }

  const openAddModal = (examId?: string) => {
    setForm({ ...defaultForm, examId: examId ? parseInt(examId) || 0 : 0 })
    setErrors({})
    setShowAddModal(true)
  }

  const openEditModal = (item: ScheduleItem) => {
    setEditForm({ id: item.id, examId: item.examId, subjectId: item.subjectId, date: item.date || "", startTime: item.startTime || "", endTime: item.endTime || "", room: item.room || "" })
    setErrors({})
    setShowEditModal(true)
  }

  const openDeleteModal = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }

  const validate = (data: typeof form) => {
    const errs: Record<string, string> = {}
    if (!data.examId) errs.examId = "Exam is required"
    if (!data.subjectId) errs.subjectId = "Subject is required"
    if (!data.date) errs.date = "Date is required"
    return errs
  }

  const handleAdd = async () => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      const res = await fetch("/api/icse/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); setErrors({ date: d.error || "Failed to add" }); return }
      setShowAddModal(false)
      await fetchSchedules(selectedExamId)
    } catch (e: any) { setErrors({ date: e.message }) }
  }

  const handleEditSave = async () => {
    const errs = validate(editForm)
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      const res = await fetch("/api/icse/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) { const d = await res.json(); setErrors({ date: d.error || "Failed to update" }); return }
      setShowEditModal(false)
      await fetchSchedules(selectedExamId)
    } catch (e: any) { setErrors({ date: e.message }) }
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    try {
      await fetch(`/api/icse/schedule?id=${deleteId}`, { method: "DELETE" })
      setShowDeleteModal(false)
      setDeleteId(null)
      await fetchSchedules(selectedExamId)
    } catch (e: any) { setErrors({ name: e.message }) }
  }

  const Modal = useCallback(({ title, show, onClose, children, wide }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) => {
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
  }, [])

  const renderFormFields = (data: typeof form, isEdit: boolean) => (
    <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Exam <span className="text-red-500">*</span></label>
        <select name="examId" value={data.examId} onChange={(e) => handleFormChange(e, isEdit)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
          <option value={0}>Select exam</option>
          {exams.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.term}) - {e.class} {e.section}</option>)}
        </select>
        {errors.examId && <p className="text-xs text-red-500 mt-1">{errors.examId}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
        <select name="subjectId" value={data.subjectId} onChange={(e) => handleFormChange(e, isEdit)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
          <option value={0}>Select subject</option>
          {(subjects || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {errors.subjectId && <p className="text-xs text-red-500 mt-1">{errors.subjectId}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
        <input type="date" name="date" value={data.date} onChange={(e) => handleFormChange(e, isEdit)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
        {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input type="time" name="startTime" value={data.startTime} onChange={(e) => handleFormChange(e, isEdit)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input type="time" name="endTime" value={data.endTime} onChange={(e) => handleFormChange(e, isEdit)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
        <input type="text" name="room" value={data.room} placeholder="e.g. Room 101" onChange={(e) => handleFormChange(e, isEdit)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Exam Timetable</h2>
          <p className="text-sm text-white/80 mt-0.5">ICSE Examination / Exam Timetable</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-700">Schedule List</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject or room..."
                className="w-56 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none bg-white min-w-[200px]">
              <option value="">All Exams</option>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.term}) - {e.class} {e.section}</option>)}
            </select>
            <button onClick={() => openAddModal(selectedExamId)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
              <Plus className="h-4 w-4" /> Add Schedule
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading schedules...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No schedules found</div>
          ) : selectedExamId ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["#", "Subject", "Date", "Day", "Start Time", "End Time", "Room", "Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{s.subjectName || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.date || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{getDayName(s.date)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.startTime || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.endTime || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.room || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => openDeleteModal(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="divide-y divide-gray-200">
              {examGroupKeys.map((examName) => {
                const items = groupedByExam[examName]
                return (
                  <div key={examName}>
                    <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700">{examName}</h4>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          {["#", "Subject", "Date", "Day", "Start Time", "End Time", "Room", "Action"].map((h) => (
                            <th key={h} className="text-left px-4 py-2 font-semibold text-gray-500 text-xs uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((s, idx) => (
                          <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                            <td className="px-4 py-2.5 text-gray-600">{idx + 1}</td>
                            <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{s.subjectName || "—"}</td>
                            <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{s.date || "—"}</td>
                            <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{getDayName(s.date)}</td>
                            <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{s.startTime || "—"}</td>
                            <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{s.endTime || "—"}</td>
                            <td className="px-4 py-2.5 text-gray-600">{s.room || "—"}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1">
                                <button onClick={() => openEditModal(s)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                                <button onClick={() => openDeleteModal(s.id)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>Showing {filtered.length} of {schedules.length} records</span>
        </div>
      </div>

      <Modal title="Add Schedule" show={showAddModal} onClose={() => setShowAddModal(false)}>
        {renderFormFields(form, false)}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <Modal title="Edit Schedule" show={showEditModal} onClose={() => setShowEditModal(false)}>
        {renderFormFields(editForm, true)}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleEditSave} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Update</button>
        </div>
      </Modal>

      <Modal title="Confirm Delete" show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="px-6 py-6 text-center text-gray-600">Are you sure you want to delete this schedule entry?</div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={confirmDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      </Modal>
    </div>
  )
}
