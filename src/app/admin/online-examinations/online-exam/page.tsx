"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import {
  Plus, Pencil, Trash2, X, Save, Search, Upload, Download,
  ChevronLeft, ChevronRight, Check, List, Printer, HelpCircle, FileText, Newspaper, Database, BookOpen, Loader2,
} from "lucide-react"
import { useApi } from "@/lib/use-api"
import RichEditor from "@/components/rich-editor"

type OnlineExam = {
  id: number
  name: string
  duration: number
  totalQuestions: number
  attempts: number
  passPercentage: number
  description: string
  published: boolean
  subject: string
  examFrom: string
  examTo: string
  autoResultPublishDate: string
  answerWordLimit: number
  publishExam: boolean
  publishResult: boolean
  negativeMarking: boolean
  displayMarksInExam: boolean
  randomQuestionOrder: boolean
  isQuiz: boolean
}

type Question = {
  id: number
  examId: number
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionE: string
  correctAnswer: string
  correctAnswers: string
  correctAnswerTrueFalse: string
  subject: string
  questionType: string
  questionLevel: string
  classId: string
  sectionId: string
  createdBy: string
  bankId?: number
}

const subjects = ["Math", "Science", "English", "History", "Geography", "Computer"]

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

type BankQuestion = {
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
  className: string
  sectionName: string
}

const OPTION_KEYS = ["A", "B", "C", "D", "E"] as const

type ClassItem = { id: number; name: string }
type SectionItem = { id: number; class_id: number; name: string }
type SubjectItem = { id: number; name: string; code: string }
type StaffItem = { id: number; name: string; staff_id: string }

const tabs = ["Upcoming Exams", "Closed Exams"]

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
}

function formatDate(d: string) {
  if (!d) return "—"
  try {
    const dt = new Date(d)
    const mo = String(dt.getMonth() + 1).padStart(2, "0")
    const da = String(dt.getDate()).padStart(2, "0")
    const yr = dt.getFullYear()
    let h = dt.getHours()
    const ampm = h >= 12 ? "pm" : "am"
    h = h % 12 || 12
    const mi = String(dt.getMinutes()).padStart(2, "0")
    return `${mo}/${da}/${yr} ${h}:${mi} ${ampm}`
  } catch {
    return d
  }
}

export default function OnlineExamsPage() {
  const { data: exams, add: addExam, update: updateExam, remove: removeExam, refetch } = useApi<OnlineExam>("/api/online-exam")
  const [questions, setQuestions] = useState<Question[]>([])
  const [activeTab, setActiveTab] = useState("Upcoming Exams")
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const fileRef = useRef<HTMLInputElement>(null)
  const questionIdCounter = useRef(Date.now())
  const [selectAll, setSelectAll] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewExam, setViewExam] = useState<OnlineExam | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showQuestionsModal, setShowQuestionsModal] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)

  const [showBankBrowser, setShowBankBrowser] = useState(false)
  const [bankFilters, setBankFilters] = useState({ class_id: "", section_id: "", subject: "", question_type: "", question_level: "" })
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([])
  const [selectedBankIds, setSelectedBankIds] = useState<Set<number>>(new Set())
  const [loadingBank, setLoadingBank] = useState(false)
  const [bankClasses, setBankClasses] = useState<ClassItem[]>([])
  const [bankSubjects, setBankSubjects] = useState<SubjectItem[]>([])
  const [bankSections, setBankSections] = useState<SectionItem[]>([])

  const [showResultModal, setShowResultModal] = useState(false)
  const [resultExam, setResultExam] = useState<OnlineExam | null>(null)

  const [showPublicLinkModal, setShowPublicLinkModal] = useState(false)
  const [publicLinkExam, setPublicLinkExam] = useState<OnlineExam | null>(null)
  const [publicLinkData, setPublicLinkData] = useState<{ token: string; visit_count: number } | null>(null)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copied, setCopied] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState("")

  const emptyExamForm = { name: "", duration: "", totalQuestions: "0", attempts: "1", passPercentage: "40", description: "", published: false, subject: "", examFrom: "", examTo: "", autoResultPublishDate: "", answerWordLimit: "-1", publishExam: false, publishResult: false, negativeMarking: false, displayMarksInExam: false, randomQuestionOrder: false, isQuiz: false }
  const [examForm, setExamForm] = useState({ ...emptyExamForm })
  const [editExamForm, setEditExamForm] = useState({ id: 0, name: "", duration: "", totalQuestions: "0", attempts: "", passPercentage: "", description: "", published: false, subject: "", examFrom: "", examTo: "", autoResultPublishDate: "", answerWordLimit: "-1", publishExam: false, publishResult: false, negativeMarking: false, displayMarksInExam: false, randomQuestionOrder: false, isQuiz: false })

  const [addFormClasses, setAddFormClasses] = useState<ClassItem[]>([])
  const [addFormSubjects, setAddFormSubjects] = useState<SubjectItem[]>([])
  const [addFormSections, setAddFormSections] = useState<SectionItem[]>([])
  const [addFormStaff, setAddFormStaff] = useState<StaffItem[]>([])

  const emptyQuestionForm = {
    subject: "", questionType: "", questionLevel: "", classId: "", sectionId: "", createdBy: "",
    question: "", optionA: "", optionB: "", optionC: "", optionD: "", optionE: "",
    correctAnswer: "", correctAnswers: "", correctAnswerTrueFalse: "",
  }
  const [questionForm, setQuestionForm] = useState({ ...emptyQuestionForm })
  const [editQuestionId, setEditQuestionId] = useState<number | null>(null)
  const [qfErrors, setQfErrors] = useState<Record<string, string>>({})

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const now = useMemo(() => new Date(), [])

  const upcomingExams = useMemo(() => {
    return exams.filter((e) => {
      if (!e.examTo) return true
      return new Date(e.examTo) >= now
    })
  }, [exams, now])

  const closedExams = useMemo(() => {
    return exams.filter((e) => {
      if (!e.examTo) return false
      return new Date(e.examTo) < now
    })
  }, [exams, now])

  const activeExams = activeTab === "Upcoming Exams" ? upcomingExams : closedExams

  const filteredExams = useMemo(() => {
    const kw = keyword.toLowerCase().trim()
    return activeExams.filter((e) => {
      if (!kw) return true
      return (
        e.name.toLowerCase().includes(kw) ||
        e.description.toLowerCase().includes(kw)
      )
    })
  }, [activeExams, keyword])

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / rowsPerPage))
  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return filteredExams.slice(start, start + rowsPerPage)
  }, [filteredExams, page, rowsPerPage])

  const examQuestions = selectedExamId ? questions.filter((q) => q.examId === selectedExamId) : []
  const getExamName = (id: number) => exams.find((e) => e.id === id)?.name || ""

  const handleExamFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e as React.ChangeEvent<HTMLInputElement>).target.checked : undefined
    setExamForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const handleEditExamFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e as React.ChangeEvent<HTMLInputElement>).target.checked : undefined
    setEditExamForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const validateForm = (data: typeof examForm) => {
    const errs: Record<string, string> = {}
    if (!data.name.trim()) errs.name = "Exam name is required"
    if (!data.duration || parseInt(data.duration) <= 0) errs.duration = "Valid duration is required"
    if (!data.subject) errs.subject = "Subject is required"
    if (!data.examFrom) errs.examFrom = "Exam from date is required"
    if (!data.examTo) errs.examTo = "Exam to date is required"
    return errs
  }

  const resetAddForm = () => { setExamForm({ ...emptyExamForm }); setErrors({}) }

  const handleAddExam = async () => {
    const errs = validateForm(examForm)
    setErrors(errs)
    if (Object.keys(errs).length) return
    await addExam({
      name: examForm.name.trim(),
      duration: parseInt(examForm.duration),
      totalQuestions: 0,
      attempts: parseInt(examForm.attempts) || 1,
      passPercentage: parseInt(examForm.passPercentage) || 0,
      description: examForm.description.trim(),
      published: examForm.published,
      subject: examForm.subject,
      examFrom: examForm.examFrom,
      examTo: examForm.examTo,
      autoResultPublishDate: examForm.autoResultPublishDate || null,
      answerWordLimit: parseInt(examForm.answerWordLimit) || -1,
      publishExam: examForm.publishExam,
      publishResult: examForm.publishResult,
      negativeMarking: examForm.negativeMarking,
      displayMarksInExam: examForm.displayMarksInExam,
      randomQuestionOrder: examForm.randomQuestionOrder,
      isQuiz: examForm.isQuiz,
    })
    resetAddForm()
    setShowAddModal(false)
    showSuccess("Exam added successfully!")
  }

  const handleEditExamOpen = (exam: OnlineExam) => {
    setEditExamForm({
      id: exam.id,
      name: exam.name,
      duration: (exam.duration ?? 0).toString(),
      totalQuestions: (exam.totalQuestions ?? 0).toString(),
      attempts: (exam.attempts ?? 0).toString(),
      passPercentage: (exam.passPercentage ?? 0).toString(),
      description: exam.description,
      published: exam.published,
      subject: exam.subject,
      examFrom: exam.examFrom || "",
      examTo: exam.examTo || "",
      autoResultPublishDate: exam.autoResultPublishDate || "",
      answerWordLimit: (exam.answerWordLimit ?? -1).toString(),
      publishExam: exam.publishExam ?? false,
      publishResult: exam.publishResult ?? false,
      negativeMarking: exam.negativeMarking ?? false,
      displayMarksInExam: exam.displayMarksInExam ?? false,
      randomQuestionOrder: exam.randomQuestionOrder ?? false,
      isQuiz: exam.isQuiz ?? false,
    })
    setErrors({})
    setShowEditModal(true)
  }

  const handleEditExamSave = async () => {
    const errs = validateForm(editExamForm)
    setErrors(errs)
    if (Object.keys(errs).length) return
    await updateExam(editExamForm.id, {
      name: editExamForm.name.trim(),
      duration: parseInt(editExamForm.duration),
      attempts: parseInt(editExamForm.attempts) || 1,
      passPercentage: parseInt(editExamForm.passPercentage) || 0,
      description: editExamForm.description.trim(),
      published: editExamForm.published,
      subject: editExamForm.subject,
      examFrom: editExamForm.examFrom,
      examTo: editExamForm.examTo,
      autoResultPublishDate: editExamForm.autoResultPublishDate || null,
      answerWordLimit: parseInt(editExamForm.answerWordLimit) || -1,
      publishExam: editExamForm.publishExam,
      publishResult: editExamForm.publishResult,
      negativeMarking: editExamForm.negativeMarking,
      displayMarksInExam: editExamForm.displayMarksInExam,
      randomQuestionOrder: editExamForm.randomQuestionOrder,
      isQuiz: editExamForm.isQuiz,
    })
    setShowEditModal(false)
    showSuccess("Exam updated successfully!")
  }

  const handleDeleteExamOpen = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }
  const confirmDeleteExam = async () => {
    if (deleteId === null) return
    await removeExam(deleteId)
    setQuestions((prev) => prev.filter((q) => q.examId !== deleteId))
    setShowDeleteModal(false)
    setDeleteId(null)
    showSuccess("Exam deleted successfully!")
  }

  const openResultModal = (exam: OnlineExam) => {
    setResultExam(exam)
    setShowResultModal(true)
  }

  const openPublicLinkModal = async (exam: OnlineExam) => {
    setPublicLinkExam(exam)
    setCopied(false)
    setGeneratingLink(true)
    setShowPublicLinkModal(true)
    try {
      // Check existing link
      const res = await fetch(`/api/online-exam/public-link?exam_id=${exam.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setPublicLinkData(data)
          setGeneratingLink(false)
          return
        }
      }
      // Generate new link
      const res2 = await fetch("/api/online-exam/public-link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: exam.id }),
      })
      if (res2.ok) setPublicLinkData(await res2.json())
    } catch {}
    setGeneratingLink(false)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    for (const id of selectedIds) {
      await removeExam(id)
    }
    setSelectedIds(new Set())
    setSelectAll(false)
    showSuccess(`${selectedIds.size} exams deleted successfully!`)
    refetch()
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginated.map((e) => e.id)))
    }
    setSelectAll(!selectAll)
  }

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
    setSelectAll(next.size === paginated.length && paginated.length > 0)
  }

  const openQuestionsModal = async (examId: number) => {
    setSelectedExamId(examId)
    setShowQuestionForm(false)
    setEditQuestionId(null)
    setQuestionForm({ ...emptyQuestionForm })
    setQfErrors({})
    setShowQuestionsModal(true)
    // Load questions from DB
    try {
      const res = await fetch(`/api/exam-questions?exam_id=${examId}`)
      if (res.ok) {
        const dbQuestions = await res.json()
        if (dbQuestions.length > 0) {
          setQuestions(prev => {
            const existing = new Map(prev.map(q => [q.bankId || q.id, q]))
            for (const dq of dbQuestions) {
              const key = dq.id
              if (!existing.has(key)) {
                const newId = ++questionIdCounter.current
                existing.set(key, {
                  id: newId, examId,
                  question: dq.question,
                  optionA: dq.optionA || "",
                  optionB: dq.optionB || "",
                  optionC: dq.optionC || "",
                  optionD: dq.optionD || "",
                  optionE: dq.optionE || "",
                  correctAnswer: dq.correctAnswer || "",
                  correctAnswers: dq.correctAnswers || "",
                  correctAnswerTrueFalse: dq.correctAnswerTrueFalse || "",
                  subject: dq.subject || "",
                  questionType: dq.questionType || "",
                  questionLevel: dq.questionLevel || "",
                  classId: dq.classId?.toString() || "",
                  sectionId: dq.sectionId?.toString() || "",
                  createdBy: dq.createdBy?.toString() || "",
                  bankId: dq.id,
                })
              }
            }
            return Array.from(existing.values())
          })
        }
      }
    } catch {}
  }

  const openBankBrowser = () => {
    setSelectedBankIds(new Set())
    setBankFilters({ class_id: "", section_id: "", subject: "", question_type: "", question_level: "" })
    setBankQuestions([])
    setShowBankBrowser(true)
  }

  const handleBankFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setBankFilters(prev => ({ ...prev, [name]: value }))
    if (name === "class_id") setBankFilters(prev => ({ ...prev, section_id: "" }))
  }

  const fetchBankQuestions = async () => {
    setLoadingBank(true)
    try {
      const params = new URLSearchParams()
      Object.entries(bankFilters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await fetch(`/api/question-bank?${params.toString()}`)
      if (res.ok) setBankQuestions(await res.json())
      else setBankQuestions([])
    } finally {
      setLoadingBank(false)
    }
  }

  const addSelectedBankQuestions = async () => {
    const examId = selectedExamId!
    const toAdd = bankQuestions.filter(q => selectedBankIds.has(q.id))
    const exam = exams.find(e => e.id === examId)
    const newIds: Question[] = []
    for (const bq of toAdd) {
      const newId = ++questionIdCounter.current
      const q: Question = {
        id: newId,
        examId,
        question: bq.question,
        optionA: bq.optionA || "",
        optionB: bq.optionB || "",
        optionC: bq.optionC || "",
        optionD: bq.optionD || "",
        optionE: bq.optionE || "",
        correctAnswer: bq.correctAnswer || "",
        correctAnswers: bq.correctAnswers || "",
        correctAnswerTrueFalse: bq.correctAnswerTrueFalse || "",
        subject: bq.subject || "",
        questionType: bq.questionType || "",
        questionLevel: bq.questionLevel || "",
        classId: (bq as any).classId?.toString() || "",
        sectionId: (bq as any).sectionId?.toString() || "",
        createdBy: (bq as any).createdBy?.toString() || "",
        bankId: bq.id,
      }
      newIds.push(q)
    }

    // Persist links to DB
    try {
      await fetch("/api/exam-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: examId, question_ids: toAdd.map(q => q.id) }),
      })
    } catch {}

    setQuestions(prev => [...prev, ...newIds])
    if (exam) {
      const tq = (exam.totalQuestions ?? 0) + newIds.length
      await updateExam(examId, { totalQuestions: tq })
      refetch()
    }
    setShowBankBrowser(false)
    setSelectedBankIds(new Set())
  }

  useEffect(() => {
    fetch("/api/classes").then(r => r.ok && r.json()).then(setBankClasses).catch(() => {})
    fetch("/api/subjects").then(r => r.ok && r.json()).then(setBankSubjects).catch(() => {})
  }, [])

  useEffect(() => {
    if (bankFilters.class_id) {
      fetch(`/api/sections?class_id=${bankFilters.class_id}`)
        .then(r => r.ok && r.json()).then(setBankSections).catch(() => {})
    } else {
      setBankSections([])
    }
  }, [bankFilters.class_id])

  // Load add form data
  useEffect(() => {
    fetch("/api/classes").then(r => r.ok && r.json()).then(setAddFormClasses).catch(() => {})
    fetch("/api/subjects").then(r => r.ok && r.json()).then(setAddFormSubjects).catch(() => {})
    fetch("/api/staff").then(r => r.ok && r.json()).then(setAddFormStaff).catch(() => {})
  }, [])

  useEffect(() => {
    if (questionForm.classId) {
      fetch(`/api/sections?class_id=${questionForm.classId}`)
        .then(r => r.ok && r.json()).then(setAddFormSections).catch(() => {})
    } else {
      setAddFormSections([])
    }
  }, [questionForm.classId])

  const handleRichChange = (field: string, val: string) => {
    setQuestionForm((prev) => ({ ...prev, [field]: val }))
    if (qfErrors[field]) setQfErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  const handleQuestionFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setQuestionForm((prev) => ({ ...prev, [name]: value }))
    if (qfErrors[name]) setQfErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const validateQf = () => {
    const errs: Record<string, string> = {}
    if (!questionForm.subject) errs.subject = "Required"
    if (!questionForm.question.trim()) errs.question = "Required"
    if (!questionForm.questionType) errs.questionType = "Required"
    if (!questionForm.questionLevel) errs.questionLevel = "Required"
    if (!questionForm.classId) errs.classId = "Required"
    const needsOptions = questionForm.questionType && questionForm.questionType !== "descriptive"
    if (needsOptions) {
      if (!questionForm.optionA.trim()) errs.optionA = "Required"
      if (!questionForm.optionB.trim()) errs.optionB = "Required"
      if (questionForm.questionType === "singlechoice" && !questionForm.correctAnswer) errs.correctAnswer = "Required"
      if (questionForm.questionType === "true_false" && !questionForm.correctAnswerTrueFalse) errs.correctAnswerTrueFalse = "Required"
    }
    setQfErrors(errs)
    return Object.keys(errs).length === 0
  }

  const addOrEditQuestion = async () => {
    if (!validateQf()) return
    const examId = selectedExamId!

    if (editQuestionId !== null) {
      setQuestions((prev) => prev.map((q) =>
        q.id === editQuestionId ? { ...q,
          question: questionForm.question,
          optionA: questionForm.optionA,
          optionB: questionForm.optionB,
          optionC: questionForm.optionC,
          optionD: questionForm.optionD,
          optionE: questionForm.optionE,
          correctAnswer: questionForm.correctAnswer,
          correctAnswers: questionForm.correctAnswers,
          correctAnswerTrueFalse: questionForm.correctAnswerTrueFalse,
        } : q
      ))
    } else {
      // Save to question bank
      const payload = {
        subject: questionForm.subject,
        question: questionForm.question.trim(),
        questionType: questionForm.questionType,
        questionLevel: questionForm.questionLevel,
        classId: questionForm.classId ? parseInt(questionForm.classId) : null,
        sectionId: questionForm.sectionId ? parseInt(questionForm.sectionId) : null,
        optionA: questionForm.optionA.trim(),
        optionB: questionForm.optionB.trim(),
        optionC: questionForm.optionC.trim(),
        optionD: questionForm.optionD.trim(),
        optionE: questionForm.optionE.trim(),
        correctAnswer: questionForm.correctAnswer,
        correctAnswers: questionForm.correctAnswers,
        correctAnswerTrueFalse: questionForm.correctAnswerTrueFalse,
        createdBy: questionForm.createdBy ? parseInt(questionForm.createdBy) : null,
      }
      const res = await fetch("/api/question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      let bankId: number | null = null
      if (res.ok) {
        const created = await res.json()
        bankId = created.id
        // Link to exam in junction table
        try {
          await fetch("/api/exam-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ exam_id: examId, question_ids: [created.id] }),
          })
        } catch {}
      }

      // Add to local exam questions
      const newId = ++questionIdCounter.current
      setQuestions((prev) => [...prev, {
        id: newId, examId,
        question: questionForm.question,
        optionA: questionForm.optionA,
        optionB: questionForm.optionB,
        optionC: questionForm.optionC,
        optionD: questionForm.optionD,
        optionE: questionForm.optionE,
        correctAnswer: questionForm.correctAnswer,
        correctAnswers: questionForm.correctAnswers,
        correctAnswerTrueFalse: questionForm.correctAnswerTrueFalse,
        subject: questionForm.subject,
        questionType: questionForm.questionType,
        questionLevel: questionForm.questionLevel,
        classId: questionForm.classId,
        sectionId: questionForm.sectionId,
        createdBy: questionForm.createdBy,
        bankId: bankId || undefined,
      }])
      const exam = exams.find((e) => e.id === examId)
      if (exam) {
        const tq = (exam.totalQuestions ?? 0) + 1
        await updateExam(examId, { totalQuestions: tq })
        refetch()
      }
    }
    setQuestionForm({ ...emptyQuestionForm })
    setEditQuestionId(null)
    setShowQuestionForm(false)
    setQfErrors({})
  }

  const editQuestion = (q: Question) => {
    setQuestionForm({
      subject: q.subject || "",
      questionType: q.questionType || "",
      questionLevel: q.questionLevel || "",
      classId: q.classId || "",
      sectionId: q.sectionId || "",
      createdBy: q.createdBy || "",
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      optionE: q.optionE || "",
      correctAnswer: q.correctAnswer,
      correctAnswers: q.correctAnswers || "",
      correctAnswerTrueFalse: q.correctAnswerTrueFalse || "",
    })
    setEditQuestionId(q.id)
    setShowQuestionForm(true)
  }

  const deleteQuestion = async (id: number) => {
    const q = questions.find((x) => x.id === id)
    if (q) {
      setQuestions((prev) => prev.filter((x) => x.id !== id))
      if (q.bankId) {
        try {
          await fetch("/api/exam-questions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ exam_id: q.examId, question_id: q.bankId }),
          })
        } catch {}
      }
      const exam = exams.find((e) => e.id === q.examId)
      if (exam) {
        const tq = Math.max(0, (exam.totalQuestions ?? 0) - 1)
        await updateExam(q.examId, { totalQuestions: tq })
        refetch()
      }
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) return notify.error("CSV must have a header row and at least one data row")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
    const records: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      if (vals.length < 2) continue
      const rec: any = { totalQuestions: 0, attempts: 1, passPercentage: 0, published: false, answerWordLimit: -1, publishExam: false, publishResult: false, negativeMarking: false, displayMarksInExam: false, randomQuestionOrder: false, isQuiz: false }
      headers.forEach((h, idx) => { rec[h] = vals[idx] || "" })
      if (rec.name) records.push(rec)
    }
    if (records.length === 0) return notify.error("No valid exams found in CSV")
    const res = await fetch("/api/online-exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(records),
    })
    if (!res.ok) return notify.error("Import failed")
    notify.success(`${records.length} exams imported successfully!`)
    if (fileRef.current) fileRef.current.value = ""
    refetch()
  }

  const exportCSV = () => {
    const cols = ["name", "duration", "totalQuestions", "attempts", "passPercentage", "description", "published", "examFrom", "examTo", "autoResultPublishDate", "answerWordLimit", "publishExam", "publishResult", "negativeMarking", "displayMarksInExam", "randomQuestionOrder", "isQuiz"]
    const csv = [
      cols.join(","),
      ...filteredExams.map((r) =>
        cols.map((k) => {
          let v = (r[k as keyof OnlineExam] ?? "").toString()
          if (typeof v === "boolean") v = v ? "Yes" : "No"
          return `"${v.replace(/"/g, '""')}"`
        }).join(",")
      ),
    ].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    downloadBlob(blob, "online-exams.csv")
  }

  const Modal = ({ title, show, onClose, children, wide }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative bg-white rounded-xl shadow-2xl z-10 w-full mx-4 ${wide ? "max-w-4xl" : "max-w-lg"}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
          </div>
          {children}
        </div>
      </div>
    )
  }

  const renderTable = () => (
    <div>
      <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
              placeholder="Search exams..." className="w-48 h-9 pl-8 pr-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedIds.size})
            </button>
          )}
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left">
                <input type="checkbox" checked={selectAll} onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Exam</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Quiz Questions</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Attempt</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Exam From</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Exam To</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Duration</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Exam Published</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Result Published</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Description</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={12} className="text-center py-8 text-gray-400">No exams found</td></tr>
            ) : (
              paginated.map((exam, idx) => (
                <tr key={exam.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(exam.id)} onChange={() => toggleSelect(exam.id)}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{(page - 1) * rowsPerPage + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{exam.name}</td>
                  <td className="px-4 py-3">
                    {exam.isQuiz ? (
                      <span className="text-green-600" title="Yes"><Check className="h-4 w-4" /></span>
                    ) : (
                      <span className="text-red-400" title="No"><X className="h-4 w-4" /></span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {exam.totalQuestions ?? 0}
                    <br /><span className="text-[11px] text-gray-400">(Descriptive:0)</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-nowrap">{formatDate(exam.examFrom)}</td>
                  <td className="px-4 py-3 text-gray-600 text-nowrap">{formatDate(exam.examTo)}</td>
                  <td className="px-4 py-3 text-gray-600 text-nowrap">{formatDuration(exam.duration)}</td>
                  <td className="px-4 py-3">
                    {exam.publishExam ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-400" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {exam.publishResult ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-400" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate" title={exam.description}>
                    {exam.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => window.print()} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Print"><Printer className="h-4 w-4" /></button>
                      <button onClick={() => openQuestionsModal(exam.id)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Add Question"><Plus className="h-4 w-4" /></button>
                      <button onClick={() => handleEditExamOpen(exam)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit Exam"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => openQuestionsModal(exam.id)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Exam Questions List"><FileText className="h-4 w-4" /></button>
                      <a href={`/admin/online-examinations/online-exam/evaluation/${exam.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex" title="Exam Evaluation"><Newspaper className="h-4 w-4" /></a>
                      <button onClick={() => openResultModal(exam)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="View Result"><Check className="h-4 w-4" /></button>
                      <button onClick={() => openPublicLinkModal(exam)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Generate Public Link"><Upload className="h-4 w-4" /></button>
                      {activeTab === "Closed Exams" && (
                        <button onClick={() => window.open(`/admin/online-examinations/online-exam/rank/${exam.id}`)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Generate Rank"><List className="h-4 w-4" /></button>
                      )}
                      <button onClick={() => handleDeleteExamOpen(exam.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
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
          <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
            className="border border-gray-300 rounded px-2 py-1 text-xs">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>
        {filteredExams.length > 0 && (
          <span>Showing {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filteredExams.length)} of {filteredExams.length} records</span>
        )}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
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
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-colors">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Online Exam List</h2>
            <p className="text-sm text-white/80 mt-0.5">Online Examinations / Online Exam</p>
          </div>
          <button onClick={() => { resetAddForm(); setShowAddModal(true) }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-[var(--primary)] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Exam
          </button>
        </div>
      </div>

      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setKeyword(""); setPage(1); setSelectedIds(new Set()); setSelectAll(false) }}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? "text-[var(--primary)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                {tab === "Upcoming Exams" ? <List className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {tab}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-gray-100 text-gray-500"
                }`}>
                  {tab === "Upcoming Exams" ? upcomingExams.length : closedExams.length}
                </span>
              </span>
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          ))}
        </div>

        {renderTable()}
      </div>

      <Modal title="Add Exam" show={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam Title <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={examForm.name} onChange={handleExamFormChange} placeholder="Enter exam title"
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Subject <span className="text-red-500">*</span></label>
              <select name="subject" value={examForm.subject} onChange={handleExamFormChange}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam From <span className="text-red-500">*</span></label>
              <input type="datetime-local" name="examFrom" value={examForm.examFrom} onChange={handleExamFormChange}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.examFrom && <p className="text-red-500 text-xs mt-1">{errors.examFrom}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam To <span className="text-red-500">*</span></label>
              <input type="datetime-local" name="examTo" value={examForm.examTo} onChange={handleExamFormChange}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.examTo && <p className="text-red-500 text-xs mt-1">{errors.examTo}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Auto Result Publish Date</label>
              <input type="date" name="autoResultPublishDate" value={examForm.autoResultPublishDate} onChange={handleExamFormChange}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Time Duration (mins) <span className="text-red-500">*</span></label>
              <input type="number" name="duration" value={examForm.duration} onChange={handleExamFormChange} placeholder="60"
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Attempt <span className="text-red-500">*</span></label>
              <input type="number" name="attempts" value={examForm.attempts} onChange={handleExamFormChange} placeholder="1"
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Passing Percentage <span className="text-red-500">*</span></label>
              <input type="number" name="passPercentage" value={examForm.passPercentage} onChange={handleExamFormChange} placeholder="40"
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Answer Word Limit <span className="text-red-500">*</span></label>
            <input type="number" name="answerWordLimit" value={examForm.answerWordLimit} onChange={handleExamFormChange} placeholder="-1"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            <p className="text-[11px] text-gray-400 mt-0.5">Set -1 For No Limit</p>
          </div>
          <div className="flex flex-wrap items-center gap-5 pt-1">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="isQuiz" checked={examForm.isQuiz} onChange={handleExamFormChange}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Quiz
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="publishExam" checked={examForm.publishExam} onChange={handleExamFormChange}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Publish Exam
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="publishResult" checked={examForm.publishResult} onChange={handleExamFormChange}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Publish Result
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="negativeMarking" checked={examForm.negativeMarking} onChange={handleExamFormChange}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Negative Marking
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="displayMarksInExam" checked={examForm.displayMarksInExam} onChange={handleExamFormChange}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Display Marks In Exam
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="randomQuestionOrder" checked={examForm.randomQuestionOrder} onChange={handleExamFormChange}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Random Question Order
            </label>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Description <span className="text-red-500">*</span></label>
            <textarea name="description" value={examForm.description} onChange={handleExamFormChange} placeholder="Enter description" rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleAddExam} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <Modal title="Edit Exam" show={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam Title <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={editExamForm.name} onChange={handleEditExamFormChange}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Subject <span className="text-red-500">*</span></label>
              <select name="subject" value={editExamForm.subject} onChange={handleEditExamFormChange}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam From <span className="text-red-500">*</span></label>
              <input type="datetime-local" name="examFrom" value={editExamForm.examFrom} onChange={handleEditExamFormChange}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.examFrom && <p className="text-red-500 text-xs mt-1">{errors.examFrom}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam To <span className="text-red-500">*</span></label>
              <input type="datetime-local" name="examTo" value={editExamForm.examTo} onChange={handleEditExamFormChange}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.examTo && <p className="text-red-500 text-xs mt-1">{errors.examTo}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Auto Result Publish Date</label>
              <input type="date" name="autoResultPublishDate" value={editExamForm.autoResultPublishDate} onChange={handleEditExamFormChange}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Time Duration (mins) <span className="text-red-500">*</span></label>
              <input type="number" name="duration" value={editExamForm.duration} onChange={handleEditExamFormChange}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Attempt <span className="text-red-500">*</span></label>
              <input type="number" name="attempts" value={editExamForm.attempts} onChange={handleEditExamFormChange}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Passing Percentage <span className="text-red-500">*</span></label>
              <input type="number" name="passPercentage" value={editExamForm.passPercentage} onChange={handleEditExamFormChange}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Answer Word Limit <span className="text-red-500">*</span></label>
            <input type="number" name="answerWordLimit" value={editExamForm.answerWordLimit} onChange={handleEditExamFormChange} placeholder="-1"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            <p className="text-[11px] text-gray-400 mt-0.5">Set -1 For No Limit</p>
          </div>
          <div className="flex flex-wrap items-center gap-5 pt-1">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="isQuiz" checked={editExamForm.isQuiz} onChange={handleEditExamFormChange}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Quiz
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="publishExam" checked={editExamForm.publishExam} onChange={handleEditExamFormChange}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Publish Exam
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="publishResult" checked={editExamForm.publishResult} onChange={handleEditExamFormChange}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Publish Result
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="negativeMarking" checked={editExamForm.negativeMarking} onChange={handleEditExamFormChange}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Negative Marking
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="displayMarksInExam" checked={editExamForm.displayMarksInExam} onChange={handleEditExamFormChange}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Display Marks In Exam
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="randomQuestionOrder" checked={editExamForm.randomQuestionOrder} onChange={handleEditExamFormChange}
                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Random Question Order
            </label>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Description <span className="text-red-500">*</span></label>
            <textarea name="description" value={editExamForm.description} onChange={handleEditExamFormChange} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleEditExamSave} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      {showViewModal && viewExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowViewModal(false); setViewExam(null) }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Exam Details</h3>
              <button onClick={() => { setShowViewModal(false); setViewExam(null) }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Title</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{viewExam.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{viewExam.subject || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Exam From</p>
                  <p className="text-sm text-gray-700 mt-0.5">{formatDate(viewExam.examFrom)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Exam To</p>
                  <p className="text-sm text-gray-700 mt-0.5">{formatDate(viewExam.examTo)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</p>
                  <p className="text-sm text-gray-700 mt-0.5">{formatDuration(viewExam.duration)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</p>
                  <p className="text-sm text-gray-700 mt-0.5">{viewExam.totalQuestions ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</p>
                  <p className="text-sm text-gray-700 mt-0.5">{viewExam.attempts ?? 1}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Percentage</p>
                  <p className="text-sm text-gray-700 mt-0.5">{viewExam.passPercentage ?? 0}%</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Answer Word Limit</p>
                  <p className="text-sm text-gray-700 mt-0.5">{viewExam.answerWordLimit ?? -1}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Auto Result Publish</p>
                  <p className="text-sm text-gray-700 mt-0.5">{viewExam.autoResultPublishDate || "—"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Quiz", val: viewExam.isQuiz },
                  { label: "Published", val: viewExam.publishExam },
                  { label: "Publish Result", val: viewExam.publishResult },
                  { label: "Negative Marking", val: viewExam.negativeMarking },
                  { label: "Display Marks", val: viewExam.displayMarksInExam },
                  { label: "Random Order", val: viewExam.randomQuestionOrder },
                ].map((f) => (
                  <span key={f.label} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${f.val ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {f.label}: {f.val ? "Yes" : "No"}
                  </span>
                ))}
              </div>
              {viewExam.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</p>
                  <p className="text-sm text-gray-700 mt-0.5">{viewExam.description}</p>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => { setShowViewModal(false); setViewExam(null) }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Are you sure you want to delete this exam?
                {deleteId && <strong className="block mt-1 text-gray-800">{getExamName(deleteId)}</strong>}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={confirmDeleteExam} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}

      <Modal title={`Questions - ${getExamName(selectedExamId || 0)}`} show={showQuestionsModal} onClose={() => setShowQuestionsModal(false)} wide>
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{examQuestions.length} question{examQuestions.length !== 1 ? "s" : ""} added</p>
            <div className="flex items-center gap-2">
              <button onClick={openBankBrowser}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[var(--primary)] border border-[var(--primary)] text-xs font-medium rounded-lg hover:bg-orange-50 transition-colors"><Database className="h-3.5 w-3.5" /> From Question Bank</button>
              <button onClick={() => { setQuestionForm({ ...emptyQuestionForm }); setEditQuestionId(null); setShowQuestionForm(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Plus className="h-3.5 w-3.5" /> Add New</button>
            </div>
          </div>
          {showQuestionForm && (
            <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 uppercase">{editQuestionId !== null ? "Edit" : "New"} Question (saves to question bank)</span>
                <button onClick={() => { setShowQuestionForm(false); setQfErrors({}) }} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
              </div>
              <div className="px-4 py-3 space-y-3 max-h-[50vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">Subject <span className="text-red-500">*</span></label>
                    <select name="subject" value={questionForm.subject} onChange={handleQuestionFormChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                      <option value="">Select</option>
                      {addFormSubjects.map(s => <option key={s.id} value={s.name}>{s.name} ({s.code})</option>)}
                    </select>
                    {qfErrors.subject && <p className="text-red-500 text-xs">{qfErrors.subject}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">Question Type <span className="text-red-500">*</span></label>
                    <select name="questionType" value={questionForm.questionType} onChange={handleQuestionFormChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                      <option value="">Select</option>
                      {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {qfErrors.questionType && <p className="text-red-500 text-xs">{qfErrors.questionType}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">Question Level <span className="text-red-500">*</span></label>
                    <select name="questionLevel" value={questionForm.questionLevel} onChange={handleQuestionFormChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                      <option value="">Select</option>
                      {QUESTION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                    {qfErrors.questionLevel && <p className="text-red-500 text-xs">{qfErrors.questionLevel}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">Class <span className="text-red-500">*</span></label>
                    <select name="classId" value={questionForm.classId} onChange={handleQuestionFormChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                      <option value="">Select</option>
                      {addFormClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {qfErrors.classId && <p className="text-red-500 text-xs">{qfErrors.classId}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">Section</label>
                    <select name="sectionId" value={questionForm.sectionId} onChange={handleQuestionFormChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                      <option value="">Select</option>
                      {addFormSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">Created By</label>
                    <select name="createdBy" value={questionForm.createdBy} onChange={handleQuestionFormChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                      <option value="">Select</option>
                      {addFormStaff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.staff_id})</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Question <span className="text-red-500">*</span></label>
                  <RichEditor value={questionForm.question} onChange={(val) => handleRichChange("question", val)} placeholder="Enter question" />
                  {qfErrors.question && <p className="text-red-500 text-xs">{qfErrors.question}</p>}
                </div>
                {questionForm.questionType && questionForm.questionType !== "descriptive" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {OPTION_KEYS.map(k => {
                        const field = `option${k}` as keyof typeof questionForm
                        const required = (k === "A" || k === "B") && questionForm.questionType !== "true_false"
                        return (
                          <div key={k} className="space-y-1">
                            <label className="block text-xs font-medium text-gray-600">
                              Option {k} {required && <span className="text-red-500">*</span>}
                            </label>
                            <RichEditor value={questionForm[field]} onChange={(val) => handleRichChange(field as string, val)} placeholder={`Option ${k}`} />
                            {qfErrors[field as string] && <p className="text-red-500 text-xs">{qfErrors[field as string]}</p>}
                          </div>
                        )
                      })}
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">Answer <span className="text-red-500">*</span></label>
                      {questionForm.questionType === "singlechoice" && (
                        <select name="correctAnswer" value={questionForm.correctAnswer} onChange={handleQuestionFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                          <option value="">Select</option>
                          {OPTION_KEYS.map(k => <option key={k} value={k}>Option {k}</option>)}
                        </select>
                      )}
                      {questionForm.questionType === "true_false" && (
                        <select name="correctAnswerTrueFalse" value={questionForm.correctAnswerTrueFalse} onChange={handleQuestionFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                          <option value="">Select</option>
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      )}
                      {questionForm.questionType === "multichoice" && (
                        <div className="flex flex-wrap gap-4 pt-1">
                          {OPTION_KEYS.map(k => {
                            const checked = questionForm.correctAnswers?.split(",").includes(k)
                            return (
                              <label key={k} className="flex items-center gap-1.5 text-sm text-gray-700">
                                <input type="checkbox" checked={checked || false}
                                  onChange={() => {
                                    const current = questionForm.correctAnswers ? questionForm.correctAnswers.split(",").filter(Boolean) : []
                                    const next = checked ? current.filter(v => v !== k) : [...current, k]
                                    handleQuestionFormChange({ target: { name: "correctAnswers", value: next.join(",") } } as any)
                                  }}
                                  className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                                {k}
                              </label>
                            )
                          })}
                        </div>
                      )}
                      {qfErrors.correctAnswer && <p className="text-red-500 text-xs">{qfErrors.correctAnswer}</p>}
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-white">
                <button onClick={() => { setShowQuestionForm(false); setQfErrors({}) }} className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={addOrEditQuestion} className="px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--secondary)] flex items-center gap-1">
                  <Save className="h-3 w-3" /> {editQuestionId !== null ? "Update" : "Add to Bank & Exam"}
                </button>
              </div>
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Question", "Option A", "Option B", "Option C", "Option D", "Correct", "Action"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {examQuestions.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-6 text-gray-400">No questions added yet</td></tr>
              ) : (
                examQuestions.map((q, idx) => (
                  <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-800 max-w-[150px] truncate">{q.question}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[100px] truncate">{q.optionA || "—"}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[100px] truncate">{q.optionB || "—"}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[100px] truncate">{q.optionC || "—"}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[100px] truncate">{q.optionD || "—"}</td>
                    <td className="px-3 py-2"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">{q.correctAnswer}</span></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => editQuestion(q)} className="p-1 text-amber-600 hover:bg-amber-50 rounded" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteQuestion(q.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowQuestionsModal(false)} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Done</button>
        </div>
      </Modal>

      {/* View Result Modal */}
      {showResultModal && resultExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowResultModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Result - {resultExam.name}
              </h2>
              <button onClick={() => setShowResultModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-800">0</p>
                  <p className="text-xs text-gray-500 mt-1">Total Students</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-800">0</p>
                  <p className="text-xs text-gray-500 mt-1">Attempted</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">0%</p>
                  <p className="text-xs text-gray-500 mt-1">Passed</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-500">0%</p>
                  <p className="text-xs text-gray-500 mt-1">Failed</p>
                </div>
              </div>
              <p className="text-center text-sm text-gray-400 pt-2">No results available yet. Results will appear after students take the exam.</p>
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200">
              <button onClick={() => setShowResultModal(false)} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Public Link Modal */}
      {showPublicLinkModal && publicLinkExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPublicLinkModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-600" />
                Public Link - {publicLinkExam.name}
              </h2>
              <button onClick={() => setShowPublicLinkModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-6 space-y-4">
              {generatingLink ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-gray-500">Generating link...</span>
                </div>
              ) : publicLinkData ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Public URL</label>
                    <div className="flex items-center gap-2">
                      <input type="text" readOnly value={`${window.location.origin}/exam/${publicLinkData.token}`}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700" />
                      <button onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/exam/${publicLinkData.token}`)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }} className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-purple-700">{publicLinkData.visit_count}</p>
                      <p className="text-xs text-purple-500 mt-1">Total Visits</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-purple-700">Active</p>
                      <p className="text-xs text-purple-500 mt-1">Status</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center">This link is publicly accessible without login. Share it with students to take the exam.</p>
                </>
              ) : (
                <p className="text-center text-sm text-red-500 py-4">Failed to generate link. Please try again.</p>
              )}
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200">
              <button onClick={() => setShowPublicLinkModal(false)} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Question Bank Browser */}
      {showBankBrowser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBankBrowser(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[var(--primary)]" />
                Question Bank
              </h2>
              <button onClick={() => setShowBankBrowser(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Filters */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Class</label>
                  <select name="class_id" value={bankFilters.class_id} onChange={handleBankFilterChange}
                    className="h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[120px]">
                    <option value="">Select</option>
                    {bankClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Section</label>
                  <select name="section_id" value={bankFilters.section_id} onChange={handleBankFilterChange}
                    className="h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[120px]">
                    <option value="">Select</option>
                    {bankSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Subject</label>
                  <select name="subject" value={bankFilters.subject} onChange={handleBankFilterChange}
                    className="h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[120px]">
                    <option value="">Select</option>
                    {bankSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Question Type</label>
                  <select name="question_type" value={bankFilters.question_type} onChange={handleBankFilterChange}
                    className="h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[120px]">
                    <option value="">Select</option>
                    {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Question Level</label>
                  <select name="question_level" value={bankFilters.question_level} onChange={handleBankFilterChange}
                    className="h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[120px]">
                    <option value="">Select</option>
                    {QUESTION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <button onClick={fetchBankQuestions} disabled={loadingBank}
                  className="h-9 px-4 text-xs font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5" /> {loadingBank ? "Loading..." : "Search"}
                </button>
              </div>

              {/* Results */}
              {bankQuestions.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{bankQuestions.length} question{bankQuestions.length !== 1 ? "s" : ""} found</p>
                  {selectedBankIds.size > 0 && (
                    <span className="text-xs font-medium text-[var(--primary)]">{selectedBankIds.size} selected</span>
                  )}
                </div>
              )}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="w-10 px-3 py-2">
                        <input type="checkbox" onChange={e => {
                          if (e.target.checked) setSelectedBankIds(new Set(bankQuestions.map(q => q.id)))
                          else setSelectedBankIds(new Set())
                        }} checked={bankQuestions.length > 0 && selectedBankIds.size === bankQuestions.length}
                          className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                      </th>
                      {["Subject", "Question", "Type", "Level", "Class"].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bankQuestions.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">
                        {loadingBank ? "Loading..." : "Use filters above and click Search to find questions"}
                      </td></tr>
                    ) : (
                      bankQuestions.map(q => (
                        <tr key={q.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedBankIds.has(q.id) ? "bg-orange-50" : ""}`}>
                          <td className="px-3 py-2">
                            <input type="checkbox" checked={selectedBankIds.has(q.id)}
                              onChange={() => {
                                setSelectedBankIds(prev => {
                                  const next = new Set(prev)
                                  if (next.has(q.id)) next.delete(q.id)
                                  else next.add(q.id)
                                  return next
                                })
                              }}
                              className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-700">{q.subject}</td>
                          <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate">{q.question}</td>
                          <td className="px-3 py-2 text-gray-600">{QUESTION_TYPES.find(t => t.value === q.questionType)?.label || q.questionType}</td>
                          <td className="px-3 py-2 text-gray-600">{QUESTION_LEVELS.find(l => l.value === q.questionLevel)?.label || q.questionLevel}</td>
                          <td className="px-3 py-2 text-gray-600">{q.className || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setShowBankBrowser(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={addSelectedBankQuestions} disabled={selectedBankIds.size === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50">
                <Plus className="h-4 w-4" /> Add Selected ({selectedBankIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
