"use client"
import { toast as notify } from "@/lib/toast"

import { ShoppingCart, TrendingUp, CheckCircle, Star, User, ClipboardList, FileText, BarChart3, RefreshCw, FileCheck, LayoutDashboard, Sparkles, Eye } from "lucide-react"

const reports = [
  { id: 1, name: "Student Course Purchase Report", icon: ShoppingCart, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-l-blue-500", description: "View course purchase history by student" },
  { id: 2, name: "Course Sell Count Report", icon: BarChart3, color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-l-emerald-500", description: "Course sales volume statistics" },
  { id: 3, name: "Course Trending Report", icon: TrendingUp, color: "text-rose-600", bgColor: "bg-rose-50", borderColor: "border-l-rose-500", description: "Most popular courses this period" },
  { id: 4, name: "Course Complete Report", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-l-green-500", description: "Students who completed courses" },
  { id: 5, name: "Course Rating Report", icon: Star, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-l-amber-500", description: "Average course ratings" },
  { id: 6, name: "Guest Report", icon: User, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-l-purple-500", description: "Guest user activity report" },
  { id: 7, name: "Course Assignment Report", icon: ClipboardList, color: "text-cyan-600", bgColor: "bg-cyan-50", borderColor: "border-l-cyan-500", description: "Assignment submission status" },
  { id: 8, name: "Course Exam Result Report", icon: FileCheck, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-l-orange-500", description: "Exam results and scores" },
  { id: 9, name: "Course Exam Report", icon: FileText, color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-l-indigo-500", description: "Exam creation and attempts" },
  { id: 10, name: "Course Exam Attempt Report", icon: RefreshCw, color: "text-teal-600", bgColor: "bg-teal-50", borderColor: "border-l-teal-500", description: "Exam attempt statistics" },
]

export default function OnlineCourseReportPage() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block"><LayoutDashboard className="h-28 w-28 text-white" /></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><BarChart3 className="h-4 w-4 text-white" /></span>
              Online Course Report
            </h2>
            <p className="text-sm text-white/80 mt-1">Analytics & insights for your online courses • {reports.length} reports available</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20">
            <Sparkles className="h-3.5 w-3.5" /> Reports
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-violet-600"><BarChart3 className="h-4 w-4" /></span><TrendingUp className="h-4 w-4 text-violet-400" /></div>
          <p className="text-2xl font-black text-violet-700 mt-2">{reports.length}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-violet-600/70">Total Reports</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-emerald-600"><TrendingUp className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div>
          <p className="text-2xl font-black text-emerald-700 mt-2">Live</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-600/70">Real-time Data</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border text-amber-600"><Eye className="h-4 w-4" /></span><span className="h-2 w-2 rounded-full bg-amber-500" /></div>
          <p className="text-2xl font-black text-amber-700 mt-2">7×24</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-600/70">Monitoring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => notify.info(`Report: ${report.name} — data view coming soon`)}
            className={`text-left bg-white rounded-2xl shadow-sm border border-gray-200 border-l-4 ${report.borderColor} p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group`}
          >
            <div className={`w-10 h-10 rounded-xl ${report.bgColor} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
              <report.icon className={`h-5 w-5 ${report.color}`} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 leading-tight group-hover:text-[var(--primary)] transition-colors">{report.name}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mt-1 line-clamp-2">{report.description}</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] mt-3 opacity-0 group-hover:opacity-100 transition-opacity">View Report <Eye className="h-3 w-3" /></span>
          </button>
        ))}
      </div>
    </div>
  )
}
