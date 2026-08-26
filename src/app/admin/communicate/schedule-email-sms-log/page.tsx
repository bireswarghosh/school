"use client"

import { useState } from "react"
import { Search, Edit3, Trash2, X, Calendar, Clock, Mail, MessageSquare, CheckCircle, XCircle, Filter, Hourglass } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface ScheduledItem {
  id: number
  type: "Email" | "SMS"
  recipient: string
  subjectOrMessage: string
  scheduledDate: string
  status: "Scheduled" | "Sent" | "Failed"
}

export default function ScheduleEmailSmsLogPage() {
  const { data: items, add, update, remove } = useApi<ScheduledItem>("/api/communicate/scheduled")
  const [filterType, setFilterType] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ScheduledItem | null>(null)

  const emptyForm: ScheduledItem = { id: 0, type: "Email", recipient: "", subjectOrMessage: "", scheduledDate: "", status: "Scheduled" }
  const [form, setForm] = useState<ScheduledItem>(emptyForm)

  const openEditModal = (item: ScheduledItem) => {
    setEditingItem(item)
    setForm({ ...item })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    if (editingItem) {
      await update(editingItem.id, form)
    } else {
      await add(form)
    }
    closeModal()
  }

  const handleDelete = async (id: number) => {
    await remove(id)
  }

  const filteredItems = items.filter(item => {
    if (filterType !== "All" && item.type !== filterType) return false
    if (filterStatus !== "All" && item.status !== filterStatus) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Scheduled Email/SMS Log</h1>
            <p className="text-blue-100 text-sm">Manage scheduled communications</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2"><Filter className="w-5 h-5 text-gray-500" /></div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-sm">
              <option>All</option>
              <option>Email</option>
              <option>SMS</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-sm">
              <option>All</option>
              <option>Scheduled</option>
              <option>Sent</option>
              <option>Failed</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md text-sm">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Scheduled Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Recipient</th>
                <th className="text-left p-3">Subject/Message</th>
                <th className="text-left p-3">Scheduled Date</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-400">No scheduled items found.</td></tr>
              ) : filteredItems.map((item, i) => (
                <tr key={item.id} className={`border-t border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                  <td className="p-3 text-gray-500">{item.id}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === "Email" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>
                      {item.type === "Email" ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                      {item.type}
                    </span>
                  </td>
                  <td className="p-3 text-gray-800 max-w-[150px] truncate">{item.recipient}</td>
                  <td className="p-3 text-gray-600 max-w-[200px] truncate">{item.subjectOrMessage}</td>
                  <td className="p-3 text-gray-600">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-400" />{item.scheduledDate}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === "Scheduled" ? "bg-yellow-100 text-yellow-700" :
                      item.status === "Sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {item.status === "Scheduled" ? <Hourglass className="w-3 h-3" /> :
                       item.status === "Sent" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">{editingItem ? "Edit Scheduled Item" : "Add Scheduled Item"}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as "Email" | "SMS" })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white">
                  <option>Email</option>
                  <option>SMS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                <input type="text" value={form.recipient} onChange={e => setForm({ ...form, recipient: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Recipient(s)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject / Message</label>
                <textarea value={form.subjectOrMessage} onChange={e => setForm({ ...form, subjectOrMessage: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" placeholder="Subject or message content" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                <input type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as "Scheduled" | "Sent" | "Failed" })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white">
                  <option>Scheduled</option>
                  <option>Sent</option>
                  <option>Failed</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
