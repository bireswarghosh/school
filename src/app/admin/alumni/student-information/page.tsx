"use client"

import { useState, useMemo } from "react"
import { Search, Eye, X } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type Student = {
  id: number
  name: string
  admissionNo: string
  className: string
  section: string
  passoutYear: number
  currentStatus: string
  fatherName: string
  motherName: string
  dob: string
  gender: string
  mobile: string
  email: string
  address: string
}

const passoutYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

export default function StudentInformationPage() {
  const { classNames: classes, sectionNames: sections } = useClassesAndSections();
  const { data: students, loading } = useApi<Student>("/api/alumni/student")
  const [filterYear, setFilterYear] = useState("")
  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [searched, setSearched] = useState(false)
  const [viewStudent, setViewStudent] = useState<Student | null>(null)

  const filteredStudents = useMemo(() => {
    if (!searched) return []
    return students.filter((s) => {
      if (filterYear && s.passoutYear !== parseInt(filterYear)) return false
      if (filterClass && s.className !== filterClass) return false
      if (filterSection && s.section !== filterSection) return false
      return true
    })
  }, [students, filterYear, filterClass, filterSection, searched])

  const handleSearch = () => {
    setSearched(true)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Student Information</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Student Information</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Passout Year</option>
              {passoutYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Class</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Section</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={handleSearch} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-1.5"><Search className="h-4 w-4" /> Search</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Admission No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Section</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Passout Year</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Current Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Select filters and click Search</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No students found</td></tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.admissionNo}</td>
                    <td className="px-4 py-3 text-gray-600">{s.className}</td>
                    <td className="px-4 py-3 text-gray-600">{s.section}</td>
                    <td className="px-4 py-3 text-gray-600">{s.passoutYear}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.currentStatus === "Employed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{s.currentStatus}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => setViewStudent(s)} className="text-blue-600 hover:text-blue-800"><Eye className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {searched && <div className="mt-3 text-sm text-gray-500">Showing {filteredStudents.length} records</div>}
      </div>

      {viewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewStudent(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Student Details</h2>
              <button onClick={() => setViewStudent(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Name:</span><span className="text-gray-800">{viewStudent.name}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Admission No:</span><span className="text-gray-800">{viewStudent.admissionNo}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Class:</span><span className="text-gray-800">{viewStudent.className}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Section:</span><span className="text-gray-800">{viewStudent.section}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Passout Year:</span><span className="text-gray-800">{viewStudent.passoutYear}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Father Name:</span><span className="text-gray-800">{viewStudent.fatherName}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Mother Name:</span><span className="text-gray-800">{viewStudent.motherName}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">DOB:</span><span className="text-gray-800">{viewStudent.dob}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Gender:</span><span className="text-gray-800">{viewStudent.gender}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Mobile:</span><span className="text-gray-800">{viewStudent.mobile}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Email:</span><span className="text-gray-800">{viewStudent.email}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Address:</span><span className="text-gray-800">{viewStudent.address}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Current Status:</span><span className="text-gray-800">{viewStudent.currentStatus}</span></div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setViewStudent(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
