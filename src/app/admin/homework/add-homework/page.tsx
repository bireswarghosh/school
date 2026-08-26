"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Pencil, Trash2, X, BookOpen } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type HomeworkRecord = {
  id: number
  class: string
  section: string
  subject: string
  homeworkDate: string
  submissionDate: string
  homework: string
  document: string
}

const subjectOptions = ["", "Math", "Science", "English", "Hindi", "Social Studies", "Computer"]

export default function AddHomeworkPage() {
  const { classes, classNames, sectionNames, sectionsOf } = useClassesAndSections();
  const classOptions = ["", ...classNames];
  const sectionOptions = ["", ...sectionNames];
  const { data: homeworkList, add, update, remove } = useApi<HomeworkRecord>("/api/homework")
  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [filterSubject, setFilterSubject] = useState("")
  const [searched, setSearched] = useState(false)

  const [homeworkDate, setHomeworkDate] = useState("")
  const [submissionDate, setSubmissionDate] = useState("")
  const [homework, setHomework] = useState("")
  const [document, setDocument] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [editId, setEditId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editHomeworkDate, setEditHomeworkDate] = useState("")
  const [editSubmissionDate, setEditSubmissionDate] = useState("")
  const [editHomework, setEditHomework] = useState("")
  const [editDocument, setEditDocument] = useState("")
  const [editClass, setEditClass] = useState("")
  const [editSection, setEditSection] = useState("")
  const [editSubject, setEditSubject] = useState("")
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const availableSections = useMemo(() => {
    if (!filterClass) return [""]
    const selected = classes.find((c) => c.name === filterClass)
    return ["", ...(selected ? sectionsOf(selected.id).map((s) => s.name) : [])]
  }, [filterClass, classes, sectionsOf])

  const filtered = useMemo(() => {
    if (!searched) return []
    return homeworkList.filter((h) => {
      if (filterClass && h.class !== filterClass) return false
      if (filterSection && h.section !== filterSection) return false
      if (filterSubject && h.subject !== filterSubject) return false
      return true
    })
  }, [homeworkList, filterClass, filterSection, filterSubject, searched])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!filterClass) errs.filterClass = "Class is required"
    if (!filterSection) errs.filterSection = "Section is required"
    if (!filterSubject) errs.filterSubject = "Subject is required"
    if (!homeworkDate) errs.homeworkDate = "Homework date is required"
    if (!submissionDate) errs.submissionDate = "Submission date is required"
    if (!homework.trim()) errs.homework = "Homework is required"
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    await add({
      class: filterClass,
      section: filterSection,
      subject: filterSubject,
      homeworkDate,
      submissionDate,
      homework: homework.trim(),
      document,
    })
    setHomeworkDate("")
    setSubmissionDate("")
    setHomework("")
    setDocument("")
  }

  const handleEdit = (record: HomeworkRecord) => {
    setEditId(record.id)
    setEditClass(record.class)
    setEditSection(record.section)
    setEditSubject(record.subject)
    setEditHomeworkDate(record.homeworkDate)
    setEditSubmissionDate(record.submissionDate)
    setEditHomework(record.homework)
    setEditDocument(record.document)
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    const errs: Record<string, string> = {}
    if (!editHomeworkDate) errs.editHomeworkDate = "Homework date is required"
    if (!editSubmissionDate) errs.editSubmissionDate = "Submission date is required"
    if (!editHomework.trim()) errs.editHomework = "Homework is required"
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    if (editId === null) return

    await update(editId, {
      class: editClass,
      section: editSection,
      subject: editSubject,
      homeworkDate: editHomeworkDate,
      submissionDate: editSubmissionDate,
      homework: editHomework,
      document: editDocument,
    })
    setShowEditModal(false)
    setEditId(null)
  }

  const handleDelete = (id: number) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Add Homework</h2>
          <p className="text-sm text-white/80 mt-1">Manage homework assignments for students</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <form onSubmit={handleSearch} className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setFilterSection("") }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Select</option>
                {classOptions.slice(1).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.filterClass && <p className="text-red-500 text-xs mt-1">{errors.filterClass}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
              <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Select</option>
                {availableSections.slice(1).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.filterSection && <p className="text-red-500 text-xs mt-1">{errors.filterSection}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Select</option>
                {subjectOptions.slice(1).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.filterSubject && <p className="text-red-500 text-xs mt-1">{errors.filterSubject}</p>}
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {searched && (
        <>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Homework
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Homework Date</label>
                  <input type="text" value={homeworkDate} onChange={(e) => setHomeworkDate(e.target.value)} placeholder="MM/DD/YYYY" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {errors.homeworkDate && <p className="text-red-500 text-xs mt-1">{errors.homeworkDate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Submission Date</label>
                  <input type="text" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} placeholder="MM/DD/YYYY" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {errors.submissionDate && <p className="text-red-500 text-xs mt-1">{errors.submissionDate}</p>}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Homework</label>
                <textarea value={homework} onChange={(e) => setHomework(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" placeholder="Enter homework details..." />
                {errors.homework && <p className="text-red-500 text-xs mt-1">{errors.homework}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Attach Document</label>
                <input type="text" value={document} onChange={(e) => setDocument(e.target.value)} placeholder="Document name or file path" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <button type="submit" className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Save
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Class</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Section</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Subject</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Homework Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Submission Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Homework</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-400">No homework entries found</td>
                    </tr>
                  ) : (
                    filtered.map((h, idx) => (
                      <tr key={h.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 text-gray-800">{h.class}</td>
                        <td className="px-4 py-3 text-gray-600">{h.section}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">{h.subject}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{h.homeworkDate}</td>
                        <td className="px-4 py-3 text-gray-600">{h.submissionDate}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{h.homework}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(h)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(h.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
              <span>Showing {filtered.length} of {homeworkList.length} records</span>
            </div>
          </div>
        </>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowEditModal(false); setEditErrors({}) }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Edit Homework</h3>
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select value={editClass} onChange={(e) => setEditClass(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    {classOptions.map((opt) => (
                      <option key={opt} value={opt || ""}>{opt || "Select"}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select value={editSection} onChange={(e) => setEditSection(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    {sectionOptions.map((opt) => (
                      <option key={opt} value={opt || ""}>{opt || "Select"}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    {subjectOptions.map((opt) => (
                      <option key={opt} value={opt || ""}>{opt || "Select"}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Homework Date</label>
                  <input type="text" value={editHomeworkDate} onChange={(e) => setEditHomeworkDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.editHomeworkDate && <p className="text-red-500 text-xs mt-1">{editErrors.editHomeworkDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submission Date</label>
                  <input type="text" value={editSubmissionDate} onChange={(e) => setEditSubmissionDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                  {editErrors.editSubmissionDate && <p className="text-red-500 text-xs mt-1">{editErrors.editSubmissionDate}</p>}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Homework</label>
                <textarea value={editHomework} onChange={(e) => setEditHomework(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.editHomework && <p className="text-red-500 text-xs mt-1">{editErrors.editHomework}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attach Document</label>
                <input type="text" value={editDocument} onChange={(e) => setEditDocument(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdate} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">Are you sure you want to delete this homework entry?</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
