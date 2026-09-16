"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useRef, useEffect } from "react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { Search, Plus, Phone, Pencil, Trash2, X, Download, Upload, Printer, ChevronDown, Users, TrendingUp, Award, Calendar, UserCheck, Clock } from "lucide-react"

type EnquiryRecord = {
  id: number
  name: string
  phone: string
  source: string
  enquiryDate: string
  lastFollowUp: string
  nextFollowUp: string
  status: string
  classVal: string
  assigned: string
  reference: string
  noOfChild: number
  address: string
  description: string
  note: string
  email: string
}

const sourceOptions = ["Advertisement", "Online Front Site", "Google Ads", "Admission Campaign", "Front Office"]
const statusOptions = ["All", "Active", "Passive", "Dead", "Won", "Lost"]
const referenceOptions = ["Staff", "Parent", "Student", "Lower Wing", "Partner School", "Self"]
const assignedOptions = [
  "Joe Black (9000)", "Shivam Verma (9002)", "Brandon Heart (9006)",
  "William Abbot (9003)", "Jason Sharlton (90006)", "James Deckar (9004)",
  "Maria Ford (9005)", "Nishant Khare (1002)", "Aman Verma (654)",
]

const today = () => new Date().toISOString().split("T")[0]

const emptyForm = {
  name: "", phone: "", email: "", address: "", description: "", note: "",
  date: today(),
  followUpDate: today(),
  assigned: "", reference: "", source: "", classVal: "", noOfChild: 1,
}

type FollowUpRecord = {
  id: number
  admissionEnquiryId: number
  note: string
  followUpDate: string
  followUpTime: string
  status: string
  createdBy: string
  createdAt: string
}

const fmt = (d: string) => d ? d.split("T")[0] : ""

const colLabels: Record<string, string> = {
  name: "Name", phone: "Phone", email: "Email", source: "Source",
  enquiryDate: "Enquiry Date", lastFollowUp: "Last Follow Up", nextFollowUp: "Next Follow Up",
  status: "Status", classVal: "Class", assigned: "Assigned", reference: "Reference",
  noOfChild: "No Of Child", address: "Address", description: "Description", note: "Note",
}

const cols = Object.keys(colLabels)

function csvRow(row: Record<string, any>) {
  return cols.map((k) => `"${(row[k] ?? "").toString().replace(/"/g, '""')}"`).join(",")
}

export default function AdmissionEnquiryPage() {
  const { classNames } = useClassesAndSections()
  const classOptions = [...classNames]
  const { data: enquiries, add, update, remove, loading } = useApi<EnquiryRecord>("/api/front-office/admission-enquiry")
  const fileRef = useRef<HTMLInputElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [followUpId, setFollowUpId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [filterClass, setFilterClass] = useState("")
  const [filterSource, setFilterSource] = useState("")
  const [filterFromDate, setFilterFromDate] = useState("")
  const [filterToDate, setFilterToDate] = useState("")
  const [filterStatus, setFilterStatus] = useState("active")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([])
  const [fuLoading, setFuLoading] = useState(false)
  const [fuNote, setFuNote] = useState("")
  const [fuDate, setFuDate] = useState(today())
  const [fuTime, setFuTime] = useState(new Date().toTimeString().slice(0, 5))
  const [fuStatus, setFuStatus] = useState("Active")
  const [fuError, setFuError] = useState("")

  const filtered = enquiries.filter((e) => {
    if (filterClass && e.classVal !== filterClass) return false
    if (filterSource && e.source !== filterSource) return false
    if (filterStatus && filterStatus !== "all" && e.status.toLowerCase() !== filterStatus) return false
    if (filterFromDate && e.enquiryDate < filterFromDate) return false
    if (filterToDate && e.enquiryDate > filterToDate) return false
    return true
  })

  const stats = (() => {
    const total = enquiries.length
    const active = enquiries.filter((e) => e.status.toLowerCase() === "active").length
    const won = enquiries.filter((e) => e.status.toLowerCase() === "won").length
    const lost = enquiries.filter((e) => e.status.toLowerCase() === "lost").length
    return { total, active, won, lost }
  })()

  useEffect(() => { setPage(1) }, [filterClass, filterSource, filterFromDate, filterToDate, filterStatus, enquiries.length])

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

  const handleInputChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validateForm = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = "Name is required"
    if (!form.phone.trim()) errs.phone = "Phone is required"
    if (!form.date.trim()) errs.date = "Date is required"
    if (!form.followUpDate.trim()) errs.followUpDate = "Next Follow Up Date is required"
    if (!form.source) errs.source = "Source is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAdd = async () => {
    if (!validateForm()) return
    try {
      await add({
        name: form.name, phone: form.phone, email: form.email,
        source: form.source, enquiryDate: form.date,
        nextFollowUp: form.followUpDate, status: "Active",
        classVal: form.classVal, assigned: form.assigned, reference: form.reference,
        noOfChild: form.noOfChild as number, address: form.address,
        description: form.description, note: form.note,
      })
      setShowAddModal(false)
      setForm({ ...emptyForm })
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const handleEdit = (id: number) => {
    const record = enquiries.find((e) => e.id === id)
    if (!record) return
    setEditId(id)
    setForm({
      name: record.name, phone: record.phone, email: record.email,
      address: record.address, description: record.description, note: record.note,
      date: fmt(record.enquiryDate), followUpDate: fmt(record.nextFollowUp),
      assigned: record.assigned, reference: record.reference,
      source: record.source, classVal: record.classVal, noOfChild: record.noOfChild,
    })
    setErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!validateForm() || editId === null) return
    try {
      await update(editId, {
        name: form.name, phone: form.phone, email: form.email,
        source: form.source, enquiryDate: form.date,
        nextFollowUp: form.followUpDate, classVal: form.classVal,
        assigned: form.assigned, reference: form.reference,
        noOfChild: form.noOfChild as number, address: form.address,
        description: form.description, note: form.note,
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

  const handleFollowUp = async (id: number) => {
    setFollowUpId(id)
    setFuNote("")
    setFuError("")
    setFuDate(today())
    setFuTime(new Date().toTimeString().slice(0, 5))
    setFuStatus("Active")
    setShowFollowUpModal(true)
    await loadFollowUps(id)
  }

  const loadFollowUps = async (id: number) => {
    setFuLoading(true)
    try {
      const res = await fetch(`/api/front-office/admission-enquiry/followup?enquiryId=${id}`)
      const data = await res.json()
      setFollowUps(Array.isArray(data) ? data : [])
    } catch {
      setFollowUps([])
    } finally {
      setFuLoading(false)
    }
  }

  const addFollowUp = async () => {
    if (followUpId === null) return
    if (!fuNote.trim()) { setFuError("Note is required"); return }
    setFuError("")
    try {
      const res = await fetch("/api/front-office/admission-enquiry/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryId: followUpId,
          note: fuNote,
          followUpDate: fuDate,
          followUpTime: fuTime,
          status: fuStatus,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save follow up")
      }
      const created = await res.json()
      setFollowUps((prev) => [created, ...prev.filter((f) => f.id !== created.id)])
      setFuNote("")
      const enquiry = enquiries.find((e) => e.id === followUpId)
      if (enquiry) {
        await update(followUpId, {
          name: enquiry.name, phone: enquiry.phone, email: enquiry.email,
          source: enquiry.source, enquiryDate: enquiry.enquiryDate,
          nextFollowUp: enquiry.nextFollowUp, classVal: enquiry.classVal,
          assigned: enquiry.assigned, reference: enquiry.reference,
          noOfChild: enquiry.noOfChild, address: enquiry.address,
          description: enquiry.description, note: enquiry.note,
          lastFollowUp: fuDate || enquiry.lastFollowUp,
          status: fuStatus,
        })
      }
    } catch (e: any) {
      setFuError(e.message || "Failed to save follow up")
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

  /* ── Import ── */
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) return notify.error("CSV must have a header row and at least one data row")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
    const records: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      if (vals.length < 2) continue
      const rec: any = { status: "Active" }
      headers.forEach((h, idx) => { rec[h] = vals[idx] || "" })
      if (rec.name) records.push(rec)
    }
    if (records.length === 0) return notify.error("No valid records found in CSV")
    const res = await fetch("/api/front-office/admission-enquiry", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(records),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Import failed")
    }
    notify.success(`Imported ${records.length} records successfully`)
    if (fileRef.current) fileRef.current.value = ""
  }

  /* ── Export ── */
  const exportCSV = () => {
    const csv = [csvRow(colLabels), ...filtered.map((r) => csvRow(r))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    downloadBlob(blob, "admission-enquiry.csv")
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
    downloadBlob(blob, "admission-enquiry.xls")
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
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="text"
            value={form.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            value={form.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            rows={3}
          />
        </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <textarea
            value={form.note}
            onChange={(e) => handleInputChange("note", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            rows={3}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Next Follow Up Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.followUpDate}
            onChange={(e) => handleInputChange("followUpDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned</label>
          <select
            value={form.assigned}
            onChange={(e) => handleInputChange("assigned", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          >
            <option value="">Select</option>
            {assignedOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
          <select
            value={form.reference}
            onChange={(e) => handleInputChange("reference", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          >
            <option value="">Select</option>
            {referenceOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source <span className="text-red-500">*</span>
          </label>
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
          {errors.source && <p className="text-red-500 text-xs mt-1">{errors.source}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select
            value={form.classVal}
            onChange={(e) => handleInputChange("classVal", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          >
            <option value="">Select</option>
            {classOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number Of Child</label>
          <input
            type="number"
            min={1}
            value={form.noOfChild}
            onChange={(e) => handleInputChange("noOfChild", parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>
      </div>
    </>
  )

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block"><Users className="h-28 w-28 text-white" /></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Phone className="h-4 w-4 text-white" /></span>
            Admission Enquiry
          </h2>
          <p className="text-sm text-white/80 mt-1">Front Office / Manage prospective admissions • {enquiries.length} enquiries</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-blue-600"><Users className="h-4 w-4" /></span><TrendingUp className="h-4 w-4 text-blue-400" /></div>
          <p className="text-2xl font-black text-blue-700 mt-2">{stats.total}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-blue-600/70">Total Enquiries</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-emerald-600"><UserCheck className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{stats.active}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-600/70">Active</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-violet-600"><Award className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-violet-500" /></div>
          <p className="text-2xl font-black text-violet-700 mt-2">{stats.won}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-violet-600/70">Won</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-red-600"><Clock className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-red-500" /></div>
          <p className="text-2xl font-black text-red-700 mt-2">{stats.lost}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-red-600/70">Lost</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white"><Search className="h-4 w-4" /></span>
          <h3 className="text-sm font-bold text-gray-800">Select Criteria</h3>
          <span className="ml-auto text-xs text-gray-400 hidden sm:inline">{filtered.length} filtered of {enquiries.length}</span>
        </div>
        <form onSubmit={(e) => { e.preventDefault() }} className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Select</option>
                {classOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Select</option>
                {sourceOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Enquiry From Date</label>
              <input
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Enquiry To Date</label>
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /> Admission Enquiry</h3>
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Source</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Enquiry Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Last Follow Up</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Next Follow Up</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">No enquiries found</td>
                </tr>
              ) : (
                paginated.map((enquiry, idx) => (
                  <tr key={enquiry.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * rowsPerPage + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{enquiry.name}</td>
                    <td className="px-4 py-3 text-gray-600">{enquiry.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{enquiry.source}</td>
                    <td className="px-4 py-3 text-gray-600">{enquiry.enquiryDate}</td>
                    <td className="px-4 py-3 text-gray-600">{enquiry.lastFollowUp || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{enquiry.nextFollowUp}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass(enquiry.status)}`}>
                        {enquiry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right print:hidden">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleFollowUp(enquiry.id)}
                          className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors"
                          title="Follow Up"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(enquiry.id)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(enquiry.id)}
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Admission Enquiry</h3>
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
              <h3 className="text-lg font-semibold text-gray-800">Edit Admission Enquiry</h3>
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

      {/* Follow Up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFollowUpModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Follow Up Admission Enquiry</h3>
              <button onClick={() => setShowFollowUpModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {followUpId && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Follow up for enquiry: <strong>{enquiries.find((e) => e.id === followUpId)?.name}</strong>
                  </p>

                  {/* Follow Up Log */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Follow Up Log</label>
                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-gray-100">
                      {fuLoading ? (
                        <p className="p-4 text-sm text-gray-400">Loading...</p>
                      ) : followUps.length === 0 ? (
                        <p className="p-4 text-sm text-gray-400">No follow-ups recorded yet.</p>
                      ) : (
                        followUps.map((f) => (
                          <div key={f.id} className="p-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="font-medium text-gray-700">
                                  {f.followUpDate || (f.createdAt ? f.createdAt.split("T")[0] : "")}
                                  {f.followUpTime && <span className="ml-1">{f.followUpTime}</span>}
                                </span>
                                {f.createdBy && <span>by {f.createdBy}</span>}
                              </div>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(f.status)}`}>
                                {f.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{f.note}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Add Follow Up */}
                  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Follow Up Date</label>
                        <input
                          type="date"
                          value={fuDate}
                          onChange={(e) => setFuDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Follow Up Time</label>
                        <input
                          type="time"
                          value={fuTime}
                          onChange={(e) => setFuTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                        <select
                          value={fuStatus}
                          onChange={(e) => setFuStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        >
                          <option value="Active">Active</option>
                          <option value="Passive">Passive</option>
                          <option value="Dead">Dead</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Follow Up Note</label>
                      <textarea
                        rows={3}
                        value={fuNote}
                        onChange={(e) => setFuNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        placeholder="Enter follow up details..."
                      />
                      {fuError && <p className="text-red-500 text-xs mt-1">{fuError}</p>}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={addFollowUp}
                        className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"
                      >
                        Add Follow Up
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowFollowUpModal(false)}
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
                Are you sure you want to delete this enquiry record?
                {deleteId && (
                  <strong className="block mt-1 text-gray-800">
                    {enquiries.find((e) => e.id === deleteId)?.name}
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
