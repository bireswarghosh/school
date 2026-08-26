"use client"

import { useState, useMemo } from "react"
import { Search, Eye, X, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { useApi } from "@/lib/use-api"

type FinanceRecord = {
  id: number
  date: string
  type: "Fee" | "Donation" | "Expense"
  description: string
  amount: number
  paymentMode: string
  status: "Paid" | "Pending"
}

export default function FinancePage() {
  const { data: records, loading } = useApi<FinanceRecord>("/api/alumni/finance")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterType, setFilterType] = useState("")
  const [searched, setSearched] = useState(false)
  const [viewRecord, setViewRecord] = useState<FinanceRecord | null>(null)

  const filteredRecords = useMemo(() => {
    if (!searched) return []
    return records.filter((r) => {
      if (filterType && r.type !== filterType) return false
      if (filterDateFrom && r.date < filterDateFrom) return false
      if (filterDateTo && r.date > filterDateTo) return false
      return true
    })
  }, [records, filterDateFrom, filterDateTo, filterType, searched])

  const summary = useMemo(() => {
    const totalIncome = records.filter((r) => r.type !== "Expense").reduce((sum, r) => sum + r.amount, 0)
    const totalExpense = records.filter((r) => r.type === "Expense").reduce((sum, r) => sum + r.amount, 0)
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
  }, [records])

  const handleSearch = () => setSearched(true)

  const typeBadge = (t: FinanceRecord["type"]) => {
    switch (t) {
      case "Fee": return "bg-blue-100 text-blue-700"
      case "Donation": return "bg-green-100 text-green-700"
      case "Expense": return "bg-red-100 text-red-700"
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Finance</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Finance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-sm text-gray-500">Total Income</p><p className="text-xl font-bold text-gray-800">${summary.totalIncome}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-3"><TrendingDown className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-sm text-gray-500">Total Expense</p><p className="text-xl font-bold text-gray-800">${summary.totalExpense}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3"><DollarSign className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">Balance</p><p className="text-xl font-bold text-gray-800">${summary.balance}</p></div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
            <option value="">All Types</option>
            <option value="Fee">Fee</option>
            <option value="Donation">Donation</option>
            <option value="Expense">Expense</option>
          </select>
          <button onClick={handleSearch} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-1.5"><Search className="h-4 w-4" /> Search</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Description</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Payment Mode</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Select filters and click Search</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No records found</td></tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-600">{r.date}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge(r.type)}`}>{r.type}</span></td>
                    <td className="px-4 py-3 text-gray-600">{r.description}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">${r.amount}</td>
                    <td className="px-4 py-3 text-gray-600">{r.paymentMode}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{r.status}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => setViewRecord(r)} className="text-blue-600 hover:text-blue-800"><Eye className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {searched && <div className="mt-3 text-sm text-gray-500">Showing {filteredRecords.length} records</div>}
      </div>

      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewRecord(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Finance Record</h2>
              <button onClick={() => setViewRecord(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Date:</span><span className="text-gray-800">{viewRecord.date}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Type:</span><span className="text-gray-800">{viewRecord.type}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Description:</span><span className="text-gray-800">{viewRecord.description}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Amount:</span><span className="text-gray-800">${viewRecord.amount}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Payment Mode:</span><span className="text-gray-800">{viewRecord.paymentMode}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Status:</span><span className="text-gray-800">{viewRecord.status}</span></div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setViewRecord(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
