"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useMemo, useEffect, useCallback } from "react"
import {
  Plus, Pencil, Trash2, X, Search, Eye, Upload, Download, ChevronLeft, ChevronRight, ChevronDown, RotateCcw, Save, Sparkles, Loader2, KeyRound, CheckCircle
} from "lucide-react"
import RichEditor from "@/components/rich-editor"

type Question = {
  id: number
  subject: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionE: string
  correctAnswer: string
  correctAnswers: string
  correctAnswerTrueFalse: string
  questionType: string
  questionLevel: string
  classId: number | null
  sectionId: number | null
  createdBy: number | null
  createdAt: string
  className: string
  sectionName: string
  subjectDisplay: string
  createdByName: string
}

type ClassItem = { id: number; name: string }
type SectionItem = { id: number; class_id: number; name: string }
type SubjectItem = { id: number; name: string; code: string }
type StaffItem = { id: number; name: string; staff_id: string }

const QUESTION_TYPES = [
  { value: "singlechoice", label: "Single Choice" },
  { value: "multichoice", label: "Multiple Choice" },
  { value: "true_false", label: "True/False" },
  { value: "descriptive", label: "Descriptive" },
]
const QUESTION_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

const OPTION_KEYS = ["A", "B", "C", "D", "E"] as const

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [staffList, setStaffList] = useState<StaffItem[]>([])

  const [filters, setFilters] = useState({
    class_id: "", section_id: "", subject: "", question_type: "", question_level: "", created_by: "", search: "",
  })
  const [appliedFilters, setAppliedFilters] = useState({ ...filters })
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)

  const AVAILABLE_PROVIDERS = [
    { id: "openai",     name: "OpenAI GPT-4o-mini",     free: false, keyHint: "sk-..." },
    { id: "gemini",     name: "Google Gemini 1.5 Flash", free: true,  keyHint: "AIza..." },
    { id: "groq",       name: "Groq Llama 3",            free: true,  keyHint: "gsk_..." },
    { id: "openrouter", name: "OpenRouter (Free models)", free: true,  keyHint: "sk-or-..." },
    { id: "deepseek",   name: "DeepSeek V3",             free: true,  keyHint: "sk-..." },
    { id: "mistral",    name: "Mistral AI",              free: true,  keyHint: "..." },
  ]

  const [showAiModal, setShowAiModal] = useState(false)
  const [aiForm, setAiForm] = useState({
    subject: "", questionType: "", questionLevel: "", classId: "", numQuestions: 5,
    schoolModel: "general", provider: "openai",
  })
  const [aiKeys, setAiKeys] = useState<Record<string, string>>({})
  const [aiKeyDirty, setAiKeyDirty] = useState(false)
  const [showManageKeys, setShowManageKeys] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiResult, setAiResult] = useState<{ success: boolean; count: number; message: string } | null>(null)
  const [savingKeys, setSavingKeys] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const emptyForm = {
    subject: "", question: "", optionA: "", optionB: "", optionC: "", optionD: "", optionE: "",
    correctAnswer: "", correctAnswers: "", correctAnswerTrueFalse: "",
    questionType: "", questionLevel: "", classId: "", sectionId: "", createdBy: "",
  }
  const [form, setForm] = useState({ ...emptyForm })
  const [editForm, setEditForm] = useState({ id: 0, ...emptyForm })

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(appliedFilters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await fetch(`/api/question-bank?${params.toString()}`)
      if (res.ok) setQuestions(await res.json())
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  useEffect(() => {
    fetch("/api/classes").then(r => r.ok && r.json()).then(setClasses).catch(() => {})
    fetch("/api/subjects").then(r => r.ok && r.json()).then(setSubjects).catch(() => {})
    fetch("/api/staff").then(r => r.ok && r.json()).then(setStaffList).catch(() => {})
  }, [])

  useEffect(() => {
    if (filters.class_id) {
      fetch(`/api/sections?class_id=${filters.class_id}`)
        .then(r => r.ok && r.json()).then(setSections).catch(() => {})
    } else {
      setSections([])
    }
  }, [filters.class_id])

  useEffect(() => {
    const cid = showAddModal ? form.classId : editForm.classId
    if (cid) {
      fetch(`/api/sections?class_id=${cid}`)
        .then(r => r.ok && r.json()).then(setSections).catch(() => {})
    } else {
      setSections([])
    }
  }, [form.classId, editForm.classId, showAddModal, showEditModal])

  useEffect(() => {
    if (showAiModal) {
      fetch("/api/ai/settings")
        .then(r => r.ok && r.json())
        .then(data => {
          if (data) {
            setAiForm(prev => ({ ...prev, provider: data.provider || "openai" }))
            setAiKeys({
              openai:     data.openai     || "",
              gemini:     data.gemini     || "",
              groq:       data.groq       || "",
              openrouter: data.openrouter || "",
              deepseek:   data.deepseek   || "",
              mistral:    data.mistral    || "",
            })
            setAiKeyDirty(false)
          }
        })
        .catch(() => {})
    }
  }, [showAiModal])

  const filteredQuestions = useMemo(() => {
    const kw = appliedFilters.search.toLowerCase().trim()
    if (!kw) return questions
    return questions.filter((q) =>
      q.question.toLowerCase().includes(kw) ||
      q.subjectDisplay?.toLowerCase().includes(kw) ||
      q.questionType?.toLowerCase().includes(kw) ||
      q.createdByName?.toLowerCase().includes(kw)
    )
  }, [questions, appliedFilters.search])

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / rowsPerPage))
  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return filteredQuestions.slice(start, start + rowsPerPage)
  }, [filteredQuestions, page, rowsPerPage])

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    if (name === "class_id") {
      setFilters(prev => ({ ...prev, section_id: "" }))
    }
  }

  const applyFilters = () => {
    setAppliedFilters({ ...filters })
    setPage(1)
  }

  const resetFilters = () => {
    const empty = { class_id: "", section_id: "", subject: "", question_type: "", question_level: "", created_by: "", search: "" }
    setFilters({ ...empty })
    setAppliedFilters({ ...empty })
    setPage(1)
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginated.map(q => q.id)))
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n })
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n })
  }

  const validateForm = (data: typeof form) => {
    const errs: Record<string, string> = {}
    if (!data.subject) errs.subject = "Subject is required"
    if (!data.questionType) errs.questionType = "Question Type is required"
    if (!data.questionLevel) errs.questionLevel = "Question Level is required"
    if (!data.question.trim()) errs.question = "Question is required"
    if (!data.classId) errs.classId = "Class is required"
    return errs
  }

  const buildPayload = (data: typeof form) => ({
    subject: data.subject,
    question: data.question.trim(),
    questionType: data.questionType,
    questionLevel: data.questionLevel,
    classId: data.classId ? parseInt(data.classId) : null,
    sectionId: data.sectionId ? parseInt(data.sectionId) : null,
    optionA: data.optionA.trim(),
    optionB: data.optionB.trim(),
    optionC: data.optionC.trim(),
    optionD: data.optionD.trim(),
    optionE: data.optionE.trim(),
    correctAnswer: data.correctAnswer,
    correctAnswers: data.correctAnswers,
    correctAnswerTrueFalse: data.correctAnswerTrueFalse,
    createdBy: data.createdBy ? parseInt(data.createdBy) : null,
  })

  const handleAdd = async () => {
    const errs = validateForm(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    await fetch("/api/question-bank", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(form)),
    })
    setShowAddModal(false)
    setForm({ ...emptyForm })
    await fetchQuestions()
  }

  const handleViewOpen = (q: Question) => {
    setViewQuestion(q)
    setShowViewModal(true)
  }

  const handleEditOpen = (q: Question) => {
    setEditForm({
      id: q.id,
      subject: q.subject,
      question: q.question,
      questionType: q.questionType,
      questionLevel: q.questionLevel,
      classId: q.classId?.toString() || "",
      sectionId: q.sectionId?.toString() || "",
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      optionE: q.optionE,
      correctAnswer: q.correctAnswer,
      correctAnswers: q.correctAnswers,
      correctAnswerTrueFalse: q.correctAnswerTrueFalse,
      createdBy: q.createdBy?.toString() || "",
    })
    setErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs = validateForm(editForm)
    setErrors(errs)
    if (Object.keys(errs).length) return
    await fetch("/api/question-bank", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editForm.id, ...buildPayload(editForm) }),
    })
    setShowEditModal(false)
    await fetchQuestions()
  }

  const handleDeleteOpen = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }
  const confirmDelete = async () => {
    if (deleteId === null) return
    await fetch(`/api/question-bank?id=${deleteId}`, { method: "DELETE" })
    setShowDeleteModal(false)
    setDeleteId(null)
    await fetchQuestions()
  }

  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return
    await fetch("/api/question-bank", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    })
    setSelectedIds(new Set())
    setShowBulkDeleteModal(false)
    await fetchQuestions()
  }

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formEl = e.currentTarget
    const formData = new FormData(formEl)
    const file = formData.get("file") as File
    if (!file) return notify.error("Please select a file")
    const text = await file.text()
    const lines = text.split("\n").filter(l => l.trim())
    if (lines.length < 2) return notify.error("CSV must have a header row and at least one data row")
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""))
    const records: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""))
      if (vals.length < 2) continue
      const rec: any = {}
      headers.forEach((h, idx) => { rec[h] = vals[idx] || "" })
      if (rec.question) {
        rec.questionType = rec.questionType || "singlechoice"
        rec.questionLevel = rec.questionLevel || "medium"
        if (rec.classId) rec.classId = parseInt(rec.classId)
        if (rec.sectionId) rec.sectionId = parseInt(rec.sectionId)
        records.push(rec)
      }
    }
    if (records.length === 0) return notify.error("No valid questions found")
    const res = await fetch("/api/question-bank", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(records),
    })
    if (!res.ok) return notify.error("Import failed")
    notify.success(`${records.length} questions imported successfully!`)
    setShowImportModal(false)
    formEl.reset()
    await fetchQuestions()
  }

  const exportCSV = () => {
    const cols = ["subject", "question", "questionType", "questionLevel", "classId", "sectionId", "optionA", "optionB", "optionC", "optionD", "optionE", "correctAnswer", "correctAnswers", "correctAnswerTrueFalse"]
    const csv = [
      cols.join(","),
      ...filteredQuestions.map(r =>
        cols.map(k => {
          const v = (r[k as keyof Question] ?? "").toString().replace(/"/g, '""')
          return `"${v}"`
        }).join(",")
      ),
    ].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "question-bank.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveAiKeys = async () => {
    setSavingKeys(true)
    try {
      const res = await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: aiKeys, provider: aiForm.provider }),
      })
      if (!res.ok) throw new Error("Failed to save keys")
      setAiKeyDirty(false)
      setAiResult({ success: true, count: 0, message: "API keys saved successfully!" })
    } catch (e: any) {
      setAiResult({ success: false, count: 0, message: e.message })
    } finally {
      setSavingKeys(false)
    }
  }

  const handleAiGenerate = async () => {
    if (!aiForm.subject || !aiForm.questionType || !aiForm.questionLevel || !aiForm.classId || !aiForm.numQuestions) {
      return notify.error("Please fill all fields")
    }
    // Save keys first if dirty
    if (aiKeyDirty) {
      await handleSaveAiKeys()
    }
    if (!aiKeys[aiForm.provider]) {
      return notify.error("No API key saved for this provider. Enter and save a key in the API Keys section below.")
    }
    setAiGenerating(true)
    setAiResult(null)
    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: aiForm.subject,
          questionType: aiForm.questionType,
          questionLevel: aiForm.questionLevel,
          classId: parseInt(aiForm.classId),
          numQuestions: aiForm.numQuestions,
          schoolModel: aiForm.schoolModel,
          provider: aiForm.provider,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiResult({ success: false, count: 0, message: data.error || "Generation failed" })
      } else {
        setAiResult({ success: true, count: data.count, message: `${data.count} questions generated and saved successfully!` })
        await fetchQuestions()
      }
    } catch (e: any) {
      setAiResult({ success: false, count: 0, message: e.message })
    } finally {
      setAiGenerating(false)
    }
  }

  const getQuestionTypeLabel = (val: string) => QUESTION_TYPES.find(t => t.value === val)?.label || val
  const getQuestionLevelLabel = (val: string) => QUESTION_LEVELS.find(t => t.value === val)?.label || val

  const showOptions = (qt: string) => qt && qt !== "descriptive"
  const isSingleChoice = (qt: string) => qt === "singlechoice"
  const isTrueFalse = (qt: string) => qt === "true_false"
  const isMultiChoice = (qt: string) => qt === "multichoice"

  const Modal = ({ title, show, onClose, children, size = "max-w-lg" }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode; size?: string }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative bg-white rounded-xl shadow-2xl z-10 w-full ${size} mx-4`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
          </div>
          {children}
        </div>
      </div>
    )
  }

  const handleRichChange = (field: string, value: string, onChange: (e: React.ChangeEvent<any>) => void) => {
    onChange({ target: { name: field, value } } as any)
  }

  const FormFields = ({ data, onChange }: { data: typeof form; onChange: (e: React.ChangeEvent<any>) => void }) => (
    <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Subject <span className="text-red-500">*</span></label>
          <select name="subject" value={data.subject} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
            <option value="">Select</option>
            {subjects.map(s => <option key={s.id} value={s.name}>{s.name} ({s.code})</option>)}
          </select>
          {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Question Type <span className="text-red-500">*</span></label>
          <select name="questionType" value={data.questionType} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
            <option value="">Select</option>
            {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {errors.questionType && <p className="text-red-500 text-xs mt-1">{errors.questionType}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Question Level <span className="text-red-500">*</span></label>
          <select name="questionLevel" value={data.questionLevel} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
            <option value="">Select</option>
            {QUESTION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          {errors.questionLevel && <p className="text-red-500 text-xs mt-1">{errors.questionLevel}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Class <span className="text-red-500">*</span></label>
          <select name="classId" value={data.classId} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
            <option value="">Select</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {data.classId && (
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Section</label>
            <select name="sectionId" value={data.sectionId} onChange={onChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
              <option value="">Select</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div className={`space-y-1 ${!data.classId ? "col-span-2" : ""}`}>
          <label className="block text-xs font-medium text-gray-600">Created By</label>
          <select name="createdBy" value={data.createdBy} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
            <option value="">Select</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.staff_id})</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">Question <span className="text-red-500">*</span></label>
        <RichEditor value={data.question} onChange={(val) => handleRichChange("question", val, onChange)} placeholder="Enter question" />
        {errors.question && <p className="text-red-500 text-xs mt-1">{errors.question}</p>}
      </div>

      {showOptions(data.questionType) && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {OPTION_KEYS.map(k => {
              const field = `option${k}` as keyof typeof data
              const required = (k === "A" || k === "B") && !isTrueFalse(data.questionType)
              return (
                <div key={k} className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">
                    Option {k} {required && <span className="text-red-500">*</span>}
                  </label>
                  <RichEditor value={data[field]} onChange={(val) => handleRichChange(field as string, val, onChange)} placeholder={`Option ${k}`} />
                </div>
              )
            })}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Answer <span className="text-red-500">*</span></label>
            {isSingleChoice(data.questionType) && (
              <select name="correctAnswer" value={data.correctAnswer} onChange={onChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {OPTION_KEYS.map(k => <option key={k} value={k}>Option {k}</option>)}
              </select>
            )}
            {isTrueFalse(data.questionType) && (
              <select name="correctAnswerTrueFalse" value={data.correctAnswerTrueFalse} onChange={onChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            )}
            {isMultiChoice(data.questionType) && (
              <div className="flex flex-wrap gap-4 pt-1">
                {OPTION_KEYS.map(k => {
                  const checked = data.correctAnswers?.split(",").includes(k)
                  return (
                    <label key={k} className="flex items-center gap-1.5 text-sm text-gray-700">
                      <input type="checkbox" checked={checked || false}
                        onChange={() => {
                          const current = data.correctAnswers ? data.correctAnswers.split(",").filter(Boolean) : []
                          const next = checked ? current.filter(v => v !== k) : [...current, k]
                          onChange({ target: { name: "correctAnswers", value: next.join(",") } } as any)
                        }}
                        className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                      {k}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Question Bank</h2>
          <p className="text-sm text-white/80 mt-0.5">Online Examinations / Question Bank</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Class</label>
              <select name="class_id" value={filters.class_id} onChange={handleFilterChange}
                className="h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[130px]">
                <option value="">Select</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Section</label>
              <select name="section_id" value={filters.section_id} onChange={handleFilterChange}
                className="h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[130px]">
                <option value="">Select</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Subject</label>
              <select name="subject" value={filters.subject} onChange={handleFilterChange}
                className="h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[130px]">
                <option value="">Select</option>
                {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Question Type</label>
              <select name="question_type" value={filters.question_type} onChange={handleFilterChange}
                className="h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[130px]">
                <option value="">Select</option>
                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Question Level</label>
              <select name="question_level" value={filters.question_level} onChange={handleFilterChange}
                className="h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[130px]">
                <option value="">Select</option>
                {QUESTION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Created By</label>
              <select name="created_by" value={filters.created_by} onChange={handleFilterChange}
                className="h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[130px]">
                <option value="">Select</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.staff_id})</option>)}
              </select>
            </div>
            <button onClick={applyFilters}
              className="h-9 px-4 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" /> Search
            </button>
            <button onClick={resetFilters}
              className="h-9 px-4 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> Bulk Delete ({selectedIds.size})
              </button>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input type="text" value={filters.search} onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") applyFilters() }}
                placeholder="Search questions..." className="w-48 h-9 pl-8 pr-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setAiResult(null); setShowAiModal(true) }}
              className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors">
              <Sparkles className="h-3.5 w-3.5" /> AI Quiz
            </button>
            <span className="w-px h-5 bg-gray-200" />
            <button onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Upload className="h-3.5 w-3.5" /> Import
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button onClick={() => { setForm({ ...emptyForm }); setErrors({}); setShowAddModal(true) }}
              className="flex items-center gap-1.5 h-9 px-4 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Question
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={paginated.length > 0 && selectedIds.size === paginated.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Q. ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Question Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Level</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Question</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Created By</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : filteredQuestions.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No questions found</td></tr>
              ) : (
                paginated.map((q, idx) => (
                  <tr key={q.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(q.id)} onChange={() => toggleSelect(q.id)}
                        className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{q.id}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {q.className}{q.sectionName ? ` (${q.sectionName})` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {q.subjectDisplay || q.subject}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{getQuestionTypeLabel(q.questionType)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        q.questionLevel === "low" ? "bg-green-100 text-green-700" :
                        q.questionLevel === "medium" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {getQuestionLevelLabel(q.questionLevel)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[250px] truncate">{q.question}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{q.createdByName}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewOpen(q)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleEditOpen(q)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteOpen(q.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
              className="border border-gray-300 rounded px-2 py-1 text-xs">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
          <span>Showing {filteredQuestions.length ? (page - 1) * rowsPerPage + 1 : 0}-{Math.min(page * rowsPerPage, filteredQuestions.length)} of {filteredQuestions.length} records</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {(() => {
                const pages: (number | string)[] = []
                if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages }
                pages.push(1)
                if (page > 3) pages.push("...")
                for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
                if (page < totalPages - 2) pages.push("...")
                pages.push(totalPages)
                return pages
              })().map((p, i) =>
                typeof p === "string"
                  ? <span key={`e${i}`} className="px-1 text-gray-400">...</span>
                  : <button key={p} onClick={() => setPage(p)}
                      className={`min-w-[28px] h-7 text-xs font-medium rounded-lg transition-colors ${page === p ? "bg-[var(--primary)] text-white" : "text-gray-600 hover:bg-gray-50 border border-transparent"}`}>{p}</button>
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal title="Add Question" show={showAddModal} onClose={() => setShowAddModal(false)} size="max-w-2xl">
        {FormFields({ data: form, onChange: handleFormChange })}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <Modal title="Edit Question" show={showEditModal} onClose={() => setShowEditModal(false)} size="max-w-2xl">
        {FormFields({ data: editForm, onChange: handleEditFormChange })}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleEditSave} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      {showViewModal && viewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowViewModal(false); setViewQuestion(null) }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Question Details</h3>
              <button onClick={() => { setShowViewModal(false); setViewQuestion(null) }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{viewQuestion.subjectDisplay || viewQuestion.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Question Type</p>
                  <p className="text-sm text-gray-700 mt-0.5">{getQuestionTypeLabel(viewQuestion.questionType)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Question Level</p>
                  <p className="text-sm text-gray-700 mt-0.5">{getQuestionLevelLabel(viewQuestion.questionLevel)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Class</p>
                  <p className="text-sm text-gray-700 mt-0.5">{viewQuestion.className || "—"}{viewQuestion.sectionName ? ` (${viewQuestion.sectionName})` : ""}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Question</p>
                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{viewQuestion.question}</p>
              </div>
              {viewQuestion.questionType !== "descriptive" && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Options & Answer</p>
                  <div className="space-y-1.5">
                    {(["A", "B", "C", "D", "E"] as const).map(k => {
                      const val = viewQuestion[`option${k}` as keyof Question] as string
                      if (!val) return null
                      const isCorrect = viewQuestion.questionType === "multichoice"
                        ? viewQuestion.correctAnswers?.split(",").includes(k)
                        : viewQuestion.questionType === "true_false"
                          ? false
                          : viewQuestion.correctAnswer === k
                      return (
                        <div key={k} className={`flex items-center gap-2 p-2 rounded-lg border ${isCorrect ? "border-green-300 bg-green-50" : "border-gray-200"}`}>
                          <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${isCorrect ? "bg-green-500 text-white" : "bg-gray-300 text-white"}`}>{k}</span>
                          <span className={`text-sm ${isCorrect ? "text-green-800 font-medium" : "text-gray-600"}`}>{val}</span>
                          {isCorrect && <span className="text-xs text-green-600 font-medium ml-auto">Correct</span>}
                        </div>
                      )
                    })}
                    {viewQuestion.questionType === "true_false" && (
                      <div className={`flex items-center gap-2 p-2 rounded-lg border ${viewQuestion.correctAnswerTrueFalse === "true" ? "border-green-300 bg-green-50" : "border-gray-200"}`}>
                        <span className="text-sm text-gray-600">True</span>
                        {viewQuestion.correctAnswerTrueFalse === "true" && <span className="text-xs text-green-600 font-medium ml-auto">Correct</span>}
                      </div>
                    )}
                    {viewQuestion.questionType === "true_false" && (
                      <div className={`flex items-center gap-2 p-2 rounded-lg border ${viewQuestion.correctAnswerTrueFalse === "false" ? "border-green-300 bg-green-50" : "border-gray-200"}`}>
                        <span className="text-sm text-gray-600">False</span>
                        {viewQuestion.correctAnswerTrueFalse === "false" && <span className="text-xs text-green-600 font-medium ml-auto">Correct</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</p>
                <p className="text-sm text-gray-700 mt-0.5">{viewQuestion.createdByName || "—"}</p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => { setShowViewModal(false); setViewQuestion(null) }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      <Modal title="AI Quiz Generator" show={showAiModal} onClose={() => setShowAiModal(false)} size="max-w-2xl">
        <div className="px-6 py-4 space-y-4">
          {/* Provider selector */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">AI Provider <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-2">
              <select value={aiForm.provider} onChange={e => setAiForm(p => ({ ...p, provider: e.target.value }))}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                {AVAILABLE_PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.free ? " (Free)" : " (Paid)"}
                  </option>
                ))}
              </select>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${aiKeys[aiForm.provider] ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {aiKeys[aiForm.provider] ? "Key saved" : "No key"}
              </span>
            </div>
          </div>

          {/* Manage API Keys */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button type="button" onClick={() => setShowManageKeys(!showManageKeys)}
              className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors">
              <span className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-gray-500" />
                Manage API Keys
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showManageKeys ? "rotate-180" : ""}`} />
            </button>
            {showManageKeys && (
              <div className="px-4 py-3 space-y-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">Enter API keys for each provider. Keys are saved to your server and reused automatically when you select a provider.</p>
                {AVAILABLE_PROVIDERS.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="w-36 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-600">{p.name}</span>
                      {p.free && <span className="ml-1 text-[10px] text-green-600 font-medium">Free</span>}
                    </div>
                    <input type="password" value={aiKeys[p.id] || ""}
                      onChange={e => { setAiKeys(prev => ({ ...prev, [p.id]: e.target.value })); setAiKeyDirty(true) }}
                      placeholder={p.keyHint}
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                    {aiKeys[p.id] ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> : <div className="h-4 w-4 flex-shrink-0" />}
                  </div>
                ))}
                <div className="flex justify-end pt-1">
                  <button onClick={handleSaveAiKeys} disabled={savingKeys || !aiKeyDirty}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50">
                    {savingKeys ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    {savingKeys ? "Saving..." : "Save All Keys"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Generation form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Subject <span className="text-red-500">*</span></label>
              <select value={aiForm.subject} onChange={e => setAiForm(p => ({ ...p, subject: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Question Type <span className="text-red-500">*</span></label>
              <select value={aiForm.questionType} onChange={e => setAiForm(p => ({ ...p, questionType: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Question Level <span className="text-red-500">*</span></label>
              <select value={aiForm.questionLevel} onChange={e => setAiForm(p => ({ ...p, questionLevel: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {QUESTION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Class <span className="text-red-500">*</span></label>
              <select value={aiForm.classId} onChange={e => setAiForm(p => ({ ...p, classId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Number of Questions <span className="text-red-500">*</span></label>
              <input type="number" min={1} max={50} value={aiForm.numQuestions}
                onChange={e => setAiForm(p => ({ ...p, numQuestions: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">School Model</label>
              <select value={aiForm.schoolModel} onChange={e => setAiForm(p => ({ ...p, schoolModel: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="general">General</option>
                <option value="cbse">CBSE</option>
                <option value="icsc">ICSE</option>
              </select>
            </div>
          </div>

          {aiResult && (
            <div className={`p-3 rounded-lg text-sm ${aiResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {aiResult.message}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowAiModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleAiGenerate} disabled={aiGenerating}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">
            {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {aiGenerating ? "Generating..." : "Generate"}
          </button>
        </div>
      </Modal>

      <Modal title="Import Questions" show={showImportModal} onClose={() => setShowImportModal(false)}>
        <form onSubmit={handleImport}>
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Subject <span className="text-red-500">*</span></label>
              <select name="subject" required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {subjects.map(s => <option key={s.id} value={s.name}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Class <span className="text-red-500">*</span></label>
              <select name="class_id" required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Section</label>
              <select name="section_id"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Attach File <span className="text-red-500">*</span></label>
              <input type="file" name="file" accept=".csv" required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[var(--primary)] file:text-white" />
              <p className="text-xs text-gray-400 mt-1">CSV format: subject, question, questionType, questionLevel, optionA, optionB, optionC, optionD, optionE, correctAnswer</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Upload className="h-4 w-4" /> Upload</button>
          </div>
        </form>
      </Modal>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5"><p className="text-sm text-gray-600">Are you sure you want to delete this question?</p></div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBulkDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Bulk Delete</h3>
              <button onClick={() => setShowBulkDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Are you sure you want to delete {selectedIds.size} selected questions?</p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowBulkDeleteModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={confirmBulkDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
