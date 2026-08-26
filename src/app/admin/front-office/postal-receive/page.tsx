"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useRef, useEffect } from "react"
import { useApi } from "@/lib/use-api"
import { Search, Plus, Eye, Pencil, Trash2, X, Download, Upload, Printer, ChevronDown, FileText, Paperclip } from "lucide-react"

type Attachment = {
  name: string
  url: string
  size?: number
  type?: string
}

type PostalRecord = {
  id: number
  referenceNo: string
  date: string
  fromTitle: string
  toTitle: string
  address: string
  type: string
  description: string
  document: string
  note: string
  attachments: Attachment[]
}

const today = () => new Date().toISOString().split("T")[0]

const emptyForm = {
  referenceNo: "",
  date: today(),
  fromTitle: "",
  toTitle: "",
  address: "",
  type: "Official",
  description: "",
  document: "",
  note: "",
  attachments: [] as Attachment[],
}

const fmt = (d: string) => d ? d.split("T")[0] : ""

const colLabels: Record<string, string> = {
  referenceNo: "Reference No",
  date: "Date",
  fromTitle: "From Title",
  toTitle: "To Title",
  address: "Address",
  type: "Type",
  description: "Description",
  document: "Document",
  note: "Note",
}

const cols = Object.keys(colLabels)

function csvRow(row: Record<string, any>) {
  return cols.map((k) => `"${(row[k] ?? "").toString().replace(/"/g, '""')}"`).join(",")
}

export default function PostalReceivePage() {
  const { data: records, add, update, remove, loading } = useApi<PostalRecord>("/api/front-office/postal-receive")
  const fileRef = useRef<HTMLInputElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [viewId, setViewId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [filterFromDate, setFilterFromDate] = useState("")
  const [filterToDate, setFilterToDate] = useState("")
  const [filterType, setFilterType] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [uploading, setUploading] = useState(false)

  const filtered = records.filter((r) => {
    if (filterType && r.type !== filterType) return false
    if (filterFromDate && r.date < filterFromDate) return false
    if (filterToDate && r.date > filterToDate) return false
    return true
  })

  useEffect(() => { setPage(1) }, [filterFromDate, filterToDate, filterType, records.length])

  useEffect(() => {
    if (!showExportMenu) return
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showExportMenu])

  const totalPages = Math.ceil(filtered.length / rowsPerPage)
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validateForm = () => {
    const errs: Record<string, string> = {}
    if (!form.referenceNo.trim()) errs.referenceNo = "Reference No is required"
    if (!form.date.trim()) errs.date = "Date is required"
    if (!form.fromTitle.trim()) errs.fromTitle = "From Title is required"
    if (!form.toTitle.trim()) errs.toTitle = "To Title is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const parseAttachments = (value: unknown): Attachment[] => {
    if (Array.isArray(value)) return value
    if (typeof value === "string" && value) {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }

  const handleAttachFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const fd = new FormData()
      for (const f of files) fd.append("files", f)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...data.files] }))
    } catch (err: any) {
      notify.error(err.message)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const removeAttachment = (url: string) => {
    setForm((prev) => ({ ...prev, attachments: prev.attachments.filter((a) => a.url !== url) }))
  }

  const handleAdd = async () => {
    if (!validateForm()) return
    try {
      await add({
        referenceNo: form.referenceNo,
        date: form.date,
        fromTitle: form.fromTitle,
        toTitle: form.toTitle,
        address: form.address,
        type: form.type,
        description: form.description,
        document: form.attachments.map((a) => a.name).join(", ") || form.document,
        attachments: JSON.stringify(form.attachments),
        note: form.note,
      })
      setShowAddModal(false)
      setForm({ ...emptyForm })
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const handleEdit = (id: number) => {
    const record = records.find((r) => r.id === id)
    if (!record) return
    setEditId(id)
    setForm({
      referenceNo: record.referenceNo,
      date: fmt(record.date),
      fromTitle: record.fromTitle,
      toTitle: record.toTitle,
      address: record.address,
      type: record.type,
      description: record.description,
      document: record.document,
      attachments: Array.isArray(record.attachments) ? record.attachments : (typeof record.attachments === "string" && record.attachments ? JSON.parse(record.attachments) : []),
      note: record.note,
    })
    setErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!validateForm() || editId === null) return
    try {
      await update(editId, {
        referenceNo: form.referenceNo,
        date: form.date,
        fromTitle: form.fromTitle,
        toTitle: form.toTitle,
        address: form.address,
        type: form.type,
        description: form.description,
        document: form.attachments.map((a) => a.name).join(", ") || form.document,
        attachments: JSON.stringify(form.attachments),
        note: form.note,
      })
      setShowEditModal(false)
      setEditId(null)
      setForm({ ...emptyForm })
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const handleDelete = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (deleteId === null) return
    try {
      await remove(deleteId)
      setShowDeleteModal(false)
      setDeleteId(null)
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  /* ── Import ── */
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) return notify.error("CSV must have a header row and at least one data row")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
    const recordsList: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      if (vals.length < 2) continue
      const rec: any = { type: "Official" }
      headers.forEach((h, idx) => { rec[h] = vals[idx] || "" })
      if (rec.referenceNo || rec.fromTitle) recordsList.push(rec)
    }
    if (recordsList.length === 0) return notify.error("No valid records found in CSV")
    const res = await fetch("/api/front-office/postal-receive", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recordsList),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Import failed")
    }
    notify.success(`Imported ${recordsList.length} records successfully`)
    if (fileRef.current) fileRef.current.value = ""
  }

  /* ── Export ── */
  const exportCSV = () => {
    const csv = [csvRow(colLabels), ...filtered.map((r) => csvRow(r))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    downloadBlob(blob, "postal-receive.csv")
    setShowExportMenu(false)
  }

  const exportExcel = () => {
    let html = `<table>`
    html += `<tr>${cols.map((k) => `<th>${colLabels[k]}</th>`).join("")}</tr>`
    filtered.forEach((r: any) => {
      html += `<tr>${cols.map((k) => `<td>${(r[k] ?? "").toString().replace(/"/g, "&quot;")}</td>`).join("")}</tr>`
    })
    html += `</table>`
    const blob = new Blob([html], { type: "application/vnd.ms-excel" })
    downloadBlob(blob, "postal-receive.xls")
    setShowExportMenu(false)
  }

  const exportPDF = () => {
    setShowExportMenu(false)
    window.print()
  }

  const handlePrint = () => window.print()

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  const renderFormFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference No <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.referenceNo}
            onChange={(e) => handleInputChange("referenceNo", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
          {errors.referenceNo && <p className="text-red-500 text-xs mt-1">{errors.referenceNo}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.fromTitle}
            onChange={(e) => handleInputChange("fromTitle", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
          {errors.fromTitle && <p className="text-red-500 text-xs mt-1">{errors.fromTitle}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.toTitle}
            onChange={(e) => handleInputChange("toTitle", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
          {errors.toTitle && <p className="text-red-500 text-xs mt-1">{errors.toTitle}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => handleInputChange("type", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          >
            <option value="Official">Official</option>
            <option value="Internal">Internal</option>
            <option value="External">External</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attach Document</label>
          <label className="flex items-center justify-center gap-2 px-3 py-6 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 cursor-pointer hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
            <Upload className="h-5 w-5" />
            {uploading ? "Uploading..." : "Click to upload (multiple files)"}
            <input type="file" multiple onChange={handleAttachFiles} className="hidden" />
          </label>
          {form.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {form.attachments.map((a) => (
                <div key={a.url} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <FileText className="h-4 w-4 text-[var(--primary)] shrink-0" />
                  <span className="flex-1 min-w-0 text-sm text-gray-700 truncate">{a.name}</span>
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-[var(--primary)]" title="View">
                    <Eye className="h-4 w-4" />
                  </a>
                  <a href={a.url} download={a.name} className="p-1 text-gray-400 hover:text-[var(--primary)]" title="Download">
                    <Download className="h-4 w-4" />
                  </a>
                  <button type="button" onClick={() => removeAttachment(a.url)} className="p-1 text-gray-400 hover:text-red-500" title="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
        <textarea
          value={form.note}
          onChange={(e) => handleInputChange("note", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          rows={3}
        />
      </div>
    </>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Postal Receive</h2>
          <p className="text-sm text-gray-500 mt-1">Front Office / Postal Receive</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <form onSubmit={(e) => { e.preventDefault() }} className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date From</label>
              <input
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date To</label>
              <input
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">All</option>
                <option value="Official">Official</option>
                <option value="Internal">Internal</option>
                <option value="External">External</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-700">Postal Receive</h3>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Import
            </button>
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export
                <ChevronDown className="h-3 w-3" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
                  <button onClick={exportCSV} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
                  <button onClick={exportExcel} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel</button>
                  <button onClick={exportPDF} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
                </div>
              )}
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button
              onClick={() => { setForm({ ...emptyForm }); setErrors({}); setShowAddModal(true) }}
              className="flex items-center gap-1.5 text-xs text-white bg-[var(--primary)] px-3 py-1.5 rounded-lg hover:bg-[var(--secondary)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Reference No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">From Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">To Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Address</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Type</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">No records found</td>
                </tr>
              ) : (
                paginated.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-100 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"} hover:bg-[var(--primary-light)]`}>
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * rowsPerPage + idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-800">{r.referenceNo}</td>
                    <td className="px-4 py-3 text-gray-600">{r.date}</td>
                    <td className="px-4 py-3 text-gray-800">{r.fromTitle}</td>
                    <td className="px-4 py-3 text-gray-600">{r.toTitle}</td>
                    <td className="px-4 py-3 text-gray-600">{r.address || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        r.type === "Official" ? "bg-blue-100 text-blue-800" :
                        r.type === "Internal" ? "bg-green-100 text-green-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right print:hidden">
                      <div className="flex items-center justify-end gap-1">
                        {parseAttachments(r.attachments).length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-medium mr-1" title={`${parseAttachments(r.attachments).length} attachment(s)`}>
                            <Paperclip className="h-3 w-3" />
                            {parseAttachments(r.attachments).length}
                          </span>
                        )}
                        <button
                          onClick={() => { setViewId(r.id); setShowViewModal(true) }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(r.id)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
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

        {/* Footer: Records per page + Pagination + Record count */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
          <span>Showing {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} records</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-2 py-1 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-0">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`px-2.5 py-1 rounded text-xs font-medium ${page === p ? "bg-[var(--primary)] text-white" : "border border-gray-300 hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-2 py-1 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:overflow-visible, .print\\:overflow-visible * { visibility: visible; }
          .print\\:overflow-visible { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          .space-y-6 > *:not(:last-child) { display: none; }
          .space-y-6 > .bg-white.rounded-xl:last-of-type { display: block !important; }
          .bg-white.rounded-xl { border: 1px solid #ddd !important; }
          th, td { padding: 6px 8px !important; font-size: 10px !important; }
        }
      `}</style>

      {/* View Modal */}
      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Receive Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {viewId && (() => {
                const r = records.find((x) => x.id === viewId)
                if (!r) return null
                const attachments = parseAttachments(r.attachments)
                return (
                  <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {[
                      { label: "Reference No", value: r.referenceNo },
                      { label: "Date", value: r.date },
                      { label: "From Title", value: r.fromTitle },
                      { label: "To Title", value: r.toTitle },
                      { label: "Address", value: r.address || "-" },
                      { label: "Type", value: r.type },
                      { label: "Description", value: r.description || "-", full: true },
                      { label: "Note", value: r.note || "-", full: true },
                    ].map((item) => (
                      <div key={item.label} className={`${item.full ? "md:col-span-2" : ""} border-b border-gray-50 pb-2`}>
                        <span className="text-[11px] font-medium text-gray-500 uppercase">{item.label}</span>
                        <p className="text-sm text-gray-800 mt-0.5 font-medium">{item.value}</p>
                      </div>
                    ))}
                    {attachments.length > 0 && (
                      <div className="md:col-span-2 border-b border-gray-50 pb-2">
                        <span className="text-[11px] font-medium text-gray-500 uppercase">Attachments ({attachments.length})</span>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {attachments.map((a) => {
                            const isImage = /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(a.name) || (a.type || "").startsWith("image/")
                            const isPdf = /\.pdf$/i.test(a.name) || (a.type || "") === "application/pdf"
                            return (
                              <div key={a.url} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                {isImage ? (
                                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="block">
                                    <img src={a.url} alt={a.name} className="w-full h-32 object-cover" />
                                  </a>
                                ) : isPdf ? (
                                  <div className="flex items-center justify-center h-32 bg-red-50">
                                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-red-600">
                                      <FileText className="h-8 w-8" />
                                      <span className="text-xs font-medium">View PDF</span>
                                    </a>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-32 bg-gray-100">
                                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-gray-500">
                                      <FileText className="h-8 w-8" />
                                      <span className="text-xs font-medium">Open file</span>
                                    </a>
                                  </div>
                                )}
                                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-white">
                                  <span className="text-xs text-gray-600 truncate">{a.name}</span>
                                  <a href={a.url} download={a.name} className="text-gray-400 hover:text-[var(--primary)]" title="Download">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  </>
                )
              })()}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Add Receive</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">{renderFormFields()}</div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleAdd}
                className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Edit Receive</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">{renderFormFields()}</div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleUpdate}
                className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this receive record?
                {deleteId && (
                  <strong className="block mt-1 text-gray-800">
                    {records.find((r) => r.id === deleteId)?.fromTitle}
                  </strong>
                )}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
