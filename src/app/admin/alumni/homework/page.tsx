"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type Homework = {
  id: number
  title: string
  className: string
  subject: string
  date: string
  submissionDate: string
  description: string
}

const subjects = ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Sanskrit"]

export default function HomeworkPage() {
  const { classNames: classes } = useClassesAndSections();
  const { data: homework, loading } = useApi<Homework>("/api/alumni/homework")
  const [filterClass, setFilterClass] = useState("")
  const [filterSubject, setFilterSubject] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [searched, setSearched] = useState(false)

  const filteredHomework = useMemo(() => {
    if (!searched) return []
    return homework.filter((h) => {
      if (filterClass && h.className !== filterClass) return false
      if (filterSubject && h.subject !== filterSubject) return false
      if (filterDateFrom && h.date < filterDateFrom) return false
      if (filterDateTo && h.date > filterDateTo) return false
      return true
    })
  }, [homework, filterClass, filterSubject, filterDateFrom, filterDateTo, searched])

  const handleSearch = () => setSearched(true)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Homework</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Homework</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
            <option value="">Select Class</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
            <option value="">Select Subject</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          <button onClick={handleSearch} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-1.5"><Search className="h-4 w-4" /> Search</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Submission Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Description</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Select filters and click Search</td></tr>
              ) : filteredHomework.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No homework records found</td></tr>
              ) : (
                filteredHomework.map((h, idx) => (
                  <tr key={h.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{h.title}</td>
                    <td className="px-4 py-3 text-gray-600">{h.className}</td>
                    <td className="px-4 py-3 text-gray-600">{h.subject}</td>
                    <td className="px-4 py-3 text-gray-600">{h.date}</td>
                    <td className="px-4 py-3 text-gray-600">{h.submissionDate}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{h.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {searched && <div className="mt-3 text-sm text-gray-500">Showing {filteredHomework.length} records</div>}
      </div>
    </div>
  )
}
