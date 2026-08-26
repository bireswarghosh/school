"use client"

import { useState } from "react"
import { Plus, Play, Trash2, X, Check, Video, VideoOff, Key } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

interface ZoomClass {
  id: number
  title: string
  date: string
  duration: string
  role: string
  staff: string
  class: string
  section: string
  hostVideo: boolean
  clientVideo: boolean
  description: string
  status: "awaited" | "started" | "finished" | "cancelled"
  zoomUrl: string
}

const staffList = [
  { id: 1, name: "John Doe", role: "Teacher", class: "Class 1" },
  { id: 2, name: "Jane Smith", role: "Teacher", class: "Class 2" },
  { id: 3, name: "Robert Wilson", role: "Teacher", class: "Class 3" },
  { id: 4, name: "Emily Davis", role: "Teacher", class: "Class 4" },
  { id: 5, name: "Michael Brown", role: "Teacher", class: "Class 5" },
]

const roles = ["Teacher", "Accountant", "Librarian", "Admin"]

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-2xl mx-4">
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

export default function ZoomLiveClassesPage() {
  const { classNames: classes, sectionNames: sections } = useClassesAndSections()
  const { data: classesList, add, update, remove, loading } = useApi<ZoomClass>("/api/zoom/class")
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [showCredentialModal, setShowCredentialModal] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" })
  const [formData, setFormData] = useState({
    title: "", date: "", duration: "", role: "Teacher", staff: "", class: "", section: "",
    hostVideo: true, clientVideo: true, description: "", zoomUrl: ""
  })
  const [credentialForm, setCredentialForm] = useState({ apiKey: "", apiSecret: "" })

  const showToast = (message: string) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: "" }), 3000)
  }

  const handleSave = async () => {
    await add({
      title: formData.title, date: formData.date, duration: formData.duration,
      role: formData.role, staff: formData.staff, class: formData.class, section: formData.section,
      hostVideo: formData.hostVideo, clientVideo: formData.clientVideo, description: formData.description,
      status: "awaited", zoomUrl: formData.zoomUrl,
    })
    setShowAddModal(false)
    setFormData({ title: "", date: "", duration: "", role: "Teacher", staff: "", class: "", section: "", hostVideo: true, clientVideo: true, description: "", zoomUrl: "" })
    showToast("Live class created successfully!")
  }

  const handleDelete = async (id: number) => {
    await remove(id)
    setDeleteConfirmId(null)
    showToast("Live class deleted successfully!")
  }

  const updateStatus = async (id: number, status: ZoomClass["status"]) => {
    await update(id, { status })
    showToast(`Class status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`)
  }

  const filteredStaff = formData.class
    ? staffList.filter((s) => s.class === formData.class)
    : staffList

  return (
    <div className="space-y-6">
      {toast.show && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-in">
          <Check className="h-4 w-4" />
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Live Classes</h2>
          <p className="text-sm text-gray-500 mt-1">Zoom Live Classes / Live Classes</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCredentialModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Key className="h-4 w-4" /> Add Credential
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "Class Title", "Date", "Duration", "Staff", "Class-Section", "Video", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classesList.map((c, idx) => (
                <tr key={c.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                  <td className="px-4 py-2.5 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="font-medium text-gray-800">{c.title}</p>
                      {c.description && <p className="text-xs text-gray-400 truncate max-w-[160px]">{c.description}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{c.date}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{c.duration} min</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.staff}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.class}-{c.section}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {c.hostVideo ? <Video className="h-3.5 w-3.5 text-green-600" /> : <VideoOff className="h-3.5 w-3.5 text-gray-400" />}
                      {c.clientVideo ? <Video className="h-3.5 w-3.5 text-blue-600" /> : <VideoOff className="h-3.5 w-3.5 text-gray-400" />}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.status === "started" ? "bg-green-100 text-green-700" :
                      c.status === "awaited" ? "bg-blue-100 text-blue-700" :
                      c.status === "finished" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"
                    }`}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {c.status === "awaited" && (
                        <a href={c.zoomUrl} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Start Class">
                          <Play className="h-4 w-4" />
                        </a>
                      )}
                      {c.status === "awaited" && (
                        <>
                          <button onClick={() => updateStatus(c.id, "finished")}
                            className="px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors">Finish</button>
                          <button onClick={() => updateStatus(c.id, "cancelled")}
                            className="px-2 py-0.5 text-[10px] font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors">Cancel</button>
                        </>
                      )}
                      <button onClick={() => setDeleteConfirmId(c.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {classesList.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-400">No live classes found. Click "Add" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <ModalOverlay onClose={() => setShowAddModal(false)}>
          <ModalHeader title="Create Live Class" onClose={() => setShowAddModal(false)} />
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Class Title <span className="text-red-500">*</span></label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Mathematics - Algebra" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Class Date <span className="text-red-500">*</span></label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Duration (Minutes) <span className="text-red-500">*</span></label>
                <input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 45" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Role <span className="text-red-500">*</span></label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Class <span className="text-red-500">*</span></label>
                <select value={formData.class} onChange={(e) => { setFormData({ ...formData, class: e.target.value, staff: "" }) }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Class</option>
                  {classes.map((cl) => <option key={cl} value={cl}>{cl}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Section <span className="text-red-500">*</span></label>
                <select value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Section</option>
                  {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Staff <span className="text-red-500">*</span></label>
                <select value={formData.staff} onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select Staff</option>
                  {filteredStaff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Zoom URL</label>
                <input type="url" value={formData.zoomUrl} onChange={(e) => setFormData({ ...formData, zoomUrl: e.target.value })}
                  placeholder="https://zoom.us/j/..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Video Options</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.hostVideo} onChange={(e) => setFormData({ ...formData, hostVideo: e.target.checked })}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                  <span className="text-sm text-gray-700">Host Video</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.clientVideo} onChange={(e) => setFormData({ ...formData, clientVideo: e.target.checked })}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                  <span className="text-sm text-gray-700">Client Video</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3} placeholder="Enter class description..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">Save</button>
          </div>
        </ModalOverlay>
      )}

      {showCredentialModal && (
        <ModalOverlay onClose={() => setShowCredentialModal(false)}>
          <ModalHeader title="Add Credential" onClose={() => setShowCredentialModal(false)} />
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Zoom API Key <span className="text-red-500">*</span></label>
              <input type="text" value={credentialForm.apiKey} onChange={(e) => setCredentialForm({ ...credentialForm, apiKey: e.target.value })}
                placeholder="Enter Zoom API Key" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Zoom API Secret <span className="text-red-500">*</span></label>
              <input type="text" value={credentialForm.apiSecret} onChange={(e) => setCredentialForm({ ...credentialForm, apiSecret: e.target.value })}
                placeholder="Enter Zoom API Secret" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setShowCredentialModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={() => { showToast("API credentials saved successfully!"); setShowCredentialModal(false); setCredentialForm({ apiKey: "", apiSecret: "" }) }}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">Save</button>
          </div>
        </ModalOverlay>
      )}

      {deleteConfirmId && (
        <ModalOverlay onClose={() => setDeleteConfirmId(null)}>
          <ModalHeader title="Confirm Delete" onClose={() => setDeleteConfirmId(null)} />
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600">Are you sure you want to delete this live class? This action cannot be undone.</p>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirmId)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">OK</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
