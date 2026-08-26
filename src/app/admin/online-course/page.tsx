"use client"

import { useState, useMemo } from "react"
import {
  Plus, Search, Eye, Pencil, Trash2, X, Save, BookOpen,
  Play, FileText, HelpCircle, ClipboardList, Grid, List,
  ChevronDown, ChevronRight, Upload, ExternalLink, Clock,
  DollarSign, Tag, Users, Settings
} from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"
import { useCurrency } from "@/lib/currency-context"

interface Lesson {
  id: string
  title: string
  type: string
  provider?: string
  url?: string
  attachment?: string
  content?: string
  section: string
}

interface Quiz {
  id: string
  title: string
  description: string
  type: string
  duration: number
  passPercentage: number
  questions: number
}

interface Exam {
  id: string
  title: string
  duration: number
  totalMarks: number
  passingMarks: number
  description: string
}

interface Assignment {
  id: string
  title: string
  points: number
  deadline: string
  description: string
  attachment?: string
}

interface Course {
  id: number
  title: string
  category: string
  class: string
  section: string
  teacher: string
  description: string
  thumbnail: string
  outcomes: string[]
  provider: string
  url: string
  price: number
  discount: number
  free: boolean
  frontVisibility: string
  certificate: string
  lessons: number
  quizzes: number
  exams: number
  assignments: number
  totalHour: number
  currentPrice: number
  lastUpdated: string
  lessonData: Lesson[]
  quizData: Quiz[]
  examData: Exam[]
  assignmentData: Assignment[]
}

type ViewMode = "card" | "list"
type ModalMode = "add" | "edit" | null

const gradientBanners = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",
  "from-cyan-500 to-blue-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-yellow-600",
]

const categories = ["Personal Development", "Health & Fitness", "Network & Security", "Lifestyle", "UPGRADE SKILL", "Business Marketing"]
const teachers = ["Joe Black", "Shivam Verma", "Jason Sharlton", "Nishant Khare", "Aman Verma"]
const providers = ["Youtube", "Vimeo", "Html5"]
const lessonTypes = ["Video", "PDF", "Text", "Document"]
const lessonSections = ["Section 1", "Section 2", "Section 3"]
const quizTypes = ["Single Choice", "Multiple Choice", "True/False"]
const frontVisibilityOptions = ["Yes", "No"]
const certificates = ["Sample Transfer Certificate 1", "Sample Transfer Certificate 2", "Sample Transfer Certificate 3", "Sample Transfer Certificate 4"]

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl z-10 w-full max-w-4xl mx-4">
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function OnlineCoursePage() {
  const { symbol } = useCurrency()
  const { classNames: classes, sectionNames: sections } = useClassesAndSections();
  const { data: courses, add, update, remove } = useApi<Course>("/api/online-course")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [viewCourse, setViewCourse] = useState<Course | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
  const [editCourse, setEditCourse] = useState<Partial<Course>>({})
  const [activeDetailTab, setActiveDetailTab] = useState<string>("Lessons")
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [showExamModal, setShowExamModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({ section: "Section 1", type: "Video" })
  const [newQuiz, setNewQuiz] = useState<Partial<Quiz>>({ type: "Multiple Choice", duration: 15, passPercentage: 60 })
  const [newExam, setNewExam] = useState<Partial<Exam>>({ duration: 60, totalMarks: 100, passingMarks: 40 })
  const [newAssignment, setNewAssignment] = useState<Partial<Assignment>>({ points: 50, deadline: "" })
  const [editingSection, setEditingSection] = useState<"lesson" | "quiz" | "exam" | "assignment" | null>(null)

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses || []
    const q = search.toLowerCase()
    return (courses || []).filter((c) => c.title.toLowerCase().includes(q))
  }, [search, courses])

  const openAddModal = () => {
    setEditId(null)
    setEditCourse({
      title: "", category: "Personal Development", class: "Class 1", section: "A", teacher: "Joe Black",
      description: "", thumbnail: "", provider: "Youtube", url: "", price: 0, discount: 0, free: false,
      frontVisibility: "Yes", certificate: "Select", outcomes: [], lessons: 0, quizzes: 0, exams: 0,
      assignments: 0, totalHour: 0, currentPrice: 0,
      lessonData: [], quizData: [], examData: [], assignmentData: [],
    })
    setModalMode("add")
  }

  const openEditModal = (course: Course) => {
    setEditId(course.id)
    setEditCourse({ ...course })
    setModalMode("edit")
  }

  const saveCourse = async () => {
    if (!editCourse.title || !editCourse.description) return
    if (modalMode === "add") {
      await add({
        title: editCourse.title || "",
        category: editCourse.category || "Personal Development",
        class: editCourse.class || "Class 1",
        section: editCourse.section || "A",
        teacher: editCourse.teacher || "Joe Black",
        description: editCourse.description || "",
        thumbnail: editCourse.thumbnail || "",
        outcomes: editCourse.outcomes || [],
        provider: editCourse.provider || "Youtube",
        url: editCourse.url || "",
        price: editCourse.price || 0,
        discount: editCourse.discount || 0,
        free: editCourse.free || false,
        frontVisibility: editCourse.frontVisibility || "Yes",
        certificate: editCourse.certificate || "Select",
        lessons: 0, quizzes: 0, exams: 0, assignments: 0,
        totalHour: editCourse.totalHour || 0,
        currentPrice: editCourse.discount ? Math.round((editCourse.price || 0) * (1 - (editCourse.discount || 0) / 100)) : editCourse.price || 0,
        lastUpdated: new Date().toLocaleDateString("en-US"),
        lessonData: [], quizData: [], examData: [], assignmentData: [],
      })
    } else if (editId !== null) {
      await update(editId, {
        ...editCourse,
        currentPrice: editCourse.discount ? Math.round((editCourse.price || 0) * (1 - (editCourse.discount || 0) / 100)) : editCourse.price || 0,
      })
    }
    setModalMode(null)
    setEditCourse({})
  }

  const deleteCourse = async () => {
    if (deleteTarget) {
      await remove(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const addOutcome = () => {
    setEditCourse({ ...editCourse, outcomes: [...(editCourse.outcomes || []), ""] })
  }

  const updateOutcome = (index: number, value: string) => {
    const outcomes = [...(editCourse.outcomes || [])]
    outcomes[index] = value
    setEditCourse({ ...editCourse, outcomes })
  }

  const removeOutcome = (index: number) => {
    const outcomes = (editCourse.outcomes || []).filter((_, i) => i !== index)
    setEditCourse({ ...editCourse, outcomes })
  }

  const addLessonToCourse = async () => {
    if (!newLesson.title) return
    const lesson: Lesson = {
      id: `l${Date.now()}`,
      title: newLesson.title,
      type: newLesson.type || "Video",
      provider: newLesson.provider,
      url: newLesson.url,
      attachment: newLesson.attachment,
      content: newLesson.content,
      section: newLesson.section || "Section 1",
    }
    if (editingSection) {
      const existing = editCourse.lessonData || []
      setEditCourse({ ...editCourse, lessonData: [...existing, lesson], lessons: (editCourse.lessons || 0) + 1 })
      setEditingSection(null)
    } else if (viewCourse) {
      const updated = { ...viewCourse, lessonData: [...viewCourse.lessonData, lesson], lessons: viewCourse.lessons + 1 }
      setViewCourse(updated)
      await update(updated.id, updated)
    }
    setNewLesson({ section: "Section 1", type: "Video" })
    setShowLessonModal(false)
  }

  const addQuizToCourse = async () => {
    if (!newQuiz.title) return
    const quiz: Quiz = {
      id: `q${Date.now()}`,
      title: newQuiz.title,
      description: newQuiz.description || "",
      type: newQuiz.type || "Multiple Choice",
      duration: newQuiz.duration || 15,
      passPercentage: newQuiz.passPercentage || 60,
      questions: newQuiz.questions || 0,
    }
    if (editingSection) {
      const existing = editCourse.quizData || []
      setEditCourse({ ...editCourse, quizData: [...existing, quiz], quizzes: (editCourse.quizzes || 0) + 1 })
      setEditingSection(null)
    } else if (viewCourse) {
      const updated = { ...viewCourse, quizData: [...viewCourse.quizData, quiz], quizzes: viewCourse.quizzes + 1 }
      setViewCourse(updated)
      await update(updated.id, updated)
    }
    setNewQuiz({ type: "Multiple Choice", duration: 15, passPercentage: 60 })
    setShowQuizModal(false)
  }

  const addExamToCourse = async () => {
    if (!newExam.title) return
    const exam: Exam = {
      id: `e${Date.now()}`,
      title: newExam.title,
      duration: newExam.duration || 60,
      totalMarks: newExam.totalMarks || 100,
      passingMarks: newExam.passingMarks || 40,
      description: newExam.description || "",
    }
    if (editingSection) {
      const existing = editCourse.examData || []
      setEditCourse({ ...editCourse, examData: [...existing, exam], exams: (editCourse.exams || 0) + 1 })
      setEditingSection(null)
    } else if (viewCourse) {
      const updated = { ...viewCourse, examData: [...viewCourse.examData, exam], exams: viewCourse.exams + 1 }
      setViewCourse(updated)
      await update(updated.id, updated)
    }
    setNewExam({ duration: 60, totalMarks: 100, passingMarks: 40 })
    setShowExamModal(false)
  }

  const addAssignmentToCourse = async () => {
    if (!newAssignment.title) return
    const assignment: Assignment = {
      id: `a${Date.now()}`,
      title: newAssignment.title,
      points: newAssignment.points || 50,
      deadline: newAssignment.deadline || "",
      description: newAssignment.description || "",
      attachment: newAssignment.attachment,
    }
    if (editingSection) {
      const existing = editCourse.assignmentData || []
      setEditCourse({ ...editCourse, assignmentData: [...existing, assignment], assignments: (editCourse.assignments || 0) + 1 })
      setEditingSection(null)
    } else if (viewCourse) {
      const updated = { ...viewCourse, assignmentData: [...viewCourse.assignmentData, assignment], assignments: viewCourse.assignments + 1 }
      setViewCourse(updated)
      await update(updated.id, updated)
    }
    setNewAssignment({ points: 50, deadline: "" })
    setShowAssignmentModal(false)
  }

  const removeLesson = async (id: string) => {
    if (!viewCourse) return
    const updated = {
      ...viewCourse,
      lessonData: viewCourse.lessonData.filter((l) => l.id !== id),
      lessons: viewCourse.lessons - 1,
    }
    setViewCourse(updated)
    await update(updated.id, updated)
  }

  const removeQuiz = async (id: string) => {
    if (!viewCourse) return
    const updated = {
      ...viewCourse,
      quizData: viewCourse.quizData.filter((q) => q.id !== id),
      quizzes: viewCourse.quizzes - 1,
    }
    setViewCourse(updated)
    await update(updated.id, updated)
  }

  const removeExam = async (id: string) => {
    if (!viewCourse) return
    const updated = {
      ...viewCourse,
      examData: viewCourse.examData.filter((e) => e.id !== id),
      exams: viewCourse.exams - 1,
    }
    setViewCourse(updated)
    await update(updated.id, updated)
  }

  const removeAssignment = async (id: string) => {
    if (!viewCourse) return
    const updated = {
      ...viewCourse,
      assignmentData: viewCourse.assignmentData.filter((a) => a.id !== id),
      assignments: viewCourse.assignments - 1,
    }
    setViewCourse(updated)
    await update(updated.id, updated)
  }

  const removeLessonFromEdit = (id: string) => {
    const existing = editCourse.lessonData || []
    setEditCourse({ ...editCourse, lessonData: existing.filter((l) => l.id !== id), lessons: Math.max(0, (editCourse.lessons || 0) - 1) })
  }

  const removeQuizFromEdit = (id: string) => {
    const existing = editCourse.quizData || []
    setEditCourse({ ...editCourse, quizData: existing.filter((q) => q.id !== id), quizzes: Math.max(0, (editCourse.quizzes || 0) - 1) })
  }

  const removeExamFromEdit = (id: string) => {
    const existing = editCourse.examData || []
    setEditCourse({ ...editCourse, examData: existing.filter((e) => e.id !== id), exams: Math.max(0, (editCourse.exams || 0) - 1) })
  }

  const removeAssignmentFromEdit = (id: string) => {
    const existing = editCourse.assignmentData || []
    setEditCourse({ ...editCourse, assignmentData: existing.filter((a) => a.id !== id), assignments: Math.max(0, (editCourse.assignments || 0) - 1) })
  }

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {["Title", "Class", "Section", "Lesson", "Quiz", "Exam", "Assignment", "Total Hour", "Price", "Current Price", "Last Updated", "Action"].map((h) => (
              <th key={h} className="text-left px-3 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredCourses.map((course, idx) => (
            <tr key={course.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-[var(--primary-light)] transition-colors`}>
              <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">{course.title}</td>
              <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{course.class}</td>
              <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{course.section}</td>
              <td className="px-3 py-3 text-gray-600 text-center">{course.lessons}</td>
              <td className="px-3 py-3 text-gray-600 text-center">{course.quizzes}</td>
              <td className="px-3 py-3 text-gray-600 text-center">{course.exams}</td>
              <td className="px-3 py-3 text-gray-600 text-center">{course.assignments}</td>
              <td className="px-3 py-3 text-gray-600 text-center">{course.totalHour}h</td>
              <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{symbol}{course.price}</td>
              <td className="px-3 py-3 font-medium text-emerald-600 whitespace-nowrap">{symbol}{course.currentPrice}</td>
              <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{course.lastUpdated}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => setViewCourse(course)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => openEditModal(course)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteTarget(course)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredCourses.map((course, idx) => (
        <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className={`h-2 bg-gradient-to-r ${gradientBanners[idx % gradientBanners.length]}`} />
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-base leading-tight">{course.title}</h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] whitespace-nowrap ml-2">{course.category}</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg font-bold text-gray-800">{symbol}{course.currentPrice}</span>
              <span className="text-sm text-gray-400 line-through">{symbol}{course.price}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1"><Play className="h-3.5 w-3.5 text-[var(--primary)]" /> {course.lessons} Lessons</span>
              <span className="flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5 text-amber-400" /> {course.quizzes} Quizzes</span>
              <span className="flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5 text-emerald-400" /> {course.exams} Exams</span>
              <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-rose-400" /> {course.assignments} Assignments</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
              <Clock className="h-3.5 w-3.5" />
              <span>{course.totalHour} total hours</span>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button onClick={() => setViewCourse(course)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <Eye className="h-3.5 w-3.5" /> View
              </button>
              <button onClick={() => openEditModal(course)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => setDeleteTarget(course)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderBasicDetails = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Title" required>
        <input type="text" value={editCourse.title || ""} onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter course title" />
      </Field>
      <Field label="Category">
        <select value={editCourse.category || ""} onChange={(e) => setEditCourse({ ...editCourse, category: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
          <option value="">Select</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Class">
        <select value={editCourse.class || ""} onChange={(e) => setEditCourse({ ...editCourse, class: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
          <option value="">Select</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Section">
        <select value={editCourse.section || ""} onChange={(e) => setEditCourse({ ...editCourse, section: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
          <option value="">Select</option>
          {sections.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Teacher">
        <select value={editCourse.teacher || ""} onChange={(e) => setEditCourse({ ...editCourse, teacher: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
          <option value="">Select</option>
          {teachers.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Course Thumbnail">
        <input type="text" value={editCourse.thumbnail || ""} onChange={(e) => setEditCourse({ ...editCourse, thumbnail: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Thumbnail URL or file name" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Description" required>
          <textarea rows={3} value={editCourse.description || ""} onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" placeholder="Enter course description" />
        </Field>
      </div>
    </div>
  )

  const renderCourseContent = () => (
    <div className="space-y-4">
      <Field label="Learning Outcomes">
        <div className="space-y-2">
          {(editCourse.outcomes || []).map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="text" value={o} onChange={(e) => updateOutcome(i, e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter learning outcome" />
              <button onClick={() => removeOutcome(i)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
            </div>
          ))}
          <button onClick={addOutcome} className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:text-[var(--primary)] font-medium">
            <Plus className="h-4 w-4" /> Add Row
          </button>
        </div>
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Course Provider">
          <select value={editCourse.provider || ""} onChange={(e) => setEditCourse({ ...editCourse, provider: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
            {providers.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        {(editCourse.provider === "Youtube" || editCourse.provider === "Vimeo") && (
          <Field label="Course URL">
            <input type="text" value={editCourse.url || ""} onChange={(e) => setEditCourse({ ...editCourse, url: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter course URL" />
          </Field>
        )}
        <Field label="Course Price" required>
          <input type="number" value={editCourse.price || ""} onChange={(e) => setEditCourse({ ...editCourse, price: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="0" />
        </Field>
        <Field label="Course Discount (%)">
          <input type="number" value={editCourse.discount || ""} onChange={(e) => setEditCourse({ ...editCourse, discount: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="0" />
        </Field>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="freeCourse" checked={editCourse.free || false} onChange={(e) => setEditCourse({ ...editCourse, free: e.target.checked })}
            className="h-4 w-4 text-[var(--primary)] border-gray-300 rounded focus:ring-[var(--primary)]" />
          <label htmlFor="freeCourse" className="text-sm text-gray-700">Free Course</label>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Front Side Visibility">
        <select value={editCourse.frontVisibility || "Yes"} onChange={(e) => setEditCourse({ ...editCourse, frontVisibility: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
          {frontVisibilityOptions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
      <Field label="Certificate Template">
        <select value={editCourse.certificate || "Select"} onChange={(e) => setEditCourse({ ...editCourse, certificate: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
          <option value="Select">Select</option>
          {certificates.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
    </div>
  )

  const renderAddEditModal = () => {
    if (!modalMode) return null
    return (
      <ModalOverlay onClose={() => setModalMode(null)}>
        <ModalHeader title={modalMode === "add" ? "Add Course" : "Edit Course"} onClose={() => setModalMode(null)} />
        <div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-indigo-500" /> Basic Details</h3>
            {renderBasicDetails()}
          </div>
          <hr className="border-gray-200" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Settings className="h-4 w-4 text-indigo-500" /> Course Content</h3>
            {renderCourseContent()}
          </div>
          <hr className="border-gray-200" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Settings className="h-4 w-4 text-indigo-500" /> Settings</h3>
            {renderSettings()}
          </div>
          <hr className="border-gray-200" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Play className="h-4 w-4 text-indigo-500" /> Lessons ({(editCourse.lessonData || []).length})</h3>
            <div className="space-y-3">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {["#", "Title", "Type", "Provider", "Action"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(editCourse.lessonData || []).length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400 text-sm">No lessons added yet</td></tr>
                    ) : (
                      (editCourse.lessonData || []).map((lesson, i) => (
                        <tr key={`${lesson.id}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{lesson.title}</td>
                          <td className="px-3 py-2 text-gray-600">{lesson.type}</td>
                          <td className="px-3 py-2 text-gray-600">{lesson.provider || "-"}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => removeLessonFromEdit(lesson.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <button onClick={() => { setEditingSection("lesson"); setShowLessonModal(true) }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Lesson
              </button>
            </div>
          </div>
          <hr className="border-gray-200" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-indigo-500" /> Quiz ({(editCourse.quizData || []).length})</h3>
            <div className="space-y-3">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {["#", "Title", "Questions", "Action"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(editCourse.quizData || []).length === 0 ? (
                      <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-400 text-sm">No quizzes added yet</td></tr>
                    ) : (
                      (editCourse.quizData || []).map((quiz, i) => (
                        <tr key={`${quiz.id}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{quiz.title}</td>
                          <td className="px-3 py-2 text-gray-600">{quiz.questions}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => removeQuizFromEdit(quiz.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <button onClick={() => { setEditingSection("quiz"); setShowQuizModal(true) }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Quiz
              </button>
            </div>
          </div>
          <hr className="border-gray-200" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-indigo-500" /> Exam ({(editCourse.examData || []).length})</h3>
            <div className="space-y-3">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {["#", "Title", "Duration", "Total Marks", "Action"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(editCourse.examData || []).length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400 text-sm">No exams added yet</td></tr>
                    ) : (
                      (editCourse.examData || []).map((exam, i) => (
                        <tr key={`${exam.id}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{exam.title}</td>
                          <td className="px-3 py-2 text-gray-600">{exam.duration} min</td>
                          <td className="px-3 py-2 text-gray-600">{exam.totalMarks}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => removeExamFromEdit(exam.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <button onClick={() => { setEditingSection("exam"); setShowExamModal(true) }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Exam
              </button>
            </div>
          </div>
          <hr className="border-gray-200" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-indigo-500" /> Assignment ({(editCourse.assignmentData || []).length})</h3>
            <div className="space-y-3">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {["#", "Title", "Deadline", "Marks", "Action"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(editCourse.assignmentData || []).length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400 text-sm">No assignments added yet</td></tr>
                    ) : (
                      (editCourse.assignmentData || []).map((a, i) => (
                        <tr key={`${a.id}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{a.title}</td>
                          <td className="px-3 py-2 text-gray-600">{a.deadline}</td>
                          <td className="px-3 py-2 text-gray-600">{a.points}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => removeAssignmentFromEdit(a.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <button onClick={() => { setEditingSection("assignment"); setShowAssignmentModal(true) }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Assignment
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={saveCourse} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </ModalOverlay>
    )
  }

  const renderLessonsTab = () => {
    if (!viewCourse) return null
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Lessons ({viewCourse.lessonData.length})</span>
          <button onClick={() => setShowLessonModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Lesson
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["#", "Title", "Type", "Provider", "Action"].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {viewCourse.lessonData.map((lesson, i) => (
              <tr key={`${lesson.id}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-800">{lesson.title}</td>
                <td className="px-3 py-2 text-gray-600">{lesson.type}</td>
                <td className="px-3 py-2 text-gray-600">{lesson.provider || "-"}</td>
                <td className="px-3 py-2">
                  <button onClick={() => removeLesson(lesson.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderQuizzesTab = () => {
    if (!viewCourse) return null
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Quizzes ({viewCourse.quizData.length})</span>
          <button onClick={() => setShowQuizModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Quiz
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["#", "Title", "Questions", "Action"].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {viewCourse.quizData.map((quiz, i) => (
              <tr key={`${quiz.id}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-800">{quiz.title}</td>
                <td className="px-3 py-2 text-gray-600">{quiz.questions}</td>
                <td className="px-3 py-2">
                  <button onClick={() => removeQuiz(quiz.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderExamsTab = () => {
    if (!viewCourse) return null
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Exams ({viewCourse.examData.length})</span>
          <button onClick={() => setShowExamModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Exam
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["#", "Title", "Duration", "Total Marks", "Action"].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {viewCourse.examData.map((exam, i) => (
              <tr key={`${exam.id}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-800">{exam.title}</td>
                <td className="px-3 py-2 text-gray-600">{exam.duration} min</td>
                <td className="px-3 py-2 text-gray-600">{exam.totalMarks}</td>
                <td className="px-3 py-2">
                  <button onClick={() => removeExam(exam.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderAssignmentsTab = () => {
    if (!viewCourse) return null
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Assignments ({viewCourse.assignmentData.length})</span>
          <button onClick={() => setShowAssignmentModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Assignment
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["#", "Title", "Deadline", "Marks", "Action"].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {viewCourse.assignmentData.map((a, i) => (
              <tr key={`${a.id}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-800">{a.title}</td>
                <td className="px-3 py-2 text-gray-600">{a.deadline}</td>
                <td className="px-3 py-2 text-gray-600">{a.points}</td>
                <td className="px-3 py-2">
                  <button onClick={() => removeAssignment(a.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderDetailModal = () => {
    if (!viewCourse) return null
    const tabs = ["Lessons", "Quiz", "Exam", "Assignment"]
    return (
      <ModalOverlay onClose={() => { setViewCourse(null); setActiveDetailTab("Lessons") }}>
        <ModalHeader title={viewCourse.title} onClose={() => { setViewCourse(null); setActiveDetailTab("Lessons") }} />
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--primary-light)] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-[var(--primary)]">{viewCourse.lessons}</p>
              <p className="text-xs text-gray-600">Lessons</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{viewCourse.quizzes}</p>
              <p className="text-xs text-gray-600">Quizzes</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{viewCourse.exams}</p>
              <p className="text-xs text-gray-600">Exams</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-rose-600">{viewCourse.assignments}</p>
              <p className="text-xs text-gray-600">Assignments</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Category:</span> <span className="font-medium text-gray-800">{viewCourse.category}</span></div>
            <div><span className="text-gray-500">Class:</span> <span className="font-medium text-gray-800">{viewCourse.class}</span></div>
            <div><span className="text-gray-500">Teacher:</span> <span className="font-medium text-gray-800">{viewCourse.teacher}</span></div>
            <div><span className="text-gray-500">Price:</span> <span className="font-medium text-gray-800">{symbol}{viewCourse.price}</span></div>
            <div><span className="text-gray-500">Current Price:</span> <span className="font-medium text-emerald-600">{symbol}{viewCourse.currentPrice}</span></div>
            <div><span className="text-gray-500">Total Hours:</span> <span className="font-medium text-gray-800">{viewCourse.totalHour}h</span></div>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Description:</span>
            <p className="text-gray-700 mt-1">{viewCourse.description}</p>
          </div>
          {viewCourse.outcomes.length > 0 && (
            <div className="text-sm">
              <span className="text-gray-500">Learning Outcomes:</span>
              <ul className="list-disc list-inside mt-1 text-gray-700 space-y-0.5">
                {viewCourse.outcomes.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          )}
          <hr className="border-gray-200" />
          <div className="flex gap-1 border-b border-gray-200">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveDetailTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeDetailTab === tab
                    ? "border-indigo-600 text-[var(--primary)]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="pt-2">
            {activeDetailTab === "Lessons" && renderLessonsTab()}
            {activeDetailTab === "Quiz" && renderQuizzesTab()}
            {activeDetailTab === "Exam" && renderExamsTab()}
            {activeDetailTab === "Assignment" && renderAssignmentsTab()}
          </div>
        </div>
      </ModalOverlay>
    )
  }

  const renderLessonModal = () => {
    if (!showLessonModal) return null
    return (
      <ModalOverlay onClose={() => setShowLessonModal(false)}>
        <ModalHeader title="Add Lesson" onClose={() => setShowLessonModal(false)} />
        <div className="px-6 py-4 space-y-4">
          <Field label="Section">
            <select value={newLesson.section || "Section 1"} onChange={(e) => setNewLesson({ ...newLesson, section: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
              <option value="">Select</option>
              {lessonSections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Title" required>
            <input type="text" value={newLesson.title || ""} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter lesson title" />
          </Field>
          <Field label="Lesson Type">
            <select value={newLesson.type || "Video"} onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
              {lessonTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          {(newLesson.type === "Video") && (
            <>
              <Field label="Lesson Provider">
                <select value={newLesson.provider || "Youtube"} onChange={(e) => setNewLesson({ ...newLesson, provider: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                  {providers.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Lesson URL">
                <input type="text" value={newLesson.url || ""} onChange={(e) => setNewLesson({ ...newLesson, url: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter lesson URL" />
              </Field>
            </>
          )}
          {(newLesson.type === "PDF" || newLesson.type === "Document") && (
            <Field label="Attachment">
              <input type="text" value={newLesson.attachment || ""} onChange={(e) => setNewLesson({ ...newLesson, attachment: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Attachment file name or URL" />
            </Field>
          )}
          {newLesson.type === "Text" && (
            <Field label="Content">
              <textarea rows={4} value={newLesson.content || ""} onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" placeholder="Enter lesson content" />
            </Field>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowLessonModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={addLessonToCourse} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </ModalOverlay>
    )
  }

  const renderQuizModal = () => {
    if (!showQuizModal) return null
    return (
      <ModalOverlay onClose={() => setShowQuizModal(false)}>
        <ModalHeader title="Add Quiz" onClose={() => setShowQuizModal(false)} />
        <div className="px-6 py-4 space-y-4">
          <Field label="Title" required>
            <input type="text" value={newQuiz.title || ""} onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter quiz title" />
          </Field>
          <Field label="Description">
            <textarea rows={2} value={newQuiz.description || ""} onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" placeholder="Enter quiz description" />
          </Field>
          <Field label="Quiz Type">
            <select value={newQuiz.type || "Multiple Choice"} onChange={(e) => setNewQuiz({ ...newQuiz, type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
              {quizTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration (minutes)">
              <input type="number" value={newQuiz.duration || ""} onChange={(e) => setNewQuiz({ ...newQuiz, duration: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </Field>
            <Field label="Pass Percentage">
              <input type="number" value={newQuiz.passPercentage || ""} onChange={(e) => setNewQuiz({ ...newQuiz, passPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </Field>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowQuizModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={addQuizToCourse} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </ModalOverlay>
    )
  }

  const renderExamModal = () => {
    if (!showExamModal) return null
    return (
      <ModalOverlay onClose={() => setShowExamModal(false)}>
        <ModalHeader title="Add Exam" onClose={() => setShowExamModal(false)} />
        <div className="px-6 py-4 space-y-4">
          <Field label="Title" required>
            <input type="text" value={newExam.title || ""} onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter exam title" />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Duration (minutes)">
              <input type="number" value={newExam.duration || ""} onChange={(e) => setNewExam({ ...newExam, duration: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </Field>
            <Field label="Total Marks">
              <input type="number" value={newExam.totalMarks || ""} onChange={(e) => setNewExam({ ...newExam, totalMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </Field>
            <Field label="Passing Marks">
              <input type="number" value={newExam.passingMarks || ""} onChange={(e) => setNewExam({ ...newExam, passingMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={2} value={newExam.description || ""} onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" placeholder="Enter exam description" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowExamModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={addExamToCourse} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </ModalOverlay>
    )
  }

  const renderAssignmentModal = () => {
    if (!showAssignmentModal) return null
    return (
      <ModalOverlay onClose={() => setShowAssignmentModal(false)}>
        <ModalHeader title="Add Assignment" onClose={() => setShowAssignmentModal(false)} />
        <div className="px-6 py-4 space-y-4">
          <Field label="Title" required>
            <input type="text" value={newAssignment.title || ""} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Enter assignment title" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Points">
              <input type="number" value={newAssignment.points || ""} onChange={(e) => setNewAssignment({ ...newAssignment, points: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </Field>
            <Field label="Deadline">
              <input type="date" value={newAssignment.deadline || ""} onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={2} value={newAssignment.description || ""} onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" placeholder="Enter assignment description" />
          </Field>
          <Field label="Attachment">
            <input type="text" value={newAssignment.attachment || ""} onChange={(e) => setNewAssignment({ ...newAssignment, attachment: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" placeholder="Attachment file name or URL" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowAssignmentModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={addAssignmentToCourse} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors">
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </ModalOverlay>
    )
  }

  const renderDeleteModal = () => {
    if (!deleteTarget) return null
    return (
      <ModalOverlay onClose={() => setDeleteTarget(null)}>
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Course</h3>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete <strong className="text-gray-800">{deleteTarget.title}</strong>? This action cannot be undone.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={deleteCourse} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
              Delete
            </button>
          </div>
        </div>
      </ModalOverlay>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Online Course</h1>
        <p className="text-indigo-200 text-sm mt-1">Online Course / Online Course</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-gray-400 hover:text-gray-600"}`} title="List View">
            <List className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("card")} className={`p-1.5 rounded-md transition-colors ${viewMode === "card" ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-gray-400 hover:text-gray-600"}`} title="Card View">
            <Grid className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by course name..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent w-full sm:w-72" />
          </div>
          <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--secondary)] rounded-lg transition-colors shadow-sm whitespace-nowrap">
            <Plus className="h-4 w-4" /> Add Course
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {viewMode === "list" ? renderTable() : <div className="p-6">{renderCards()}</div>}
      </div>

      {/* Modals */}
      {renderAddEditModal()}
      {renderDetailModal()}
      {renderLessonModal()}
      {renderQuizModal()}
      {renderExamModal()}
      {renderAssignmentModal()}
      {renderDeleteModal()}
    </div>
  )
}
