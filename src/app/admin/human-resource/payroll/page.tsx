"use client"

import { useState, useMemo } from "react"
import { Plus, Search, X, Calendar, DollarSign, TrendingUp, Users, Building2, Award, Check, Clock, Eye, Pencil, Trash2, Wallet, CreditCard, UserCheck } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

type PayrollRecord = {
  id: number
  staffId: number
  staff_id?: number
  staffName: string
  staff_name?: string
  staffCode?: string
  department: string
  basicSalary: number
  basic_salary?: number
  allowances: number
  deductions: number
  netSalary: number
  net_salary?: number
  month: string
  year: number
  paymentDate: string
  payment_date?: string
  status: "Paid" | "Pending"
}

type Staff = {
  id: number
  staffId: string
  staff_id?: string
  name: string
  surname?: string
  email: string
  phone?: string
  contactNo?: string
  department: string
  designation?: string
  role: string
  basicSalary?: number
  basic_salary?: number
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const currentYear = new Date().getFullYear()
const years = [currentYear - 1, currentYear, currentYear + 1]

const avatarColors = ["bg-[var(--primary)]", "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-rose-500", "bg-amber-500"]
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "S"

export default function PayrollPage() {
  const { symbol } = useCurrency()
  const { data: records, add, update, remove } = useApi<PayrollRecord>("/api/human-resource/payroll")
  const { data: staffData } = useApi<Staff>("/api/human-resource/staff")

  const [filterStaff, setFilterStaff] = useState("")
  const [filterMonth, setFilterMonth] = useState("")
  const [filterYear, setFilterYear] = useState("")
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<PayrollRecord | null>(null)
  const [staffSearch, setStaffSearch] = useState("")
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [form, setForm] = useState({ basicSalary: "", allowances: "0", deductions: "0", month: months[new Date().getMonth()], year: currentYear, paymentDate: new Date().toISOString().split("T")[0], status: "Pending" as "Paid" | "Pending" })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const staffList = useMemo(() => staffData, [staffData])

  const getStaffById = (id: number | null) => staffList.find((s) => s.id === id) || null

  const filteredStaffForSelect = useMemo(() => {
    const q = staffSearch.trim().toLowerCase()
    if (!q) return staffList.slice(0, 12)
    return staffList.filter((s) => {
      const hay = [s.name, (s as any).surname, s.staffId, (s as any).staff_id, s.email, (s as any).phone, (s as any).contactNo, s.department, (s as any).designation, s.role].filter(Boolean).join(" ").toLowerCase()
      return hay.includes(q)
    }).slice(0, 12)
  }, [staffSearch, staffList])

  const netSalary = useMemo(() => {
    const basic = parseFloat(form.basicSalary) || 0
    const allow = parseFloat(form.allowances) || 0
    const deduct = parseFloat(form.deductions) || 0
    return basic + allow - deduct
  }, [form.basicSalary, form.allowances, form.deductions])

  const filtered = useMemo(() => {
    let arr = records
    if (filterStaff) {
      const q = filterStaff.toLowerCase()
      arr = arr.filter((r) => {
        const hay = [r.staffName, (r as any).staff_name, r.department, String(r.staffId), r.month, String(r.year)].join(" ").toLowerCase()
        return hay.includes(q)
      })
    }
    if (filterMonth && (filterMonth !== "")) arr = arr.filter((r) => r.month === filterMonth)
    if (filterYear) arr = arr.filter((r) => String(r.year) === filterYear)
    const q = search.trim().toLowerCase()
    if (q) arr = arr.filter((r) => [r.staffName, (r as any).staff_name, r.department, r.month, String(r.year), r.status].join(" ").toLowerCase().includes(q))
    return arr
  }, [records, filterStaff, filterMonth, filterYear, search])

  const stats = useMemo(() => {
    const total = records.length
    const paid = records.filter((r) => r.status === "Paid").length
    const pending = records.filter((r) => r.status === "Pending").length
    const totalNet = records.reduce((s, r) => s + Number(r.netSalary ?? (r as any).net_salary ?? 0), 0)
    const avg = total ? Math.round(totalNet / total) : 0
    return { total, paid, pending, totalNet, avg }
  }, [records])

  const handleOpenAdd = () => {
    setEditing(null)
    setSelectedStaffId(null)
    setStaffSearch("")
    setForm({ basicSalary: "", allowances: "0", deductions: "0", month: months[new Date().getMonth()], year: currentYear, paymentDate: new Date().toISOString().split("T")[0], status: "Pending" })
    setError("")
    setShowModal(true)
  }

  const handleSelectStaff = (s: Staff) => {
    setSelectedStaffId(s.id)
    setStaffSearch(`${s.name} ${(s as any).surname || ""} (${s.staffId || (s as any).staff_id})`.trim())
    // auto-fill basic salary from staff if available
    const basic = (s as any).basicSalary ?? (s as any).basic_salary
    if (basic) setForm((prev) => ({ ...prev, basicSalary: String(basic) }))
  }

  const handleOpenEdit = (r: PayrollRecord) => {
    setEditing(r)
    const sid = (r as any).staffId ?? (r as any).staff_id
    setSelectedStaffId(sid ? Number(sid) : null)
    const st = staffList.find((s) => s.id === Number(sid))
    if (st) setStaffSearch(`${st.name} ${(st as any).surname || ""} (${st.staffId || (st as any).staff_id})`.trim())
    else setStaffSearch(r.staffName || (r as any).staff_name || "")
    setForm({
      basicSalary: String(r.basicSalary ?? (r as any).basic_salary ?? ""),
      allowances: String(r.allowances ?? 0),
      deductions: String(r.deductions ?? 0),
      month: r.month || months[0],
      year: Number(r.year) || currentYear,
      paymentDate: (r.paymentDate || (r as any).payment_date || "").slice(0, 10),
      status: r.status as any,
    })
    setError("")
    setShowModal(true)
  }

  const handleSave = async () => {
    setError("")
    if (!selectedStaffId) { setError("Please select staff (search by name, ID, phone, email, department)"); return }
    if (!form.basicSalary || Number(form.basicSalary) <= 0) { setError("Basic salary is required"); return }
    if (!form.month) { setError("Month is required"); return }
    if (!form.year) { setError("Year is required"); return }
    setSaving(true)
    try {
      const payload: any = {
        staffId: selectedStaffId,
        basicSalary: parseFloat(form.basicSalary) || 0,
        allowances: parseFloat(form.allowances) || 0,
        deductions: parseFloat(form.deductions) || 0,
        month: form.month,
        year: form.year,
        paymentDate: form.paymentDate || null,
        status: form.status,
      }
      if (editing) {
        await update(editing.id, payload)
      } else {
        await add(payload)
      }
      setShowModal(false)
      setEditing(null)
      setSelectedStaffId(null)
      setStaffSearch("")
    } catch (e: any) {
      setError(e.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this payroll record?")) return
    await remove(id)
  }

  const selectedStaff = getStaffById(selectedStaffId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Wallet className="h-4 w-4 text-white" /></span>
              Payroll
            </h2>
            <p className="text-sm text-white/80 mt-1">Human Resource / Generate and manage staff payroll • Staff list from directory</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <Users className="h-3.5 w-3.5" /> {staffList.length} staff • {records.length} payrolls
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-emerald-600"><Wallet className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{symbol}{stats.totalNet.toLocaleString()}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-600/70">Total Net</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-blue-600"><Users className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-blue-500" /></div>
          <p className="text-2xl font-black text-blue-700 mt-2">{stats.total}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-blue-600/70">Total Records</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-amber-600"><Clock className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-amber-500" /></div>
          <p className="text-2xl font-black text-amber-700 mt-2">{stats.pending}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-600/70">Pending</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-violet-600"><TrendingUp className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-violet-500" /></div>
          <p className="text-2xl font-black text-violet-700 mt-2">{symbol}{stats.avg.toLocaleString()}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-violet-600/70">Avg Net</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]"><Search className="h-4 w-4" /></span>
          <h3 className="text-sm font-bold text-gray-800">Select Criteria</h3>
          <span className="ml-auto text-xs text-gray-400 hidden sm:inline">Staff list is from directory • Search by any part</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)} placeholder="Search staff by name, ID, phone, email, department…"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white" />
            </div>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white">
              <option value="">All Months</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white">
              <option value="">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleOpenAdd} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[#ff8a4a] text-white text-sm font-bold rounded-xl shadow-md shadow-orange-200 hover:opacity-95 h-[42px]">
              <Plus className="h-4 w-4" /> Generate Payroll
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Quick search in payroll list…"
                className="w-full pl-8 pr-8 py-2 text-xs border border-gray-200 rounded-full bg-white focus:ring-2 focus:ring-[var(--primary)]/20" />
              {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"><X className="h-3 w-3 text-gray-400" /></button>}
            </div>
            <span className="hidden sm:inline text-gray-500">{filtered.length} / {records.length}</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><CreditCard className="h-4 w-4 text-[var(--primary)]" /> Payroll List</h3>
          <span className="text-xs text-gray-500">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["#", "Staff", "Department", "Basic", "Allowances", "Deductions", "Net Salary", "Month/Year", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border"><Search className="h-5 w-5 text-gray-400" /></div>
                  <p className="mt-2 text-sm font-medium text-gray-700">No payroll records found</p>
                  <p className="text-xs text-gray-500">Generate payroll for staff from directory</p>
                </td></tr>
              ) : (
                filtered.map((r, idx) => {
                  const staffName = r.staffName || (r as any).staff_name || "—"
                  const dept = r.department || "—"
                  return (
                    <tr key={r.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm ${avatarColors[idx % avatarColors.length]}`}>{initials(staffName)}</span>
                          <div>
                            <p className="font-semibold text-gray-800 leading-none">{staffName}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><span className="rounded bg-gray-100 border px-1 py-0.5 text-[10px]">{(r as any).staffCode || ""}</span></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs bg-gray-50 border rounded-full px-2.5 py-1"><Building2 className="h-3 w-3 text-gray-400" />{dept}</span></td>
                      <td className="px-4 py-3 text-gray-700">{symbol}{Number(r.basicSalary ?? (r as any).basic_salary ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">+{symbol}{Number(r.allowances ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-red-600 font-medium">-{symbol}{Number(r.deductions ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-900 text-white text-xs font-bold"><Wallet className="h-3 w-3" />{symbol}{Number(r.netSalary ?? (r as any).net_salary ?? 0).toLocaleString()}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-600"><span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-full px-2 py-1"><Calendar className="h-3 w-3" />{r.month} {r.year}</span></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${r.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                          {r.status === "Paid" ? <UserCheck className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}{r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenEdit(r)} className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(r.id)} className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <span className="text-xs text-gray-500">Showing {filtered.length} of {records.length} records</span>
          <span className="text-xs text-gray-400 hidden sm:inline">Net = Basic + Allowances − Deductions</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Wallet className="h-4 w-4 text-emerald-600" /> {editing ? "Edit Payroll" : "Generate Payroll"}</h3>
                <p className="text-xs text-gray-500">Select staff from directory • Search by any part</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Staff <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input value={staffSearch} onChange={(e) => { setStaffSearch(e.target.value); setSelectedStaffId(null) }} placeholder="Search staff by name, ID, phone, email, department, role…"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white" />
                  {staffSearch && <button onClick={() => { setStaffSearch(""); setSelectedStaffId(null) }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"><X className="h-4 w-4 text-gray-400" /></button>}
                </div>
                {selectedStaffId ? (
                  (() => {
                    const s = getStaffById(selectedStaffId)
                    if (!s) return null
                    return (
                      <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white text-xs font-bold">{initials(s.name)}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-emerald-800">{s.name} {(s as any).surname || ""}</p>
                          <p className="text-xs text-emerald-700 truncate">{s.staffId || (s as any).staff_id} • {s.email} • {s.department || "—"} • {s.role}</p>
                        </div>
                        <span className="ml-auto text-xs font-bold text-emerald-700 flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" />Selected</span>
                      </div>
                    )
                  })()
                ) : (
                  <div className="mt-2 rounded-xl border border-gray-200 bg-white max-h-[180px] overflow-y-auto divide-y divide-gray-100">
                    {filteredStaffForSelect.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-500">No staff found</div>
                    ) : filteredStaffForSelect.map((s) => (
                      <button key={s.id} onClick={() => handleSelectStaff(s)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-emerald-50 transition-colors">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700 text-xs font-bold border">{initials(s.name)}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{s.name} {(s as any).surname || ""}</p>
                          <p className="text-xs text-gray-500 truncate">{s.staffId || (s as any).staff_id} • {s.email} • {s.department || "—"} • {s.role}</p>
                        </div>
                        <span className="ml-auto text-xs text-emerald-600 font-medium">Select</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">{staffList.length} staff available • showing {filteredStaffForSelect.length}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600">Basic Salary <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">{symbol}</span>
                    <input type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} placeholder="0"
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400" />
                  </div>
                  {selectedStaff && (selectedStaff as any).basicSalary && <p className="text-[11px] text-gray-400">Staff basic: {symbol}{String((selectedStaff as any).basicSalary || (selectedStaff as any).basic_salary)}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600">Allowances</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">+</span>
                    <input type="number" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} placeholder="0"
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600">Deductions</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500">-</span>
                    <input type="number" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} placeholder="0"
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-300" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600">Net Salary</label>
                  <div className="flex items-center gap-2 h-[42px] px-3 rounded-xl bg-gray-900 text-white font-bold text-sm">
                    <Wallet className="h-4 w-4" /> {symbol}{netSalary.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600">Month</label>
                  <select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white">
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600">Year</label>
                  <select value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600">Payment Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white">
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 rounded-xl">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50">
                <Check className="h-4 w-4" /> {saving ? "Saving..." : editing ? "Update Payroll" : "Generate Payroll"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
