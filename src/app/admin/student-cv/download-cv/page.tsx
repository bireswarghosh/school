"use client"

import { useState } from "react"
import { Search, Eye, Download, X, FileText, Filter } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

interface StudentCv {
  id: number
  name: string
  classVal: string
  section: string
  hasCv: boolean
  cvDetails: {
    name: string
    dob: string
    gender: string
    address: string
    education: { school: string; board: string; year: string; percentage: string }[]
    achievements: string
    skills: string
    hobbies: string
  } | null
}

export default function DownloadCvPage() {
  const { classNames: classOptions, sectionNames: sectionOptions } = useClassesAndSections()
  const { data: students, loading } = useApi<StudentCv>("/api/student-information/student")
  const [nameFilter, setNameFilter] = useState("")
  const [classFilter, setClassFilter] = useState("")
  const [sectionFilter, setSectionFilter] = useState("")
  const [viewStudent, setViewStudent] = useState<StudentCv | null>(null)

  const filteredStudents = students.filter(s => {
    if (nameFilter && !s.name.toLowerCase().includes(nameFilter.toLowerCase())) return false
    if (classFilter && s.classVal !== classFilter) return false
    if (sectionFilter && s.section !== sectionFilter) return false
    return true
  })

  const handleDownload = (student: StudentCv) => {
    if (!student.hasCv || !student.cvDetails) return
    const content = [
      `=== STUDENT CV ===`,
      `Name: ${student.cvDetails.name}`,
      `DOB: ${student.cvDetails.dob}`,
      `Gender: ${student.cvDetails.gender}`,
      `Address: ${student.cvDetails.address}`,
      ``,
      `--- Education ---`,
      ...student.cvDetails.education.map(e => `${e.school} (${e.board}) - ${e.year}: ${e.percentage}`),
      ``,
      `--- Achievements ---`,
      student.cvDetails.achievements,
      ``,
      `--- Skills ---`,
      student.cvDetails.skills,
      ``,
      `--- Hobbies ---`,
      student.cvDetails.hobbies,
    ].join("\n")

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${student.name.replace(/\s+/g, "_")}_CV.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Download className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Download CV</h1>
            <p className="text-blue-100 text-sm">View and download student CVs</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2"><Filter className="w-5 h-5 text-gray-500" /></div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Student Name</label>
            <input type="text" value={nameFilter} onChange={e => setNameFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" placeholder="Search by name" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Class</label>
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-sm">
              <option value="">All</option>
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section</label>
            <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-sm">
              <option value="">All</option>
              {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md text-sm">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Students</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Class</th>
                <th className="text-left p-3">Section</th>
                <th className="text-center p-3">CV Status</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-6 text-gray-400">No students found.</td></tr>
              ) : filteredStudents.map((student, i) => (
                <tr key={student.id} className={`border-t border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                  <td className="p-3 text-gray-500">{student.id}</td>
                  <td className="p-3 font-medium text-gray-800">{student.name}</td>
                  <td className="p-3 text-gray-600">{student.classVal}</td>
                  <td className="p-3 text-gray-600">{student.section}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.hasCv ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {student.hasCv ? "Available" : "Not Available"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setViewStudent(student)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="View"><Eye className="w-4 h-4" /></button>
                      {student.hasCv && (
                        <button onClick={() => handleDownload(student)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-all" title="Download"><Download className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">CV Details</h3>
              <button onClick={() => setViewStudent(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {viewStudent.hasCv && viewStudent.cvDetails ? (
                <>
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
                    <h2 className="text-2xl font-bold">{viewStudent.cvDetails.name}</h2>
                    <p className="text-blue-100">{viewStudent.cvDetails.gender} | DOB: {viewStudent.cvDetails.dob}</p>
                    <p className="text-blue-100 text-sm mt-1">{viewStudent.cvDetails.address}</p>
                  </div>
                  {viewStudent.cvDetails.education.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 border-b pb-2 mb-2">Education</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                            <th className="text-left p-2">School</th>
                            <th className="text-left p-2">Board</th>
                            <th className="text-left p-2">Year</th>
                            <th className="text-left p-2">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewStudent.cvDetails.education.map((edu, i) => (
                            <tr key={i} className="border-t"><td className="p-2">{edu.school}</td><td className="p-2">{edu.board}</td><td className="p-2">{edu.year}</td><td className="p-2">{edu.percentage}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="mb-3"><h4 className="font-semibold text-gray-800 border-b pb-1 mb-1">Achievements</h4><p className="text-gray-700 text-sm whitespace-pre-line">{viewStudent.cvDetails.achievements}</p></div>
                  <div className="mb-3"><h4 className="font-semibold text-gray-800 border-b pb-1 mb-1">Skills</h4><p className="text-gray-700 text-sm">{viewStudent.cvDetails.skills}</p></div>
                  <div className="mb-3"><h4 className="font-semibold text-gray-800 border-b pb-1 mb-1">Hobbies</h4><p className="text-gray-700 text-sm">{viewStudent.cvDetails.hobbies}</p></div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">CV Not Available</p>
                  <p className="text-sm">This student has not built a CV yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
