"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Trash2, X, CheckSquare, AlertTriangle } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface Student {
  id: number
  admissionNo: string
  name: string
  className: string
  section: string
  fatherName: string
  rollNo: number
}

export default function BulkDeletePage() {
  const { data: allStudents, remove } = useApi<Student>("/api/student-information/bulk-delete")
  const [selectedClass, setSelectedClass] = useState("Select")
  const [selectedSection, setSelectedSection] = useState("Select")
  const [studentList, setStudentList] = useState<Student[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showResults, setShowResults] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const classOptions = useMemo(() => {
    const classes = [...new Set((allStudents || []).map((s) => s.className).filter(Boolean))]
    return ["Select", ...classes.sort()]
  }, [allStudents])

  const sectionOptions = useMemo(() => {
    const sections = [...new Set((allStudents || []).map((s) => s.section).filter(Boolean))]
    return ["Select", ...sections.sort()]
  }, [allStudents])

  useEffect(() => {
    if (allStudents.length > 0 && !showResults) {
      setStudentList(allStudents)
      setShowResults(true)
    }
  }, [allStudents])

  const handleSearch = () => {
    const filtered = (allStudents || []).filter((s) => {
      const matchClass = selectedClass === "Select" || s.className === selectedClass
      const matchSection = selectedSection === "Select" || s.section === selectedSection
      return matchClass && matchSection
    })
    setStudentList(filtered)
    setSelectedIds(new Set())
    setShowResults(true)
    setSuccessMessage("")
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === studentList.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(studentList.map((s) => s.id)))
    }
  }

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleDelete = async () => {
    const idsToRemove = selectedIds
    for (const id of idsToRemove) {
      await remove(id)
    }
    setStudentList((prev) => prev.filter((s) => !idsToRemove.has(s.id)))
    const count = idsToRemove.size
    setSelectedIds(new Set())
    setShowDeleteModal(false)
    setSuccessMessage(`${count} student${count > 1 ? "s" : ""} deleted successfully.`)
  }

  const allSelected = studentList.length > 0 && selectedIds.size === studentList.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-xl p-5 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Bulk Delete</h1>
        <div className="flex items-center gap-2 text-sm text-red-100 mt-1">
          <span>Student Information</span>
          <span>/</span>
          <span className="text-white font-medium">Bulk Delete</span>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
          >
            {classOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
          >
            {sectionOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <Search size={16} />
          Search
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-3 rounded-lg">
          <CheckSquare size={18} className="text-green-500" />
          {successMessage}
          <button onClick={() => setSuccessMessage("")} className="ml-auto text-green-500 hover:text-green-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Student Selection Table */}
      {showResults && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="accent-red-600 rounded cursor-pointer"
                    />
                  </th>
                  <th className="p-3 text-left font-medium text-gray-500 uppercase tracking-wide text-xs">
                    Admission No
                  </th>
                  <th className="p-3 text-left font-medium text-gray-500 uppercase tracking-wide text-xs">
                    Student Name
                  </th>
                  <th className="p-3 text-left font-medium text-gray-500 uppercase tracking-wide text-xs">
                    Class
                  </th>
                  <th className="p-3 text-left font-medium text-gray-500 uppercase tracking-wide text-xs">
                    Father Name
                  </th>
                  <th className="p-3 text-left font-medium text-gray-500 uppercase tracking-wide text-xs">
                    Roll No
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">
                      No students found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  studentList.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(student.id)}
                          onChange={() => toggleSelect(student.id)}
                          className="accent-red-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-gray-600 font-mono text-xs">{student.admissionNo}</td>
                      <td className="p-3 font-medium text-gray-800">{student.name}</td>
                      <td className="p-3 text-gray-600">{student.className}</td>
                      <td className="p-3 text-gray-600">{student.fatherName}</td>
                      <td className="p-3 text-gray-600">{student.rollNo}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Delete Button */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-t border-red-100">
              <span className="text-sm text-red-700 font-medium">
                {selectedIds.size} student{selectedIds.size > 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Students</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to delete {selectedIds.size} selected student{selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
