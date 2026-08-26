"use client"
import { toast as notify } from "@/lib/toast"

import { ShoppingCart, TrendingUp, CheckCircle, Star, User, ClipboardList, FileText, BarChart3, RefreshCw, FileCheck } from "lucide-react"

const reports = [
  { id: 1, name: "Student Course Purchase Report", icon: ShoppingCart, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-l-blue-500", description: "View course purchase history by student" },
  { id: 2, name: "Course Sell Count Report", icon: BarChart3, color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-l-emerald-500", description: "Course sales volume statistics" },
  { id: 3, name: "Course Trending Report", icon: TrendingUp, color: "text-rose-600", bgColor: "bg-rose-50", borderColor: "border-l-rose-500", description: "Most popular courses this period" },
  { id: 4, name: "Course Complete Report", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-l-green-500", description: "Students who completed courses" },
  { id: 5, name: "Course Rating Report", icon: Star, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-l-amber-500", description: "Average course ratings" },
  { id: 6, name: "Guest Report", icon: User, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-l-purple-500", description: "Guest user activity report" },
  { id: 7, name: "Course Assignment Report", icon: ClipboardList, color: "text-cyan-600", bgColor: "bg-cyan-50", borderColor: "border-l-cyan-500", description: "Assignment submission status" },
  { id: 8, name: "Course Exam Result Report", icon: FileCheck, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-l-orange-500", description: "Exam results and scores" },
  { id: 9, name: "Course Exam Report", icon: FileText, color: "text-[var(--primary)]", bgColor: "bg-[var(--primary-light)]", borderColor: "border-l-indigo-500", description: "Exam creation and attempts" },
  { id: 10, name: "Course Exam Attempt Report", icon: RefreshCw, color: "text-teal-600", bgColor: "bg-teal-50", borderColor: "border-l-teal-500", description: "Exam attempt statistics" },
]

export default function OnlineCourseReportPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Online Course Report</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Online Course / Online Course Report</p>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => notify.info(`Report: ${report.name} - would show data here`)}
            className={`text-left bg-white rounded-xl shadow-sm border-l-4 ${report.borderColor} p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
          >
            <div className={`w-10 h-10 rounded-lg ${report.bgColor} flex items-center justify-center mb-3`}>
              <report.icon className={`h-5 w-5 ${report.color}`} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">{report.name}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{report.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
