"use client"

import { useState } from "react"
import { useApi } from "@/lib/use-api"

type LeaveRequest = {
  id: number
  staffName: string
  leaveType: string
  fromDate: string
  toDate: string
  days: number
  reason: string
  status: "Pending" | "Approved" | "Disapproved"
}

export default function ApproveLeaveRequestPage() {
  const { data: requests, update, loading } = useApi<LeaveRequest>("/api/attendance/leave")
  const [filterStatus, setFilterStatus] = useState("All")

  const summary = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    approved: requests.filter((r) => r.status === "Approved").length,
    disapproved: requests.filter((r) => r.status === "Disapproved").length,
  }

  const filtered = filterStatus === "All" ? requests : requests.filter((r) => r.status === filterStatus)

  const handleStatusChange = async (id: number, newStatus: "Approved" | "Disapproved") => {
    await update(id, { status: newStatus })
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Approve Leave Request</h2>
          <p className="text-sm text-white/70 mt-0.5">Human Resource / Approve Leave Request</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {([["Total", summary.total, "bg-blue-100 text-blue-700 border-blue-300"],
          ["Pending", summary.pending, "bg-yellow-100 text-yellow-700 border-yellow-300"],
          ["Approved", summary.approved, "bg-green-100 text-green-700 border-green-300"],
          ["Disapproved", summary.disapproved, "bg-red-100 text-red-700 border-red-300"]] as const).map(([label, count, colorClasses]) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{count}</p>
            <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full border inline-block ${colorClasses}`}>{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Leave Requests</h3>
          <div className="flex items-center gap-2">
            {["All", "Pending", "Approved", "Disapproved"].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterStatus === s ? "bg-[var(--primary)] text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Staff Name", "Leave Type", "From Date", "To Date", "Days", "Reason", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={r.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.staffName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${r.leaveType === "Sick" ? "bg-red-100 text-red-700 border-red-300" : r.leaveType === "Casual" ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-green-100 text-green-700 border-green-300"}`}>{r.leaveType}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.fromDate}</td>
                  <td className="px-4 py-3 text-gray-600">{r.toDate}</td>
                  <td className="px-4 py-3 text-center"><span className="font-medium text-gray-800">{r.days}</span></td>
                  <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{r.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${r.status === "Approved" ? "bg-green-100 text-green-700 border-green-300" : r.status === "Disapproved" ? "bg-red-100 text-red-700 border-red-300" : "bg-yellow-100 text-yellow-700 border-yellow-300"}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "Pending" ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleStatusChange(r.id, "Approved")} className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:opacity-90">Approve</button>
                        <button onClick={() => handleStatusChange(r.id, "Disapproved")} className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 hover:bg-red-50 rounded-lg">Disapprove</button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No leave requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">Showing {filtered.length} of {requests.length} records</span>
        </div>
      </div>
    </div>
  )
}
