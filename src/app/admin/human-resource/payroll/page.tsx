"use client"

import { useState, useMemo } from "react"
import { Plus, Search, X } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

type PayrollRecord = {
  id: number
  staffName: string
  department: string
  basicSalary: number
  allowances: number
  deductions: number
  netSalary: number
  month: string
  year: number
  paymentDate: string
  status: "Paid" | "Pending"
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const staffOptions = ["Ms. Sunita Sharma", "Mr. Rajesh Verma", "Mr. Amit Kumar", "Ms. Pooja Singh", "Mr. Vikram Joshi", "Mr. Suresh Gupta", "Ms. Neha Patel", "Mr. Deepak Yadav"]

const getDepartment = (name: string): string => {
  const map: Record<string, string> = {
    "Ms. Sunita Sharma": "Science", "Mr. Rajesh Verma": "Mathematics", "Mr. Amit Kumar": "Transport",
    "Ms. Pooja Singh": "English", "Mr. Vikram Joshi": "Admin", "Mr. Suresh Gupta": "Admin",
    "Ms. Neha Patel": "Science", "Mr. Deepak Yadav": "Transport"
  }
  return map[name] || ""
}

export default function PayrollPage() {
  const { symbol } = useCurrency()
  const { data: records, add, update, remove, loading } = useApi<PayrollRecord>("/api/human-resource/payroll")
  const [filterStaff, setFilterStaff] = useState("")
  const [filterMonth, setFilterMonth] = useState("")
  const [filterYear, setFilterYear] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<PayrollRecord | null>(null)
  const [form, setForm] = useState({ staffName: "", basicSalary: "", allowances: "0", deductions: "0", month: months[0], year: 2026, paymentDate: "", status: "Pending" as "Paid" | "Pending" })

  const netSalary = useMemo(() => {
    const basic = parseFloat(form.basicSalary) || 0
    const allow = parseFloat(form.allowances) || 0
    const deduct = parseFloat(form.deductions) || 0
    return basic + allow - deduct
  }, [form.basicSalary, form.allowances, form.deductions])

  const filtered = records.filter((r) => {
    if (filterStaff && r.staffName !== filterStaff) return false
    if (filterMonth && r.month !== filterMonth) return false
    if (filterYear && r.year.toString() !== filterYear) return false
    return true
  })

  const handleOpenAdd = () => {
    setEditing(null)
    setForm({ staffName: staffOptions[0], basicSalary: "", allowances: "0", deductions: "0", month: months[0], year: 2026, paymentDate: "", status: "Pending" })
    setShowModal(true)
  }

  const handleOpenEdit = (r: PayrollRecord) => {
    setEditing(r)
    setForm({ staffName: r.staffName, basicSalary: r.basicSalary.toString(), allowances: r.allowances.toString(), deductions: r.deductions.toString(), month: r.month, year: r.year, paymentDate: r.paymentDate, status: r.status })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.basicSalary) return
    const basic = parseFloat(form.basicSalary) || 0
    const allow = parseFloat(form.allowances) || 0
    const deduct = parseFloat(form.deductions) || 0
    const net = basic + allow - deduct
    const dept = getDepartment(form.staffName)
    if (editing) {
      await update(editing.id, { staffName: form.staffName, department: dept, basicSalary: basic, allowances: allow, deductions: deduct, netSalary: net, month: form.month, year: form.year, paymentDate: form.paymentDate, status: form.status })
    } else {
      await add({ staffName: form.staffName, department: dept, basicSalary: basic, allowances: allow, deductions: deduct, netSalary: net, month: form.month, year: form.year, paymentDate: form.paymentDate, status: form.status })
    }
    setShowModal(false)
    setEditing(null)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Delete this payroll record?")) {
      await remove(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Payroll</h2>
          <p className="text-sm text-white/70 mt-0.5">Human Resource / Payroll</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Search className="h-4 w-4 text-[var(--primary)]" /> Select Criteria
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Select Staff</option>
              {staffOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Select Month</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">Select Year</option>
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90">
              <Search className="h-4 w-4" /> Search
            </button>
            <button onClick={handleOpenAdd} className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90">
              <Plus className="h-4 w-4" /> Generate Payroll
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Payroll List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Staff Name", "Department", "Basic Salary", "Allowances", "Deductions", "Net Salary", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={r.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.staffName}</td>
                  <td className="px-4 py-3 text-gray-600">{r.department}</td>
                  <td className="px-4 py-3 text-gray-600">{symbol}{r.basicSalary.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">+{symbol}{r.allowances.toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-600">-{symbol}{r.deductions.toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{symbol}{r.netSalary.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${r.status === "Paid" ? "bg-green-100 text-green-700 border-green-300" : "bg-yellow-100 text-yellow-700 border-yellow-300"}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleOpenEdit(r)} className="px-3 py-1.5 text-xs font-medium bg-[var(--primary)] text-white rounded-lg hover:opacity-90">Edit</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No payroll records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">Showing {filtered.length} of {records.length} records</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{editing ? "Edit Payroll" : "Generate Payroll"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Staff <span className="text-red-500">*</span></label>
                <select value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                  {staffOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Basic Salary <span className="text-red-500">*</span></label>
                  <input type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Allowances</label>
                  <input type="number" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Deductions</label>
                  <input type="number" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Net Salary</label>
                  <input type="number" value={netSalary} readOnly
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-700" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
                  <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "Paid" | "Pending" })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                  <select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <select value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                    {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 rounded-lg">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
