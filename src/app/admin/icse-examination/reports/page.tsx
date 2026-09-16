"use client"

import { useState, useMemo } from "react"
import { Search, Download, Printer, BarChart3 } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type ReportType = "subject-marks" | "template-marks"

type SubjectReport = {
  id?: number
  subject: string
  class: string
  section: string
  totalStudents: number
  passed: number
  failed: number
  averageMarks: number
  highestMarks: number
  lowestMarks: number
}

type TemplateReport = {
  id?: number
  templateName: string
  totalUsed: number
  class: string
  section: string
}

const subjects = ["All", "Mathematics", "Science", "English", "Hindi", "Social Studies", "Computer Science"]

export default function IcseReportsPage() {
  const { classNames } = useClassesAndSections()
  const classes = ["All", ...classNames]
  const { data: subjectReports } = useApi<SubjectReport>("/api/icse/reports?type=subject-marks")
  const { data: templateReports } = useApi<TemplateReport>("/api/icse/reports?type=template-marks")
  const [reportType, setReportType] = useState<ReportType>("subject-marks")
  const [search, setSearch] = useState("")
  const [filterClass, setFilterClass] = useState("All")
  const [filterSubject, setFilterSubject] = useState("All")

  const filteredSubjectReports = useMemo(() => {
    return (subjectReports || []).filter((r) => {
      const matchSearch = r.subject.toLowerCase().includes(search.toLowerCase()) || r.class.toLowerCase().includes(search.toLowerCase())
      const matchClass = filterClass === "All" || r.class === filterClass
      const matchSubject = filterSubject === "All" || r.subject === filterSubject
      return matchSearch && matchClass && matchSubject
    })
  }, [search, filterClass, filterSubject, subjectReports])

  const filteredTemplateReports = useMemo(() => {
    return (templateReports || []).filter((r) => {
      const matchSearch = r.templateName.toLowerCase().includes(search.toLowerCase()) || r.class.toLowerCase().includes(search.toLowerCase())
      const matchClass = filterClass === "All" || r.class === filterClass
      return matchSearch && matchClass
    })
  }, [search, filterClass, templateReports])

  const totalAvg = filteredSubjectReports.length ? (filteredSubjectReports.reduce((sum, r) => sum + r.averageMarks, 0) / filteredSubjectReports.length) : 0
  const totalPassed = filteredSubjectReports.reduce((sum, r) => sum + r.passed, 0)
  const totalStudents = filteredSubjectReports.reduce((sum, r) => sum + r.totalStudents, 0)
  const passPercentage = totalStudents ? ((totalPassed / totalStudents) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Reports</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">ICSE Examination / Reports</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setReportType("subject-marks")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${reportType === "subject-marks" ? "bg-[var(--primary)] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
          Subject Marks Report
        </button>
        <button onClick={() => setReportType("template-marks")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${reportType === "template-marks" ? "bg-[var(--primary)] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
          Template Marks Report
        </button>
      </div>

      {reportType === "subject-marks" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">Total Subjects</span>
                <BarChart3 className="h-4 w-4 text-[var(--primary)]" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{filteredSubjectReports.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">Avg Marks</span>
                <BarChart3 className="h-4 w-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{totalAvg.toFixed(1)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">Pass %</span>
                <BarChart3 className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{passPercentage}%</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">Total Students</span>
                <BarChart3 className="h-4 w-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{totalStudents}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-gray-700">Subject Marks Report</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                    className="w-40 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                </div>
                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                  {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Subject", "Class", "Section", "Total Students", "Passed", "Failed", "Avg Marks", "Highest", "Lowest"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjectReports.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-8 text-gray-400">No reports found</td></tr>
                  ) : (
                    filteredSubjectReports.map((r, idx) => (
                      <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{r.subject}</td>
                        <td className="px-4 py-3 text-gray-600">{r.class}</td>
                        <td className="px-4 py-3 text-gray-600">{r.section}</td>
                        <td className="px-4 py-3 text-gray-600">{r.totalStudents}</td>
                        <td className="px-4 py-3"><span className="text-green-600 font-medium">{r.passed}</span></td>
                        <td className="px-4 py-3"><span className="text-red-600 font-medium">{r.failed}</span></td>
                        <td className="px-4 py-3 text-gray-800 font-medium">{r.averageMarks}</td>
                        <td className="px-4 py-3 text-emerald-600 font-medium">{r.highestMarks}</td>
                        <td className="px-4 py-3 text-orange-600 font-medium">{r.lowestMarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {reportType === "template-marks" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-gray-700">Template Marks Report</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search template..."
                  className="w-48 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              </div>
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white">
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["#", "Template Name", "Total Used", "Class", "Section"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTemplateReports.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No template reports found</td></tr>
                ) : (
                  filteredTemplateReports.map((r, idx) => (
                    <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.templateName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)]">{r.totalUsed}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.class}</td>
                      <td className="px-4 py-3 text-gray-600">{r.section}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"><Printer className="h-4 w-4" /> Print</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"><Download className="h-4 w-4" /> Export</button>
          </div>
        </div>
      )}
    </div>
  )
}
