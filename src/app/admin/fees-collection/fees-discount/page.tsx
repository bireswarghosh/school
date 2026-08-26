"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useMemo, useRef } from "react"
import { Plus, Pencil, Trash2, X, Save, Download, Upload, Printer, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

type DiscountType = "Percentage" | "Fix"
type FeesDiscount = { id: number; name: string; discountCode: string; discountType: DiscountType; percentage: number | null; amount: number | null; useCount: number; expiryDate: string; description: string }

const today = () => new Date().toISOString().split("T")[0]

export default function FeesDiscountPage() {
  const { symbol } = useCurrency()
  const { data: discounts, add, update, remove } = useApi<FeesDiscount>("/api/fees/fees-discount")
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(""); const [discountCode, setDiscountCode] = useState(""); const [discountType, setDiscountType] = useState<DiscountType>("Fix")
  const [percentage, setPercentage] = useState(""); const [amount, setAmount] = useState(""); const [useCount, setUseCount] = useState("0")
  const [expiryDate, setExpiryDate] = useState(""); const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showEditModal, setShowEditModal] = useState(false); const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null); const [editName, setEditName] = useState(""); const [editDiscountCode, setEditDiscountCode] = useState("")
  const [editDiscountType, setEditDiscountType] = useState<DiscountType>("Fix"); const [editPercentage, setEditPercentage] = useState("")
  const [editAmount, setEditAmount] = useState(""); const [editUseCount, setEditUseCount] = useState("0"); const [editExpiryDate, setEditExpiryDate] = useState("")
  const [editDescription, setEditDescription] = useState(""); const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [deleteId, setDeleteId] = useState<number | null>(null); const [toast, setToast] = useState("")
  const [keyword, setKeyword] = useState(""); const [currentPage, setCurrentPage] = useState(1); const [recordsPerPage, setRecordsPerPage] = useState(10)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000) }

  const handleAdd = async () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Name is required"
    if (!discountCode.trim()) errs.discountCode = "Discount code is required"
    if (discountType === "Percentage" && !percentage.trim()) errs.percentage = "Percentage is required"
    if (discountType === "Fix" && !amount.trim()) errs.amount = "Amount is required"
    setErrors(errs); if (Object.keys(errs).length) return
    await add({ name: name.trim(), discountCode: discountCode.trim(), discountType, percentage: discountType === "Percentage" ? Number(percentage) : null, amount: discountType === "Fix" ? Number(amount) : null, useCount: Number(useCount), expiryDate, description: description.trim() })
    setName(""); setDiscountCode(""); setDiscountType("Fix"); setPercentage(""); setAmount(""); setUseCount("0"); setExpiryDate(""); setDescription("")
    showToast("Discount added successfully")
  }

  const openEdit = (d: FeesDiscount) => {
    setEditId(d.id); setEditName(d.name); setEditDiscountCode(d.discountCode); setEditDiscountType(d.discountType)
    setEditPercentage(d.percentage !== null ? String(d.percentage) : ""); setEditAmount(d.amount !== null ? String(d.amount) : "")
    setEditUseCount(String(d.useCount)); setEditExpiryDate(d.expiryDate); setEditDescription(d.description); setEditErrors({}); setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs: Record<string, string> = {}
    if (!editName.trim()) errs.name = "Name is required"
    if (!editDiscountCode.trim()) errs.discountCode = "Discount code is required"
    if (editDiscountType === "Percentage" && !editPercentage.trim()) errs.percentage = "Percentage is required"
    if (editDiscountType === "Fix" && !editAmount.trim()) errs.amount = "Amount is required"
    setEditErrors(errs); if (Object.keys(errs).length) return
    await update(editId!, { name: editName.trim(), discountCode: editDiscountCode.trim(), discountType: editDiscountType, percentage: editDiscountType === "Percentage" ? Number(editPercentage) : null, amount: editDiscountType === "Fix" ? Number(editAmount) : null, useCount: Number(editUseCount), expiryDate: editExpiryDate, description: editDescription.trim() })
    setShowEditModal(false); setEditId(null); showToast("Discount updated successfully")
  }

  const openDelete = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }
  const confirmDelete = async () => { if (deleteId === null) return; await remove(deleteId); setShowDeleteModal(false); setDeleteId(null); showToast("Discount deleted successfully") }

  const formatDate = (date: string) => {
    if (!date) return "-"
    const [y, m, d] = date.split("-")
    return `${m}/${d}/${y}`
  }

  const currentData = discounts || []
  const filtered = useMemo(() => {
    if (!keyword.trim()) return currentData
    const kw = keyword.toLowerCase()
    return currentData.filter((d) => d.name.toLowerCase().includes(kw) || (d.discountCode || "").toLowerCase().includes(kw))
  }, [currentData, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / recordsPerPage))
  const paginated = useMemo(() => { const s = (currentPage - 1) * recordsPerPage; return filtered.slice(s, s + recordsPerPage) }, [filtered, currentPage, recordsPerPage])

  const exportCSV = () => {
    const rows = currentData.map((d) => `"${d.name}","${d.discountCode}","${d.discountType}","${d.percentage ?? ""}","${d.amount ?? ""}","${d.useCount}","${d.expiryDate}","${(d.description || "").replace(/"/g, '""')}"`)
    const blob = new Blob(["\uFEFFName,Code,Type,Percentage,Amount,Use Count,Expiry Date,Description\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Fees_Discount.csv"; a.click()
  }
  const exportExcel = () => {
    const rows = currentData.map((d) => `<tr><td>${d.name}</td><td>${d.discountCode}</td><td>${d.discountType}</td><td>${d.percentage ?? ""}</td><td>${d.amount ?? ""}</td><td>${d.useCount}</td><td>${formatDate(d.expiryDate)}</td><td>${d.description || ""}</td></tr>`).join("")
    const blob = new Blob([`<html><meta charset="utf-8"><body><table><tr><th>Name</th><th>Code</th><th>Type</th><th>Percentage</th><th>Amount</th><th>Use Count</th><th>Expiry Date</th><th>Description</th></tr>${rows}</table></body></html>`], { type: "application/vnd.ms-excel" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Fees_Discount.xls"; a.click()
  }
  const printTable = () => {
    const rows = currentData.map((d) => `<tr><td>${d.name}</td><td>${d.discountCode}</td><td>${d.discountType}</td><td>${d.percentage ?? ""}</td><td>${d.amount ?? ""}</td><td>${d.useCount}</td><td>${formatDate(d.expiryDate)}</td><td>${d.description || ""}</td></tr>`).join("")
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(`<html><head><title>Fees Discount</title><style>body{font-family:Arial;font-size:12px;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f5f5f5}</style></head><body><h2>Fees Discount</h2><table><tr><th>Name</th><th>Code</th><th>Type</th><th>Percentage</th><th>Amount</th><th>Use Count</th><th>Expiry Date</th><th>Description</th></tr>${rows}</table><p style="color:#999;font-size:11px;margin-top:10px">Generated on ${today()}</p></body></html>`)
      win.document.close(); win.print()
    }
  }
  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text(); const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) { notify.error("CSV must have header + data rows"); return }
    const parsed = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim())
      if (cols[0]) parsed.push({ name: cols[0], discountCode: cols[1] || null, discountType: cols[2] || "Fix", percentage: cols[3] ? Number(cols[3]) : null, amount: cols[4] ? Number(cols[4]) : null, useCount: Number(cols[5] || 0), expiryDate: cols[6] || null, description: cols[7] || null })
    }
    if (parsed.length === 0) { notify.error("No valid records"); return }
    try {
      const res = await fetch("/api/fees/fees-discount", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) })
      if (!res.ok) throw new Error((await res.json()).error || "Import failed")
      notify.success(`Imported ${parsed.length} records`)
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
    pages.push(totalPages); return pages
  }, [totalPages, currentPage])

  const formFields = (p: string, v: string, lbl: string, req: boolean, errs: Record<string, string>, onChange: (v: string) => void, isTextarea = false) => (
    <div><label className="block text-xs font-medium text-gray-600 mb-1">{lbl}{req && <span className="text-red-400"> *</span>}</label>
      {isTextarea ? <textarea value={v} onChange={(e) => onChange(e.target.value)} placeholder={`Enter ${lbl.toLowerCase()}`} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
        : <input type="text" value={v} onChange={(e) => onChange(e.target.value)} placeholder={`Enter ${lbl.toLowerCase()}`} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />}
      {errs[p] && <p className="text-red-400 text-xs mt-0.5">{errs[p]}</p>}</div>
  )

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10"><h2 className="text-lg font-bold text-white">Fees Discount</h2><p className="text-xs text-white/80 mt-0.5">Fees Collection / Fees Discount</p></div>
      </div>
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-5 py-3 rounded-lg shadow-lg">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1) }} placeholder="Search..." className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />Export</button>
            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <button onClick={exportCSV} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-t-lg">CSV</button>
              <button onClick={exportExcel} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">Excel</button>
              <button onClick={printTable} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-b-lg">PDF</button>
            </div>
          </div>
          <button onClick={printTable} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"><Printer className="h-3.5 w-3.5" />Print</button>
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" />Import</button>
          <input ref={fileRef} type="file" accept=".csv" onChange={importCSV} className="hidden" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">Add Fees Discount</h3></div>
            <div className="p-5 space-y-4">
              {formFields("name", name, "Name", true, errors, (v) => { setName(v); if (errors.name) setErrors({}) })}
              {formFields("discountCode", discountCode, "Discount Code", true, errors, (v) => { setDiscountCode(v); if (errors.discountCode) setErrors({}) })}
              <div><label className="block text-xs font-medium text-gray-600 mb-2">Discount Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer"><input type="radio" name="discountType" checked={discountType === "Percentage"} onChange={() => { setDiscountType("Percentage"); setAmount("") }} className="accent-indigo-600" />Percentage</label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer"><input type="radio" name="discountType" checked={discountType === "Fix"} onChange={() => { setDiscountType("Fix"); setPercentage("") }} className="accent-indigo-600" />Fix</label>
                </div></div>
              {discountType === "Percentage" && <div><label className="block text-xs font-medium text-gray-600 mb-1">Percentage (%)</label>
                <input type="number" value={percentage} onChange={(e) => setPercentage(e.target.value)} placeholder="Enter percentage" min={0} max={100} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.percentage && <p className="text-red-400 text-xs mt-0.5">{errors.percentage}</p>}</div>}
              {discountType === "Fix" && <div><label className="block text-xs font-medium text-gray-600 mb-1">{`Amount (${symbol})`}</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" min={0} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
                {errors.amount && <p className="text-red-400 text-xs mt-0.5">{errors.amount}</p>}</div>}
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Number Of Use Count</label>
                <input type="number" value={useCount} onChange={(e) => setUseCount(e.target.value)} placeholder="0" min={0} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date</label>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
              {formFields("description", description, "Description", false, errors, setDescription, true)}
              <button onClick={handleAdd} className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-4 py-2 rounded-lg hover:bg-[var(--secondary)] shadow-sm shadow-indigo-200"><Save className="h-3.5 w-3.5" />Save</button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">Fees Discount List</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">Name</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">Code</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">Percentage</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">Amount</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">Use Count</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">Expiry Date</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No discounts found</td></tr>
                  ) : (
                    paginated.map((d, idx) => (
                      <tr key={d.id} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{d.name}</td>
                        <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{d.discountCode}</td>
                        <td className="px-4 py-2.5 text-gray-600">{d.discountType === "Percentage" ? `${d.percentage}%` : <span className="text-gray-300">-</span>}</td>
                        <td className="px-4 py-2.5 text-gray-600">{d.discountType === "Fix" ? `${symbol}${d.amount}` : <span className="text-gray-300">-</span>}</td>
                        <td className="px-4 py-2.5 text-gray-600">{d.useCount}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{formatDate(d.expiryDate)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <button onClick={() => openEdit(d)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => openDelete(d.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span>{filtered.length} records</span>
                <select value={recordsPerPage} onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1) }} className="border border-gray-300 rounded px-2 py-1 bg-white">
                  <option value={10}>10 / page</option><option value={25}>25 / page</option><option value={50}>50 / page</option><option value={100}>100 / page</option>
                </select>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5" /></button>
                  {paginationPages.map((p, i) => typeof p === "string" ? <span key={`e${i}`} className="px-1 text-gray-400">...</span> : <button key={p} onClick={() => setCurrentPage(p)} className={`min-w-[28px] h-7 text-xs font-medium rounded-lg ${currentPage === p ? "bg-[var(--primary)] text-white" : "text-gray-600 hover:bg-gray-50 border border-transparent"}`}>{p}</button>)}
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Edit Fees Discount</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Name <span className="text-red-400">*</span></label>
                <input type="text" value={editName} onChange={(e) => { setEditName(e.target.value); if (editErrors.name) setEditErrors({}) }} placeholder="Enter discount name" className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.name && <p className="text-red-400 text-xs mt-0.5">{editErrors.name}</p>}</div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Discount Code <span className="text-red-400">*</span></label>
                <input type="text" value={editDiscountCode} onChange={(e) => { setEditDiscountCode(e.target.value); if (editErrors.discountCode) setEditErrors({}) }} placeholder="Enter discount code" className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
                {editErrors.discountCode && <p className="text-red-400 text-xs mt-0.5">{editErrors.discountCode}</p>}</div>
              <div><label className="block text-xs font-medium text-gray-600 mb-2">Discount Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer"><input type="radio" name="editDiscountType" checked={editDiscountType === "Percentage"} onChange={() => { setEditDiscountType("Percentage"); setEditAmount("") }} className="accent-indigo-600" />Percentage</label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer"><input type="radio" name="editDiscountType" checked={editDiscountType === "Fix"} onChange={() => { setEditDiscountType("Fix"); setEditPercentage("") }} className="accent-indigo-600" />Fix</label>
                </div></div>
              {editDiscountType === "Percentage" && <div><label className="block text-xs font-medium text-gray-600 mb-1">Percentage (%)</label>
                <input type="number" value={editPercentage} onChange={(e) => { setEditPercentage(e.target.value); if (editErrors.percentage) setEditErrors((p) => { const { percentage, ...r } = p; return r }) }} placeholder="Enter percentage" min={0} max={100} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />{editErrors.percentage && <p className="text-red-400 text-xs mt-0.5">{editErrors.percentage}</p>}</div>}
              {editDiscountType === "Fix" && <div><label className="block text-xs font-medium text-gray-600 mb-1">{`Amount (${symbol})`}</label>
                <input type="number" value={editAmount} onChange={(e) => { setEditAmount(e.target.value); if (editErrors.amount) setEditErrors((p) => { const { amount, ...r } = p; return r }) }} placeholder="Enter amount" min={0} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />{editErrors.amount && <p className="text-red-400 text-xs mt-0.5">{editErrors.amount}</p>}</div>}
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Number Of Use Count</label>
                <input type="number" value={editUseCount} onChange={(e) => setEditUseCount(e.target.value)} min={0} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date</label>
                <input type="date" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Enter description" rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleEditSave} className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] shadow-sm shadow-indigo-200"><Save className="h-3.5 w-3.5" />Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3"><Trash2 className="h-6 w-6 text-red-500" /></div>
              <p className="text-sm text-gray-600">Are you sure you want to delete this discount?</p>
              {deleteId && <p className="text-sm font-semibold text-gray-800 mt-1">{(discounts || []).find((d) => d.id === deleteId)?.name}</p>}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm shadow-red-200"><Trash2 className="h-3.5 w-3.5" />Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
