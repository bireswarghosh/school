"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { useApi } from "@/lib/use-api"

type LeaveApplication = {
  id: number
  leaveType: string
  fromDate: string
  toDate: string
  days: number
  reason: string
  status: "Pending" | "Approved" | "Disapproved"
  appliedOn: string
}

const leaveTypesList = ["Sick Leave", "Casual Leave", "Earned Leave"]

export default function ApplyLeavePage() {
  const { data: leaves, add, update, remove, loading } = useApi<LeaveApplication>("/api/attendance/leave")
  const [leaveType, setLeaveType] = useState(leaveTypesList[0])
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [reason, setReason] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)

  const calcDays = (from: string, to: string): number => {
    if (!from || !to) return 0
    const f = new Date(from), t = new Date(to)
    return Math.max(0, Math.ceil((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  }

  const handleApply = async () => {
    if (!fromDate || !toDate || !reason) return
    const days = calcDays(fromDate, toDate)
    if (days <= 0) return
    if (editingId) {
      await update(editingId, { leaveType, fromDate, toDate, days, reason })
      setEditingId(null)
    } else {
      await add({ leaveType, fromDate, toDate, days, reason, status: "Pending", appliedOn: new Date().toISOString().split("T")[0] })
    }
    setLeaveType(leaveTypesList[0])
    setFromDate("")
    setToDate("")
    setReason("")
  }

  const handleEdit = (l: LeaveApplication) => {
    setEditingId(l.id)
    setLeaveType(l.leaveType)
    setFromDate(l.fromDate)
    setToDate(l.toDate)
    setReason(l.reason)
  }

  const handleCancel = async (id: number) => {
    if (confirm("Cancel this leave application?")) {
      await remove(id)
      if (editingId === id) {
        setEditingId(null)
        setLeaveType(leaveTypesList[0])
        setFromDate("")
        setToDate("")
        setReason("")
      }
    }
  }

  const days = calcDays(fromDate, toDate)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Apply Leave</h2>
          <p className="text-sm text-white/70 mt-0.5">Human Resource / Apply Leave</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">{editingId ? "Edit Leave" : "Apply New Leave"}</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Leave Type <span className="text-red-500">*</span></label>
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]">
                {leaveTypesList.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Date <span className="text-red-500">*</span></label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Date <span className="text-red-500">*</span></label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Days</label>
              <input value={days} readOnly
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-700" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Enter reason for leave"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleApply} disabled={!fromDate || !toDate || !reason || days <= 0}
              className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
              {editingId ? "Update" : "Apply"}
            </button>
            {editingId && (
              <button onClick={() => { setEditingId(null); setLeaveType(leaveTypesList[0]); setFromDate(""); setToDate(""); setReason("") }}
                className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">My Leave History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Leave Type", "From", "To", "Days", "Status", "Applied On", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaves.map((l, idx) => (
                <tr key={l.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-800">{l.leaveType}</td>
                  <td className="px-4 py-3 text-gray-600">{l.fromDate}</td>
                  <td className="px-4 py-3 text-gray-600">{l.toDate}</td>
                  <td className="px-4 py-3 text-center font-medium text-gray-800">{l.days}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${l.status === "Approved" ? "bg-green-100 text-green-700 border-green-300" : l.status === "Disapproved" ? "bg-red-100 text-red-700 border-red-300" : "bg-yellow-100 text-yellow-700 border-yellow-300"}`}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.appliedOn}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {l.status === "Pending" && (
                        <>
                          <button onClick={() => handleEdit(l)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">Edit</button>
                          <button onClick={() => handleCancel(l.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">Cancel</button>
                        </>
                      )}
                      {(l.status === "Approved" || l.status === "Disapproved") && <span className="text-xs text-gray-400">-</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No leave history found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">Showing {leaves.length} records</span>
        </div>
      </div>
    </div>
  )
}
