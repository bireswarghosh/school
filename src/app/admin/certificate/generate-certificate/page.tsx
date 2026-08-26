"use client"

import { useState } from "react"
import { Save, Edit3, Trash2, Eye, X } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Template = {
  id: number
  name: string
  content: string
  leftLogoUrl: string
  rightLogoUrl: string
  signature: string
  createdDate: string
}

const placeholderSample = { "{{student_name}}": "John Doe", "{{class}}": "Class 5", "{{date}}": "07/02/2026", "{{sports_event}}": "Annual Sports Day", "{{position}}": "First" }

export default function GenerateCertificatePage() {
  const { data: templates, add, update, remove } = useApi<Template>("/api/certificate/student")
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [leftLogoUrl, setLeftLogoUrl] = useState("")
  const [rightLogoUrl, setRightLogoUrl] = useState("")
  const [signature, setSignature] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [previewId, setPreviewId] = useState<number | null>(null)

  const handleSave = async () => {
    if (!name.trim()) return
    if (editingId) {
      await update(editingId, { name, content, leftLogoUrl, rightLogoUrl, signature } as Template)
      setEditingId(null)
    } else {
      await add({ name, content, leftLogoUrl, rightLogoUrl, signature, createdDate: new Date().toLocaleDateString("en-US") })
    }
    setName("")
    setContent("")
    setLeftLogoUrl("")
    setRightLogoUrl("")
    setSignature("")
  }

  const handleEdit = (t: Template) => {
    setEditingId(t.id)
    setName(t.name)
    setContent(t.content)
    setLeftLogoUrl(t.leftLogoUrl)
    setRightLogoUrl(t.rightLogoUrl)
    setSignature(t.signature)
  }

  const handleDelete = async (id: number) => {
    await remove(id)
  }

  const renderPreview = (content: string) => {
    let preview = content
    for (const [key, val] of Object.entries(placeholderSample)) {
      preview = preview.split(key).join(val)
    }
    return preview
  }

  const previewTemplate = previewId ? templates.find((t) => t.id === previewId) : null

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Generate Certificate</h1>
        <p className="mt-1 text-sm text-white/80">Certificate / Generate Certificate</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">{editingId ? "Edit Template" : "Create Certificate Template"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Template Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Left Logo URL</label>
            <input type="text" value={leftLogoUrl} onChange={(e) => setLeftLogoUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Right Logo URL</label>
            <input type="text" value={rightLogoUrl} onChange={(e) => setRightLogoUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Signature</label>
            <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
            <p className="text-xs text-gray-400 mb-1">Use placeholders: {`{{student_name}}`}, {`{{class}}`}, {`{{date}}`}, etc.</p>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleSave} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Save className="h-4 w-4" />Save</button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Certificate Templates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Template Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Created Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Action</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t, idx) => (
                <tr key={t.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-gray-50 border-b border-gray-100`}>
                  <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700">{t.name}</td>
                  <td className="px-4 py-3 text-gray-700">{t.createdDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      <button onClick={() => setPreviewId(t.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Preview"><Eye className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No templates created yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Preview: {previewTemplate.name}</h3>
              <button onClick={() => setPreviewId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {renderPreview(previewTemplate.content)}
            </div>
            <p className="text-xs text-gray-400 mt-2">Note: Placeholders are shown with sample values for preview.</p>
            <div className="flex justify-end mt-4">
              <button onClick={() => setPreviewId(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
