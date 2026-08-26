"use client"

import { useState, useMemo } from "react"
import { Eye, Play, X } from "lucide-react"
import { useApi } from "@/lib/use-api"

type OnlineExam = {
  id: number
  title: string
  subject: string
  duration: number
  totalQuestions: number
  status: "Published" | "Draft"
}

export default function OnlineExaminationsPage() {
  const { data: exams, loading } = useApi<OnlineExam>("/api/alumni/online-examination")
  const [viewExam, setViewExam] = useState<OnlineExam | null>(null)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Online Examinations</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Online Examinations</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Exam Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Duration (min)</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Total Questions</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e, idx) => (
                <tr key={e.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{e.title}</td>
                  <td className="px-4 py-3 text-gray-600">{e.subject}</td>
                  <td className="px-4 py-3 text-gray-600">{e.duration}</td>
                  <td className="px-4 py-3 text-gray-600">{e.totalQuestions}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${e.status === "Published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{e.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewExam(e)} className="text-blue-600 hover:text-blue-800"><Eye className="h-4 w-4" /></button>
                      <button className="rounded-lg bg-[var(--primary)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 flex items-center gap-1"><Play className="h-3 w-3" /> Take</button>
                    </div>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No exams found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-sm text-gray-500">Showing {exams.length} records</div>
      </div>

      {viewExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewExam(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Exam Details</h2>
              <button onClick={() => setViewExam(null)}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Title:</span><span className="text-gray-800">{viewExam.title}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Subject:</span><span className="text-gray-800">{viewExam.subject}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Duration:</span><span className="text-gray-800">{viewExam.duration} minutes</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Total Questions:</span><span className="text-gray-800">{viewExam.totalQuestions}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="font-medium text-gray-600">Status:</span><span className="text-gray-800">{viewExam.status}</span></div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setViewExam(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
