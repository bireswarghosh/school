"use client"

import { useState } from "react"
import { Search, CreditCard, X, Camera } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type Student = {
  id: number
  admissionNo: string
  name: string
  classVal: string
  section: string
}

const students: Student[] = []

export default function StudentIdCardPage() {
  const { classNames, sectionNames } = useClassesAndSections()
  const classOptions = ["Select", ...classNames]
  const sectionOptions = ["Select", ...sectionNames]
  const { data: items } = useApi<Student>("/api/certificate/student-id-card")
  const [selectedClass, setSelectedClass] = useState("Select")
  const [selectedSection, setSelectedSection] = useState("Select")
  const [checkedStudents, setCheckedStudents] = useState<number[]>([])
  const [previewId, setPreviewId] = useState<Student | null>(null)

  const filteredStudents = (items || []).filter((s) => {
    if (selectedClass !== "Select" && s.classVal !== selectedClass) return false
    if (selectedSection !== "Select" && s.section !== selectedSection) return false
    return true
  })

  const toggleCheck = (id: number) => {
    setCheckedStudents((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const handlePreview = (s: Student) => {
    setPreviewId(s)
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Student ID Card</h1>
        <p className="mt-1 text-sm text-white/80">Certificate / Student ID Card</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Search Criteria</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              {classOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              {sectionOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5">
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Student List</h2>
          {checkedStudents.length > 0 && (
            <button className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" />
              Generate ID Card
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Admission No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Section</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Photo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Select</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, idx) => (
                <tr key={s.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-gray-50 border-b border-gray-100`}>
                  <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700">{s.admissionNo}</td>
                  <td className="px-4 py-3 text-gray-700">{s.name}</td>
                  <td className="px-4 py-3 text-gray-700">{s.classVal}</td>
                  <td className="px-4 py-3 text-gray-700">{s.section}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handlePreview(s)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="View Photo">
                      <Camera className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={checkedStudents.includes(s.id)} onChange={() => toggleCheck(s.id)} className="accent-[var(--primary)]" />
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No students found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">ID Card Preview</h3>
              <button onClick={() => setPreviewId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="border border-gray-300 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-4 py-3 text-center">
                <h4 className="text-white font-bold text-sm">Sunrise Public School</h4>
                <p className="text-white/70 text-xs">Student ID Card</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-800">{previewId.name}</p>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between"><span className="font-medium">Class:</span><span>{previewId.classVal}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Admission No:</span><span>{previewId.admissionNo}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Section:</span><span>{previewId.section}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Valid Till:</span><span>03/31/2027</span></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setPreviewId(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
