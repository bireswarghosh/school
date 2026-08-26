"use client"

import { useState, useMemo } from "react"
import { Search, Eye, X, CheckCircle2, Clock } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type AssignmentRecord = {
  id: number
  class: string
  section: string
  subject: string
  homeworkDate: string
  submissionDate: string
  homework: string
  status: "Complete" | "Pending"
}

const subjectOptions = ["", "Math", "Science", "English", "Hindi", "Social Studies", "Computer"]

export default function DailyAssignmentPage() {
  const { classNames, sectionNames } = useClassesAndSections()
  const classOptions = ["", ...classNames]
  const sectionOptions = ["", ...sectionNames]
  const { data: assignments } = useApi<AssignmentRecord>("/api/homework")
  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [filterSubject, setFilterSubject] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const [viewRecord, setViewRecord] = useState<AssignmentRecord | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      if (filterClass && a.class !== filterClass) return false
      if (filterSection && a.section !== filterSection) return false
      if (filterSubject && a.subject !== filterSubject) return false
      if (fromDate && a.homeworkDate < fromDate) return false
      if (toDate && a.homeworkDate > toDate) return false
      return true
    })
  }, [assignments, filterClass, filterSection, filterSubject, fromDate, toDate])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Daily Assignment</h2>
          <p className="text-sm text-white/80 mt-1">View daily homework assignments and their status</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <form onSubmit={handleSearch} className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Select</option>
                {classOptions.slice(1).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
              <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Select</option>
                {sectionOptions.slice(1).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Select</option>
                {subjectOptions.slice(1).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
              <input type="text" value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="MM/DD/YYYY" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
              <input type="text" value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="MM/DD/YYYY" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Section</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Homework Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Submission Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Homework</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">No assignments found</td>
                </tr>
              ) : (
                filtered.map((a, idx) => (
                  <tr key={a.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-800">{a.class}</td>
                    <td className="px-4 py-3 text-gray-600">{a.section}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">{a.subject}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.homeworkDate}</td>
                    <td className="px-4 py-3 text-gray-600">{a.submissionDate}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{a.homework}</td>
                    <td className="px-4 py-3">
                      {a.status === "Complete" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setViewRecord(a); setShowViewModal(true) }} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} of {assignments.length} records</span>
        </div>
      </div>

      {showViewModal && viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Assignment Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Class</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.class}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Section</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.section}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Subject</label>
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mt-1">{viewRecord.subject}</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    {viewRecord.status === "Complete" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Homework Date</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.homeworkDate}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Submission Date</label>
                  <p className="text-sm font-medium text-gray-800">{viewRecord.submissionDate}</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Homework</label>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">{viewRecord.homework}</div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
