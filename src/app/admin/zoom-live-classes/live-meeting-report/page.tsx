"use client"

import { useState } from "react"
import { Eye, X } from "lucide-react"

interface ZoomMeetingReport {
  id: number
  title: string
  date: string
  duration: string
  status: string
  totalJoined: number
  joinedStaff: { name: string; role: string }[]
}

const reportData: ZoomMeetingReport[] = [
  { id: 1, title: "Staff Planning Meeting", date: "07/03/2026", duration: "60", status: "Awaited", totalJoined: 0, joinedStaff: [] },
  { id: 2, title: "Department Review", date: "07/05/2026", duration: "45", status: "Awaited", totalJoined: 0, joinedStaff: [] },
  { id: 3, title: "All Staff Meeting", date: "07/01/2026", duration: "90", status: "Finished", totalJoined: 3, joinedStaff: [
    { name: "John Doe", role: "Teacher" }, { name: "Jane Smith", role: "Teacher" }, { name: "David Miller", role: "Admin" },
  ]},
  { id: 4, title: "IT Team Sync", date: "06/28/2026", duration: "30", status: "Cancelled", totalJoined: 0, joinedStaff: [] },
]

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-2xl mx-4">
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

export default function ZoomLiveMeetingReportPage() {
  const [viewJoinList, setViewJoinList] = useState<ZoomMeetingReport | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Live Meeting Report</h2>
        <p className="text-sm text-gray-500 mt-1">Zoom Live Classes / Live Meeting Report</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Live Meeting List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["#", "Meeting Title", "Date", "Duration", "Status", "Total Joined", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((r, idx) => (
                <tr key={r.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)]`}>
                  <td className="px-4 py-2.5 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{r.title}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{r.duration} min</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === "Started" ? "bg-green-100 text-green-700" :
                      r.status === "Awaited" ? "bg-blue-100 text-blue-700" :
                      r.status === "Finished" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {r.totalJoined}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => setViewJoinList(r)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Join List">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewJoinList && (
        <ModalOverlay onClose={() => setViewJoinList(null)}>
          <ModalHeader title={`Join List - ${viewJoinList.title}`} onClose={() => setViewJoinList(null)} />
          <div className="px-6 py-4">
            <p className="text-xs text-gray-500 mb-3">Total Staff Joined: <strong>{viewJoinList.totalJoined}</strong></p>
            {viewJoinList.joinedStaff.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No staff joined</p>
            ) : (
              <div className="space-y-2">
                {viewJoinList.joinedStaff.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-sm text-gray-800">{s.name}</span>
                    <span className="text-xs text-gray-500">({s.role})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button onClick={() => setViewJoinList(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Close</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
