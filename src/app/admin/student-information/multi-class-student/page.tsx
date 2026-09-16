"use client"
import { toast as notify } from "@/lib/toast"

import { useState } from "react"
import { Search, Plus, Trash2, Save, X } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type MultiClassRow = {
  id: string
  classVal: string
  section: string
}

type Assignment = {
  id: number
  studentName: string
  assignedClasses: string
}

const sampleStudents = [
  { id: 1, name: "Rahul Sharma" },
  { id: 2, name: "Priya Gupta" },
  { id: 3, name: "Amit Kumar" },
  { id: 4, name: "Sneha Patel" },
  { id: 5, name: "Arjun Nair" },
  { id: 6, name: "Edward Thomas" },
  { id: 7, name: "Ravi Nair" },
  { id: 8, name: "Priya Sharma" },
]

let rowCounter = 0
const newRow = (): MultiClassRow => ({
  id: `row_${++rowCounter}`,
  classVal: "",
  section: "",
})

export default function MultiClassStudentPage() {
  const { classes, sectionsOf, sectionNames } = useClassesAndSections()
  const { data: assignments, add, remove } = useApi<Assignment>("/api/student-information/multi-class")
  const [showResults, setShowResults] = useState(false)
  const [classVal, setClassVal] = useState("")
  const [section, setSection] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")
  const [rows, setRows] = useState<MultiClassRow[]>([])
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleSearch = () => {
    setShowResults(true)
  }

  const handleAddRow = () => {
    setRows((prev) => [...prev, newRow()])
  }

  const handleRemoveRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const handleRowChange = (id: string, field: "classVal" | "section", value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const handleSave = async () => {
    if (!selectedStudent || rows.length === 0) {
      notify.error("Please select a student and add at least one class assignment.")
      return
    }
    const student = sampleStudents.find((s) => s.name === selectedStudent)
    if (!student) return

    const classStr = rows
      .filter((r) => r.classVal && r.section)
      .map((r) => `${r.classVal}${r.section}`)
      .join(", ")

    if (!classStr) {
      notify.error("Please fill in all class and section fields.")
      return
    }

    await add({ studentName: selectedStudent, assignedClasses: classStr })
    setRows([])
    setSelectedStudent("")
    notify.success("Multi-class assignment saved successfully!")
  }

  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Multi Class Student</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Student Information / Multi Class Student</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Search</h3>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={classVal}
                onChange={(e) => setClassVal(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Select</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Select</option>
                {sectionNames.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results (shown after search) */}
      {showResults && (
        <>
          {/* Student Select */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Select Student</h3>
            </div>
            <div className="p-5">
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Select a student</option>
                {sampleStudents.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Multi Class Assignment */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Multi Class Assignment</h3>
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[var(--primary)] text-sm font-medium border border-indigo-200 rounded-lg hover:bg-[var(--primary-light)] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Row
              </button>
            </div>
            <div className="p-5 space-y-3">
              {rows.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No rows added. Click &quot;Add Row&quot; to begin.</p>
              ) : (
                rows.map((row) => (
                  <div key={row.id} className="flex items-center gap-3">
                    <select
                      value={row.classVal}
                      onChange={(e) => handleRowChange(row.id, "classVal", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <select
                      value={row.section}
                      onChange={(e) => handleRowChange(row.id, "section", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    >
                      <option value="">Select Section</option>
                      {sectionNames.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveRow(row.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
              {rows.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Existing Assignments Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Existing Multi Class Assignments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Assigned Classes</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-400">No assignments found</td>
                    </tr>
                  ) : (
                    assignments.map((a, idx) => (
                      <tr
                        key={a.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">{a.studentName}</td>
                        <td className="px-4 py-3 text-gray-600">{a.assignedClasses}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => notify.info("Edit functionality coming soon.")}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => (function(id) { setDeleteId(id); setShowDeleteModal(true) })(a.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
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
              <span>Showing {assignments.length} records</span>
            </div>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this assignment?
                {deleteId && (
                  <strong className="block mt-1 text-gray-800">
                    {assignments.find((a) => a.id === deleteId)?.studentName}
                  </strong>
                )}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
