"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { useApi } from "@/lib/use-api"

type ExamRecord = {
  id: number
  studentName: string
  exam: string
  subject: string
  marks: number
  maxMarks: number
  grade: string
  result: "Pass" | "Fail"
  year: number
}

const examTypes = ["Periodic Test", "Half Yearly", "Annual Examination"]
export default function ExaminationsPage() {
  const { data: records, loading } = useApi<ExamRecord>("/api/alumni/examination")
  const [filterExamType, setFilterExamType] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [searched, setSearched] = useState(false)

  const filteredRecords = useMemo(() => {
    if (!searched) return []
    return records.filter((r) => {
      if (filterExamType && r.exam !== filterExamType) return false
      if (filterDateFrom && r.year < parseInt(filterDateFrom)) return false
      if (filterDateTo && r.year > parseInt(filterDateTo)) return false
      return true
    })
  }, [records, filterExamType, filterDateFrom, filterDateTo, searched])

  const handleSearch = () => setSearched(true)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Examinations</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Examinations</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <select value={filterExamType} onChange={(e) => setFilterExamType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
            <option value="">Exam Type</option>
            {examTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" placeholder="From Year" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          <input type="number" placeholder="To Year" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          <button onClick={handleSearch} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-1.5"><Search className="h-4 w-4" /> Search</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Exam</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Marks</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Grade</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Result</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Year</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Select filters and click Search</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No exam records found</td></tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{r.exam}</td>
                    <td className="px-4 py-3 text-gray-600">{r.subject}</td>
                    <td className="px-4 py-3 text-gray-700">{r.marks}/{r.maxMarks}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.grade === "A+" ? "bg-green-100 text-green-700" : r.grade === "A" ? "bg-emerald-100 text-emerald-700" : r.grade === "B+" ? "bg-blue-100 text-blue-700" : r.grade === "B" ? "bg-indigo-100 text-indigo-700" : r.grade === "C" ? "bg-amber-100 text-amber-700" : "bg-orange-100 text-orange-700"}`}>{r.grade}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.result === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.result}</span></td>
                    <td className="px-4 py-3 text-gray-600">{r.year}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {searched && <div className="mt-3 text-sm text-gray-500">Showing {filteredRecords.length} records</div>}
      </div>
    </div>
  )
}
