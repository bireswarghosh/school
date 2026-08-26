"use client"

import { useState } from "react"
import { Search, Printer, Trash2, Save, Settings } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type Student = {
  id: number
  admissionNo: string
  name: string
  classVal: string
  section: string
}

type GeneratedCard = {
  id: number
  studentName: string
  classVal: string
  generatedDate: string
}

const students: Student[] = []

export default function GenerateIdCardPage() {
  const { classNames, sectionNames } = useClassesAndSections()
  const classOptions = ["Select", ...classNames]
  const sectionOptions = ["Select", ...sectionNames]
  const [selectedClass, setSelectedClass] = useState("Select")
  const [selectedSection, setSelectedSection] = useState("Select")
  const [checkedStudents, setCheckedStudents] = useState<number[]>([])
  const { data: generatedCards, add, remove } = useApi<GeneratedCard>("/api/certificate/student-id-card")
  const [bgColor, setBgColor] = useState("#ffffff")
  const [schoolName, setSchoolName] = useState("Sunrise Public School")
  const [headerColor, setHeaderColor] = useState("var(--primary)")

  const filteredStudents = students.filter((s) => {
    if (selectedClass !== "Select" && s.classVal !== selectedClass) return false
    if (selectedSection !== "Select" && s.section !== selectedSection) return false
    return true
  })

  const toggleCheck = (id: number) => {
    setCheckedStudents((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const handleGenerate = async () => {
    const selectedNames = checkedStudents.map((id) => students.find((s) => s.id === id))
    for (const s of selectedNames) {
      await add({
        studentName: s?.name || "",
        classVal: s?.classVal || "",
        generatedDate: new Date().toLocaleDateString("en-US"),
      })
    }
    setCheckedStudents([])
  }

  const handleDelete = async (id: number) => {
    await remove(id)
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Generate ID Card</h1>
        <p className="mt-1 text-sm text-white/80">Certificate / Generate ID Card</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm p-5">
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

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-1.5"><Settings className="h-4 w-4" />ID Card Settings</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
              <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">School Name</label>
              <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Header Color</label>
              <input type="text" value={headerColor} onChange={(e) => setHeaderColor(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Student List</h2>
          {checkedStudents.length > 0 && (
            <button onClick={handleGenerate} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Generate
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
                    <input type="checkbox" checked={checkedStudents.includes(s.id)} onChange={() => toggleCheck(s.id)} className="accent-[var(--primary)]" />
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No students found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Generated ID Cards</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Student Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Generated Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Action</th>
              </tr>
            </thead>
            <tbody>
              {generatedCards.map((c, idx) => (
                <tr key={c.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-gray-50 border-b border-gray-100`}>
                  <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700">{c.studentName}</td>
                  <td className="px-4 py-3 text-gray-700">{c.classVal}</td>
                  <td className="px-4 py-3 text-gray-700">{c.generatedDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Print"><Printer className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {generatedCards.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No cards generated yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
