"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useMemo, useEffect } from "react"
import { Search, Eye, Pencil, Trash2, X, Download, Upload, Printer, Plus, FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useApi } from "@/lib/use-api"
import { importColumnMap, importHeaders, parseImportFile, buildStudentImportPayload, downloadSampleCSV, blankImportRow } from "@/lib/student-import"

type StudentRecord = {
  id: number
  admissionNo: string
  rollNo: string
  firstName: string
  middleName: string
  lastName: string
  class: string
  section: string
  gender: string
  dob: string
  category: string
  religion: string
  caste: string
  mobile: string
  email: string
  admissionDate: string
  bloodGroup: string
  house: string
  height: string
  weight: string
  measurementDate: string
  fatherName: string
  fatherPhone: string
  fatherOccupation: string
  motherName: string
  motherPhone: string
  motherOccupation: string
  guardianIs: string
  guardianName: string
  guardianRelation: string
  guardianEmail: string
  guardianPhone: string
  guardianOccupation: string
  guardianAddress: string
  currentAddress: string
  permanentAddress: string
  bankAccount: string
  bankName: string
  ifscCode: string
  nationalId: string
  localId: string
  rte: string
  address: string
  previousSchool: string
  note: string
  status?: string
}

const today = () => new Date().toISOString().split("T")[0]

const genderOptions = ["Male", "Female"]
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const guardianIsOptions = ["Father", "Mother", "Other"]
const yesNoOptions = ["Yes", "No"]

type ImportError = { row?: { admissionNo?: string; firstName?: string; lastName?: string; rollNo?: string }; error: string }
type ImportResult = { imported: number; failed: number; errors: ImportError[] }

const emptyForm = {
  admissionNo: "", rollNo: "", firstName: "", middleName: "", lastName: "", class: "", section: "",
  gender: "", dob: "", category: "", religion: "", caste: "", mobile: "", email: "",
  admissionDate: today(), bloodGroup: "", house: "",
  height: "", weight: "", measurementDate: today(),
  fatherName: "", fatherPhone: "", fatherOccupation: "",
  motherName: "", motherPhone: "", motherOccupation: "",
  guardianIs: "", guardianName: "", guardianRelation: "", guardianEmail: "", guardianPhone: "",
  guardianOccupation: "", guardianAddress: "",
  currentAddress: "", permanentAddress: "",
  bankAccount: "", bankName: "", ifscCode: "", nationalId: "", localId: "", rte: "",
  address: "", previousSchool: "", note: "",
}

export default function StudentDetailsPage() {
  const router = useRouter()
  const { data: students, add, remove, loading, refetch } = useApi<StudentRecord>("/api/student-information/student")
  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [keyword, setKeyword] = useState("")
  const [searched, setSearched] = useState(false)
  const [activeTab, setActiveTab] = useState<"list" | "details">("list")
  const [recordsPerPage, setRecordsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const [showImportModal, setShowImportModal] = useState(false)
  const [importClass, setImportClass] = useState("")
  const [importSection, setImportSection] = useState("")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([])

  const [viewRecord, setViewRecord] = useState<StudentRecord | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewTab, setViewTab] = useState("profile")
  const [feesData, setFeesData] = useState<any[]>([])

  const [addForm, setAddForm] = useState({ ...emptyForm })
  const [showAddModal, setShowAddModal] = useState(false)
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [classes, setClasses] = useState<{ id: number; name: string }[]>([])
  const [allSections, setAllSections] = useState<{ id: number; class_id: number; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [houses, setHouses] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/academics/class").then((r) => r.json()).then((d) => { setClasses(Array.isArray(d) ? d.sort((a: any, b: any) => a.id - b.id) : []) }),
      fetch("/api/academics/section").then((r) => r.json()).then((d) => { setAllSections(Array.isArray(d) ? d : []) }),
      fetch("/api/student-information/student-category").then((r) => r.json()).then((d) => { setCategories(Array.isArray(d) ? d : []) }),
      fetch("/api/student-information/student-house").then((r) => r.json()).then((d) => { setHouses(Array.isArray(d) ? d : []) }),
    ])
  }, [])

  useEffect(() => {
    if (showViewModal && viewRecord) {
      fetch("/api/fees/fees-payment")
        .then((r) => r.json())
        .then((d) => {
          const all = Array.isArray(d) ? d : []
          setFeesData(all.filter((f: any) => String(f.studentId) === String(viewRecord.id)))
        })
        .catch(() => setFeesData([]))
    }
  }, [showViewModal, viewRecord])

  const filteredSections = useMemo(() => {
    const cls = filterClass || addForm.class
    if (!cls) return []
    const classObj = classes.find((c) => c.name === cls)
    return classObj ? allSections.filter((s) => s.class_id === classObj.id) : []
  }, [filterClass, addForm.class, classes, allSections])

  const importSections = useMemo(() => {
    if (!importClass) return []
    const classObj = classes.find((c) => c.name === importClass)
    return classObj ? allSections.filter((s) => s.class_id === classObj.id) : []
  }, [importClass, classes, allSections])

  const filtered = useMemo(() => {
    const result = students.filter((s) => {
      if (filterClass && s.class !== filterClass) return false
      if (filterSection && s.section !== filterSection) return false
      if (keyword.trim()) {
        const kw = keyword.toLowerCase()
        const match = [s.firstName + " " + (s.middleName || "") + " " + s.lastName, s.rollNo, s.admissionNo, s.fatherName, s.motherName].join(" ").toLowerCase()
        if (!match.includes(kw)) return false
      }
      return true
    })
    return result
  }, [students, filterClass, filterSection, keyword])

  const canShowList = searched || (Boolean(filterClass) && Boolean(filterSection)) || keyword.trim().length > 0

  const totalPages = Math.max(1, Math.ceil(filtered.length / recordsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage
    return filtered.slice(start, start + recordsPerPage)
  }, [filtered, currentPage, recordsPerPage])

  const initials = (first: string | undefined | null, last: string | undefined | null) => {
    return ((first?.charAt(0) || "") + (last?.charAt(0) || "")).toUpperCase() || "?"
  }

  const avatarColors = ["bg-blue-500", "bg-pink-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500", "bg-cyan-500", "bg-amber-500"]

  const genderBadge = (g: string) => {
    switch (g) {
      case "Male": return "bg-blue-100 text-blue-800"
      case "Female": return "bg-pink-100 text-pink-800"
      default: return "bg-gray-100 text-gray-600"
    }
  }
  const categoryBadge = (c: string) => {
    switch (c) {
      case "General": return "bg-green-100 text-green-800"
      case "OBC": return "bg-orange-100 text-orange-800"
      case "SC": return "bg-purple-100 text-purple-800"
      case "ST": return "bg-teal-100 text-teal-800"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const validate = (f: typeof emptyForm) => {
    const errs: Record<string, string> = {}
    if (!f.firstName.trim()) errs.firstName = "Required"
    if (!f.lastName.trim()) errs.lastName = "Required"
    if (!f.admissionNo.trim()) errs.admissionNo = "Required"
    if (!f.rollNo.trim()) errs.rollNo = "Required"
    if (!f.class) errs.class = "Required"
    if (!f.gender) errs.gender = "Required"
    if (!f.mobile.trim()) errs.mobile = "Required"
    return errs
  }

  const handleAdd = async () => {
    const errs = validate(addForm)
    setAddErrors(errs)
    if (Object.keys(errs).length) return
    try {
      await add(addForm)
      setShowAddModal(false)
      setAddForm({ ...emptyForm })
    } catch (e: any) { notify.error(e.message) }
  }

  const fullName = (first: string | undefined | null, middle: string | undefined | null, last: string | undefined | null) =>
    [first, middle, last].filter((n) => n && n.trim()).join(" ")

  const handleEdit = (record: StudentRecord) => {
    router.push(`/admin/student-information/student-admission?edit=${record.id}`)
  }

  const handleDelete = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }
  const confirmDelete = async () => {
    if (deleteId === null) return
    try {
      await remove(deleteId)
      setShowDeleteModal(false); setDeleteId(null)
    } catch (e: any) { notify.error(e.message) }
  }

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearched(true); setCurrentPage(1) }

  const exportHeaders = [
    "Adm No", "Roll No", "First Name", "Middle Name", "Last Name", "Class", "Section", "Gender", "DOB",
    "Category", "Religion", "Caste", "Mobile", "Email", "Admission Date", "Blood Group", "House",
    "Height", "Weight", "Measurement Date", "Father Name", "Father Phone", "Father Occupation",
    "Mother Name", "Mother Phone", "Mother Occupation", "Guardian Is", "Guardian Name", "Guardian Relation",
    "Guardian Email", "Guardian Phone", "Guardian Occupation", "Guardian Address", "Current Address",
    "Permanent Address", "Bank Account No", "Bank Name", "IFSC Code", "National Identification No",
    "Local Identification No", "RTE", "Address", "Previous School", "Note",
  ]

  const exportRow = (r: StudentRecord) => [
    r.admissionNo, r.rollNo, r.firstName, r.middleName, r.lastName, r.class, r.section, r.gender, r.dob,
    r.category, r.religion, r.caste, r.mobile, r.email, r.admissionDate, r.bloodGroup, r.house,
    r.height, r.weight, r.measurementDate, r.fatherName, r.fatherPhone, r.fatherOccupation,
    r.motherName, r.motherPhone, r.motherOccupation, r.guardianIs, r.guardianName, r.guardianRelation,
    r.guardianEmail, r.guardianPhone, r.guardianOccupation, r.guardianAddress, r.currentAddress,
    r.permanentAddress, r.bankAccount, r.bankName, r.ifscCode, r.nationalId,
    r.localId, r.rte, r.address, r.previousSchool, r.note,
  ]

  const exportCSV = () => {
    const headers = exportHeaders
    const rows = filtered.map(exportRow)
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(","))].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "students.csv"; a.click()
  }

  const exportExcel = () => {
    const headers = exportHeaders
    const rows = filtered.map(exportRow)
    let html = "<table><tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr>"
    html += rows.map((r) => "<tr>" + r.map((c) => `<td>${c || ""}</td>`).join("") + "</tr>").join("")
    html += "</table>"
    const blob = new Blob([html], { type: "application/vnd.ms-excel" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "students.xls"; a.click()
  }

  const printTable = () => {
    const headers = exportHeaders
    const rows = filtered.map(exportRow)
    const today = new Date().toLocaleDateString()
    const rowsHtml = rows.map((r, i) =>
      `<tr>${r.map((c) => `<td>${c || "—"}</td>`).join("")}</tr>`
    ).join("")
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #1e293b; }
        .report { padding: 28px 32px; }
        .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #ff7732; padding-bottom: 14px; margin-bottom: 6px; }
        .brand { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: .3px; }
        .brand span { color: #ff7732; }
        .sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .meta { text-align: right; font-size: 12px; color: #6b7280; line-height: 1.7; }
        .title { text-align: center; font-size: 16px; font-weight: 700; color: #111827; margin: 16px 0 4px; }
        .count { text-align: center; font-size: 12px; color: #6b7280; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        thead th { background: #ff7732; color: #fff; font-weight: 700; text-align: left; padding: 9px 8px; border: 1px solid #e06a27; white-space: nowrap; }
        tbody td { padding: 7px 8px; border: 1px solid #e5e7eb; color: #334155; vertical-align: top; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody tr { page-break-inside: avoid; }
        .foot { margin-top: 20px; display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; }
        @media print { @page { size: landscape; margin: 10mm; } .report { padding: 0; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>
      <div class="report">
        <div class="head">
          <div>
            <div class="brand">Smart <span>School</span> — Student Details</div>
            <div class="sub">Student Information / Student Details report</div>
          </div>
          <div class="meta">Printed: ${today}<br>Records: ${rows.length} student${rows.length === 1 ? "" : "s"}</div>
        </div>
        <div class="title">Student List</div>
        <div class="count">Showing ${rows.length} of ${filtered.length} record${filtered.length === 1 ? "" : "s"}</div>
        <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rowsHtml}</tbody></table>
        <div class="foot"><span>Generated by Smart School</span><span>Page 1</span></div>
      </div></body></html>`
    const w = window.open("", "", "width=1200,height=800"); if (!w) return
    w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { preview, error } = parseImportFile(text)
      if (error) {
        setImportPreview([])
        setImportResult({ imported: 0, failed: 1, errors: [{ error }] })
      } else {
        setImportPreview(preview)
      }
    }
    reader.readAsText(file)
  }

  const handleImportStudents = async () => {
    if (importPreview.length === 0) return
    if (!importClass || !importSection) {
      notify.error("Please select Class and Section before importing")
      return
    }
    setImporting(true)
    try {
      const payload = buildStudentImportPayload(importPreview).map((r) => ({ ...r, class: importClass, section: importSection }))
      const res = await fetch("/api/student-information/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Import failed")
      }
      const result = await res.json()
      const created = Array.isArray(result.created) ? result.created.length : 0
      const errors: ImportError[] = (result.errors || []).map((er: any) => ({ row: er.row || undefined, error: er.error || "Unknown error" }))
      setImportResult({ imported: created, failed: errors.length, errors })
      setImportPreview([])
      setImportFile(null)
      if (errors.length === 0) {
        notify.success(`Successfully imported ${created} student${created === 1 ? "" : "s"}`)
      }
      refetch()
    } catch (e) {
      setImportResult({ imported: 0, failed: importPreview.length, errors: [{ error: e instanceof Error ? e.message : String(e) }] })
    } finally {
      setImporting(false)
    }
  }

  const updateImportCell = (rowIndex: number, field: string, value: string) => {
    setImportPreview((prev) => prev.map((rec, i) => (i === rowIndex ? { ...rec, [field]: value } : rec)))
  }

  const removeImportRow = (rowIndex: number) => {
    setImportPreview((prev) => prev.filter((_, i) => i !== rowIndex))
  }

  const addImportRow = () => {
    setImportPreview((prev) => [...prev, blankImportRow()])
  }

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = []
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages }
    pages.push(1)
    if (currentPage > 3) pages.push("...")
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push("...")
    pages.push(totalPages)
    return pages
  }, [totalPages, currentPage])

  const SectionLabel = ({ text }: { text: string }) => (
    <h5 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider border-b border-gray-100 pb-1.5">{text}</h5>
  )

  const FormFields = ({ form, errors, onChange }: { form: typeof emptyForm; errors: Record<string, string>; onChange: (f: string, v: string) => void }) => (
    <div className="space-y-4">
      <SectionLabel text="Basic Information" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Admission No <span className="text-red-500">*</span></label>
          <input type="text" value={form.admissionNo} onChange={(e) => onChange("admissionNo", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          {errors.admissionNo && <p className="text-red-500 text-xs mt-0.5">{errors.admissionNo}</p>}</div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Roll No <span className="text-red-500">*</span></label>
          <input type="text" value={form.rollNo} onChange={(e) => onChange("rollNo", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          {errors.rollNo && <p className="text-red-500 text-xs mt-0.5">{errors.rollNo}</p>}</div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Class <span className="text-red-500">*</span></label>
          <select value={form.class} onChange={(e) => { onChange("class", e.target.value); onChange("section", "") }} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
            <option value="">Select</option>{classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>{errors.class && <p className="text-red-500 text-xs mt-0.5">{errors.class}</p>}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
          <input type="text" value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          {errors.firstName && <p className="text-red-500 text-xs mt-0.5">{errors.firstName}</p>}</div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Middle Name</label>
          <input type="text" value={form.middleName} onChange={(e) => onChange("middleName", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Last Name <span className="text-red-500">*</span></label>
          <input type="text" value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          {errors.lastName && <p className="text-red-500 text-xs mt-0.5">{errors.lastName}</p>}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
          <select value={form.section} onChange={(e) => onChange("section", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
            <option value="">Select</option>{filteredSections.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Gender <span className="text-red-500">*</span></label>
          <select value={form.gender} onChange={(e) => onChange("gender", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
            <option value="">Select</option>{genderOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>{errors.gender && <p className="text-red-500 text-xs mt-0.5">{errors.gender}</p>}</div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
          <input type="date" value={form.dob} onChange={(e) => onChange("dob", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select value={form.category} onChange={(e) => onChange("category", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
            <option value="">Select</option>{categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Religion</label>
          <input type="text" value={form.religion} onChange={(e) => onChange("religion", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Caste</label>
          <input type="text" value={form.caste} onChange={(e) => onChange("caste", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Mobile <span className="text-red-500">*</span></label>
          <input type="text" value={form.mobile} onChange={(e) => onChange("mobile", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
          {errors.mobile && <p className="text-red-500 text-xs mt-0.5">{errors.mobile}</p>}</div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input type="text" value={form.email} onChange={(e) => onChange("email", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Admission Date</label>
          <input type="date" value={form.admissionDate} onChange={(e) => onChange("admissionDate", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Blood Group</label>
          <select value={form.bloodGroup} onChange={(e) => onChange("bloodGroup", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
            <option value="">Select</option>{bloodGroupOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">House</label>
          <select value={form.house} onChange={(e) => onChange("house", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
            <option value="">Select</option>{houses.map((h) => <option key={h.id} value={h.name}>{h.name}</option>)}
          </select></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Previous School</label>
          <input type="text" value={form.previousSchool} onChange={(e) => onChange("previousSchool", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
      </div>

      <SectionLabel text="Measurements" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
          <input type="text" value={form.height} onChange={(e) => onChange("height", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Weight</label>
          <input type="text" value={form.weight} onChange={(e) => onChange("weight", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Measurement Date</label>
          <input type="date" value={form.measurementDate} onChange={(e) => onChange("measurementDate", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
      </div>

      <SectionLabel text="Parent Details" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Father Name</label>
          <input type="text" value={form.fatherName} onChange={(e) => onChange("fatherName", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Father Phone</label>
          <input type="text" value={form.fatherPhone} onChange={(e) => onChange("fatherPhone", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Father Occupation</label>
          <input type="text" value={form.fatherOccupation} onChange={(e) => onChange("fatherOccupation", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Mother Name</label>
          <input type="text" value={form.motherName} onChange={(e) => onChange("motherName", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Mother Phone</label>
          <input type="text" value={form.motherPhone} onChange={(e) => onChange("motherPhone", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Mother Occupation</label>
          <input type="text" value={form.motherOccupation} onChange={(e) => onChange("motherOccupation", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
      </div>

      <SectionLabel text="Guardian Details" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Guardian Is</label>
          <select value={form.guardianIs} onChange={(e) => onChange("guardianIs", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
            <option value="">Select</option>{guardianIsOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Guardian Name</label>
          <input type="text" value={form.guardianName} onChange={(e) => onChange("guardianName", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Guardian Relation</label>
          <input type="text" value={form.guardianRelation} onChange={(e) => onChange("guardianRelation", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Guardian Email</label>
          <input type="text" value={form.guardianEmail} onChange={(e) => onChange("guardianEmail", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Guardian Phone</label>
          <input type="text" value={form.guardianPhone} onChange={(e) => onChange("guardianPhone", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Guardian Occupation</label>
          <input type="text" value={form.guardianOccupation} onChange={(e) => onChange("guardianOccupation", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
      </div>
      <div><label className="block text-xs font-medium text-gray-600 mb-1">Guardian Address</label>
        <textarea value={form.guardianAddress} onChange={(e) => onChange("guardianAddress", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>

      <SectionLabel text="Addresses" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Current Address</label>
          <textarea value={form.currentAddress} onChange={(e) => onChange("currentAddress", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Permanent Address</label>
          <textarea value={form.permanentAddress} onChange={(e) => onChange("permanentAddress", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
      </div>

      <SectionLabel text="Bank & Identification" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Bank Account No</label>
          <input type="text" value={form.bankAccount} onChange={(e) => onChange("bankAccount", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
          <input type="text" value={form.bankName} onChange={(e) => onChange("bankName", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code</label>
          <input type="text" value={form.ifscCode} onChange={(e) => onChange("ifscCode", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">National Identification No</label>
          <input type="text" value={form.nationalId} onChange={(e) => onChange("nationalId", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Local Identification No</label>
          <input type="text" value={form.localId} onChange={(e) => onChange("localId", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">RTE</label>
          <select value={form.rte} onChange={(e) => onChange("rte", e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
            <option value="">Select</option>{yesNoOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select></div>
      </div>

      <div><label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
        <textarea value={form.address} onChange={(e) => onChange("address", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
      <div><label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
        <textarea value={form.note} onChange={(e) => onChange("note", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" /></div>
    </div>
  )

  const Modal = ({ title, show, onClose, children, footer }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-5">{children}</div>
          {footer && <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-xl">{footer}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Student Details</h2>
          <p className="text-xs text-gray-500 mt-0.5">Student Information / Student Details</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">+ Add Student</button>
          <div className="relative group">
            <button className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />Export</button>
            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <button onClick={exportCSV} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-t-lg">CSV</button>
              <button onClick={exportExcel} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">Excel</button>
              <button onClick={printTable} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-b-lg">PDF</button>
            </div>
          </div>
          <button onClick={printTable} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"><Printer className="h-3.5 w-3.5" />Print</button>
          <button onClick={() => setShowImportModal(true)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" />Import</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Search className="h-4 w-4" />Select Criteria</h3>
        </div>
        <form onSubmit={handleSearch} className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setFilterSection("") }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] bg-white">
                <option value="">Select</option>{classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
              <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] bg-white">
                <option value="">Select</option>{filteredSections.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select></div>
            <div className="lg:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Keyword</label>
              <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search by name, roll no, admission no..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)]" /></div>
            <div className="flex items-end"><button type="submit" className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-2"><Search className="h-4 w-4" />Search</button></div>
          </div>
        </form>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          <button onClick={() => setActiveTab("list")} className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "list" ? "border-indigo-600 text-[var(--primary)]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>List View</button>
          <button onClick={() => setActiveTab("details")} className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "details" ? "border-indigo-600 text-[var(--primary)]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>Details View</button>
        </div>
      </div>

      {activeTab === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {!canShowList ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-gray-400">Please select Class &amp; Section or enter a keyword and click Search to view students.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Admission No</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Student Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Roll No</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Class</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Father Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">DOB</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Gender</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Mobile</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400"><span className="text-sm">No students found</span></td></tr>
                ) : (
                  paginated.map((s, idx) => (
                    <tr key={s.id} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.admissionNo}</td>
                      <td className="px-4 py-2.5 text-gray-800">{fullName(s.firstName, s.middleName, s.lastName)}</td>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{s.rollNo}</td>
                      <td className="px-4 py-2.5 text-gray-600">{s.class}</td>
                      <td className="px-4 py-2.5 text-gray-600">{s.fatherName}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{s.dob}</td>
                      <td className="px-4 py-2.5"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${genderBadge(s.gender)}`}>{s.gender}</span></td>
                      <td className="px-4 py-2.5"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryBadge(s.category)}`}>{s.category}</span></td>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{s.mobile}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button onClick={() => router.push(`/admin/student-information/student-details/${s.id}`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleEdit(s)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
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
              <span>Show</span>
              <select value={recordsPerPage} onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1) }} className="border border-gray-300 rounded px-2 py-1 text-xs bg-white">
                <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>
            <span>Showing {filtered.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1}-{Math.min(currentPage * recordsPerPage, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              {pageNumbers.map((p, i) => p === "..." ? <span key={`e${i}`} className="px-1">...</span> : <button key={`p${p}`} onClick={() => setCurrentPage(p as number)} className={`px-2 py-0.5 rounded text-xs font-medium ${currentPage === p ? "bg-[var(--primary)] text-white" : "hover:bg-gray-200 text-gray-600"}`}>{p}</button>)}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {activeTab === "details" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!canShowList ? (
            <div className="col-span-full text-center py-12 text-gray-400">Please select Class &amp; Section or enter a keyword and click Search to view students.</div>
          ) : paginated.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">No students found</div>
          ) : (
            paginated.map((s, idx) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm`}>
                    {initials(s.firstName, s.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">{fullName(s.firstName, s.middleName, s.lastName)}</h4>
                    <p className="text-xs text-gray-500">{s.admissionNo}</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Class / Section</span><span className="font-medium text-gray-700">{s.class} - {s.section}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Father Name</span><span className="font-medium text-gray-700">{s.fatherName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Mother Name</span><span className="font-medium text-gray-700">{s.motherName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">DOB</span><span className="font-medium text-gray-700">{s.dob}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Gender</span><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${genderBadge(s.gender)}`}>{s.gender}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Mobile</span><span className="font-medium text-gray-700">{s.mobile}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500">Category</span><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${categoryBadge(s.category)}`}>{s.category}</span></div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-gray-100">
                  <button onClick={() => router.push(`/admin/student-information/student-details/${s.id}`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleEdit(s)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal title="Add Student" show={showAddModal} onClose={() => { setShowAddModal(false); setAddErrors({}) }}
        footer={<><button onClick={() => { setShowAddModal(false); setAddErrors({}) }} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={handleAdd} className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] shadow-sm shadow-indigo-200">Save</button></>}>
        {FormFields({ form: addForm, errors: addErrors, onChange: (f, v) => { setAddForm((p) => ({ ...p, [f]: v })); if (addErrors[f]) setAddErrors((p) => ({ ...p, [f]: "" })) } })}
      </Modal>

      {showViewModal && viewRecord && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowViewModal(false); setViewTab("profile") }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto z-10">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200 rounded-t-xl">
              <div className="flex items-center justify-between px-6 py-3">
                <h3 className="text-base font-semibold text-gray-800">Student Profile</h3>
                <button onClick={() => { setShowViewModal(false); setViewTab("profile") }} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex gap-0 px-6 overflow-x-auto">
                {[
                  { key: "profile", label: "Profile" },
                  { key: "fees", label: "Fees" },
                  { key: "exam", label: "Exam" },
                  { key: "attendance", label: "Attendance" },
                  { key: "documents", label: "Documents" },
                  { key: "timeline", label: "Timeline" },
                  { key: "behaviour", label: "Behaviour" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setViewTab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      viewTab === tab.key
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6">
              {viewTab === "profile" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-5 pb-5 border-b border-gray-200">
                    <div className={`w-20 h-20 rounded-full ${avatarColors[viewRecord.id % avatarColors.length]} flex items-center justify-center text-white font-bold text-2xl shadow-md`}>
                      {initials(viewRecord.firstName, viewRecord.lastName)}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">{fullName(viewRecord.firstName, viewRecord.middleName, viewRecord.lastName)}</h2>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{viewRecord.class}{viewRecord.section ? ` - ${viewRecord.section}` : ""}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                        <span>Adm: {viewRecord.admissionNo}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                        <span>Roll: {viewRecord.rollNo}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${genderBadge(viewRecord.gender)}`}>{viewRecord.gender}</span>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryBadge(viewRecord.category)}`}>{viewRecord.category}</span>
                        {viewRecord.status && (
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${viewRecord.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{viewRecord.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-[11px]">Personal Details</h4>
                      <div className="space-y-3">
                        {[
                          { label: "Admission No", value: viewRecord.admissionNo },
                          { label: "Roll No", value: viewRecord.rollNo },
                          { label: "First Name", value: viewRecord.firstName },
                          { label: "Middle Name", value: viewRecord.middleName || "-" },
                          { label: "Last Name", value: viewRecord.lastName },
                          { label: "Class", value: viewRecord.class },
                          { label: "Section", value: viewRecord.section || "-" },
                          { label: "Date of Birth", value: viewRecord.dob || "-" },
                          { label: "Gender", value: viewRecord.gender, badge: genderBadge(viewRecord.gender) },
                          { label: "Blood Group", value: viewRecord.bloodGroup || "-" },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-xs text-gray-500">{item.label}</span>
                            {item.badge ? (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.badge}`}>{item.value}</span>
                            ) : (
                              <span className="text-sm font-medium text-gray-800">{item.value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-[11px]">Contact & Other Details</h4>
                      <div className="space-y-3">
                        {[
                          { label: "Mobile", value: viewRecord.mobile || "-" },
                          { label: "Email", value: viewRecord.email || "-" },
                          { label: "Address", value: viewRecord.address || "-" },
                          { label: "Religion", value: viewRecord.religion || "-" },
                          { label: "Caste", value: viewRecord.caste || "-" },
                          { label: "Category", value: viewRecord.category, badge: categoryBadge(viewRecord.category) },
                          { label: "House", value: viewRecord.house || "-" },
                          { label: "Admission Date", value: viewRecord.admissionDate || "-" },
                          { label: "Previous School", value: viewRecord.previousSchool || "-" },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-xs text-gray-500">{item.label}</span>
                            {item.badge ? (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.badge}`}>{item.value}</span>
                            ) : (
                              <span className="text-sm font-medium text-gray-800">{item.value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-[11px] mt-6">Measurements</h4>
                      <div className="space-y-3">
                        {[
                          { label: "Height", value: viewRecord.height || "-" },
                          { label: "Weight", value: viewRecord.weight || "-" },
                          { label: "Measurement Date", value: viewRecord.measurementDate || "-" },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-xs text-gray-500">{item.label}</span>
                            <span className="text-sm font-medium text-gray-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-[11px] mt-6">Parent Details</h4>
                      <div className="space-y-3">
                        {[
                          { label: "Father Name", value: viewRecord.fatherName || "-" },
                          { label: "Father Phone", value: viewRecord.fatherPhone || "-" },
                          { label: "Father Occupation", value: viewRecord.fatherOccupation || "-" },
                          { label: "Mother Name", value: viewRecord.motherName || "-" },
                          { label: "Mother Phone", value: viewRecord.motherPhone || "-" },
                          { label: "Mother Occupation", value: viewRecord.motherOccupation || "-" },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-xs text-gray-500">{item.label}</span>
                            <span className="text-sm font-medium text-gray-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-[11px] mt-6">Guardian Details</h4>
                      <div className="space-y-3">
                        {[
                          { label: "Guardian Is", value: viewRecord.guardianIs || "-" },
                          { label: "Guardian Name", value: viewRecord.guardianName || "-" },
                          { label: "Guardian Relation", value: viewRecord.guardianRelation || "-" },
                          { label: "Guardian Email", value: viewRecord.guardianEmail || "-" },
                          { label: "Guardian Phone", value: viewRecord.guardianPhone || "-" },
                          { label: "Guardian Occupation", value: viewRecord.guardianOccupation || "-" },
                          { label: "Guardian Address", value: viewRecord.guardianAddress || "-" },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-xs text-gray-500">{item.label}</span>
                            <span className="text-sm font-medium text-gray-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-[11px] mt-6">Addresses</h4>
                      <div className="space-y-3">
                        {[
                          { label: "Current Address", value: viewRecord.currentAddress || "-" },
                          { label: "Permanent Address", value: viewRecord.permanentAddress || "-" },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-xs text-gray-500">{item.label}</span>
                            <span className="text-sm font-medium text-gray-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-[11px] mt-6">Bank & Identification</h4>
                      <div className="space-y-3">
                        {[
                          { label: "Bank Account No", value: viewRecord.bankAccount || "-" },
                          { label: "Bank Name", value: viewRecord.bankName || "-" },
                          { label: "IFSC Code", value: viewRecord.ifscCode || "-" },
                          { label: "National Identification No", value: viewRecord.nationalId || "-" },
                          { label: "Local Identification No", value: viewRecord.localId || "-" },
                          { label: "RTE", value: viewRecord.rte || "-" },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-xs text-gray-500">{item.label}</span>
                            <span className="text-sm font-medium text-gray-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                      {viewRecord.note && (
                        <>
                          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-[11px] mt-6">Note</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewRecord.note}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {viewTab === "fees" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800">Fees History</h4>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Fees Group</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Fees Type</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Amount</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Payment Date</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Mode</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feesData.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-8 text-gray-400">No fee records found</td></tr>
                        ) : (
                          feesData.map((f, i) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="px-4 py-2.5 text-gray-700">{f.feesGroup || "-"}</td>
                              <td className="px-4 py-2.5 text-gray-700">{f.feesType || "-"}</td>
                              <td className="px-4 py-2.5 text-gray-700">${f.paidAmount || "0.00"}</td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs">{f.paymentDate || "-"}</td>
                              <td className="px-4 py-2.5 text-gray-700">{f.paymentMode || "-"}</td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${f.status === "Paid" ? "bg-green-100 text-green-800" : f.status === "Partial" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                                  {f.status || "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {viewTab === "exam" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800">Exam Results</h4>
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">No exam records available</p>
                  </div>
                </div>
              )}
              {viewTab === "attendance" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800">Attendance Record</h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                      <p className="text-2xl font-bold text-green-700">-</p>
                      <p className="text-xs text-green-600 mt-1">Present</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                      <p className="text-2xl font-bold text-red-700">-</p>
                      <p className="text-xs text-red-600 mt-1">Absent</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
                      <p className="text-2xl font-bold text-yellow-700">-</p>
                      <p className="text-xs text-yellow-600 mt-1">Holiday / Leave</p>
                    </div>
                  </div>
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm">Attendance data coming soon</p>
                  </div>
                </div>
              )}
              {viewTab === "documents" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800">Documents</h4>
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">No documents uploaded</p>
                  </div>
                </div>
              )}
              {viewTab === "timeline" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800">Timeline</h4>
                  <div className="relative pl-6 border-l-2 border-gray-200 space-y-4">
                    <div className="relative">
                      <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-[var(--primary)] border-2 border-white shadow" />
                      <p className="text-sm font-medium text-gray-800">Student Admitted</p>
                      <p className="text-xs text-gray-500 mt-0.5">{viewRecord.admissionDate || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}
              {viewTab === "behaviour" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800">Behaviour Records</h4>
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">No incidents recorded</p>
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-end rounded-b-xl">
              <button onClick={() => { setShowViewModal(false); setViewTab("profile") }} className="px-5 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      <Modal title="Confirm Delete" show={showDeleteModal} onClose={() => setShowDeleteModal(false)}
        footer={<><button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={confirmDelete} className="px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm shadow-red-200">Delete</button></>}>
        <div className="text-center py-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3"><Trash2 className="h-6 w-6 text-red-500" /></div>
          <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete this student?</p>
          {deleteId && <p className="text-sm font-semibold text-gray-800">{fullName(students.find((s) => s.id === deleteId)?.firstName, students.find((s) => s.id === deleteId)?.middleName, students.find((s) => s.id === deleteId)?.lastName)}</p>}
        </div>
      </Modal>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><FileText className="h-4 w-4 text-[var(--primary)]" />Import Student</h3>
              <button type="button" onClick={() => { setShowImportModal(false); setImportResult(null); setImportPreview([]); setImportFile(null); setImportClass(""); setImportSection("") }} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                <p className="text-xs text-amber-800">Download the sample file to see the required format.</p>
                <button type="button" onClick={downloadSampleCSV} className="ml-3 flex items-center gap-1.5 text-xs font-medium text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                  <Download className="h-3.5 w-3.5" />Sample CSV
                </button>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-xs text-blue-900/90 space-y-1.5">
                <p className="font-semibold text-blue-900">Instructions</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Your CSV data should be in the format below. The first line of your CSV file should be the column headers as in the table example.</li>
                  <li>Duplicate Admission Number (unique) rows will not be imported.</li>
                  <li>For student Gender use Male, Female value.</li>
                  <li>For student Blood Group use O+, A+, B+, AB+, O-, A-, B-, AB- value.</li>
                  <li>For RTE use Yes, No value.</li>
                  <li>For If Guardian Is use father, mother, other value.</li>
                  <li>Category name comes from other table so for category, enter Category Id (Category Id can be found on category page).</li>
                  <li>Student house comes from other table so for student house, enter Student House Id (Student House Id can be found on student house page).</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class <span className="text-red-500">*</span></label>
                  <select
                    value={importClass}
                    onChange={(e) => { setImportClass(e.target.value); setImportSection(""); setImportFile(null); setImportPreview([]); setImportResult(null) }}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Section <span className="text-red-500">*</span></label>
                  <select
                    value={importSection}
                    onChange={(e) => { setImportSection(e.target.value); setImportFile(null); setImportPreview([]); setImportResult(null) }}
                    disabled={!importClass}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Section</option>
                    {importSections.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Choose File (CSV) <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-3">
                  <label className={`flex-1 flex items-center gap-2 h-10 px-3 text-sm border border-dashed border-gray-300 rounded-lg transition-colors bg-gray-50 ${importClass && importSection ? "cursor-pointer hover:border-[var(--primary)]" : "cursor-not-allowed opacity-60"}`}>
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className={importFile ? "text-gray-800" : "text-gray-400"}>
                      {!importClass || !importSection ? "Select Class and Section to enable file upload" : (importFile ? importFile.name : "Click to select a CSV file")}
                    </span>
                    <input type="file" accept=".csv,text/csv" className="hidden" disabled={!importClass || !importSection} onChange={handleImportFile} />
                  </label>
                  {importFile && (
                    <button type="button" onClick={() => { setImportFile(null); setImportPreview([]); setImportResult(null) }} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                      <X className="h-3.5 w-3.5" />Clear
                    </button>
                  )}
                </div>
              </div>

              {importResult && (
                <div className={`rounded-lg border px-4 py-3 text-xs ${importResult.failed > 0 ? (importResult.imported > 0 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-red-50 border-red-200 text-red-700") : "bg-green-50 border-green-200 text-green-700"}`}>
              {importResult.failed > 0 ? (
                <div className="space-y-2">
                  <p className="font-semibold">
                    {importResult.imported > 0
                      ? `${importResult.imported} imported, ${importResult.failed} failed`
                      : "Import failed"}
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-red-100">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-red-50 text-red-700">
                            <th className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">Admission No</th>
                            <th className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">Student Name</th>
                            <th className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">Roll No</th>
                            <th className="px-2 py-1.5 text-left font-semibold">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.errors.map((er, i) => (
                            <tr key={i} className="border-t border-red-100 align-top">
                              <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{er.row?.admissionNo || "—"}</td>
                              <td className="px-2 py-1.5 text-gray-700">{([er.row?.firstName, er.row?.lastName].filter(Boolean).join(" ").trim()) || "—"}</td>
                              <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{er.row?.rollNo || "—"}</td>
                              <td className="px-2 py-1.5 text-red-600">{er.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                    <p className="font-semibold">{importResult.imported} student{importResult.imported === 1 ? "" : "s"} imported successfully</p>
                  )}
                </div>
              )}

              {importPreview.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-600">Review & edit data before import ({importPreview.length} row{importPreview.length === 1 ? "" : "s"})</p>
                    <button type="button" onClick={addImportRow} className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] border border-[var(--primary)] px-2.5 py-1 rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors">
                      <Plus className="h-3 w-3" />Add Row
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-lg max-h-72 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 font-semibold text-gray-500 w-8">#</th>
                          {importHeaders.map((h) => (
                            <th key={h} className="px-1 py-2 font-semibold text-gray-600 whitespace-nowrap min-w-32">{h}</th>
                          ))}
                          <th className="px-2 py-2 font-semibold text-gray-500 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((rec, i) => (
                          <tr key={i} className="border-t border-gray-100 align-top">
                            <td className="px-2 py-1.5 text-gray-400 text-center pt-2.5">{i + 1}</td>
                            {importHeaders.map((h) => {
                              const field = importColumnMap[h]
                              return (
                                <td key={h} className="px-1 py-1.5">
                                  <input
                                    type="text"
                                    value={rec[field] ?? ""}
                                    onChange={(e) => updateImportCell(i, field, e.target.value)}
                                    className="w-32 h-7 px-2 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-white"
                                  />
                                </td>
                              )
                            })}
                            <td className="px-1 py-1.5 text-center">
                              <button type="button" onClick={() => removeImportRow(i)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remove row">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => { setShowImportModal(false); setImportResult(null); setImportPreview([]); setImportFile(null); setImportClass(""); setImportSection("") }}
                className="text-xs font-medium text-gray-600 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportStudents}
                disabled={importPreview.length === 0 || importing || !importClass || !importSection}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-5 py-2 rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
              >
                {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media print{body *{visibility:hidden}table,table *{visibility:visible}table{position:absolute;left:0;top:0;width:100%;font-size:10px}table th{background:#f5f5f5!important;color:#000!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}nav,.no-print{display:none!important}}`}</style>
    </div>
  )
}