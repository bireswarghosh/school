"use client"

import { useState, useMemo } from "react"
import { Search, X, Calendar, Tag, Wallet, TrendingUp, Filter, Receipt, DollarSign, Eye } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

type ExpenseHead = { id: number; name: string }

type ExpenseRecord = {
  id: number
  name: string
  expenseHead: string
  invoiceNo: string
  date: string
  amount: number
  description: string
  paymentMode: string
  document: string
}

export default function SearchExpensePage() {
  const { symbol } = useCurrency()
  const { data: allExpenses } = useApi<ExpenseRecord>("/api/expenses")
  const { data: heads } = useApi<ExpenseHead>("/api/expenses/head")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [searchHead, setSearchHead] = useState("")
  const [searchText, setSearchText] = useState("")
  const [searched, setSearched] = useState(false)

  const results = useMemo(() => {
    if (!searched || !allExpenses) return []
    let filtered = [...allExpenses]

    if (dateFrom) {
      filtered = filtered.filter((exp) => exp.date && new Date(exp.date) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter((exp) => exp.date && new Date(exp.date) <= new Date(dateTo + "T23:59:59"))
    }

    if (searchHead) {
      filtered = filtered.filter((exp) => exp.expenseHead === searchHead)
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      filtered = filtered.filter((exp) =>
        exp.name.toLowerCase().includes(q) ||
        exp.expenseHead.toLowerCase().includes(q) ||
        exp.invoiceNo.toLowerCase().includes(q) ||
        (exp.description || "").toLowerCase().includes(q)
      )
    }

    return filtered
  }, [dateFrom, dateTo, searchHead, searchText, searched, allExpenses])

  const totalAmount = useMemo(() => results.reduce((sum, r) => sum + Number(r.amount), 0), [results])

  const stats = useMemo(() => {
    const total = (allExpenses || []).length
    const totalAmt = (allExpenses || []).reduce((s, e) => s + Number(e.amount || 0), 0)
    return { total, totalAmt }
  }, [allExpenses])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
  }

  const handleReset = () => {
    setDateFrom("")
    setDateTo("")
    setSearchHead("")
    setSearchText("")
    setSearched(false)
  }

  const paymentBadge = (m: string) => {
    if (m === "Cash") return "bg-emerald-50 text-emerald-700 border-emerald-200"
    if (m === "Cheque") return "bg-amber-50 text-amber-700 border-amber-200"
    if (m === "Online") return "bg-blue-50 text-blue-700 border-blue-200"
    return "bg-slate-50 text-slate-700 border-slate-200"
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block"><Search className="h-28 w-28 text-white" /></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Search className="h-4 w-4 text-white" /></span>
              Search Expense
            </h2>
            <p className="text-sm text-white/80 mt-1">Expenses / Find and filter expense records • {stats.total} total</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <Wallet className="h-3.5 w-3.5" /> {symbol}{stats.totalAmt.toLocaleString()} total
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-violet-600"><Receipt className="h-4 w-4" /></span><Filter className="h-4 w-4 text-violet-400" /></div>
          <p className="text-2xl font-black text-violet-700 mt-2">{stats.total}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-violet-600/70">Total Expenses</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-emerald-600"><DollarSign className="h-4 w-4" /></span><TrendingUp className="h-4 w-4 text-emerald-500" /></div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{symbol}{stats.totalAmt.toLocaleString()}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-600/70">Total Amount</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm hidden lg:block">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-amber-600"><Tag className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-amber-500" /></div>
          <p className="text-2xl font-black text-amber-700 mt-2">{(heads || []).length}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-600/70">Expense Heads</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white"><Filter className="h-4 w-4" /></span>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Search Criteria</h3>
            <p className="text-xs text-gray-500">Filter by date, head and keyword</p>
          </div>
        </div>
        <form onSubmit={handleSearch} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3 space-y-1">
              <label className="block text-xs font-bold text-gray-600">Date From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-200 focus:border-violet-400 bg-white shadow-sm" />
              </div>
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="block text-xs font-bold text-gray-600">Date To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-200 focus:border-violet-400 bg-white shadow-sm" />
              </div>
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="block text-xs font-bold text-gray-600">Expense Head</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select value={searchHead} onChange={(e) => setSearchHead(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-200 focus:border-violet-400 bg-white shadow-sm">
                  <option value="">All Heads</option>
                  {(heads || []).map((h) => <option key={h.id} value={h.name}>{h.name}</option>)}
                </select>
              </div>
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="block text-xs font-bold text-gray-600">Keyword</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Name, invoice, head..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-200 focus:border-violet-400 bg-white shadow-sm" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-md hover:opacity-95">
              <Search className="h-4 w-4" /> Search Expenses
            </button>
            {searched && (
              <button type="button" onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                <X className="h-4 w-4" /> Reset
              </button>
            )}
            <span className="ml-auto text-xs text-gray-400 hidden sm:inline">{searched ? `${results.length} results • Total ${symbol}${totalAmount.toLocaleString()}` : "Set criteria and click Search"}</span>
          </div>
        </form>
      </div>

      {searched ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Receipt className="h-4 w-4 text-violet-600" /> Search Results</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-white border px-3 py-1 rounded-full">{results.length} records</span>
              <span className="text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-3 py-1.5 rounded-full shadow flex items-center gap-1"><Wallet className="h-3 w-3" />{symbol}{totalAmount.toLocaleString()}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {["#", "Name", "Head", "Invoice", "Date", `Amount (${symbol})`, "Mode", "Description"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-bold text-gray-500 text-[11px] tracking-widest uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border"><Search className="h-5 w-5 text-gray-400" /></div>
                    <p className="text-sm font-medium text-gray-700 mt-2">No records found</p>
                    <p className="text-xs text-gray-500">Try adjusting date range, head or keyword</p>
                  </td></tr>
                ) : (
                  results.map((exp, idx) => (
                    <tr key={exp.id} className="hover:bg-violet-50/30 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-gray-800">{exp.name}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold"><Tag className="h-3 w-3" />{exp.expenseHead}</span></td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{exp.invoiceNo || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap flex items-center gap-1"><Calendar className="h-3 w-3 text-gray-400" />{exp.date ? new Date(exp.date).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">{symbol}{Number(exp.amount).toLocaleString()}</span></td>
                      <td className="px-4 py-3"><span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${paymentBadge(exp.paymentMode)}`}>{exp.paymentMode || "—"}</span></td>
                      <td className="px-4 py-3 max-w-[220px] truncate text-xs text-gray-600">{exp.description || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30 text-xs text-gray-500 flex items-center justify-between">
            <span>Showing {results.length} records • Total {symbol}{totalAmount.toLocaleString()}</span>
            <span className="hidden sm:inline-flex items-center gap-1"><Eye className="h-3 w-3" /> Filtered by {searchHead || "all heads"} {dateFrom || dateTo ? `• ${dateFrom || "…"} to ${dateTo || "…"}` : ""}</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md"><Search className="h-7 w-7" /></div>
          <p className="text-sm font-bold text-gray-800 mt-3">Search your expenses</p>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">Select a date range, choose an expense head, or type a keyword (name, invoice, description) and click Search to see matching records with total amount.</p>
        </div>
      )}
    </div>
  )
}
