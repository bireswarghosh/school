"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useMemo, useRef } from "react"
import { Plus, Pencil, Trash2, X, Save, Check, Search, Download, Upload, Printer, ChevronLeft, ChevronRight } from "lucide-react"
import { useApi } from "@/lib/use-api"

type CustomField = {
  id: number
  fieldName: string
  fieldType: string
  module: string
  belongsTo: string
  required: boolean
  options: string
}

const fieldTypes = ["Text", "Textarea", "Select", "Checkbox", "Date", "Number"]
const moduleOptions = ["Student", "Staff", "Alumni"]
const belongsToOptions = ["Basic Info", "Address", "Academic"]

const emptyForm = { fieldName: "", fieldType: "Text", module: "Student", belongsTo: "Basic Info", required: false, options: "" }

export default function CustomFieldsPanel() {
  const { data: fields, add, update, remove, loading } = useApi<CustomField>("/api/system-setting/custom-field")
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [editing, setEditing] = useState<CustomField | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItem, setDeleteItem] = useState<CustomField | null>(null)
  const [success, setSuccess] = useState("")
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const filtered = useMemo(() => {
    if (!keyword.trim()) return fields
    const kw = keyword.toLowerCase()
    return fields.filter((f) =>
      f.fieldName.toLowerCase().includes(kw) ||
      f.fieldType.toLowerCase().includes(kw) ||
      f.module.toLowerCase().includes(kw)
    )
  }, [fields, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleAdd = async () => {
    if (!form.fieldName.trim()) return
    await add({
      fieldName: form.fieldName.trim(),
      fieldType: form.fieldType,
      module: form.module,
      belongsTo: form.belongsTo,
      required: form.required,
      options: form.options,
    })
    setForm({ ...emptyForm })
    showSuccess("Custom field added successfully!")
  }

  const handleEditOpen = (f: CustomField) => {
    setEditing(f)
    setForm({
      fieldName: f.fieldName,
      fieldType: f.fieldType,
      module: f.module,
      belongsTo: f.belongsTo,
      required: f.required,
      options: f.options,
    })
    setShowModal(true)
  }

  const handleEditSave = async () => {
    if (!editing || !form.fieldName.trim()) return
    await update(editing.id, {
      fieldName: form.fieldName.trim(),
      fieldType: form.fieldType,
      module: form.module,
      belongsTo: form.belongsTo,
      required: form.required,
      options: form.options,
    })
    setShowModal(false)
    setEditing(null)
    setForm({ ...emptyForm })
    showSuccess("Custom field updated successfully!")
  }

  const handleDelete = (f: CustomField) => {
    setDeleteItem(f)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteItem) return
    await remove(deleteItem.id)
    showSuccess("Custom field deleted successfully!")
    setShowDeleteModal(false)
    setDeleteItem(null)
  }

  const clearForm = () => {
    setForm({ ...emptyForm })
    setEditing(null)
  }

  const Modal = ({ title, show, onClose, children, footer }: {
    title: string; show: boolean; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode
  }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer && (
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }

  const paginationPages = useMemo(() => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages }
    pages.push(1)
    if (page > 3) pages.push("...")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push("...")
    pages.push(totalPages)
    return pages
  }, [totalPages, page])

  const exportCSV = () => {
    const header = '"#","Field Name","Type","Module","Belongs To","Required","Options"'
    const rows = filtered.map((f, idx) =>
      `"${idx + 1}","${f.fieldName}","${f.fieldType}","${f.module}","${f.belongsTo}","${f.required ? "Required" : "Optional"}","${(f.options || "").replace(/"/g, '""')}"`
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "custom_fields.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    const header = "<tr><th>#</th><th>Field Name</th><th>Type</th><th>Module</th><th>Belongs To</th><th>Required</th><th>Options</th></tr>"
    const rows = filtered.map((f, idx) =>
      `<tr><td>${idx + 1}</td><td>${f.fieldName}</td><td>${f.fieldType}</td><td>${f.module}</td><td>${f.belongsTo}</td><td>${f.required ? "Required" : "Optional"}</td><td>${f.options || ""}</td></tr>`
    ).join("")
    const html = `<html><head><meta charset="utf-8"><title>Custom Fields</title></head><body><table>${header}${rows}</table></body></html>`
    const blob = new Blob([html], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "custom_fields.xls"; a.click()
    URL.revokeObjectURL(url)
  }

  const printTable = () => window.print()

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) { notify.error("CSV must have a header row and at least one data row"); return }
    let count = 0
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      if (!vals[1]) continue
      try {
        await add({ fieldName: vals[1], fieldType: vals[2] || "Text", module: vals[3] || "Student", belongsTo: vals[4] || "Basic Info", required: vals[5]?.toLowerCase() === "required", options: vals[6] || "" })
        count++
      } catch { }
    }
    notify.success(`Imported ${count} records successfully`)
    if (fileRef.current) fileRef.current.value = ""
  }

  const FormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Field Name <span className="text-red-400">*</span></label>
        <input type="text" value={form.fieldName} onChange={(e) => setForm({ ...form, fieldName: e.target.value })}
          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          placeholder="Enter field name" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Field Type</label>
        <select value={form.fieldType} onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
          {fieldTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Module</label>
        <select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}
          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
          {moduleOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Belongs To</label>
        <select value={form.belongsTo} onChange={(e) => setForm({ ...form, belongsTo: e.target.value })}
          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
          {belongsToOptions.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.required} onChange={(e) => setForm({ ...form, required: e.target.checked })}
          className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
        <span className="text-sm text-gray-700">Required</span>
      </label>
      {form.fieldType === "Select" && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Options (comma separated)</label>
          <textarea value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })}
            rows={3} placeholder="Option1,Option2,Option3"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Custom Fields</h2>
          <p className="text-xs text-gray-500 mt-0.5">System Setting / Custom Fields</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" onChange={importCSV} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <div className="relative group">
            <button className="flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <button onClick={exportCSV} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-t-lg">CSV</button>
              <button onClick={exportExcel} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">Excel</button>
              <button onClick={printTable} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-b-lg">PDF</button>
            </div>
          </div>
          <button onClick={printTable} className="flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-2.5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-indigo-500" />
            Search
          </h3>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
                placeholder="Search by field name, type or module..."
                className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <button type="button" onClick={() => { setKeyword(""); setPage(1) }}
              className="h-9 px-3 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Reset</button>
          </div>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Add Custom Field</h3>
            </div>
            <div className="p-5">
              {FormFields()}
              <button onClick={handleAdd}
                className="mt-5 w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">
                <Save className="h-3.5 w-3.5" /> Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Custom Field List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                    {["#", "Field Name", "Type", "Module", "Belongs To", "Required", "Options", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 text-gray-300" />
                          <span className="text-sm">No custom fields found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((f, idx) => (
                      <tr key={f.id} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{(page - 1) * rowsPerPage + idx + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{f.fieldName}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                            {f.fieldType}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            {f.module}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{f.belongsTo}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${f.required ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                            {f.required ? "Required" : "Optional"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[150px] truncate" title={f.options}>
                          {f.options || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => handleEditOpen(f)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(f)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
                  className="border border-gray-300 rounded px-2 py-1 text-xs bg-white">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries</span>
              </div>
              <span>Showing {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} records</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                    className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  {paginationPages.map((p, i) =>
                    typeof p === "string"
                      ? <span key={`e${i}`} className="px-1 text-xs text-gray-400">...</span>
                      : <button key={p} onClick={() => setPage(p)}
                        className={`min-w-[28px] h-7 text-xs font-medium rounded-lg transition-colors ${page === p ? "bg-[var(--primary)] text-white" : "text-gray-600 hover:bg-gray-50 border border-transparent"}`}>
                        {p}
                      </button>
                  )}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .overflow-x-auto, .overflow-x-auto * { visibility: visible; }
          .overflow-x-auto { position: absolute; left: 0; top: 0; width: 100%; }
          .space-y-5 > *:not(:last-child) { display: none; }
          th, td { padding: 6px 8px !important; font-size: 10px !important; }
        }
      `}</style>

      <Modal title="Edit Custom Field" show={showModal} onClose={() => { setShowModal(false); clearForm() }}
        footer={
          <>
            <button onClick={() => { setShowModal(false); clearForm() }}
              className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleEditSave}
              className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200 flex items-center gap-1.5">
              <Save className="h-3.5 w-3.5" /> Save
            </button>
          </>
        }>
        {FormFields()}
      </Modal>

      <Modal title="Confirm Delete" show={showDeleteModal} onClose={() => setShowDeleteModal(false)}
        footer={
          <>
            <button onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={confirmDelete}
              className="px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200">Delete</button>
          </>
        }>
        <div className="text-center py-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete this custom field?</p>
          {deleteItem && <p className="text-sm font-semibold text-gray-800">{deleteItem.fieldName}</p>}
        </div>
      </Modal>
    </>
  )
}