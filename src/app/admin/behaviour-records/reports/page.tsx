"use client"

import { useState, useMemo } from "react"
import { Search, Eye, X, ChevronDown, ChevronRight } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

interface Student {
  id: number
  name: string
  admissionNo: string
  class: string
  section: string
  gender: string
  phone: string
  house: string
}

interface AssignedIncident {
  id: number
  incidentId: string
  incidentTitle: string
  points: number
  isNegative: boolean
  assignedAt: string
}

const reportTypes = [
  { key: "student", label: "Student Incident Report", desc: "View incidents assigned to individual students" },
  { key: "rank", label: "Student Behaviour Rank Report", desc: "Rank students by behaviour points" },
  { key: "class", label: "Class Wise Rank Report", desc: "Compare classes by total behaviour points" },
  { key: "class-section", label: "Class Section Wise Rank Report", desc: "Compare class sections by total points" },
  { key: "house", label: "House Wise Rank Report", desc: "Compare houses by total behaviour points" },
  { key: "incident", label: "Incident Wise Report", desc: "View incidents by assigned count" },
]

const allStudents: Student[] = [
  { id: 1, name: "Alice Johnson", admissionNo: "ADM001", class: "Class 1", section: "A", gender: "Female", phone: "123-456-7890", house: "Blue House" },
  { id: 2, name: "Bob Smith", admissionNo: "ADM002", class: "Class 1", section: "A", gender: "Male", phone: "123-456-7891", house: "Red House" },
  { id: 3, name: "Charlie Brown", admissionNo: "ADM003", class: "Class 1", section: "A", gender: "Male", phone: "123-456-7892", house: "Green House" },
  { id: 4, name: "Diana Prince", admissionNo: "ADM004", class: "Class 1", section: "B", gender: "Female", phone: "123-456-7893", house: "Yellow House" },
  { id: 5, name: "Edward Norton", admissionNo: "ADM005", class: "Class 1", section: "B", gender: "Male", phone: "123-456-7894", house: "Blue House" },
  { id: 6, name: "Fiona Apple", admissionNo: "ADM006", class: "Class 2", section: "A", gender: "Female", phone: "123-456-7895", house: "Red House" },
  { id: 7, name: "George Lucas", admissionNo: "ADM007", class: "Class 2", section: "A", gender: "Male", phone: "123-456-7896", house: "Green House" },
  { id: 8, name: "Hannah Montana", admissionNo: "ADM008", class: "Class 2", section: "B", gender: "Female", phone: "123-456-7897", house: "Yellow House" },
  { id: 9, name: "Ivan Peters", admissionNo: "ADM009", class: "Class 3", section: "A", gender: "Male", phone: "123-456-7898", house: "Blue House" },
  { id: 10, name: "Julia Roberts", admissionNo: "ADM010", class: "Class 3", section: "A", gender: "Female", phone: "123-456-7899", house: "Red House" },
  { id: 11, name: "Kevin Hart", admissionNo: "ADM011", class: "Class 3", section: "B", gender: "Male", phone: "123-456-7900", house: "Green House" },
  { id: 12, name: "Laura Croft", admissionNo: "ADM012", class: "Class 4", section: "A", gender: "Female", phone: "123-456-7901", house: "Yellow House" },
  { id: 13, name: "Mike Wazowski", admissionNo: "ADM013", class: "Class 4", section: "A", gender: "Male", phone: "123-456-7902", house: "Blue House" },
  { id: 14, name: "Nina Simone", admissionNo: "ADM014", class: "Class 5", section: "B", gender: "Female", phone: "123-456-7903", house: "Red House" },
  { id: 15, name: "Oscar Wilde", admissionNo: "ADM015", class: "Class 5", section: "B", gender: "Male", phone: "123-456-7904", house: "Green House" },
]

const houses = ["Blue House", "Red House", "Green House", "Yellow House"]
const houseColors: Record<string, string> = {
  "Blue House": "bg-blue-500",
  "Red House": "bg-red-500",
  "Green House": "bg-green-500",
  "Yellow House": "bg-yellow-500",
}

const availableIncidents = [
  { id: "i1", title: "Helpful to others", points: 10, isNegative: false },
  { id: "i2", title: "Participation", points: 5, isNegative: false },
  { id: "i3", title: "Disruptive Behavior", points: 10, isNegative: true },
  { id: "i4", title: "Late Submission", points: 5, isNegative: true },
  { id: "i5", title: "Uniform Violation", points: 3, isNegative: true },
  { id: "i6", title: "Excellent Performance", points: 20, isNegative: false },
]

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-3xl mx-4">
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

export default function ReportsPage() {
  const { classNames: classes, sectionNames: sections } = useClassesAndSections()
  const [activeReport, setActiveReport] = useState<string | null>(null)
  const { data: assignedList, loading } = useApi<AssignedIncident & { studentId: number }>("/api/behaviour/assign")
  const assignedMap = useMemo(() => {
    const map: Record<number, AssignedIncident[]> = {}
    assignedList.forEach((a) => {
      if (!map[a.studentId]) map[a.studentId] = []
      map[a.studentId].push({ id: a.id, incidentId: a.incidentId, incidentTitle: a.incidentTitle, points: a.points, isNegative: a.isNegative, assignedAt: a.assignedAt })
    })
    return map
  }, [assignedList])

  const [studentFilter, setStudentFilter] = useState({ class: "", section: "", session: "current" })
  const [studentData, setStudentData] = useState<{ student: Student; incidents: AssignedIncident[] }[] | null>(null)

  const [rankFilter, setRankFilter] = useState({ class: "", section: "", session: "current", type: "lte", points: "" })
  const [rankData, setRankData] = useState<{ student: Student; totalPoints: number; rank: number }[] | null>(null)

  const [incidentFilter, setIncidentFilter] = useState({ session: "current" })
  const [incidentReportData, setIncidentReportData] = useState<{ incident: typeof availableIncidents[0]; count: number; studentIds: number[] }[] | null>(null)
  const [incidentStudentView, setIncidentStudentView] = useState<{ incidentTitle: string; students: string[] } | null>(null)

  const [detailModal, setDetailModal] = useState<{ title: string; incidents: AssignedIncident[] } | null>(null)

  const getTotalPoints = (studentId: number) => {
    const incidents = assignedMap[studentId] || []
    return incidents.reduce((sum, a) => sum + (a.isNegative ? -a.points : a.points), 0)
  }

  const handleStudentSearch = () => {
    const students = allStudents.filter((s) => {
      const matchClass = !studentFilter.class || s.class === studentFilter.class
      const matchSection = !studentFilter.section || s.section === studentFilter.section
      return matchClass && matchSection
    })
    setStudentData(students.map((s) => ({ student: s, incidents: assignedMap[s.id] || [] })))
  }

  const handleRankSearch = () => {
    const students = allStudents.filter((s) => {
      const matchClass = !rankFilter.class || s.class === rankFilter.class
      const matchSection = !rankFilter.section || s.section === rankFilter.section
      return matchClass && matchSection
    })
    const withPoints = students.map((s) => ({ student: s, totalPoints: getTotalPoints(s.id) }))
      .filter((s) => {
        if (!rankFilter.points) return true
        const pts = Number(rankFilter.points)
        return rankFilter.type === "lte" ? s.totalPoints <= pts : s.totalPoints >= pts
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((s, i) => ({ ...s, rank: i + 1 }))
    setRankData(withPoints)
  }

  const handleIncidentSearch = () => {
    const incidentCounts = availableIncidents.map((inc) => {
      const studentIds: number[] = []
      for (const [sId, assignments] of Object.entries(assignedMap)) {
        if (assignments.some((a) => a.incidentId === inc.id)) {
          studentIds.push(Number(sId))
        }
      }
      return { incident: inc, count: studentIds.length, studentIds }
    })
    setIncidentReportData(incidentCounts)
  }

  const classRankings = useMemo(() => {
    const classMap: Record<string, { totalPoints: number; studentCount: number }> = {}
    allStudents.forEach((s) => {
      if (!classMap[s.class]) classMap[s.class] = { totalPoints: 0, studentCount: 0 }
      classMap[s.class].totalPoints += getTotalPoints(s.id)
      classMap[s.class].studentCount++
    })
    return Object.entries(classMap)
      .map(([className, data]) => ({ className, ...data }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((item, i) => ({ ...item, rank: i + 1 }))
  }, [assignedMap])

  const classSectionRankings = useMemo(() => {
    const csMap: Record<string, { class: string; section: string; totalPoints: number; studentCount: number }> = {}
    allStudents.forEach((s) => {
      const key = `${s.class}-${s.section}`
      if (!csMap[key]) csMap[key] = { class: s.class, section: s.section, totalPoints: 0, studentCount: 0 }
      csMap[key].totalPoints += getTotalPoints(s.id)
      csMap[key].studentCount++
    })
    return Object.values(csMap)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((item, i) => ({ ...item, rank: i + 1 }))
  }, [assignedMap])

  const houseRankings = useMemo(() => {
    const houseMap: Record<string, { totalPoints: number; studentCount: number }> = {}
    allStudents.forEach((s) => {
      if (!houseMap[s.house]) houseMap[s.house] = { totalPoints: 0, studentCount: 0 }
      houseMap[s.house].totalPoints += getTotalPoints(s.id)
      houseMap[s.house].studentCount++
    })
    return Object.entries(houseMap)
      .map(([houseName, data]) => ({ houseName, ...data }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((item, i) => ({ ...item, rank: i + 1 }))
  }, [assignedMap])

  const pieChartData = useMemo(() => {
    if (!incidentReportData) return null
    const total = incidentReportData.reduce((sum, d) => sum + d.count, 0)
    if (total === 0) return null
    const colors = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"]
    return incidentReportData.map((d, i) => ({
      label: d.incident.title,
      value: d.count,
      percentage: Math.round((d.count / total) * 100),
      color: colors[i % colors.length],
    }))
  }, [incidentReportData])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
        <p className="text-sm text-gray-500 mt-1">Behaviour Records / Reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((rt) => (
          <button key={rt.key} onClick={() => setActiveReport(activeReport === rt.key ? null : rt.key)}
            className={`text-left p-4 rounded-xl border transition-all ${
              activeReport === rt.key
                ? "border-indigo-300 bg-[var(--primary-light)] shadow-sm"
                : "border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm"
            }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-800">{rt.label}</span>
              {activeReport === rt.key ? <ChevronDown className="h-4 w-4 text-indigo-500" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            </div>
            <p className="text-xs text-gray-500">{rt.desc}</p>
          </button>
        ))}
      </div>

      {activeReport === "student" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Student Incident Report</h3>
          </div>
          <div className="p-4 flex flex-wrap items-end gap-4 border-b border-gray-200">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Class</label>
              <select value={studentFilter.class} onChange={(e) => setStudentFilter({ ...studentFilter, class: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Select</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Section</label>
              <select value={studentFilter.section} onChange={(e) => setStudentFilter({ ...studentFilter, section: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Select</option>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Session</label>
              <select value={studentFilter.session} onChange={(e) => setStudentFilter({ ...studentFilter, session: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="current">Current Session Points</option>
                <option value="all">All Session Points</option>
              </select>
            </div>
            <button onClick={handleStudentSearch}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
          {studentData && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {["Admission No", "Name", "Class-Section", "Gender", "Phone", "Total Incidents", "Total Points", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentData.map((row, idx) => (
                    <tr key={row.student.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                      <td className="px-4 py-2.5 text-gray-600">{row.student.admissionNo}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{row.student.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{row.student.class}-{row.student.section}</td>
                      <td className="px-4 py-2.5 text-gray-600">{row.student.gender}</td>
                      <td className="px-4 py-2.5 text-gray-600">{row.student.phone}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-center">{row.incidents.length}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          getTotalPoints(row.student.id) >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {getTotalPoints(row.student.id)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => setDetailModal({ title: `${row.student.name} - Incidents`, incidents: row.incidents })}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Show">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {studentData.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No data found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeReport === "rank" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Student Behaviour Rank Report</h3>
          </div>
          <div className="p-4 flex flex-wrap items-end gap-4 border-b border-gray-200">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Class</label>
              <select value={rankFilter.class} onChange={(e) => setRankFilter({ ...rankFilter, class: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Select</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Section</label>
              <select value={rankFilter.section} onChange={(e) => setRankFilter({ ...rankFilter, section: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Select</option>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Session</label>
              <select value={rankFilter.session} onChange={(e) => setRankFilter({ ...rankFilter, session: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="current">Current Session Points</option>
                <option value="all">All Session Points</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Type</label>
              <select value={rankFilter.type} onChange={(e) => setRankFilter({ ...rankFilter, type: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="lte">Less Than or Equal To</option>
                <option value="gte">Greater Than or Equal To</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Points</label>
              <input type="number" value={rankFilter.points} onChange={(e) => setRankFilter({ ...rankFilter, points: e.target.value })}
                placeholder="Enter points"
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-28" />
            </div>
            <button onClick={handleRankSearch}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
          {rankData && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {["Rank", "Admission No", "Name", "Class-Section", "Gender", "Phone", "Total Points", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankData.map((row, idx) => (
                    <tr key={row.student.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          row.rank <= 3 ? "bg-[var(--primary-light)] text-[var(--primary)]" : "bg-gray-100 text-gray-600"
                        }`}>{row.rank}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{row.student.admissionNo}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{row.student.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{row.student.class}-{row.student.section}</td>
                      <td className="px-4 py-2.5 text-gray-600">{row.student.gender}</td>
                      <td className="px-4 py-2.5 text-gray-600">{row.student.phone}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.totalPoints >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>{row.totalPoints}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => setDetailModal({ title: `${row.student.name} - Incidents`, incidents: assignedMap[row.student.id] || [] })}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Show">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rankData.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No data found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeReport === "class" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Class Wise Rank Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Rank", "Class", "Total Students", "Total Points", "Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classRankings.map((row, idx) => (
                  <tr key={row.className} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        row.rank <= 3 ? "bg-[var(--primary-light)] text-[var(--primary)]" : "bg-gray-100 text-gray-600"
                      }`}>{row.rank}</span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.className}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.studentCount}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.totalPoints >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>{row.totalPoints}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => {
                        const students = allStudents.filter((s) => s.class === row.className)
                        const allIncidents = students.flatMap((s) => (assignedMap[s.id] || []))
                        setDetailModal({ title: `${row.className} - Incidents`, incidents: allIncidents })
                      }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Show">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === "class-section" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Class Section Wise Rank Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Rank", "Class", "Section", "Total Students", "Total Points", "Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classSectionRankings.map((row, idx) => (
                  <tr key={`${row.class}-${row.section}`} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        row.rank <= 3 ? "bg-[var(--primary-light)] text-[var(--primary)]" : "bg-gray-100 text-gray-600"
                      }`}>{row.rank}</span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.class}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.section}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.studentCount}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.totalPoints >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>{row.totalPoints}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => {
                        const students = allStudents.filter((s) => s.class === row.class && s.section === row.section)
                        const allIncidents = students.flatMap((s) => (assignedMap[s.id] || []))
                        setDetailModal({ title: `${row.class} - ${row.section} Incidents`, incidents: allIncidents })
                      }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Show">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === "house" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">House Wise Rank Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Rank", "House", "Total Students", "Total Points", "Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {houseRankings.map((row, idx) => (
                  <tr key={row.houseName} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        row.rank <= 3 ? "bg-[var(--primary-light)] text-[var(--primary)]" : "bg-gray-100 text-gray-600"
                      }`}>{row.rank}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${houseColors[row.houseName] || "bg-gray-400"}`} />
                        <span className="font-medium text-gray-800">{row.houseName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{row.studentCount}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.totalPoints >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>{row.totalPoints}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => {
                        const students = allStudents.filter((s) => s.house === row.houseName)
                        const allIncidents = students.flatMap((s) => (assignedMap[s.id] || []))
                        setDetailModal({ title: `${row.houseName} - Incidents`, incidents: allIncidents })
                      }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Show">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === "incident" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Incident Wise Report</h3>
          </div>
          <div className="p-4 flex flex-wrap items-end gap-4 border-b border-gray-200">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Session</label>
              <select value={incidentFilter.session} onChange={(e) => setIncidentFilter({ ...incidentFilter, session: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="current">Current Session Points</option>
                <option value="all">All Session Points</option>
              </select>
            </div>
            <button onClick={handleIncidentSearch}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
          {incidentReportData && (
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {["Incident", "Total Assigned", "Action"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {incidentReportData.map((row, idx) => (
                      <tr key={row.incident.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-3 py-2 font-medium text-gray-800">{row.incident.title}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => {
                            const studentNames = row.studentIds.map((sid) => allStudents.find((s) => s.id === sid)?.name || "Unknown")
                            setIncidentStudentView({ incidentTitle: row.incident.title, students: studentNames })
                          }} className="text-[var(--primary)] hover:text-[var(--secondary)] font-medium underline">
                            {row.count}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => {
                            const studentNames = row.studentIds.map((sid) => allStudents.find((s) => s.id === sid)?.name || "Unknown")
                            setIncidentStudentView({ incidentTitle: row.incident.title, students: studentNames })
                          }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pieChartData && (
                <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Incident Distribution</h4>
                  <div className="flex items-center gap-6">
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        {(() => {
                          let cumulative = 0
                          return pieChartData.map((slice) => {
                            const startAngle = cumulative
                            cumulative += slice.percentage
                            const endAngle = cumulative
                            const x1 = 18 + 15 * Math.cos((2 * Math.PI * startAngle) / 100)
                            const y1 = 18 + 15 * Math.sin((2 * Math.PI * startAngle) / 100)
                            const x2 = 18 + 15 * Math.cos((2 * Math.PI * endAngle) / 100)
                            const y2 = 18 + 15 * Math.sin((2 * Math.PI * endAngle) / 100)
                            const largeArc = slice.percentage > 50 ? 1 : 0
                            const pathData = slice.percentage === 100
                              ? `M 18 3 A 15 15 0 1 1 18 33 A 15 15 0 1 1 18 3`
                              : `M 18 18 L ${x1} ${y1} A 15 15 0 ${largeArc} 1 ${x2} ${y2} Z`
                            return <path key={slice.label} d={pathData} fill={slice.color} stroke="white" strokeWidth="0.5" />
                          })
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-700">{pieChartData.reduce((s, d) => s + d.value, 0)}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {pieChartData.map((slice) => (
                        <div key={slice.label} className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: slice.color }} />
                          <span className="text-gray-600">{slice.label}</span>
                          <span className="text-gray-400">({slice.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {detailModal && (
        <ModalOverlay onClose={() => setDetailModal(null)}>
          <ModalHeader title={detailModal.title} onClose={() => setDetailModal(null)} />
          <div className="px-6 py-4">
            {detailModal.incidents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No incidents found</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {["#", "Incident", "Points", "Date"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detailModal.incidents.map((a, i) => (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-800">{a.incidentTitle}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.isNegative ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}>{a.isNegative ? "-" : "+"}{a.points}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{a.assignedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setDetailModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Close</button>
          </div>
        </ModalOverlay>
      )}

      {incidentStudentView && (
        <ModalOverlay onClose={() => setIncidentStudentView(null)}>
          <ModalHeader title={`Students - ${incidentStudentView.incidentTitle}`} onClose={() => setIncidentStudentView(null)} />
          <div className="px-6 py-4">
            {incidentStudentView.students.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No students assigned</p>
            ) : (
              <ul className="space-y-2">
                {incidentStudentView.students.map((name, i) => (
                  <li key={i} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-sm text-gray-800">{name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setIncidentStudentView(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Close</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
