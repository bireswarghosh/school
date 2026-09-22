"use client"
import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, DollarSign, Loader2, History, RefreshCw } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useCurrency } from "@/lib/currency-context"

type StudentRecord = {
  id: number
  class: string
  section: string
  admissionNo: string
  rollNo: string
  name: string
  fatherName: string
  dob: string
  mobile: string
}

type PaymentLogEntry = {
  id: number
  studentName: string | null
  feeTypeName: string | null
  amountPaid: number | string
  paymentMode: string | null
  changeKind: string | null
  oldStatus: string | null
  newStatus: string | null
  paidBefore: number | string | null
  paidAfter: number | string | null
  paidAt: string | null
  createdBy: string | null
  ipAddress: string | null
  note: string | null
}

const num = (v: unknown) => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const fmtDateTime = (dt?: string | null) => {
  if (!dt) return "-"
  const d = new Date(dt)
  if (isNaN(d.getTime())) return "-"
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const money = (symbol: string, v: number) => `${symbol}${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function CollectFeesPage() {
  const router = useRouter()
  const { symbol } = useCurrency()
  const { classNames, sectionNames, classes, sectionsOf } = useClassesAndSections()
  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [keyword, setKeyword] = useState("")

  const [logEntries, setLogEntries] = useState<PaymentLogEntry[]>([])
  const [logLoading, setLogLoading] = useState(true)

  const loadLog = useCallback(() => {
    setLogLoading(true)
    fetch("/api/fees/fees-payment-log")
      .then((r) => r.json())
      .then((d) => setLogEntries(Array.isArray(d) ? d : []))
      .catch(() => setLogEntries([]))
      .finally(() => setLogLoading(false))
  }, [])

  useEffect(() => { loadLog() }, [loadLog])

  const selectedClass = classes.find((c) => c.name === filterClass)
  const sectionOptions = useMemo(() => {
    if (!selectedClass) return sectionNames
    return sectionsOf(selectedClass.id).map((s) => s.name)
  }, [selectedClass, sectionNames, sectionsOf])

  const handleClassChange = (value: string) => {
    setFilterClass(value)
    setFilterSection("")
  }

  const studentsEndpoint = useMemo(() => {
    const params = new URLSearchParams()
    if (filterClass) params.set("class", filterClass)
    if (filterSection) params.set("section", filterSection)
    const q = params.toString()
    return q ? `/api/students?${q}` : "/api/students"
  }, [filterClass, filterSection])

  const { data: students, loading } = useApi<StudentRecord>(studentsEndpoint)

  const filtered = useMemo(() => {
    return (students || []).filter((s) => {
      if (keyword.trim()) {
        const kw = keyword.toLowerCase()
        const haystack = [s.name, s.admissionNo, s.rollNo, s.fatherName, s.mobile].join(" ").toLowerCase()
        if (!haystack.includes(kw)) return false
      }
      return true
    })
  }, [students, keyword])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Collect Fees</h2>
          <p className="text-sm text-gray-500 mt-1">Fees Collection / Collect Fees</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Criteria
          </h3>
        </div>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="p-5"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Class/Section */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">By Class / Section</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                  <select
                    value={filterClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    <option value="">Select</option>
                    {classNames.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
                  <select
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    <option value="">Select</option>
                    {sectionOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
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
            </div>

            {/* By Keyword */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">By Keyword</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Search By Student Name, Roll Number, Enrollment No, National Id, Local Id Etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50/50 to-white">
          <h3 className="text-sm font-semibold text-gray-800">Student List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Section</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Admission No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Roll No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Father Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date Of Birth</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Mobile No.</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                    Loading students...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">No students found</td>
                </tr>
              ) : (
                filtered.map((student, idx) => (
                  <tr key={student.id} className={`border-b border-gray-100 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                    <td className="px-4 py-3 text-gray-700">{student.class}</td>
                    <td className="px-4 py-3 text-gray-700">{student.section}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{student.admissionNo}</td>
                    <td className="px-4 py-3 text-gray-600">{student.rollNo}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{student.name}</td>
                    <td className="px-4 py-3 text-gray-600">{student.fatherName}</td>
                    <td className="px-4 py-3 text-gray-600">{student.dob}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{student.mobile}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => router.push(`/admin/fees-collection/collect-fees/addfee/${student.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        Collect Fees
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50">
          <span>Showing {filtered.length} of {(students || []).length} records</span>
        </div>
      </div>

      {/* Payment Change Log */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-amber-50/60 to-white flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <History className="h-4 w-4 text-amber-600" />
            Payment Change Log
          </h3>
          <button
            onClick={loadLog}
            disabled={logLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${logLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date &amp; Time</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Fee Type</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status Change</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Paid Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">IP Address</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Note</th>
              </tr>
            </thead>
            <tbody>
              {logLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                    Loading log...
                  </td>
                </tr>
              ) : logEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">No payment changes recorded yet</td>
                </tr>
              ) : (
                logEntries.map((entry, idx) => {
                  const isStatus = entry.changeKind === "status"
                  const before = entry.paidBefore !== null ? num(entry.paidBefore) : null
                  const after = entry.paidAfter !== null ? num(entry.paidAfter) : null
                  return (
                    <tr key={entry.id} className={`border-b border-gray-100 hover:bg-[var(--primary-light)]/30 transition-colors ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDateTime(entry.paidAt)}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{entry.studentName || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{entry.feeTypeName || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        {isStatus ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">Status Change</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">Payment</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isStatus ? (
                          <span className="text-sm font-medium text-gray-800">
                            {entry.oldStatus || "-"} <span className="text-gray-400">→</span> {entry.newStatus || "-"}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-600">{entry.newStatus || entry.paymentMode || "-"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isStatus && before !== null ? (
                          <span className="font-medium text-gray-800">
                            {money(symbol, before)} <span className="text-gray-400">→</span> <span className="text-red-600">{money(symbol, after ?? 0)}</span>
                          </span>
                        ) : (
                          <span className="font-medium text-green-600">{money(symbol, num(entry.amountPaid))}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{entry.createdBy || "-"}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{entry.ipAddress || "-"}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[260px]">
                        <p className="truncate" title={entry.note || ""}>{entry.note || "-"}</p>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50">
          <span>
            {logLoading ? "Loading..." : `${logEntries.length} record(s) — payments and status changes are logged with date, time, user and IP`}
          </span>
        </div>
      </div>
    </div>
  )
}
