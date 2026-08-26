"use client"

import { useState } from "react"
import { Plus, Edit3, Trash2, X, MessageSquare } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface SmsTemplate {
  id: number
  title: string
  message: string
}

export default function SmsTemplatePage() {
  const { data: templates, add, update, remove } = useApi<SmsTemplate>("/api/communicate/sms-template")
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null)

  const emptyForm: SmsTemplate = { id: 0, title: "", message: "" }
  const [form, setForm] = useState<SmsTemplate>(emptyForm)

  const openAddModal = () => {
    setEditingTemplate(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEditModal = (tpl: SmsTemplate) => {
    setEditingTemplate(tpl)
    setForm({ ...tpl })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTemplate(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    if (!form.title || !form.message) return
    if (editingTemplate) {
      await update(editingTemplate.id, form)
    } else {
      await add(form)
    }
    closeModal()
  }

  const handleDelete = async (id: number) => {
    await remove(id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">SMS Templates</h1>
            <p className="text-blue-100 text-sm">Create and manage SMS templates</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{editingTemplate ? "Edit Template" : "Add New Template"}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Title</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Template title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" placeholder="SMS message content" />
              <p className="text-xs text-gray-400 mt-1">{form.message.length} / 160 characters</p>
            </div>
            <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md">Save Template</button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">All Templates</h2>
            <button onClick={openAddModal} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md text-sm">
              <Plus className="w-4 h-4" /> New
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Message</th>
                  <th className="text-center p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr><td colSpan={4} className="text-center p-6 text-gray-400">No templates.</td></tr>
                ) : templates.map((tpl, i) => (
                  <tr key={tpl.id} className={`border-t border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                    <td className="p-3 text-gray-500">{tpl.id}</td>
                    <td className="p-3 font-medium text-gray-800">{tpl.title}</td>
                    <td className="p-3 text-gray-600 max-w-[300px] truncate">{tpl.message}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEditModal(tpl)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(tpl.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">{editingTemplate ? "Edit SMS Template" : "Add SMS Template"}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" />
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
