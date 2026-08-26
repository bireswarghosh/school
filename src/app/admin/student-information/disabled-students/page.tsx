"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useMemo } from "react"
import { Search, Eye, Pencil, Trash2, X, Users } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type DisabledStudent = {
  id: number
  admissionNo: string
  firstName: string
  lastName: string
  class: string
  section: string
  fatherName: string
  disableReason: string
  gender: string
  mobile: string
  dob: string
  email: string
  address: string
  motherName: string
  previousSchool: string
}

const reasonBadgeClass = (reason: string) => {
  switch (reason) {
    case "Medical Condition": return "bg-red-100 text-red-800"
    case "Learning Disability": return "bg-amber-100 text-amber-800"
    case "Physical Disability": return "bg-purple-100 text-purple-800"
    case "Hearing Impairment": return "bg-blue-100 text-blue-800"
    case "Visual Impairment": return "bg-teal-100 text-teal-800"
    default: return "bg-gray-100 text-gray-600"
  }
}

const genderBadgeClass = (gender: string) => {
  switch (gender) {
    case "Male": return "bg-blue-100 text-blue-800"
    case "Female": return "bg-pink-100 text-pink-800"
    default: return "bg-gray-100 text-gray-600"
  }
}

const avatarColors = ["bg-blue-500", "bg-pink-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-teal-500"]

const initials = (first: string, last: string) => (first.charAt(0) + last.charAt(0)).toUpperCase()

export default function DisabledStudentsPage() {
  const { classNames, sectionNames } = useClassesAndSections()
  const classOptions = ["Select", ...classNames]
  const sectionOptions = ["Select", ...sectionNames]
  const { data: students, add, update, remove, loading } = useApi<DisabledStudent>("/api/student-information/student")
  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [activeTab, setActiveTab] = useState<"list" | "details">("list")

  const [viewRecord, setViewRecord] = useState<DisabledStudent | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  const [editForm, setEditForm] = useState<DisabledStudent | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const [deleteRecord, setDeleteRecord] = useState<DisabledStudent | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (filterClass && s.class !== filterClass) return false
      if (filterSection && s.section !== filterSection) return false
      return true
    })
  }, [students, filterClass, filterSection])

  const handleSearch = () => {}

  const handleView = (record: DisabledStudent) => {
    setViewRecord(record)
    setShowViewModal(true)
  }

  const handleEdit = (record: DisabledStudent) => {
    setEditForm({ ...record })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditField = (field: keyof DisabledStudent, value: string) => {
    if (!editForm) return
    setEditForm((prev) => prev ? { ...prev, [field]: value } : null)
    if (editErrors[field]) setEditErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validateEditForm = () => {
    const errs: Record<string, string> = {}
    if (!editForm?.firstName.trim()) errs.firstName = "First name is required"
    if (!editForm?.lastName.trim()) errs.lastName = "Last name is required"
    if (!editForm?.admissionNo.trim()) errs.admissionNo = "Admission No is required"
    if (!editForm?.fatherName.trim()) errs.fatherName = "Father name is required"
    if (!editForm?.disableReason.trim()) errs.disableReason = "Disable reason is required"
    if (!editForm?.mobile.trim()) errs.mobile = "Mobile is required"
    if (!editForm?.gender) errs.gender = "Gender is required"
    setEditErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleUpdate = async () => {
    if (!validateEditForm() || !editForm) return
    try {
      await update(editForm.id, editForm)
      setShowEditModal(false)
      setEditForm(null)
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const handleDelete = (record: DisabledStudent) => {
    setDeleteRecord(record)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteRecord) return
    try {
      await remove(deleteRecord.id)
      setShowDeleteModal(false)
      setDeleteRecord(null)
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Disabled Students</h2>
            <p className="text-sm text-[var(--primary)]/80 mt-0.5">Student Information / Disabled Students</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch() }}
          className="p-5"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                {classOptions.map((opt) => (
                  <option key={opt} value={opt === "Select" ? "" : opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                {sectionOptions.map((opt) => (
                  <option key={opt} value={opt === "Select" ? "" : opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "list"
                ? "border-indigo-600 text-[var(--primary)]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-indigo-600 text-[var(--primary)]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Details View
          </button>
        </div>
      </div>

      {activeTab === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Admission No</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Class</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Father Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Disable Reason</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Gender</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Mobile Number</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">No disabled students found</td>
                  </tr>
                ) : (
                  filtered.map((student, idx) => (
                    <tr key={student.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{student.admissionNo}</td>
                      <td className="px-4 py-3 text-gray-800">{student.firstName} {student.lastName}</td>
                      <td className="px-4 py-3 text-gray-600">{student.class} {student.section}</td>
                      <td className="px-4 py-3 text-gray-600">{student.fatherName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${reasonBadgeClass(student.disableReason)}`}>
                          {student.disableReason}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${genderBadgeClass(student.gender)}`}>
                          {student.gender}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{student.mobile}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleView(student)} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleEdit(student)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(student)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
            <span>Showing {filtered.length} of {students.length} records</span>
          </div>
        </div>
      )}

      {activeTab === "details" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">No disabled students found</div>
          ) : (
            filtered.map((student, idx) => (
              <div key={student.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm`}>
                    {initials(student.firstName, student.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">{student.firstName} {student.lastName}</h4>
                    <p className="text-xs text-gray-500">{student.admissionNo}</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Class / Section</span>
                    <span className="font-medium text-gray-700">{student.class} - {student.section}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Father Name</span>
                    <span className="font-medium text-gray-700">{student.fatherName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Disable Reason</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${reasonBadgeClass(student.disableReason)}`}>
                      {student.disableReason}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Gender</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${genderBadgeClass(student.gender)}`}>
                      {student.gender}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mobile</span>
                    <span className="font-medium text-gray-700">{student.mobile}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-gray-100">
                  <button onClick={() => handleView(student)} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="View">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleEdit(student)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(student)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showViewModal && viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Disabled Student Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Admission No</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.admissionNo}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Student Name</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.firstName} {viewRecord.lastName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Class</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.class}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Section</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.section}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Father Name</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.fatherName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Mother Name</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.motherName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Disable Reason</label>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${reasonBadgeClass(viewRecord.disableReason)}`}>
                    {viewRecord.disableReason}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Gender</label>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${genderBadgeClass(viewRecord.gender)}`}>
                    {viewRecord.gender}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Date of Birth</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.dob}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Mobile Number</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.mobile}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500">Email</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.email}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500">Address</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.address}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Previous School</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.previousSchool || "-"}</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowEditModal(false); setEditErrors({}) }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Edit Disabled Student</h3>
              <button onClick={() => { setShowEditModal(false); setEditErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admission No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.admissionNo}
                    onChange={(e) => handleEditField("admissionNo", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {editErrors.admissionNo && <p className="text-red-500 text-xs mt-1">{editErrors.admissionNo}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => handleEditField("firstName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {editErrors.firstName && <p className="text-red-500 text-xs mt-1">{editErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => handleEditField("lastName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {editErrors.lastName && <p className="text-red-500 text-xs mt-1">{editErrors.lastName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={editForm.class}
                    onChange={(e) => handleEditField("class", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    <option value="">Select</option>
                    {classOptions.slice(1).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={editForm.section}
                    onChange={(e) => handleEditField("section", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    <option value="">Select</option>
                    {sectionOptions.slice(1).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Father Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.fatherName}
                    onChange={(e) => handleEditField("fatherName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {editErrors.fatherName && <p className="text-red-500 text-xs mt-1">{editErrors.fatherName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disable Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.disableReason}
                    onChange={(e) => handleEditField("disableReason", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {editErrors.disableReason && <p className="text-red-500 text-xs mt-1">{editErrors.disableReason}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => handleEditField("gender", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {editErrors.gender && <p className="text-red-500 text-xs mt-1">{editErrors.gender}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.mobile}
                    onChange={(e) => handleEditField("mobile", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {editErrors.mobile && <p className="text-red-500 text-xs mt-1">{editErrors.mobile}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="text"
                    value={editForm.dob}
                    onChange={(e) => handleEditField("dob", e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="text"
                    value={editForm.email}
                    onChange={(e) => handleEditField("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => handleEditField("address", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowEditModal(false); setEditErrors({}) }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deleteRecord && (
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
                Are you sure you want to delete this disabled student record?
                <strong className="block mt-1 text-gray-800">
                  {deleteRecord.firstName} {deleteRecord.lastName}
                </strong>
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
