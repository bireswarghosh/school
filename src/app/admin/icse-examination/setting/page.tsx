"use client"

import { useState, useEffect, memo, useCallback } from "react"
import { Plus, Pencil, Trash2, X, Save, ChevronDown, ChevronRight, Copy } from "lucide-react"
import { useApi } from "@/lib/use-api"

type Term = { id: number; name: string; code: string; description: string }
type ObsParam = { id: number; name: string }
type AssessmentType = { id: number; type: string; code: string; maxMarks: number; passPercent: number; description: string }
type Assessment = { id: number; name: string; description: string; types: AssessmentType[] }
type GradeRow = { id: number; grade: string; minPercent: number; maxPercent: number; remarks: string }
type ExamGrade = { id: number; title: string; description: string; rows: GradeRow[] }

type Section = "term" | "obs-param" | "assessment" | "exam-grade" | "general"

type TypeRowData = { type: string; code: string; maxMarks: string; passPercent: string; description: string }

const TypeRowInputs = memo(function TypeRowInputs({
  value, idx, onFieldChange, onRowRemove, showRemove
}: {
  value: TypeRowData
  idx: number
  onFieldChange: (idx: number, field: string, val: string) => void
  onRowRemove: (idx: number) => void
  showRemove: boolean
}) {
  return (
    <div className="flex items-start gap-2 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <div><label className="block text-xs text-gray-500 mb-0.5">Type</label>
          <input type="text" value={value.type} onChange={(e) => onFieldChange(idx, "type", e.target.value)}
            placeholder="Theory/Practical" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs text-gray-500 mb-0.5">Code</label>
          <input type="text" value={value.code} onChange={(e) => onFieldChange(idx, "code", e.target.value)}
            placeholder="TH" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs text-gray-500 mb-0.5">Max Marks</label>
          <input type="number" value={value.maxMarks} onChange={(e) => onFieldChange(idx, "maxMarks", e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)]" /></div>
        <div><label className="block text-xs text-gray-500 mb-0.5">Pass %</label>
          <input type="number" value={value.passPercent} onChange={(e) => onFieldChange(idx, "passPercent", e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)]" /></div>
        <div className="sm:col-span-3 lg:col-span-1"><label className="block text-xs text-gray-500 mb-0.5">Description</label>
          <textarea value={value.description} onChange={(e) => onFieldChange(idx, "description", e.target.value)}
            placeholder="Desc" rows={2} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)] resize-none" /></div>
      </div>
      {showRemove && <button onClick={() => onRowRemove(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded mt-4 shrink-0"><X className="h-3.5 w-3.5" /></button>}
    </div>
  )
})

export default function IcseSettingPage() {
  const { data: terms, add: addTerm, update: updateTerm, remove: removeTerm } = useApi<Term>("/api/icse/terms")
  const { data: obsParams, add: addObsParam, update: updateObsParam, remove: removeObsParam } = useApi<ObsParam>("/api/icse/obs-params")
  const { data: assessments, add: addAssessment, update: updateAssessment, remove: removeAssessment } = useApi<Assessment>("/api/icse/assessments")
  const { data: examGrades, add: addExamGrade, update: updateExamGrade, remove: removeExamGrade } = useApi<ExamGrade>("/api/icse/exam-grades")
  const [activeSection, setActiveSection] = useState<Section>("general")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ general: true })

  const [passingPercent, setPassingPercent] = useState(33)
  const [usePractical, setUsePractical] = useState(true)
  const [useAttendance, setUseAttendance] = useState(true)
  const [autoRank, setAutoRank] = useState(true)
  const [resultType, setResultType] = useState("grade")
  const [saved, setSaved] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)

  const [showTermModal, setShowTermModal] = useState(false)
  const [showTermEditModal, setShowTermEditModal] = useState(false)
  const [showTermDeleteModal, setShowTermDeleteModal] = useState(false)
  const [termForm, setTermForm] = useState({ name: "", code: "", description: "" })
  const [termEditForm, setTermEditForm] = useState({ id: 0, name: "", code: "", description: "" })
  const [termDeleteId, setTermDeleteId] = useState<number | null>(null)

  const [showObsParamModal, setShowObsParamModal] = useState(false)
  const [showObsParamEditModal, setShowObsParamEditModal] = useState(false)
  const [showObsParamDeleteModal, setShowObsParamDeleteModal] = useState(false)
  const [obsParamForm, setObsParamForm] = useState({ name: "" })
  const [obsParamEditForm, setObsParamEditForm] = useState({ id: 0, name: "" })
  const [obsParamDeleteId, setObsParamDeleteId] = useState<number | null>(null)

  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [showAssessmentEditModal, setShowAssessmentEditModal] = useState(false)
  const [showAssessmentDeleteModal, setShowAssessmentDeleteModal] = useState(false)
  const [assessmentForm, setAssessmentForm] = useState({ name: "", description: "", types: [{ type: "", code: "", maxMarks: "", passPercent: "", description: "" }] })
  const [assessmentEditForm, setAssessmentEditForm] = useState({ id: 0, name: "", description: "", types: [{ type: "", code: "", maxMarks: "", passPercent: "", description: "" }] })
  const [assessmentDeleteId, setAssessmentDeleteId] = useState<number | null>(null)

  const [showGradeModal, setShowGradeModal] = useState(false)
  const [showGradeEditModal, setShowGradeEditModal] = useState(false)
  const [showGradeDeleteModal, setShowGradeDeleteModal] = useState(false)
  const [gradeForm, setGradeForm] = useState({ title: "", description: "", rows: [{ grade: "", minPercent: "", maxPercent: "", remarks: "" }] })
  const [gradeEditForm, setGradeEditForm] = useState({ id: 0, title: "", description: "", rows: [{ grade: "", minPercent: "", maxPercent: "", remarks: "" }] })
  const [gradeDeleteId, setGradeDeleteId] = useState<number | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleAddTypeFieldChange = useCallback((idx: number, field: string, val: string) => {
    setAssessmentForm((prev) => {
      const n = [...prev.types]
      n[idx] = { ...n[idx], [field]: val }
      return { ...prev, types: n }
    })
  }, [])

  const handleAddTypeRowRemove = useCallback((idx: number) => {
    setAssessmentForm((prev) => ({ ...prev, types: prev.types.filter((_, i) => i !== idx) }))
  }, [])

  const handleEditTypeFieldChange = useCallback((idx: number, field: string, val: string) => {
    setAssessmentEditForm((prev) => {
      const n = [...prev.types]
      n[idx] = { ...n[idx], [field]: val }
      return { ...prev, types: n }
    })
  }, [])

  const handleEditTypeRowRemove = useCallback((idx: number) => {
    setAssessmentEditForm((prev) => ({ ...prev, types: prev.types.filter((_, i) => i !== idx) }))
  }, [])

  useEffect(() => {
    fetch("/api/icse/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.passing_percent) setPassingPercent(Number(s.passing_percent))
        if (s.result_type) setResultType(s.result_type)
        if (s.use_practical === "true" || s.use_practical === "false") setUsePractical(s.use_practical === "true")
        if (s.use_attendance === "true" || s.use_attendance === "false") setUseAttendance(s.use_attendance === "true")
        if (s.auto_rank === "true" || s.auto_rank === "false") setAutoRank(s.auto_rank === "true")
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false))
  }, [])

  const toggleSection = (s: string) => {
    setExpandedSections((prev) => ({ ...prev, [s]: !prev[s] }))
    setActiveSection(s as Section)
  }

  const handleSave = async () => {
    try {
      await fetch("/api/icse/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passing_percent: String(passingPercent),
          result_type: resultType,
          use_practical: String(usePractical),
          use_attendance: String(useAttendance),
          auto_rank: String(autoRank),
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
  }

  const SectionToggle = ({ section, label }: { section: string; label: string }) => (
    <button onClick={() => toggleSection(section)} className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer hover:text-indigo-600 transition-colors">
      {expandedSections[section] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      {label}
    </button>
  )

  const Modal = useCallback(({ title, show, onClose, children, wide }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative bg-white rounded-xl shadow-2xl z-10 w-full mx-4 ${wide ? "max-w-2xl" : "max-w-lg"}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
          </div>
          {children}
        </div>
      </div>
    )
  }, [])

  const DeleteModal = useCallback(({ show, onClose, title, itemName, onConfirm }: { show: boolean; onClose: () => void; title: string; itemName: string; onConfirm: () => void }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-600">Are you sure you want to delete? <strong className="block mt-1 text-gray-800">{itemName}</strong></p>
          </div>
          <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"><X className="h-4 w-4" /> Cancel</button>
            <button onClick={onConfirm} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"><Trash2 className="h-4 w-4" /> Delete</button>
          </div>
        </div>
      </div>
    )
  }, [])

  const renderTermSection = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
        <SectionToggle section="term" label="Term Management" />
      </div>
      {expandedSections["term"] && (
        <>
          <div className="p-4 flex justify-end">
            <button onClick={() => { setTermForm({ name: "", code: "", description: "" }); setErrors({}); setShowTermModal(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--secondary)]"><Plus className="h-3.5 w-3.5" /> Add Term</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{["#", "Name", "Code", "Description", "Action"].map((h) => <th key={h} className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {terms.length === 0 ? <tr><td colSpan={5} className="text-center py-6 text-gray-400">No terms added</td></tr> : terms.map((t, i) => (
                  <tr key={t.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-2.5 text-gray-600">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{t.name}</td>
                    <td className="px-4 py-2.5"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-600">{t.code}</span></td>
                    <td className="px-4 py-2.5 text-gray-600">{t.description || "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => addTerm({ name: t.name, code: t.code, description: t.description }).catch(console.error)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setTermEditForm({ id: t.id, name: t.name, code: t.code, description: t.description }); setErrors({}); setShowTermEditModal(true) }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setTermDeleteId(t.id); setShowTermDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )

  const renderObsParamSection = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
        <SectionToggle section="obs-param" label="Observation Parameter" />
      </div>
      {expandedSections["obs-param"] && (
        <div className="flex flex-col lg:flex-row gap-4 p-4">
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="text-xs font-semibold text-gray-600 mb-3 uppercase">Add Parameter</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Parameter Name <span className="text-red-500">*</span></label>
                  <input type="text" value={obsParamForm.name} onChange={(e) => { setObsParamForm({ name: e.target.value }); setErrors({}) }} placeholder="Enter parameter name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                </div>
                <button onClick={() => {
                  if (!obsParamForm.name.trim()) { setErrors({ name: "Name is required" }); return }
                  addObsParam({ name: obsParamForm.name.trim() }).catch(console.error)
                  setObsParamForm({ name: "" })
                }} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--secondary)]"><Plus className="h-3.5 w-3.5" /> Save</button>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{["#", "Parameter Name", "Action"].map((h) => <th key={h} className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {obsParams.length === 0 ? <tr><td colSpan={3} className="text-center py-6 text-gray-400">No parameters added</td></tr> : obsParams.map((p, i) => (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-2.5 text-gray-600">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => { setObsParamEditForm({ id: p.id, name: p.name }); setShowObsParamEditModal(true) }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setObsParamDeleteId(p.id); setShowObsParamDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const renderAssessmentSection = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
        <SectionToggle section="assessment" label="Assessment" />
      </div>
      {expandedSections["assessment"] && (
        <>
          <div className="p-4 flex justify-end">
            <button onClick={() => { setAssessmentForm({ name: "", description: "", types: [{ type: "", code: "", maxMarks: "", passPercent: "", description: "" }] }); setErrors({}); setShowAssessmentModal(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--secondary)]"><Plus className="h-3.5 w-3.5" /> Add Assessment</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{["Assessment", "Assessment Description", "Assessment Type", "Action"].map((h) => <th key={h} className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {assessments.length === 0 ? <tr><td colSpan={4} className="text-center py-6 text-gray-400">No assessments added</td></tr> : assessments.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{a.name}</td>
                    <td className="px-4 py-2.5 text-gray-600 min-w-[180px]">{a.description || "—"}</td>
                    <td className="px-4 py-2.5 min-w-[300px]"><table className="w-full text-xs"><thead><tr className="border-b border-gray-200"><th className="text-left px-2 py-1 font-semibold text-gray-500">Type</th><th className="text-left px-2 py-1 font-semibold text-gray-500">Code</th><th className="text-left px-2 py-1 font-semibold text-gray-500">Max</th><th className="text-left px-2 py-1 font-semibold text-gray-500">Pass%</th><th className="text-left px-2 py-1 font-semibold text-gray-500">Description</th></tr></thead><tbody>{a.types.map((t, j) => (
                      <tr key={j} className="border-b border-gray-50 last:border-0"><td className="px-2 py-1 font-medium text-gray-800">{t.type}</td><td className="px-2 py-1"><span className="font-mono text-gray-500">{t.code}</span></td><td className="px-2 py-1 text-gray-600">{t.maxMarks}</td><td className="px-2 py-1 text-gray-600">{t.passPercent}%</td><td className="px-2 py-1 text-gray-500 italic">{t.description || "—"}</td></tr>
                    ))}</tbody></table></td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => addAssessment({ name: a.name, description: a.description, types: a.types.map((t) => ({ id: t.id, type: t.type, code: t.code, maxMarks: t.maxMarks, passPercent: t.passPercent, description: t.description })) }).catch(console.error)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setAssessmentEditForm({ id: a.id, name: a.name, description: a.description, types: a.types.map((t) => ({ ...t, maxMarks: String(t.maxMarks), passPercent: String(t.passPercent) } as any)) }); setErrors({}); setShowAssessmentEditModal(true) }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setAssessmentDeleteId(a.id); setShowAssessmentDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )

  const renderExamGradeSection = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
        <SectionToggle section="exam-grade" label="Exam Grade" />
      </div>
      {expandedSections["exam-grade"] && (
        <>
          <div className="p-4 flex justify-end">
            <button onClick={() => { setGradeForm({ title: "", description: "", rows: [{ grade: "", minPercent: "", maxPercent: "", remarks: "" }] }); setErrors({}); setShowGradeModal(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--secondary)]"><Plus className="h-3.5 w-3.5" /> Add Grade</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{["Grade Title", "Description", "Grade Details", "Action"].map((h) => <th key={h} className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {examGrades.length === 0 ? <tr><td colSpan={4} className="text-center py-6 text-gray-400">No exam grades added</td></tr> : examGrades.map((eg) => (
                  <tr key={eg.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{eg.title}</td>
                    <td className="px-4 py-2.5 text-gray-600 min-w-[160px]">{eg.description || "—"}</td>
                    <td className="px-4 py-2.5 min-w-[280px]"><table className="w-full text-xs"><thead><tr className="border-b border-gray-200"><th className="text-left px-2 py-1 font-semibold text-gray-500">Grade</th><th className="text-left px-2 py-1 font-semibold text-gray-500">Min%</th><th className="text-left px-2 py-1 font-semibold text-gray-500">Max%</th><th className="text-left px-2 py-1 font-semibold text-gray-500">Remarks</th></tr></thead><tbody>{eg.rows.map((r, j) => (
                      <tr key={j} className="border-b border-gray-50 last:border-0"><td className="px-2 py-1 font-medium text-gray-800">{r.grade}</td><td className="px-2 py-1 text-gray-600">{r.minPercent}%</td><td className="px-2 py-1 text-gray-600">{r.maxPercent}%</td><td className="px-2 py-1 text-gray-500 italic">{r.remarks || "—"}</td></tr>
                    ))}</tbody></table></td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => addExamGrade({ title: eg.title, description: eg.description, rows: eg.rows.map((r) => ({ id: r.id, grade: r.grade, minPercent: r.minPercent, maxPercent: r.maxPercent, remarks: r.remarks })) }).catch(console.error)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setGradeEditForm({ id: eg.id, title: eg.title, description: eg.description, rows: eg.rows.map((r) => ({ ...r, minPercent: String(r.minPercent), maxPercent: String(r.maxPercent) } as any)) }); setErrors({}); setShowGradeEditModal(true) }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setGradeDeleteId(eg.id); setShowGradeDeleteModal(true) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )

  const renderGeneralSection = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
        <SectionToggle section="general" label="General Settings" />
      </div>
      {expandedSections["general"] && (
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-700">Passing Percentage</p><p className="text-xs text-gray-400">Minimum percentage required to pass</p></div>
            <div className="flex items-center gap-2"><input type="number" value={passingPercent} onChange={(e) => setPassingPercent(parseInt(e.target.value) || 0)} className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-center" min="0" max="100" /><span className="text-sm text-gray-500">%</span></div></div>
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-700">Result Type</p><p className="text-xs text-gray-400">Choose grade or marks-based result</p></div>
            <select value={resultType} onChange={(e) => setResultType(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"><option value="grade">Grade Based</option><option value="marks">Marks Based</option></select></div>
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-700">Include Practical Marks</p><p className="text-xs text-gray-400">Include practical marks in total calculation</p></div>
            <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={usePractical} onChange={(e) => setUsePractical(e.target.checked)} className="sr-only peer" /><div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div></label></div>
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-700">Include Attendance</p><p className="text-xs text-gray-400">Track attendance for exam eligibility</p></div>
            <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={useAttendance} onChange={(e) => setUseAttendance(e.target.checked)} className="sr-only peer" /><div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div></label></div>
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-700">Auto Rank Generation</p><p className="text-xs text-gray-400">Automatically generate ranks after marks entry</p></div>
            <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={autoRank} onChange={(e) => setAutoRank(e.target.checked)} className="sr-only peer" /><div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div></label></div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Setting</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">ICSE Examination / Setting</p>
        </div>
      </div>

      {renderGeneralSection()}
      {renderTermSection()}
      {renderObsParamSection()}
      {renderAssessmentSection()}
      {renderExamGradeSection()}

      <div className="flex justify-end">
        <button onClick={handleSave}
          className={`flex items-center gap-1.5 px-6 py-2 text-sm font-medium rounded-lg transition-colors ${saved ? "bg-green-600 text-white" : "bg-[var(--primary)] text-white hover:bg-[var(--secondary)]"}`}>
          <Save className="h-4 w-4" /> {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      <Modal title="Add Term" show={showTermModal} onClose={() => setShowTermModal(false)}>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Term Name <span className="text-red-500">*</span></label>
            <input type="text" value={termForm.name} onChange={(e) => setTermForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Term 1" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" /></div>
          <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Code <span className="text-red-500">*</span></label>
            <input type="text" value={termForm.code} onChange={(e) => setTermForm((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. T1" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" /></div>
          <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Description</label>
            <textarea value={termForm.description} onChange={(e) => setTermForm((p) => ({ ...p, description: e.target.value }))} placeholder="Enter description" rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" /></div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowTermModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={() => {
            if (!termForm.name.trim() || !termForm.code.trim()) return
            addTerm({ name: termForm.name.trim(), code: termForm.code.trim(), description: termForm.description.trim() }).catch(console.error)
            setShowTermModal(false)
          }} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <Modal title="Edit Term" show={showTermEditModal} onClose={() => setShowTermEditModal(false)}>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Term Name <span className="text-red-500">*</span></label>
            <input type="text" value={termEditForm.name} onChange={(e) => setTermEditForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" /></div>
          <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Code <span className="text-red-500">*</span></label>
            <input type="text" value={termEditForm.code} onChange={(e) => setTermEditForm((p) => ({ ...p, code: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" /></div>
          <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Description</label>
            <textarea value={termEditForm.description} onChange={(e) => setTermEditForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" /></div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowTermEditModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={() => {
            if (!termEditForm.name.trim() || !termEditForm.code.trim()) return
            updateTerm(termEditForm.id, { name: termEditForm.name.trim(), code: termEditForm.code.trim(), description: termEditForm.description.trim() }).catch(console.error)
            setShowTermEditModal(false)
          }} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <DeleteModal show={showTermDeleteModal} onClose={() => setShowTermDeleteModal(false)} title="Confirm Delete" itemName={terms?.find((t) => t.id === termDeleteId)?.name || ""} onConfirm={() => { if (termDeleteId !== null) { removeTerm(termDeleteId).catch(console.error); setShowTermDeleteModal(false) } }} />

      <Modal title="Edit Observation Parameter" show={showObsParamEditModal} onClose={() => setShowObsParamEditModal(false)}>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Parameter Name <span className="text-red-500">*</span></label>
            <input type="text" value={obsParamEditForm.name} onChange={(e) => setObsParamEditForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" /></div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowObsParamEditModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={() => {
            if (!obsParamEditForm.name.trim()) return
            updateObsParam(obsParamEditForm.id, { name: obsParamEditForm.name.trim() }).catch(console.error)
            setShowObsParamEditModal(false)
          }} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <DeleteModal show={showObsParamDeleteModal} onClose={() => setShowObsParamDeleteModal(false)} title="Confirm Delete" itemName={obsParams?.find((p) => p.id === obsParamDeleteId)?.name || ""} onConfirm={() => { if (obsParamDeleteId !== null) { removeObsParam(obsParamDeleteId).catch(console.error); setShowObsParamDeleteModal(false) } }} />

      <Modal title="Add Assessment" show={showAssessmentModal} onClose={() => setShowAssessmentModal(false)} wide>
        <div className="px-6 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Assessment Name <span className="text-red-500">*</span></label>
              <input type="text" value={assessmentForm.name} onChange={(e) => setAssessmentForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Periodic Test 1" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" /></div>
            <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Description</label>
              <textarea value={assessmentForm.description} onChange={(e) => setAssessmentForm((p) => ({ ...p, description: e.target.value }))} placeholder="Enter description" rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" /></div>
          </div>
          <div><div className="flex items-center justify-between mb-2"><label className="text-xs font-medium text-gray-600">Assessment Types</label>
            <button onClick={() => setAssessmentForm((p) => ({ ...p, types: [...p.types, { type: "", code: "", maxMarks: "", passPercent: "", description: "" }] }))} className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"><Plus className="h-3 w-3" /> Add More</button></div>
            {assessmentForm.types.map((t, idx) => (
              <TypeRowInputs
                key={idx}
                idx={idx}
                value={t}
                onFieldChange={handleAddTypeFieldChange}
                onRowRemove={handleAddTypeRowRemove}
                showRemove={assessmentForm.types.length > 1}
              />
            ))}</div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowAssessmentModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={() => {
            if (!assessmentForm.name.trim()) return
            addAssessment({ name: assessmentForm.name.trim(), description: assessmentForm.description.trim(), types: assessmentForm.types.filter((t) => t.type.trim()).map((t, i) => ({ id: i + 1, type: t.type, code: t.code, maxMarks: parseInt(t.maxMarks) || 0, passPercent: parseInt(t.passPercent) || 0, description: t.description })) }).catch(console.error)
            setShowAssessmentModal(false)
          }} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <Modal title="Edit Assessment" show={showAssessmentEditModal} onClose={() => setShowAssessmentEditModal(false)} wide>
        <div className="px-6 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Assessment Name <span className="text-red-500">*</span></label>
              <input type="text" value={assessmentEditForm.name} onChange={(e) => setAssessmentEditForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" /></div>
            <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Description</label>
              <textarea value={assessmentEditForm.description} onChange={(e) => setAssessmentEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" /></div>
          </div>
          <div><div className="flex items-center justify-between mb-2"><label className="text-xs font-medium text-gray-600">Assessment Types</label>
            <button onClick={() => setAssessmentEditForm((p) => ({ ...p, types: [...p.types, { type: "", code: "", maxMarks: "", passPercent: "", description: "" }] }))} className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"><Plus className="h-3 w-3" /> Add More</button></div>
            {assessmentEditForm.types.map((t: any, idx: number) => (
              <TypeRowInputs
                key={idx}
                idx={idx}
                value={t}
                onFieldChange={handleEditTypeFieldChange}
                onRowRemove={handleEditTypeRowRemove}
                showRemove={assessmentEditForm.types.length > 1}
              />
            ))}</div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowAssessmentEditModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={() => {
            if (!assessmentEditForm.name.trim()) return
            updateAssessment(assessmentEditForm.id, { name: assessmentEditForm.name.trim(), description: assessmentEditForm.description.trim(), types: assessmentEditForm.types.filter((t: any) => t.type.trim()).map((t: any, i: number) => ({ id: i + 1, type: t.type, code: t.code, maxMarks: parseInt(t.maxMarks) || 0, passPercent: parseInt(t.passPercent) || 0, description: t.description })) }).catch(console.error)
            setShowAssessmentEditModal(false)
          }} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <DeleteModal show={showAssessmentDeleteModal} onClose={() => setShowAssessmentDeleteModal(false)} title="Confirm Delete" itemName={assessments?.find((a) => a.id === assessmentDeleteId)?.name || ""} onConfirm={() => { if (assessmentDeleteId !== null) { removeAssessment(assessmentDeleteId).catch(console.error); setShowAssessmentDeleteModal(false) } }} />

      <Modal title="Add Exam Grade" show={showGradeModal} onClose={() => setShowGradeModal(false)} wide>
        <div className="px-6 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Grade Title <span className="text-red-500">*</span></label>
              <input type="text" value={gradeForm.title} onChange={(e) => setGradeForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Primary Grades" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" /></div>
            <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Description</label>
              <textarea value={gradeForm.description} onChange={(e) => setGradeForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Enter description" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" /></div>
          </div>
          <div><div className="flex items-center justify-between mb-2"><label className="text-xs font-medium text-gray-600">Grade Rows</label>
            <button onClick={() => setGradeForm((p) => ({ ...p, rows: [...p.rows, { grade: "", minPercent: "", maxPercent: "", remarks: "" }] }))} className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"><Plus className="h-3 w-3" /> Add More</button></div>
            {gradeForm.rows.map((r, idx) => (
              <div key={idx} className="flex items-start gap-2 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <div><label className="block text-xs text-gray-500 mb-0.5">Grade</label><input type="text" value={r.grade} onChange={(e) => { const n = [...gradeForm.rows]; n[idx] = { ...n[idx], grade: e.target.value }; setGradeForm((p) => ({ ...p, rows: n })) }} placeholder="A+" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)]" /></div>
                  <div><label className="block text-xs text-gray-500 mb-0.5">Min %</label><input type="number" value={r.minPercent} onChange={(e) => { const n = [...gradeForm.rows]; n[idx] = { ...n[idx], minPercent: e.target.value }; setGradeForm((p) => ({ ...p, rows: n })) }} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)]" /></div>
                  <div><label className="block text-xs text-gray-500 mb-0.5">Max %</label><input type="number" value={r.maxPercent} onChange={(e) => { const n = [...gradeForm.rows]; n[idx] = { ...n[idx], maxPercent: e.target.value }; setGradeForm((p) => ({ ...p, rows: n })) }} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)]" /></div>
                  <div><label className="block text-xs text-gray-500 mb-0.5">Remarks</label><input type="text" value={r.remarks} onChange={(e) => { const n = [...gradeForm.rows]; n[idx] = { ...n[idx], remarks: e.target.value }; setGradeForm((p) => ({ ...p, rows: n })) }} placeholder="Outstanding" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)]" /></div>
                </div>
                {gradeForm.rows.length > 1 && <button onClick={() => setGradeForm((p) => ({ ...p, rows: p.rows.filter((_, i) => i !== idx) }))} className="p-1 text-red-500 hover:bg-red-50 rounded mt-4"><X className="h-3.5 w-3.5" /></button>}
              </div>
            ))}</div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowGradeModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={() => {
            if (!gradeForm.title.trim()) return
            addExamGrade({ title: gradeForm.title.trim(), description: gradeForm.description.trim(), rows: gradeForm.rows.filter((r) => r.grade.trim()).map((r, i) => ({ id: i + 1, grade: r.grade, minPercent: parseInt(r.minPercent) || 0, maxPercent: parseInt(r.maxPercent) || 0, remarks: r.remarks })) }).catch(console.error)
            setShowGradeModal(false)
          }} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <Modal title="Edit Exam Grade" show={showGradeEditModal} onClose={() => setShowGradeEditModal(false)} wide>
        <div className="px-6 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Grade Title <span className="text-red-500">*</span></label>
              <input type="text" value={gradeEditForm.title} onChange={(e) => setGradeEditForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" /></div>
            <div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Description</label>
              <textarea value={gradeEditForm.description} onChange={(e) => setGradeEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" /></div>
          </div>
          <div><div className="flex items-center justify-between mb-2"><label className="text-xs font-medium text-gray-600">Grade Rows</label>
            <button onClick={() => setGradeEditForm((p) => ({ ...p, rows: [...p.rows, { grade: "", minPercent: "", maxPercent: "", remarks: "" }] }))} className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"><Plus className="h-3 w-3" /> Add More</button></div>
            {gradeEditForm.rows.map((r: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <div><label className="block text-xs text-gray-500 mb-0.5">Grade</label><input type="text" value={r.grade} onChange={(e) => { const n = [...gradeEditForm.rows]; n[idx] = { ...n[idx], grade: e.target.value }; setGradeEditForm((p) => ({ ...p, rows: n })) }} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)]" /></div>
                  <div><label className="block text-xs text-gray-500 mb-0.5">Min %</label><input type="text" value={r.minPercent} onChange={(e) => { const n = [...gradeEditForm.rows]; n[idx] = { ...n[idx], minPercent: e.target.value }; setGradeEditForm((p) => ({ ...p, rows: n })) }} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)]" /></div>
                  <div><label className="block text-xs text-gray-500 mb-0.5">Max %</label><input type="text" value={r.maxPercent} onChange={(e) => { const n = [...gradeEditForm.rows]; n[idx] = { ...n[idx], maxPercent: e.target.value }; setGradeEditForm((p) => ({ ...p, rows: n })) }} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)]" /></div>
                  <div><label className="block text-xs text-gray-500 mb-0.5">Remarks</label><input type="text" value={r.remarks} onChange={(e) => { const n = [...gradeEditForm.rows]; n[idx] = { ...n[idx], remarks: e.target.value }; setGradeEditForm((p) => ({ ...p, rows: n })) }} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)]" /></div>
                </div>
                {gradeEditForm.rows.length > 1 && <button onClick={() => setGradeEditForm((p) => ({ ...p, rows: p.rows.filter((_, i) => i !== idx) }))} className="p-1 text-red-500 hover:bg-red-50 rounded mt-4"><X className="h-3.5 w-3.5" /></button>}
              </div>
            ))}</div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowGradeEditModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={() => {
            if (!gradeEditForm.title.trim()) return
            updateExamGrade(gradeEditForm.id, { title: gradeEditForm.title.trim(), description: gradeEditForm.description.trim(), rows: gradeEditForm.rows.filter((r: any) => r.grade.trim()).map((r: any, i: number) => ({ id: i + 1, grade: r.grade, minPercent: parseInt(r.minPercent) || 0, maxPercent: parseInt(r.maxPercent) || 0, remarks: r.remarks })) }).catch(console.error)
            setShowGradeEditModal(false)
          }} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)]"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <DeleteModal show={showGradeDeleteModal} onClose={() => setShowGradeDeleteModal(false)} title="Confirm Delete" itemName={examGrades?.find((g) => g.id === gradeDeleteId)?.title || ""} onConfirm={() => { if (gradeDeleteId !== null) { removeExamGrade(gradeDeleteId).catch(console.error); setShowGradeDeleteModal(false) } }} />
    </div>
  )
}
