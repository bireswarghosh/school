"use client"

import { useState } from "react"
import { Plus, Edit3, Trash2, X, Search, Bell, Filter } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface Notice {
  id: number
  title: string
  noticeDate: string
  publishDate: string
  message: string
  sendEmail: boolean
  sendSms: boolean
}

export default function NoticeBoardPage() {
  const { data: notices, add, update, remove } = useApi<Notice>("/api/communicate/notice")
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const emptyForm: Notice = { id: 0, title: "", noticeDate: "", publishDate: "", message: "", sendEmail: false, sendSms: false }
  const [form, setForm] = useState<Notice>(emptyForm)

  const openAddModal = () => {
    setEditingNotice(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEditModal = (notice: Notice) => {
    setEditingNotice(notice)
    setForm({ ...notice })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingNotice(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    if (editingNotice) {
      await update(editingNotice.id, form)
    } else {
      await add(form)
    }
    closeModal()
  }

  const handleDelete = async (id: number) => {
    await remove(id)
  }

  const filteredNotices = notices.filter(n => {
    if (dateFrom && n.publishDate < dateFrom) return false
    if (dateTo && n.publishDate > dateTo) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Notice Board</h1>
            <p className="text-blue-100 text-sm">Manage school notices and announcements</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
          </div>
          <button onClick={() => { setDateFrom(""); setDateTo("") }} className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-all">Clear</button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">All Notices</h2>
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md">
            <Plus className="w-4 h-4" /> Add Notice
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Notice Date</th>
                <th className="text-left p-3">Publish Date</th>
                <th className="text-left p-3">Message</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotices.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-6 text-gray-400">No notices found.</td></tr>
              ) : filteredNotices.map((notice, i) => (
                <tr key={notice.id} className={`border-t border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                  <td className="p-3 text-gray-500">{notice.id}</td>
                  <td className="p-3 font-medium text-gray-800">{notice.title}</td>
                  <td className="p-3 text-gray-600">{notice.noticeDate}</td>
                  <td className="p-3 text-gray-600">{notice.publishDate}</td>
                  <td className="p-3 text-gray-600 max-w-xs truncate">{notice.message}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEditModal(notice)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(notice.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
              <h3 className="text-xl font-bold text-gray-800">{editingNotice ? "Edit Notice" : "Add Notice"}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Notice title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notice Date</label>
                  <input type="date" value={form.noticeDate} onChange={e => setForm({ ...form, noticeDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                  <input type="date" value={form.publishDate} onChange={e => setForm({ ...form, publishDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" placeholder="Write notice message..." />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.sendEmail} onChange={e => setForm({ ...form, sendEmail: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Send Email
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.sendSms} onChange={e => setForm({ ...form, sendSms: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Send SMS
                </label>
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
