"use client"

import { useState, useEffect } from "react"
import { Search, Filter } from "lucide-react"

type ScheduleEntry = {
  id: number
  examName: string
  subject: string
  class: string
  section: string
  date: string
  startTime: string
  endTime: string
  room: string
  term: string
  groupName: string
}

type ExamGroup = { id: number; name: string; examType: string }
type Exam = { id: number; groupId: number; name: string; session: string }
type Subject = { id: number; examId: number; name: string; date: string; time: string; room: string }

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  return res.json()
}

export default function ExamSchedulePage() {
  const [examGroups, setExamGroups] = useState<ExamGroup[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedGroup, setSelectedGroup] = useState("")
  const [selectedExam, setSelectedExam] = useState("")
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    fetchJson("/api/examinations/group").then(setExamGroups).catch(console.error)
    fetchJson("/api/examinations/exam").then(setExams).catch(console.error)
    fetchJson("/api/examinations/subject").then(setSubjects).catch(console.error)
  }, [])

  const filteredExams = selectedGroup
    ? exams.filter((e) => e.groupId === parseInt(selectedGroup))
    : []

  const scheduleEntries: ScheduleEntry[] = searched
    ? subjects
        .filter((s) => {
          const exam = exams.find((e) => e.id === s.examId)
          if (!exam) return false
          const group = examGroups.find((g) => g.id === exam.groupId)
          const matchGroup = !selectedGroup || (group && group.id === parseInt(selectedGroup))
          const matchExam = !selectedExam || exam.id === parseInt(selectedExam)
          return matchGroup && matchExam
        })
        .map((s) => {
          const exam = exams.find((e) => e.id === s.examId)
          const group = exam ? examGroups.find((g) => g.id === exam.groupId) : undefined
          return {
            id: s.id,
            examName: exam?.name || "Unknown",
            subject: s.name,
            class: "",
            section: "",
            date: s.date || "",
            startTime: s.time || "",
            endTime: "",
            room: s.room || "",
            term: exam?.session || "",
            groupName: group?.name || "",
          }
        })
    : []

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Exam Schedule</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">Examinations / Exam Schedule</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Search Filters</h3>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam Group</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedGroup}
                  onChange={(e) => { setSelectedGroup(e.target.value); setSelectedExam(""); setSearched(false) }}
                  className="w-56 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Select Exam Group</option>
                  {examGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedExam}
                  onChange={(e) => { setSelectedExam(e.target.value); setSearched(false) }}
                  disabled={!selectedGroup}
                  className="w-56 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Select Exam</option>
                  {filteredExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => setSearched(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
            >
              <Search className="h-4 w-4" /> Search
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Schedule List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Exam Name", "Subject", "Class", "Section", "Date", "Start Time", "End Time", "Room", "Term"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">Select filters and click Search to view schedule</td></tr>
              ) : scheduleEntries.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">No schedule entries found</td></tr>
              ) : (
                scheduleEntries.map((entry, idx) => (
                  <tr key={entry.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{entry.examName}</td>
                    <td className="px-4 py-3 text-gray-600">{entry.subject}</td>
                    <td className="px-4 py-3 text-gray-600">{entry.class || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{entry.section || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{entry.date || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{entry.startTime || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{entry.endTime || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{entry.room || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{entry.term || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {searched && (
          <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
            <span>Showing {scheduleEntries.length} records</span>
          </div>
        )}
      </div>
    </div>
  )
}
