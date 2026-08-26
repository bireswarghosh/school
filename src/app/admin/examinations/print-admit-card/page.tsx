"use client"

import { useState } from "react"
import { Search, Printer, Download, Eye, X } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type Student = {
  id: number
  admissionNo: string
  name: string
  class: string
  section: string
  rollNo: number
  fatherName: string
  motherName: string
  dateOfBirth: string
}

type ExamGroup = {
  id: number
  name: string
}

type Exam = {
  id: number
  groupId: number
  name: string
}

export default function PrintAdmitCardPage() {
  const { classNames, sectionNames } = useClassesAndSections()
  const classes = ["", ...classNames]
  const sections = ["", ...sectionNames]
  const { data: students, loading } = useApi<Student>("/api/examinations/exam")
  const { data: groups } = useApi<ExamGroup>("/api/examinations/exam")
  const { data: exams } = useApi<Exam>("/api/examinations/exam")
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [selectedExamId, setSelectedExamId] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [searched, setSearched] = useState(false)
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())

  const filteredExams = exams.filter((e) => !selectedGroupId || e.groupId === parseInt(selectedGroupId))

  const filteredStudents = searched
    ? students.filter((s) => {
        const matchClass = !selectedClass || s.class === selectedClass
        const matchSection = !selectedSection || s.section === selectedSection
        return matchClass && matchSection
      })
    : []

  const allChecked = filteredStudents.length > 0 && filteredStudents.every((s) => checkedIds.has(s.id))

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds(new Set())
    } else {
      setCheckedIds(new Set(filteredStudents.map((s) => s.id)))
    }
  }

  const toggleOne = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSearch = () => {
    setSearched(true)
    setCheckedIds(new Set())
  }

  const handlePrintSelected = () => {
    window.print()
  }

  const handlePrintSingle = () => {
    window.print()
  }

  const selectedStudents = searched ? filteredStudents.filter((s) => checkedIds.has(s.id)) : []

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Print Admit Card</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Examinations / Print Admit Card</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Filter</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam Group</label>
              <select value={selectedGroupId} onChange={(e) => { setSelectedGroupId(e.target.value); setSelectedExamId("") }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                <option value="">Select</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam</label>
              <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                <option value="">Select</option>
                {filteredExams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                <option value="">Select</option>
                {classes.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Section</label>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                <option value="">Select</option>
                {sections.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleSearch}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </div>

      {searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-gray-700">Student List</h3>
            {selectedStudents.length > 0 && (
              <button onClick={handlePrintSelected}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                <Printer className="h-3.5 w-3.5" /> Print Selected ({selectedStudents.length})
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                  </th>
                  {["#", "Admission No", "Student Name", "Class", "Section", "Roll No", "Father Name", "Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-400">No students found</td></tr>
                ) : (
                  filteredStudents.map((s, idx) => (
                    <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={checkedIds.has(s.id)} onChange={() => toggleOne(s.id)}
                          className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                      </td>
                      <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{s.admissionNo}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.class}</td>
                      <td className="px-4 py-3 text-gray-600">{s.section}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">{s.rollNo}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.fatherName}</td>
                      <td className="px-4 py-3">
                        <button onClick={handlePrintSingle}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--primary)] bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                          <Printer className="h-3.5 w-3.5" /> Print
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
            <span>Showing {filteredStudents.length} records</span>
          </div>
        </div>
      )}
    </div>
  )
}
