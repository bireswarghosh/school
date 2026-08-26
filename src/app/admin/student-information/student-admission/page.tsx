"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useEffect, useRef } from "react"
import {
  Upload, Save, ChevronDown, ChevronRight, Plus, X, Download, FileText, Loader2, Camera, Trash2,
} from "lucide-react"
import { importColumnMap, importHeaders, parseImportFile, buildStudentImportPayload, downloadSampleCSV, blankImportRow } from "@/lib/student-import"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useCurrency } from "@/lib/currency-context"

type CustomField = {
  id: number
  fieldName: string
  fieldType: string
  module: string
  belongsTo: string
  required: boolean
  options: string
}

type FormData = {
  admissionNo: string
  rollNumber: string
  firstName: string
  middleName: string
  lastName: string
  classVal: string
  section: string
  gender: string
  dateOfBirth: string
  category: string
  religion: string
  caste: string
  mobileNumber: string
  email: string
  admissionDate: string
  bloodGroup: string
  house: string
  height: string
  weight: string
  measurementDate: string
  studentPhoto: string
  previousSchool: string
  note: string
  routeList: string
  pickupPoint: string
  feesMonth: string[]
  hostel: string
  roomNo: string
  feeGroups: string[]
  discounts: string[]
  fatherName: string
  fatherPhone: string
  fatherOccupation: string
  fatherPhoto: string
  motherName: string
  motherPhone: string
  motherOccupation: string
  motherPhoto: string
  guardianIs: string
  guardianName: string
  guardianRelation: string
  guardianPhone: string
  guardianOccupation: string
  guardianEmail: string
  guardianAddress: string
  guardianPhoto: string
  guardianIsCurrent: boolean
  currentAddress: string
  permanentIsCurrent: boolean
  permanentAddress: string
  bankAccount: string
  bankName: string
  ifscCode: string
  nationalId: string
  localId: string
  rte: string
  siblingName: string
  multiClassRows: { classVal: string; section: string }[]
  documents: { title: string; document: string }[]
}

const genderOptions = ["Select", "Male", "Female"]
const categoryOptions = ["Select", "General", "OBC", "SC", "ST", "Special", "Physically Challenged"]
const bloodGroupOptions = ["Select", "O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"]
const houseOptions = ["Select", "Blue", "Red", "Green", "Yellow"]
const routeOptions = ["Select", "Brooklyn Central", "Brooklyn East", "Brooklyn West", "Brooklyn South", "Brooklyn North", "High Court", "Ranitaal"]
const pickupOptions = ["Select", "Point A", "Point B", "Point C"]
const hostelOptions = ["Select", "Boys Hostel 101", "Boys Hostel 102", "Girls Hostel 103", "Girls Hostel 104", "hostel"]
const roomOptions = ["Select", "Room 101", "Room 102", "Room 201", "Room 202"]
const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"]
const discountOptions = [
  { label: "RKS Discount", value: "rks" },
  { label: "Sibling Discount", value: "sibling" },
  { label: "Handicapped", value: "handicapped" },
  { label: "Class Topper", value: "class-topper" },
]

const todayStr = () => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

function generateAdmissionNo() {
  const year = new Date().getFullYear()
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return `S${year}${rand}`
}

function defaultFormState(): FormData {
  return {
    admissionNo: "",
    rollNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
    classVal: "",
    section: "",
    gender: "",
    dateOfBirth: "",
    category: "",
    religion: "",
    caste: "",
    mobileNumber: "",
    email: "",
    admissionDate: todayStr(),
    bloodGroup: "",
    house: "",
    height: "",
    weight: "",
    measurementDate: todayStr(),
    studentPhoto: "",
    previousSchool: "",
    note: "",
    routeList: "",
    pickupPoint: "",
    feesMonth: [],
    hostel: "",
    roomNo: "",
    feeGroups: [],
    discounts: [],
    fatherName: "",
    fatherPhone: "",
    fatherOccupation: "",
    fatherPhoto: "",
    motherName: "",
    motherPhone: "",
    motherOccupation: "",
    motherPhoto: "",
    guardianIs: "Father",
    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",
    guardianOccupation: "",
    guardianEmail: "",
    guardianAddress: "",
    guardianPhoto: "",
    guardianIsCurrent: false,
    currentAddress: "",
    permanentIsCurrent: false,
    permanentAddress: "",
    bankAccount: "",
    bankName: "",
    ifscCode: "",
    nationalId: "",
    localId: "",
    rte: "",
    siblingName: "",
    multiClassRows: [],
    documents: [{ title: "", document: "" }, { title: "", document: "" }, { title: "", document: "" }, { title: "", document: "" }],
  }
}

export default function StudentAdmissionPage() {
  const { symbol } = useCurrency()
  const { classNames, sectionNames } = useClassesAndSections()
  const classOptions = ["Select", ...classNames]
  const sectionOptions = ["Select", ...sectionNames]
  const feeGroupOptions = [
    { label: `Class 1 General - ${symbol}8,710.00`, value: "class1-general" },
    { label: `Class 4 General - ${symbol}8,840.00`, value: "class4-general" },
    { label: `Exam - ${symbol}250.00`, value: "exam" },
    { label: `Class 5 General - ${symbol}10,040.00`, value: "class5-general" },
  ]
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [customValues, setCustomValues] = useState<Record<number, string>>({})

  const [showImportModal, setShowImportModal] = useState(false)
  const [importClass, setImportClass] = useState("")
  const [importSection, setImportSection] = useState("")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; failed: number; errors: string[] } | null>(null)
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([])
  const [importSections, setImportSections] = useState<{ id: number; name: string }[]>([])

  const [classList, setClassList] = useState<{ id: number; name: string }[]>([])
  const [siblingOpen, setSiblingOpen] = useState(false)
  const [siblingClassId, setSiblingClassId] = useState("")
  const [siblingSectionId, setSiblingSectionId] = useState("")
  const [siblingStudentId, setSiblingStudentId] = useState("")
  const [siblingSections, setSiblingSections] = useState<{ id: number; name: string }[]>([])
  const [siblingStudents, setSiblingStudents] = useState<{ id: number; name: string }[]>([])

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    multiClass: false,
    transport: false,
    hostel: false,
    fees: false,
    parent: false,
    address: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<FormData>(() => defaultFormState())
  const [editId, setEditId] = useState<number | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const editParam = params.get("edit")
    if (!editParam) return
    const id = parseInt(editParam, 10)
    if (!Number.isFinite(id)) return
    setEditId(id)
    ;(async () => {
      try {
        const res = await fetch(`/api/student-information/student?id=${id}`)
        const data = await res.json()
        if (!res.ok || data.error || !data.id) throw new Error(data.error || "Student not found")
        setForm(fromRecord(data))
      } catch (e: any) {
        notify.error(e?.message || "Failed to load student")
      }
    })()
  }, [])

  const toFormDate = (v: string | null | undefined) => {
    if (!v) return ""
    const m = String(v).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
    return m ? `${m[2]}/${m[3]}/${m[1]}` : String(v)
  }

  const fromRecord = (r: any): FormData => ({
    ...defaultFormState(),
    admissionNo: r.admissionNo || "",
    rollNumber: r.rollNo != null ? String(r.rollNo) : "",
    firstName: r.firstName || "",
    middleName: r.middleName || "",
    lastName: r.lastName || "",
    classVal: r.class || "",
    section: r.section || "",
    gender: r.gender || "",
    dateOfBirth: toFormDate(r.dob),
    category: r.category || "",
    religion: r.religion || "",
    caste: r.caste || "",
    mobileNumber: r.mobile || "",
    email: r.email || "",
    admissionDate: toFormDate(r.admissionDate),
    bloodGroup: r.bloodGroup || "",
    house: r.house || "",
    height: r.height || "",
    weight: r.weight || "",
    measurementDate: toFormDate(r.measurementDate),
    studentPhoto: r.studentPhoto || "",
    previousSchool: r.previousSchool || "",
    note: r.note || "",
    fatherName: r.fatherName || "",
    fatherPhone: r.fatherPhone || "",
    fatherOccupation: r.fatherOccupation || "",
    fatherPhoto: r.fatherPhoto || "",
    motherName: r.motherName || "",
    motherPhone: r.motherPhone || "",
    motherOccupation: r.motherOccupation || "",
    motherPhoto: r.motherPhoto || "",
    guardianIs: r.guardianIs || "Father",
    guardianName: r.guardianName || "",
    guardianRelation: r.guardianRelation || "",
    guardianPhone: r.guardianPhone || "",
    guardianOccupation: r.guardianOccupation || "",
    guardianEmail: r.guardianEmail || "",
    guardianAddress: r.guardianAddress || "",
    guardianPhoto: r.guardianPhoto || "",
    currentAddress: r.currentAddress || "",
    permanentAddress: r.permanentAddress || "",
    bankAccount: r.bankAccount || "",
    bankName: r.bankName || "",
    ifscCode: r.ifscCode || "",
    nationalId: r.nationalId || "",
    localId: r.localId || "",
    rte: r.rte || "",
  })

  useEffect(() => {
    setForm((prev) => ({ ...prev, admissionNo: generateAdmissionNo() }))
    fetch("/api/system-setting/custom-field")
      .then((r) => r.json())
      .then((data: CustomField[]) => setCustomFields(data.filter((f) => f.module === "Student")))
      .catch(() => {})
    fetch("/api/academics/class")
      .then((r) => r.json())
      .then((data: { id: number; name: string }[]) => setClassList(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!siblingClassId) {
      setSiblingSections([])
      setSiblingStudents([])
      setSiblingSectionId("")
      return
    }
    fetch(`/api/academics/section?class_id=${siblingClassId}`)
      .then((r) => r.json())
      .then((data: { id: number; name: string }[]) => {
        setSiblingSections(Array.isArray(data) ? data : [])
        setSiblingSectionId("")
      })
      .catch(() => {})
  }, [siblingClassId])

  useEffect(() => {
    if (!importClass) {
      setImportSections([])
      setImportSection("")
      return
    }
    const cls = classList.find((c) => c.name === importClass)
    if (!cls) {
      setImportSections([])
      setImportSection("")
      return
    }
    fetch(`/api/academics/section?class_id=${cls.id}`)
      .then((r) => r.json())
      .then((data: { id: number; name: string }[]) => {
        setImportSections(Array.isArray(data) ? data : [])
        setImportSection("")
      })
      .catch(() => setImportSections([]))
  }, [importClass, classList])

  useEffect(() => {
    if (!siblingClassId || !siblingSectionId) {
      setSiblingStudents([])
      return
    }
    fetch(`/api/students?class_id=${siblingClassId}&section_id=${siblingSectionId}`)
      .then((r) => r.json())
      .then((data: { id: number; name: string }[]) => setSiblingStudents(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [siblingClassId, siblingSectionId])

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleArrayToggle = (field: string, value: string) => {
    setForm((prev) => {
      const arr = prev[field as keyof FormData] as string[]
      const updated = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
      return { ...prev, [field]: updated }
    })
  }

  const handleDocChange = (index: number, field: "title" | "document", value: string) => {
    setForm((prev) => {
      const docs = [...prev.documents]
      docs[index] = { ...docs[index], [field]: value }
      return { ...prev, documents: docs }
    })
  }

  const addMultiClassRow = () => {
    setForm((prev) => ({ ...prev, multiClassRows: [...prev.multiClassRows, { classVal: "", section: "" }] }))
  }

  const removeMultiClassRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      multiClassRows: prev.multiClassRows.filter((_, i) => i !== index),
    }))
  }

  const updateMultiClassRow = (index: number, field: "classVal" | "section", value: string) => {
    setForm((prev) => {
      const rows = prev.multiClassRows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
      return { ...prev, multiClassRows: rows }
    })
  }

  const addSibling = () => {
    const student = siblingStudents.find((s) => String(s.id) === siblingStudentId)
    if (student) handleInputChange("siblingName", student.name)
    setSiblingOpen(false)
    setSiblingClassId("")
    setSiblingSectionId("")
    setSiblingStudentId("")
  }

  const validateForm = () => {
    const errs: Record<string, string> = {}
    if (!form.firstName.trim()) errs.firstName = "First name is required"
    if (!form.classVal || form.classVal === "Select") errs.classVal = "Class is required"
    if (!form.section || form.section === "Select") errs.section = "Section is required"
    if (!form.gender || form.gender === "Select") errs.gender = "Gender is required"
    if (!form.guardianName.trim()) errs.guardianName = "Guardian name is required"
    if (!form.guardianPhone.trim()) errs.guardianPhone = "Guardian phone is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const toIsoDate = (v: string) => {
    const s = (v || "").trim()
    if (!s) return ""
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`
    return s
  }

  const handleSave = async () => {
    if (!validateForm() || saving) return
    setSaving(true)
    try {
      const guardianName =
        form.guardianName ||
        (form.guardianIs === "Father" ? form.fatherName : form.guardianIs === "Mother" ? form.motherName : "")
      const guardianPhone =
        form.guardianPhone ||
        (form.guardianIs === "Father" ? form.fatherPhone : form.guardianIs === "Mother" ? form.motherPhone : "")
      const currentAddress = form.guardianIsCurrent && form.guardianAddress ? form.guardianAddress : form.currentAddress

      const payload = {
        admissionNo: form.admissionNo || "",
        rollNo: form.rollNumber || "",
        firstName: form.firstName || "",
        middleName: form.middleName || "",
        lastName: form.lastName || "",
        class: form.classVal === "Select" ? "" : form.classVal,
        section: form.section === "Select" ? "" : form.section,
        gender: form.gender === "Select" ? "" : form.gender,
        dob: toIsoDate(form.dateOfBirth),
        category: form.category === "Select" ? "" : form.category,
        religion: form.religion || "",
        caste: form.caste || "",
        mobile: form.mobileNumber || "",
        email: form.email || "",
        admissionDate: toIsoDate(form.admissionDate),
        bloodGroup: form.bloodGroup === "Select" ? "" : form.bloodGroup,
        house: form.house === "Select" ? "" : form.house,
        height: form.height || "",
        weight: form.weight || "",
        measurementDate: toIsoDate(form.measurementDate),
        fatherName: form.fatherName || "",
        fatherPhone: form.fatherPhone || "",
        fatherOccupation: form.fatherOccupation || "",
        motherName: form.motherName || "",
        motherPhone: form.motherPhone || "",
        motherOccupation: form.motherOccupation || "",
        guardianIs: form.guardianIs === "Select" ? "" : form.guardianIs,
        guardianName,
        guardianRelation: form.guardianRelation || "",
        guardianEmail: form.guardianEmail || "",
        guardianPhone,
        guardianOccupation: form.guardianOccupation || "",
        guardianAddress: form.guardianAddress || "",
        currentAddress,
        permanentAddress: form.permanentIsCurrent && currentAddress ? currentAddress : form.permanentAddress,
        bankAccount: form.bankAccount || "",
        bankName: form.bankName || "",
        ifscCode: form.ifscCode || "",
        nationalId: form.nationalId || "",
        localId: form.localId || "",
        rte: form.rte || "",
        address: currentAddress,
        previousSchool: form.previousSchool || "",
        note: form.note || "",
        studentPhoto: form.studentPhoto || "",
        fatherPhoto: form.fatherPhoto || "",
        motherPhoto: form.motherPhoto || "",
        guardianPhoto: form.guardianPhoto || "",
      }

      const res = await fetch("/api/student-information/student", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editId ? { ...payload, id: editId } : payload),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok || result.error) {
        throw new Error(result.error || "Failed to save student")
      }

      const customData = Object.entries(customValues)
        .map(([fieldId, value]) => ({
          field_id: parseInt(fieldId),
          value,
        }))
        .filter((v) => Number.isFinite(v.field_id))

      if (customData.length > 0 && result.id) {
        await fetch("/api/system-setting/custom-field-value", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ record_id: result.id, module: "Student", values: customData }),
        }).catch(() => {})
      }

      notify.success(`${editId ? "Student updated" : `Student ${result.firstName || form.firstName} ${result.lastName || ""} saved successfully`}`)
      if (!editId) {
        setCustomValues({})
        setForm({
          ...defaultFormState(),
          admissionNo: generateAdmissionNo(),
        })
      }
    } catch (e: any) {
      notify.error(e.message || "Failed to save student")
    } finally {
      setSaving(false)
    }
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
        setImportResult({ imported: 0, failed: 0, errors: [error] })
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
      const errors = (result.errors || []).map((er: { error?: string }) => er.error || "Unknown error")
      setImportResult({ imported: created, failed: errors.length, errors })
      setImportPreview([])
      setImportFile(null)
      if (errors.length === 0) {
        notify.success(`Successfully imported ${created} student${created === 1 ? "" : "s"}`)
      }
    } catch (e) {
      setImportResult({ imported: 0, failed: importPreview.length, errors: [e instanceof Error ? e.message : String(e)] })
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

  const SectionHeader = ({ title, sectionKey }: { title: string; sectionKey: string }) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
    >
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {openSections[sectionKey] ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
    </button>
  )

  const renderCustomFields = (belongsTo: string) => {
    const fields = customFields.filter((f) => f.belongsTo === belongsTo)
    if (fields.length === 0) return null
    return (
      <>
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-3">Custom Fields ({belongsTo})</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fields.map((cf) => {
            const val = customValues[cf.id] ?? ""
            const options = cf.options ? cf.options.split(",").map((o) => o.trim()).filter(Boolean) : []
            const fieldId = `custom_${cf.id}`
            return (
              <div key={cf.id}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {cf.fieldName} {cf.required && <span className="text-red-500">*</span>}
                </label>
                {cf.fieldType === "Text" && (
                  <input type="text" value={val} onChange={(e) => setCustomValues((p) => ({ ...p, [cf.id]: e.target.value }))}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                )}
                {cf.fieldType === "Number" && (
                  <input type="number" value={val} onChange={(e) => setCustomValues((p) => ({ ...p, [cf.id]: e.target.value }))}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                )}
                {cf.fieldType === "Date" && (
                  <input type="text" value={val} onChange={(e) => setCustomValues((p) => ({ ...p, [cf.id]: e.target.value }))}
                    placeholder="MM/DD/YYYY"
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                )}
                {cf.fieldType === "Textarea" && (
                  <textarea value={val} onChange={(e) => setCustomValues((p) => ({ ...p, [cf.id]: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                )}
                {cf.fieldType === "Select" && (
                  <select value={val} onChange={(e) => setCustomValues((p) => ({ ...p, [cf.id]: e.target.value }))}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                    <option value="">Select</option>
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {cf.fieldType === "Checkbox" && (
                  <div className="flex items-center gap-2 mt-1">
                    <input type="checkbox" checked={val === "true"} onChange={(e) => setCustomValues((p) => ({ ...p, [cf.id]: e.target.checked ? "true" : "false" }))}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                    <span className="text-sm text-gray-600">{cf.fieldName}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  const renderField = (label: string, field: string, type: "text" | "select" | "date" | "textarea" | "file" | "radio" | "checkbox" | "multi-select", options?: { value: string; label: string }[], required?: boolean) => {
    const value = form[field as keyof FormData] as string
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === "text" && (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        )}
        {type === "date" && (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder="MM/DD/YYYY"
          />
        )}
        {type === "select" && (
          <select
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
        {type === "textarea" && (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        )}
        {type === "file" && (
          <div className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg flex items-center text-gray-400 bg-gray-50">
            {value || "No file chosen"}
          </div>
        )}
        {type === "radio" && (
          <div className="flex items-center gap-4 mt-1">
            {options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name={field}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="accent-indigo-600"
                />
                {opt.label}
              </label>
            ))}
          </div>
        )}
        {type === "checkbox" && (
          <div className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg flex items-center text-gray-400 bg-gray-50">
            {value || "No file chosen"}
          </div>
        )}
        {errors[field] && <p className="text-red-400 text-xs mt-0.5">{errors[field]}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{editId ? "Edit Student" : "Student Admission"}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Student Information / {editId ? "Edit Student" : "Student Admission"}</p>
        </div>
        {!editId && (
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors">
            <Upload className="h-3.5 w-3.5" />
            Import Student
          </button>
        )}
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Section 1: Basic Details */}
        <div className="border-b border-gray-200">
          <SectionHeader title="Basic Details" sectionKey="basic" />
          {openSections.basic && (
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Admission No</label>
                  <input
                    type="text"
                    value={form.admissionNo}
                    readOnly
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={form.rollNumber}
                    onChange={(e) => handleInputChange("rollNumber", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                  {errors.firstName && <p className="text-red-400 text-xs mt-0.5">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={form.middleName}
                    onChange={(e) => handleInputChange("middleName", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class <span className="text-red-500">*</span></label>
                  <select
                    value={form.classVal}
                    onChange={(e) => handleInputChange("classVal", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  >
                    {classOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.classVal && <p className="text-red-400 text-xs mt-0.5">{errors.classVal}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Section <span className="text-red-500">*</span></label>
                  <select
                    value={form.section}
                    onChange={(e) => handleInputChange("section", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  >
                    {sectionOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.section && <p className="text-red-400 text-xs mt-0.5">{errors.section}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Gender <span className="text-red-500">*</span></label>
                  <select
                    value={form.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  >
                    {genderOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.gender && <p className="text-red-400 text-xs mt-0.5">{errors.gender}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date Of Birth</label>
                  <input
                    type="text"
                    value={form.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    placeholder="MM/DD/YYYY"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Religion</label>
                  <input
                    type="text"
                    value={form.religion}
                    onChange={(e) => handleInputChange("religion", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Caste</label>
                  <input
                    type="text"
                    value={form.caste}
                    onChange={(e) => handleInputChange("caste", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={form.mobileNumber}
                    onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="text"
                    value={form.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Admission Date</label>
                  <input
                    type="text"
                    value={form.admissionDate}
                    onChange={(e) => handleInputChange("admissionDate", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    placeholder="MM/DD/YYYY"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Blood Group</label>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => handleInputChange("bloodGroup", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  >
                    {bloodGroupOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">House</label>
                  <select
                    value={form.house}
                    onChange={(e) => handleInputChange("house", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  >
                    {houseOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                  <input
                    type="text"
                    value={form.height}
                    onChange={(e) => handleInputChange("height", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Weight</label>
                  <input
                    type="text"
                    value={form.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Measurement Date</label>
                  <input
                    type="text"
                    value={form.measurementDate}
                    onChange={(e) => handleInputChange("measurementDate", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    placeholder="MM/DD/YYYY"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Student Photo</label>
                  <PhotoUpload value={form.studentPhoto} onChange={(v) => handleInputChange("studentPhoto", v)} />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setSiblingOpen(true)}
                    className="w-full h-9 flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Sibling
                  </button>
                  {form.siblingName && (
                    <div className="ml-2 inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-green-50 text-green-700 text-sm">
                      {form.siblingName}
                      <button type="button" onClick={() => handleInputChange("siblingName", "")} className="hover:text-green-900">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Previous School Details</label>
                  <textarea
                    value={form.previousSchool}
                    onChange={(e) => handleInputChange("previousSchool", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => handleInputChange("note", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>
              {renderCustomFields("Basic Info")}
              {renderCustomFields("Academic")}
            </div>
          )}
        </div>

        {/* Section 2: Multi Class Student */}
        <div className="border-b border-gray-200">
          <SectionHeader title="Multi Class Student" sectionKey="multiClass" />
          {openSections.multiClass && (
            <div className="p-5">
              <div className="flex justify-end mb-3">
                <button
                  type="button"
                  onClick={addMultiClassRow}
                  className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-3 py-1.5 rounded-lg hover:opacity-90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
              {form.multiClassRows.length === 0 ? (
                <p className="text-sm text-gray-400">No additional classes added.</p>
              ) : (
                <div className="space-y-3">
                  {form.multiClassRows.map((row, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end border border-gray-200 rounded-lg p-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                        <select
                          value={row.classVal}
                          onChange={(e) => updateMultiClassRow(index, "classVal", e.target.value)}
                          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                        >
                          <option value="">Select</option>
                          {classList.map((c) => (
                            <option key={c.id} value={String(c.id)}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
                        <input
                          type="text"
                          value={row.section}
                          onChange={(e) => updateMultiClassRow(index, "section", e.target.value)}
                          className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeMultiClassRow(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Transport Details */}
        <div className="border-b border-gray-200">
          <SectionHeader title="Transport Details" sectionKey="transport" />
          {openSections.transport && (
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Route List/Pickup Point</label>
                  <select
                    value={form.routeList}
                    onChange={(e) => handleInputChange("routeList", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  >
                    {routeOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Pickup Point</label>
                  <select
                    value={form.pickupPoint}
                    onChange={(e) => handleInputChange("pickupPoint", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  >
                    {pickupOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fees Month</label>
                  <div className="relative">
                    <select
                      multiple
                      value={form.feesMonth}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (o) => o.value)
                        handleInputChange("feesMonth", selected)
                      }}
                      className="w-full h-24 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                    >
                      {months.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Hostel Details */}
        <div className="border-b border-gray-200">
          <SectionHeader title="Hostel Details" sectionKey="hostel" />
          {openSections.hostel && (
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hostel</label>
                  <select
                    value={form.hostel}
                    onChange={(e) => handleInputChange("hostel", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  >
                    {hostelOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Room No</label>
                  <select
                    value={form.roomNo}
                    onChange={(e) => handleInputChange("roomNo", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  >
                    {roomOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Fees Details */}
        <div className="border-b border-gray-200">
          <SectionHeader title="Fees Details" sectionKey="fees" />
          {openSections.fees && (
            <div className="p-5">
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Fee Group</h4>
                <div className="space-y-2">
                  {feeGroupOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.feeGroups.includes(opt.value)}
                        onChange={() => handleArrayToggle("feeGroups", opt.value)}
                        className="accent-indigo-600"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Discount</h4>
                <div className="space-y-2">
                  {discountOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.discounts.includes(opt.value)}
                        onChange={() => handleArrayToggle("discounts", opt.value)}
                        className="accent-indigo-600"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Parent Guardian Detail */}
        <div className="border-b border-gray-200">
          <SectionHeader title="Parent Guardian Detail" sectionKey="parent" />
          {openSections.parent && (
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Father Name</label>
                  <input
                    type="text"
                    value={form.fatherName}
                    onChange={(e) => handleInputChange("fatherName", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Father Phone</label>
                  <input
                    type="text"
                    value={form.fatherPhone}
                    onChange={(e) => handleInputChange("fatherPhone", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Father Occupation</label>
                  <input
                    type="text"
                    value={form.fatherOccupation}
                    onChange={(e) => handleInputChange("fatherOccupation", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Father Photo</label>
                  <PhotoUpload value={form.fatherPhoto} onChange={(v) => handleInputChange("fatherPhoto", v)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mother Name</label>
                  <input
                    type="text"
                    value={form.motherName}
                    onChange={(e) => handleInputChange("motherName", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mother Phone</label>
                  <input
                    type="text"
                    value={form.motherPhone}
                    onChange={(e) => handleInputChange("motherPhone", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mother Occupation</label>
                  <input
                    type="text"
                    value={form.motherOccupation}
                    onChange={(e) => handleInputChange("motherOccupation", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mother Photo</label>
                  <PhotoUpload value={form.motherPhoto} onChange={(v) => handleInputChange("motherPhoto", v)} />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700 mb-3">Guardian Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Guardian Is</label>
                    <div className="flex items-center gap-4 mt-1">
                      {["Father", "Mother", "Other"].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="guardianIs"
                            value={opt}
                            checked={form.guardianIs === opt}
                            onChange={(e) => handleInputChange("guardianIs", e.target.value)}
                            className="accent-indigo-600"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Guardian Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.guardianName}
                      onChange={(e) => handleInputChange("guardianName", e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    />
                    {errors.guardianName && <p className="text-red-400 text-xs mt-0.5">{errors.guardianName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Guardian Relation</label>
                    <input
                      type="text"
                      value={form.guardianRelation}
                      onChange={(e) => handleInputChange("guardianRelation", e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Guardian Phone <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.guardianPhone}
                      onChange={(e) => handleInputChange("guardianPhone", e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    />
                    {errors.guardianPhone && <p className="text-red-400 text-xs mt-0.5">{errors.guardianPhone}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Guardian Occupation</label>
                    <input
                      type="text"
                      value={form.guardianOccupation}
                      onChange={(e) => handleInputChange("guardianOccupation", e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Guardian Email</label>
                    <input
                      type="text"
                      value={form.guardianEmail}
                      onChange={(e) => handleInputChange("guardianEmail", e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Guardian Address</label>
                    <textarea
                      value={form.guardianAddress}
                      onChange={(e) => handleInputChange("guardianAddress", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Guardian Photo</label>
                    <PhotoUpload value={form.guardianPhoto} onChange={(v) => handleInputChange("guardianPhoto", v)} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 6: Address & Miscellaneous */}
        <div className="border-b border-gray-200">
          <SectionHeader title="Address &amp; Miscellaneous" sectionKey="address" />
          {openSections.address && (
            <div className="p-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="guardianIsCurrent"
                    checked={form.guardianIsCurrent}
                    onChange={(e) => {
                      handleInputChange("guardianIsCurrent", e.target.checked)
                      if (e.target.checked) handleInputChange("currentAddress", form.guardianAddress)
                    }}
                    className="accent-indigo-600"
                  />
                  <label htmlFor="guardianIsCurrent" className="text-sm text-gray-700 cursor-pointer">If Guardian Address Is Current Address</label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Current Address</label>
                  <textarea
                    value={form.currentAddress}
                    onChange={(e) => handleInputChange("currentAddress", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="permanentIsCurrent"
                    checked={form.permanentIsCurrent}
                    onChange={(e) => {
                      handleInputChange("permanentIsCurrent", e.target.checked)
                      if (e.target.checked) handleInputChange("permanentAddress", form.currentAddress)
                    }}
                    className="accent-indigo-600"
                  />
                  <label htmlFor="permanentIsCurrent" className="text-sm text-gray-700 cursor-pointer">If Permanent Address Is Current Address</label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Permanent Address</label>
                  <textarea
                    value={form.permanentAddress}
                    onChange={(e) => handleInputChange("permanentAddress", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>

              {renderCustomFields("Address")}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={form.bankAccount}
                    onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(e) => handleInputChange("bankName", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={form.ifscCode}
                    onChange={(e) => handleInputChange("ifscCode", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">National Identification Number</label>
                  <input
                    type="text"
                    value={form.nationalId}
                    onChange={(e) => handleInputChange("nationalId", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Local Identification Number</label>
                  <input
                    type="text"
                    value={form.localId}
                    onChange={(e) => handleInputChange("localId", e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">RTE</label>
                  <div className="flex items-center gap-4 mt-1">
                    {["Yes", "No"].map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="rte"
                          value={opt}
                          checked={form.rte === opt}
                          onChange={(e) => handleInputChange("rte", e.target.value)}
                          className="accent-indigo-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Upload Documents</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Title</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Document</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.documents.map((doc, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={doc.title}
                              onChange={(e) => handleDocChange(index, "title", e.target.value)}
                              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                              placeholder="Enter title"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg flex items-center text-gray-400 bg-gray-50">
                              {doc.document || "No file chosen"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--primary)] px-5 py-2.5 rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Import Student Modal */}
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
                    {classList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
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
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {importResult.imported > 0
                          ? `${importResult.imported} imported, ${importResult.failed} failed`
                          : "Import failed"}
                      </p>
                      {importResult.errors.map((er, i) => <p key={i}>- {er}</p>)}
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

      {/* Add Sibling Modal */}
      {siblingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800">Add Sibling</h3>
              <button type="button" onClick={() => setSiblingOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                <select
                  value={siblingClassId}
                  onChange={(e) => setSiblingClassId(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                >
                  <option value="">Select</option>
                  {classList.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
                <select
                  value={siblingSectionId}
                  onChange={(e) => setSiblingSectionId(e.target.value)}
                  disabled={!siblingClassId}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Select</option>
                  {siblingSections.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Student</label>
                <select
                  value={siblingStudentId}
                  onChange={(e) => setSiblingStudentId(e.target.value)}
                  disabled={!siblingSectionId}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Select</option>
                  {siblingStudents.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setSiblingOpen(false)}
                className="text-xs font-medium text-gray-600 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addSibling}
                disabled={!siblingStudentId}
                className="text-xs font-medium text-white bg-[var(--primary)] px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PhotoUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("files", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.files?.[0]) throw new Error(data.error || "Upload failed")
      onChange(data.files[0].url)
      notify.success("Photo uploaded")
    } catch (err: any) {
      notify.error(err?.message || "Upload failed")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-[100px] h-[100px] shrink-0 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="photo" className="w-full h-full object-cover" />
        ) : (
          <Camera className="h-6 w-6 text-gray-300" />
        )}
      </div>
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Uploading..." : value ? "Change" : "Upload"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-1 px-3 h-8 text-xs font-medium text-red-500 border border-red-300 rounded-lg hover:bg-red-50 transition-colors w-full justify-center"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
