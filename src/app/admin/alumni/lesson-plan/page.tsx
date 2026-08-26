"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type LessonPlan = {
  id: number
  lesson: string
  topic: string
  subject: string
  startDate: string
  endDate: string
  status: string
  className: string
}

const subjects = ["Mathematics", "Science", "English", "Social Studies", "Hindi"]

export default function LessonPlanPage() {
  const { classNames: classes } = useClassesAndSections();
  const { data: plans, loading } = useApi<LessonPlan>("/api/alumni/lesson-plan")
  const [filterSubject, setFilterSubject] = useState("")
  const [filterClass, setFilterClass] = useState("")
  const [searched, setSearched] = useState(false)

  const filteredPlans = useMemo(() => {
    if (!searched) return []
    return plans.filter((p) => {
      if (filterSubject && p.subject !== filterSubject) return false
      if (filterClass && p.className !== filterClass) return false
      return true
    })
  }, [plans, filterSubject, filterClass, searched])

  const handleSearch = () => setSearched(true)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Lesson Plan</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Lesson Plan</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
            <option value="">Select Subject</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
            <option value="">Select Class</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={handleSearch} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-1.5"><Search className="h-4 w-4" /> Search</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Lesson</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Topic</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Start Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">End Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Class</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Select filters and click Search</td></tr>
              ) : filteredPlans.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No lesson plans found</td></tr>
              ) : (
                filteredPlans.map((p, idx) => (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{p.lesson}</td>
                    <td className="px-4 py-3 text-gray-600">{p.topic}</td>
                    <td className="px-4 py-3 text-gray-600">{p.subject}</td>
                    <td className="px-4 py-3 text-gray-600">{p.startDate}</td>
                    <td className="px-4 py-3 text-gray-600">{p.endDate}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === "Completed" ? "bg-green-100 text-green-700" : p.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{p.status}</span></td>
                    <td className="px-4 py-3 text-gray-600">{p.className}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {searched && <div className="mt-3 text-sm text-gray-500">Showing {filteredPlans.length} records</div>}
      </div>
    </div>
  )
}
