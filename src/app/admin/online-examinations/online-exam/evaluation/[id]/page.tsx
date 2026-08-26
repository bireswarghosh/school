"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { Search, Download, ChevronLeft, ChevronRight, ArrowLeft, Settings, Plus, Trash2, X, Save } from "lucide-react"
import Link from "next/link"

type Attempt = {
  id: number
  studentName: string
  studentClass: string
  studentSection: string
  studentRollNo: string
  studentGender: string
  admissionNo: string
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  score: number
  status: string
  submittedAt: string
}

export default function EvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [examName, setExamName] = useState("")
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [rankSettings, setRankSettings] = useState<{ min: number; label: string }[]>([
    { min: 90, label: "A" },
    { min: 80, label: "B" },
    { min: 70, label: "C" },
    { min: 60, label: "D" },
  ])
  const [rankModalOpen, setRankModalOpen] = useState(false)
  const [rankDraft, setRankDraft] = useState<{ min: number; label: string }[]>([])
  const rowsPerPage = 15

  useEffect(() => {
    Promise.all([
      fetch(`/api/online-exam?id=${id}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/exam-attempts?exam_id=${id}`).then(r => r.ok ? r.json() : []),
      fetch("/api/settings?key=exam_rank_settings").then(r => r.ok ? r.json() : null),
    ]).then(([exam, data, settings]) => {
      if (exam) setExamName(exam.name || "")
      setAttempts(data || [])
      if (settings?.value) {
        try {
          const parsed = JSON.parse(settings.value)
          if (Array.isArray(parsed) && parsed.length) setRankSettings(parsed)
        } catch { /* ignore */ }
      }
    }).finally(() => setLoading(false))
  }, [id])

  const filtered = attempts.filter(a =>
    !search || a.studentName.toLowerCase().includes(search.toLowerCase()) ||
    (a.admissionNo || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.studentRollNo || "").toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const formatDate = (d: string) => {
    if (!d) return "—"
    const dt = new Date(d)
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
  }

  const getScore = (a: Attempt) => typeof a.score === "number" ? a.score : parseFloat(a.score as any) || 0
  const getRank = (score: number) => {
    const sorted = [...rankSettings].sort((a, b) => b.min - a.min)
    for (const r of sorted) if (score >= r.min) return r.label
    return "E"
  }
  const avgScore = filtered.length > 0 ? filtered.reduce((s, a) => s + getScore(a), 0) / filtered.length : 0
  const passed = filtered.filter(a => getScore(a) >= 40).length
  const failed = filtered.filter(a => getScore(a) < 40).length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/online-examinations/online-exam" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Evaluation - {examName || `Exam #${id}`}</h1>
            <p className="text-xs text-gray-500">{filtered.length} attempt{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            const csv = [["Student Name", "Admission No", "Class", "Section", "Roll No", "Gender", "Total", "Correct", "Wrong", "Score %", "Rank", "Submitted At"],
              ...filtered.map(a => [a.studentName, a.admissionNo || "", a.studentClass || "", a.studentSection || "", a.studentRollNo || "", a.studentGender || "", a.totalQuestions, a.correctAnswers, a.wrongAnswers, getScore(a).toFixed(1), getRank(getScore(a)), formatDate(a.submittedAt)])]
              .map(r => r.join(",")).join("\n")
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url; a.download = `evaluation-${id}.csv`; a.click()
            URL.revokeObjectURL(url)
          }} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button onClick={() => { setRankDraft(JSON.parse(JSON.stringify(rankSettings))); setRankModalOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="h-3.5 w-3.5" /> Rank Settings
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-gray-800">{filtered.length}</p>
          <p className="text-xs text-gray-500">Total Attempts</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-green-600">{passed}</p>
          <p className="text-xs text-gray-500">Passed (≥40%)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-red-500">{failed}</p>
          <p className="text-xs text-gray-500">Failed (&lt;40%)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-[var(--primary)]">{avgScore.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Average Score</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Search by name, admission no, or roll no..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
      </div>

      {/* Results table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Student Name", "Admission No", "Class", "Section", "Roll No", "Gender", "Total", "Correct", "Wrong", "Score %", "Rank", "Submitted At"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={13} className="text-center py-8 text-gray-400">No attempts yet</td></tr>
              ) : (
                paginated.map((a, i) => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{(page - 1) * rowsPerPage + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{a.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{a.admissionNo || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{a.studentClass || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{a.studentSection || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{a.studentRollNo || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{a.studentGender || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{a.totalQuestions}</td>
                    <td className="px-4 py-3"><span className="text-green-600 font-medium">{a.correctAnswers}</span></td>
                    <td className="px-4 py-3"><span className="text-red-500 font-medium">{a.wrongAnswers}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getScore(a) >= 40 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {getScore(a).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)] text-white text-sm font-bold">
                        {getRank(getScore(a))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(a.submittedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-xs text-gray-600 px-2">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
      {/* Rank Settings Modal */}
      {rankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRankModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Rank Settings</h2>
              <button onClick={() => setRankModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Set minimum score thresholds for each grade. Scores below the lowest threshold get rank <strong>E</strong>.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rankDraft.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="number" min={0} max={100} value={r.min}
                    onChange={e => { const v = [...rankDraft]; v[i] = { ...v[i], min: Number(e.target.value) }; setRankDraft(v) }}
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <span className="text-xs text-gray-500">% →</span>
                  <input value={r.label}
                    onChange={e => { const v = [...rankDraft]; v[i] = { ...v[i], label: e.target.value }; setRankDraft(v) }}
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <button onClick={() => setRankDraft(rankDraft.filter((_, j) => j !== i))}
                    className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setRankDraft([...rankDraft, { min: 0, label: "" }])}
              className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline mt-2">
              <Plus className="h-3.5 w-3.5" /> Add Grade
            </button>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => setRankModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={async () => {
                const clean = rankDraft.filter(r => r.label.trim()).map(r => ({ min: r.min, label: r.label.trim() }))
                await fetch("/api/settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ key: "exam_rank_settings", value: JSON.stringify(clean) }),
                })
                setRankSettings(clean)
                setRankModalOpen(false)
              }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)]">
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
