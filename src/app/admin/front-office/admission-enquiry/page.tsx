"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useRef, useEffect } from "react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import RegFormInvoiceModal from "@/components/reg-form-invoice"
import RegistrationForm, { EMPTY_REGISTRATION_FORM, type RegistrationFormData } from "@/components/registration-form"
import { Search, Plus, Phone, Pencil, Trash2, X, Download, Upload, Printer, ChevronDown, Users, TrendingUp, Award, Calendar, UserCheck, Clock, Eye, TicketCheck, Link2, FilePenLine, Loader2, Save, Copy, CheckCircle2, GraduationCap } from "lucide-react"

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
  regFormPurchased: boolean
  regFormNo: string
  regFormAmount: number | string
  regFormPaymentMode: string
  regFormPaymentDate: string
  regFormStatus: string
  regFormTransactionId: string
  regFormChequeNo: string
  regFormBank: string
  regFormNote: string
}

type OnlineRegistration = {
  id: number
  enquiryId: number | null
  regFormNo: string
  token: string | null
  name: string
  phone: string
  email: string
  classVal: string
  address: string
  description: string
  amount: number
  status: string
  paymentStatus: string
  orderId: string | null
  paymentId: string | null
  paymentDate: string | null
  createdAt: string
  formData?: RegistrationFormData
  formSubmittedAt?: string | null
  admitted?: boolean
  admittedStudentId?: number | null
  admittedAt?: string | null
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
  regFormPurchased: false, regFormNo: "", regFormAmount: "", regFormPaymentMode: "Cash",
  regFormPaymentDate: today(), regFormStatus: "Pending",
  regFormTransactionId: "", regFormChequeNo: "", regFormBank: "", regFormNote: "",
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
  regFormPurchased: "Reg Form Purchased", regFormNo: "Reg Form No",
  regFormAmount: "Reg Form Amount", regFormPaymentMode: "Payment Mode",
  regFormPaymentDate: "Payment Date", regFormStatus: "Reg Form Status",
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
  const [viewRecord, setViewRecord] = useState<EnquiryRecord | null>(null)
  const [invoiceRecord, setInvoiceRecord] = useState<EnquiryRecord | null>(null)
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
  const [activeTab, setActiveTab] = useState<"enquiries" | "registrations" | "forms">("enquiries")
  const [registrations, setRegistrations] = useState<OnlineRegistration[]>([])
  const [regsLoading, setRegsLoading] = useState(false)
  const [editingReg, setEditingReg] = useState<OnlineRegistration | null>(null)
  const [editRegForm, setEditRegForm] = useState<RegistrationFormData>(EMPTY_REGISTRATION_FORM)
  const [editRegSaving, setEditRegSaving] = useState(false)
  const [editRegNotice, setEditRegNotice] = useState("")
  const [regFormLink, setRegFormLink] = useState("")
  const [regLinkCopied, setRegLinkCopied] = useState(false)
  const [logoSrc, setLogoSrc] = useState("")

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

  const regScope = filterClass ? enquiries.filter((e) => e.classVal === filterClass) : enquiries
  const regCount = regScope.filter((e) => e.regFormPurchased).length
  const regValue = regCount * 1000

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

  const handleInputChange = (field: string, value: string | number | boolean) => {
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
    if (form.regFormPurchased) {
      if (!form.regFormNo.trim()) errs.regFormNo = "Registration Form Number is required"
      if (!form.regFormAmount || Number(form.regFormAmount) <= 0) errs.regFormAmount = "Amount is required"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const regFormPayload = () => {
    if (!form.regFormPurchased) {
      return { regFormPurchased: false, regFormNo: null, regFormAmount: 0, regFormPaymentMode: null, regFormPaymentDate: null, regFormStatus: "Pending", regFormTransactionId: null, regFormChequeNo: null, regFormBank: null, regFormNote: null }
    }
    return {
      regFormPurchased: true,
      regFormNo: form.regFormNo.trim(),
      regFormAmount: Number(form.regFormAmount) || 0,
      regFormPaymentMode: form.regFormPaymentMode,
      regFormPaymentDate: form.regFormPaymentDate || today(),
      regFormStatus: "Purchased",
      regFormTransactionId: form.regFormTransactionId || null,
      regFormChequeNo: form.regFormChequeNo || null,
      regFormBank: form.regFormBank || null,
      regFormNote: form.regFormNote || null,
    }
  }

  const handleAdd = async () => {
    if (!validateForm()) return
    try {
      const saved = await add({
        name: form.name, phone: form.phone, email: form.email,
        source: form.source, enquiryDate: form.date,
        nextFollowUp: form.followUpDate, status: "Active",
        classVal: form.classVal, assigned: form.assigned, reference: form.reference,
        noOfChild: form.noOfChild as number, address: form.address,
        description: form.description, note: form.note,
        ...regFormPayload(),
      })
      setShowAddModal(false)
      setForm({ ...emptyForm })
      if (form.regFormPurchased) notify.success(`Registration Form #${form.regFormNo} purchased & linked to enquiry`)
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const handleView = (id: number) => {
    const record = enquiries.find((e) => e.id === id)
    if (!record) return
    setViewRecord(record)
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
      regFormPurchased: record.regFormPurchased,
      regFormNo: record.regFormNo || "",
      regFormAmount: String(record.regFormAmount ?? ""),
      regFormPaymentMode: record.regFormPaymentMode || "Cash",
      regFormPaymentDate: fmt(record.regFormPaymentDate) || today(),
      regFormStatus: record.regFormStatus || "Pending",
      regFormTransactionId: record.regFormTransactionId || "",
      regFormChequeNo: record.regFormChequeNo || "",
      regFormBank: record.regFormBank || "",
      regFormNote: record.regFormNote || "",
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
        ...regFormPayload(),
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

  const copyOnlineFormLink = async (enquiry: EnquiryRecord) => {
    try {
      let code = ""
      try {
        const res = await fetch("/api/settings/public")
        const d = await res.json()
        code = d.schoolCode || ""
      } catch { /* best effort */ }
      const qs = new URLSearchParams({ eid: String(enquiry.id) })
      if (code) qs.set("code", code)
      const link = `${window.location.origin}/online-admission/registration?${qs.toString()}`
      try {
        await navigator.clipboard.writeText(link)
      } catch { /* clipboard unavailable */ }
      notify.success(`Online form link copied — send it to the parent to pay ₹1000 & continue`) 
      window.open(link, "_blank")
    } catch {
      notify.error("Could not generate the online form link")
    }
  }

  const loadRegistrations = async () => {
    setRegsLoading(true)
    try {
      const res = await fetch("/api/online-admission/registration")
      const data = await res.json()
      setRegistrations(Array.isArray(data) ? data : [])
    } catch {
      setRegistrations([])
    } finally {
      setRegsLoading(false)
    }
  }

  useEffect(() => {
    loadRegistrations()
    loadRegFormLink()
  }, [])

  const loadRegFormLink = async () => {
    try {
      let code = ""
      try {
        const res = await fetch("/api/settings/public")
        const d = await res.json()
        code = d.schoolCode || ""
        if (d.logo_printLogo || d.logo_adminLogo || d.logo_appLogo) {
          setLogoSrc(d.logo_printLogo || d.logo_adminLogo || d.logo_appLogo)
        }
      } catch { /* best effort */ }
      setRegFormLink(`${window.location.origin}/online-admission/registration${code ? `?code=${encodeURIComponent(code)}` : ""}`)
    } catch {
      setRegFormLink(`${window.location.origin}/online-admission/registration`)
    }
  }

  const copyRegFormLink = async () => {
    if (!regFormLink) return
    try {
      await navigator.clipboard.writeText(regFormLink)
    } catch { /* clipboard unavailable */ }
    setRegLinkCopied(true)
    setTimeout(() => setRegLinkCopied(false), 2000)
    notify.success("Registration form link copied — send it to parents to start a new registration")
  }

  const startAdmission = (r: OnlineRegistration) => {
    window.location.href = `/admin/student-information/student-admission?reg=${r.id}`
  }

  const copyRegistrationLink = async (r: OnlineRegistration) => {
    if (!r.token) {
      notify.error("This form has not been paid yet — no registration link available")
      return
    }
    const link = `${window.location.origin}/online-admission/register?ref=${r.token}`
    try {
      await navigator.clipboard.writeText(link)
    } catch { /* clipboard unavailable */ }
    notify.success(`Registration link copied for ${r.name}`)
  }

  const openRegistrationForm = (r: OnlineRegistration) => {
    setEditingReg(r)
    setEditRegForm({
      ...EMPTY_REGISTRATION_FORM,
      ...(r.formData || {}),
      seekingClass: (r.formData && r.formData.seekingClass) || r.classVal || "",
      headerRegNo: (r.formData && r.formData.headerRegNo) || r.regFormNo || "",
      formDate: (r.formData && r.formData.formDate) || new Date().toISOString().slice(0, 10),
    })
    setEditRegNotice("")
  }

  const saveRegistrationForm = async () => {
    if (!editingReg) return
    setEditRegSaving(true)
    setEditRegNotice("")
    try {
      const res = await fetch("/api/online-admission/registration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingReg.id, formData: editRegForm }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Could not save the form")
      setRegistrations((prev) =>
        prev.map((x) => (x.id === editingReg.id ? { ...x, formData: editRegForm, formSubmittedAt: d.formSubmittedAt || x.formSubmittedAt } : x))
      )
      setEditRegNotice("Registration form saved.")
      notify.success("Registration form saved")
    } catch (e) {
      setEditRegNotice(e instanceof Error ? e.message : "Could not save the form")
      notify.error(e instanceof Error ? e.message : "Could not save the form")
    } finally {
      setEditRegSaving(false)
    }
  }

  const printRegistrationForm = () => {
    if (!editingReg) return
    const wrapper = document.querySelector<HTMLElement>(".sj-reg .form-wrapper")
    if (!wrapper) return
    const styleText = Array.from(document.querySelectorAll("style"))
      .map((s) => s.textContent || "")
      .filter((t) => t.includes(".sj-reg"))
      .join("\n")
    const w = window.open("", "_blank", "width=900,height=1200")
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Registration Form #${editingReg.regFormNo}</title><base href="${window.location.origin}/"><style>${styleText}</style></head><body style="margin:0;background:#e5e7eb;padding:16px;"><div class="sj-reg">${wrapper.outerHTML}</div></body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => {
      try { w.print() } catch { /* popup may be blocked when fired too early */ }
    }, 300)
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

      {/* Registration Form Purchase */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.regFormPurchased}
            onChange={(e) => handleInputChange("regFormPurchased", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
          />
          <span className="text-sm font-medium text-gray-800">Registration Form Purchased</span>
        </label>

        {form.regFormPurchased && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[var(--primary)] mb-2">
                Step 1 · Registration Form Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Form Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.regFormNo}
                    onChange={(e) => handleInputChange("regFormNo", e.target.value)}
                    placeholder="e.g. RF-2026-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {errors.regFormNo && <p className="text-red-500 text-xs mt-1">{errors.regFormNo}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.regFormAmount}
                    onChange={(e) => handleInputChange("regFormAmount", e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {errors.regFormAmount && <p className="text-red-500 text-xs mt-1">{errors.regFormAmount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={form.regFormPaymentDate}
                    onChange={(e) => handleInputChange("regFormPaymentDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[var(--primary)] mb-2">
                Step 2 · Payment Process
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="flex flex-wrap gap-4">
                    {["Cash", "Cheque", "Card", "Online Transfer"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                        <input
                          type="radio"
                          name="regFormPaymentMode"
                          checked={form.regFormPaymentMode === opt}
                          onChange={() => handleInputChange("regFormPaymentMode", opt)}
                          className="text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {form.regFormPaymentMode === "Cheque" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cheque / DD No</label>
                        <input
                          type="text"
                          value={form.regFormChequeNo}
                          onChange={(e) => handleInputChange("regFormChequeNo", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                        <input
                          type="text"
                          value={form.regFormBank}
                          onChange={(e) => handleInputChange("regFormBank", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                  {(form.regFormPaymentMode === "Card" || form.regFormPaymentMode === "Online Transfer") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                      <input
                        type="text"
                        value={form.regFormTransactionId}
                        onChange={(e) => handleInputChange("regFormTransactionId", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Note</label>
                    <input
                      type="text"
                      value={form.regFormNote}
                      onChange={(e) => handleInputChange("regFormNote", e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[var(--primary-light)] px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">
                    Amount to pay {form.regFormPaymentMode !== "Cash" && form.regFormPaymentMode !== "Cheque" ? `(${form.regFormPaymentMode})` : ""}
                  </span>
                  <span className="text-lg font-bold text-[var(--primary)]">
                    ₹{Number(form.regFormAmount) || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
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

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-amber-600"><TicketCheck className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-amber-500" /></div>
          <p className="text-2xl font-black text-amber-700 mt-2">{regCount}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-600/70">Registration Form Purchase</p>
          <p className="mt-1.5 text-sm font-extrabold text-amber-700">₹{regValue.toLocaleString("en-IN")}<span className="ml-1 text-[11px] font-semibold text-amber-500/80">({regCount} × ₹1,000)</span></p>
          {filterClass && <p className="mt-0.5 text-[10px] font-semibold text-amber-500/80">for {filterClass}</p>}
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
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("enquiries")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === "enquiries" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
            >
              Enquiries
            </button>
            <button
              onClick={() => setActiveTab("registrations")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === "registrations" ? "bg-[var(--primary)] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
            >
              Online Registrations {registrations.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "registrations" ? "bg-white/20 text-white" : "bg-[var(--primary-light)] text-[var(--secondary)]"}`}>{registrations.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab("forms")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === "forms" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
            >
              Registration Forms {registrations.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "forms" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"}`}>{registrations.length}</span>}
            </button>
          </div>
          {activeTab === "enquiries" && (
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /> Admission Enquiry</h3>
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
            )}
          </div>

        {activeTab === "enquiries" ? (
        <>
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Reg Form</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-400">No enquiries found</td>
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
                    <td className="px-4 py-3">
                      {enquiry.regFormPurchased ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            {enquiry.regFormStatus === "Purchased" ? "Paid" : enquiry.regFormStatus}
                          </span>
                          {enquiry.regFormNo && <span className="text-xs text-gray-500 font-mono">{enquiry.regFormNo}</span>}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right print:hidden">
                      <div className="flex items-center justify-end gap-1">
                        {enquiry.regFormPurchased && (
                          <button
                            onClick={() => setInvoiceRecord(enquiry)}
                            className="p-1.5 text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors"
                            title="Print Reg Form Invoice"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleView(enquiry.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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
        </>
) : activeTab === "registrations" ? (
        <div className="overflow-x-auto">
          {regsLoading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Loading online registrations...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No online form submissions yet. Share the “Online Form Link” from an enquiry popup to collect ₹1,000 and start registrations.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Reg Form No</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Class</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Payment</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Submitted</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, idx) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--secondary)]">{r.regFormNo}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{r.email || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{r.classVal || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">₹{Number(r.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${r.paymentStatus === "Paid" ? "bg-green-50 text-green-700 border border-green-200" : r.paymentStatus === "Failed" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                        {r.paymentStatus || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openRegistrationForm(r)}
                          className="inline-flex items-center gap-1.5 text-xs text-gray-700 px-2.5 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <FilePenLine className="h-3.5 w-3.5" />
                          View / Edit
                        </button>
                        <button
                          onClick={() => copyRegistrationLink(r)}
                          className="inline-flex items-center gap-1.5 text-xs text-[var(--primary)] px-2.5 py-1.5 border border-[var(--primary)]/30 rounded-lg hover:bg-[var(--primary-light)]"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          Copy Link
                        </button>
                        {r.admitted ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Admitted
                          </span>
                        ) : (
                          <button
                            onClick={() => startAdmission(r)}
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-700 px-2.5 py-1.5 border border-emerald-300 rounded-lg hover:bg-emerald-50"
                          >
                            <GraduationCap className="h-3.5 w-3.5" /> Admission
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div>
          <div className="px-5 py-4 border-b border-gray-100 bg-emerald-50/40">
            <div className="flex flex-wrap items-center gap-3">
              <span className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Link2 className="h-4.5 w-4.5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700">Registration Form Link</p>
                <p className="text-xs text-gray-500 mt-0.5">Share this link with parents — they pay ₹1,000 and fill the registration form. All submissions are listed below.</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  readOnly
                  value={regFormLink}
                  className="flex-1 sm:w-96 px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-700 bg-white focus:outline-none"
                />
                <button
                  onClick={copyRegFormLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--secondary)] transition-colors"
                >
                  {regLinkCopied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {regLinkCopied ? "Copied!" : "Copy Link"}
                </button>
                <button
                  onClick={() => { if (regFormLink) window.open(regFormLink, "_blank") }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-300 text-emerald-700 text-xs font-semibold hover:bg-emerald-50 transition-colors"
                >
                  Open
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {regsLoading ? (
              <div className="text-center py-10 text-gray-400 text-sm">Loading registration forms...</div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No submissions yet. Share the registration form link above — once parents pay ₹1,000 and fill the form, their submissions will be listed here.
              </div>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Reg Form No</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Father / Guardian</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Class</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Payment</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Form Submitted</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, idx) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--secondary)]">{r.regFormNo}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.formData?.studentName?.trim() || r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.formData?.fatherName?.trim() || (r.formData?.guardianName?.trim() || "-")}</td>
                    <td className="px-4 py-3 text-gray-600">{r.formData?.fatherMobile?.trim() || r.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{r.formData?.seekingClass?.trim() || r.classVal || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${r.paymentStatus === "Paid" ? "bg-green-50 text-green-700 border border-green-200" : r.paymentStatus === "Failed" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                        {r.paymentStatus || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {r.formSubmittedAt ? new Date(r.formSubmittedAt).toLocaleDateString("en-IN") : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                      {r.admitted && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Admitted
                        </span>
                      )}
                      <button
                        onClick={() => openRegistrationForm(r)}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-700 px-2.5 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <FilePenLine className="h-3.5 w-3.5" />
                        View / Edit
                      </button>
                    </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      )}      
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body:not(.printing-modal-open) * { visibility: hidden; }
          body:not(.printing-modal-open) .print\\:overflow-visible, body:not(.printing-modal-open) .print\\:overflow-visible * { visibility: visible; }
          body:not(.printing-modal-open) .print\\:overflow-visible { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          body:not(.printing-modal-open) .space-y-6 > *:not(:last-child) { display: none; }
          body:not(.printing-modal-open) .space-y-6 > .bg-white.rounded-xl:last-of-type { display: block !important; }
          body:not(.printing-modal-open) .bg-white.rounded-xl { border: 1px solid #ddd !important; }
          body:not(.printing-modal-open) th, body:not(.printing-modal-open) td { padding: 6px 8px !important; font-size: 10px !important; }
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
                className={`px-6 py-2 text-white text-sm font-medium rounded-lg transition-colors ${form.regFormPurchased ? "bg-green-600 hover:bg-green-700" : "bg-[var(--primary)] hover:bg-[var(--secondary)]"}`}
              >
                {form.regFormPurchased ? "Complete Purchase & Save" : "Save"}
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
                className={`px-6 py-2 text-white text-sm font-medium rounded-lg transition-colors ${form.regFormPurchased ? "bg-green-600 hover:bg-green-700" : "bg-[var(--primary)] hover:bg-[var(--secondary)]"}`}
              >
                {form.regFormPurchased ? "Complete Purchase & Save" : "Save"}
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

      {/* View Modal */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewRecord(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-3 flex items-center gap-3 rounded-t-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-white">
                <Eye className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white">Admission Enquiry</h3>
                <p className="text-[11px] text-white/75 truncate">#{viewRecord.id} • {viewRecord.name}</p>
              </div>
              <button onClick={() => setViewRecord(null)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Summary line */}
              <div className="flex items-center justify-between flex-wrap gap-2 rounded-lg bg-gradient-to-br from-gray-50 to-indigo-50/50 border border-gray-200 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{viewRecord.name}</p>
                  <p className="text-xs text-gray-500 truncate">{viewRecord.phone}{viewRecord.email ? ` • ${viewRecord.email}` : ""}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusClass(viewRecord.status)}`}>
                    {viewRecord.status}
                  </span>
                  {viewRecord.regFormPurchased && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
                      {viewRecord.regFormStatus === "Purchased" ? "Reg Form Paid" : viewRecord.regFormStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Enquiry information */}
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <p className="px-3.5 py-1.5 text-[10px] font-bold tracking-widest uppercase text-[var(--primary)] bg-gray-50/70 border-b border-gray-100">Enquiry Information</p>
                <div className="grid grid-cols-2">
                  {[
                    { label: "Source", value: viewRecord.source },
                    { label: "Class", value: viewRecord.classVal || "-" },
                    { label: "Reference", value: viewRecord.reference || "-" },
                    { label: "No of Child", value: String(viewRecord.noOfChild ?? 1) },
                    { label: "Enquiry Date", value: viewRecord.enquiryDate },
                    { label: "Last Follow Up", value: viewRecord.lastFollowUp || "-" },
                    { label: "Next Follow Up", value: viewRecord.nextFollowUp || "-" },
                    { label: "Assigned To", value: viewRecord.assigned || "-" },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col px-3.5 py-2 border-b border-gray-100 odd:border-r">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item.label}</span>
                      <span className="text-xs font-medium text-gray-800 mt-0.5 break-words">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    { label: "Address", value: viewRecord.address },
                    { label: "Description", value: viewRecord.description },
                    { label: "Note", value: viewRecord.note },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col px-3.5 py-2">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item.label}</span>
                      <span className="text-xs text-gray-800 mt-0.5 whitespace-pre-wrap break-words">{item.value || "-"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Registration form purchase */}
              {viewRecord.regFormPurchased && (
                <div className="rounded-lg border border-green-200 overflow-hidden">
                  <p className="px-3.5 py-1.5 text-[10px] font-bold tracking-widest uppercase text-green-700 bg-green-50/70 border-b border-green-100">
                    Registration Form Purchase
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3">
                    {[
                      { label: "Reg Form No", value: viewRecord.regFormNo || "-" },
                      { label: "Amount", value: `₹${Number(viewRecord.regFormAmount) || 0}` },
                      { label: "Payment Mode", value: viewRecord.regFormPaymentMode || "-" },
                      { label: "Payment Date", value: viewRecord.regFormPaymentDate || "-" },
                      { label: "Status", value: viewRecord.regFormStatus || "Pending" },
                      { label: "Transaction Reference", value: viewRecord.regFormTransactionId || viewRecord.regFormChequeNo || "-" },
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col px-3.5 py-2 border-green-100">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item.label}</span>
                        <span className="text-xs font-medium text-gray-800 mt-0.5 break-words">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  {viewRecord.regFormBank && (
                    <p className="px-3.5 py-1.5 text-[11px] text-gray-500 border-t border-green-100 bg-green-50/30">
                      Bank: {viewRecord.regFormBank}{viewRecord.regFormNote ? ` • Note: ${viewRecord.regFormNote}` : ""}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2 bg-gray-50/50 rounded-b-xl">
              <button
                onClick={() => { const r = viewRecord; setViewRecord(null); if (r) handleEdit(r.id) }}
                className="px-3 py-1.5 text-xs text-[var(--primary)] border border-[var(--primary)]/30 rounded-lg hover:bg-[var(--primary-light)]"
              >
                Edit
              </button>
              <button
                onClick={() => { const r = viewRecord; setViewRecord(null); if (r) handleFollowUp(r.id) }}
                className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Follow Up
              </button>
              <button
                onClick={() => copyOnlineFormLink(viewRecord)}
                className="px-3 py-1.5 text-xs text-[var(--primary)] border border-[var(--primary)]/30 rounded-lg hover:bg-[var(--primary-light)] inline-flex items-center gap-1.5"
              >
                <Link2 className="h-3.5 w-3.5" />
                Online Form Link
              </button>
              <button
                onClick={() => setViewRecord(null)}
                className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--secondary)]"
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

      {/* Reg Form Invoice Modal */}
      {invoiceRecord && (
        <RegFormInvoiceModal data={invoiceRecord} onClose={() => setInvoiceRecord(null)} />
      )}

      {/* Registration Form View/Edit Modal */}
      {editingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingReg(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Registration Form #{editingReg.regFormNo}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingReg.name} • {editingReg.phone} • {editingReg.email || "-"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={printRegistrationForm}
                  title="Print registration form"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button onClick={() => setEditingReg(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <RegistrationForm value={editRegForm} onChange={setEditRegForm} regNo={editingReg.regFormNo} logoSrc={logoSrc} admitted={editingReg.admitted ?? false} />
            </div>

            <div className="sticky bottom-0 z-10 px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                {editRegNotice && (
                  <span className={editRegNotice.includes("saved") ? "text-emerald-700 font-medium" : "text-red-600"}>
                    {editRegNotice}
                  </span>
                )}
                {!editRegNotice && editingReg.formSubmittedAt && (
                  <span className="text-gray-400">Submitted by applicant on {new Date(editingReg.formSubmittedAt).toLocaleString("en-IN")}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingReg(null)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={saveRegistrationForm}
                  disabled={editRegSaving}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {editRegSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editRegSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
