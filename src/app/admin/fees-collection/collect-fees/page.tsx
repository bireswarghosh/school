"use client"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, DollarSign, Loader2, Users, Wallet, Tag } from "lucide-react"
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

const money = (symbol: string, v: number) => `${symbol}${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function CollectFeesPage() {
  const router = useRouter()
  const { symbol } = useCurrency()
  const { classNames, sectionNames, classes, sectionsOf } = useClassesAndSections()
  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [keyword, setKeyword] = useState("")

  const [feesData, setFeesData] = useState<FeeRecord[]>([])
  useEffect(() => {
    fetch("/api/fees/fees-payment")
      .then((r) => r.json())
      .then((d) => setFeesData(Array.isArray(d) ? d : []))
      .catch(() => setFeesData([]))
  }, [])

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

  const classStats = useMemo(() => {
    if (!filterClass) return null
    const ids = new Set((students || []).map((s) => Number(s.id)))
    let pending = 0
    let totalDiscount = 0
    for (const f of feesData) {
      const sid = Number(f.studentId)
      if (!ids.has(sid)) continue
      const amount = num(f.amount)
      const discount = num(f.discountAmount)
      const paid = num(f.paidAmount)
      totalDiscount += discount
      pending += Math.max(0, amount - discount - paid)
    }
    return { studentCount: (students || []).length, pending, totalDiscount }
  }, [filterClass, students, feesData])

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

      {/* Class Summary Cards */}
      {classStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <span className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Students{filterSection ? ` · ${filterSection}` : ""}</p>
              <p className="text-2xl font-bold text-gray-800">{classStats.studentCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <span className="h-10 w-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Total Pending</p>
              <p className="text-2xl font-bold text-red-600">{money(symbol, classStats.pending)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <span className="h-10 w-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
              <Tag className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500">Total Discount</p>
              <p className="text-2xl font-bold text-green-600">{money(symbol, classStats.totalDiscount)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Student List Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50/50 to-white">
          <h3 className="text-sm font-semibold text-gray-800">Student List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Sr No</th>
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
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                    Loading students...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">No students found</td>
                </tr>
              ) : (
                filtered.map((student, idx) => (
                  <tr key={student.id} className={`border-b border-gray-100 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
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

      </div>
  )
}
