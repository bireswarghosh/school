"use client"

import { useState, useMemo } from "react"
import { Search, Save, Trash2, X } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useCurrency } from "@/lib/currency-context"

type StudentRecord = {
  id?: number
  name: string
  admissionNo: string
  className: string
  section: string
  totalFees: number
  paidAmount: number
  balance: number
}

const ModalOverlay = ({ onClose }: { onClose: () => void }) => (
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
)

export default function FeesCarryForwardPage() {
  const { symbol } = useCurrency()
  const { classNames: classOptions, sectionNames: sectionOptions } = useClassesAndSections()
  const { data: allStudents } = useApi<StudentRecord>("/api/fees/fees-payment")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [searched, setSearched] = useState(false)
  const [carryForward, setCarryForward] = useState<Set<string>>(new Set())
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const results = useMemo(() => {
    if (!searched || !allStudents) return []
    return allStudents.filter((s) => {
      if (selectedClass && s.className !== selectedClass) return false
      if (selectedSection && s.section !== selectedSection) return false
      return true
    })
  }, [searched, selectedClass, selectedSection])

  const initCarryForward = (students: StudentRecord[]) => {
    const initial = new Set<string>()
    students.forEach((s) => {
      if (s.balance > 0) initial.add(s.admissionNo)
    })
    setCarryForward(initial)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
    const filtered = (allStudents || []).filter((s) => {
      if (selectedClass && s.className !== selectedClass) return false
      if (selectedSection && s.section !== selectedSection) return false
      return true
    })
    initCarryForward(filtered)
  }

  const toggleCarryForward = (admissionNo: string, balance: number) => {
    if (balance <= 0) return
    setCarryForward((prev) => {
      const next = new Set(prev)
      if (next.has(admissionNo)) next.delete(admissionNo)
      else next.add(admissionNo)
      return next
    })
  }

  const handleSave = () => {
    const count = carryForward.size
    setSuccessMessage(`${count} student${count !== 1 ? "s" : ""} carry forward saved successfully!`)
    setShowSuccessAlert(true)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    setCarryForward(new Set())
    setShowDeleteConfirm(false)
    setSuccessMessage("All carry forward entries deleted.")
    setShowSuccessAlert(true)
  }

  const Modal = ({
    title, show, onClose, children, footer,
  }: {
    title: string; show: boolean; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode
  }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <ModalOverlay onClose={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer && (
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fees Carry Forward</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fees Collection / Fees Carry Forward</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-2.5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-[var(--primary)]" />
            Select Criteria
          </h3>
        </div>
        <form onSubmit={handleSearch} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                <option value="">Select</option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                <option value="">Select</option>
                {sectionOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="h-9 px-4 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200">
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
              <button type="button" onClick={() => { setSelectedClass(""); setSelectedSection(""); setSearched(false) }} className="h-9 px-3 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Table */}
      {searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Fee Carry Forward</h3>
            <span className="text-xs text-gray-400">{results.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Student Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Admission No</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Class</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Section</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Total Fees</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Paid Amount</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Balance</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Carry Forward?</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-gray-300" />
                        <span className="text-sm">No students found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  results.map((s, idx) => {
                    const isFullyPaid = s.balance <= 0
                    const isChecked = carryForward.has(s.admissionNo)
                    return (
                      <tr key={s.admissionNo} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                        <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{s.admissionNo}</td>
                        <td className="px-4 py-2.5 text-gray-600">{s.className}</td>
                        <td className="px-4 py-2.5 text-gray-600">{s.section}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-800">{symbol}{s.totalFees.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{symbol}{s.paidAmount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`font-medium ${isFullyPaid ? "text-green-600" : "text-red-600"}`}>
                            {symbol}{s.balance.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isFullyPaid}
                            onChange={() => toggleCarryForward(s.admissionNo, s.balance)}
                            className={`rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] ${isFullyPaid ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500">{carryForward.size} student{carryForward.size !== 1 ? "s" : ""} selected for carry forward</span>
            <div className="flex items-center gap-2">
              <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">
                <Save className="h-3.5 w-3.5" />
                Save Carry Forward
              </button>
              <button onClick={handleDelete} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200">
                <Trash2 className="h-3.5 w-3.5" />
                Delete Carry Forward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert Modal */}
      <Modal
        title="Success"
        show={showSuccessAlert}
        onClose={() => setShowSuccessAlert(false)}
        footer={
          <button onClick={() => setShowSuccessAlert(false)} className="px-4 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">OK</button>
        }
      >
        <div className="text-center py-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <Save className="h-7 w-7 text-green-500" />
          </div>
          <p className="text-sm font-medium text-gray-800">{successMessage}</p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        footer={
          <>
            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={confirmDelete} className="px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200">Delete</button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete all carry forward entries?</p>
          <p className="text-xs text-gray-400">This action cannot be undone.</p>
        </div>
      </Modal>
    </div>
  )
}
