"use client"

import { useState } from "react"
import { GitBranch, Plus, Pencil, Trash2, X, Check, School, Users, Wallet, RefreshCw, GraduationCap } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

interface Branch {
  id: number
  name: string
  hostname: string
  databaseName: string
  username: string
  isDefault: boolean
  status: string
  currentSession: string
  fees: { totalStudents: number; totalFees: number; totalPaid: number; totalBalance: number }
  transportFees: { totalFees: number; totalPaid: number; totalBalance: number }
  studentAdmission: { offline: number; online: number }
  library: { totalBooks: number; members: number; bookIssued: number }
  alumniStudents: number
  staffPayroll: { totalStaff: number; payrollGenerated: number; payrollNotGenerated: number; payrollPaid: number; netAmount: number; paidAmount: number }
  staffAttendance: { totalStaff: number; present: number; absent: number }
  userLog: number
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-2xl mx-4">
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sublabel, color }: { icon: React.ElementType; label: string; value: string; sublabel?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
        {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
      </div>
    </div>
  )
}

function TableSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200 text-left">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="overflow-x-auto">{children}</div>}
    </div>
  )
}

export default function MultiBranchOverviewPage() {
  const { symbol } = useCurrency()
  const { data: branches, add, update, remove, loading } = useApi<Branch>("/api/multi-branch")
  const [activeBranch, setActiveBranch] = useState<number>(1)
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [switchBranchId, setSwitchBranchId] = useState<number>(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ purchaseCode: "", hostname: "", databaseName: "", username: "", password: "", isDefault: false })
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" })

  const activeBranchData = branches.find((b) => b.id === activeBranch)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000)
  }

  const handleSwitchBranch = () => {
    setActiveBranch(switchBranchId)
    setShowSwitchModal(false)
    showToast(`Switched to ${branches.find((b) => b.id === switchBranchId)?.name}`)
  }

  const handleAddBranch = async () => {
    const newBranch = {
      name: formData.hostname.split(".")[0].charAt(0).toUpperCase() + formData.hostname.split(".")[0].slice(1) + " Campus",
      hostname: formData.hostname,
      databaseName: formData.databaseName,
      username: formData.username,
      isDefault: formData.isDefault,
      status: "Active",
      currentSession: "2025-26",
      fees: { totalStudents: 0, totalFees: 0, totalPaid: 0, totalBalance: 0 },
      transportFees: { totalFees: 0, totalPaid: 0, totalBalance: 0 },
      studentAdmission: { offline: 0, online: 0 },
      library: { totalBooks: 0, members: 0, bookIssued: 0 },
      alumniStudents: 0,
      staffPayroll: { totalStaff: 0, payrollGenerated: 0, payrollNotGenerated: 0, payrollPaid: 0, netAmount: 0, paidAmount: 0 },
      staffAttendance: { totalStaff: 0, present: 0, absent: 0 },
      userLog: 0,
    }
    await add(newBranch)
    setShowAddModal(false)
    setFormData({ purchaseCode: "", hostname: "", databaseName: "", username: "", password: "", isDefault: false })
    showToast("Branch added successfully!")
  }

  const handleEditBranch = async () => {
    if (!editingBranch) return
    await update(editingBranch.id, editingBranch)
    setShowEditModal(false)
    setEditingBranch(null)
    showToast("Branch updated successfully!")
  }

  const handleDeleteBranch = async (id: number) => {
    await remove(id)
    setDeleteConfirmId(null)
    showToast("Branch deleted successfully!")
  }

  const totalAllStudents = branches.reduce((s, b) => s + b.fees.totalStudents, 0)
  const totalAllFees = branches.reduce((s, b) => s + b.fees.totalFees, 0)
  const totalAllPaid = branches.reduce((s, b) => s + b.fees.totalPaid, 0)
  const totalAllBalance = branches.reduce((s, b) => s + b.fees.totalBalance, 0)

  return (
    <div className="space-y-6">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-[100] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-in ${
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          <Check className="h-4 w-4" />
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Multi Branch Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Multi Branch / Overview</p>
        </div>
        <div className="flex items-center gap-3">
          {activeBranchData && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary-light)] border border-indigo-200 rounded-lg">
              <GitBranch className="h-4 w-4 text-[var(--primary)]" />
              <span className="text-sm font-medium text-[var(--primary)]">{activeBranchData.name}</span>
            </div>
          )}
          <button onClick={() => { setSwitchBranchId(activeBranch); setShowSwitchModal(true) }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <RefreshCw className="h-4 w-4" /> Switch Branch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={School} label="Total Students" value={totalAllStudents.toLocaleString()} sublabel="Across all branches" color="bg-blue-600" />
        <StatCard icon={Wallet} label="Total Fees" value={`${symbol}${totalAllFees.toLocaleString()}`} sublabel={`Paid: ${symbol}${totalAllPaid.toLocaleString()}`} color="bg-emerald-600" />
        <StatCard icon={Users} label="Total Branches" value={branches.length.toString()} sublabel={`${branches.filter((b) => b.status === "Active").length} Active`} color="bg-purple-600" />
        <StatCard icon={GraduationCap} label="Alumni Students" value={branches.reduce((s, b) => s + b.alumniStudents, 0).toLocaleString()} color="bg-amber-600" />
      </div>

      <TableSection title="Fees Details">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Branch", "Current Session", "Total Students", `Total Fees (${symbol})`, `Total Paid Fees (${symbol})`, `Total Balance Fees (${symbol})`].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, idx) => (
              <tr key={b.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                <td className="px-4 py-2.5 font-medium text-gray-800">{b.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.currentSession}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.fees.totalStudents}</td>
                <td className="px-4 py-2.5 text-gray-600">{symbol}{b.fees.totalFees.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-green-600 font-medium">{symbol}{b.fees.totalPaid.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-red-600 font-medium">{symbol}{b.fees.totalBalance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableSection>

      <TableSection title="Transportation Fees Details">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Branch", "Current Session", `Total Fees (${symbol})`, `Total Paid Fees (${symbol})`, `Total Balance Fees (${symbol})`].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, idx) => (
              <tr key={b.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                <td className="px-4 py-2.5 font-medium text-gray-800">{b.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.currentSession}</td>
                <td className="px-4 py-2.5 text-gray-600">{symbol}{b.transportFees.totalFees.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-green-600 font-medium">{symbol}{b.transportFees.totalPaid.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-red-600 font-medium">{symbol}{b.transportFees.totalBalance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableSection>

      <TableSection title="Student Admission">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Branch", "Current Session", "Offline Admission", "Online Admission"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, idx) => (
              <tr key={b.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                <td className="px-4 py-2.5 font-medium text-gray-800">{b.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.currentSession}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.studentAdmission.offline}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.studentAdmission.online}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableSection>

      <TableSection title="Library Details">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Branch", "Total Books", "Members", "Book Issued"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, idx) => (
              <tr key={b.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                <td className="px-4 py-2.5 font-medium text-gray-800">{b.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.library.totalBooks.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.library.members}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.library.bookIssued}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableSection>

      <TableSection title="Alumni Students">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Branch", "Alumni Students"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, idx) => (
              <tr key={b.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                <td className="px-4 py-2.5 font-medium text-gray-800">{b.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.alumniStudents.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableSection>

      <TableSection title="Staff Payroll of the Previous Month">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Branch", "Total Staff", "Payroll Generated", "Payroll Not Generated", "Payroll Paid", `Net Amount (${symbol})`, `Paid Amount (${symbol})`].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, idx) => (
              <tr key={b.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                <td className="px-4 py-2.5 font-medium text-gray-800">{b.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.staffPayroll.totalStaff}</td>
                <td className="px-4 py-2.5 text-green-600">{b.staffPayroll.payrollGenerated}</td>
                <td className="px-4 py-2.5 text-red-600">{b.staffPayroll.payrollNotGenerated}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.staffPayroll.payrollPaid}</td>
                <td className="px-4 py-2.5 text-gray-600">{symbol}{b.staffPayroll.netAmount.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-green-600 font-medium">{symbol}{b.staffPayroll.paidAmount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableSection>

      <TableSection title="Staff Attendance Details at Current Date">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Branch", "Total Staff", "Present", "Absent"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, idx) => (
              <tr key={b.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                <td className="px-4 py-2.5 font-medium text-gray-800">{b.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.staffAttendance.totalStaff}</td>
                <td className="px-4 py-2.5 text-green-600 font-medium">{b.staffAttendance.present}</td>
                <td className="px-4 py-2.5 text-red-600 font-medium">{b.staffAttendance.absent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableSection>

      <TableSection title="User Log Details">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Branch", "Total User Log"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((b, idx) => (
              <tr key={b.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                <td className="px-4 py-2.5 font-medium text-gray-800">{b.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.userLog}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableSection>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Multi Branch List</h3>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> Add New
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "Branch Name", "Hostname", "Database", "Username", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.map((b, idx) => (
                <tr key={b.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                  <td className="px-4 py-2.5 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{b.name}</span>
                      {b.isDefault && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--primary-light)] text-[var(--primary)] rounded">Default</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{b.hostname}</td>
                  <td className="px-4 py-2.5 text-gray-600">{b.databaseName}</td>
                  <td className="px-4 py-2.5 text-gray-600">{b.username}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingBranch({ ...b }); setShowEditModal(true) }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(b.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showSwitchModal && (
        <ModalOverlay onClose={() => setShowSwitchModal(false)}>
          <ModalHeader title="Switch Branch" onClose={() => setShowSwitchModal(false)} />
          <div className="px-6 py-4 space-y-3">
            {branches.map((b) => (
              <label key={b.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                switchBranchId === b.id ? "border-indigo-300 bg-[var(--primary-light)]" : "border-gray-200 hover:border-gray-300"
              }`}>
                <input type="radio" name="switchBranch" checked={switchBranchId === b.id}
                  onChange={() => setSwitchBranchId(b.id)} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                <div>
                  <span className="text-sm font-medium text-gray-800">{b.name}</span>
                  {b.isDefault && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-[var(--primary-light)] text-[var(--primary)] rounded">Default</span>}
                  <p className="text-xs text-gray-500">{b.hostname}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setShowSwitchModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSwitchBranch}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">Update</button>
          </div>
        </ModalOverlay>
      )}

      {showAddModal && (
        <ModalOverlay onClose={() => setShowAddModal(false)}>
          <ModalHeader title="Add New Branch" onClose={() => setShowAddModal(false)} />
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Envato Purchase Code <span className="text-red-500">*</span></label>
              <input type="text" value={formData.purchaseCode} onChange={(e) => setFormData({ ...formData, purchaseCode: e.target.value })}
                placeholder="Enter purchase code" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <span className="text-sm text-gray-700">Make Default Branch</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Hostname <span className="text-red-500">*</span></label>
                <input type="text" value={formData.hostname} onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                  placeholder="e.g. branch.smartschool.edu" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Database Name <span className="text-red-500">*</span></label>
                <input type="text" value={formData.databaseName} onChange={(e) => setFormData({ ...formData, databaseName: e.target.value })}
                  placeholder="e.g. ss_branch" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Username <span className="text-red-500">*</span></label>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Database username" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Password <span className="text-red-500">*</span></label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Database password" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleAddBranch}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">Verify & Save</button>
          </div>
        </ModalOverlay>
      )}

      {showEditModal && editingBranch && (
        <ModalOverlay onClose={() => { setShowEditModal(false); setEditingBranch(null) }}>
          <ModalHeader title={`Edit Branch - ${editingBranch.name}`} onClose={() => { setShowEditModal(false); setEditingBranch(null) }} />
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Branch Name</label>
                <input type="text" value={editingBranch.name} onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Hostname <span className="text-red-500">*</span></label>
                <input type="text" value={editingBranch.hostname} onChange={(e) => setEditingBranch({ ...editingBranch, hostname: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Database Name <span className="text-red-500">*</span></label>
                <input type="text" value={editingBranch.databaseName} onChange={(e) => setEditingBranch({ ...editingBranch, databaseName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Username <span className="text-red-500">*</span></label>
                <input type="text" value={editingBranch.username} onChange={(e) => setEditingBranch({ ...editingBranch, username: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => { setShowEditModal(false); setEditingBranch(null) }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleEditBranch}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">Verify & Save</button>
          </div>
        </ModalOverlay>
      )}

      {deleteConfirmId && (
        <ModalOverlay onClose={() => setDeleteConfirmId(null)}>
          <ModalHeader title="Confirm Delete" onClose={() => setDeleteConfirmId(null)} />
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600">Are you sure you want to delete <strong>{branches.find((b) => b.id === deleteConfirmId)?.name}</strong>? This action cannot be undone.</p>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={() => handleDeleteBranch(deleteConfirmId)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">OK</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
