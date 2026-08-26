"use client"

import { useState } from "react"
import { Search, Eye, X, ChevronDown, ChevronRight, DollarSign, Users, FileText, LogIn, TrendingUp, TrendingDown } from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

interface DailyCollection {
  branch: string
  cash: number
  cheque: number
  online: number
  total: number
  date: string
}

interface PayrollEntry {
  branch: string
  role: string
  designation: string
  month: string
  payslipNo: string
  basicSalary: number
  earning: number
  deduction: number
  netAmount: number
  paidAmount: number
}

interface IncomeEntry {
  branch: string
  head: string
  amount: number
  date: string
}

interface ExpenseEntry {
  branch: string
  head: string
  amount: number
  date: string
}

interface UserLogEntry {
  branch: string
  user: string
  role: string
  loginTime: string
  ipAddress: string
}

const reportTypes = [
  { key: "daily-collection", label: "Daily Collection Report", icon: DollarSign, desc: "View daily collection across branches with date range filter" },
  { key: "payroll", label: "Payroll Report", icon: Users, desc: "Check payroll details of staff across branches" },
  { key: "income-list", label: "Income List", icon: TrendingUp, desc: "View income entries across all branches" },
  { key: "expense-list", label: "Expense List", icon: TrendingDown, desc: "View expense entries across all branches" },
  { key: "income-report", label: "Income Report", icon: FileText, desc: "Search income reports by type and duration" },
  { key: "expense-report", label: "Expense Report", icon: FileText, desc: "Search expense reports by type and duration" },
  { key: "user-log", label: "User Log Report", icon: LogIn, desc: "View user login logs across branches" },
]

const branches = ["Main Campus", "North Campus", "South Campus"]

const dailyCollections: DailyCollection[] = [
  { branch: "Main Campus", cash: 28500, cheque: 15000, online: 42000, total: 85500, date: "07/01/2026" },
  { branch: "North Campus", cash: 18200, cheque: 8000, online: 25600, total: 51800, date: "07/01/2026" },
  { branch: "South Campus", cash: 12400, cheque: 5000, online: 18300, total: 35700, date: "07/01/2026" },
  { branch: "Main Campus", cash: 31200, cheque: 12000, online: 38500, total: 81700, date: "07/02/2026" },
  { branch: "North Campus", cash: 19800, cheque: 6000, online: 22400, total: 48200, date: "07/02/2026" },
  { branch: "South Campus", cash: 14500, cheque: 4000, online: 16200, total: 34700, date: "07/02/2026" },
]

const payrollData: PayrollEntry[] = [
  { branch: "Main Campus", role: "Teacher", designation: "Senior Teacher", month: "June 2026", payslipNo: "PS-001", basicSalary: 45000, earning: 12000, deduction: 5000, netAmount: 52000, paidAmount: 52000 },
  { branch: "Main Campus", role: "Accountant", designation: "Senior Accountant", month: "June 2026", payslipNo: "PS-002", basicSalary: 38000, earning: 8000, deduction: 4000, netAmount: 42000, paidAmount: 42000 },
  { branch: "North Campus", role: "Teacher", designation: "Primary Teacher", month: "June 2026", payslipNo: "PS-003", basicSalary: 32000, earning: 6000, deduction: 3000, netAmount: 35000, paidAmount: 35000 },
  { branch: "South Campus", role: "Teacher", designation: "Science Teacher", month: "June 2026", payslipNo: "PS-004", basicSalary: 35000, earning: 7000, deduction: 3500, netAmount: 38500, paidAmount: 38000 },
]

const incomeList: IncomeEntry[] = [
  { branch: "Main Campus", head: "Tuition Fees", amount: 85000, date: "07/01/2026" },
  { branch: "Main Campus", head: "Transport Fees", amount: 25000, date: "07/01/2026" },
  { branch: "North Campus", head: "Tuition Fees", amount: 52000, date: "07/01/2026" },
  { branch: "North Campus", head: "Library Fees", amount: 8000, date: "07/02/2026" },
  { branch: "South Campus", head: "Tuition Fees", amount: 38000, date: "07/02/2026" },
  { branch: "South Campus", head: "Sports Fees", amount: 5000, date: "07/02/2026" },
]

const expenseList: ExpenseEntry[] = [
  { branch: "Main Campus", head: "Electricity Bill", amount: 15000, date: "07/01/2026" },
  { branch: "Main Campus", head: "Staff Salary", amount: 52000, date: "07/01/2026" },
  { branch: "North Campus", head: "Electricity Bill", amount: 8500, date: "07/01/2026" },
  { branch: "North Campus", head: "Maintenance", amount: 12000, date: "07/02/2026" },
  { branch: "South Campus", head: "Staff Salary", amount: 38500, date: "07/02/2026" },
  { branch: "South Campus", head: "Stationery", amount: 3000, date: "07/02/2026" },
]

const userLogData: UserLogEntry[] = [
  { branch: "Main Campus", user: "admin@main.edu", role: "Admin", loginTime: "07/02/2026 08:15 AM", ipAddress: "192.168.1.10" },
  { branch: "Main Campus", user: "teacher1@main.edu", role: "Teacher", loginTime: "07/02/2026 08:30 AM", ipAddress: "192.168.1.25" },
  { branch: "North Campus", user: "admin@north.edu", role: "Admin", loginTime: "07/02/2026 08:20 AM", ipAddress: "192.168.2.10" },
  { branch: "North Campus", user: "teacher2@north.edu", role: "Teacher", loginTime: "07/02/2026 08:45 AM", ipAddress: "192.168.2.25" },
  { branch: "South Campus", user: "admin@south.edu", role: "Admin", loginTime: "07/02/2026 08:10 AM", ipAddress: "192.168.3.10" },
  { branch: "South Campus", user: "teacher3@south.edu", role: "Teacher", loginTime: "07/02/2026 09:00 AM", ipAddress: "192.168.3.25" },
]

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-4xl mx-4">
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

export default function MultiBranchReportPage() {
  const { symbol } = useCurrency()
  const [activeReport, setActiveReport] = useState<string | null>(null)

  const [dateFilter, setDateFilter] = useState({ from: "", to: "" })
  const [filteredCollections, setFilteredCollections] = useState<DailyCollection[] | null>(null)
  const [viewCollection, setViewCollection] = useState<{ branch: string; items: DailyCollection[] } | null>(null)

  const [payrollFilter, setPayrollFilter] = useState({ month: "June 2026", year: "2026" })
  const [filteredPayroll, setFilteredPayroll] = useState<PayrollEntry[] | null>(null)

  const [incomeReportFilter, setIncomeReportFilter] = useState({ searchType: "all", from: "", to: "" })
  const [filteredIncomeReport, setFilteredIncomeReport] = useState<IncomeEntry[] | null>(null)

  const [expenseReportFilter, setExpenseReportFilter] = useState({ searchType: "all", from: "", to: "" })
  const [filteredExpenseReport, setFilteredExpenseReport] = useState<ExpenseEntry[] | null>(null)

  const [userLogFilter, setUserLogFilter] = useState({ searchType: "all", from: "", to: "" })
  const [filteredUserLog, setFilteredUserLog] = useState<UserLogEntry[] | null>(null)

  const handleCollectionSearch = () => {
    if (!dateFilter.from && !dateFilter.to) {
      setFilteredCollections(dailyCollections)
      return
    }
    const filtered = dailyCollections.filter((c) => {
      const d = new Date(c.date)
      const from = dateFilter.from ? new Date(dateFilter.from) : new Date(0)
      const to = dateFilter.to ? new Date(dateFilter.to) : new Date(8640000000000000)
      return d >= from && d <= to
    })
    setFilteredCollections(filtered)
  }

  const handlePayrollSearch = () => {
    const filtered = payrollData.filter((p) => {
      return p.month.toLowerCase().includes(payrollFilter.month.toLowerCase())
    })
    setFilteredPayroll(filtered)
  }

  const handleIncomeReportSearch = () => {
    let data = [...incomeList]
    if (incomeReportFilter.searchType === "today") {
      const today = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
      data = data.filter((i) => i.date === today)
    } else if (incomeReportFilter.searchType === "this-week") {
    } else if (incomeReportFilter.searchType === "this-month") {
      const m = new Date().getMonth() + 1
      data = data.filter((i) => parseInt(i.date.split("/")[0]) === m)
    }
    setFilteredIncomeReport(data)
  }

  const handleExpenseReportSearch = () => {
    let data = [...expenseList]
    if (expenseReportFilter.searchType === "today") {
      const today = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
      data = data.filter((e) => e.date === today)
    } else if (expenseReportFilter.searchType === "this-week") {
    } else if (expenseReportFilter.searchType === "this-month") {
      const m = new Date().getMonth() + 1
      data = data.filter((e) => parseInt(e.date.split("/")[0]) === m)
    }
    setFilteredExpenseReport(data)
  }

  const handleUserLogSearch = () => {
    let data = [...userLogData]
    if (userLogFilter.searchType === "today") {
      const today = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
      data = data.filter((u) => u.loginTime.startsWith(today))
    }
    setFilteredUserLog(data)
  }

  const totalCollection = (filteredCollections || dailyCollections).reduce((s, c) => s + c.total, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Multi Branch Report</h2>
        <p className="text-sm text-gray-500 mt-1">Multi Branch / Report</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reportTypes.map((rt) => (
          <button key={rt.key} onClick={() => setActiveReport(activeReport === rt.key ? null : rt.key)}
            className={`text-left p-4 rounded-xl border transition-all ${
              activeReport === rt.key ? "border-indigo-300 bg-[var(--primary-light)] shadow-sm" : "border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm"
            }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                activeReport === rt.key ? "bg-[var(--primary)]" : "bg-gray-100"
              }`}>
                <rt.icon className={`h-5 w-5 ${activeReport === rt.key ? "text-white" : "text-gray-600"}`} />
              </div>
              {activeReport === rt.key ? <ChevronDown className="h-4 w-4 text-indigo-500" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            </div>
            <span className="text-sm font-semibold text-gray-800">{rt.label}</span>
            <p className="text-xs text-gray-500 mt-0.5">{rt.desc}</p>
          </button>
        ))}
      </div>

      {activeReport === "daily-collection" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Daily Collection Report</h3>
          </div>
          <div className="p-4 flex flex-wrap items-end gap-4 border-b border-gray-200">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date</label>
              <input type="date" value={dateFilter.from} onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date</label>
              <input type="date" value={dateFilter.to} onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <button onClick={handleCollectionSearch}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Branch", `Cash (${symbol})`, `Cheque (${symbol})`, `Online (${symbol})`, `Total (${symbol})`, "Date", "Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(filteredCollections || dailyCollections).map((row, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.branch}</td>
                    <td className="px-4 py-2.5 text-gray-600">{symbol}{row.cash.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-600">{symbol}{row.cheque.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-600">{symbol}{row.online.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{symbol}{row.total.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.date}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => setViewCollection({
                        branch: row.branch,
                        items: (filteredCollections || dailyCollections).filter((c) => c.branch === row.branch)
                      })}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Collection">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td className="px-4 py-2.5 font-semibold text-gray-800" colSpan={4}>Grand Total</td>
                  <td className="px-4 py-2.5 font-bold text-gray-800">{symbol}{totalCollection.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {viewCollection && (
        <ModalOverlay onClose={() => setViewCollection(null)}>
          <ModalHeader title={`Daily Collection - ${viewCollection.branch}`} onClose={() => setViewCollection(null)} />
          <div className="px-6 py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Date", `Cash (${symbol})`, `Cheque (${symbol})`, `Online (${symbol})`, `Total (${symbol})`].map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewCollection.items.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-600">{row.date}</td>
                    <td className="px-3 py-2 text-gray-600">{symbol}{row.cash.toLocaleString()}</td>
                    <td className="px-3 py-2 text-gray-600">{symbol}{row.cheque.toLocaleString()}</td>
                    <td className="px-3 py-2 text-gray-600">{symbol}{row.online.toLocaleString()}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{symbol}{row.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setViewCollection(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Close</button>
          </div>
        </ModalOverlay>
      )}

      {activeReport === "payroll" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Payroll Report</h3>
          </div>
          <div className="p-4 flex flex-wrap items-end gap-4 border-b border-gray-200">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Month</label>
              <select value={payrollFilter.month} onChange={(e) => setPayrollFilter({ ...payrollFilter, month: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                  <option key={m} value={`${m} 2026`}>{m} 2026</option>
                ))}
              </select>
            </div>
            <button onClick={handlePayrollSearch}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Branch", "Role", "Designation", "Month", "Payslip #", `Basic Salary (${symbol})`, `Earning (${symbol})`, `Deduction (${symbol})`, `Net Amount (${symbol})`, `Paid Amount (${symbol})`].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(filteredPayroll || payrollData).map((row, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.branch}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.role}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.designation}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.month}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.payslipNo}</td>
                    <td className="px-4 py-2.5 text-gray-600">{symbol}{row.basicSalary.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-green-600">{symbol}{row.earning.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-red-600">{symbol}{row.deduction.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{symbol}{row.netAmount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-green-600 font-medium">{symbol}{row.paidAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === "income-list" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Income List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Branch", "Income Head", `Amount (${symbol})`, "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incomeList.map((row, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.branch}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.head}</td>
                    <td className="px-4 py-2.5 text-green-600 font-medium">{symbol}{row.amount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === "expense-list" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Expense List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Branch", "Expense Head", `Amount (${symbol})`, "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenseList.map((row, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.branch}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.head}</td>
                    <td className="px-4 py-2.5 text-red-600 font-medium">{symbol}{row.amount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === "income-report" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Income Report</h3>
          </div>
          <div className="p-4 flex flex-wrap items-end gap-4 border-b border-gray-200">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Search Type</label>
              <select value={incomeReportFilter.searchType} onChange={(e) => setIncomeReportFilter({ ...incomeReportFilter, searchType: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date</label>
              <input type="date" value={incomeReportFilter.from} onChange={(e) => setIncomeReportFilter({ ...incomeReportFilter, from: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date</label>
              <input type="date" value={incomeReportFilter.to} onChange={(e) => setIncomeReportFilter({ ...incomeReportFilter, to: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <button onClick={handleIncomeReportSearch}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Branch", "Income Head", `Amount (${symbol})`, "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(filteredIncomeReport || incomeList).map((row, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.branch}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.head}</td>
                    <td className="px-4 py-2.5 text-green-600 font-medium">{symbol}{row.amount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === "expense-report" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Expense Report</h3>
          </div>
          <div className="p-4 flex flex-wrap items-end gap-4 border-b border-gray-200">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Search Type</label>
              <select value={expenseReportFilter.searchType} onChange={(e) => setExpenseReportFilter({ ...expenseReportFilter, searchType: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date</label>
              <input type="date" value={expenseReportFilter.from} onChange={(e) => setExpenseReportFilter({ ...expenseReportFilter, from: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date</label>
              <input type="date" value={expenseReportFilter.to} onChange={(e) => setExpenseReportFilter({ ...expenseReportFilter, to: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <button onClick={handleExpenseReportSearch}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Branch", "Expense Head", `Amount (${symbol})`, "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(filteredExpenseReport || expenseList).map((row, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.branch}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.head}</td>
                    <td className="px-4 py-2.5 text-red-600 font-medium">{symbol}{row.amount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === "user-log" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">User Log Report</h3>
          </div>
          <div className="p-4 flex flex-wrap items-end gap-4 border-b border-gray-200">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Search Type</label>
              <select value={userLogFilter.searchType} onChange={(e) => setUserLogFilter({ ...userLogFilter, searchType: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">From Date</label>
              <input type="date" value={userLogFilter.from} onChange={(e) => setUserLogFilter({ ...userLogFilter, from: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">To Date</label>
              <input type="date" value={userLogFilter.to} onChange={(e) => setUserLogFilter({ ...userLogFilter, to: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <button onClick={handleUserLogSearch}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Branch", "User", "Role", "Login Time", "IP Address"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(filteredUserLog || userLogData).map((row, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.branch}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.user}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.role}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.loginTime}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
