"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCurrency } from "@/lib/currency-context"
import { useAuth } from "@/lib/auth-context"
import { useSchoolInfo } from "@/lib/use-school-info"
import { ArrowLeft, Loader2, Key, Ban, X, Eye, Plus, Pencil, Trash2, Camera, Printer, FileDown, LogIn, Link2 } from "lucide-react"

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
  studentPhoto?: string
}

const fullName = (first: string | undefined | null, middle: string | undefined | null, last: string | undefined | null) =>
  [first, middle, last].filter((n) => n && n.trim()).join(" ")

const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const avatarColors = ["bg-blue-500", "bg-pink-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500", "bg-cyan-500", "bg-amber-500"]

function genderBadge(g: string) {
  switch (g) {
    case "Male": return "bg-blue-100 text-blue-800"
    case "Female": return "bg-pink-100 text-pink-800"
    default: return "bg-gray-100 text-gray-600"
  }
}

function categoryBadge(c: string) {
  switch (c) {
    case "General": return "bg-green-100 text-green-800"
    case "OBC": return "bg-orange-100 text-orange-800"
    case "SC": return "bg-purple-100 text-purple-800"
    case "ST": return "bg-teal-100 text-teal-800"
    default: return "bg-gray-100 text-gray-600"
  }
}

function initials(first: string | undefined | null, last: string | undefined | null) {
  return ((first?.charAt(0) || "") + (last?.charAt(0) || "")).toUpperCase() || "?"
}

function fmtDate(d: string | undefined | null) {
  if (!d) return "-"
  const parts = d.split("T")[0].split("-")
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d
}

const num = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const money = (symbol: string, v: number) => `${symbol}${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function partsOf(d: string | null | undefined): { y: string; m: number; day: number } | null {
  if (!d) return null
  const p = d.split("T")[0].split("-")
  if (p.length !== 3) return null
  return { y: p[0], m: parseInt(p[1], 10) - 1, day: parseInt(p[2], 10) }
}

export default function StudentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { symbol } = useCurrency()
  const { school } = useAuth()
  const { info: schoolInfo } = useSchoolInfo()

  const [student, setStudent] = useState<StudentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("profile")
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [feesData, setFeesData] = useState<any[]>([])
  const [feeGroups, setFeeGroups] = useState<Record<number, string>>({})
  const [feeTypes, setFeeTypes] = useState<Record<number, { name: string; group: string }>>({})
  const [masterDueDates, setMasterDueDates] = useState<Record<string, string>>({})
  const [examData, setExamData] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [behaviourData, setBehaviourData] = useState<any[]>([])
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [libraryData, setLibraryData] = useState<any[]>([])
  const [salesData, setSalesData] = useState<any[]>([])
  const [productNames, setProductNames] = useState<Record<number, string>>({})
  const [bookTitles, setBookTitles] = useState<Record<number, string>>({})

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginInfo, setLoginInfo] = useState<any>(null)
  const [loginAsBusy, setLoginAsBusy] = useState<string | null>(null)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disableReasons, setDisableReasons] = useState<{ id: number; reason: string }[]>([])
  const [disableForm, setDisableForm] = useState({ reasonId: "", date: new Date().toISOString().split("T")[0], note: "" })

  const [showTimelineModal, setShowTimelineModal] = useState(false)
  const [editingTimelineId, setEditingTimelineId] = useState<number | null>(null)
  const [timelineForm, setTimelineForm] = useState({ title: "", description: "", timelineDate: new Date().toISOString().split("T")[0] })
  const [timelineDeleteTarget, setTimelineDeleteTarget] = useState<any>(null)

  const [showBehaviourModal, setShowBehaviourModal] = useState(false)
  const [editingBehaviourId, setEditingBehaviourId] = useState<number | null>(null)
  const [behaviourForm, setBehaviourForm] = useState({ title: "", points: 0, isNegative: false, description: "", incidentDate: new Date().toISOString().split("T")[0] })
  const [behaviourDeleteTarget, setBehaviourDeleteTarget] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/student-information/student?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return }
        setStudent(data)
      })
      .catch(() => setError("Failed to load student"))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!student) return
    Promise.all([
      fetch("/api/fees/fees-payment").then((r) => r.json()).then((d) => setFeesData((Array.isArray(d) ? d : []).filter((f: any) => String(f.studentId || f.student_id) === String(student.id)))),
      fetch("/api/examinations/mark").then((r) => r.json()).then((d) => setExamData(Array.isArray(d) ? d.filter((m: any) => String(m.student_id || m.studentId) === String(student.id)) : [])),
      fetch("/api/attendance/student").then((r) => r.json()).then((d) => setAttendanceData(Array.isArray(d) ? d.filter((a: any) => String(a.student_id || a.studentId) === String(student.id)) : [])),
      fetch(`/api/behaviour/incident?student_id=${student.id}`).then((r) => r.json()).then((d) => setBehaviourData(Array.isArray(d) ? d : [])),
      fetch(`/api/student-information/timeline?student_id=${student.id}`).then((r) => r.json()).then((d) => setTimelineData(Array.isArray(d) ? d : [])),
      fetch("/api/library/issue").then((r) => r.json()).then((d) => setLibraryData((Array.isArray(d) ? d : []).filter((l: any) => String(l.memberId ?? l.member_id) === String(student.id) || String(l.memberName ?? l.member_name) === fullName(student.firstName, student.middleName, student.lastName)))),
      fetch(`/api/students-inventory/sale?student_id=${student.id}`).then((r) => r.json()).then((d) => setSalesData(Array.isArray(d) ? d : [])),
      fetch("/api/students-inventory/product").then((r) => r.json()).then((d) => {
        const map: Record<number, string> = {}
        ;(Array.isArray(d) ? d : []).forEach((p: any) => { map[Number(p.id)] = p.name })
        setProductNames(map)
      }),
      fetch("/api/students-inventory/book").then((r) => r.json()).then((d) => {
        const map: Record<number, string> = {}
        ;(Array.isArray(d) ? d : []).forEach((b: any) => { map[Number(b.id)] = b.title })
        setBookTitles(map)
      }),
      fetch("/api/fees/fees-group").then((r) => r.json()).then((d) => {
        const map: Record<number, string> = {}
        ;(Array.isArray(d) ? d : []).forEach((g: any) => { map[Number(g.id)] = g.name })
        setFeeGroups(map)
      }),
      fetch("/api/fees/fees-type").then((r) => r.json()).then((d) => {
        const map: Record<number, { name: string; group: string }> = {}
        ;(Array.isArray(d) ? d : []).forEach((t: any) => { map[Number(t.id)] = { name: t.name, group: t.feesGroup } })
        setFeeTypes(map)
      }),
      fetch("/api/fees/fees-master").then((r) => r.json()).then((d) => {
        const map: Record<string, string> = {}
        ;(Array.isArray(d) ? d : []).forEach((m: any) => { if (m.dueDate) map[`${m.feesGroup}|${m.feesType}`] = m.dueDate })
        setMasterDueDates(map)
      }),
    ]).catch(() => {})
  }, [student])

  useEffect(() => {
    fetch("/api/student-information/disable-reason")
      .then((r) => r.json())
      .then((d) => setDisableReasons(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!showLoginModal || !student) return
    setLoginInfo(null)
    fetch(`/api/student-information/student/login?id=${student.id}`)
      .then((r) => r.json())
      .then((d) => setLoginInfo(d))
      .catch(() => setLoginInfo(null))
  }, [showLoginModal, student])

  const handleLoginAs = async (kind: "student" | "parent") => {
    const info = kind === "student" ? loginInfo?.student : loginInfo?.parent
    if (!info?.userId) {
      notify.error(`No ${kind} login account is linked yet`)
      return
    }
    setLoginAsBusy(kind)
    try {
      const res = await fetch("/api/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: info.userId,
          returnUrl: student ? `/admin/student-information/student-details/${student.id}` : "/admin",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Login as failed")
      router.push(data.redirect || "/portal")
    } catch (e: any) {
      notify.error(e.message || "Failed to login as user")
    } finally {
      setLoginAsBusy(null)
    }
  }

  const handleDisableStudent = async () => {
    if (!student || !disableForm.reasonId) return
    try {
      const res = await fetch(`/api/student-information/student`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: student.id,
          status: "Disabled",
          note: `Disabled: ${disableReasons.find((r) => r.id === Number(disableForm.reasonId))?.reason || ""} on ${disableForm.date}. ${disableForm.note}`,
        }),
      })
      if (!res.ok) throw new Error("Failed to disable student")
      setStudent((prev) => prev ? { ...prev, status: "Disabled" } : null)
      setShowDisableModal(false)
      setDisableForm({ reasonId: "", date: new Date().toISOString().split("T")[0], note: "" })
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !student) return
    setPhotoUploading(true)
    try {
      const fd = new FormData()
      fd.append("files", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.success || !data.files?.[0]) throw new Error(data.error || "Upload failed")
      const url = data.files[0].url
      const updateRes = await fetch(`/api/student-information/student`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: student.id, studentPhoto: url }),
      })
      if (!updateRes.ok) throw new Error("Failed to update photo")
      setStudent((prev) => prev ? { ...prev, studentPhoto: url } : null)
      notify.success("Profile photo updated")
    } catch (err: any) {
      notify.error(err.message || "Failed to update photo")
    } finally {
      setPhotoUploading(false)
      if (photoInputRef.current) photoInputRef.current.value = ""
    }
  }

  const handleSaveTimeline = async () => {
    if (!student) return
    try {
      const payload = {
        studentId: student.id,
        title: timelineForm.title,
        description: timelineForm.description,
        timelineDate: timelineForm.timelineDate,
      }
      const res = await fetch("/api/student-information/timeline", {
        method: editingTimelineId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTimelineId ? { ...payload, id: editingTimelineId } : payload),
      })
      if (!res.ok) throw new Error("Failed to save timeline")
      const item = await res.json()
      setTimelineData((prev) => {
        const rest = editingTimelineId ? prev.filter((t) => t.id !== editingTimelineId) : prev
        return [item, ...rest]
      })
      setShowTimelineModal(false)
      setEditingTimelineId(null)
      setTimelineForm({ title: "", description: "", timelineDate: new Date().toISOString().split("T")[0] })
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const handleDeleteTimeline = async () => {
    if (!timelineDeleteTarget) return
    try {
      const res = await fetch(`/api/student-information/timeline?id=${timelineDeleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete timeline")
      setTimelineData((prev) => prev.filter((t) => t.id !== timelineDeleteTarget.id))
      setTimelineDeleteTarget(null)
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const handleSaveBehaviour = async () => {
    if (!student) return
    try {
      const payload = {
        studentId: student.id,
        title: behaviourForm.title,
        points: behaviourForm.points,
        isNegative: behaviourForm.isNegative,
        description: behaviourForm.description,
        incidentDate: behaviourForm.incidentDate,
      }
      const res = await fetch("/api/behaviour/incident", {
        method: editingBehaviourId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBehaviourId ? { ...payload, id: editingBehaviourId } : payload),
      })
      if (!res.ok) throw new Error("Failed to save behaviour")
      const item = await res.json()
      setBehaviourData((prev) => {
        const rest = editingBehaviourId ? prev.filter((b) => b.id !== editingBehaviourId) : prev
        return [item, ...rest]
      })
      setShowBehaviourModal(false)
      setEditingBehaviourId(null)
      setBehaviourForm({ title: "", points: 0, isNegative: false, description: "", incidentDate: new Date().toISOString().split("T")[0] })
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const handleDeleteBehaviour = async () => {
    if (!behaviourDeleteTarget) return
    try {
      const res = await fetch(`/api/behaviour/incident?id=${behaviourDeleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete behaviour")
      setBehaviourData((prev) => prev.filter((b) => b.id !== behaviourDeleteTarget.id))
      setBehaviourDeleteTarget(null)
    } catch (e: any) {
      notify.error(e.message)
    }
  }

  const openAddTimeline = () => {
    setEditingTimelineId(null)
    setTimelineForm({ title: "", description: "", timelineDate: new Date().toISOString().split("T")[0] })
    setShowTimelineModal(true)
  }

  const openEditTimeline = (t: any) => {
    setEditingTimelineId(t.id)
    setTimelineForm({ title: t.title || "", description: t.description || "", timelineDate: (t.timelineDate || new Date().toISOString().split("T")[0]).split("T")[0] })
    setShowTimelineModal(true)
  }

  const openAddBehaviour = () => {
    setEditingBehaviourId(null)
    setBehaviourForm({ title: "", points: 0, isNegative: false, description: "", incidentDate: new Date().toISOString().split("T")[0] })
    setShowBehaviourModal(true)
  }

  const openEditBehaviour = (b: any) => {
    setEditingBehaviourId(b.id)
    setBehaviourForm({
      title: b.title || "",
      points: b.points ?? 0,
      isNegative: b.isNegative || b.points < 0,
      description: b.description || "",
      incidentDate: (b.incidentDate || new Date().toISOString().split("T")[0]).split("T")[0],
    })
    setShowBehaviourModal(true)
  }

  const buildProfileHtml = (): string => {
    if (!student) return ""
    const esc = (v: unknown) => {
      const s = typeof v === "string" ? v : v == null ? "" : String(v)
      return escapeHtml(s.trim() || "-")
    }
    const val = (v: unknown) => {
      const s = typeof v === "string" ? v : v == null ? "" : String(v)
      const t = s.trim()
      return t ? escapeHtml(t) : "-"
    }
    const dt = (v: unknown) => (v == null || v === "" ? "-" : escapeHtml(fmtDate(String(v))))
    const sName = escapeHtml((schoolInfo.name || school?.name || "Smart School").trim())
    const sTagline = school?.tagline ? escapeHtml(school.tagline) : ""
    const sAddress = schoolInfo.address || school?.address ? escapeHtml(schoolInfo.address || school?.address || "") : ""
    const contactRaw = [schoolInfo.phone || school?.phone, schoolInfo.email || school?.email, schoolInfo.website]
      .map((c) => (c || "").trim())
      .filter(Boolean)
      .join("  •  ")
    const sContact = contactRaw ? escapeHtml(contactRaw) : ""
    const logo = schoolInfo.logoSrc ? `<img src="${escapeHtml(schoolInfo.logoSrc)}" alt="logo" />` : ""
    const name = fullName(student.firstName, student.middleName, student.lastName)
    const init = initials(student.firstName, student.lastName)
    const photo = student.studentPhoto
      ? `<img src="${escapeHtml(student.studentPhoto)}" onerror="this.style.display='none'" style="width:56px;height:56px;border-radius:9999px;object-fit:cover;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.18);" />`
      : `<div style="width:56px;height:56px;border-radius:9999px;background:#ff7732;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;">${escapeHtml(init)}</div>`
    const row = (label: string, value: string) =>
      value === "-" || value === "<span>-</span>"
        ? ""
        : `<tr><td class="lbl">${label}</td><td class="v">${value}</td></tr>`
    const section = (title: string, rows: string) =>
      rows ? `<div class="card"><h3>${title}</h3><table class="kv">${rows}</table></div>` : ""
    const genDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    const status = student.status || "Active"
    const statusColor = status === "Active" ? "#059669" : status === "Disabled" ? "#dc2626" : "#6b7280"
    const fileName = `Student-Profile-${(student.admissionNo || String(student.id)).replace(/[^\w-]+/g, "")}`

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${fileName}</title>
<style>
  @page { size: A4; margin: 9mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 10px; line-height: 1.35; background: #fff; padding: 14px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; border-bottom: 2px solid #ff7732; padding-bottom: 6px; margin-bottom: 8px; }
  .brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .brand img { width: 40px; height: 40px; object-fit: contain; }
  .head h1 { font-size: 15px; color: #111827; line-height: 1.2; }
  .head .tag { color: #ff7732; font-size: 9.5px; margin-top: 1px; }
  .head .contact { font-size: 9px; color: #4b5563; margin-top: 1px; }
  .meta { text-align: right; font-size: 9px; color: #4b5563; line-height: 1.5; white-space: nowrap; }
  .meta .doc-title { font-size: 12px; font-weight: 700; color: #ff7732; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px; }
  .identity { display: flex; align-items: center; gap: 10px; padding: 6px 9px; border: 1px solid #e5e7eb; border-left: 4px solid #ff7732; border-radius: 8px; margin-bottom: 8px; background: #fffaf6; break-inside: avoid; page-break-inside: avoid; }
  .identity h2 { font-size: 13px; color: #111827; }
  .identity .sub { color: #4b5563; font-size: 10px; margin-top: 1px; }
  .badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
  .pill { display: inline-block; padding: 1px 7px; border-radius: 999px; font-size: 8.5px; font-weight: 700; background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
  .pill.status { color: ${statusColor}; border-color: ${statusColor}; background: #fff; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 8px 2px; background: #fff; break-inside: avoid; page-break-inside: avoid; }
  .card.full { grid-column: 1 / -1; }
  h3 { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.8px; color: #ff7732; margin-bottom: 2px; border-bottom: 1px solid #f3f4f6; padding-bottom: 2px; }
  table.kv { width: 100%; border-collapse: collapse; }
  table.kv tr:nth-child(even) td { background: #fafafa; }
  table.kv td { padding: 1px 4px; border-bottom: 1px solid #f3f4f6; vertical-align: top; font-size: 9px; }
  table.kv tr:last-child td { border-bottom: 0; }
  table.kv td.lbl { width: 46%; color: #6b7280; white-space: nowrap; }
  table.kv td.v { color: #111827; font-weight: 500; word-break: break-word; }
  .note { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 5px; padding: 4px 6px; line-height: 1.5; font-size: 9px; }
  .foot { margin-top: 6px; text-align: center; color: #6b7280; font-size: 8.5px; border-top: 1px solid #e5e7eb; padding-top: 4px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="head">
    <div class="brand">
      ${logo}
      <div>
        <h1>${sName}</h1>
        ${sTagline ? `<div class="tag">${sTagline}</div>` : ""}
        ${sAddress ? `<div class="contact">${sAddress}</div>` : ""}
        ${sContact ? `<div class="contact">${sContact}</div>` : ""}
      </div>
    </div>
    <div class="meta">
      <div class="doc-title">Student Profile</div>
      <div>Admission No: ${esc(student.admissionNo)}</div>
      <div>Generated: ${genDate}</div>
    </div>
  </div>

  <div class="identity">
    ${photo}
    <div>
      <h2>${escapeHtml(name)}</h2>
      <div class="sub">Class ${esc(student.class)}${student.section ? ` - ${esc(student.section)}` : ""} &nbsp;·&nbsp; Roll No: ${esc(student.rollNo)} &nbsp;·&nbsp; Admission No: ${esc(student.admissionNo)}</div>
      <div class="badges">
        <span class="pill status">${escapeHtml(status)}</span>
        ${student.gender ? `<span class="pill">${escapeHtml(student.gender)}</span>` : ""}
        ${student.category ? `<span class="pill">${escapeHtml(student.category)}</span>` : ""}
        ${student.bloodGroup ? `<span class="pill">Blood Group: ${escapeHtml(student.bloodGroup)}</span>` : ""}
        ${student.dob ? `<span class="pill">DOB: ${dt(student.dob)}</span>` : ""}
      </div>
    </div>
  </div>

  <div class="grid">
    ${section("Personal Details", [
      ["Admission No", esc(student.admissionNo)],
      ["Roll No", esc(student.rollNo)],
      ["First Name", val(student.firstName)],
      ["Middle Name", val(student.middleName)],
      ["Last Name", val(student.lastName)],
      ["Class", esc(student.class)],
      ["Section", val(student.section)],
      ["Date of Birth", dt(student.dob)],
      ["Blood Group", val(student.bloodGroup)],
      ["Height", val(student.height)],
      ["Weight", val(student.weight)],
      ["Measurement Date", dt(student.measurementDate)],
    ].map(([l, v]) => row(l, v)).join(""))}

    ${section("Contact & Other Details", [
      ["Mobile", val(student.mobile)],
      ["Email", val(student.email)],
      ["Address", val(student.address)],
      ["Religion", val(student.religion)],
      ["Caste", val(student.caste)],
      ["Category", val(student.category)],
      ["House", val(student.house)],
      ["Admission Date", dt(student.admissionDate)],
      ["Previous School", val(student.previousSchool)],
    ].map(([l, v]) => row(l, v)).join(""))}

    ${section("Parent Details", [
      ["Father Name", val(student.fatherName)],
      ["Father Phone", val(student.fatherPhone)],
      ["Father Occupation", val(student.fatherOccupation)],
      ["Mother Name", val(student.motherName)],
      ["Mother Phone", val(student.motherPhone)],
      ["Mother Occupation", val(student.motherOccupation)],
    ].map(([l, v]) => row(l, v)).join(""))}

    ${section("Guardian Details", [
      ["Guardian Is", val(student.guardianIs)],
      ["Guardian Name", val(student.guardianName)],
      ["Guardian Relation", val(student.guardianRelation)],
      ["Guardian Email", val(student.guardianEmail)],
      ["Guardian Phone", val(student.guardianPhone)],
      ["Guardian Occupation", val(student.guardianOccupation)],
      ["Guardian Address", val(student.guardianAddress)],
    ].map(([l, v]) => row(l, v)).join(""))}

    ${section("Addresses", [
      ["Current Address", val(student.currentAddress)],
      ["Permanent Address", val(student.permanentAddress)],
    ].map(([l, v]) => row(l, v)).join(""))}

    ${section("Bank & Identification", [
      ["Bank Account No", val(student.bankAccount)],
      ["Bank Name", val(student.bankName)],
      ["IFSC Code", val(student.ifscCode)],
      ["National Identification No", val(student.nationalId)],
      ["Local Identification No", val(student.localId)],
      ["RTE", val(student.rte)],
    ].map(([l, v]) => row(l, v)).join(""))}

    ${student.note ? `<div class="card full"><h3>Note</h3><div class="note">${escapeHtml(student.note)}</div></div>` : ""}
  </div>

  <div class="foot">This is a computer-generated student profile report · ${sName} · Generated on ${genDate}</div>
</body>
</html>`
  }

  const openProfileDoc = (mode: "download" | "print") => {
    const html = buildProfileHtml()
    if (!html) return
    const w = window.open("", "_blank")
    if (!w) {
      notify.error("Pop-up blocked — please allow pop-ups to download/print the student profile")
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
    const fire = () => {
      if (mode === "print") {
        w.onafterprint = () => {
          try { w.close() } catch { /* window already gone */ }
        }
      }
      w.focus()
      w.print()
    }
    if (w.document.readyState === "complete") setTimeout(fire, 150)
    else w.onload = () => setTimeout(fire, 150)
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)] mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading student profile...</p>
        </div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 text-sm">{error || "Student not found"}</p>
          <button onClick={() => router.back()} className="mt-4 text-xs font-medium text-[var(--primary)] hover:underline">Go Back</button>
        </div>
      </div>
    )
  }

  const tabs = [
    { key: "profile", label: "Profile" },
    { key: "fees", label: "Fees" },
    { key: "otherPayments", label: "Other Payments" },
    { key: "exam", label: "Exam" },
    { key: "cbse", label: "CBSE Examination" },
    { key: "attendance", label: "Attendance" },
    { key: "documents", label: "Documents" },
    { key: "timeline", label: "Timeline" },
    { key: "books", label: "Books" },
    { key: "behaviour", label: "Student Behaviour" },
  ]

  const presentCount = attendanceData.filter((a) => a.status === "Present" || a.attendence_type_id === 1).length
  const absentCount = attendanceData.filter((a) => a.status === "Absent" || a.attendence_type_id === 2).length
  const leaveCount = attendanceData.filter((a) => a.status === "Leave" || a.attendence_type_id === 3).length
  const totalAttendance = attendanceData.length || 1

  const Modal = ({ title, show, onClose, children }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">Student Profile</h2>
              <p className="text-xs text-white/80 mt-0.5">Student Information / Student Details / Profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openProfileDoc("download")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 border border-white/40 text-white text-xs font-medium transition-colors"
            >
              <FileDown className="h-4 w-4" /> Download PDF
            </button>
            <button
              onClick={() => openProfileDoc("print")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-[var(--primary)] text-xs font-semibold shadow-sm hover:bg-white/90 transition-colors"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 px-6 py-6 text-center">
              <div className="relative mx-auto w-28 h-28">
                {student.studentPhoto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={student.studentPhoto}
                    alt="Student"
                    className="w-28 h-28 rounded-full object-cover shadow-md border-4 border-white"
                  />
                ) : (
                  <div className={`w-28 h-28 rounded-full ${avatarColors[student.id % avatarColors.length]} flex items-center justify-center text-white font-bold text-3xl shadow-md border-4 border-white`}>
                    {initials(student.firstName, student.lastName)}
                  </div>
                )}
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  title="Change Profile Photo"
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-md hover:bg-[var(--secondary)] transition-colors disabled:opacity-60"
                >
                  {photoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <h1 className="text-lg font-bold text-gray-900 mt-4">{fullName(student.firstName, student.middleName, student.lastName)}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{student.class}{student.section ? ` - ${student.section}` : ""}</p>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Admission No</span>
                <span className="font-medium text-gray-800">{student.admissionNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Roll No</span>
                <span className="font-medium text-gray-800">{student.rollNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Date of Birth</span>
                <span className="font-medium text-gray-800">{fmtDate(student.dob)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Gender</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${genderBadge(student.gender)}`}>{student.gender}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Category</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryBadge(student.category)}`}>{student.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === "Active" ? "bg-green-100 text-green-800" : student.status === "Disabled" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}`}>{student.status || "Active"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Links</h4>
            </div>
            <div className="p-3 space-y-1">
              <button onClick={() => setShowLoginModal(true)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors">
                <Key className="h-4 w-4 text-blue-500" />
                <span>Login Details</span>
              </button>
              <button onClick={() => setShowDisableModal(true)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors">
                <Ban className="h-4 w-4 text-red-500" />
                <span>{student.status === "Disabled" ? "Already Disabled" : "Disable Student"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 overflow-x-auto">
            <div className="flex gap-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
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
            {activeTab === "profile" && (
              <div className="max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-[11px]">Personal Details</h4>
                    <div className="space-y-3">
                      {[
                        { label: "Admission No", value: student.admissionNo },
                        { label: "Roll No", value: student.rollNo },
                        { label: "First Name", value: student.firstName },
                        { label: "Middle Name", value: student.middleName || "-" },
                        { label: "Last Name", value: student.lastName },
                        { label: "Class", value: student.class },
                        { label: "Section", value: student.section || "-" },
                        { label: "Date of Birth", value: fmtDate(student.dob) },
                        { label: "Gender", value: student.gender },
                        { label: "Blood Group", value: student.bloodGroup || "-" },
                        { label: "Height", value: student.height || "-" },
                        { label: "Weight", value: student.weight || "-" },
                        { label: "Measurement Date", value: fmtDate(student.measurementDate) },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center border-b border-gray-50 pb-2">
                          <span className="text-xs text-gray-500">{item.label}</span>
                          <span className="text-sm font-medium text-gray-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-[11px]">Contact & Other Details</h4>
                    <div className="space-y-3">
                      {[
                        { label: "Mobile", value: student.mobile || "-" },
                        { label: "Email", value: student.email || "-" },
                        { label: "Address", value: student.address || "-" },
                        { label: "Religion", value: student.religion || "-" },
                        { label: "Caste", value: student.caste || "-" },
                        { label: "Category", value: student.category },
                        { label: "House", value: student.house || "-" },
                        { label: "Admission Date", value: fmtDate(student.admissionDate) },
                        { label: "Previous School", value: student.previousSchool || "-" },
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
                        { label: "Father Name", value: student.fatherName || "-" },
                        { label: "Father Phone", value: student.fatherPhone || "-" },
                        { label: "Father Occupation", value: student.fatherOccupation || "-" },
                        { label: "Mother Name", value: student.motherName || "-" },
                        { label: "Mother Phone", value: student.motherPhone || "-" },
                        { label: "Mother Occupation", value: student.motherOccupation || "-" },
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
                        { label: "Guardian Is", value: student.guardianIs || "-" },
                        { label: "Guardian Name", value: student.guardianName || "-" },
                        { label: "Guardian Relation", value: student.guardianRelation || "-" },
                        { label: "Guardian Email", value: student.guardianEmail || "-" },
                        { label: "Guardian Phone", value: student.guardianPhone || "-" },
                        { label: "Guardian Occupation", value: student.guardianOccupation || "-" },
                        { label: "Guardian Address", value: student.guardianAddress || "-" },
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
                        { label: "Current Address", value: student.currentAddress || "-" },
                        { label: "Permanent Address", value: student.permanentAddress || "-" },
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
                        { label: "Bank Account No", value: student.bankAccount || "-" },
                        { label: "Bank Name", value: student.bankName || "-" },
                        { label: "IFSC Code", value: student.ifscCode || "-" },
                        { label: "National Identification No", value: student.nationalId || "-" },
                        { label: "Local Identification No", value: student.localId || "-" },
                        { label: "RTE", value: student.rte || "-" },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center border-b border-gray-50 pb-2">
                          <span className="text-xs text-gray-500">{item.label}</span>
                          <span className="text-sm font-medium text-gray-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    {student.note && (
                      <>
                        <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-[11px] mt-6">Note</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{student.note}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "fees" && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Fees History</h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Invoice No</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Fees Group</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Fees Type</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Due Date</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Amount</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Discount</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Fine</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Paid</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Balance</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feesData.length === 0 ? (
                        <tr><td colSpan={10} className="text-center py-10 text-gray-400 text-sm">No fee records found</td></tr>
                      ) : (
                        feesData.map((f, i) => {
                          const amount = num(f.amount)
                          const discount = num(f.discountAmount)
                          const fine = num(f.fineAmount)
                          const paid = num(f.paidAmount)
                          const balance = amount - discount - paid
                          const groupName = f.feesGroup ? (feeGroups[Number(f.feesGroup)] ?? `Group ${f.feesGroup}`) : "-"
                          const typeName = f.feesType ? (feeTypes[Number(f.feesType)]?.name ?? `Type ${f.feesType}`) : "-"
                          const dueDate = masterDueDates[`${groupName}|${typeName}`] || "-"
                          return (
                            <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 text-gray-700 font-mono text-xs">{f.id ?? "-"}</td>
                              <td className="px-4 py-2.5 text-gray-700">{groupName}</td>
                              <td className="px-4 py-2.5 text-gray-700">{typeName}</td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs">{dueDate === "-" ? "-" : fmtDate(dueDate)}</td>
                              <td className="px-4 py-2.5 text-right text-gray-800 font-medium">{money(symbol, amount)}</td>
                              <td className="px-4 py-2.5 text-right text-gray-600">{discount > 0 ? money(symbol, discount) : "-"}</td>
                              <td className="px-4 py-2.5 text-right text-gray-600">{fine > 0 ? money(symbol, fine) : "-"}</td>
                              <td className="px-4 py-2.5 text-right text-gray-700">{paid > 0 ? money(symbol, paid) : "-"}</td>
                              <td className={`px-4 py-2.5 text-right font-medium ${balance > 0 ? "text-red-600" : "text-green-600"}`}>{money(symbol, balance)}</td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  f.status === "Paid" || f.status === "paid" ? "bg-green-100 text-green-800" :
                                  f.status === "Partial" || f.status === "partial" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {f.status || "Pending"}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                    {feesData.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-50 border-t border-gray-200">
                          <td colSpan={4} className="px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Total</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{money(symbol, feesData.reduce((s, f) => s + num(f.amount), 0))}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{money(symbol, feesData.reduce((s, f) => s + num(f.discountAmount), 0))}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{money(symbol, feesData.reduce((s, f) => s + num(f.fineAmount), 0))}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{money(symbol, feesData.reduce((s, f) => s + num(f.paidAmount), 0))}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-red-600">{money(symbol, feesData.reduce((s, f) => s + num(f.amount) - num(f.discountAmount) - num(f.paidAmount), 0))}</td>
                          <td className="px-4 py-2.5"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {activeTab === "otherPayments" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-800">Other Payments</h4>
                  <span className="text-xs text-gray-500">{salesData.length} record{salesData.length === 1 ? "" : "s"}</span>
                </div>
                {salesData.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">No other payments (POS sales) recorded for this student</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Sale No</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Item</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Type</th>
                          <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Qty</th>
                          <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Amount</th>
                          <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Discount</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Date</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.map((s, idx) => {
                          const itemName = s.bookId
                            ? bookTitles[Number(s.bookId)] || `Book #${s.bookId}`
                            : s.productId
                              ? productNames[Number(s.productId)] || `Product #${s.productId}`
                              : "-"
                          return (
                            <tr key={s.id ?? idx} className={`border-b border-gray-100 hover:bg-gray-50/50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                              <td className="px-4 py-3 font-medium text-gray-800">{s.saleNo || "-"}</td>
                              <td className="px-4 py-3 text-gray-700">{itemName}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${s.bookId ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                                  {s.bookId ? "Book" : "Product"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">{s.quantity}</td>
                              <td className="px-4 py-3 text-right font-medium text-gray-800">{money(symbol, num(s.totalAmount))}</td>
                              <td className="px-4 py-3 text-right text-red-600">{money(symbol, num(s.discountAmount))}</td>
                              <td className="px-4 py-3 text-gray-600">{fmtDate(s.saleDate)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${String(s.paymentStatus || "").toLowerCase() === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                  {s.paymentStatus || "Unpaid"}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      {salesData.length > 0 && (
                        <tfoot>
                          <tr className="bg-gray-50 border-t border-gray-200">
                            <td colSpan={4} className="px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Total</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{money(symbol, salesData.reduce((sum, s) => sum + num(s.totalAmount), 0))}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-red-600">{money(symbol, salesData.reduce((sum, s) => sum + num(s.discountAmount), 0))}</td>
                            <td colSpan={2} className="px-4 py-2.5"></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "exam" && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Exam Results</h4>
                {examData.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">No exam records found for this student</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Exam</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Subject</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Marks</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examData.map((m, i) => (
                          <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 text-gray-700">{m.exam_name || m.exam_id || "-"}</td>
                            <td className="px-4 py-2.5 text-gray-700">{m.subject_name || m.subject_id || "-"}</td>
                            <td className="px-4 py-2.5 text-gray-700">{m.marks_obtained || m.marks || "-"}/{m.max_marks || "-"}</td>
                            <td className="px-4 py-2.5">{m.grade ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">{m.grade}</span> : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "cbse" && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-4">CBSE Examination</h4>
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No CBSE examination records found</p>
                </div>
              </div>
            )}

            {activeTab === "attendance" && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Attendance Summary</h4>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-xl p-5 text-center border border-green-200">
                    <p className="text-3xl font-bold text-green-700">{presentCount}</p>
                    <p className="text-xs text-green-600 mt-1">Present</p>
                    <p className="text-[10px] text-green-400 mt-0.5">{((presentCount / totalAttendance) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-5 text-center border border-red-200">
                    <p className="text-3xl font-bold text-red-700">{absentCount}</p>
                    <p className="text-xs text-red-600 mt-1">Absent</p>
                    <p className="text-[10px] text-red-400 mt-0.5">{((absentCount / totalAttendance) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-5 text-center border border-yellow-200">
                    <p className="text-3xl font-bold text-yellow-700">{leaveCount}</p>
                    <p className="text-xs text-yellow-600 mt-1">Leave</p>
                    <p className="text-[10px] text-yellow-400 mt-0.5">{((leaveCount / totalAttendance) * 100).toFixed(1)}%</p>
                  </div>
                </div>
                {attendanceData.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Date</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.map((a, i) => (
                          <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 text-gray-500 text-xs">{a.date ? fmtDate(a.date) : "-"}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                a.status === "Present" || a.attendence_type_id === 1 ? "bg-green-100 text-green-800" :
                                a.status === "Absent" || a.attendence_type_id === 2 ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                              }`}>
                                {a.status || (a.attendence_type_id === 1 ? "Present" : a.attendence_type_id === 2 ? "Absent" : "Leave")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {attendanceData.length === 0 && (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm">No attendance records found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "documents" && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Documents</h4>
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No documents uploaded</p>
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-800">Timeline</h4>
                  <button onClick={openAddTimeline} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add Timeline
                  </button>
                </div>

                {(() => {
                  const events = [
                    {
                      title: "Student Admitted",
                      description: null as string | null,
                      timelineDate: student.admissionDate,
                      createdBy: "",
                      admission: true,
                    },
                    ...timelineData.map((t) => ({ title: t.title, description: t.description, timelineDate: t.timelineDate, createdBy: t.createdBy || "", admission: false })),
                  ].filter((e) => e.timelineDate)

                  if (events.length === 0) {
                    return <p className="text-xs text-gray-400">No timeline events. Click "Add Timeline" to record one.</p>
                  }

                  const months: { key: string; label: string; dates: { key: string; label: string; items: any[] }[] }[] = []
                  for (const ev of events) {
                    const pd = partsOf(ev.timelineDate)
                    if (!pd) continue
                    const monthKey = `${pd.y}-${pd.m}`
                    const dayKey = `${pd.y}-${pd.m}-${pd.day}`
                    const dateLabel = `${pd.day}, ${DAYS[new Date(Number(pd.y), Number(pd.m), Number(pd.day)).getDay()]}`
                    let month = months.find((mo) => mo.key === monthKey)
                    if (!month) {
                      month = { key: monthKey, label: `${MONTHS[pd.m]}, ${pd.y}`, dates: [] }
                      months.push(month)
                    }
                    let dayGroup = month.dates.find((d) => d.key === dayKey)
                    if (!dayGroup) {
                      dayGroup = { key: dayKey, label: dateLabel, items: [] }
                      month.dates.push(dayGroup)
                    }
                    dayGroup.items.push(ev)
                  }

                  return (
                    <div className="relative">
                      <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-gradient-to-b from-[var(--primary)] via-gray-200 to-gray-200" />
                      <div className="space-y-8">
                        {months.map((month: any) => (
                          <div key={month.key} className="relative pl-8">
                            <div className="absolute left-[7px] -translate-x-1/2 top-0.5 w-5 h-5 rounded-full bg-[var(--primary)] ring-4 ring-[var(--primary)]/15 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                            <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-lg pl-3 pr-3 py-1.5">
                              <span className="text-sm font-semibold text-gray-800">{month.label}</span>
                              <span className="text-[10px] font-medium text-[var(--primary)] bg-[var(--primary)]/10 rounded-full px-2 py-0.5">
                                {month.dates.reduce((n: number, d: any) => n + d.items.length, 0)} {month.dates.reduce((n: number, d: any) => n + d.items.length, 0) === 1 ? "Entry" : "Entries"}
                              </span>
                            </div>
                            <div className="mt-5 space-y-7">
                              {month.dates.map((d: any) => (
                                <div key={d.key} className="relative">
                                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">{d.label}</div>
                                  <div className="space-y-4">
                                    {d.items.map((ev: any, ei: number) => (
                                      <div key={ei} className="relative">
                                        <div className="absolute -left-[22px] top-5 w-3 h-3 rounded-full bg-white border-2 border-[var(--primary)]" />
                                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                                          <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-[var(--primary)]/5 to-transparent px-3 py-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span className={`w-2 h-2 rounded-full shrink-0 ${ev.admission ? "bg-[var(--primary)]" : "bg-blue-500"}`} />
                                              <span className="text-sm font-semibold text-gray-800 truncate">{ev.title}</span>
                                            </div>
                                            {!ev.admission && (
                                              <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={() => openEditTimeline(ev)} className="p-1 text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Edit">
                                                  <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => setTimelineDeleteTarget(ev)} className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                          <div className="px-3 py-2.5">
                                            {ev.description ? (
                                              <p className="text-xs text-gray-600">{ev.description}</p>
                                            ) : (
                                              <p className="text-[11px] text-gray-400 italic">No description</p>
                                            )}
                                          </div>
                                          <div className="px-3 py-1.5 border-t border-gray-50 bg-gray-50/60 text-right">
                                            <span className="text-[11px] text-gray-500">
                                              {ev.createdBy ? `- ${ev.createdBy}` : ev.admission ? `- ${new Date(ev.timelineDate).getFullYear()}` : "Added on " + fmtDate(ev.timelineDate)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {activeTab === "books" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-800">Library Transactions</h4>
                  <span className="text-xs text-gray-500">{libraryData.length} record{libraryData.length === 1 ? "" : "s"}</span>
                </div>
                {libraryData.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">No library transactions for this student</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Book Name</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Book No.</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Issue Date</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Return Date</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {libraryData.map((l, idx) => (
                          <tr key={l.id ?? idx} className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                            <td className="px-4 py-3 font-medium text-gray-800">{l.bookName || l.book_name || "-"}</td>
                            <td className="px-4 py-3 text-gray-600">{l.bookNumber || l.book_number || "-"}</td>
                            <td className="px-4 py-3 text-gray-600">{fmtDate(l.issueDate || l.issue_date)}</td>
                            <td className="px-4 py-3 text-gray-600">{fmtDate(l.returnDate || l.return_date)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${(l.status || "").toLowerCase() === "returned" ? "bg-green-100 text-green-800" : (l.status || "").toLowerCase() === "due" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                                {l.status || "Issued"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "behaviour" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-800">Behaviour Records</h4>
                  <button onClick={openAddBehaviour} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add Behaviour
                  </button>
                </div>
                {behaviourData.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">No behaviour records for this student</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          {["Title", "Point", "Date", "Description", "Assign By", "Action"].map((h) => (
                            <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {behaviourData.map((b, i) => (
                          <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 text-gray-800 font-medium">{b.title || `Incident #${b.id}`}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                b.isNegative || (typeof b.points === "number" && b.points < 0) ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                              }`}>
                                {b.isNegative || (typeof b.points === "number" && b.points < 0) ? "-" : "+"}{Math.abs(b.points ?? 0)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">{b.incidentDate ? fmtDate(b.incidentDate) : "-"}</td>
                            <td className="px-4 py-2.5 text-gray-600 max-w-[280px]">{b.description || "-"}</td>
                            <td className="px-4 py-2.5 text-gray-600">{b.assignBy || "-"}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1">
                                <button onClick={() => openEditBehaviour(b)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={() => setBehaviourDeleteTarget(b)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal title="Login Details" show={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-lg px-3.5 py-2.5 flex items-center gap-2 text-xs text-gray-600">
            <Link2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span>
              Portal URL:{" "}
              <span className="font-mono font-medium text-gray-800 select-all">
                {typeof window !== "undefined" ? `${window.location.origin}/login` : "/login"}
              </span>
            </span>
          </div>
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              Student Login
            </h5>
            <div className="bg-blue-50 rounded-lg p-4 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Admission No</span>
                <span className="text-sm font-mono font-medium text-gray-800">{loginInfo?.admissionNo || student.admissionNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Username</span>
                <span className="text-sm font-mono font-medium text-gray-800">{loginInfo?.student?.username || (loginInfo ? "-" : "Loading...")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Email (login)</span>
                <span className="text-sm text-gray-800 break-all text-right select-all">{loginInfo?.student?.email || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Password</span>
                <span className="text-sm font-mono font-medium text-gray-800">{loginInfo?.student?.defaultPassword || "••••••••"}</span>
              </div>
              {loginInfo && !loginInfo.student?.exists && (
                <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1.5">Login will be auto-created on admission/import.</p>
              )}
              <button
                onClick={() => handleLoginAs("student")}
                disabled={loginAsBusy === "student" || !loginInfo?.student?.userId}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loginAsBusy === "student" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Login as Student (switch profile)
              </button>
            </div>
          </div>
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              Parent Login
            </h5>
            <div className="bg-green-50 rounded-lg p-4 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Username</span>
                <span className="text-sm font-mono font-medium text-gray-800">{loginInfo?.parent?.username || (loginInfo ? "-" : "Loading...")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Email (login)</span>
                <span className="text-sm text-gray-800 break-all text-right select-all">{loginInfo?.parent?.email || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Password</span>
                <span className="text-sm font-mono font-medium text-gray-800">{loginInfo?.parent?.defaultPassword || "••••••••"}</span>
              </div>
              {loginInfo && !loginInfo.parent?.exists && (
                <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1.5">Login will be auto-created on admission/import.</p>
              )}
              <button
                onClick={() => handleLoginAs("parent")}
                disabled={loginAsBusy === "parent" || !loginInfo?.parent?.userId}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loginAsBusy === "parent" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Login as Parent (switch profile)
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 italic">Students & parents sign in with the email above — school code is NOT required. The portal shows a "Back to Admin" button while viewing as a student/parent.</p>
        </div>
      </Modal>

      <Modal title="Disable Student" show={showDisableModal} onClose={() => setShowDisableModal(false)}>
        <div className="space-y-4">
          <p className="text-xs text-gray-500">Are you sure you want to disable <strong className="text-gray-800">{student.firstName} {student.lastName}</strong>?</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason <span className="text-red-500">*</span></label>
            <select value={disableForm.reasonId} onChange={(e) => setDisableForm((p) => ({ ...p, reasonId: e.target.value }))} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
              <option value="">Select reason</option>
              {disableReasons.map((r) => <option key={r.id} value={r.id}>{r.reason}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input type="date" value={disableForm.date} onChange={(e) => setDisableForm((p) => ({ ...p, date: e.target.value }))} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
            <textarea value={disableForm.note} onChange={(e) => setDisableForm((p) => ({ ...p, note: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" placeholder="Optional note..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setShowDisableModal(false); setDisableForm({ reasonId: "", date: new Date().toISOString().split("T")[0], note: "" }) }} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleDisableStudent} disabled={!disableForm.reasonId} className="px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 shadow-sm">Disable</button>
          </div>
        </div>
      </Modal>

      <Modal title={editingTimelineId ? "Edit Timeline" : "Add Timeline"} show={showTimelineModal} onClose={() => setShowTimelineModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
            <input type="text" value={timelineForm.title} onChange={(e) => setTimelineForm((p) => ({ ...p, title: e.target.value }))} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" placeholder="e.g. Document Submitted" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input type="date" value={timelineForm.timelineDate} onChange={(e) => setTimelineForm((p) => ({ ...p, timelineDate: e.target.value }))} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={timelineForm.description} onChange={(e) => setTimelineForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" placeholder="Optional description..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowTimelineModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSaveTimeline} disabled={!timelineForm.title} className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] disabled:opacity-50 shadow-sm">Save</button>
          </div>
        </div>
      </Modal>

      <Modal title={editingBehaviourId ? "Edit Behaviour" : "Add Behaviour"} show={showBehaviourModal} onClose={() => setShowBehaviourModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
            <input type="text" value={behaviourForm.title} onChange={(e) => setBehaviourForm((p) => ({ ...p, title: e.target.value }))} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" placeholder="e.g. Assigned work completed" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Point</label>
              <input type="number" value={behaviourForm.points} onChange={(e) => setBehaviourForm((p) => ({ ...p, points: Number(e.target.value) }))} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input type="date" value={behaviourForm.incidentDate} onChange={(e) => setBehaviourForm((p) => ({ ...p, incidentDate: e.target.value }))} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={behaviourForm.isNegative} onChange={(e) => setBehaviourForm((p) => ({ ...p, isNegative: e.target.checked }))} className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
            <span className="text-xs text-gray-600">Negative behaviour (points shown as minus)</span>
          </label>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={behaviourForm.description} onChange={(e) => setBehaviourForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" placeholder="Optional description..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowBehaviourModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSaveBehaviour} disabled={!behaviourForm.title} className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] disabled:opacity-50 shadow-sm">Save</button>
          </div>
        </div>
      </Modal>

      <Modal title="Delete Timeline Event" show={!!timelineDeleteTarget} onClose={() => setTimelineDeleteTarget(null)}>
        <div className="text-center py-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3"><Trash2 className="h-6 w-6 text-red-500" /></div>
          <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete this timeline event?</p>
          <p className="text-sm font-semibold text-gray-800">{timelineDeleteTarget?.title}</p>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
          <button onClick={() => setTimelineDeleteTarget(null)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleDeleteTimeline} className="px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm">Delete</button>
        </div>
      </Modal>

      <Modal title="Delete Behaviour Record" show={!!behaviourDeleteTarget} onClose={() => setBehaviourDeleteTarget(null)}>
        <div className="text-center py-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3"><Trash2 className="h-6 w-6 text-red-500" /></div>
          <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete this behaviour record?</p>
          <p className="text-sm font-semibold text-gray-800">{behaviourDeleteTarget?.title}</p>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
          <button onClick={() => setBehaviourDeleteTarget(null)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleDeleteBehaviour} className="px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm">Delete</button>
        </div>
      </Modal>

    </div>
  )
}
