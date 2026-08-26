"use client"

import { useState, useMemo } from "react"
import { Search, X } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useCurrency } from "@/lib/currency-context"

type IncomeHead = {
  id: number
  name: string
}

type IncomeRecord = {
  id: number
  incomeHeadId: number
  incomeHead: string
  name: string
  invoiceNo: string
  date: string
  amount: number
  description: string
  paymentMode: string
  note: string
  document: string
}

export default function SearchIncomePage() {
  const { symbol } = useCurrency()
  const { data: allIncomes } = useApi<IncomeRecord>("/api/income")
  const { data: incomeHeads } = useApi<IncomeHead>("/api/income/head")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [searchHead, setSearchHead] = useState("")
  const [searchText, setSearchText] = useState("")
  const [searched, setSearched] = useState(false)

  const results = useMemo(() => {
    if (!searched || !allIncomes) return []
    let filtered = [...allIncomes]

    if (dateFrom) {
      filtered = filtered.filter((inc) => inc.date && new Date(inc.date) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter((inc) => inc.date && new Date(inc.date) <= new Date(dateTo + "T23:59:59"))
    }

    if (searchHead) {
      filtered = filtered.filter((inc) => inc.incomeHeadId?.toString() === searchHead)
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      filtered = filtered.filter(
        (inc) =>
          inc.name.toLowerCase().includes(q) ||
          inc.invoiceNo?.toLowerCase().includes(q) ||
          (inc.incomeHead || "").toLowerCase().includes(q)
      )
    }

    return filtered
  }, [allIncomes, dateFrom, dateTo, searchHead, searchText, searched])

  const totalAmount = useMemo(() => results.reduce((sum, inc) => sum + (inc.amount || 0), 0), [results])

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
          <h2 className="text-xl font-bold text-white">Search Income</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Income / Search Income</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Search Criteria</h3>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setSearched(true) }} className="p-4 flex flex-wrap items-end gap-4">
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
            <label className="block text-xs font-medium text-gray-600">Income Head</label>
            <select value={searchHead} onChange={(e) => setSearchHead(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All</option>
              {(incomeHeads || []).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600">Search by Income</label>
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
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Name", "Income Head", "Invoice No", "Date", `Amount (${symbol})`, "Payment Mode", "Description"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">No matching income records found</td></tr>
                  ) : (
                    results.map((inc, idx) => (
                      <tr key={inc.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-gray-50 transition-colors`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{inc.name}</td>
                        <td className="px-4 py-3 text-gray-600">{inc.incomeHead || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{inc.invoiceNo || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{inc.date}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium">{symbol}{inc.amount?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{inc.paymentMode || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{inc.description || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing <strong>{results.length}</strong> records
            </span>
            <span className="text-sm font-semibold text-gray-800">
              Total Amount: <span className="text-[var(--primary)]">{symbol}{totalAmount.toLocaleString()}</span>
            </span>
          </div>
        </>
      )}

      {!searched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Select date range and criteria, then click Search to find income records</p>
        </div>
      )}
    </div>
  )
}
