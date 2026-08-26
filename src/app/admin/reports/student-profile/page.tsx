"use client"

import { useMemo, useState } from "react"
import { User } from "lucide-react"
import { useReportData } from "@/components/reports/use-report-data"
import { ReportBanner, FilterCard, Field, TableCard, PrintButtons, EmptyRow, selectCls } from "@/components/reports/ui"
import { useReportData as useClasses } from "@/components/reports/use-report-data"

type StudentRow = {
  id: number
  admission_no: string
  first_name: string
  last_name: string
  gender: string
  dob: string
  email: string
  phone: string
  mobile: string
  blood_group: string
  category: string
  religion: string
  caste: string
  house: string
  session: string
  status: string
  admission_date: string
  roll_no: string
  class?: string
  section?: string
  class_id: number
  father_name: string
  father_phone: string
  father_occupation: string
  mother_name: string
  mother_phone: string
  mother_occupation: string
  guardian_is: string
  guardian_name: string
  guardian_relation: string
  guardian_email: string
  guardian_phone: string
  guardian_occupation: string
  guardian_address: string
  current_address: string
  permanent_address: string
  previous_school: string
  note: string
  bank_account_no: string
  bank_name: string
  ifsc_code: string
  national_identification_no: string
  local_identification_no: string
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-2 grid grid-cols-3 gap-2 border-b border-gray-50">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-800">{value || "—"}</dd>
    </div>
  )
}

export default function StudentProfilePage() {
  const { data: students, loading } = useReportData<StudentRow>("/api/reports/students")
  const { data: classes } = useClasses<{ id: number; name: string }>("/api/classes")
  const [classId, setClassId] = useState("")
  const [studentId, setStudentId] = useState("")

  const classStudents = useMemo(
    () => (classId ? students.filter((s) => String(s.class_id) === classId) : []),
    [students, classId]
  )
  const selected = useMemo(
    () => students.find((s) => String(s.id) === studentId) || null,
    [students, studentId]
  )

  return (
    <div className="space-y-6">
      <ReportBanner title="Student Profile" subtitle="Reports / Student Information / Student Profile" />

      <FilterCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Class">
            <select value={classId} onChange={(e) => { setClassId(e.target.value); setStudentId("") }} className={selectCls}>
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Student">
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={selectCls} disabled={!classId}>
              <option value="">Select Student</option>
              {classStudents.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </Field>
        </div>
      </FilterCard>

      {selected ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <User className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{selected.first_name} {selected.last_name}</h3>
                <p className="text-xs text-gray-500">{selected.admission_no} · {selected.class} - {selected.section}</p>
              </div>
            </div>
            <PrintButtons />
          </div>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 p-5">
            <div>
              <h4 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-2">Basic Details</h4>
              <dl>
                <Row label="Roll No" value={selected.roll_no} />
                <Row label="Gender" value={selected.gender} />
                <Row label="DOB" value={selected.dob ? String(selected.dob).slice(0, 10) : ""} />
                <Row label="Blood Group" value={selected.blood_group} />
                <Row label="Category" value={selected.category} />
                <Row label="Religion" value={selected.religion} />
                <Row label="Caste" value={selected.caste} />
                <Row label="House" value={selected.house} />
                <Row label="Session" value={selected.session} />
                <Row label="Admission Date" value={selected.admission_date ? String(selected.admission_date).slice(0, 10) : ""} />
                <Row label="Status" value={selected.status} />
              </dl>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-2">Contact Details</h4>
              <dl>
                <Row label="Email" value={selected.email} />
                <Row label="Phone" value={selected.phone} />
                <Row label="Mobile" value={selected.mobile} />
                <Row label="Current Address" value={selected.current_address} />
                <Row label="Permanent Address" value={selected.permanent_address} />
              </dl>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-2">Family Details</h4>
              <dl>
                <Row label="Father Name" value={selected.father_name} />
                <Row label="Father Phone" value={selected.father_phone} />
                <Row label="Father Occupation" value={selected.father_occupation} />
                <Row label="Mother Name" value={selected.mother_name} />
                <Row label="Mother Phone" value={selected.mother_phone} />
                <Row label="Mother Occupation" value={selected.mother_occupation} />
              </dl>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-2">Guardian Details</h4>
              <dl>
                <Row label="Guardian Is" value={selected.guardian_is} />
                <Row label="Guardian Name" value={selected.guardian_name} />
                <Row label="Relation" value={selected.guardian_relation} />
                <Row label="Guardian Phone" value={selected.guardian_phone} />
                <Row label="Guardian Email" value={selected.guardian_email} />
                <Row label="Guardian Address" value={selected.guardian_address} />
              </dl>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-2">Other Details</h4>
              <dl className="grid md:grid-cols-2 gap-x-8">
                <div>
                  <Row label="Previous School" value={selected.previous_school} />
                  <Row label="Bank Account" value={selected.bank_account_no} />
                  <Row label="Bank Name" value={selected.bank_name} />
                  <Row label="IFSC Code" value={selected.ifsc_code} />
                </div>
                <div>
                  <Row label="National ID" value={selected.national_identification_no} />
                  <Row label="Local ID" value={selected.local_identification_no} />
                  <Row label="Note" value={selected.note} />
                </div>
              </dl>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-10 text-center text-gray-400">
          {loading ? "Loading students..." : "Select a class and student to view the profile."}
        </div>
      )}
    </div>
  )
}
