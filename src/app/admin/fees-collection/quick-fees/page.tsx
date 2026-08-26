"use client"

import { useState } from "react"
import { Search, Save, Eye, X, Trash2, AlertTriangle, Printer } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useCurrency } from "@/lib/currency-context"

type Student = {
  id: number
  name: string
  admissionNo: string
  class: string
  section: string
  hasFees: boolean
}

type Installment = {
  id: number
  dueDate: string
  amount: number
  status: string
}

type FeeMasterRecord = {
  id: number
  feeGroup: string
  feeType: string
  amount: number
  dueDate: string
}

const dayOptions = ["None", ...Array.from({ length: 31 }, (_, i) => String(i + 1))]
const fineTypeOptions = [
  { value: "none", label: "None" },
  { value: "fix", label: "Fix Amount" },
  { value: "percentage", label: "Percentage" },
]

const ModalOverlay = ({ onClose }: { onClose: () => void }) => (
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
)

export default function QuickFeesPage() {
  const { symbol } = useCurrency()
  const { classNames, sectionNames, classes, sectionsOf } = useClassesAndSections()
  const classOptions = ["Select", ...classNames]
  const sectionOptions = ["Select", ...sectionNames]
  const { data: allStudents } = useApi<Student>("/api/fees/fees-payment")
  const { data: assignedFeesData } = useApi<FeeMasterRecord>("/api/fees/fees-master")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [showResults, setShowResults] = useState(false)

  const selectedClassItem = classes.find((c) => c.name === selectedClass)
  const availableSections = selectedClassItem
    ? ["Select", ...sectionsOf(selectedClassItem.id).map((s) => s.name)]
    : sectionOptions

  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    setSelectedSection("")
  }

  const [totalFees, setTotalFees] = useState("")
  const [downPayment, setDownPayment] = useState("")
  const [balanceFees, setBalanceFees] = useState("")
  const [noOfInstallment, setNoOfInstallment] = useState("")
  const [day, setDay] = useState("none")
  const [fineType, setFineType] = useState("none")
  const [fineTypeValue, setFineTypeValue] = useState("")

  const [showInstallmentForm, setShowInstallmentForm] = useState(false)
  const [showAssignFees, setShowAssignFees] = useState(false)
  const [showUnassign, setShowUnassign] = useState(false)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [assignedFees, setAssignedFees] = useState<FeeMasterRecord[]>([])
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")

  const resetForm = () => {
    setSelectedStudentId("")
    setTotalFees("")
    setDownPayment("")
    setBalanceFees("")
    setNoOfInstallment("")
    setDay("none")
    setFineType("none")
    setFineTypeValue("")
    setShowInstallmentForm(false)
    setShowAssignFees(false)
    setShowUnassign(false)
    setInstallments([])
    setAssignedFees([])
    setSuccessMsg("")
  }

  const handleSearch = () => {
    const filtered = (allStudents || []).filter(
      (s) => s.class === selectedClass && s.section === selectedSection
    )
    setStudents(filtered)
    setShowResults(true)
    resetForm()
  }

  const handleStudentSelect = (id: number) => {
    setSelectedStudentId(String(id))
    setTotalFees("")
    setDownPayment("")
    setBalanceFees("")
    setNoOfInstallment("")
    setDay("none")
    setFineType("none")
    setFineTypeValue("")
    setInstallments([])
    setShowAssignFees(false)
    setSuccessMsg("")
    const student = (allStudents || []).find((s) => s.id === id)
    if (student?.hasFees) {
      setShowInstallmentForm(false)
      setShowUnassign(true)
      setAssignedFees(assignedFeesData || [])
    } else {
      setShowInstallmentForm(true)
      setShowUnassign(false)
      setAssignedFees([])
    }
  }

  const updateBalance = (total: string, down: string) => {
    const t = Number(total) || 0
    const d = Number(down) || 0
    const bal = Math.max(0, t - d)
    setBalanceFees(String(bal))
  }

  const handleCreateInstallment = () => {
    if (!totalFees || !noOfInstallment) return
    const bal = Number(balanceFees)
    const numInst = Number(noOfInstallment)
    const perInst = Math.round(bal / numInst)
    const inst: Installment[] = []
    for (let i = 1; i <= numInst; i++) {
      const d = new Date()
      d.setMonth(d.getMonth() + i)
      inst.push({
        id: i,
        dueDate: d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
        amount: i === numInst ? bal - perInst * (numInst - 1) : perInst,
        status: "Pending",
      })
    }
    setInstallments(inst)
    setShowAssignFees(true)
  }

  const handleSave = () => {
    setSuccessMsg("Quick fees assigned successfully!")
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  const handleUnassign = () => {
    setShowUnassignConfirm(false)
    setShowUnassign(false)
    setAssignedFees([])
    setSuccessMsg("Fees unassigned successfully!")
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  const selectedStudent = (allStudents || []).find((s) => s.id === Number(selectedStudentId))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quick Fees</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fees Collection / Quick Fees</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          {successMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-t-xl px-5 py-3">
          <h3 className="text-sm font-semibold text-white">Select Student</h3>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select value={selectedClass} onChange={(e) => handleClassChange(e.target.value)} className="w-40 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
                {classOptions.map((o) => <option key={o} value={o === "Select" ? "" : o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-40 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
                {availableSections.map((o) => <option key={o} value={o === "Select" ? "" : o}>{o}</option>)}
              </select>
            </div>
            <button onClick={handleSearch} className="h-9 inline-flex items-center gap-1.5 px-4 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </div>

      {showResults && students.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3">
              <h3 className="text-sm font-semibold text-white">Student List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100/80">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Admission No</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Section</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Fees Status</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s, i) => (
                    <tr key={s.id} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} ${selectedStudentId === String(s.id) ? "bg-[var(--primary-light)]" : ""} cursor-pointer hover:bg-[var(--primary-light)] transition-colors`} onClick={() => handleStudentSelect(s.id)}>
                      <td className="px-4 py-2.5 text-gray-800 font-medium">{s.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{s.admissionNo}</td>
                      <td className="px-4 py-2.5 text-gray-600">{s.class}</td>
                      <td className="px-4 py-2.5 text-gray-600">{s.section}</td>
                      <td className="px-4 py-2.5">
                        {s.hasFees ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Assigned</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No Fees</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={(e) => { e.stopPropagation(); handleStudentSelect(s.id) }} className="text-[var(--primary)] hover:text-[var(--secondary)] text-xs font-medium">
                          {selectedStudentId === String(s.id) ? "Selected" : "Select"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedStudentId && selectedStudent && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-t-xl px-5 py-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  {selectedStudent.name} ({selectedStudent.admissionNo})
                </h3>
                <button onClick={() => setSelectedStudentId("")} className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {showUnassign && (
                <div className="p-5">
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100/80">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Fees Group</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Fees Type</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {assignedFees.map((f, i) => (
                          <tr key={f.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                            <td className="px-4 py-2.5 text-gray-800">{f.feeGroup}</td>
                            <td className="px-4 py-2.5 text-gray-800">{f.feeType}</td>
                            <td className="px-4 py-2.5 text-gray-800">{symbol}{f.amount.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-gray-500">{f.dueDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => setShowUnassignConfirm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" /> Unassign Fees
                  </button>
                </div>
              )}

              {showInstallmentForm && (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Total Fees <span className="text-red-400">*</span></label>
                      <input type="text" value={totalFees} onChange={(e) => { setTotalFees(e.target.value); updateBalance(e.target.value, downPayment) }} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" placeholder="Total fees" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">1st Installment</label>
                      <input type="text" value={downPayment} onChange={(e) => { setDownPayment(e.target.value); updateBalance(totalFees, e.target.value) }} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" placeholder="Down payment" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Balance Fees <span className="text-red-400">*</span></label>
                      <input type="text" value={balanceFees} readOnly className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500" placeholder="Auto-calculated" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">No. Of Installment <span className="text-red-400">*</span></label>
                      <input type="text" value={noOfInstallment} onChange={(e) => setNoOfInstallment(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" placeholder="Number" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Day for Due date</label>
                      <select value={day} onChange={(e) => setDay(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
                        {dayOptions.map((o) => <option key={o} value={o === "None" ? "none" : o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fine Type</label>
                      <select value={fineType} onChange={(e) => setFineType(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] bg-white">
                        {fineTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    {fineType !== "none" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Fine Type Value <span className="text-red-400">*</span></label>
                        <input type="text" value={fineTypeValue} onChange={(e) => setFineTypeValue(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)]" placeholder={fineType === "fix" ? "Amount" : "Percentage %"} />
                      </div>
                    )}
                  </div>

                  <button onClick={handleCreateInstallment} disabled={!totalFees || !noOfInstallment} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <Eye className="h-4 w-4" /> View Installment
                  </button>

                  {installments.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100/80">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {installments.map((inst, i) => (
                            <tr key={inst.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                              <td className="px-4 py-2.5 text-gray-800">{inst.id}</td>
                              <td className="px-4 py-2.5 text-gray-800">{inst.dueDate}</td>
                              <td className="px-4 py-2.5 text-gray-800">{symbol}{inst.amount.toLocaleString()}</td>
                              <td className="px-4 py-2.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{inst.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {showAssignFees && (
                <div className="px-5 pb-5">
                  <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
                    <Save className="h-4 w-4" /> Save
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Unassign Confirm Modal */}
      {showUnassignConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <ModalOverlay onClose={() => setShowUnassignConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10 p-5 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Unassign Fees</h3>
            <p className="text-sm text-gray-500 mb-5">Are you sure you want to unassign fees? This action is irreversible!</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowUnassignConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleUnassign} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                <Trash2 className="h-4 w-4 inline mr-1" /> Unassign Fees
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
