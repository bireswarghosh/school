"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useRef, useEffect, useMemo } from "react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { Search, Plus, Eye, Pencil, Trash2, X, Download, Upload, Printer, ChevronDown, Clock } from "lucide-react"

type MeetingWith = "" | "Student" | "Staff"

type VisitorRecord = {
  id: number
  purpose: string
  meetingWith: MeetingWith
  meetingPerson: string
  meetingPersonId: string
  visitorName: string
  phone: string
  idCard: string
  noOfPerson: number
  date: string
  inTime: string
  outTime: string
  note: string
  document: string
  classVal: string
  section: string
}

const purposeOptions = ["Marketing", "Parent Teacher Meeting", "Student Meeting", "Staff Meeting", "Principal Meeting", "School Events", "Curriculum Enrichment", "Book Supply", "Delivery", "General Enquiry", "Other"]
const staffOptions = [
  { name: "Joe Black", id: "9000" },
  { name: "Shivam Verma", id: "9002" },
  { name: "Brandon Heart", id: "9006" },
  { name: "William Abbot", id: "9003" },
  { name: "Jason Sharlton", id: "90006" },
  { name: "James Deckar", id: "9004" },
  { name: "Maria Ford", id: "9005" },
  { name: "Nishant Khare", id: "1002" },
  { name: "Aman Verma", id: "654" },
]
const studentOptions = [
  { name: "Rahul Sharma", id: "110025" },
  { name: "Arjun Nair", id: "18001" },
  { name: "Edward Thomas", id: "18001" },
  { name: "Arpit Patel", id: "326260" },
  { name: "Priya Gupta", id: "110026" },
]

const today = () => new Date().toISOString().split("T")[0]

const emptyForm = {
  purpose: "",
  meetingWith: "" as MeetingWith,
  meetingPerson: "",
  meetingPersonId: "",
  visitorName: "",
  phone: "",
  idCard: "",
  noOfPerson: 1,
  date: today(),
  inTime: "",
  outTime: "",
  note: "",
  document: "",
  classId: "",
  sectionId: "",
  staffId: "",
}

const colLabels: Record<string, string> = {
  purpose: "Purpose", meetingWith: "Meeting With", visitorName: "Visitor Name",
  phone: "Phone", idCard: "ID Card", noOfPerson: "No Of Person",
  date: "Date", inTime: "In Time", outTime: "Out Time", note: "Note",
}

const cols = Object.keys(colLabels)

function csvRow(row: Record<string, any>) {
  return cols.map((k) => `"${(row[k] ?? "").toString().replace(/"/g, '""')}"`).join(",")
}

function personLabel(v: VisitorRecord) {
  if (v.meetingWith === "Staff") {
    const s = staffOptions.find((x) => x.id === v.meetingPersonId)
    return s ? `${s.name} (${s.id})` : v.meetingPerson
  }
  if (v.meetingWith === "Student") {
    if (v.meetingPerson) {
      const s = studentOptions.find((x) => x.name === v.meetingPerson)
      return s ? `${s.name} (${s.id})` : v.meetingPerson
    }
    const s = studentOptions.find((x) => x.id === v.meetingPersonId)
    return s ? `${s.name} (${s.id})` : v.meetingPersonId
  }
  return ""
}

function Modal({
  title, show, onClose, children, footer,
}: {
  title: string; show: boolean; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode
}) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10">
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

export default function VisitorBookPage() {
  const { classNames: classOptions, sectionNames: sectionOptions } = useClassesAndSections()
  const { data: visitors, add, update, remove, loading } = useApi<VisitorRecord>("/api/front-office/visitor-book")
  const fileRef = useRef<HTMLInputElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importError, setImportError] = useState("")
  const [importSuccess, setImportSuccess] = useState("")
  const [viewId, setViewId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [searchPurpose, setSearchPurpose] = useState("")
  const [searchDateFrom, setSearchDateFrom] = useState("")
  const [searchDateTo, setSearchDateTo] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const filtered = useMemo(() => {
    return visitors.filter((v) => {
      if (searchPurpose && v.purpose !== searchPurpose) return false
      if (searchDateFrom && v.date < searchDateFrom) return false
      if (searchDateTo && v.date > searchDateTo) return false
      return true
    })
  }, [visitors, searchPurpose, searchDateFrom, searchDateTo])

  useEffect(() => { setPage(1) }, [searchPurpose, searchDateFrom, searchDateTo, visitors.length])

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
    if (!form.purpose) errs.purpose = "Purpose is required"
    if (!form.visitorName.trim()) errs.visitorName = "Visitor name is required"
    if (!form.phone.trim()) errs.phone = "Phone is required"
    if (!form.date.trim()) errs.date = "Date is required"
    if (!form.inTime.trim()) errs.inTime = "In Time is required"
    if (form.meetingWith === "Staff" && !form.staffId) errs.staffId = "Staff is required"
    if (form.meetingWith === "Student" && !form.classId) errs.classId = "Class is required"
    if (form.meetingWith === "Student" && !form.sectionId) errs.sectionId = "Section is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const buildRecord = (formData: typeof emptyForm) => {
    let meetingPerson = ""
    let meetingPersonId = ""
    let classVal = ""
    let section = ""
    if (formData.meetingWith === "Staff" && formData.staffId) {
      const staff = staffOptions.find((s) => s.id === formData.staffId)
      if (staff) {
        meetingPerson = staff.name
        meetingPersonId = staff.id
      }
    } else if (formData.meetingWith === "Student") {
      classVal = formData.classId || ""
      section = formData.sectionId || ""
      meetingPerson = formData.meetingPerson || ""
      meetingPersonId = formData.meetingPersonId || ""
    }
    return { meetingPerson, meetingPersonId, classVal, section }
  }

  const handleAdd = async () => {
    if (!validateForm()) return
    try {
      const { meetingPerson, meetingPersonId, classVal, section } = buildRecord(form)
      await add({
        purpose: form.purpose,
        meetingWith: form.meetingWith || "Staff",
        meetingPerson,
        meetingPersonId,
        classVal,
        section,
        visitorName: form.visitorName,
        phone: form.phone,
        idCard: form.idCard,
        noOfPerson: form.noOfPerson as number,
        date: form.date,
        inTime: form.inTime,
        outTime: form.outTime,
        note: form.note,
        document: form.document,
      })
      setShowAddModal(false)
      setForm({ ...emptyForm })
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const handleEdit = (id: number) => {
    const record = visitors.find((v) => v.id === id)
    if (!record) return
    setEditId(id)
    setForm({
      purpose: record.purpose,
      meetingWith: record.meetingWith,
      meetingPerson: record.meetingWith === "Student" ? (record.meetingPerson || personLabel(record)) : record.meetingPerson,
      meetingPersonId: record.meetingPersonId || "",
      visitorName: record.visitorName,
      phone: record.phone,
      idCard: record.idCard,
      noOfPerson: record.noOfPerson,
      date: record.date,
      inTime: record.inTime,
      outTime: record.outTime,
      note: record.note,
      document: record.document,
      classId: record.meetingWith === "Student" ? (record.classVal || "") : "",
      sectionId: record.meetingWith === "Student" ? (record.section || "") : "",
      staffId: record.meetingWith === "Staff" ? (record.meetingPersonId || "") : "",
    })
    setErrors({})
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!validateForm() || editId === null) return
    try {
      const { meetingPerson, meetingPersonId, classVal, section } = buildRecord(form)
      await update(editId, {
        purpose: form.purpose,
        meetingWith: form.meetingWith || "Staff",
        meetingPerson,
        meetingPersonId,
        classVal,
        section,
        visitorName: form.visitorName,
        phone: form.phone,
        idCard: form.idCard,
        noOfPerson: form.noOfPerson as number,
        date: form.date,
        inTime: form.inTime,
        outTime: form.outTime,
        note: form.note,
        document: form.document,
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
  const demoCsv = () => {
    const headers = ["visitorName", "phone", "purpose", "meetingWith", "meetingPerson", "meetingPersonId", "classVal", "section", "idCard", "noOfPerson", "date", "inTime", "outTime", "note"]
    const row = ["Rahul Kumar", "9812345678", "Parent Teacher Meeting", "Staff", "Joe Black", "9000", "", "", "ID101", "2", "2026-08-03", "09:00", "10:00", "Met for admission enquiry"]
    const csv = [headers.join(","), row.join(",")].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    downloadBlob(blob, "visitor-book-demo.csv")
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError("")
    setImportSuccess("")
    try {
      const text = await file.text()
      const lines = text.split("\n").filter((l) => l.trim())
      if (lines.length < 2) {
        setImportError("CSV must have a header row and at least one data row")
        return
      }
      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
      const records: any[] = []
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
        if (vals.length < 2) continue
        const rec: any = {}
        headers.forEach((h, idx) => { rec[h] = vals[idx] || "" })
        if (rec.visitorName) records.push(rec)
      }
      if (records.length === 0) {
        setImportError("No valid records found in CSV. Make sure the 'visitorName' column is filled.")
        return
      }
      const res = await fetch("/api/front-office/visitor-book", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Import failed")
      }
      setImportSuccess(`Imported ${records.length} records successfully`)
    } catch (e: any) {
      setImportError(e.message || "Import failed")
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  /* ── Export ── */
  const exportCSV = () => {
    const csv = [csvRow(colLabels), ...filtered.map((r) => csvRow(r))].join("\n")
    downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), "visitor-book.csv")
    setShowExportMenu(false)
  }

  const exportExcel = () => {
    let html = `<table><tr>${cols.map((k) => `<th>${colLabels[k]}</th>`).join("")}</tr>`
    filtered.forEach((r: any) => {
      html += `<tr>${cols.map((k) => `<td>${(r[k] ?? "").toString().replace(/"/g, "&quot;")}</td>`).join("")}</tr>`
    })
    html += `</table>`
    downloadBlob(new Blob([html], { type: "application/vnd.ms-excel" }), "visitor-book.xls")
    setShowExportMenu(false)
  }

  const exportPDF = () => { setShowExportMenu(false); window.print() }
  const handlePrint = () => window.print()

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  const getMeetingWithDisplay = (v: VisitorRecord) => {
    const label = personLabel(v)
    if (v.meetingWith === "Staff") {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="text-xs font-medium text-[var(--primary)] bg-[var(--primary-light)] px-1.5 py-0.5 rounded">Staff</span>
          <span className="text-gray-700">{label || v.meetingPersonId}</span>
        </span>
      )
    }
    if (v.meetingWith === "Student") {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Student</span>
          <span className="text-gray-700">{label || v.meetingPersonId}</span>
        </span>
      )
    }
    return <span className="text-gray-400">-</span>
  }

  const renderMeetingWithFields = () => {
    if (form.meetingWith === "Student") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class <span className="text-red-400">*</span></label>
            <select value={form.classId} onChange={(e) => handleInputChange("classId", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
              <option value="">Select</option>
              {classOptions.map((opt, i) => (
                <option key={opt} value={String(i + 1)}>{opt}</option>
              ))}
            </select>
            {errors.classId && <p className="text-red-400 text-xs mt-0.5">{errors.classId}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Section <span className="text-red-400">*</span></label>
            <select value={form.sectionId} onChange={(e) => handleInputChange("sectionId", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
              <option value="">Select</option>
              {sectionOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.sectionId && <p className="text-red-400 text-xs mt-0.5">{errors.sectionId}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Student <span className="text-red-400">*</span></label>
            <select
              value={form.meetingPerson}
              onChange={(e) => {
                const selected = studentOptions.find((s) => s.name === e.target.value)
                setForm((prev) => ({ ...prev, meetingPerson: e.target.value, meetingPersonId: selected?.id || "" }))
              }}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
            >
              <option value="">Select</option>
              {studentOptions.map((opt) => (
                <option key={opt.name} value={opt.name}>{opt.name} ({opt.id})</option>
              ))}
            </select>
          </div>
        </div>
      )
    }
    if (form.meetingWith === "Staff") {
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Staff <span className="text-red-400">*</span></label>
          <select
            value={form.staffId}
            onChange={(e) => handleInputChange("staffId", e.target.value)}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
          >
            <option value="">Select</option>
            {staffOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.name} ({opt.id})</option>
            ))}
          </select>
          {errors.staffId && <p className="text-red-400 text-xs mt-0.5">{errors.staffId}</p>}
        </div>
      )
    }
    return null
  }

  const FormFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Purpose <span className="text-red-400">*</span></label>
          <select value={form.purpose} onChange={(e) => handleInputChange("purpose", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
            <option value="">Select</option>
            {purposeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.purpose && <p className="text-red-400 text-xs mt-0.5">{errors.purpose}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Meeting With</label>
          <select value={form.meetingWith} onChange={(e) => {
            setForm((prev) => ({ ...prev, meetingWith: e.target.value as MeetingWith, classId: "", sectionId: "", staffId: "", meetingPerson: "", meetingPersonId: "" }))
          }} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
            <option value="">Select</option>
            <option value="Student">Student</option>
            <option value="Staff">Staff</option>
          </select>
        </div>
      </div>

      {renderMeetingWithFields()}

      <hr className="border-gray-200" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Visitor Name <span className="text-red-400">*</span></label>
          <input type="text" value={form.visitorName} onChange={(e) => handleInputChange("visitorName", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter visitor name" />
          {errors.visitorName && <p className="text-red-400 text-xs mt-0.5">{errors.visitorName}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone <span className="text-red-400">*</span></label>
          <input type="text" value={form.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter phone number" />
          {errors.phone && <p className="text-red-400 text-xs mt-0.5">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">ID Card</label>
          <input type="text" value={form.idCard} onChange={(e) => handleInputChange("idCard", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter ID card number" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Number Of Person</label>
          <input type="number" min={1} value={form.noOfPerson} onChange={(e) => handleInputChange("noOfPerson", parseInt(e.target.value) || 1)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date <span className="text-red-400">*</span></label>
          <input type="date" value={form.date} onChange={(e) => handleInputChange("date", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          {errors.date && <p className="text-red-400 text-xs mt-0.5">{errors.date}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">In Time <span className="text-red-400">*</span></label>
          <div className="relative">
            <input type="time" value={form.inTime} onChange={(e) => handleInputChange("inTime", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.inTime && <p className="text-red-400 text-xs mt-0.5">{errors.inTime}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Out Time</label>
          <div className="relative">
            <input type="time" value={form.outTime} onChange={(e) => handleInputChange("outTime", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Attach Document</label>
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            handleInputChange("document", file ? file.name : "")
          }}
          className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[var(--primary-light)] file:text-[var(--primary)] hover:file:bg-orange-100"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
        <textarea value={form.note} onChange={(e) => handleInputChange("note", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter any notes..." />
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Visitor Book</h2>
          <p className="text-xs text-gray-500 mt-0.5">Front Office / Visitor Book</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-2.5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-indigo-500" />
            Select Criteria
          </h3>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Purpose</label>
              <select value={searchPurpose} onChange={(e) => setSearchPurpose(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                <option value="">Select</option>
                {purposeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
              <input type="date" value={searchDateFrom} onChange={(e) => setSearchDateFrom(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
              <input type="date" value={searchDateTo} onChange={(e) => setSearchDateTo(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="h-9 px-4 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200">
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
              <button type="button" onClick={() => { setSearchPurpose(""); setSearchDateFrom(""); setSearchDateTo("") }} className="h-9 px-3 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-800">Visitor List</h3>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
            <button
              onClick={() => { setImportError(""); setImportSuccess(""); setShowImportModal(true) }}
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
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-4 py-2 rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Purpose</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Meeting With</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Visitor Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">ID Card</th>
                <th className="text-center px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">No. of Person</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">In Time</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Out Time</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-gray-300" />
                      <span className="text-sm">No visitors found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((visitor, idx) => (
                  <tr key={visitor.id} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{(page - 1) * rowsPerPage + idx + 1}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{visitor.purpose}</span>
                    </td>
                    <td className="px-4 py-2.5">{getMeetingWithDisplay(visitor)}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{visitor.visitorName}</td>
                    <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{visitor.phone}</td>
                    <td className="px-4 py-2.5 text-gray-600">{visitor.idCard || <span className="text-gray-300">-</span>}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{visitor.noOfPerson}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{visitor.date}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        <Clock className="h-3 w-3 text-amber-500" />
                        {visitor.inTime}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {visitor.outTime ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {visitor.outTime}
                        </span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right print:hidden">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => { setViewId(visitor.id); setShowViewModal(true) }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {visitor.document && (
                          <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleEdit(visitor.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(visitor.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
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
          .space-y-5 > *:not(:last-child) { display: none; }
          .space-y-5 > .bg-white.rounded-xl:last-of-type { display: block !important; }
          .bg-white.rounded-xl { border: 1px solid #ddd !important; }
          th, td { padding: 6px 8px !important; font-size: 10px !important; }
        }
      `}</style>

      {/* Add Modal */}
      <Modal
        title="Add Visitor"
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        footer={
          <>
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">Save</button>
          </>
        }
      >
        {FormFields()}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Visitor"
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        footer={
          <>
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleUpdate} className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">Save</button>
          </>
        }
      >
        {FormFields()}
      </Modal>

      {/* View Modal */}
      <Modal
        title="Visitor Details"
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        footer={
          <button onClick={() => setShowViewModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
        }
      >
        {viewId && (() => {
          const v = visitors.find((x) => x.id === viewId)
          if (!v) return null
          const initials = (v.visitorName || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
          const detailRows = [
            { label: "Phone", value: v.phone },
            { label: "ID Card", value: v.idCard || "-" },
            { label: "Purpose", value: v.purpose },
            { label: "Meeting With", value: v.meetingWith ? `${v.meetingWith}${v.meetingWith === "Student" ? ` (${v.classVal || ""} ${v.section || ""})` : ""}` : "-" },
            { label: "Person", value: personLabel(v) || "-" },
            { label: "No. of Person", value: String(v.noOfPerson) },
            { label: "Date", value: v.date },
            { label: "In Time", value: v.inTime || "-" },
            { label: "Out Time", value: v.outTime || "-" },
            { label: "Document", value: v.document || "-" },
          ]
          return (
            <div className="space-y-4">
              {/* Header card */}
              <div className="bg-gradient-to-r from-indigo-50 to-[var(--primary-light)] rounded-xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-lg font-bold shadow-sm flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-gray-800 truncate">{v.visitorName}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">{v.meetingWith || "Visitor"}</span>
                    {v.purpose && <span className="text-gray-400">•</span>}
                    <span>{v.purpose}</span>
                  </p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {detailRows.map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{item.label}</span>
                    <p className="text-sm text-gray-800 mt-0.5 font-medium break-words">{item.value}</p>
                  </div>
                ))}
              </div>

              {v.note && (
                <div>
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Note</span>
                  <p className="text-sm text-gray-700 mt-1 bg-amber-50 border border-amber-100 rounded-lg p-3">{v.note}</p>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Import Visitor Book"
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        footer={
          <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
        }
      >
        <div className="space-y-4">
          {/* Download demo */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-indigo-900">Demo CSV File</p>
                <p className="text-xs text-indigo-700 mt-0.5">Download a sample file with the correct column headers and one example row to follow.</p>
              </div>
            </div>
            <button
              onClick={demoCsv}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </button>
          </div>

          {/* Guidelines */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Import Guidelines</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-600">
              <li>Download the demo CSV file above and open it in any spreadsheet editor (Excel / Google Sheets).</li>
              <li>The <strong>first row must be the header</strong> — do not rename, remove, or reorder the columns.</li>
              <li>Fill one visitor per row. The <strong>visitorName</strong> column is required for each row.</li>
              <li>For <strong>Meeting With Student</strong>: set <em>meetingWith</em> to "Student" and fill <em>className</em> / <em>section</em>. For <strong>Staff</strong>: set <em>meetingWith</em> to "Staff" and fill <em>meetingPerson</em> / <em>meetingPersonId</em>.</li>
              <li>Use <strong>date</strong> format <em>YYYY-MM-DD</em> (e.g. 2026-08-03) and <strong>inTime / outTime</strong> as <em>HH:MM</em> (e.g. 09:00).</li>
              <li>Rows with an empty <strong>visitorName</strong> are skipped automatically.</li>
              <li>Keep the file in <strong>.csv</strong> format and upload it using the button below.</li>
            </ol>
          </div>

          {/* File upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            <Upload className="h-7 w-7 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Select a CSV file to import</p>
            <p className="text-xs text-gray-400 mb-3">Only .csv files are accepted</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Choose File
            </button>
          </div>

          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-red-700">{importError}</p>
            </div>
          )}
          {importSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-emerald-700">{importSuccess}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        title="Confirm Delete"
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        footer={
          <>
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={confirmDelete} className="px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200">Delete</button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete this visitor record?</p>
          {deleteId && (
            <p className="text-sm font-semibold text-gray-800">{visitors.find((v) => v.id === deleteId)?.visitorName}</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
