"use client"

import { useState } from "react"
import { Search, Eye, X, Mail, MessageSquare, CheckCircle, XCircle, Filter } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface LogRecord {
  id: number
  type: "Email" | "SMS"
  recipient: string
  subjectOrMessage: string
  date: string
  status: "Sent" | "Failed"
}

export default function EmailSmsLogPage() {
  const { data: logs } = useApi<LogRecord>("/api/communicate/log")
  const [filterType, setFilterType] = useState("All")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [searched, setSearched] = useState(false)
  const [viewRecord, setViewRecord] = useState<LogRecord | null>(null)

  const handleSearch = () => {
    setSearched(true)
  }

  const filteredLogs = logs.filter(log => {
    if (searched) {
      if (filterType !== "All" && log.type !== filterType) return false
      if (dateFrom && log.date < dateFrom) return false
      if (dateTo && log.date > dateTo) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Email & SMS Log</h1>
            <p className="text-blue-100 text-sm">View all sent email and SMS records</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-sm">
              <option>All</option>
              <option>Email</option>
              <option>SMS</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
          </div>
          <button onClick={handleSearch} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md text-sm">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Communication Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Recipient</th>
                <th className="text-left p-3">Subject / Message</th>
                <th className="text-left p-3">Date</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-400">No records found.</td></tr>
              ) : filteredLogs.map((log, i) => (
                <tr key={log.id} className={`border-t border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                  <td className="p-3 text-gray-500">{log.id}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${log.type === "Email" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>
                      {log.type === "Email" ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                      {log.type}
                    </span>
                  </td>
                  <td className="p-3 text-gray-800 max-w-[150px] truncate">{log.recipient}</td>
                  <td className="p-3 text-gray-600 max-w-[200px] truncate">{log.subjectOrMessage}</td>
                  <td className="p-3 text-gray-600">{log.date}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === "Sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {log.status === "Sent" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => setViewRecord(log)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="View"><Eye className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Record Details</h3>
              <button onClick={() => setViewRecord(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Type:</span><span className="font-medium">{viewRecord.type}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Recipient:</span><span className="font-medium">{viewRecord.recipient}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Subject/Message:</span><span className="font-medium max-w-[250px] text-right">{viewRecord.subjectOrMessage}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Date:</span><span className="font-medium">{viewRecord.date}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Status:</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${viewRecord.status === "Sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {viewRecord.status}
                </span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setViewRecord(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
