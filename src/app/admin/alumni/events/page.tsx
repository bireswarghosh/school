"use client"

import { useState, useMemo } from "react"
import { Plus, Edit3, Trash2, X, Search } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Event = {
  id: number
  title: string
  date: string
  time: string
  venue: string
  description: string
  status: "Upcoming" | "Completed" | "Cancelled"
}

type EventForm = {
  title: string
  date: string
  time: string
  venue: string
  description: string
  status: "Upcoming" | "Completed" | "Cancelled"
}

const emptyForm: EventForm = { title: "", date: "", time: "", venue: "", description: "", status: "Upcoming" }

export default function AlumniEventsPage() {
  const { data: events, add, update, remove, loading } = useApi<Event>("/api/alumni/event")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [filterStatus, setFilterStatus] = useState("")

  const filteredEvents = useMemo(() => {
    if (!filterStatus) return events
    return events.filter((e) => e.status === filterStatus)
  }, [events, filterStatus])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (e: Event) => {
    setEditingId(e.id)
    setForm({ title: e.title, date: e.date, time: e.time, venue: e.venue, description: e.description, status: e.status })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (editingId) {
      await update(editingId, form)
    } else {
      await add(form)
    }
    setShowModal(false)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      await remove(id)
    }
  }

  const statusBadge = (s: Event["status"]) => {
    switch (s) {
      case "Upcoming": return "bg-blue-100 text-blue-700"
      case "Completed": return "bg-green-100 text-green-700"
      case "Cancelled": return "bg-red-100 text-red-700"
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Alumni Events</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Events</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All Statuses</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Search className="h-4 w-4" /> Search</button>
          </div>
          <button onClick={openAdd} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Plus className="h-4 w-4" /> Add Event</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Event Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Event Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Venue</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Description</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((e, idx) => (
                <tr key={e.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{e.title}</td>
                  <td className="px-4 py-3 text-gray-600">{e.date}</td>
                  <td className="px-4 py-3 text-gray-600">{e.venue}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{e.description}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(e.status)}`}>{e.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(e)} className="text-amber-600 hover:text-amber-800"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No events found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-sm text-gray-500">Showing {filteredEvents.length} records</div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{editingId ? "Edit Event" : "Add Event"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventForm["status"] })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
