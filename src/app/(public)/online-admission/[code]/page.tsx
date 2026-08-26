"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { GraduationCap, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronRight, Info } from "lucide-react"

type PublicSchool = { code: string; name: string }
type PublicClass = { id: number; name: string }
type PublicSection = { id: number; class_id: number; name: string }

type FormData = {
  firstName: string
  middleName: string
  lastName: string
  classId: string
  section: string
  gender: string
  dateOfBirth: string
  category: string
  religion: string
  caste: string
  bloodGroup: string
  house: string
  previousSchool: string
  siblingName: string
  rte: string
  mobileNumber: string
  email: string
  fatherName: string
  fatherPhone: string
  fatherOccupation: string
  motherName: string
  motherPhone: string
  motherOccupation: string
  guardianIs: string
  guardianName: string
  guardianRelation: string
  guardianPhone: string
  guardianOccupation: string
  guardianEmail: string
  guardianAddress: string
  currentAddress: string
  permanentAddress: string
  note: string
}

const genderOptions = ["Male", "Female", "Other"]
const categoryOptions = ["General", "OBC", "SC", "ST", "Special", "Physically Challenged"]
const bloodGroupOptions = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"]
const houseOptions = ["Blue", "Red", "Green", "Yellow"]
const guardianOptions = ["Father", "Mother", "Other"]

const defaultForm: FormData = {
  firstName: "", middleName: "", lastName: "", classId: "", section: "", gender: "",
  dateOfBirth: "", category: "", religion: "", caste: "", bloodGroup: "", house: "",
  previousSchool: "", siblingName: "", rte: "", mobileNumber: "", email: "",
  fatherName: "", fatherPhone: "", fatherOccupation: "",
  motherName: "", motherPhone: "", motherOccupation: "",
  guardianIs: "Father", guardianName: "", guardianRelation: "", guardianPhone: "",
  guardianOccupation: "", guardianEmail: "", guardianAddress: "",
  currentAddress: "", permanentAddress: "", note: "",
}

const inputCls = "w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
const labelCls = "block text-xs font-medium text-gray-600 mb-1"

const Section = ({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string
  title: string
  open: boolean
  onToggle: (key: string) => void
  children: React.ReactNode
}) => (
  <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
    <button type="button" onClick={() => onToggle(id)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
      {title}
      {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
    </button>
    {open && <div className="px-4 py-4 border-t border-gray-100">{children}</div>}
  </div>
)

const Err = ({ field, errors }: { field: string; errors: Record<string, string> }) =>
  errors[field] ? <p className="text-red-500 text-xs mt-0.5">{errors[field]}</p> : null

export default function PublicOnlineAdmissionPage() {
  const params = useParams()
  const code = String(params?.code || "")

  const [loading, setLoading] = useState(true)
  const [school, setSchool] = useState<PublicSchool | null>(null)
  const [classes, setClasses] = useState<PublicClass[]>([])
  const [sections, setSections] = useState<PublicSection[]>([])
  const [error, setError] = useState("")
  const [closed, setClosed] = useState(false)
  const [closedMessage, setClosedMessage] = useState("")
  const [requireParentEmail, setRequireParentEmail] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ admissionNo: string; name: string } | null>(null)
  const [submitError, setSubmitError] = useState("")

  const [form, setForm] = useState<FormData>(() => ({ ...defaultForm }))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ student: true, parent: false, address: false, other: false })

  useEffect(() => {
    if (!code) return
    setLoading(true)
    fetch(`/api/online-admission/public?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error || !data.school) {
          setError(data.error || "Invalid admission link")
          return
        }
        setSchool(data.school)
        setClasses(Array.isArray(data.classes) ? data.classes : [])
        setSections(Array.isArray(data.sections) ? data.sections : [])
        setClosed(data.admissionOpen === false)
        setClosedMessage(data.message || "")
        setRequireParentEmail(Boolean(data.settings?.requireParentEmail))
      })
      .catch(() => setError("Failed to load admission form"))
      .finally(() => setLoading(false))
  }, [code])

  const classSections = useMemo(
    () => (form.classId ? sections.filter((s) => String(s.class_id) === form.classId) : []),
    [sections, form.classId]
  )

  const toggleSection = (key: string) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    const errs: Record<string, string> = {}
    if (!form.firstName.trim()) errs.firstName = "Required"
    if (!form.classId) errs.classId = "Required"
    if (!form.gender) errs.gender = "Required"
    if (requireParentEmail && !form.email.trim()) errs.email = "Required"
    if (form.mobileNumber && !/^[\d+\s-]{7,20}$/.test(form.mobileNumber.trim())) errs.mobileNumber = "Enter a valid phone number"
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = "Enter a valid email"
    setFieldErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/online-admission/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ...form }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to submit application")
      }
      setSuccess({ admissionNo: data.admissionNo, name: `${form.firstName} ${form.lastName}`.trim() })
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit application")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-6 py-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">{school?.name || "Online Admission"}</h1>
            <p className="text-sm text-white/80 mt-1">Student Information / Online Admission</p>
          </div>

          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
              </div>
            )}

            {!loading && error && (
              <div className="text-center py-16">
                <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <XCircle className="h-7 w-7 text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Link Not Available</h2>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            )}

            {!loading && success && (
              <div className="text-center py-10">
                <div className="mx-auto w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Application Submitted</h2>
                <p className="text-sm text-gray-500 mb-5">Thank you, {success.name}. Your admission application has been received and is pending for payment.</p>
                <div className="inline-block rounded-lg bg-gray-50 border border-gray-200 px-5 py-3">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">Reference No.</p>
                  <p className="text-sm font-bold text-gray-800 font-mono">{success.admissionNo}</p>
                </div>
                <p className="text-xs text-gray-400 mt-5">The school will contact you regarding the next steps and fee payment.</p>
              </div>
            )}

            {!loading && closed && (
              <div className="text-center py-16 px-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                  <Info className="h-7 w-7 text-amber-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Admissions Not Open</h2>
                <p className="text-sm text-gray-500">{closedMessage}</p>
                <div className="mt-6 inline-block rounded-lg bg-gray-50 border border-gray-200 px-5 py-3 text-left">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">School</p>
                  <p className="text-sm font-semibold text-gray-800">{school?.name}</p>
                </div>
                <p className="text-xs text-gray-400 mt-5">
                  Please contact the school administration for more information about admission.
                </p>
              </div>
            )}

            {!loading && !error && !success && !closed && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Section id="student" title="Student Details" open={openSections.student} onToggle={toggleSection}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                      <input type="text" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} className={inputCls} />
                      <Err field="firstName" errors={fieldErrors} />
                    </div>
                    <div>
                      <label className={labelCls}>Last Name</label>
                      <input type="text" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Middle Name</label>
                      <input type="text" value={form.middleName} onChange={(e) => handleChange("middleName", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Class Applying For <span className="text-red-500">*</span></label>
                      <select value={form.classId} onChange={(e) => { handleChange("classId", e.target.value); handleChange("section", "") }} className={inputCls}>
                        <option value="">Select class</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <Err field="classId" errors={fieldErrors} />
                    </div>
                    <div>
                      <label className={labelCls}>Section</label>
                      <select value={form.section} onChange={(e) => handleChange("section", e.target.value)} className={inputCls}>
                        <option value="">Select section</option>
                        {classSections.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Gender <span className="text-red-500">*</span></label>
                      <select value={form.gender} onChange={(e) => handleChange("gender", e.target.value)} className={inputCls}>
                        <option value="">Select</option>
                        {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <Err field="gender" errors={fieldErrors} />
                    </div>
                    <div>
                      <label className={labelCls}>Date of Birth</label>
                      <input type="date" value={form.dateOfBirth} onChange={(e) => handleChange("dateOfBirth", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Mobile Number</label>
                      <input type="text" value={form.mobileNumber} onChange={(e) => handleChange("mobileNumber", e.target.value)} placeholder="Contact number" className={inputCls} />
                      <Err field="mobileNumber" errors={fieldErrors} />
                    </div>
                    <div>
                      <label className={labelCls}>Email {requireParentEmail && <span className="text-red-500">*</span>}</label>
                      <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="Email address" className={inputCls} />
                      <Err field="email" errors={fieldErrors} />
                    </div>
                    <div>
                      <label className={labelCls}>Category</label>
                      <select value={form.category} onChange={(e) => handleChange("category", e.target.value)} className={inputCls}>
                        <option value="">Select</option>
                        {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Religion</label>
                      <input type="text" value={form.religion} onChange={(e) => handleChange("religion", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Caste</label>
                      <input type="text" value={form.caste} onChange={(e) => handleChange("caste", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Blood Group</label>
                      <select value={form.bloodGroup} onChange={(e) => handleChange("bloodGroup", e.target.value)} className={inputCls}>
                        <option value="">Select</option>
                        {bloodGroupOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>House</label>
                      <select value={form.house} onChange={(e) => handleChange("house", e.target.value)} className={inputCls}>
                        <option value="">Select</option>
                        {houseOptions.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Previous School</label>
                      <input type="text" value={form.previousSchool} onChange={(e) => handleChange("previousSchool", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Sibling Name (if any)</label>
                      <input type="text" value={form.siblingName} onChange={(e) => handleChange("siblingName", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>RTE</label>
                      <select value={form.rte} onChange={(e) => handleChange("rte", e.target.value)} className={inputCls}>
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Note</label>
                      <textarea value={form.note} onChange={(e) => handleChange("note", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
                    </div>
                  </div>
                </Section>

                <Section id="parent" title="Parent / Guardian Details" open={openSections.parent} onToggle={toggleSection}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <h4 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-2">Father</h4>
                    </div>
                    <div>
                      <label className={labelCls}>Father Name</label>
                      <input type="text" value={form.fatherName} onChange={(e) => handleChange("fatherName", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Father Phone</label>
                      <input type="text" value={form.fatherPhone} onChange={(e) => handleChange("fatherPhone", e.target.value)} className={inputCls} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Father Occupation</label>
                      <input type="text" value={form.fatherOccupation} onChange={(e) => handleChange("fatherOccupation", e.target.value)} className={inputCls} />
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-2">Mother</h4>
                    </div>
                    <div>
                      <label className={labelCls}>Mother Name</label>
                      <input type="text" value={form.motherName} onChange={(e) => handleChange("motherName", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Mother Phone</label>
                      <input type="text" value={form.motherPhone} onChange={(e) => handleChange("motherPhone", e.target.value)} className={inputCls} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Mother Occupation</label>
                      <input type="text" value={form.motherOccupation} onChange={(e) => handleChange("motherOccupation", e.target.value)} className={inputCls} />
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-2">Guardian</h4>
                    </div>
                    <div>
                      <label className={labelCls}>Guardian Is</label>
                      <select value={form.guardianIs} onChange={(e) => handleChange("guardianIs", e.target.value)} className={inputCls}>
                        {guardianOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Guardian Name</label>
                      <input type="text" value={form.guardianName} onChange={(e) => handleChange("guardianName", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Guardian Relation</label>
                      <input type="text" value={form.guardianRelation} onChange={(e) => handleChange("guardianRelation", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Guardian Phone</label>
                      <input type="text" value={form.guardianPhone} onChange={(e) => handleChange("guardianPhone", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Guardian Occupation</label>
                      <input type="text" value={form.guardianOccupation} onChange={(e) => handleChange("guardianOccupation", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Guardian Email</label>
                      <input type="email" value={form.guardianEmail} onChange={(e) => handleChange("guardianEmail", e.target.value)} className={inputCls} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Guardian Address</label>
                      <textarea value={form.guardianAddress} onChange={(e) => handleChange("guardianAddress", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
                    </div>
                  </div>
                </Section>

                <Section id="address" title="Address Details" open={openSections.address} onToggle={toggleSection}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Current Address</label>
                      <textarea value={form.currentAddress} onChange={(e) => handleChange("currentAddress", e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
                    </div>
                    <div>
                      <label className={labelCls}>Permanent Address</label>
                      <textarea value={form.permanentAddress} onChange={(e) => handleChange("permanentAddress", e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" />
                    </div>
                  </div>
                </Section>

                {submitError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">{submitError}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 h-11 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
                <p className="text-xs text-gray-400 text-center">After submission your application appears in the school dashboard as <span className="font-medium text-gray-600">pending for payment</span>.</p>
              </form>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">Powered by Smart School</p>
      </div>
    </div>
  )
}
