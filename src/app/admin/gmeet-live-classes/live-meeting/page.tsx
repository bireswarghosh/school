"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Play, Trash2, X, Check, Users, HelpCircle, ExternalLink, Edit3 } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface StaffInfo {
  staffId: number
  staffName: string
}

interface LiveMeeting {
  id: number
  title: string
  date: string
  duration: number
  liveLink: string
  description: string
  hostName: string
  platform: string
  status: string
  invitedStaff: StaffInfo[]
}

interface StaffItem {
  id: number
  staff_id: string
  name: string
  role: string
}

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

export default function LiveMeetingPage() {
  const { data: meetings, add, update, remove, loading } = useApi<LiveMeeting>("/api/live-meeting")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [viewStaffId, setViewStaffId] = useState<number | null>(null)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" })
  const [formData, setFormData] = useState({
    title: "", date: "", duration: "", liveLink: "", description: "", invitedStaff: [] as number[],
  })
  const [staffList, setStaffList] = useState<StaffItem[]>([])

  const showToast = (message: string) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: "" }), 3000)
  }

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch("/api/staff")
      const data = await res.json()
      setStaffList(Array.isArray(data) ? data : [])
    } catch { setStaffList([]) }
  }, [])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  const handleSave = async () => {
    const payload = {
      title: formData.title,
      date: formData.date,
      duration: parseInt(formData.duration) || 0,
      liveLink: formData.liveLink,
      description: formData.description,
      hostName: "Admin",
      platform: "gmeet",
      status: "Awaited",
      invitedStaff: formData.invitedStaff,
    }
    if (editingId) {
      await update(editingId, payload)
      showToast("Live meeting updated successfully!")
    } else {
      await add(payload)
      showToast("Live meeting created successfully!")
    }
    setShowAddModal(false)
    setEditingId(null)
    setFormData({ title: "", date: "", duration: "", liveLink: "", description: "", invitedStaff: [] })
  }

  const openEditModal = (meeting: LiveMeeting) => {
    setEditingId(meeting.id)
    setFormData({
      title: meeting.title,
      date: meeting.date ? meeting.date.slice(0, 16) : "",
      duration: String(meeting.duration || ""),
      liveLink: meeting.liveLink || "",
      description: meeting.description || "",
      invitedStaff: (meeting.invitedStaff || []).map((s) => s.staffId),
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: number) => {
    await remove(id)
    setDeleteConfirmId(null)
    showToast("Live meeting deleted successfully!")
  }

  const toggleStaff = (staffId: number) => {
    setFormData((prev) => ({
      ...prev,
      invitedStaff: prev.invitedStaff.includes(staffId)
        ? prev.invitedStaff.filter((s) => s !== staffId)
        : [...prev.invitedStaff, staffId],
    }))
  }

  const formatDate = (d: string) => {
    if (!d) return ""
    const dt = new Date(d)
    return dt.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) +
      " " + dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
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
          <p className="text-sm text-gray-500 mt-1">Gmeet Live Classes / Live Meeting</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
            <HelpCircle className="h-4 w-4" /> Help
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
                {["#", "Meeting Title", "Date Time", "Duration (Minutes)", "Description", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(meetings || []).length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No live meetings found. Click &quot;Add&quot; to create one.</td></tr>
              ) : (
                (meetings || []).map((m, idx) => (
                  <tr key={m.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)] transition-colors`}>
                    <td className="px-4 py-2.5 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{m.title}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDate(m.date)}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{m.duration}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs max-w-[200px] truncate">{m.description}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.status === "live" ? "bg-green-100 text-green-700" :
                        m.status === "upcoming" || m.status === "Awaited" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {m.status === "Awaited" ? "Awaited" : m.status?.charAt(0).toUpperCase() + m.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {m.liveLink && (
                          <a href={m.liveLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors">
                            <Play className="h-3 w-3" /> Start
                          </a>
                        )}
                        <button onClick={() => openEditModal(m)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setViewStaffId(m.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Invited Staff">
                          <Users className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(m.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
      </div>

      {showAddModal && (
        <ModalOverlay onClose={() => { setShowAddModal(false); setEditingId(null) }}>
          <ModalHeader title={editingId ? "Edit Live Meeting" : "Create Live Meeting"} onClose={() => { setShowAddModal(false); setEditingId(null) }} />
          <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Meeting Title <span className="text-red-500">*</span></label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Staff Meeting" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Meeting Date <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Duration (Minutes) <span className="text-red-500">*</span></label>
                <input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 60" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">
                Gmeet URL <span className="text-red-500">*</span>
              </label>
              <input type="url" value={formData.liveLink} onChange={(e) => setFormData({ ...formData, liveLink: e.target.value })}
                placeholder="https://meet.google.com/xxx-xxxx-xxx" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3} placeholder="Enter meeting description..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Invite Staff <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {staffList.length === 0 ? (
                  <span className="text-xs text-gray-400">No staff available</span>
                ) : (
                  staffList.map((s) => (
                    <button key={s.id} type="button" onClick={() => toggleStaff(s.id)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        formData.invitedStaff.includes(s.id)
                          ? "bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]"
                          : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}>
                      {s.name} ({s.staff_id})
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => { setShowAddModal(false); setEditingId(null) }}
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
              if (!meeting || !meeting.invitedStaff || meeting.invitedStaff.length === 0) {
                return <p className="text-sm text-gray-400 text-center py-6">No staff invited</p>
              }
              return (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">#</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">Staff Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meeting.invitedStaff.map((s, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{s.staffName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {showHelpModal && (
        <ModalOverlay onClose={() => setShowHelpModal(false)}>
          <ModalHeader title="How to get Gmeet URL?" onClose={() => setShowHelpModal(false)} />
          <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto text-sm text-gray-700 leading-relaxed">
            <p>
              To get <strong>Gmeet URL</strong>, firstly you have to login to your gmail account. If you are not logged
              into gmail, click on the sign in button. Then go to{" "}
              <a href="https://meet.google.com/" target="_blank" rel="noopener noreferrer"
                className="text-[var(--primary)] underline inline-flex items-center gap-1">
                meet.google.com <ExternalLink className="h-3 w-3" />
              </a>{" "}
              then click on <strong>New meeting</strong> button and then select{" "}
              <strong>Get a meeting link to share</strong> link on selecting this link it will open a modal from here
              you will get Gmeet URL, just copy this Gmeet URL and paste it in Smart School Gmeet URL field.
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Step 1: Go to meet.google.com and click "New meeting"</p>
                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center text-gray-400 text-xs">
                  <img src="https://smart-school.in/assets/article-media/gmeet-meeting-url1.png" alt="Gmeet URL step 1"
                    className="max-w-full h-auto rounded border border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Step 2: Select "Get a meeting link to share"</p>
                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center text-gray-400 text-xs">
                  <img src="https://smart-school.in/assets/article-media/gmeet-meeting-url2.png" alt="Gmeet URL step 2"
                    className="max-w-full h-auto rounded border border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Step 3: Copy the meeting link</p>
                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center text-gray-400 text-xs">
                  <img src="https://smart-school.in/assets/article-media/gmeet-meeting-url3.png" alt="Gmeet URL step 3"
                    className="max-w-full h-auto rounded border border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <strong>Tip:</strong> You can also visit{" "}
              <a href="https://smart-school.in/article/how-to-get-gmeet-url" target="_blank" rel="noopener noreferrer"
                className="underline">the full article</a> for more details.
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setShowHelpModal(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">Close</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
