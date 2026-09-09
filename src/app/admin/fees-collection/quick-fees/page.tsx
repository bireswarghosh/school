"use client"

import { useState, useCallback } from "react"
import { Search, DollarSign, Tag } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useCurrency } from "@/lib/currency-context"
import CollectFeesModal, { type CollectStudent } from "@/components/collect-fees-modal"

type Student = {
  id: number
  name: string
  admissionNo: string
  rollNo: string
  class: string
  section: string
  dueAmount: number
  activeDiscount?: {
    discountCode: string
    discountType: string
    percentage: number | null
    amount: number | null
    expiryDate: string | null
    approvedBy: string | null
    approvedAt: string | null
    discountTypeKind?: string | null
  } | null
}

type FeeRecord = {
  id: number
  studentId: number | string
  amount: number | string
  discountAmount: number | string
  paidAmount: number | string
}

const num = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const fmtDate = (s?: string | null) => {
  if (!s) return ""
  const [y, m, d] = s.split("-").map(Number)
  return y && m && d ? `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}` : ""
}

const fmtDT = (dt?: string | null) => {
  if (!dt) return ""
  const d = new Date(dt)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function QuickFeesPage() {
  const { symbol } = useCurrency()
  const { classNames, sectionNames, classes, sectionsOf } = useClassesAndSections()
  const classOptions = ["Select", ...classNames]
  const sectionOptions = ["Select", ...sectionNames]

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [showResults, setShowResults] = useState(false)
  const [collectStudent, setCollectStudent] = useState<CollectStudent | null>(null)

  const selectedClassItem = classes.find((c) => c.name === selectedClass)
  const availableSections = selectedClassItem
    ? ["Select", ...sectionsOf(selectedClassItem.id).map((s) => s.name)]
    : sectionOptions

  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    setSelectedSection("")
  }

  const computeStudentDue = (fees: FeeRecord[] | undefined, studentId: number): number => {
    return (fees || [])
      .filter((f) => Number(f.studentId) === studentId)
      .reduce((sum, f) => sum + Math.max(0, num(f.amount) - num(f.discountAmount) - num(f.paidAmount)), 0)
  }

  const handleSearch = useCallback(async () => {
    const params = new URLSearchParams()
    if (selectedClass) params.set("class", selectedClass)
    if (selectedSection) params.set("section", selectedSection)
    const [studentsRes, feesRes, discRes] = await Promise.all([
      fetch(`/api/students?${params.toString()}`),
      fetch("/api/fees/fees-payment"),
      fetch("/api/fees/fees-discount"),
    ])
    const list = await studentsRes.json()
    const feesList = await feesRes.json()
    let discJson: any = null
    try { discJson = await discRes.json() } catch { /* ignore */ }
    const discounts = Array.isArray(discJson) ? discJson : []
    const t = new Date().toISOString().split("T")[0]
    const activeByStudent = new Map<number, any>()
    for (const d of discounts) {
      if (d.isActive === false || (d.expiryDate && d.expiryDate < t) || !d.studentId) continue
      const dType = d.discountType === "Percentage" ? "Percentage" : d.discountType === "Fix" ? "Fix" : d.discountTypeKind
      const value = dType === "Percentage" ? num(d.percentage) : num(d.amount)
      if (!(value > 0)) continue
      if (!activeByStudent.has(Number(d.studentId))) activeByStudent.set(Number(d.studentId), d)
    }
    const rows = (Array.isArray(list) ? list : []).map((s: any) => ({
      ...s,
      dueAmount: computeStudentDue(Array.isArray(feesList) ? feesList : [], s.id),
      activeDiscount: activeByStudent.get(Number(s.id)) ?? null,
    }))
    setStudents(rows)
    setShowResults(true)
  }, [selectedClass, selectedSection])

  const openCollect = (s: Student) => {
    setCollectStudent({
      id: s.id,
      name: s.name,
      admissionNo: s.admissionNo,
      rollNo: s.rollNo,
      className: s.class,
      section: s.section,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quick Fees</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fees Collection / Quick Fees</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-t-xl px-5 py-3">
          <h3 className="text-sm font-semibold text-white">Select Student</h3>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select value={selectedClass} onChange={(e) => handleClassChange(e.target.value)} className="w-40 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
                {classOptions.map((o) => <option key={o} value={o === "Select" ? "" : o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-40 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
                {availableSections.map((o) => <option key={o} value={o === "Select" ? "" : o}>{o}</option>)}
              </select>
            </div>
            <button onClick={handleSearch} className="h-9 inline-flex items-center gap-1.5 px-4 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </div>

      {showResults && (
        <>
          {students.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-10 text-center text-sm text-gray-500">
              No students found for the selected class/section.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3">
                <h3 className="text-sm font-semibold text-white">Student List</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100/80">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Admission No</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Section</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Fees Status</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((s, i) => (
                      <tr key={s.id} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)] transition-colors`}>
                        <td className="px-4 py-2.5 text-gray-800 font-medium">{s.name}</td>
                        <td className="px-4 py-2.5 text-gray-600">{s.admissionNo}</td>
                        <td className="px-4 py-2.5 text-gray-600">{s.class}</td>
                        <td className="px-4 py-2.5 text-gray-600">{s.section}</td>
                        <td className="px-4 py-2.5">
                          {s.dueAmount > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Pending {symbol}{s.dueAmount.toLocaleString()}</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">No Dues</span>
                          )}
                          {s.activeDiscount && (
                            <div className="mt-1.5 flex flex-col items-start gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--primary-light)] text-[var(--secondary)]" title={`${s.activeDiscount.discountType === "Percentage" ? `${s.activeDiscount.percentage}%` : `${symbol}${num(s.activeDiscount.amount)}`} discount on ${s.activeDiscount.discountCode}`}>
                                <Tag className="h-3 w-3" /> {s.activeDiscount.discountType === "Percentage" ? `${s.activeDiscount.percentage}%` : `${symbol}${num(s.activeDiscount.amount)}`} ({s.activeDiscount.discountCode})
                                {s.activeDiscount.expiryDate ? ` · till ${fmtDate(s.activeDiscount.expiryDate)}` : ""}
                              </span>
                              {s.activeDiscount.approvedBy && (
                                <span className="text-[10px] text-gray-500">Approved by {s.activeDiscount.approvedBy}{fmtDT(s.activeDiscount.approvedAt) ? ` on ${fmtDT(s.activeDiscount.approvedAt)}` : ""}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {s.dueAmount > 0 ? (
                            <button onClick={() => openCollect(s)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors">
                              <DollarSign className="h-3.5 w-3.5" /> Collect Fees
                            </button>
                          ) : (
                            <button disabled className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-medium rounded-lg cursor-not-allowed">
                              Collect Fees
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <CollectFeesModal
        open={!!collectStudent}
        student={collectStudent}
        onClose={() => setCollectStudent(null)}
        onSuccess={handleSearch}
      />
    </div>
  )
}