"use client"

import { useState, useMemo } from "react"
import { Search, X, CreditCard } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useCurrency } from "@/lib/currency-context"

type FeesGroup = {
  id: number
  name: string
  description: string
}

type StudentDue = {
  id?: number
  name: string
  className: string
  admissionNo: string
  totalFees: number
  paidAmount: number
  dueAmount: number
}

const ModalOverlay = ({ onClose }: { onClose: () => void }) => (
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
)

export default function SearchDueFeesPage() {
  const { symbol } = useCurrency()
  const { classNames: classOptions, sectionNames: sectionOptions, classes, sectionsOf } = useClassesAndSections()
  const { data: allStudents } = useApi<StudentDue>("/api/fees/fees-payment")
  const { data: feesGroups } = useApi<FeesGroup>("/api/fees/fees-group")
  const [selectedGroups, setSelectedGroups] = useState<number[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [searched, setSearched] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payStudent, setPayStudent] = useState<StudentDue | null>(null)

  const selectedClassItem = classes.find((c) => c.name === selectedClass)
  const availableSections = selectedClassItem
    ? sectionsOf(selectedClassItem.id).map((s) => s.name)
    : sectionOptions

  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    setSelectedSection("")
  }

  const toggleGroup = (id: number) => {
    if (id === 0) {
      if (selectedGroups.length === feesGroups.length) {
        setSelectedGroups([])
      } else {
        setSelectedGroups(feesGroups.map((g) => g.id))
      }
    } else {
      setSelectedGroups((prev) =>
        prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
      )
    }
  }

  const results = useMemo(() => {
    if (!searched || !allStudents) return []
    return allStudents.filter((s) => {
      if (selectedClass && !s.className.startsWith(selectedClass)) return false
      if (selectedSection && !s.className.endsWith(selectedSection)) return false
      return selectedGroups.length === 0 || true
    })
  }, [searched, selectedClass, selectedSection, selectedGroups, allStudents])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
  }

  const openPayModal = (student: StudentDue) => {
    setPayStudent(student)
    setShowPayModal(true)
  }

  const pctPaid = (paid: number, total: number) => Math.round((paid / total) * 100)

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
          <h2 className="text-xl font-bold text-gray-900">Search Due Fees</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fees Collection / Search Due Fees</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Fees Group</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2.5 bg-gray-50/50">
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-[var(--primary)]">
                  <input
                    type="checkbox"
                    checked={feesGroups.length > 0 && selectedGroups.length === feesGroups.length}
                    onChange={() => toggleGroup(0)}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="font-medium">Select All</span>
                </label>
                {feesGroups.map((g) => (
                  <label key={g.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-[var(--primary)]">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span>{g.name}</span>
                  </label>
                ))}
                {feesGroups.length === 0 && (
                  <p className="text-xs text-gray-400">No fees groups found.</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
              <select value={selectedClass} onChange={(e) => handleClassChange(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
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
                {availableSections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end gap-2 mt-4">
            <button type="submit" className="h-9 px-4 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200">
              <Search className="h-3.5 w-3.5" />
              Search
            </button>
            <button type="button" onClick={() => { setSelectedClass(""); setSelectedSection(""); setSelectedGroups([]); setSearched(false) }} className="h-9 px-3 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Results Table */}
      {searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Due Fees List</h3>
            <span className="text-xs text-gray-400">{results.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Student Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Class</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Admission No</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Total Fees</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Paid Amount</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Due Amount</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">% Paid</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-[11px] uppercase tracking-wider">Action</th>
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
                    const pct = pctPaid(s.paidAmount, s.totalFees)
                    const isPaid = pct >= 100
                    return (
                      <tr key={s.admissionNo} className={`border-b border-gray-50 hover:bg-[var(--primary-light)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                        <td className="px-4 py-2.5 text-gray-600">{s.className}</td>
                        <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{s.admissionNo}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-800">${symbol}${s.totalFees.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">${symbol}${s.paidAmount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-800">${symbol}${s.dueAmount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-center">
                          {isPaid ? (
                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border bg-green-50 text-green-700 border-green-200">
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border bg-red-50 text-red-700 border-red-200">
                              {pct}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {isPaid ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-lg">Paid</span>
                          ) : (
                            <button onClick={() => openPayModal(s)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">
                              <CreditCard className="h-3 w-3" />
                              Pay Now
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
            <span>Showing {results.length} of {results.length} records</span>
            <span className="text-gray-300">Page 1 of 1</span>
          </div>
        </div>
      )}

      {/* Pay Now Modal */}
      <Modal
        title="Collect Fees"
        show={showPayModal}
        onClose={() => setShowPayModal(false)}
        footer={
          <>
            <button onClick={() => setShowPayModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={() => setShowPayModal(false)} className="px-5 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm shadow-indigo-200">Pay</button>
          </>
        }
      >
        {payStudent && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: "Student Name", value: payStudent.name },
                { label: "Class", value: payStudent.className },
                { label: "Admission No", value: payStudent.admissionNo },
                { label: "Total Fees", value: `${symbol}${payStudent.totalFees.toLocaleString()}` },
                { label: "Paid Amount", value: `${symbol}${payStudent.paidAmount.toLocaleString()}` },
                { label: "Due Amount", value: `${symbol}${payStudent.dueAmount.toLocaleString()}` },
              ].map((item) => (
                <div key={item.label} className="border-b border-gray-50 pb-2">
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{item.label}</span>
                  <p className="text-sm text-gray-800 mt-0.5 font-medium">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount to Pay</label>
                  <input type="number" defaultValue={payStudent.dueAmount} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Mode</label>
                  <select className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                    <option value="">Select</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
