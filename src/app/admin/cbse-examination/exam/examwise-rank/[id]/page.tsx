"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Exam = { id: number; name: string; class: string; section: string }
type Student = { id: number; admissionNo: string; name: string; class: string; section: string; fatherName: string; gender: string; mobile: string; dob: string }
type RankItem = { studentId: number; admissionNo: string; name: string; class: string; section: string; fatherName: string; dob: string; gender: string; mobile: string; totalMarks: number; rank: number }

export default function ExamWiseRankPage() {
  const { id } = useParams<{ id: string }>()
  const examId = parseInt(id || "0")
  const { data: exams } = useApi<Exam>("/api/cbse/exam")
  const { data: students } = useApi<Student>("/api/students")
  const exam = exams.find((e) => e.id === examId)
  const [marksByStudent, setMarksByStudent] = useState<Record<number, { theory: number; practical: number }[]>>({})
  const [ranks, setRanks] = useState<RankItem[]>([])
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)

  const loadMarks = useCallback(async () => {
    try {
      const res = await fetch(`/api/cbse/exam-marks?exam_id=${examId}`)
      const data = res.ok ? await res.json() : []
      const map: Record<number, { theory: number; practical: number }[]> = {}
      data.forEach((m: any) => {
        const sid = m.studentId || m.student_id
        if (!map[sid]) map[sid] = []
        map[sid].push({ theory: m.theoryMarks || m.theory_marks || 0, practical: m.practicalMarks || m.practical_marks || 0 })
      })
      setMarksByStudent(map)
    } catch {
      setMarksByStudent({})
    }
  }, [examId])

  useEffect(() => { if (examId) loadMarks() }, [examId, loadMarks])

  useEffect(() => {
    if (!students || !exam) return
    const sections = (exam.section || "").split(",").map((s) => s.trim()).filter(Boolean)
    const list: RankItem[] = (students || [])
      .filter((s) => s.class === exam.class && (sections.length === 0 || sections.includes(s.section)))
      .map((s) => {
        const sm = marksByStudent[s.id] || []
        let total = 0
        sm.forEach((m) => { total += m.theory + m.practical })
        return {
          studentId: s.id,
          admissionNo: s.admissionNo,
          name: s.name,
          class: s.class,
          section: s.section,
          fatherName: s.fatherName || "",
          dob: s.dob || "",
          gender: s.gender || "",
          mobile: s.mobile || "",
          totalMarks: total,
          rank: 0,
        }
      })
    list.sort((a, b) => b.totalMarks - a.totalMarks)
    list.forEach((item, idx) => { item.rank = idx + 1 })
    setRanks(list)
  }, [students, exam, marksByStudent])

  const generateRank = async () => {
    await loadMarks()
    setGeneratedAt(new Date().toLocaleString())
  }

  const formatDob = (dob: string) => {
    if (!dob) return "—"
    const d = new Date(dob)
    if (isNaN(d.getTime())) return dob
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Generate Rank</h2>
          <p className="text-sm text-white/80 mt-0.5">CBSE Examination / Exam / Generate Rank</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-700">Generate Rank : {exam?.name || "..."}</h3>
          <Link href="/admin/cbse-examination/exam" className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:text-[var(--secondary)] font-medium"><ArrowLeft className="h-4 w-4" /> Back to Exam List</Link>
        </div>
        <div className="px-5 py-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-3 mb-4">
            {generatedAt ? "Rank has been generated, further you can update regenerated rank." : "Ranks are computed from entered exam marks. Click Generate Rank to refresh."}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Admission No", "Student Name", "Class", "Father Name", "Date Of Birth", "Gender", "Mobile No.", "Rank"].map((h) => (
                    <th key={h} className={`px-3 py-3 font-semibold text-gray-600 text-xs uppercase whitespace-nowrap ${h === "Rank" ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranks.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">No students or marks data found for this exam</td></tr>
                ) : (
                  ranks.map((item) => (
                    <tr key={item.studentId} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${item.rank === 1 ? "bg-yellow-50" : item.rank === 2 ? "bg-gray-50" : item.rank === 3 ? "bg-amber-50" : ""}`}>
                      <td className="px-3 py-3 text-gray-600 font-mono text-xs">{item.admissionNo}</td>
                      <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">{item.name}</td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{item.class} ({item.section})</td>
                      <td className="px-3 py-3 text-gray-600">{item.fatherName || "—"}</td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDob(item.dob)}</td>
                      <td className="px-3 py-3 text-gray-600">{item.gender || "—"}</td>
                      <td className="px-3 py-3 text-gray-600">{item.mobile || "—"}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${item.rank === 1 ? "bg-yellow-400 text-yellow-900" : item.rank === 2 ? "bg-gray-300 text-gray-700" : item.rank === 3 ? "bg-amber-200 text-amber-800" : "text-gray-600"}`}>{item.rank}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-end">
            <button onClick={generateRank} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><RefreshCw className="h-4 w-4" /> Generate Rank</button>
          </div>
        </div>
      </div>
    </div>
  )
}
