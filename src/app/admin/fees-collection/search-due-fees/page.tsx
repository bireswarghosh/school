"use client"

import { useState, useCallback } from "react"
import { Search, CreditCard, Tag } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useCurrency } from "@/lib/currency-context"
import CollectFeesModal from "@/components/collect-fees-modal"

type FeesGroup = {
  id: number
  name: string
  description: string
}

type FeeRecord = {
  id: number
  studentId: number | string
  feesGroup: number | string
  amount: number | string
  discountAmount: number | string
  paidAmount: number | string
}

type StudentDue = {
  studentId: number
  name: string
  admissionNo: string
  rollNo?: string
  className: string
  section: string
  totalFees: number
  paidAmount: number
  dueAmount: number
  activeDiscount?: {
    discountCode: string
    discountType: string
    discountTypeKind?: string | null
    percentage: number | null
    amount: number | null
    expiryDate: string | null
    approvedBy: string | null
    approvedAt: string | null
  } | null
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

export default function SearchDueFeesPage() {
  const { symbol } = useCurrency()
  const { sectionNames, classes, sectionsOf } = useClassesAndSections()
  const { data: feesGroups } = useApi<FeesGroup>("/api/fees/fees-group")
  const [selectedGroups, setSelectedGroups] = useState<number[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState<StudentDue[]>([])
  const [showPayModal, setShowPayModal] = useState(false)
  const [payStudent, setPayStudent] = useState<{
    id: number
    name: string
    admissionNo: string
    rollNo?: string
    className: string
    section: string
  } | null>(null)

  const selectedClassItem = classes.find((c) => c.name === selectedClass)
  const availableSections = selectedClassItem
    ? sectionsOf(selectedClassItem.id).map((s) => s.name)
    : sectionNames

  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    setSelectedSection("")
  }

  const toggleGroup = (id: number) => {
    if (id === 0) {
      if (selectedGroups.length === feesGroups.length) {
        setSelectedGroups([])
      } else {
        setSelectedGroups(feesGroups.map((g) => g.id))
      }
    } else {
      setSelectedGroups((prev) =>
        prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
      )
    }
  }

  const applySearch = useCallback(async () => {
    const params = new URLSearchParams()
    if (selectedClass) params.set("class", selectedClass)
    if (selectedSection) params.set("section", selectedSection)

    const studentsRes = await fetch(`/api/students?${params.toString()}`)
    const studentsList = await studentsRes.json()
    const feesRes = await fetch("/api/fees/fees-payment")
    const feesList = await feesRes.json()
    let discList: any[] = []
    try {
      const discRes = await fetch("/api/fees/fees-discount")
      const discJson = await discRes.json()
      if (Array.isArray(discJson)) discList = discJson
    } catch { /* ignore */ }

    const t = new Date().toISOString().split("T")[0]
    const activeByStudent = new Map<number, any>()
    for (const d of discList) {
      if (d.isActive === false || d.used || (d.expiryDate && d.expiryDate < t) || !d.studentId) continue
      const dType = d.discountType === "Percentage" ? "Percentage" : d.discountType === "Fix" ? "Fix" : d.discountTypeKind
      const value = dType === "Percentage" ? num(d.percentage) : num(d.amount)
      if (!(value > 0)) continue
      if (!activeByStudent.has(Number(d.studentId))) activeByStudent.set(Number(d.studentId), d)
    }

    const groupIds = new Set(selectedGroups.map(Number))
    const rows: StudentDue[] = (Array.isArray(studentsList) ? studentsList : [])
      .map((s: any) => {
        const recs = (Array.isArray(feesList) ? feesList : []).filter(
          (f: FeeRecord) =>
            Number(f.studentId) === s.id && (groupIds.size === 0 || groupIds.has(Number(f.feesGroup)))
        )
        const totalFees = recs.reduce((sum, f) => sum + num(f.amount), 0)
        const paidAmount = recs.reduce((sum, f) => sum + num(f.paidAmount), 0)
        const dueAmount = recs.reduce((sum, f) => sum + Math.max(0, num(f.amount) - num(f.discountAmount) - num(f.paidAmount)), 0)
        return {
          studentId: s.id,
          name: s.name,
          admissionNo: s.admissionNo,
          rollNo: s.rollNo,
          className: s.class,
          section: s.section,
          totalFees,
          paidAmount,
          dueAmount,
          activeDiscount: activeByStudent.get(Number(s.id)) ?? null,
        }
      })
      .filter((r: StudentDue) => r.totalFees > 0)
      .sort((a: StudentDue, b: StudentDue) => b.dueAmount - a.dueAmount)

    setResults(rows)
    setSearched(true)
  }, [selectedClass, selectedSection, selectedGroups])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applySearch()
  }

  const openPayModal = (student: StudentDue) => {
    setPayStudent({
      id: student.studentId,
      name: student.name,
      admissionNo: student.admissionNo,
      rollNo: student.rollNo,
      className: student.className,
      section: student.section,
    })
    setShowPayModal(true)
  }

  const pctPaid = (paid: number, total: number) => (total > 0 ? Math.round((paid / total) * 100) : 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Search Due Fees</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fees Collection / Search Due Fees</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-2.5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-[var(--primary)]" />
            Select Criteria
          </h3>
        </div>
        <form onSubmit={handleSearch} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Fees Group</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2.5 bg-gray-50/50">
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-[var(--primary)]">
                  <input
                    type="checkbox"
                    checked={feesGroups.length > 0 && selectedGroups.length === feesGroups.length}
                    onChange={() => toggleGroup(0)}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="font-medium">Select All</span>
                </label>
                {feesGroups.map((g) => (
                  <label key={g.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-[var(--primary)]">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span>{g.name}</span>
                  </label>
                ))}
                {feesGroups.length === 0 && (
                  <p className="text-xs text-gray-400">No fees groups found.</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
              <select value={selectedClass} onChange={(e) => handleClassChange(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                <option value="">Select</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                <option value="">Select</option>
                {availableSections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end gap-2 mt-4">
            <button type="submit" className="h-9 px-4 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200">
              <Search className="h-3.5 w-3.5" />
              Search
            </button>
            <button type="button" onClick={() => { setSelectedClass(""); setSelectedSection(""); setSelectedGroups([]); setSearched(false); setResults([]) }} className="h-9 px-3 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Reset
            </button>
          </div>
        </form>
      </div>

      {searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Due Fees List</h3>
            <span className="text-xs text-gray-400">{results.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Student Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Class</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Admission No</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Total Fees</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Paid Amount</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Due Amount</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">% Paid</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-gray-300" />
                        <span className="text-sm">No students found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  results.map((s, idx) => {
                    const pct = pctPaid(s.paidAmount, s.totalFees)
                    const isPaid = pct >= 100
                    return (
                      <tr key={s.studentId} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">
                          {s.name}
                          {s.activeDiscount && (
                            <div className="mt-1 flex flex-col items-start gap-0.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--primary-light)] text-[var(--secondary)]" title={`${s.activeDiscount.discountType === "Percentage" ? `${s.activeDiscount.percentage}%` : `${symbol}${num(s.activeDiscount.amount)}`} discount on ${s.activeDiscount.discountCode}`}>
                                <Tag className="h-2.5 w-2.5" /> {s.activeDiscount.discountType === "Percentage" ? `${s.activeDiscount.percentage}%` : `${symbol}${num(s.activeDiscount.amount)}`} ({s.activeDiscount.discountCode}){s.activeDiscount.expiryDate ? ` · till ${fmtDate(s.activeDiscount.expiryDate)}` : ""}
                              </span>
                              {s.activeDiscount.approvedBy && (
                                <span className="text-[9px] text-gray-500">Approved by {s.activeDiscount.approvedBy}{fmtDT(s.activeDiscount.approvedAt) ? ` on ${fmtDT(s.activeDiscount.approvedAt)}` : ""}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{s.className} - {s.section}</td>
                        <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{s.admissionNo}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-800">{symbol}{s.totalFees.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{symbol}{s.paidAmount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-800">{symbol}{s.dueAmount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-center">
                          {isPaid ? (
                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border bg-green-50 text-green-700 border-green-200">
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border bg-red-50 text-red-700 border-red-200">
                              {pct}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {isPaid ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-lg">Paid</span>
                          ) : (
                            <button onClick={() => openPayModal(s)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">
                              <CreditCard className="h-3 w-3" />
                              Pay Now
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
            <span>Showing {results.length} of {results.length} records</span>
          </div>
        </div>
      )}

      <CollectFeesModal
        open={showPayModal}
        student={payStudent}
        groupIds={selectedGroups}
        onClose={() => setShowPayModal(false)}
        onSuccess={applySearch}
      />
    </div>
  )
}