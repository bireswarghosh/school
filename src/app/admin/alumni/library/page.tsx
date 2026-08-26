"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { useApi } from "@/lib/use-api"

type LibraryRecord = {
  id: number
  book: string
  author: string
  issuedDate: string
  returnDate: string
  status: "Issued" | "Returned"
}

export default function LibraryPage() {
  const { data: records, loading } = useApi<LibraryRecord>("/api/alumni/library")
  const [filterBook, setFilterBook] = useState("")
  const [filterIssuedFrom, setFilterIssuedFrom] = useState("")
  const [filterIssuedTo, setFilterIssuedTo] = useState("")
  const [filterReturnFrom, setFilterReturnFrom] = useState("")
  const [filterReturnTo, setFilterReturnTo] = useState("")
  const [searched, setSearched] = useState(false)

  const filteredRecords = useMemo(() => {
    if (!searched) return []
    return records.filter((r) => {
      if (filterBook && !r.book.toLowerCase().includes(filterBook.toLowerCase())) return false
      if (filterIssuedFrom && r.issuedDate < filterIssuedFrom) return false
      if (filterIssuedTo && r.issuedDate > filterIssuedTo) return false
      if (filterReturnFrom && r.returnDate < filterReturnFrom) return false
      if (filterReturnTo && r.returnDate > filterReturnTo) return false
      return true
    })
  }, [records, filterBook, filterIssuedFrom, filterIssuedTo, filterReturnFrom, filterReturnTo, searched])

  const handleSearch = () => setSearched(true)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Library</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Library</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
          <input value={filterBook} onChange={(e) => setFilterBook(e.target.value)} placeholder="Book Name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Issued From</label><input type="date" value={filterIssuedFrom} onChange={(e) => setFilterIssuedFrom(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Issued To</label><input type="date" value={filterIssuedTo} onChange={(e) => setFilterIssuedTo(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Return From</label><input type="date" value={filterReturnFrom} onChange={(e) => setFilterReturnFrom(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Return To</label><input type="date" value={filterReturnTo} onChange={(e) => setFilterReturnTo(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" /></div>
          <button onClick={handleSearch} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center justify-center gap-1.5 self-end"><Search className="h-4 w-4" /> Search</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Book</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Issued Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Return Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Enter search criteria and click Search</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No library records found</td></tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.book}</td>
                    <td className="px-4 py-3 text-gray-600">{r.author}</td>
                    <td className="px-4 py-3 text-gray-600">{r.issuedDate}</td>
                    <td className="px-4 py-3 text-gray-600">{r.returnDate}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === "Returned" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{r.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {searched && <div className="mt-3 text-sm text-gray-500">Showing {filteredRecords.length} records</div>}
      </div>
    </div>
  )
}
