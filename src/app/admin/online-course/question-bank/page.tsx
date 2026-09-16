"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useMemo } from "react"
import { Search, Plus, Upload, Trash2, Pencil, X, Tag, Download, Check, ChevronDown } from "lucide-react"
import { useApi } from "@/lib/use-api"

type QuestionType = "Single Choice" | "Multiple Choice" | "True/False" | "Descriptive"
type QuestionLevel = "Low" | "Medium" | "High"
type QuestionTag = "Science" | "Economy" | "Web Design" | "Communication Skills" | "Programming" | "English" | "Hindi" | "Mathematics" | "Health And Life" | "Drawing" | "Robotics"

type Option = { label: string; value: string; correct: boolean }

type Question = {
  id: number
  questionTag: QuestionTag
  questionType: QuestionType
  level: QuestionLevel
  question: string
  createdBy: string
  options: Option[]
}

const tagOptions: QuestionTag[] = ["Science", "Economy", "Web Design", "Communication Skills", "Programming", "English", "Hindi", "Mathematics", "Health And Life", "Drawing", "Robotics"]
const typeOptions: QuestionType[] = ["Single Choice", "Multiple Choice", "True/False", "Descriptive"]
const levelOptions: QuestionLevel[] = ["Low", "Medium", "High"]
const createdByOptions = ["Joe Black", "Shivam Verma", "Jason Sharlton", "Nishant Khare", "Aman Verma"]



export default function QuestionBankPage() {
  const { data: questions, add, update, remove } = useApi<Question>("/api/online-course/question-bank")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [filterTag, setFilterTag] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterLevel, setFilterLevel] = useState("")
  const [filterCreatedBy, setFilterCreatedBy] = useState("")

  const [showAddTagModal, setShowAddTagModal] = useState(false)
  const [newTagName, setNewTagName] = useState("")

  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editQuestionId, setEditQuestionId] = useState<number | null>(null)
  const [qTag, setQTag] = useState<QuestionTag | "">("")
  const [qType, setQType] = useState<QuestionType | "">("")
  const [qLevel, setQLevel] = useState<QuestionLevel | "">("")
  const [qText, setQText] = useState("")
  const [qOptions, setQOptions] = useState<Option[]>([
    { label: "A", value: "", correct: false },
    { label: "B", value: "", correct: false },
    { label: "C", value: "", correct: false },
    { label: "D", value: "", correct: false },
  ])
  const [qErrors, setQErrors] = useState<Record<string, string>>({})

  const [showImportModal, setShowImportModal] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const [extraTags, setExtraTags] = useState<string[]>([])
  const allTagOptions = [...tagOptions, ...extraTags]

  const filtered = useMemo(() => {
    return (questions || []).filter((q) => {
      if (filterTag && q.questionTag !== filterTag) return false
      if (filterType && q.questionType !== filterType) return false
      if (filterLevel && q.level !== filterLevel) return false
      if (filterCreatedBy && q.createdBy !== filterCreatedBy) return false
      return true
    })
  }, [questions, filterTag, filterType, filterLevel, filterCreatedBy])

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filtered.map((q) => q.id) : [])
  }

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await remove(id)
    }
    setSelectedIds([])
  }

  const resetQuestionForm = () => {
    setQTag("")
    setQType("")
    setQLevel("")
    setQText("")
    setQOptions([
      { label: "A", value: "", correct: false },
      { label: "B", value: "", correct: false },
      { label: "C", value: "", correct: false },
      { label: "D", value: "", correct: false },
    ])
    setQErrors({})
    setEditQuestionId(null)
  }

  const handleAddQuestion = () => {
    resetQuestionForm()
    setShowQuestionModal(true)
  }

  const handleEditQuestion = (q: Question) => {
    setEditQuestionId(q.id)
    setQTag(q.questionTag ?? "")
    setQType(q.questionType ?? "")
    setQLevel(q.level ?? "")
    setQText(q.question)
    setQOptions(q.options?.length > 0 ? q.options : [
      { label: "A", value: "", correct: false },
      { label: "B", value: "", correct: false },
      { label: "C", value: "", correct: false },
      { label: "D", value: "", correct: false },
    ])
    setQErrors({})
    setShowQuestionModal(true)
  }

  const validateQuestionForm = () => {
    const errs: Record<string, string> = {}
    if (!qTag) errs.qTag = "Question tag is required"
    if (!qType) errs.qType = "Question type is required"
    if (!qLevel) errs.qLevel = "Question level is required"
    if (!qText.trim()) errs.qText = "Question text is required"
    if (qType === "Single Choice" || qType === "Multiple Choice") {
      const hasEmpty = qOptions.slice(0, 4).some((o) => !o.value.trim())
      if (hasEmpty) errs.qOptions = "All options must have a value"
      const hasCorrect = qOptions.slice(0, 4).some((o) => o.correct)
      if (!hasCorrect) errs.qCorrect = "Select at least one correct answer"
    }
    setQErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveQuestion = async () => {
    if (!validateQuestionForm()) return
    const tag = qTag as QuestionTag
    const type = qType as QuestionType
    const level = qLevel as QuestionLevel
    const opts = type === "Descriptive" ? [] : type === "True/False" ? qOptions.slice(0, 2) : qOptions.slice(0, 4)

    if (editQuestionId !== null) {
      await update(editQuestionId, { questionTag: tag, questionType: type, level, question: qText.trim(), createdBy: questions.find((q) => q.id === editQuestionId)?.createdBy || "Joe Black", options: opts })
    } else {
      await add({ questionTag: tag, questionType: type, level, question: qText.trim(), createdBy: "Joe Black", options: opts })
    }
    setShowQuestionModal(false)
    resetQuestionForm()
  }

  const handleDeleteQuestion = (id: number) => {
    setDeleteTargetId(id)
    setShowDeleteModal(true)
  }

  const confirmDeleteQuestion = async () => {
    if (deleteTargetId !== null) {
      await remove(deleteTargetId)
      setSelectedIds((prev) => prev.filter((x) => x !== deleteTargetId))
    }
    setShowDeleteModal(false)
    setDeleteTargetId(null)
  }

  const handleAddTag = () => {
    if (newTagName.trim() && !allTagOptions.includes(newTagName.trim())) {
      setExtraTags((prev) => [...prev, newTagName.trim()])
    }
    setNewTagName("")
    setShowAddTagModal(false)
  }

  const updateOption = (index: number, value: string) => {
    setQOptions((prev) => prev.map((o, i) => i === index ? { ...o, value } : o))
  }

  const toggleCorrect = (index: number) => {
    setQOptions((prev) => {
      if (qType === "Single Choice" || qType === "True/False") {
        return prev.map((o, i) => ({ ...o, correct: i === index }))
      }
      return prev.map((o, i) => i === index ? { ...o, correct: !o.correct } : o)
    })
  }

  const typeBadgeClass = (type: string) => {
    switch (type) {
      case "Single Choice": return "bg-blue-100 text-blue-800"
      case "Multiple Choice": return "bg-purple-100 text-purple-800"
      case "True/False": return "bg-green-100 text-green-800"
      case "Descriptive": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const levelBadgeClass = (level: string) => {
    switch (level) {
      case "Low": return "bg-green-100 text-green-800"
      case "Medium": return "bg-yellow-100 text-yellow-800"
      case "High": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-6 py-6 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Tag className="h-4 w-4 text-white" /></span>
              Question Bank
            </h2>
            <p className="text-sm text-white/80 mt-1">Online Course / Build your quiz question pool • {(questions || []).length} questions</p>
          </div>
          <span className="hidden md:inline-flex items-center gap-1.5 text-white/90 text-xs bg-white/15 backdrop-blur rounded-full px-3 py-1.5 border border-white/20"><Tag className="h-3.5 w-3.5" /> Questions</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Select Criteria
          </h3>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault() }}
          className="p-5"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Question Tag</label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Select</option>
                {allTagOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Question Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Select</option>
                {typeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Question Level</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Select</option>
                {levelOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Created By</label>
              <select
                value={filterCreatedBy}
                onChange={(e) => setFilterCreatedBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Select</option>
                {createdByOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddTagModal(true)}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Tag className="h-4 w-4" />
            Add Tag
          </button>
          <button
            onClick={handleAddQuestion}
            className="px-3 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Bulk Delete ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Q. ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Question Tag</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Question Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Level</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Question</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Created By</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">No questions found</td>
                </tr>
              ) : (
                filtered.map((q, idx) => (
                  <tr key={q.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(q.id)}
                        onChange={() => handleSelectOne(q.id)}
                        className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{q.id}</td>
                    <td className="px-4 py-3 text-gray-700">{q.questionTag}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadgeClass(q.questionType)}`}>
                        {q.questionType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${levelBadgeClass(q.level)}`}>
                        {q.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{q.question}</td>
                    <td className="px-4 py-3 text-gray-600">{q.createdBy}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditQuestion(q)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} of {questions?.length || 0} records</span>
        </div>
      </div>

      {showAddTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddTagModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Add Tag</h3>
              <button onClick={() => setShowAddTagModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tag Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowAddTagModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTag}
                className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowQuestionModal(false); resetQuestionForm() }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{editQuestionId !== null ? "Edit Question" : "Add Question"}</h3>
              <button onClick={() => { setShowQuestionModal(false); resetQuestionForm() }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Tag <span className="text-red-500">*</span>
                </label>
                <select
                  value={qTag ?? ""}
                  onChange={(e) => { setQTag(e.target.value as QuestionTag); if (qErrors.qTag) setQErrors((p) => ({ ...p, qTag: "" })) }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  <option value="">Select</option>
                  {allTagOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {qErrors.qTag && <p className="text-red-500 text-xs mt-1">{qErrors.qTag}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={qType ?? ""}
                  onChange={(e) => { setQType(e.target.value as QuestionType); if (qErrors.qType) setQErrors((p) => ({ ...p, qType: "" })); setQOptions(qOptions.map((o) => ({ ...o, correct: false }))) }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  <option value="">Select</option>
                  {typeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {qErrors.qType && <p className="text-red-500 text-xs mt-1">{qErrors.qType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={qLevel ?? ""}
                  onChange={(e) => { setQLevel(e.target.value as QuestionLevel); if (qErrors.qLevel) setQErrors((p) => ({ ...p, qLevel: "" })) }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  <option value="">Select</option>
                  {levelOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {qErrors.qLevel && <p className="text-red-500 text-xs mt-1">{qErrors.qLevel}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={qText}
                  onChange={(e) => { setQText(e.target.value); if (qErrors.qText) setQErrors((p) => ({ ...p, qText: "" })) }}
                  rows={3}
                  placeholder="Enter your question"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
                {qErrors.qText && <p className="text-red-500 text-xs mt-1">{qErrors.qText}</p>}
              </div>

              {qType && qType !== "Descriptive" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                    {qType === "Single Choice" && <span className="text-xs text-gray-500 ml-1">(select correct answer)</span>}
                    {qType === "Multiple Choice" && <span className="text-xs text-gray-500 ml-1">(select correct answers)</span>}
                  </label>
                  <div className="space-y-2">
                    {(qType === "True/False" ? qOptions.slice(0, 2) : qOptions.slice(0, 4)).map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {qType === "Single Choice" || qType === "True/False" ? (
                          <input
                            type="radio"
                            name="correct-option"
                            checked={opt.correct}
                            onChange={() => toggleCorrect(idx)}
                            className="text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={opt.correct}
                            onChange={() => toggleCorrect(idx)}
                            className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-600 w-6">{opt.label}.</span>
                        <input
                          type="text"
                          value={opt.value}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          placeholder={`Option ${opt.label}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                  {qErrors.qOptions && <p className="text-red-500 text-xs mt-1">{qErrors.qOptions}</p>}
                  {qErrors.qCorrect && <p className="text-red-500 text-xs mt-1">{qErrors.qCorrect}</p>}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowQuestionModal(false); resetQuestionForm() }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Import Questions</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">CSV files only</p>
                </div>
              </div>
              <button
                onClick={() => notify.success("Sample CSV downloaded")}
                className="text-sm text-[var(--primary)] hover:text-[var(--secondary)] flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download Sample CSV
              </button>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowImportModal(false); notify.success("Questions imported successfully!") }}
                className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this question?
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteQuestion}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
