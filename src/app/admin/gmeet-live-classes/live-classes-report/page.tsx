"use client"

import { useState } from "react"
import { Search, Eye, X } from "lucide-react"
import { useClassesAndSections } from "@/lib/use-classes-sections"

interface LiveClassReport {
  id: number
  title: string
  date: string
  duration: string
  staff: string
  class: string
  section: string
  totalJoined: number
  joinedStudents: { name: string; admissionNo: string }[]
}

const reportData: LiveClassReport[] = [
  { id: 1, title: "Mathematics - Algebra Basics", date: "07/03/2026", duration: "45 min", staff: "John Doe", class: "Class 1", section: "A", totalJoined: 28, joinedStudents: [
    { name: "Alice Johnson", admissionNo: "ADM001" }, { name: "Bob Smith", admissionNo: "ADM002" }, { name: "Charlie Brown", admissionNo: "ADM003" },
  ]},
  { id: 2, title: "Science - Plant Biology", date: "07/03/2026", duration: "40 min", staff: "Jane Smith", class: "Class 2", section: "A", totalJoined: 22, joinedStudents: [
    { name: "Diana Prince", admissionNo: "ADM004" }, { name: "Edward Norton", admissionNo: "ADM005" },
  ]},
  { id: 3, title: "English Grammar Session", date: "07/02/2026", duration: "35 min", staff: "Robert Wilson", class: "Class 3", section: "B", totalJoined: 30, joinedStudents: [
    { name: "Fiona Apple", admissionNo: "ADM006" }, { name: "George Lucas", admissionNo: "ADM007" }, { name: "Hannah Montana", admissionNo: "ADM008" },
  ]},
  { id: 4, title: "History - Ancient Civilizations", date: "07/04/2026", duration: "50 min", staff: "Emily Davis", class: "Class 4", section: "A", totalJoined: 18, joinedStudents: [
    { name: "Ivan Peters", admissionNo: "ADM009" },
  ]},
]

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-2xl mx-4">
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

export default function LiveClassesReportPage() {
  const { classNames: classes, sectionNames: sections } = useClassesAndSections()
  const [filter, setFilter] = useState({ class: "", section: "" })
  const [filteredData, setFilteredData] = useState<LiveClassReport[] | null>(null)
  const [viewJoinList, setViewJoinList] = useState<LiveClassReport | null>(null)

  const handleSearch = () => {
    const filtered = reportData.filter((r) => {
      const matchClass = !filter.class || r.class === filter.class
      const matchSection = !filter.section || r.section === filter.section
      return matchClass && matchSection
    })
    setFilteredData(filtered)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Live Classes Report</h2>
        <p className="text-sm text-gray-500 mt-1">Gmeet Live Classes / Live Classes Report</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-800">Search Live Class Report</h3>
        </div>
        <div className="p-4 flex flex-wrap items-end gap-4 border-b border-gray-200">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Class</label>
            <select value={filter.class} onChange={(e) => setFilter({ ...filter, class: e.target.value })}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Select</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Section</label>
            <select value={filter.section} onChange={(e) => setFilter({ ...filter, section: e.target.value })}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Select</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={handleSearch}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Search className="h-4 w-4" /> Search
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "Class Title", "Date", "Duration", "Staff", "Class", "Section", "Total Joined", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(filteredData || reportData).map((r, idx) => (
                <tr key={r.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                  <td className="px-4 py-2.5 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{r.title}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{r.duration}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.staff}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.class}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.section}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {r.totalJoined}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => setViewJoinList(r)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Join List">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {(filteredData && filteredData.length === 0) && (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-400">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewJoinList && (
        <ModalOverlay onClose={() => setViewJoinList(null)}>
          <ModalHeader title={`Join List - ${viewJoinList.title}`} onClose={() => setViewJoinList(null)} />
          <div className="px-6 py-4">
            <p className="text-xs text-gray-500 mb-3">Total Students Joined: <strong>{viewJoinList.totalJoined}</strong></p>
            {viewJoinList.joinedStudents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No students joined</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">#</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">Admission No</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">Student Name</th>
                  </tr>
                </thead>
                <tbody>
                  {viewJoinList.joinedStudents.map((s, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                      <td className="px-3 py-2 text-gray-600">{s.admissionNo}</td>
                      <td className="px-3 py-2 font-medium text-gray-800">{s.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setViewJoinList(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Close</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
