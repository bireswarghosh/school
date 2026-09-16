"use client"

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, Eye, X, Search, List, Grid, AlertTriangle, CheckSquare, Mail, Phone, Shield, Upload, Image as ImageIcon, Users, Building2, Award, Filter, Calendar, UserCheck, TrendingUp } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Staff = {
  id: number
  staffId: string
  name: string
  surname: string
  fatherName: string
  motherName: string
  email: string
  gender: string
  dob: string
  dateOfJoining: string
  dateOfLeaving: string
  contactNo: string
  phone: string
  emergencyContactNo: string
  maritalStatus: string
  localAddress: string
  permanentAddress: string
  qualification: string
  workExp: string
  note: string
  image: string
  epfNo: string
  contractType: string
  basicSalary: string
  shift: string
  location: string
  accountTitle: string
  bankAccountNo: string
  bankName: string
  ifscCode: string
  bankBranch: string
  facebook: string
  twitter: string
  linkedin: string
  instagram: string
  resume: string
  joiningLetter: string
  resignationLetter: string
  otherDocumentFile: string
  otherDocumentName: string
  leavesData: Record<string, any>
  department: string
  designation: string
  departmentId: number | null
  designationId: number | null
  role: string
  status: string
}

type ViewMode = "list" | "card"

const rolesFallback = ["Admin", "Teacher", "Accountant", "Librarian", "Driver"]
const genders = ["Male", "Female", "Other"]
const maritalStatuses = ["Single", "Married", "Widowed", "Separated", "Not Specified"]
const contractTypes = ["Permanent", "Probation"]

const roleBadge = (role: string) =>
  role === "Admin" ? "bg-purple-50 text-purple-700 border-purple-200"
  : role === "Teacher" ? "bg-blue-50 text-blue-700 border-blue-200"
  : role === "Accountant" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
  : role === "Librarian" ? "bg-amber-50 text-amber-700 border-amber-200"
  : "bg-slate-50 text-slate-700 border-slate-200"

const avatarColors = ["bg-[var(--primary)]", "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-rose-500", "bg-amber-500"]
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "S"

type Dept = { id: number; name: string }
type Desig = { id: number; name: string }
type LeaveType = { id: number; name: string }

const emptyForm = {
  staffId: "",
  name: "",
  surname: "",
  fatherName: "",
  motherName: "",
  email: "",
  gender: "",
  dob: "",
  dateOfJoining: "",
  dateOfLeaving: "",
  contactNo: "",
  emergencyContactNo: "",
  maritalStatus: "",
  localAddress: "",
  permanentAddress: "",
  qualification: "",
  workExp: "",
  note: "",
  image: "",
  epfNo: "",
  contractType: "",
  basicSalary: "",
  shift: "",
  location: "",
  accountTitle: "",
  bankAccountNo: "",
  bankName: "",
  ifscCode: "",
  bankBranch: "",
  facebook: "",
  twitter: "",
  linkedin: "",
  instagram: "",
  resume: "",
  joiningLetter: "",
  resignationLetter: "",
  otherDocumentFile: "",
  otherDocumentName: "",
  departmentId: null as number | null,
  designationId: null as number | null,
  role: "",
  status: "Active",
  leavesData: {} as Record<string, any>,
}

function toDateInput(val: any) {
  if (!val) return ""
  return String(val).slice(0, 10)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function StaffDirectoryPage() {
  const { data: staffList, add, update, remove, loading } = useApi<Staff>("/api/human-resource/staff")
  const { data: deptList } = useApi<Dept>("/api/human-resource/department")
  const { data: desigList } = useApi<Desig>("/api/human-resource/designation")
  const { data: leaveTypes } = useApi<LeaveType>("/api/attendance/leave-type")

  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [showModal, setShowModal] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [viewing, setViewing] = useState<Staff | null>(null)
  const [filterDept, setFilterDept] = useState("")
  const [filterDesig, setFilterDesig] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [form, setForm] = useState({ ...emptyForm })
  const [formError, setFormError] = useState("")

  const depts = useMemo(() => deptList || [], [deptList])
  const desigs = useMemo(() => desigList || [], [desigList])
  const leaves = useMemo(() => leaveTypes || [], [leaveTypes])

  const roleOptions = useMemo(() => rolesFallback, [])

  const stats = useMemo(() => {
    const total = staffList.length
    const active = staffList.filter((s) => String(s.status).toLowerCase() === "active").length
    const teachers = staffList.filter((s) => String(s.role).toLowerCase().includes("teacher")).length
    const deptsCount = new Set(staffList.map((s) => s.department).filter(Boolean)).size
    return { total, active, teachers, deptsCount }
  }, [staffList])

  const filtered = useMemo(() => {
    let arr = staffList
    const q = search.trim().toLowerCase()
    if (q) {
      arr = arr.filter((s) => [s.staffId, s.name, s.surname, s.email, (s as any).contactNo, (s as any).phone, s.department, s.designation, s.role, s.qualification].filter(Boolean).join(" ").toLowerCase().includes(q))
    }
    if (filterDept) arr = arr.filter((s) => s.department === filterDept)
    if (filterDesig) arr = arr.filter((s) => s.designation === filterDesig)
    if (filterRole) arr = arr.filter((s) => s.role === filterRole)
    return arr
  }, [staffList, search, filterDept, filterDesig, filterRole])

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((s) => s.id)))
  }
  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleOpenAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setShowMore(false)
    setFormError("")
    setShowModal(true)
  }

  const handleOpenEdit = (s: Staff) => {
    setEditing(s)
    const leavesData = (s as any).leavesData || (s as any).leaves_data || {}
    const parsedLeaves = typeof leavesData === "string" ? (() => { try { return JSON.parse(leavesData) } catch { return {} } })() : leavesData
    setForm({
      staffId: s.staffId || "",
      name: s.name || "",
      surname: (s as any).surname || "",
      fatherName: (s as any).fatherName || "",
      motherName: (s as any).motherName || "",
      email: s.email || "",
      gender: (s as any).gender || "",
      dob: toDateInput((s as any).dob),
      dateOfJoining: toDateInput((s as any).dateOfJoining),
      dateOfLeaving: toDateInput((s as any).dateOfLeaving),
      contactNo: (s as any).contactNo || (s as any).phone || "",
      emergencyContactNo: (s as any).emergencyContactNo || "",
      maritalStatus: (s as any).maritalStatus || "",
      localAddress: (s as any).localAddress || "",
      permanentAddress: (s as any).permanentAddress || "",
      qualification: (s as any).qualification || "",
      workExp: (s as any).workExp || "",
      note: (s as any).note || "",
      image: (s as any).image || "",
      epfNo: (s as any).epfNo || "",
      contractType: (s as any).contractType || "",
      basicSalary: (s as any).basicSalary != null ? String((s as any).basicSalary) : "",
      shift: (s as any).shift || "",
      location: (s as any).location || "",
      accountTitle: (s as any).accountTitle || "",
      bankAccountNo: (s as any).bankAccountNo || "",
      bankName: (s as any).bankName || "",
      ifscCode: (s as any).ifscCode || "",
      bankBranch: (s as any).bankBranch || "",
      facebook: (s as any).facebook || "",
      twitter: (s as any).twitter || "",
      linkedin: (s as any).linkedin || "",
      instagram: (s as any).instagram || "",
      resume: (s as any).resume || "",
      joiningLetter: (s as any).joiningLetter || "",
      resignationLetter: (s as any).resignationLetter || "",
      otherDocumentFile: (s as any).otherDocumentFile || "",
      otherDocumentName: (s as any).otherDocumentName || "",
      departmentId: (s as any).departmentId ?? (depts.find((d) => d.name === s.department)?.id ?? null),
      designationId: (s as any).designationId ?? (desigs.find((d) => d.name === s.designation)?.id ?? null),
      role: s.role || "",
      status: s.status || "Active",
      leavesData: parsedLeaves || {},
    })
    setShowMore(true)
    setFormError("")
    setShowModal(true)
  }

  const handleSave = async () => {
    setFormError("")
    if (!form.name.trim()) { setFormError("First name is required"); return }
    if (!form.email.trim()) { setFormError("Email is required"); return }
    if (!form.role) { setFormError("Role is required"); return }
    if (!form.gender) { setFormError("Gender is required"); return }
    if (!form.dob) { setFormError("Date of birth is required"); return }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    if (!emailOk) { setFormError("Enter a valid email"); return }
    const payload: any = {
      staffId: form.staffId || undefined,
      name: form.name.trim(),
      surname: form.surname.trim(),
      fatherName: form.fatherName.trim(),
      motherName: form.motherName.trim(),
      email: form.email.trim(),
      gender: form.gender,
      dob: form.dob || null,
      dateOfJoining: form.dateOfJoining || null,
      dateOfLeaving: form.dateOfLeaving || null,
      contactNo: form.contactNo.trim(),
      emergencyContactNo: form.emergencyContactNo.trim(),
      maritalStatus: form.maritalStatus,
      localAddress: form.localAddress.trim(),
      permanentAddress: form.permanentAddress.trim(),
      qualification: form.qualification.trim(),
      workExp: form.workExp.trim(),
      note: form.note.trim(),
      image: form.image,
      epfNo: form.epfNo.trim(),
      contractType: form.contractType,
      basicSalary: form.basicSalary || null,
      shift: form.shift.trim(),
      location: form.location.trim(),
      accountTitle: form.accountTitle.trim(),
      bankAccountNo: form.bankAccountNo.trim(),
      bankName: form.bankName.trim(),
      ifscCode: form.ifscCode.trim(),
      bankBranch: form.bankBranch.trim(),
      facebook: form.facebook.trim(),
      twitter: form.twitter.trim(),
      linkedin: form.linkedin.trim(),
      instagram: form.instagram.trim(),
      resume: form.resume,
      joiningLetter: form.joiningLetter,
      resignationLetter: form.resignationLetter,
      otherDocumentFile: form.otherDocumentFile,
      otherDocumentName: form.otherDocumentName.trim(),
      departmentId: form.departmentId,
      designationId: form.designationId,
      role: form.role,
      status: form.status,
      leavesData: form.leavesData,
      phone: form.contactNo.trim(),
    }
    try {
      if (editing) {
        await update(editing.id, payload)
        setSuccessMessage("Staff updated successfully")
      } else {
        await add(payload)
        setSuccessMessage("Staff added successfully")
      }
      setShowModal(false)
      setEditing(null)
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (e: any) {
      setFormError(e.message || "Failed to save")
    }
  }

  const handleDeleteSingle = async (id: number) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      await remove(id)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleBulkDelete = async () => {
    const idsToRemove = Array.from(selectedIds)
    for (const id of idsToRemove) await remove(id)
    setSelectedIds(new Set())
    setShowDeleteModal(false)
    setSuccessMessage(`${idsToRemove.length} staff member${idsToRemove.length > 1 ? "s" : ""} deleted successfully.`)
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const b64 = await fileToBase64(file)
    setForm((prev) => ({ ...prev, image: b64 }))
  }
  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>, field: "resume" | "joiningLetter" | "resignationLetter" | "otherDocumentFile") => {
    const file = e.target.files?.[0]
    if (!file) return
    const b64 = await fileToBase64(file)
    setForm((prev) => ({ ...prev, [field]: b64 }))
  }

  const handleSelectTeacher = (staff: Staff) => {
    const isTeacher = String(staff.role || "").toLowerCase().includes("teacher") || String(staff.designation || "").toLowerCase().includes("teacher")
    if (!isTeacher) {
      setSuccessMessage(`${staff.name} is not a teacher (role: ${staff.role || "—"})`)
      setTimeout(() => setSuccessMessage(""), 3000)
      return
    }
    const fullName = `${staff.name}${staff.surname ? " " + staff.surname : ""}`.trim()
    try { localStorage.setItem("selectedTeacher", fullName); localStorage.setItem("selectedTeacherId", String(staff.id)) } catch {}
    setSuccessMessage(`Selected teacher: ${fullName} — go to Class Timetable to use`)
    setTimeout(() => setSuccessMessage(""), 4000)
  }

  const renderActions = (staff: Staff) => {
    const isTeacher = String(staff.role || "").toLowerCase().includes("teacher") || String(staff.designation || "").toLowerCase().includes("teacher")
    return (
      <div className="flex items-center gap-1.5">
        {isTeacher && (
          <button onClick={() => handleSelectTeacher(staff)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-100" title="Select as Teacher for Timetable"><UserCheck className="h-4 w-4" /></button>
        )}
        <button onClick={() => setViewing(staff)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100"><Eye className="h-4 w-4" /></button>
        <button onClick={() => handleOpenEdit(staff)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors border border-transparent hover:border-amber-100"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => handleDeleteSingle(staff.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"><Trash2 className="h-4 w-4" /></button>
      </div>
    )
  }

  const renderList = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            <th className="px-3 py-3 w-10">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-[var(--primary)] rounded cursor-pointer" />
            </th>
            <th className="px-3 py-3 text-left font-bold text-gray-500 text-[11px] tracking-widest uppercase">#</th>
            {["Staff ID", "Name", "Email", "Mobile", "Department", "Designation", "Role", "Action"].map((h) => (
              <th key={h} className="text-left px-3 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.map((staff, idx) => (
            <tr key={staff.id} className={`hover:bg-orange-50/30 transition-colors ${selectedIds.has(staff.id) ? "bg-[var(--primary-light)]/40" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
              <td className="px-3 py-3">
                <input type="checkbox" checked={selectedIds.has(staff.id)} onChange={() => toggleSelect(staff.id)} className="accent-[var(--primary)] rounded cursor-pointer" />
              </td>
              <td className="px-3 py-3 text-gray-400 text-xs">{idx + 1}</td>
              <td className="px-3 py-3 text-xs font-medium text-gray-700">{staff.staffId}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm shrink-0 ${avatarColors[idx % avatarColors.length]}`}>{initials(staff.name)}</span>
                  <span className="font-semibold text-gray-800 whitespace-nowrap">{staff.name}{staff.surname ? ` ${staff.surname}` : ""}</span>
                </div>
              </td>
              <td className="px-3 py-3 text-gray-600 text-xs truncate max-w-[160px]">{staff.email}</td>
              <td className="px-3 py-3 text-gray-600 text-xs">{(staff as any).contactNo || (staff as any).phone || "—"}</td>
              <td className="px-3 py-3"><span className="inline-flex items-center gap-1 text-xs bg-gray-50 border rounded-full px-2 py-1"><Building2 className="h-3 w-3 text-gray-400" />{staff.department || "—"}</span></td>
              <td className="px-3 py-3"><span className="inline-flex items-center gap-1 text-xs bg-blue-50 border border-blue-100 rounded-full px-2 py-1 text-blue-700"><Award className="h-3 w-3" />{staff.designation || "—"}</span></td>
              <td className="px-3 py-3"><span className={`px-2 py-1 text-xs font-bold rounded-full border ${roleBadge(staff.role)}`}>{staff.role || "—"}</span></td>
              <td className="px-3 py-3">{renderActions(staff)}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={10} className="px-4 py-12 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border"><Search className="h-5 w-5 text-gray-400" /></div>
              <p className="mt-2 text-sm font-medium text-gray-700">No staff found</p>
              <p className="text-xs text-gray-500">{search ? `No results for "${search}"` : "No records match filters"}</p>
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  )

  const renderCards = () => (
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {filtered.map((staff, idx) => {
        const hasImg = !!(staff as any).image
        return (
          <div key={staff.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${selectedIds.has(staff.id) ? "ring-2 ring-[var(--primary)] border-[var(--primary)]/20" : "border-gray-200"}`}>
            <div className="flex items-start justify-between p-4 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`relative flex items-center justify-center h-11 w-11 rounded-xl text-white font-bold text-sm overflow-hidden shrink-0 ${!hasImg ? avatarColors[idx % avatarColors.length] : "bg-gray-100 border"}`}>
                  {hasImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(staff as any).image} alt={staff.name} className="h-full w-full object-cover" />
                  ) : (
                    initials(staff.name)
                  )}
                  <span className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${staff.status === "Active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 leading-tight truncate">{staff.name}{staff.surname ? ` ${staff.surname}` : ""}</h3>
                  <p className="text-xs text-gray-500 truncate">ID: {staff.staffId} • {staff.designation || "—"}</p>
                </div>
              </div>
              <input type="checkbox" checked={selectedIds.has(staff.id)} onChange={() => toggleSelect(staff.id)} className="accent-[var(--primary)] rounded cursor-pointer mt-1 shrink-0" />
            </div>
            <div className="px-4 py-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
                <span className="truncate text-xs">{staff.department || "No Department"} · {staff.role || "No Role"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="truncate text-xs">{staff.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs">{(staff as any).contactNo || (staff as any).phone || "—"}</span>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70 border-t border-gray-100">
              <span className={`px-2 py-1 text-xs font-bold rounded-full border ${roleBadge(staff.role)}`}>{staff.role || "N/A"}</span>
              {renderActions(staff)}
            </div>
          </div>
        )
      })}
      {filtered.length === 0 && (
        <div className="col-span-full py-12 text-center text-gray-400">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border"><Users className="h-5 w-5 text-gray-400" /></div>
          <p className="mt-2 text-sm font-medium">No staff found</p>
        </div>
      )}
    </div>
  )

  const deptFilterOptions = depts.length ? depts.map((d) => d.name) : ["Academics", "Administration", "Accounts"]
  const desigFilterOptions = desigs.length ? desigs.map((d) => d.name) : ["Principal", "Teacher", "Clerk"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] via-[#ff7a3a] to-[#ff9a5c] px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Users className="h-4 w-4 text-white" /></span>
              Staff Directory
            </h2>
            <p className="text-sm text-white/80 mt-1">Human Resource / Manage all staff profiles • {staffList.length} total</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20"><TrendingUp className="h-3.5 w-3.5" />{stats.active} Active</span>
            <button onClick={handleOpenAdd} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[var(--primary)] text-sm font-bold rounded-xl shadow-md hover:bg-white/90"><Plus className="h-4 w-4" /> Add Staff</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-violet-600"><Users className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-violet-500" /></div>
          <p className="text-2xl font-black text-violet-700 mt-2">{stats.total}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-violet-600/70">Total Staff</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-emerald-600"><UserCheck className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{stats.active}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-600/70">Active</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-blue-600"><Award className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-blue-500" /></div>
          <p className="text-2xl font-black text-blue-700 mt-2">{stats.teachers}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-blue-600/70">Teachers</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-amber-600"><Building2 className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-amber-500" /></div>
          <p className="text-2xl font-black text-amber-700 mt-2">{stats.deptsCount}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-600/70">Departments</p>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-2xl shadow-sm">
          <CheckSquare size={18} className="text-emerald-500" />
          {successMessage}
          <button onClick={() => setSuccessMessage("")} className="ml-auto p-1 hover:bg-white rounded-lg"><X size={16} /></button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Filter className="h-4 w-4 text-[var(--primary)]" /> All Staff</h3>
            <span className="text-xs bg-white border px-2.5 py-1 rounded-full font-medium text-gray-600">{filtered.length} / {staffList.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-gray-400 hover:text-gray-600"}`} title="List View"><List className="h-4 w-4" /></button>
              <button onClick={() => setViewMode("card")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "card" ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-gray-400 hover:text-gray-600"}`} title="Card View"><Grid className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID, email, phone, dept, designation, role…"
                className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"><X className="h-4 w-4 text-gray-400" /></button>}
            </div>
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="md:col-span-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm">
              <option value="">All Departments</option>
              {deptFilterOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterDesig} onChange={(e) => setFilterDesig(e.target.value)} className="md:col-span-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm">
              <option value="">All Designations</option>
              {desigFilterOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="md:col-span-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm hidden lg:block">
              <option value="">All Roles</option>
              {roleOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="md:col-span-1 flex items-center gap-2 text-xs text-gray-500 justify-end">
              <span className="hidden xl:inline">{filtered.length} found</span>
              {(search || filterDept || filterDesig || filterRole) && (
                <button onClick={() => { setSearch(""); setFilterDept(""); setFilterDesig(""); setFilterRole("") }} className="text-[var(--primary)] font-medium hover:underline">Clear</button>
              )}
            </div>
          </div>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between px-5 py-3 bg-red-50 border-b border-red-100">
            <span className="text-sm text-red-700 font-medium flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />{selectedIds.size} staff selected</span>
            <button onClick={() => setShowDeleteModal(true)} className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-sm"><Trash2 size={16} /> Delete Selected</button>
          </div>
        )}
        {loading ? <div className="p-12 text-center"><div className="mx-auto h-8 w-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" /><p className="mt-3 text-sm text-gray-500">Loading staff...</p></div> : viewMode === "list" ? renderList() : renderCards()}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <span className="text-xs text-gray-500">Showing {filtered.length} of {staffList.length} records • {selectedIds.size ? `${selectedIds.size} selected` : "Tip: use search to find by any field"}</span>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400"><Calendar className="h-3.5 w-3.5" />{new Date().toLocaleDateString("en-IN")}</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-8 rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-white sticky top-0">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">{editing ? <Pencil className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4 text-emerald-500" />}{editing ? "Edit Staff" : "Add Staff"}</h3>
                <p className="text-xs text-gray-500">Email becomes login username • Password auto-generated</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">
              {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />{formError}</div>}
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
                Staff email is their login username, password is generated automatically and sent to staff email. Superadmin can change staff password on their staff profile page.
              </div>

              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2"><Shield className="h-4 w-4 text-[var(--primary)]" /><h4 className="text-sm font-bold text-gray-700">Basic Information</h4></div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Staff ID <span className="text-red-500">*</span></label>
                      <input value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} placeholder="e.g. EMP042" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Role <span className="text-red-500">*</span></label>
                      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm">
                        <option value="">Select role</option>
                        {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Designation</label>
                      <select value={form.designationId ?? ""} onChange={(e) => setForm({ ...form, designationId: e.target.value ? parseInt(e.target.value) : null })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm">
                        <option value="">Select designation</option>
                        {desigs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Department</label>
                      <select value={form.departmentId ?? ""} onChange={(e) => setForm({ ...form, departmentId: e.target.value ? parseInt(e.target.value) : null })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm">
                        <option value="">Select department</option>
                        {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="First name" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Last Name</label>
                      <input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} placeholder="Last name" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Father Name</label>
                      <input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} placeholder="Father name" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Mother Name</label>
                      <input value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} placeholder="Mother name" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@school.edu" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Gender <span className="text-red-500">*</span></label>
                      <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm">
                        <option value="">Select</option>
                        {genders.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                      <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Date Of Joining</label>
                      <input type="date" value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Phone</label>
                      <input value={form.contactNo} onChange={(e) => setForm({ ...form, contactNo: e.target.value })} placeholder="10-digit mobile" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Emergency Contact</label>
                      <input value={form.emergencyContactNo} onChange={(e) => setForm({ ...form, emergencyContactNo: e.target.value })} placeholder="Emergency number" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Marital Status</label>
                      <select value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm">
                        <option value="">Select</option>
                        {maritalStatuses.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Photo</label>
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                          {form.image ? <img src={form.image} alt="preview" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-gray-400" />}
                        </div>
                        <label className="flex items-center gap-2 px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer bg-white shadow-sm">
                          <Upload className="h-3.5 w-3.5" /> {form.image ? "Change" : "Upload"}
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                        {form.image && <button type="button" onClick={() => setForm({ ...form, image: "" })} className="text-xs text-red-600 hover:underline">Remove</button>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Current Address</label>
                      <textarea value={form.localAddress} onChange={(e) => setForm({ ...form, localAddress: e.target.value })} rows={2} placeholder="Current address" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Permanent Address</label>
                      <textarea value={form.permanentAddress} onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })} rows={2} placeholder="Permanent address" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Qualification</label>
                      <textarea value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} rows={2} placeholder="e.g. M.A, B.Ed" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Work Experience</label>
                      <textarea value={form.workExp} onChange={(e) => setForm({ ...form, workExp: e.target.value })} rows={2} placeholder="Previous experience" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Note</label>
                      <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} placeholder="Any note" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button type="button" onClick={() => setShowMore(!showMore)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[var(--primary)]/30 text-[var(--primary)] text-sm font-bold hover:bg-[var(--primary-light)] transition-colors">
                <Plus className={`h-4 w-4 transition-transform ${showMore ? "rotate-45" : ""}`} /> {showMore ? "Hide More Details" : "Add More Details"}
              </button>

              {showMore && (
                <>
                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2"><Calendar className="h-4 w-4 text-emerald-600" /><h4 className="text-sm font-bold text-gray-700">Payroll</h4></div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">EPF No</label>
                        <input value={form.epfNo} onChange={(e) => setForm({ ...form, epfNo: e.target.value })} placeholder="EPF No" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Contract Type</label>
                        <select value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm">
                          <option value="">Select</option>
                          {contractTypes.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Basic Salary</label>
                        <input type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} placeholder="Basic salary" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Work Shift</label>
                        <input value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} placeholder="Work shift" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Work Location</label>
                        <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Work location" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Date Of Leaving</label>
                        <input type="date" value={form.dateOfLeaving} onChange={(e) => setForm({ ...form, dateOfLeaving: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2"><Award className="h-4 w-4 text-blue-600" /><h4 className="text-sm font-bold text-gray-700">Leaves</h4></div>
                    <div className="p-5">
                      {leaves.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {leaves.map((lt) => (
                            <div key={lt.id}>
                              <label className="block text-xs font-bold text-gray-600 mb-1">{lt.name}</label>
                              <input
                                type="number"
                                value={form.leavesData?.[String(lt.id)] ?? form.leavesData?.[lt.name] ?? ""}
                                onChange={(e) => setForm({ ...form, leavesData: { ...form.leavesData, [String(lt.id)]: e.target.value } })}
                                placeholder="Number of leaves"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No leave types configured. Add leave types in HR settings.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2"><Building2 className="h-4 w-4 text-emerald-600" /><h4 className="text-sm font-bold text-gray-700">Bank Account Details</h4></div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Account Title</label>
                        <input value={form.accountTitle} onChange={(e) => setForm({ ...form, accountTitle: e.target.value })} placeholder="Account title" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Bank Account Number</label>
                        <input value={form.bankAccountNo} onChange={(e) => setForm({ ...form, bankAccountNo: e.target.value })} placeholder="Account number" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Bank Name</label>
                        <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Bank name" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">IFSC Code</label>
                        <input value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} placeholder="IFSC code" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Bank Branch Name</label>
                        <input value={form.bankBranch} onChange={(e) => setForm({ ...form, bankBranch: e.target.value })} placeholder="Branch name" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200"><h4 className="text-sm font-bold text-gray-700">Social Media Link</h4></div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Facebook URL</label>
                        <input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="Facebook URL" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Twitter URL</label>
                        <input value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="Twitter URL" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Linkedin URL</label>
                        <input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="Linkedin URL" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Instagram URL</label>
                        <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="Instagram URL" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white shadow-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200"><h4 className="text-sm font-bold text-gray-700">Upload Documents</h4></div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Resume</label>
                          <input type="file" onChange={(e) => handleDocChange(e, "resume")} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-sm file:font-medium" />
                          {form.resume && <p className="text-xs text-emerald-600 mt-1 truncate flex items-center gap-1"><CheckSquare className="h-3 w-3" /> File attached</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Resignation Letter</label>
                          <input type="file" onChange={(e) => handleDocChange(e, "resignationLetter")} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-sm file:font-medium" />
                          {form.resignationLetter && <p className="text-xs text-emerald-600 mt-1 truncate flex items-center gap-1"><CheckSquare className="h-3 w-3" /> File attached</p>}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Joining Letter</label>
                          <input type="file" onChange={(e) => handleDocChange(e, "joiningLetter")} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-sm file:font-medium" />
                          {form.joiningLetter && <p className="text-xs text-emerald-600 mt-1 truncate flex items-center gap-1"><CheckSquare className="h-3 w-3" /> File attached</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Other Documents</label>
                          <input type="file" onChange={(e) => handleDocChange(e, "otherDocumentFile")} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-sm file:font-medium" />
                          {form.otherDocumentFile && <p className="text-xs text-emerald-600 mt-1 truncate flex items-center gap-1"><CheckSquare className="h-3 w-3" /> File attached</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 rounded-xl shadow-sm">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-[var(--primary)] to-[#ff8a4a] text-white hover:opacity-95 rounded-xl shadow-md">Save Staff</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
              <div>
                <h3 className="font-bold text-gray-800">Delete staff?</h3>
                <p className="text-sm text-gray-500">This will permanently delete {selectedIds.size} staff record(s). This cannot be undone.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleBulkDelete} className="px-5 py-2 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-800">Staff Details</h3>
              <button onClick={() => setViewing(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[#ff8a4a] border-2 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                  {(viewing as any).image ? <img src={(viewing as any).image} alt={viewing.name} className="h-full w-full object-cover" /> : <span className="font-bold text-white text-lg">{initials(viewing.name)}</span>}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">{viewing.name} {viewing.surname || ""}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-[var(--primary)]" />{viewing.staffId} • {viewing.designation || "—"} • {viewing.department || "—"}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Mail className="h-3 w-3" />{viewing.email} • <Phone className="h-3 w-3 ml-1" />{(viewing as any).contactNo || (viewing as any).phone || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Role", viewing.role || "—"],
                  ["Status", viewing.status || "—"],
                  ["Gender", (viewing as any).gender || "—"],
                  ["DOB", (viewing as any).dob ? new Date((viewing as any).dob).toLocaleDateString("en-IN") : "—"],
                  ["Phone", (viewing as any).contactNo || (viewing as any).phone || "—"],
                  ["Emergency", (viewing as any).emergencyContactNo || "—"],
                  ["Qualification", (viewing as any).qualification || "—"],
                  ["Marital", (viewing as any).maritalStatus || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-gray-50 border p-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{k}</p>
                    <p className="font-medium text-gray-800 mt-1 truncate">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
