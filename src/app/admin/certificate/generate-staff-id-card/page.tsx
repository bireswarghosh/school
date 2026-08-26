"use client"

import { useState } from "react"
import { Search, Printer, Trash2 } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Staff = {
  id: number
  staffId: string
  name: string
  department: string
  designation: string
}

type GeneratedCard = {
  id: number
  staffName: string
  department: string
  generatedDate: string
}

const departmentOptions = ["Select", "Teaching", "Administration", "Accounts", "Library", "Sports"]

const staffMembers: Staff[] = []

export default function GenerateStaffIdCardPage() {
  const [selectedDepartment, setSelectedDepartment] = useState("Select")
  const [checkedStaff, setCheckedStaff] = useState<number[]>([])
  const { data: generatedCards, add, remove } = useApi<GeneratedCard>("/api/certificate/staff-id-card")

  const filteredStaff = staffMembers.filter((s) => {
    if (selectedDepartment !== "Select" && s.department !== selectedDepartment) return false
    return true
  })

  const toggleCheck = (id: number) => {
    setCheckedStaff((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const handleGenerate = async () => {
    const selectedNames = checkedStaff.map((id) => staffMembers.find((s) => s.id === id))
    for (const s of selectedNames) {
      await add({
        staffName: s?.name || "",
        department: s?.department || "",
        generatedDate: new Date().toLocaleDateString("en-US"),
      })
    }
    setCheckedStaff([])
  }

  const handleDelete = async (id: number) => {
    await remove(id)
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Generate Staff ID Card</h1>
        <p className="mt-1 text-sm text-white/80">Certificate / Generate Staff ID Card</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Search Criteria</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              {departmentOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
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
          <h2 className="text-sm font-semibold text-gray-800">Staff List</h2>
          {checkedStaff.length > 0 && (
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Staff ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Department</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Designation</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Select</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s, idx) => (
                <tr key={s.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-gray-50 border-b border-gray-100`}>
                  <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700">{s.staffId}</td>
                  <td className="px-4 py-3 text-gray-700">{s.name}</td>
                  <td className="px-4 py-3 text-gray-700">{s.department}</td>
                  <td className="px-4 py-3 text-gray-700">{s.designation}</td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={checkedStaff.includes(s.id)} onChange={() => toggleCheck(s.id)} className="accent-[var(--primary)]" />
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No staff found</td>
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Staff Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Department</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Generated Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Action</th>
              </tr>
            </thead>
            <tbody>
              {generatedCards.map((c, idx) => (
                <tr key={c.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-gray-50 border-b border-gray-100`}>
                  <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700">{c.staffName}</td>
                  <td className="px-4 py-3 text-gray-700">{c.department}</td>
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
