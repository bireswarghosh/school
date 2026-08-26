"use client"

import { useState } from "react"
import { Plus, Play, Trash2, X, Check, Users, Video, VideoOff } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface ZoomMeeting {
  id: number
  title: string
  date: string
  duration: string
  hostVideo: boolean
  clientVideo: boolean
  description: string
  invitedStaff: string[]
  status: "awaited" | "started" | "finished" | "cancelled"
  zoomUrl: string
}

const allStaff = [
  { id: 1, name: "John Doe", role: "Teacher" },
  { id: 2, name: "Jane Smith", role: "Teacher" },
  { id: 3, name: "Robert Wilson", role: "Teacher" },
  { id: 4, name: "Emily Davis", role: "Teacher" },
  { id: 5, name: "Michael Brown", role: "Accountant" },
  { id: 6, name: "Sarah Johnson", role: "Librarian" },
  { id: 7, name: "David Miller", role: "Admin" },
]

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

export default function ZoomLiveMeetingPage() {
  const { data: meetings, add, update, remove, loading } = useApi<ZoomMeeting>("/api/zoom/meeting")
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [viewStaffId, setViewStaffId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" })
  const [formData, setFormData] = useState({
    title: "", date: "", duration: "", hostVideo: true, clientVideo: true, description: "", invitedStaff: [] as string[], zoomUrl: ""
  })

  const showToast = (message: string) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: "" }), 3000)
  }

  const handleSave = async () => {
    await add({
      title: formData.title, date: formData.date, duration: formData.duration,
      hostVideo: formData.hostVideo, clientVideo: formData.clientVideo, description: formData.description,
      invitedStaff: formData.invitedStaff, status: "awaited", zoomUrl: formData.zoomUrl,
    })
    setShowAddModal(false)
    setFormData({ title: "", date: "", duration: "", hostVideo: true, clientVideo: true, description: "", invitedStaff: [], zoomUrl: "" })
    showToast("Live meeting created successfully!")
  }

  const handleDelete = async (id: number) => {
    await remove(id)
    setDeleteConfirmId(null)
    showToast("Live meeting deleted successfully!")
  }

  const toggleStaff = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      invitedStaff: prev.invitedStaff.includes(name)
        ? prev.invitedStaff.filter((s) => s !== name)
        : [...prev.invitedStaff, name],
    }))
  }

  const updateStatus = async (id: number, status: ZoomMeeting["status"]) => {
    await update(id, { status })
    showToast(`Meeting status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`)
  }

  return (
    <div className="space-y-6">
      {toast.show && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-in">
          <Check className="h-4 w-4" />
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Live Meeting</h2>
          <p className="text-sm text-gray-500 mt-1">Zoom Live Classes / Live Meeting</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "Meeting Title", "Date", "Duration", "Host Video", "Client Video", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meetings.map((m, idx) => (
                <tr key={m.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                  <td className="px-4 py-2.5 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="font-medium text-gray-800">{m.title}</p>
                      {m.description && <p className="text-xs text-gray-400 truncate max-w-[180px]">{m.description}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{m.date}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{m.duration} min</td>
                  <td className="px-4 py-2.5">
                    {m.hostVideo ? <Video className="h-4 w-4 text-green-600" /> : <VideoOff className="h-4 w-4 text-gray-400" />}
                  </td>
                  <td className="px-4 py-2.5">
                    {m.clientVideo ? <Video className="h-4 w-4 text-green-600" /> : <VideoOff className="h-4 w-4 text-gray-400" />}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      m.status === "started" ? "bg-green-100 text-green-700" :
                      m.status === "awaited" ? "bg-blue-100 text-blue-700" :
                      m.status === "finished" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"
                    }`}>
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {m.status === "awaited" && (
                        <a href={m.zoomUrl} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Start Meeting">
                          <Play className="h-4 w-4" />
                        </a>
                      )}
                      {m.status === "awaited" && (
                        <>
                          <button onClick={() => updateStatus(m.id, "finished")}
                            className="px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors" title="Mark as Finished">
                            Finish
                          </button>
                          <button onClick={() => updateStatus(m.id, "cancelled")}
                            className="px-2 py-0.5 text-[10px] font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors" title="Cancel Meeting">
                            Cancel
                          </button>
                        </>
                      )}
                      <button onClick={() => setViewStaffId(m.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Invited Staff">
                        <Users className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(m.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {meetings.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No live meetings found. Click "Add" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <ModalOverlay onClose={() => setShowAddModal(false)}>
          <ModalHeader title="Create Live Meeting" onClose={() => setShowAddModal(false)} />
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Meeting Title <span className="text-red-500">*</span></label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Staff Meeting" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Meeting Date <span className="text-red-500">*</span></label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Duration (Minutes) <span className="text-red-500">*</span></label>
                <input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 60" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Zoom URL</label>
                <input type="url" value={formData.zoomUrl} onChange={(e) => setFormData({ ...formData, zoomUrl: e.target.value })}
                  placeholder="https://zoom.us/j/..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3} placeholder="Enter meeting description..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none" />
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
              <label className="block text-xs font-medium text-gray-600">Invite Staff <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {allStaff.map((s) => (
                  <button key={s.id} type="button" onClick={() => toggleStaff(s.name)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      formData.invitedStaff.includes(s.name)
                        ? "bg-[var(--primary-light)] border-indigo-300 text-[var(--primary)]"
                        : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}>
                    {s.name} ({s.role})
                  </button>
                ))}
              </div>
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

      {viewStaffId && (
        <ModalOverlay onClose={() => setViewStaffId(null)}>
          <ModalHeader title={`Invited Staff - ${meetings.find((m) => m.id === viewStaffId)?.title}`} onClose={() => setViewStaffId(null)} />
          <div className="px-6 py-4">
            {(() => {
              const meeting = meetings.find((m) => m.id === viewStaffId)
              if (!meeting || meeting.invitedStaff.length === 0) {
                return <p className="text-sm text-gray-400 text-center py-6">No staff invited</p>
              }
              return (
                <div className="space-y-2">
                  {meeting.invitedStaff.map((name, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <span className="text-sm text-gray-800">{name}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setViewStaffId(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Close</button>
          </div>
        </ModalOverlay>
      )}

      {deleteConfirmId && (
        <ModalOverlay onClose={() => setDeleteConfirmId(null)}>
          <ModalHeader title="Confirm Delete" onClose={() => setDeleteConfirmId(null)} />
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600">Are you sure you want to delete this live meeting? This action cannot be undone.</p>
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
