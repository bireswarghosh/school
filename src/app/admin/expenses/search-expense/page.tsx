"use client"

import { useState, useMemo } from "react"
import { Search, X } from "lucide-react"
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
        exp.invoiceNo.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [dateFrom, dateTo, searchHead, searchText, searched, allExpenses])

  const totalAmount = results.reduce((sum, r) => sum + Number(r.amount), 0)

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

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Search Expense</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Expenses / Search Expense</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Search Criteria</h3>
        </div>
        <form onSubmit={handleSearch} className="p-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Expense Head</label>
            <select value={searchHead} onChange={(e) => setSearchHead(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All Heads</option>
              {(heads || []).map((h) => <option key={h.id} value={h.name}>{h.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600">Search by Expense</label>
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search by name, head, or invoice..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="flex gap-2">
            <button type="submit"
              className="flex items-center gap-1.5 px-5 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Search className="h-4 w-4" /> Search
            </button>
            {searched && (
              <button type="button" onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="h-4 w-4" /> Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Search Results</h3>
            <span className="text-sm text-gray-500">
              Total: <strong className="text-[var(--primary)]">{symbol}{totalAmount.toLocaleString()}</strong>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["#", "Name", "Expense Head", "Invoice No", "Date", `Amount (${symbol})`, "Payment Mode", "Description"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">No records found</td></tr>
                ) : (
                  results.map((exp, idx) => (
                    <tr key={exp.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{exp.name}</td>
                      <td className="px-4 py-3 text-gray-600">{exp.expenseHead}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{exp.invoiceNo}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{exp.date}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{Number(exp.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{exp.paymentMode || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[250px] truncate">{exp.description || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
            <span>Showing {results.length} records</span>
          </div>
        </div>
      )}

      {!searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Select date range and criteria, then click Search to find expense records</p>
        </div>
      )}
    </div>
  )
}
