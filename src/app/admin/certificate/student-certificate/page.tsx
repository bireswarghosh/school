"use client"

import { useState } from "react"
import { Search, Eye, Printer, Trash2, X, Save } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type Student = {
  id: number
  admissionNo: string
  name: string
  classVal: string
  section: string
}

type Certificate = {
  id: number
  studentName: string
  certificateType: string
  date: string
}

const certificateTypeOptions = ["Select", "Character", "Bonafide", "Transfer", "Sports"]

const students: Student[] = []

export default function StudentCertificatePage() {
  const { classNames } = useClassesAndSections()
  const classOptions = ["Select", ...classNames]
  const [selectedClass, setSelectedClass] = useState("Select")
  const [selectedType, setSelectedType] = useState("Select")
  const [checkedStudents, setCheckedStudents] = useState<number[]>([])
  const { data: certificates, add, remove } = useApi<Certificate>("/api/certificate/student")
  const [showModal, setShowModal] = useState(false)
  const [certDate, setCertDate] = useState("")

  const filteredStudents = students.filter((s) => {
    if (selectedClass !== "Select" && s.classVal !== selectedClass) return false
    return true
  })

  const toggleCheck = (id: number) => {
    setCheckedStudents((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const handleGenerate = () => {
    setShowModal(true)
  }

  const handleSubmit = async () => {
    const selectedNames = checkedStudents.map((id) => students.find((s) => s.id === id)?.name || "")
    for (const name of selectedNames) {
      await add({
        studentName: name,
        certificateType: selectedType !== "Select" ? selectedType : "Character",
        date: certDate,
      })
    }
    setShowModal(false)
    setCheckedStudents([])
    setCertDate("")
  }

  const handleDelete = async (id: number) => {
    await remove(id)
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Student Certificate</h1>
        <p className="mt-1 text-sm text-white/80">Certificate / Student Certificate</p>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Type</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              {certificateTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
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
            <button onClick={handleGenerate} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Generate Certificate
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
          <h2 className="text-sm font-semibold text-gray-800">Generated Certificates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Certificate Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Action</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((c, idx) => (
                <tr key={c.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-gray-50 border-b border-gray-100`}>
                  <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700">{c.studentName}</td>
                  <td className="px-4 py-3 text-gray-700">{c.certificateType}</td>
                  <td className="px-4 py-3 text-gray-700">{c.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye className="h-4 w-4" /></button>
                      <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Print"><Printer className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {certificates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No certificates generated yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Generate Certificate</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Type</label>
                <p className="text-sm text-gray-800 font-medium">{selectedType !== "Select" ? selectedType : "Character"}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input type="text" value={certDate} onChange={(e) => setCertDate(e.target.value)} placeholder="MM/DD/YYYY" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Selected Students</label>
                <div className="text-sm text-gray-700">{checkedStudents.map((id) => students.find((s) => s.id === id)?.name).join(", ")}</div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-1.5"><Save className="h-4 w-4" />Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
