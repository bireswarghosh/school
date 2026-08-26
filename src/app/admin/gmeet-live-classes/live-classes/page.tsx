"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Play, Trash2, X, Check, HelpCircle, ExternalLink } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface SectionInfo {
  classId: number
  className: string
  sectionId: number
  sectionName: string
}

interface LiveClass {
  id: number
  title: string
  description: string
  date: string
  duration: number
  roleId: number
  staffId: number
  classId: number
  liveLink: string
  platform: string
  status: string
  sections: SectionInfo[]
}

interface ClassItem {
  id: number
  name: string
}

interface SectionItem {
  id: number
  classId: number
  name: string
}

interface StaffItem {
  id: number
  staffId: string
  name: string
  role: string
}

const ROLES = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Teacher" },
  { id: 3, name: "Accountant" },
  { id: 4, name: "Librarian" },
  { id: 6, name: "Receptionist" },
]

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-3xl mx-4">
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

export default function LiveClassesPage() {
  const { data: liveClassList, add, update, remove, loading } = useApi<LiveClass>("/api/live-class")
  const { data: classList } = useApi<ClassItem>("/api/academics/class")
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" })

  const [sections, setSections] = useState<SectionItem[]>([])
  const [staffList, setStaffList] = useState<StaffItem[]>([])

  const [formData, setFormData] = useState({
    title: "", date: "", duration: "", roleId: "", staffId: "", classId: "", sectionIds: [] as string[], liveLink: "", description: "",
  })

  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const showToast = (message: string) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: "" }), 3000)
  }

  const fetchSections = useCallback(async (classId: string) => {
    if (!classId) { setSections([]); return }
    try {
      const res = await fetch(`/api/academics/section?class_id=${classId}`)
      const data = await res.json()
      setSections(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, classId: s.class_id, name: s.name })) : [])
    } catch { setSections([]) }
  }, [])

  const fetchStaff = useCallback(async (role: string) => {
    if (!role) { setStaffList([]); return }
    try {
      const res = await fetch(`/api/staff?role=${encodeURIComponent(role)}`)
      const data = await res.json()
      setStaffList(Array.isArray(data) ? data : [])
    } catch { setStaffList([]) }
  }, [])

  useEffect(() => { fetchSections(formData.classId) }, [formData.classId, fetchSections])

  useEffect(() => {
    const roleName = ROLES.find((r) => r.id.toString() === formData.roleId)?.name || ""
    fetchStaff(roleName)
  }, [formData.roleId, fetchStaff])

  const handleSave = async () => {
    const payload: any = {
      title: formData.title,
      date: formData.date,
      duration: parseInt(formData.duration) || 0,
      roleId: parseInt(formData.roleId) || null,
      staffId: parseInt(formData.staffId) || null,
      classId: parseInt(formData.classId) || null,
      liveLink: formData.liveLink,
      description: formData.description,
      status: "Awaited",
      sectionIds: formData.sectionIds.map((s) => parseInt(s)),
    }
    await add(payload)
    setShowAddModal(false)
    setFormData({ title: "", date: "", duration: "", roleId: "", staffId: "", classId: "", sectionIds: [], liveLink: "", description: "" })
    showToast("Live class created successfully!")
  }

  const handleDelete = async (id: number) => {
    await remove(id)
    setDeleteConfirmId(null)
    showToast("Live class deleted successfully!")
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdatingStatus(id)
    try {
      await update(id, { status: newStatus } as any)
    } catch {}
    setUpdatingStatus(null)
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
          <h2 className="text-2xl font-bold text-gray-800">Live Classes</h2>
          <p className="text-sm text-gray-500 mt-1">Gmeet Live Classes / Live Classes</p>
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
                {["#", "Class Title", "Date Time", "Class Duration (Minutes)", "Created By", "Created For", "Class", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(liveClassList || []).length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No live classes found. Click &quot;Add&quot; to create one.</td></tr>
              ) : (
                (liveClassList || []).map((c, idx) => (
                  <tr key={c.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)] transition-colors`}>
                    <td className="px-4 py-2.5 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-800">{c.title}</p>
                      {c.description && <p className="text-xs text-gray-400 truncate max-w-[220px]">{c.description}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDate(c.date)}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{c.duration}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">Admin</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">Staff #{c.staffId || "-"}</td>
                    <td className="px-4 py-2.5">
                      {(c.sections || []).length > 0 ? (
                        <ul className="list-none space-y-0.5">
                          {(c.sections || []).map((sec, si) => (
                            <li key={si} className="text-xs text-gray-600">
                              <i className="inline-block w-3 h-3 mr-1 text-green-600">&#10003;</i>
                              {sec.className} ({sec.sectionName})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={c.status || "Awaited"}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        disabled={updatingStatus === c.id}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      >
                        <option value="Awaited">Awaited</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Finished">Finished</option>
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {c.liveLink && (
                          <a href={c.liveLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors">
                            <Play className="h-3 w-3" /> Start
                          </a>
                        )}
                        <button onClick={() => setDeleteConfirmId(c.id)}
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
        <ModalOverlay onClose={() => setShowAddModal(false)}>
          <ModalHeader title="Add Live Class" onClose={() => setShowAddModal(false)} />
          <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Class Title <span className="text-red-500">*</span></label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Extra Practice Class" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Class Date <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Class Duration (Minutes) <span className="text-red-500">*</span></label>
                <input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 45" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Role <span className="text-red-500">*</span></label>
                <select value={formData.roleId} onChange={(e) => { setFormData({ ...formData, roleId: e.target.value, staffId: "" }) }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select</option>
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Staff <span className="text-red-500">*</span></label>
                <select value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select</option>
                  {staffList.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.staffId})</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Class <span className="text-red-500">*</span></label>
                <select value={formData.classId} onChange={(e) => { setFormData({ ...formData, classId: e.target.value, sectionIds: [] }) }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="">Select</option>
                  {classList.map((c) => <option key={c.id} value={c.id}>{c.name || `Class ${c.id}`}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Section <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {sections.length === 0 ? (
                    <span className="text-xs text-gray-400">Select a class first</span>
                  ) : (
                    sections.map((sec) => {
                      const val = `${formData.classId}-${sec.id}`
                      const selected = formData.sectionIds.includes(val)
                      return (
                        <button key={sec.id} type="button" onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            sectionIds: selected
                              ? prev.sectionIds.filter((s) => s !== val)
                              : [...prev.sectionIds, val],
                          }))
                        }}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            selected
                              ? "bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]"
                              : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                          }`}>
                          {sec.name}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">
                Gmeet URL <span className="text-red-500">*</span>
                <a href="https://smart-school.in/article/how-to-get-gmeet-url" target="_blank" rel="noopener noreferrer"
                  className="ml-1 text-[var(--primary)] underline text-xs">(How To Get Gmeet URL?)</a>
              </label>
              <input type="url" value={formData.liveLink} onChange={(e) => setFormData({ ...formData, liveLink: e.target.value })}
                placeholder="https://meet.google.com/xxx-xxxx-xxx" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
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
