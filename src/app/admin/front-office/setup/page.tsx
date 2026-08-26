"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useMemo, useRef } from "react"
import { Search, Pencil, Trash2, X, Download, Upload, Printer, ChevronLeft, ChevronRight, Settings } from "lucide-react"
import { useApi } from "@/lib/use-api"

type TabType = "enquiry" | "purpose" | "complaint" | "source" | "reference"

type SetupItem = { id: number; name: string; description?: string; status: string }

const tabs: { key: TabType; label: string }[] = [
  { key: "enquiry", label: "Enquiry Type" },
  { key: "purpose", label: "Purpose" },
  { key: "complaint", label: "Complaint Type" },
  { key: "source", label: "Source" },
  { key: "reference", label: "Reference" },
]

const today = () => new Date().toISOString().split("T")[0]

function useTabApi(tab: TabType) {
  const ep: Record<TabType, string> = {
    enquiry: "/api/front-office/enquiry-type",
    purpose: "/api/front-office/purpose-type",
    complaint: "/api/front-office/complaint-type",
    source: "/api/front-office/source-type",
    reference: "/api/front-office/reference-type",
  }
  return useApi<SetupItem>(ep[tab])
}

export default function SetupFrontOfficePage() {
  const [activeTab, setActiveTab] = useState<TabType>("enquiry")
  const { data: items, add, update, remove, loading } = useTabApi(activeTab)
  const fileRef = useRef<HTMLInputElement>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editItem, setEditItem] = useState<SetupItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<SetupItem | null>(null)
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [keyword, setKeyword] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(10)

  const getLabel = (tab: TabType) => {
    switch (tab) {
      case "enquiry": return "Enquiry Type"
      case "purpose": return "Purpose"
      case "complaint": return "Complaint Type"
      case "source": return "Source"
      case "reference": return "Reference"
    }
  }

  const getApiEndpoint = (tab: TabType) => {
    switch (tab) {
      case "enquiry": return "/api/front-office/enquiry-type"
      case "purpose": return "/api/front-office/purpose-type"
      case "complaint": return "/api/front-office/complaint-type"
      case "source": return "/api/front-office/source-type"
      case "reference": return "/api/front-office/reference-type"
    }
  }

  const handleAdd = async () => {
    const lb = getLabel(activeTab)
    if (!formName.trim()) { setErrors({ name: `${lb} is required` }); return }
    try {
      await add({ name: formName.trim(), description: formDesc.trim() || null, status: "Active" })
      setFormName(""); setFormDesc(""); setErrors({})
    } catch (e: any) { notify.error(e.message) }
  }

  const handleEdit = (item: SetupItem) => {
    setEditItem(item); setFormName(item.name); setFormDesc(item.description || ""); setErrors({}); setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editItem) return
    const lb = getLabel(activeTab)
    if (!formName.trim()) { setErrors({ name: `${lb} is required` }); return }
    try {
      await update(editItem.id, { name: formName.trim(), description: formDesc.trim() || null })
      setShowEditModal(false); setEditItem(null); setFormName(""); setFormDesc(""); setErrors({})
    } catch (e: any) { notify.error(e.message) }
  }

  const handleDelete = (item: SetupItem) => { setDeleteItem(item); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (!deleteItem) return
    try { await remove(deleteItem.id); setShowDeleteModal(false); setDeleteItem(null) }
    catch (e: any) { notify.error(e.message) }
  }

  const currentData = items || []

  const filtered = useMemo(() => {
    if (!keyword.trim()) return currentData
    const kw = keyword.toLowerCase()
    return currentData.filter((item) =>
      item.name.toLowerCase().includes(kw) || (item.description || "").toLowerCase().includes(kw)
    )
  }, [currentData, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / recordsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage
    return filtered.slice(start, start + recordsPerPage)
  }, [filtered, currentPage, recordsPerPage])

  const exportCSV = () => {
    const header = `"${getLabel(activeTab)}","Description"`
    const rows = currentData.map((item) => `"${item.name}","${(item.description || "").replace(/"/g, '""')}"`)
    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `${getLabel(activeTab).replace(/\s+/g, "_")}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    const header = `<tr><th>${getLabel(activeTab)}</th><th>Description</th></tr>`
    const rows = currentData.map((item) => `<tr><td>${item.name}</td><td>${item.description || ""}</td></tr>`).join("")
    const html = `<html><head><meta charset="utf-8"><title>${getLabel(activeTab)}</title></head><body><table>${header}${rows}</table></body></html>`
    const blob = new Blob([html], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `${getLabel(activeTab).replace(/\s+/g, "_")}.xls`; a.click()
    URL.revokeObjectURL(url)
  }

  const printTable = () => {
    const header = `<tr><th>${getLabel(activeTab)}</th><th>Description</th></tr>`
    const rows = currentData.map((item) => `<tr><td>${item.name}</td><td>${item.description || ""}</td></tr>`).join("")
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(`<html><head><title>${getLabel(activeTab)}</title><style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f5f5f5;font-weight:600}</style></head><body><h2>${getLabel(activeTab)}</h2><table>${header}${rows}</table><p style="color:#999;font-size:11px;margin-top:10px">Generated on ${today()}</p></body></html>`)
      win.document.close(); win.print()
    }
  }

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) { notify.error("CSV must have a header row and at least one data row"); return }
    const parsed = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim())
      if (cols[0]) parsed.push({ name: cols[0], description: cols[1] || null, status: "Active" })
    }
    if (parsed.length === 0) { notify.error("No valid records found in CSV"); return }
    try {
      const res = await fetch(getApiEndpoint(activeTab), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Import failed") }
      notify.success(`Imported ${parsed.length} records successfully`)
    } catch (e: any) { notify.error(e.message) }
    if (fileRef.current) fileRef.current.value = ""
  }

  const paginationPages = useMemo(() => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages }
    pages.push(1)
    if (currentPage > 3) pages.push("...")
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push("...")
    pages.push(totalPages)
    return pages
  }, [totalPages, currentPage])

  const Modal = ({ title, show, onClose, children, footer }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-5">{children}</div>
          {footer && <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-xl">{footer}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Setup Front Office</h2>
          <p className="text-xs text-gray-500 mt-0.5">Front Office / Setup Front Office</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />Export</button>
            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <button onClick={exportCSV} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-t-lg">CSV</button>
              <button onClick={exportExcel} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">Excel</button>
              <button onClick={printTable} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-b-lg">PDF</button>
            </div>
          </div>
          <button onClick={printTable} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"><Printer className="h-3.5 w-3.5" />Print</button>
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" />Import</button>
          <input ref={fileRef} type="file" accept=".csv" onChange={importCSV} className="hidden" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50/50">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setFormName(""); setFormDesc(""); setErrors({}); setKeyword(""); setCurrentPage(1) }}
                className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? "text-[var(--primary)] bg-white border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">{getLabel(activeTab)} <span className="text-red-400">*</span></label>
              <input type="text" value={formName} onChange={(e) => { setFormName(e.target.value); if (errors.name) setErrors({}) }} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder={`Enter ${getLabel(activeTab).toLowerCase()}`} />
              {errors.name && <p className="text-red-400 text-xs mt-0.5">{errors.name}</p>}</div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter description" /></div>
            <div className="flex items-end">
              <button onClick={handleAdd} className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">Save</button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1) }} placeholder="Search..." className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">{getLabel(activeTab)}</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">Description</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-gray-400 text-sm">No records found</td></tr>
                ) : (
                  paginated.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{item.name}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{item.description || <span className="text-gray-300">-</span>}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button onClick={() => handleEdit(item)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{filtered.length} records</span>
              <select value={recordsPerPage} onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1) }} className="border border-gray-300 rounded px-2 py-1 text-xs bg-white">
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="h-3.5 w-3.5" /></button>
                {paginationPages.map((p, i) => typeof p === "string" ? <span key={`e${i}`} className="px-1 text-xs text-gray-400">...</span> : <button key={p} onClick={() => setCurrentPage(p)} className={`min-w-[28px] h-7 text-xs font-medium rounded-lg transition-colors ${currentPage === p ? "bg-[var(--primary)] text-white" : "text-gray-600 hover:bg-gray-50 border border-transparent"}`}>{p}</button>)}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal title={`Edit ${getLabel(activeTab)}`} show={showEditModal} onClose={() => setShowEditModal(false)}
        footer={<><button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={handleUpdate} className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] shadow-sm shadow-indigo-200">Save</button></>}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{getLabel(activeTab)} <span className="text-red-400">*</span></label>
            <input type="text" value={formName} onChange={(e) => { setFormName(e.target.value); if (errors.name) setErrors({}) }} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
            {errors.name && <p className="text-red-400 text-xs mt-0.5">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal title="Confirm Delete" show={showDeleteModal} onClose={() => setShowDeleteModal(false)}
        footer={<><button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={confirmDelete} className="px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm shadow-red-200">Delete</button></>}>
        <div className="text-center py-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3"><Trash2 className="h-6 w-6 text-red-500" /></div>
          <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete this {getLabel(activeTab).toLowerCase()}?</p>
          {deleteItem && <p className="text-sm font-semibold text-gray-800">{deleteItem.name}</p>}
        </div>
      </Modal>
    </div>
  )
}
