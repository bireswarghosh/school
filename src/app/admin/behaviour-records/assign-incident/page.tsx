"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Search, Plus, Eye, X, Save, Trash2 } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface Student {
  id: number
  admissionNo: string
  name: string
  class: string
  section: string
  gender: string
  phone: string
  house: string
}

interface Incident {
  id: number
  title: string
  points: number
  isNegative: boolean
  description: string
}

interface Assignment {
  id: number
  incidentId: number
  studentId: number
  incidentTitle: string
  points: number
  isNegative: boolean
  assignedAt: string
}

interface ClassItem {
  id: number
  name: string
}

interface SectionItem {
  id: number
  classId: number
  name: string
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-lg mx-4">
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

export default function AssignIncidentPage() {
  const { data: classList } = useApi<ClassItem>("/api/academics/class")
  const { data: incidents } = useApi<Incident>("/api/behaviour/incident")
  const { data: assignments, add: addAssignment, remove: removeAssignment } = useApi<Assignment>("/api/behaviour/assign")
  const [sections, setSections] = useState<SectionItem[]>([])

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [searched, setSearched] = useState(false)
  const [studentList, setStudentList] = useState<Student[]>([])

  const assignedMap = useMemo(() => {
    const map: Record<number, Assignment[]> = {}
    assignments.forEach((a) => {
      if (!map[a.studentId]) map[a.studentId] = []
      map[a.studentId].push(a)
    })
    return map
  }, [assignments])

  const [assignTarget, setAssignTarget] = useState<Student | null>(null)
  const [selectedIncidents, setSelectedIncidents] = useState<number[]>([])
  const [viewTarget, setViewTarget] = useState<Student | null>(null)

  const fetchSections = useCallback(async (classId: string) => {
    if (!classId) { setSections([]); return }
    try {
      const res = await fetch(`/api/academics/section?class_id=${classId}`)
      const data = await res.json()
      setSections(Array.isArray(data) ? data : [])
    } catch { setSections([]) }
  }, [])

  useEffect(() => { fetchSections(selectedClass) }, [selectedClass, fetchSections])

  const fetchStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedClass) params.set("class_id", selectedClass)
      if (selectedSection) params.set("section_id", selectedSection)
      const res = await fetch(`/api/students?${params}`)
      const data = await res.json()
      setStudentList(Array.isArray(data) ? data : [])
    } catch { setStudentList([]) }
  }, [selectedClass, selectedSection])

  const handleSearch = () => {
    setSearched(true)
    fetchStudents()
  }

  const getPositivePoints = (studentId: number) => {
    const items = assignedMap[studentId] || []
    return items.filter((a) => !a.isNegative).reduce((sum, a) => sum + a.points, 0)
  }

  const getNegativePoints = (studentId: number) => {
    const items = assignedMap[studentId] || []
    return items.filter((a) => a.isNegative).reduce((sum, a) => sum + a.points, 0)
  }

  const openAssignModal = (student: Student) => {
    setAssignTarget(student)
    const existing = assignedMap[student.id] || []
    setSelectedIncidents(existing.map((a) => a.incidentId))
  }

  const toggleIncident = (incidentId: number) => {
    setSelectedIncidents((prev) =>
      prev.includes(incidentId) ? prev.filter((id) => id !== incidentId) : [...prev, incidentId]
    )
  }

  const saveAssignIncidents = async () => {
    if (!assignTarget) return
    for (const existing of assignments.filter((a) => a.studentId === assignTarget.id)) {
      await removeAssignment(existing.id)
    }
    for (const incId of selectedIncidents) {
      const inc = incidents.find((i) => i.id === incId)
      if (!inc) continue
      await addAssignment({
        incidentId: inc.id,
        studentId: assignTarget.id,
        incidentTitle: inc.title,
        points: inc.points,
        isNegative: inc.isNegative,
        assignedAt: new Date().toISOString(),
      })
    }
    setAssignTarget(null)
    setSelectedIncidents([])
  }

  const removeAssignedIncident = async (studentId: number, assignmentId: number) => {
    await removeAssignment(assignmentId)
  }

  const [showStudentSelect, setShowStudentSelect] = useState(false)
  const [quickStudentId, setQuickStudentId] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const handleStudentSubmit = async () => {
    if (!quickStudentId) return
    try {
      const res = await fetch(`/api/students?id=${quickStudentId}`)
      const data = await res.json()
      if (data && !data.error) {
        setSelectedStudent(data)
        setShowStudentSelect(true)
      }
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assign Incident</h2>
          <p className="text-sm text-gray-500 mt-1">Behaviour Records / Assign Incident</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Class</label>
            <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection("") }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
              <option value="">Select</option>
              {classList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Section</label>
            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
              <option value="">Select</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button onClick={handleSearch}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Search className="h-4 w-4" /> Search
          </button>
        </div>
      </div>

      {searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Student Name", "Admission No", "Class-Section", "Gender", "Phone", "Positive Points", "Negative Points", "Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentList.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No students found for the selected criteria</td></tr>
                ) : (
                  studentList.map((student, idx) => (
                    <tr key={student.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)] transition-colors`}>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{student.name}</td>
                      <td className="px-4 py-3 text-gray-600">{student.admissionNo}</td>
                      <td className="px-4 py-3 text-gray-600">{student.class}-{student.section}</td>
                      <td className="px-4 py-3 text-gray-600">{student.gender}</td>
                      <td className="px-4 py-3 text-gray-600">{student.phone}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          +{getPositivePoints(student.id)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          -{getNegativePoints(student.id)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openAssignModal(student)} className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors" title="Assign Incident">
                            <Plus className="h-4 w-4" />
                          </button>
                          <button onClick={() => setViewTarget(student)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Incidents">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {assignTarget && (
        <ModalOverlay onClose={() => { setAssignTarget(null); setSelectedIncidents([]) }}>
          <ModalHeader title={`Assign Incident - ${assignTarget.name}`} onClose={() => { setAssignTarget(null); setSelectedIncidents([]) }} />
          <div className="px-6 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
            <p className="text-sm text-gray-500 mb-2">Select incidents to assign to this student:</p>
            {incidents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No incidents available. Please create incidents first.</p>
            ) : (
              incidents.map((inc) => (
                <label key={inc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selectedIncidents.includes(inc.id)} onChange={() => toggleIncident(inc.id)}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                    <div>
                      <span className="text-sm font-medium text-gray-800">{inc.title}</span>
                      <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                        inc.isNegative ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        {inc.isNegative ? "-" : "+"}{inc.points}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{inc.isNegative ? "Negative" : "Positive"}</span>
                </label>
              ))
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => { setAssignTarget(null); setSelectedIncidents([]) }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={saveAssignIncidents} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </ModalOverlay>
      )}

      {viewTarget && (
        <ModalOverlay onClose={() => setViewTarget(null)}>
          <ModalHeader title={`Incidents - ${viewTarget.name}`} onClose={() => setViewTarget(null)} />
          <div className="px-6 py-4">
            {(assignedMap[viewTarget.id] || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No incidents assigned to this student</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {["#", "Incident", "Points", "Date", "Action"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(assignedMap[viewTarget.id] || []).map((a, i) => (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-800">{a.incidentTitle}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.isNegative ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}>
                          {a.isNegative ? "-" : "+"}{a.points}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{a.assignedAt ? new Date(a.assignedAt).toLocaleDateString("en-US") : ""}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeAssignedIncident(viewTarget.id, a.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" title="Remove">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setViewTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Close</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}