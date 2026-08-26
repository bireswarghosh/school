"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Save, ExternalLink, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useApi } from "@/lib/use-api"

type ExamType = "general" | "school_grade" | "college_grade"

type ExamGroup = {
  id: number
  name: string
  examType: ExamType
  description: string
}

const examTypes: { value: ExamType; label: string }[] = [
  { value: "general", label: "General Purpose (Pass/Fail)" },
  { value: "school_grade", label: "School Based Grading System" },
  { value: "college_grade", label: "College Based Grading System" },
]

export default function ExamGroupPage() {
  const router = useRouter()
  const { data: groups, add: addGroup, update: updateGroup, remove: removeGroup } = useApi<ExamGroup>("/api/examinations/group")
  const [search, setSearch] = useState("")

  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [showEditGroupModal, setShowEditGroupModal] = useState(false)
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false)
  const [deleteGroupId, setDeleteGroupId] = useState<number | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const [groupForm, setGroupForm] = useState({ name: "", examType: "" as ExamType | "", description: "" })
  const [editGroupForm, setEditGroupForm] = useState({ id: 0, name: "", examType: "" as ExamType | "", description: "" })

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleGroupFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setGroupForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const handleEditGroupFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditGroupForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const validateGroupForm = (data: typeof groupForm) => {
    const errs: Record<string, string> = {}
    if (!data.name.trim()) errs.name = "Group name is required"
    if (!data.examType) errs.examType = "Exam type is required"
    return errs
  }

  const handleAddGroup = async () => {
    const errs = validateGroupForm(groupForm)
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      await addGroup({ name: groupForm.name.trim(), examType: groupForm.examType as ExamType, description: groupForm.description.trim() })
      setShowAddGroupModal(false)
      setGroupForm({ name: "", examType: "", description: "" })
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const handleEditGroupOpen = (group: ExamGroup) => {
    setEditGroupForm({ id: group.id, name: group.name, examType: group.examType, description: group.description })
    setErrors({})
    setShowEditGroupModal(true)
  }

  const handleEditGroupSave = async () => {
    const errs = validateGroupForm(editGroupForm)
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      await updateGroup(editGroupForm.id, { name: editGroupForm.name.trim(), examType: editGroupForm.examType as ExamType, description: editGroupForm.description.trim() })
      setShowEditGroupModal(false)
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const handleDeleteGroupOpen = (id: number) => { setDeleteGroupId(id); setShowDeleteGroupModal(true) }
  const confirmDeleteGroup = async () => {
    if (deleteGroupId === null) return
    try {
      await removeGroup(deleteGroupId)
      setShowDeleteGroupModal(false)
      setDeleteGroupId(null)
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const getExamTypeLabel = (type: ExamType) => {
    return examTypes.find((t) => t.value === type)?.label || type
  }

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

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Exam Group</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Examinations / Exam Group</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Add Exam Group</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={groupForm.name} onChange={handleGroupFormChange} placeholder="Enter group name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam Type <span className="text-red-500">*</span></label>
              <select name="examType" value={groupForm.examType} onChange={handleGroupFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {examTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {errors.examType && <p className="text-red-500 text-xs mt-1">{errors.examType}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Description</label>
              <textarea name="description" value={groupForm.description} onChange={handleGroupFormChange} placeholder="Enter description" rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
            </div>
            <button onClick={handleAddGroup}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-gray-700">Exam Group List</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups..."
                className="w-56 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["#", "Name", "Exam Type", "Description", "Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredGroups.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No exam groups found</td></tr>
                ) : (
                  filteredGroups.map((group, idx) => (
                    <tr key={group.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{group.name}</td>
                      <td className="px-4 py-3 text-gray-600">{getExamTypeLabel(group.examType)}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{group.description || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => router.push(`/admin/examinations/exam-group/addexam/${group.id}`)}
                            className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="Manage Exams">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleEditGroupOpen(group)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteGroupOpen(group.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
            <span>Showing {filteredGroups.length} of {groups.length} records</span>
          </div>
        </div>
      </div>

      <Modal title="Edit Exam Group" show={showEditGroupModal} onClose={() => setShowEditGroupModal(false)}>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Name <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={editGroupForm.name} onChange={handleEditGroupFormChange} placeholder="Enter group name"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Exam Type <span className="text-red-500">*</span></label>
            <select name="examType" value={editGroupForm.examType} onChange={handleEditGroupFormChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
              <option value="">Select</option>
              {examTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {errors.examType && <p className="text-red-500 text-xs mt-1">{errors.examType}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Description</label>
            <textarea name="description" value={editGroupForm.description} onChange={handleEditGroupFormChange} placeholder="Enter description" rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowEditGroupModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleEditGroupSave} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      {showDeleteGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteGroupModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteGroupModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Are you sure you want to delete this exam group?
                {deleteGroupId && <strong className="block mt-1 text-gray-800">{groups.find((g) => g.id === deleteGroupId)?.name}</strong>}
              </p>
              <p className="text-xs text-red-500 mt-2">All exams under this group will also be deleted.</p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteGroupModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={confirmDeleteGroup} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
