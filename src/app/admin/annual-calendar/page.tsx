"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Search, Save, Calendar, Filter } from "lucide-react"
import { useApi } from "@/lib/use-api"

type EventType = "Holiday" | "Exam" | "Event" | "Meeting" | "Activity"

type CalendarEvent = {
  id: number
  title: string
  eventType: EventType
  fromDate: string
  toDate: string
  description: string
  isHoliday: boolean
}

const eventTypes: EventType[] = ["Holiday", "Exam", "Event", "Meeting", "Activity"]

const typeBadgeColors: Record<EventType, string> = {
  Holiday: "bg-blue-100 text-blue-700",
  Exam: "bg-red-100 text-red-700",
  Event: "bg-emerald-100 text-emerald-700",
  Meeting: "bg-amber-100 text-amber-700",
  Activity: "bg-purple-100 text-purple-700",
}



function getDuration(from: string, to: string): number {
  const d1 = new Date(from)
  const d2 = new Date(to)
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export default function AnnualCalendarPage() {
  const { data: events, add, update, remove } = useApi<CalendarEvent>("/api/annual-calendar/event")
  const [filterType, setFilterType] = useState<string>("All")
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
  const [searchPerformed, setSearchPerformed] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [form, setForm] = useState({ title: "", eventType: "" as EventType | "", fromDate: "", toDate: "", description: "", isHoliday: false })
  const [editForm, setEditForm] = useState({ id: 0, title: "", eventType: "" as EventType | "", fromDate: "", toDate: "", description: "", isHoliday: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e as React.ChangeEvent<HTMLInputElement>).target.checked : undefined
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e as React.ChangeEvent<HTMLInputElement>).target.checked : undefined
    setEditForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    if (editErrors[name]) setEditErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const searchFiltered = events.filter((ev) => {
    if (filterType !== "All" && ev.eventType !== filterType) return false
    if (filterFrom && ev.fromDate < filterFrom) return false
    if (filterTo && ev.toDate > filterTo) return false
    return true
  })

  const displayed = searchPerformed ? searchFiltered : events

  const totalEvents = events.length
  const totalHolidays = events.filter((e) => e.eventType === "Holiday").length
  const totalExams = events.filter((e) => e.eventType === "Exam").length
  const totalMeetings = events.filter((e) => e.eventType === "Meeting").length

  const validateForm = (data: typeof form) => {
    const errs: Record<string, string> = {}
    if (!data.title.trim()) errs.title = "Title is required"
    if (!data.eventType) errs.eventType = "Event type is required"
    if (!data.fromDate) errs.fromDate = "From date is required"
    if (!data.toDate) errs.toDate = "To date is required"
    if (data.fromDate && data.toDate && data.fromDate > data.toDate) errs.toDate = "To date must be after from date"
    return errs
  }

  const handleAdd = async () => {
    const errs = validateForm(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    await add({ title: form.title.trim(), eventType: form.eventType as EventType, fromDate: form.fromDate, toDate: form.toDate, description: form.description.trim(), isHoliday: form.isHoliday })
    setShowAddModal(false)
    setForm({ title: "", eventType: "", fromDate: "", toDate: "", description: "", isHoliday: false })
  }

  const handleEditOpen = (ev: CalendarEvent) => {
    setEditForm({ id: ev.id, title: ev.title, eventType: ev.eventType, fromDate: ev.fromDate, toDate: ev.toDate, description: ev.description, isHoliday: ev.isHoliday })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs = validateForm(editForm)
    setEditErrors(errs)
    if (Object.keys(errs).length) return
    await update(editForm.id, { title: editForm.title.trim(), eventType: editForm.eventType as EventType, fromDate: editForm.fromDate, toDate: editForm.toDate, description: editForm.description.trim(), isHoliday: editForm.isHoliday })
    setShowEditModal(false)
  }

  const handleDeleteOpen = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }
  const confirmDelete = async () => {
    if (deleteId === null) return
    await remove(deleteId)
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const getEvent = (id: number) => events.find((e) => e.id === id)

  const summaryCards = [
    { label: "Total Events", count: totalEvents, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Holidays", count: totalHolidays, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Exams", count: totalExams, color: "bg-red-50 text-red-700 border-red-200" },
    { label: "Meetings", count: totalMeetings, color: "bg-amber-50 text-amber-700 border-amber-200" },
  ]

  const Modal = ({ title, show, onClose, children }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full mx-4 max-w-lg">
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
          <h2 className="text-xl font-bold text-white">Annual Calendar / Events</h2>
          <p className="text-sm text-white/80 mt-0.5">Calendar / Annual Calendar</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Select Criteria</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Event Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="All">All</option>
                {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date</label>
              <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date</label>
              <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="flex items-end">
              <button onClick={() => setSearchPerformed(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                <Search className="h-4 w-4" /> Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-xl border ${card.color} px-4 py-3`}>
            <p className="text-xs font-medium opacity-80">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-700">
            {searchPerformed ? "Search Results" : "Events List"}
            <span className="ml-2 text-xs font-normal text-gray-400">({displayed.length} records)</span>
          </h3>
          <button onClick={() => { setForm({ title: "", eventType: "", fromDate: "", toDate: "", description: "", isHoliday: false }); setErrors({}); setShowAddModal(true) }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
            <Plus className="h-4 w-4" /> Add Event
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Title", "Event Type", "From Date", "To Date", "Duration", "Description", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No events found</td></tr>
              ) : (
                displayed.map((ev, idx) => (
                  <tr key={ev.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{ev.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadgeColors[ev.eventType]}`}>
                        {ev.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ev.fromDate}</td>
                    <td className="px-4 py-3 text-gray-600">{ev.toDate}</td>
                    <td className="px-4 py-3 text-gray-600">{getDuration(ev.fromDate, ev.toDate)} days</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{ev.description || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditOpen(ev)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteOpen(ev.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>Showing {displayed.length} of {events.length} records</span>
        </div>
      </div>

      <Modal title="Add Event" show={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Title <span className="text-red-500">*</span></label>
            <input type="text" name="title" value={form.title} onChange={handleFormChange} placeholder="Enter event title"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Event Type <span className="text-red-500">*</span></label>
              <select name="eventType" value={form.eventType} onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.eventType && <p className="text-red-500 text-xs mt-1">{errors.eventType}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Is Holiday</label>
              <div className="flex items-center h-[38px]">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" name="isHoliday" checked={form.isHoliday} onChange={handleFormChange}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                  Mark as Holiday
                </label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date <span className="text-red-500">*</span></label>
              <input type="date" name="fromDate" value={form.fromDate} onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.fromDate && <p className="text-red-500 text-xs mt-1">{errors.fromDate}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date <span className="text-red-500">*</span></label>
              <input type="date" name="toDate" value={form.toDate} onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.toDate && <p className="text-red-500 text-xs mt-1">{errors.toDate}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Description</label>
            <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Enter description" rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <Modal title="Edit Event" show={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Title <span className="text-red-500">*</span></label>
            <input type="text" name="title" value={editForm.title} onChange={handleEditFormChange} placeholder="Enter event title"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            {editErrors.title && <p className="text-red-500 text-xs mt-1">{editErrors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Event Type <span className="text-red-500">*</span></label>
              <select name="eventType" value={editForm.eventType} onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {editErrors.eventType && <p className="text-red-500 text-xs mt-1">{editErrors.eventType}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Is Holiday</label>
              <div className="flex items-center h-[38px]">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" name="isHoliday" checked={editForm.isHoliday} onChange={handleEditFormChange}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                  Mark as Holiday
                </label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date <span className="text-red-500">*</span></label>
              <input type="date" name="fromDate" value={editForm.fromDate} onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {editErrors.fromDate && <p className="text-red-500 text-xs mt-1">{editErrors.fromDate}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date <span className="text-red-500">*</span></label>
              <input type="date" name="toDate" value={editForm.toDate} onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {editErrors.toDate && <p className="text-red-500 text-xs mt-1">{editErrors.toDate}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Description</label>
            <textarea name="description" value={editForm.description} onChange={handleEditFormChange} placeholder="Enter description" rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleEditSave} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Are you sure you want to delete this event?
                {deleteId && <strong className="block mt-1 text-gray-800">{getEvent(deleteId)?.title}</strong>}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
