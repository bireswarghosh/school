"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useRef, useEffect, useMemo } from "react"
import { useApi } from "@/lib/use-api"
import { Search, Plus, Phone, Pencil, Trash2, X, Download, Upload, Printer, ChevronDown, PhoneIncoming, PhoneOutgoing, Clock, Calendar, TrendingUp, Users, Filter, Eye } from "lucide-react"

type CallType = "Incoming" | "Outgoing"

type PhoneCallRecord = {
  id?: number
  name: string
  phone: string
  date: string
  description: string
  followUpDate: string
  callDuration: string
  note: string
  callType: CallType
}

const today = () => new Date().toISOString().split("T")[0]

const emptyForm = {
  name: "",
  phone: "",
  date: today(),
  description: "",
  followUpDate: "",
  callDuration: "",
  note: "",
  callType: "Incoming" as CallType,
}

const fmt = (d: string) => (d ? d.split("T")[0] : "")

const colLabels: Record<string, string> = {
  name: "Name",
  phone: "Phone",
  date: "Date",
  description: "Description",
  followUpDate: "Next Follow Up Date",
  callDuration: "Call Duration",
  note: "Note",
  callType: "Call Type",
}

const cols = Object.keys(colLabels)

function csvRow(row: Record<string, any>) {
  return cols.map((k) => `"${(row[k] ?? "").toString().replace(/"/g, '""')}"`).join(",")
}

export default function PhoneCallLogPage() {
  const { data: records, add, update, remove, loading } = useApi<PhoneCallRecord>("/api/front-office/phone-call-log")
  const fileRef = useRef<HTMLInputElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewId, setViewId] = useState<number | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [filterFromDate, setFilterFromDate] = useState("")
  const [filterToDate, setFilterToDate] = useState("")
  const [filterCallType, setFilterCallType] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterFromDate && r.date < filterFromDate) return false
      if (filterToDate && r.date > filterToDate) return false
      if (filterCallType && r.callType !== filterCallType) return false
      return true
    })
  }, [records, filterFromDate, filterToDate, filterCallType])

  const stats = useMemo(() => {
    const total = records.length
    const incoming = records.filter((r) => r.callType === "Incoming").length
    const outgoing = records.filter((r) => r.callType === "Outgoing").length
    const todayStr = today()
    const todayCount = records.filter((r) => r.date === todayStr).length
    return { total, incoming, outgoing, todayCount }
  }, [records])

  useEffect(() => { setPage(1) }, [filterFromDate, filterToDate, filterCallType, records.length])

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
    if (!form.phone.trim()) errs.phone = "Phone is required"
    if (!form.date.trim()) errs.date = "Date is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAdd = async () => {
    if (!validateForm()) return
    try {
      await add(form)
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
      name: record.name,
      phone: record.phone,
      date: fmt(record.date),
      description: record.description,
      followUpDate: fmt(record.followUpDate),
      callDuration: record.callDuration,
      note: record.note,
      callType: record.callType,
    })
    setErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!validateForm() || editId === null) return
    try {
      await update(editId, form)
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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) return notify.error("CSV must have a header row and at least one data row")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
    const recordsData: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      if (vals.length < 2) continue
      const rec: any = {}
      headers.forEach((h, idx) => { rec[h] = vals[idx] || "" })
      if (rec.name) recordsData.push(rec)
    }
    if (recordsData.length === 0) return notify.error("No valid records found in CSV")
    const res = await fetch("/api/front-office/phone-call-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recordsData),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Import failed")
    }
    notify.success(`Imported ${recordsData.length} records successfully`)
    if (fileRef.current) fileRef.current.value = ""
  }

  const exportCSV = () => {
    const csv = [csvRow(colLabels), ...filtered.map((r) => csvRow(r))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    downloadBlob(blob, "phone-call-log.csv")
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
    downloadBlob(blob, "phone-call-log.xls")
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
          <input type="text" value={form.name} onChange={(e) => handleInputChange("name", e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm" placeholder="Enter name" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Phone <span className="text-red-500">*</span></label>
          <input type="text" value={form.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm" placeholder="Enter phone" />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="date" value={form.date} onChange={(e) => handleInputChange("date", e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm" />
          </div>
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Next Follow Up Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="date" value={form.followUpDate} onChange={(e) => handleInputChange("followUpDate", e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Call Duration</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={form.callDuration} onChange={(e) => handleInputChange("callDuration", e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm" placeholder="e.g. 5:30" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Call Type <span className="text-red-500">*</span></label>
          <div className="flex gap-3 mt-1">
            {(["Incoming", "Outgoing"] as const).map((type) => (
              <button key={type} type="button" onClick={() => handleInputChange("callType", type)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${form.callType === type ? (type === "Incoming" ? "bg-emerald-500 border-emerald-500 text-white shadow-md" : "bg-blue-500 border-blue-500 text-white shadow-md") : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                {type === "Incoming" ? <PhoneIncoming className="h-4 w-4" /> : <PhoneOutgoing className="h-4 w-4" />}
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={3} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm resize-none" placeholder="Enter description" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Note</label>
          <textarea value={form.note} onChange={(e) => handleInputChange("note", e.target.value)} rows={3} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm resize-none" placeholder="Enter notes" />
        </div>
      </div>
    </>
  )

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block"><Phone className="h-28 w-28 text-white" /></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Phone className="h-4 w-4 text-white" /></span>
              Phone Call Log
            </h2>
            <p className="text-sm text-white/80 mt-1">Front Office / Track all incoming & outgoing calls • {records.length} logs</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <TrendingUp className="h-3.5 w-3.5" /> {stats.incoming} in • {stats.outgoing} out
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-slate-600"><Phone className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-slate-400" /></div>
          <p className="text-2xl font-black text-slate-700 mt-2">{stats.total}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Total Calls</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-emerald-600"><PhoneIncoming className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{stats.incoming}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-600/70">Incoming</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-blue-600"><PhoneOutgoing className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-blue-500" /></div>
          <p className="text-2xl font-black text-blue-700 mt-2">{stats.outgoing}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-blue-600/70">Outgoing</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-amber-600"><Calendar className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-amber-500" /></div>
          <p className="text-2xl font-black text-amber-700 mt-2">{stats.todayCount}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-600/70">Today</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white"><Filter className="h-4 w-4" /></span>
          <h3 className="text-sm font-bold text-gray-800">Select Criteria</h3>
          <span className="ml-auto text-xs text-gray-400 hidden sm:inline">{filtered.length} filtered of {records.length}</span>
        </div>
        <form onSubmit={(e) => { e.preventDefault() }} className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">From Date</label>
              <input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">To Date</label>
              <input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Call Type</label>
              <select value={filterCallType} onChange={(e) => setFilterCallType(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white shadow-sm">
                <option value="">All Calls</option>
                <option value="Incoming">Incoming</option>
                <option value="Outgoing">Outgoing</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="flex-1 h-9 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-xl hover:opacity-95 shadow-md flex items-center justify-center gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
              <button type="button" onClick={() => { setFilterFromDate(""); setFilterToDate(""); setFilterCallType("") }} className="h-9 px-3 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50">Reset</button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-600" /> Phone Call Log</h3>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white px-3 py-1.5 border border-gray-200 rounded-full hover:bg-gray-50 shadow-sm">
              <Upload className="h-3.5 w-3.5" />
              Import
            </button>
            <div className="relative" ref={exportRef}>
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white px-3 py-1.5 border border-gray-200 rounded-full hover:bg-gray-50 shadow-sm">
                <Download className="h-3.5 w-3.5" />
                Export
                <ChevronDown className="h-3 w-3" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[120px] overflow-hidden">
                  <button onClick={exportCSV} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
                  <button onClick={exportExcel} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel</button>
                  <button onClick={exportPDF} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
                </div>
              )}
            </div>
            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white px-3 py-1.5 border border-gray-200 rounded-full hover:bg-gray-50 shadow-sm">
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button onClick={() => { setForm({ ...emptyForm }); setErrors({}); setShowAddModal(true) }} className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 rounded-full hover:opacity-95 shadow-md">
              <Plus className="h-3.5 w-3.5" />
              Add Call
            </button>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase">#</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase">Name</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase">Phone</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase">Date</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase">Follow Up</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase">Duration</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase">Type</th>
                <th className="text-right px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border"><Phone className="h-5 w-5 text-gray-400" /></div>
                    <p className="text-sm text-gray-500 mt-2">No phone call logs found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((record, idx) => (
                  <tr key={record.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * rowsPerPage + idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{record.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{record.phone}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 flex items-center gap-1"><Calendar className="h-3 w-3 text-gray-400" />{record.date ? new Date(record.date).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{record.followUpDate ? new Date(record.followUpDate).toLocaleDateString("en-IN") : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs font-bold bg-slate-50 border px-2 py-1 rounded-full"><Clock className="h-3 w-3 text-gray-400" />{record.callDuration || "—"}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${record.callType === "Incoming" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                        {record.callType === "Incoming" ? <PhoneIncoming className="h-3 w-3" /> : <PhoneOutgoing className="h-3 w-3" />}
                        {record.callType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right print:hidden">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setViewId(record.id!); setShowViewModal(true) }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-100" title="View"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleEdit(record.id!)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-xl border border-transparent hover:border-amber-100" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(record.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1) }} className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
          <span>Showing {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} records</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-2.5 py-1 border border-gray-200 rounded-full text-xs disabled:opacity-40 hover:bg-white bg-white">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2).map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-0">
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1">...</span>}
                <button onClick={() => setPage(p)} className={`px-2.5 py-1 rounded-full text-xs font-bold ${page === p ? "bg-emerald-600 text-white shadow" : "border border-gray-200 bg-white hover:bg-gray-50"}`}>{p}</button>
              </span>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="px-2.5 py-1 border border-gray-200 rounded-full text-xs disabled:opacity-40 hover:bg-white bg-white">Next</button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:overflow-visible, .print\\:overflow-visible * { visibility: visible; }
          .print\\:overflow-visible { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          .space-y-5 > *:not(:last-child) { display: none; }
          .space-y-5 > .bg-white.rounded-2xl:last-of-type { display: block !important; }
          .bg-white.rounded-2xl { border: 1px solid #ddd !important; }
          th, td { padding: 6px 8px !important; font-size: 10px !important; }
        }
      `}</style>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-600" /> Add Phone Call Log</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-white rounded-xl"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-6">{renderFormFields()}</div>
            <div className="px-6 py-4 border-t bg-gray-50/50 flex justify-end">
              <button onClick={handleAdd} className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-xl hover:opacity-95 shadow-md">Save Call</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Pencil className="h-4 w-4 text-amber-600" /> Edit Phone Call Log</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-white rounded-xl"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-6">{renderFormFields()}</div>
            <div className="px-6 py-4 border-t bg-gray-50/50 flex justify-end">
              <button onClick={handleUpdate} className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl shadow-md">Update</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewId && (() => {
        const v = records.find((x) => x.id === viewId)
        if (!v) return null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowViewModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white"><Phone className="h-5 w-5" /></span>
                <div>
                  <h3 className="text-base font-bold text-white">{v.name}</h3>
                  <p className="text-xs text-white/80">{v.phone} • {v.callType}</p>
                </div>
                <button onClick={() => setShowViewModal(false)} className="ml-auto p-1.5 bg-white/20 rounded-xl hover:bg-white/30"><X className="h-4 w-4 text-white" /></button>
              </div>
              <div className="p-5 space-y-3">
                {[
                  ["Date", v.date ? new Date(v.date).toLocaleDateString("en-IN") : "—"],
                  ["Next Follow Up", v.followUpDate ? new Date(v.followUpDate).toLocaleDateString("en-IN") : "—"],
                  ["Duration", v.callDuration || "—"],
                  ["Type", v.callType],
                  ["Description", v.description || "—"],
                  ["Note", v.note || "—"],
                ].map(([k, val]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{k}</span>
                    <span className="text-sm font-medium text-gray-800 max-w-[60%] text-right truncate">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b bg-red-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white"><Trash2 className="h-4 w-4" /></span>
              <div><h3 className="text-base font-bold text-gray-800">Confirm Delete</h3><p className="text-xs text-gray-500">This cannot be undone</p></div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Delete call log for <strong className="text-gray-800">{records.find((r) => r.id === deleteId)?.name}</strong> ?</p>
            </div>
            <div className="px-5 py-4 border-t bg-gray-50/50 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 shadow-md">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
