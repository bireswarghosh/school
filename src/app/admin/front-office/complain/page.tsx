"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useRef, useEffect } from "react"
import { useApi } from "@/lib/use-api"
import { Search, Plus, Pencil, Trash2, X, Download, Upload, Printer, ChevronDown, Frown, FileText, Paperclip, Eye } from "lucide-react"

type Attachment = {
  name: string
  url: string
  size?: number
  type?: string
}

type ComplainRecord = {
  id: number
  complaintType: string
  source: string
  name: string
  phone: string
  date: string
  description: string
  actionTaken: string
  assigned: string
  note: string
  document: string
  status: string
  email: string
  attachments: Attachment[]
}

const complaintTypeOptions = ["Academic", "Discipline", "Facility", "Other"]
const sourceOptions = ["Website", "Reference", "Walk-in", "Advertisement"]
const statusOptions = ["All", "Active", "Passive", "Dead", "Won", "Lost"]

const today = () => new Date().toISOString().split("T")[0]

const emptyForm = {
  complaintType: "", source: "", name: "", phone: "", email: "",
  date: today(), description: "", actionTaken: "", assigned: "", note: "", document: "",
  attachments: [] as Attachment[],
}

const fmt = (d: string) => d ? d.split("T")[0] : ""

const colLabels: Record<string, string> = {
  id: "#", complaintType: "Complaint Type", source: "Source", name: "Name",
  phone: "Phone", date: "Date", description: "Description", actionTaken: "Action Taken",
  assigned: "Assigned", note: "Note", document: "Document", status: "Status", email: "Email",
}

const cols = Object.keys(colLabels)

function csvRow(row: Record<string, any>) {
  return cols.map((k) => `"${(row[k] ?? "").toString().replace(/"/g, '""')}"`).join(",")
}

export default function ComplainPage() {
  const { data: records, add, update, remove, loading } = useApi<ComplainRecord>("/api/front-office/complain")
  const fileRef = useRef<HTMLInputElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [viewId, setViewId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [filterFromDate, setFilterFromDate] = useState("")
  const [filterToDate, setFilterToDate] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [uploading, setUploading] = useState(false)

  const filtered = records.filter((r) => {
    if (filterFromDate && r.date < filterFromDate) return false
    if (filterToDate && r.date > filterToDate) return false
    if (filterStatus && filterStatus !== "all" && r.status?.toLowerCase() !== filterStatus) return false
    return true
  })

  useEffect(() => { setPage(1) }, [filterFromDate, filterToDate, filterStatus, records.length])

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
    if (!form.name.trim()) errs.name = "Name is required"
    if (!form.complaintType) errs.complaintType = "Complaint Type is required"
    if (!form.date) errs.date = "Date is required"
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

  const buildPayload = () => ({
    complaintType: form.complaintType, source: form.source, name: form.name, phone: form.phone,
    email: form.email, date: form.date, description: form.description,
    actionTaken: form.actionTaken, assigned: form.assigned, note: form.note,
    document: form.attachments.map((a) => a.name).join(", ") || form.document,
    attachments: JSON.stringify(form.attachments),
  })

  const handleAdd = async () => {
    if (!validateForm()) return
    try {
      await add(buildPayload())
      setShowAddModal(false)
      setForm({ ...emptyForm })
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const handleEdit = (id: number) => {
    const r = records.find((x) => x.id === id)
    if (!r) return
    setEditId(id)
    setForm({
      complaintType: r.complaintType, source: r.source, name: r.name, phone: r.phone,
      email: r.email || "", date: fmt(r.date), description: r.description || "",
      actionTaken: r.actionTaken || "", assigned: r.assigned || "", note: r.note || "",
      document: r.document || "",
      attachments: parseAttachments(r.attachments),
    })
    setErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!validateForm() || editId === null) return
    try {
      await update(editId, buildPayload())
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

  const statusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800"
      case "passive": return "bg-yellow-100 text-yellow-800"
      case "dead": return "bg-gray-100 text-gray-600"
      case "won": return "bg-blue-100 text-blue-800"
      case "lost": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) return notify.error("CSV must have a header row and at least one data row")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
    const bulk: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      if (vals.length < 2) continue
      const rec: any = {}
      headers.forEach((h, idx) => { rec[h] = vals[idx] || "" })
      if (rec.name) bulk.push(rec)
    }
    if (bulk.length === 0) return notify.error("No valid records found in CSV")
    const res = await fetch("/api/front-office/complain", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bulk),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Import failed")
    }
    notify.success(`Imported ${bulk.length} records successfully`)
    if (fileRef.current) fileRef.current.value = ""
  }

  const exportCSV = () => {
    const csv = [csvRow(colLabels), ...filtered.map((r) => csvRow(r))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    downloadBlob(blob, "complain.csv")
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
    downloadBlob(blob, "complain.xls")
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
            Complaint Type <span className="text-red-500">*</span>
          </label>
          <select
            value={form.complaintType}
            onChange={(e) => handleInputChange("complaintType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          >
            <option value="">Select</option>
            {complaintTypeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.complaintType && <p className="text-red-500 text-xs mt-1">{errors.complaintType}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <select
            value={form.source}
            onChange={(e) => handleInputChange("source", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          >
            <option value="">Select</option>
            {sourceOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder="Name"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder="Phone"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="text"
            value={form.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder="Email"
          />
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            rows={3}
            placeholder="Enter description"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action Taken</label>
          <textarea
            value={form.actionTaken}
            onChange={(e) => handleInputChange("actionTaken", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            rows={3}
            placeholder="Action taken"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <textarea
            value={form.note}
            onChange={(e) => handleInputChange("note", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            rows={3}
            placeholder="Note"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned</label>
          <input
            type="text"
            value={form.assigned}
            onChange={(e) => handleInputChange("assigned", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder="Assigned to"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attach Documents</label>
          <label className="flex flex-col items-center justify-center gap-2 px-3 py-5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 cursor-pointer hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
            <Upload className="h-5 w-5" />
            <span>{uploading ? "Uploading..." : "Click to upload (multiple files)"}</span>
            <input type="file" multiple onChange={handleAttachFiles} className="hidden" />
          </label>
          {form.attachments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {form.attachments.map((a) => (
                <div key={a.url} className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <FileText className="h-4 w-4 text-[var(--primary)] shrink-0" />
                  <span className="flex-1 min-w-0 text-xs text-gray-700 truncate">{a.name}</span>
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="p-0.5 text-gray-400 hover:text-[var(--primary)]" title="View">
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                  <a href={a.url} download={a.name} className="p-0.5 text-gray-400 hover:text-[var(--primary)]" title="Download">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  <button type="button" onClick={() => removeAttachment(a.url)} className="p-0.5 text-gray-400 hover:text-red-500" title="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Complain</h2>
          <p className="text-sm text-gray-500 mt-1">Front Office / Complain</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <form onSubmit={(e) => { e.preventDefault() }} className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Select</option>
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt.toLowerCase()}>{opt}</option>
                ))}
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-700">Complaint List</h3>
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
              Add Record
            </button>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Complaint Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Source</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    <Frown className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <span className="text-sm">No complaints found</span>
                  </td>
                </tr>
              ) : (
                paginated.map((r, idx) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * rowsPerPage + idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                        {r.complaintType || "-"}
                      </span>
                      {parseAttachments(r.attachments).length > 0 && (
                        <span className="inline-flex items-center gap-1 ml-1.5 text-[var(--primary)]" title={`${parseAttachments(r.attachments).length} attachment(s)`}>
                          <Paperclip className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.source || "-"}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.phone || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.date}</td>
                    <td className="px-4 py-3">
                      {r.status ? (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass(r.status)}`}>
                          {r.status}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right print:hidden">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setViewId(r.id); setShowViewModal(true) }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Download className="h-4 w-4" />
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

        {/* Pagination */}
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Complain</h3>
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
              <h3 className="text-lg font-semibold text-gray-800">Edit Complain</h3>
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

      {/* View Modal */}
      {showViewModal && viewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Complaint Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {(() => {
                const r = records.find((x) => x.id === viewId)
                if (!r) return null
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {[
                      { label: "Complain #", value: `#${r.id}` },
                      { label: "Complaint Type", value: r.complaintType || "-" },
                      { label: "Source", value: r.source || "-" },
                      { label: "Name", value: r.name },
                      { label: "Phone", value: r.phone || "-" },
                      { label: "Email", value: r.email || "-" },
                      { label: "Date", value: r.date },
                      { label: "Status", value: r.status || "-" },
                      { label: "Action Taken", value: r.actionTaken || "-" },
                      { label: "Assigned", value: r.assigned || "-" },
                      { label: "Description", value: r.description || "-", full: true },
                      { label: "Note", value: r.note || "-", full: true },
                    ].map((item) => (
                      <div key={item.label} className={`${item.full ? "md:col-span-2" : ""} border-b border-gray-50 pb-2`}>
                        <span className="text-xs font-medium text-gray-500 uppercase">{item.label}</span>
                        <p className="text-sm text-gray-800 mt-0.5 font-medium">{item.value}</p>
                      </div>
                    ))}
                    {(() => {
                      const files = parseAttachments(r.attachments)
                      if (files.length === 0) return null
                      return (
                        <div className="md:col-span-2 border-b border-gray-50 pb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase">Attachments ({files.length})</span>
                          <div className="mt-2 space-y-1.5">
                            {files.map((a) => (
                              <div key={a.url} className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                                <FileText className="h-4 w-4 text-[var(--primary)] shrink-0" />
                                <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">{a.name}</span>
                                <a href={a.url} target="_blank" rel="noopener noreferrer" className="p-0.5 text-gray-400 hover:text-[var(--primary)]">
                                  <Eye className="h-4 w-4" />
                                </a>
                                <a href={a.url} download={a.name} className="p-0.5 text-gray-400 hover:text-[var(--primary)]">
                                  <Download className="h-4 w-4" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
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
                Are you sure you want to delete this complaint?
                {deleteId && (
                  <strong className="block mt-1 text-gray-800">
                    {records.find((r) => r.id === deleteId)?.name}
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
