"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, X, Save, BookOpen, FileSpreadsheet, Search, Check, List, Users, ClipboardList, MessageSquare } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type ExamTerm = "Term 1" | "Term 2" | "Annual"
type ExamStatus = "draft" | "published" | "result-published"

type Exam = {
  id: number
  name: string
  term: ExamTerm
  class: string
  section: string
  assessment: string
  grade: string
  categoryName: string
  description: string
  publishExam: boolean
  publishResult: boolean
  status: ExamStatus
  subjectCount: number
  mailTemplates: number[]
  createdAt: string
}

type Template = {
  id: number
  name: string
  description: string
  fields: { name: string; type: string }[]
  isDefault: boolean
}

type Student = {
  id: number
  admissionNo: string
  name: string
  class: string
  section: string
  rollNo: number
  fatherName: string
  category: string
  gender: string
}

type ExamSubject = {
  id: number
  name: string
  theoryMax: number
  practicalMax: number
  theoryPass: number
  practicalPass: number
  date: string
  time: string
  room: string
}

type StudentMark = {
  studentId: number
  theoryMarks: number
  practicalMarks: number
  absent: boolean
  notes: string
}

type StudentAttendance = {
  studentId: number
  attendanceCount: number
  remark: string
}

type ApiTerm = { id: number; name: string; code: string }
type ApiAssessment = { id: number; name: string; description: string }
type ApiGrade = { id: number; title: string; description: string }

function Modal({ title, show, onClose, children, wide }: { title: string; show: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
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
const ExamModal = Modal

export default function ICSCExamPage() {
  const { data: exams, add, update, remove, loading } = useApi<Exam>("/api/icsc/exam")
  const { classNames: classes, sectionNames: sectionOptions } = useClassesAndSections();
  const { data: students } = useApi<Student>("/api/students")
  const { data: apiTerms } = useApi<ApiTerm>("/api/icsc/terms")
  const { data: apiAssessments } = useApi<ApiAssessment>("/api/icsc/assessments")
  const { data: apiGrades } = useApi<ApiGrade>("/api/icsc/exam-grades")
  const { data: apiTemplates } = useApi<Template>("/api/icsc/template")
  const terms = (apiTerms || []).map((t) => t.name) as ExamTerm[]
  const assessments = (apiAssessments || []).map((a) => a.name)
  const gradeList = apiGrades || []
  const templates = apiTemplates || []
  const [search, setSearch] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [showSubjectsModal, setShowSubjectsModal] = useState(false)
  const [showMarksModal, setShowMarksModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showRemarkModal, setShowRemarkModal] = useState(false)
  const [studentRemarks, setStudentRemarks] = useState<Record<number, string>>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({ name: "", term: "" as ExamTerm | "", class: "", section: "", assessment: "", grade: "", categoryName: "", description: "", publishExam: false, publishResult: false, mailTemplates: [] as number[] })
  const [editForm, setEditForm] = useState({ id: 0, name: "", term: "" as ExamTerm | "", class: "", section: "", assessment: "", grade: "", categoryName: "", description: "", publishExam: false, publishResult: false, mailTemplates: [] as number[] })

  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [subjects, setSubjects] = useState<ExamSubject[]>([])
  const [subjectForm, setSubjectForm] = useState({ name: "", theoryMax: "100", practicalMax: "50", theoryPass: "33", practicalPass: "17", date: "", time: "", room: "" })
  const [editSubjectId, setEditSubjectId] = useState<number | null>(null)
  const [showSubjectForm, setShowSubjectForm] = useState(false)

  const [studentMarks, setStudentMarks] = useState<Record<number, StudentMark[]>>({})
  const [activeMarkSubject, setActiveMarkSubject] = useState<string>("")

  const [studentAttendance, setStudentAttendance] = useState<Record<number, StudentAttendance[]>>({})
  const [totalAttendanceDays, setTotalAttendanceDays] = useState(180)

  const filtered = exams.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.class.toLowerCase().includes(search.toLowerCase()) ||
    e.term.toLowerCase().includes(search.toLowerCase())
  )

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e as React.ChangeEvent<HTMLInputElement>).target.checked : undefined
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e as React.ChangeEvent<HTMLInputElement>).target.checked : undefined
    setEditForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n })
  }

  const toggleMailTemplate = (templateId: number, isEdit: boolean) => {
    if (isEdit) {
      setEditForm((prev) => ({
        ...prev,
        mailTemplates: prev.mailTemplates.includes(templateId)
          ? prev.mailTemplates.filter((id) => id !== templateId)
          : [...prev.mailTemplates, templateId],
      }))
    } else {
      setForm((prev) => ({
        ...prev,
        mailTemplates: prev.mailTemplates.includes(templateId)
          ? prev.mailTemplates.filter((id) => id !== templateId)
          : [...prev.mailTemplates, templateId],
      }))
    }
  }

  const toggleSection = (sec: string, isEdit: boolean) => {
    const fn = (prev: typeof form) => {
      const current = (prev.section || "").split(",").filter(Boolean)
      if (sec === "Select All") {
        const allSelected = sectionOptions.every((s) => current.includes(s))
        return { ...prev, section: allSelected ? "" : sectionOptions.join(",") }
      }
      const next = current.includes(sec) ? current.filter((s) => s !== sec) : [...current, sec]
      return { ...prev, section: next.join(",") }
    }
    ;(isEdit ? setEditForm : setForm)(fn as never)
  }

  const validateForm = (data: typeof form) => {
    const errs: Record<string, string> = {}
    if (!data.name.trim()) errs.name = "Exam name is required"
    if (!data.term) errs.term = "Term is required"
    if (!data.class) errs.class = "Class is required"
    if (!(data.section || "").split(",").filter(Boolean).length) errs.section = "Section is required"
    if (!data.assessment) errs.assessment = "Assessment is required"
    if (!data.grade) errs.grade = "Grade is required"
    return errs
  }

  const handleAdd = async () => {
    const errs = validateForm(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const status: ExamStatus = form.publishResult ? "result-published" : form.publishExam ? "published" : "draft"
    try {
      await add({ name: form.name.trim(), term: form.term as ExamTerm, class: form.class, section: form.section, assessment: form.assessment, grade: form.grade, categoryName: form.categoryName.trim(), description: form.description.trim(), publishExam: form.publishExam, publishResult: form.publishResult, mailTemplates: form.mailTemplates, status })
      setShowAddModal(false)
      setForm({ name: "", term: "", class: "", section: "", assessment: "", grade: "", categoryName: "", description: "", publishExam: false, publishResult: false, mailTemplates: [] })
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const handleEditOpen = (exam: Exam) => {
    const mt = Array.isArray(exam.mailTemplates) ? exam.mailTemplates : (typeof exam.mailTemplates === "string" ? JSON.parse(exam.mailTemplates) : [])
    setEditForm({ id: exam.id, name: exam.name, term: exam.term, class: exam.class, section: exam.section, assessment: exam.assessment, grade: exam.grade, categoryName: exam.categoryName, description: exam.description, publishExam: exam.publishExam, publishResult: exam.publishResult, mailTemplates: mt })
    setErrors({})
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    const errs = validateForm(editForm)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const status: ExamStatus = editForm.publishResult ? "result-published" : editForm.publishExam ? "published" : "draft"
    try {
      await update(editForm.id, { name: editForm.name.trim(), term: editForm.term as ExamTerm, class: editForm.class, section: editForm.section, assessment: editForm.assessment, grade: editForm.grade, categoryName: editForm.categoryName.trim(), description: editForm.description.trim(), publishExam: editForm.publishExam, publishResult: editForm.publishResult, mailTemplates: editForm.mailTemplates, status })
      setShowEditModal(false)
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const handleDeleteOpen = (id: number) => { setDeleteId(id); setShowDeleteModal(true) }
  const confirmDelete = async () => {
    if (deleteId === null) return
    try {
      await remove(deleteId)
      setShowDeleteModal(false)
      setDeleteId(null)
    } catch (e: any) {
      setErrors({ name: e.message })
    }
  }

  const openStudentsModal = async (exam: Exam) => {
    setSelectedExam(exam)
    setSelectedStudents([])
    setShowStudentsModal(true)
    try {
      const res = await fetch(`/api/icsc/exam-students?exam_id=${exam.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedStudents(data.map((s: any) => s.student_id))
      }
    } catch {}
  }

  const saveStudents = async () => {
    if (!selectedExam) return
    try {
      await fetch(`/api/icsc/exam-students?exam_id=${selectedExam.id}`, { method: "DELETE" })
      for (const studentId of selectedStudents) {
        await fetch("/api/icsc/exam-students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exam_id: selectedExam.id, student_id: studentId }),
        })
      }
    } catch (e: any) {
      console.error("Failed to save students:", e)
    }
    setShowStudentsModal(false)
  }

  const toggleStudent = (id: number) => {
    setSelectedStudents((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  const selectAllStudents = () => {
    const studentList = students || []
    if (selectedStudents.length === studentList.length) setSelectedStudents([])
    else setSelectedStudents(studentList.map((s) => s.id))
  }

  const openSubjectsModal = async (exam: Exam) => {
    setSelectedExam(exam)
    setShowSubjectsModal(true)
    setShowSubjectForm(false)
    try {
      const res = await fetch(`/api/icsc/exam-subjects?exam_id=${exam.id}`)
      if (res.ok) {
        const data = await res.json()
        setSubjects(data)
      }
    } catch {}
  }

  const handleSubjectFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSubjectForm((prev) => ({ ...prev, [name]: value }))
  }

  const addOrEditSubject = async () => {
    if (!subjectForm.name.trim() || !selectedExam) return
    const payload = {
      examId: selectedExam.id,
      name: subjectForm.name.trim(),
      theoryMax: parseInt(subjectForm.theoryMax),
      practicalMax: parseInt(subjectForm.practicalMax),
      theoryPass: parseInt(subjectForm.theoryPass),
      practicalPass: parseInt(subjectForm.practicalPass),
      date: subjectForm.date || null,
      time: subjectForm.time || null,
      room: subjectForm.room || null,
    }
    try {
      if (editSubjectId !== null) {
        const res = await fetch("/api/icsc/exam-subjects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editSubjectId, ...payload }),
        })
        if (res.ok) {
          const saved = await res.json()
          setSubjects((prev) => prev.map((s) => s.id === editSubjectId ? saved : s))
        }
      } else {
        const res = await fetch("/api/icsc/exam-subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const saved = await res.json()
          setSubjects((prev) => [...prev, saved])
        }
      }
    } catch (e: any) {
      console.error("Failed to save subject:", e)
    }
    setSubjectForm({ name: "", theoryMax: "100", practicalMax: "50", theoryPass: "33", practicalPass: "17", date: "", time: "", room: "" })
    setEditSubjectId(null)
    setShowSubjectForm(false)
  }

  const editSubject = (subject: ExamSubject) => {
    setSubjectForm({ name: subject.name, theoryMax: subject.theoryMax.toString(), practicalMax: subject.practicalMax.toString(), theoryPass: subject.theoryPass.toString(), practicalPass: subject.practicalPass.toString(), date: subject.date, time: subject.time, room: subject.room })
    setEditSubjectId(subject.id)
    setShowSubjectForm(true)
  }

  const deleteSubject = async (id: number) => {
    try {
      await fetch(`/api/icsc/exam-subjects?id=${id}`, { method: "DELETE" })
      setSubjects((prev) => prev.filter((s) => s.id !== id))
    } catch {}
  }

  const loadMarks = async (examId: number, subjectId: number) => {
    try {
      const res = await fetch(`/api/icsc/exam-marks?exam_id=${examId}&subject_id=${subjectId}`)
      if (res.ok) {
        const data = await res.json()
        const marksMap: Record<number, StudentMark[]> = {}
        data.forEach((m: any) => {
          marksMap[m.student_id] = [{
            studentId: m.student_id,
            theoryMarks: Number(m.theory_marks) || 0,
            practicalMarks: Number(m.practical_marks) || 0,
            absent: m.absent || false,
            notes: m.notes || "",
          }]
        })
        setStudentMarks(marksMap)
      } else {
        setStudentMarks({})
      }
    } catch {
      setStudentMarks({})
    }
  }

  const openMarksModal = async (exam: Exam) => {
    setSelectedExam(exam)
    setShowMarksModal(true)
    // Always fetch this exam's own subjects (state may hold another exam's)
    try {
      const res = await fetch(`/api/icsc/exam-subjects?exam_id=${exam.id}`)
      const data = res.ok ? await res.json() : []
      setSubjects(data)
      if (data.length > 0 && !data.some((s: ExamSubject) => s.name === activeMarkSubject)) {
        setActiveMarkSubject(data[0].name)
        await loadMarks(exam.id, data[0].id)
      } else if (data.length > 0) {
        const current = data.find((s: ExamSubject) => s.name === activeMarkSubject)
        await loadMarks(exam.id, current.id)
      }
    } catch {}
  }

  const changeMarkSubject = async (subjectName: string) => {
    setActiveMarkSubject(subjectName)
    if (!selectedExam) return
    const subject = subjects.find((s) => s.name === subjectName)
    if (subject) await loadMarks(selectedExam.id, subject.id)
  }

  const saveMarks = async () => {
    if (!selectedExam || !activeMarkSubject) return
    const subject = subjects.find((s) => s.name === activeMarkSubject)
    if (!subject) return
    try {
      await fetch(`/api/icsc/exam-marks?exam_id=${selectedExam.id}&subject_id=${subject.id}`, { method: "DELETE" })
      for (const marks of Object.values(studentMarks)) {
        for (const mark of marks) {
          await fetch("/api/icsc/exam-marks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exam_id: selectedExam.id,
              student_id: mark.studentId,
              subject_id: subject.id,
              theory_marks: mark.theoryMarks,
              practical_marks: mark.practicalMarks,
              absent: mark.absent,
              notes: mark.notes,
            }),
          })
        }
      }
    } catch (e) {
      console.error("Failed to save marks:", e)
    }
    setShowMarksModal(false)
  }

  const getStudentMarks = (studentId: number, subjectName: string): StudentMark => {
    const examMarks = studentMarks[studentId] || []
    return examMarks.find((m) => m.studentId === studentId) || { studentId, theoryMarks: 0, practicalMarks: 0, absent: false, notes: "" }
  }

  const updateStudentMark = (studentId: number, field: keyof StudentMark, value: string | boolean) => {
    setStudentMarks((prev) => {
      const current = [...(prev[studentId] || [])]
      const idx = current.findIndex((m) => m.studentId === studentId)
      if (idx >= 0) {
        if (field === "absent") current[idx] = { ...current[idx], absent: value as boolean, theoryMarks: value ? 0 : current[idx].theoryMarks, practicalMarks: value ? 0 : current[idx].practicalMarks }
        else if (field === "theoryMarks" || field === "practicalMarks") current[idx] = { ...current[idx], [field]: parseFloat(value as string) || 0 }
        else current[idx] = { ...current[idx], [field]: value }
      } else {
        const newMark: StudentMark = { studentId, theoryMarks: 0, practicalMarks: 0, absent: false, notes: "" }
        if (field === "absent") newMark.absent = value as boolean
        else if (field === "theoryMarks") newMark.theoryMarks = parseFloat(value as string) || 0
        else if (field === "practicalMarks") newMark.practicalMarks = parseFloat(value as string) || 0
        else newMark.notes = value as string
        current.push(newMark)
      }
      return { ...prev, [studentId]: current }
    })
  }

  const openAttendanceModal = async (exam: Exam) => {
    setSelectedExam(exam)
    setShowAttendanceModal(true)
    try {
      const res = await fetch(`/api/icsc/exam-attendance?exam_id=${exam.id}`)
      if (res.ok) {
        const data = await res.json()
        const attMap: Record<number, StudentAttendance[]> = {}
        data.forEach((a: any) => {
          attMap[a.student_id] = [{ studentId: a.student_id, attendanceCount: a.attendance_count || 0, remark: a.remark || "" }]
        })
        setStudentAttendance(attMap)
      }
    } catch {}
  }

  const saveAttendance = async () => {
    if (!selectedExam) return
    try {
      await fetch(`/api/icsc/exam-attendance?exam_id=${selectedExam.id}`, { method: "DELETE" })
      for (const [studentId, records] of Object.entries(studentAttendance)) {
        for (const rec of records) {
          await fetch("/api/icsc/exam-attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exam_id: selectedExam.id,
              student_id: parseInt(studentId),
              attendance_count: rec.attendanceCount,
              remark: rec.remark,
            }),
          })
        }
      }
    } catch (e) {
      console.error("Failed to save attendance:", e)
    }
    setShowAttendanceModal(false)
  }

  const [studentTotals, setStudentTotals] = useState<Record<number, number>>({})

  const openRemarkModal = async (exam: Exam) => {
    setSelectedExam(exam)
    setShowRemarkModal(true)
    try {
      const [attRes, marksRes] = await Promise.all([
        fetch(`/api/icsc/exam-attendance?exam_id=${exam.id}`),
        fetch(`/api/icsc/exam-marks?exam_id=${exam.id}`),
      ])
      const remarkMap: Record<number, string> = {}
      if (attRes.ok) {
        const data = await attRes.json()
        data.forEach((a: any) => { remarkMap[a.studentId || a.student_id] = a.remark || "" })
      }
      setStudentRemarks(remarkMap)
      const totalMap: Record<number, number> = {}
      if (marksRes.ok) {
        const marks = await marksRes.json()
        marks.forEach((m: any) => {
          const sid = m.studentId || m.student_id
          totalMap[sid] = (totalMap[sid] || 0) + (m.theoryMarks || m.theory_marks || 0) + (m.practicalMarks || m.practical_marks || 0)
        })
      }
      setStudentTotals(totalMap)
    } catch { setStudentRemarks({}); setStudentTotals({}) }
  }

  const saveRemarks = async () => {
    if (!selectedExam) return
    try {
      const existing = await (await fetch(`/api/icsc/exam-attendance?exam_id=${selectedExam.id}`)).json()
      const existingMap: Record<number, any> = {}
      existing.forEach((a: any) => { existingMap[a.studentId || a.student_id] = a })

      for (const [sid, remark] of Object.entries(studentRemarks)) {
        const studentId = parseInt(sid)
        const record = existingMap[studentId]
        if (record?.id) {
          await fetch("/api/icsc/exam-attendance", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: record.id, examId: selectedExam.id, studentId, attendanceCount: record.attendanceCount ?? record.attendance_count ?? 0, remark }),
          })
        } else {
          await fetch("/api/icsc/exam-attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ examId: selectedExam.id, studentId, attendanceCount: 0, remark }),
          })
        }
      }
    } catch (e) { console.error("Failed to save remarks:", e) }
    setShowRemarkModal(false)
  }

  const updateStudentAttendance = (studentId: number, field: "attendanceCount" | "remark", value: string) => {
    setStudentAttendance((prev) => {
      const current = [...(prev[studentId] || [])]
      const idx = current.findIndex((a) => a.studentId === studentId)
      if (idx >= 0) {
        if (field === "attendanceCount") current[idx] = { ...current[idx], attendanceCount: parseInt(value) || 0 }
        else current[idx] = { ...current[idx], remark: value }
      } else {
        current.push({ studentId, attendanceCount: field === "attendanceCount" ? parseInt(value) || 0 : 0, remark: field === "remark" ? value : "" })
      }
      return { ...prev, [studentId]: current }
    })
  }

  const Modal = ExamModal

  const statusBadge = (status: ExamStatus) => {
    const styles = { draft: "bg-gray-100 text-gray-600", published: "bg-green-100 text-green-700", "result-published": "bg-blue-100 text-blue-700" }
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{status === "result-published" ? "Result Published" : status.charAt(0).toUpperCase() + status.slice(1)}</span>
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">ICSC Exam</h2>
          <p className="text-sm text-[var(--primary)]/80 mt-0.5">ICSC Examination / Exam</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-700">Exam List</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exams..."
                className="w-64 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <button onClick={() => { setForm({ name: "", term: "", class: "", section: "", assessment: "", grade: "", categoryName: "", description: "", publishExam: false, publishResult: false, mailTemplates: [] }); setErrors({}); setShowAddModal(true) }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">
              <Plus className="h-4 w-4" /> Add Exam
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Exam Name", "Class (Sections)", "Term", "Subjects Included", "Exam Published", "Published Result", "Category Name", "Description", "Created At", "Action"].map((h) => (
                  <th key={h} className="text-left px-3 py-3 font-semibold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">No exams found</td></tr>
              ) : (
                filtered.map((exam) => (
                  <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">{exam.name}</td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{exam.class} ({exam.section})</td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{exam.term}</td>
                    <td className="px-3 py-3 text-gray-600">{exam.subjectCount ?? 0}</td>
                    <td className="px-3 py-3 text-center">{exam.publishExam ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3 text-center">{exam.publishResult ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{exam.categoryName || "—"}</td>
                    <td className="px-3 py-3 text-gray-600 max-w-[160px] truncate">{exam.description || "—"}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : "—"}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openStudentsModal(exam)} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Assign Students"><Users className="h-4 w-4" /></button>
                        <button onClick={() => openSubjectsModal(exam)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Exam Subjects"><BookOpen className="h-4 w-4" /></button>
                        <button onClick={() => openMarksModal(exam)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Exam Subjects Marks"><FileSpreadsheet className="h-4 w-4" /></button>
                        <button onClick={() => openAttendanceModal(exam)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Exam Attendance"><ClipboardList className="h-4 w-4" /></button>
                        <button onClick={() => openRemarkModal(exam)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Teacher Remark"><MessageSquare className="h-4 w-4" /></button>
                        <button onClick={() => handleEditOpen(exam)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit Exam"><Pencil className="h-4 w-4" /></button>
                        <Link href={`/admin/cbse-examination/exam/examwise-rank/${exam.id}`} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Generate Rank"><List className="h-4 w-4" /></Link>
                        <button onClick={() => handleDeleteOpen(exam.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>Showing {filtered.length} of {exams.length} records</span>
        </div>
      </div>

      <Modal title="Add Exam" show={showAddModal} onClose={() => setShowAddModal(false)} wide>
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={form.name} onChange={handleFormChange} placeholder="Enter exam name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Description</label>
              <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Enter description" rows={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="publishExam" checked={form.publishExam} onChange={handleFormChange} className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Publish Exam
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="publishResult" checked={form.publishResult} onChange={handleFormChange} className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Publish Result
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Term <span className="text-red-500">*</span></label>
              <select name="term" value={form.term} onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {terms.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.term && <p className="text-red-500 text-xs mt-1">{errors.term}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Class <span className="text-red-500">*</span></label>
              <select name="class" value={form.class} onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Section <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg min-h-[38px]">
                {["Select All", ...sectionOptions].map((opt) => {
                  const selected = opt === "Select All"
                    ? sectionOptions.every((s) => (form.section || "").split(",").filter(Boolean).includes(s))
                    : (form.section || "").split(",").filter(Boolean).includes(opt)
                  return (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input type="checkbox" checked={selected} onChange={() => toggleSection(opt, false)}
                        className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                      {opt}
                    </label>
                  )
                })}
              </div>
              {errors.section && <p className="text-red-500 text-xs mt-1">{errors.section}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Category</label>
              <select name="categoryName" value={form.categoryName} onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                <option value="Main Subjects">Main Subjects</option>
                <option value="Internal Assessment">Internal Assessment</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Assessment <span className="text-red-500">*</span></label>
              <select name="assessment" value={form.assessment} onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {assessments.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.assessment && <p className="text-red-500 text-xs mt-1">{errors.assessment}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Grade <span className="text-red-500">*</span></label>
              <select name="grade" value={form.grade} onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {gradeList.map((g) => <option key={g.id} value={g.title}>{g.title}</option>)}
              </select>
              {errors.grade && <p className="text-red-500 text-xs mt-1">{errors.grade}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Select Template To Mail</label>
            <div className="border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
              {templates.length === 0 ? (
                <p className="text-xs text-gray-400 py-1">No templates available</p>
              ) : (
                templates.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer py-0.5">
                    <input type="checkbox" checked={form.mailTemplates.includes(t.id)} onChange={() => toggleMailTemplate(t.id, false)}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                    {t.name}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

      <Modal title="Edit Exam" show={showEditModal} onClose={() => setShowEditModal(false)} wide>
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Exam Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={editForm.name} onChange={handleEditFormChange} placeholder="Enter exam name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Description</label>
              <textarea name="description" value={editForm.description} onChange={handleEditFormChange} placeholder="Enter description" rows={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="publishExam" checked={editForm.publishExam} onChange={handleEditFormChange} className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Publish Exam
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="publishResult" checked={editForm.publishResult} onChange={handleEditFormChange} className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
              Publish Result
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Term <span className="text-red-500">*</span></label>
              <select name="term" value={editForm.term} onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {terms.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.term && <p className="text-red-500 text-xs mt-1">{errors.term}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Class <span className="text-red-500">*</span></label>
              <select name="class" value={editForm.class} onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Section <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg min-h-[38px]">
                {["Select All", ...sectionOptions].map((opt) => {
                  const selected = opt === "Select All"
                    ? sectionOptions.every((s) => (editForm.section || "").split(",").filter(Boolean).includes(s))
                    : (editForm.section || "").split(",").filter(Boolean).includes(opt)
                  return (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input type="checkbox" checked={selected} onChange={() => toggleSection(opt, true)}
                        className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                      {opt}
                    </label>
                  )
                })}
              </div>
              {errors.section && <p className="text-red-500 text-xs mt-1">{errors.section}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Category</label>
              <select name="categoryName" value={editForm.categoryName} onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                <option value="Main Subjects">Main Subjects</option>
                <option value="Internal Assessment">Internal Assessment</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Assessment <span className="text-red-500">*</span></label>
              <select name="assessment" value={editForm.assessment} onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {assessments.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.assessment && <p className="text-red-500 text-xs mt-1">{errors.assessment}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Grade <span className="text-red-500">*</span></label>
              <select name="grade" value={editForm.grade} onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                {gradeList.map((g) => <option key={g.id} value={g.title}>{g.title}</option>)}
              </select>
              {errors.grade && <p className="text-red-500 text-xs mt-1">{errors.grade}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Select Template To Mail</label>
            <div className="border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
              {templates.length === 0 ? (
                <p className="text-xs text-gray-400 py-1">No templates available</p>
              ) : (
                templates.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer py-0.5">
                    <input type="checkbox" checked={editForm.mailTemplates.includes(t.id)} onChange={() => toggleMailTemplate(t.id, true)}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                    {t.name}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleEditSave} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Save className="h-4 w-4" /> Save</button>
        </div>
      </Modal>

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
                {deleteId && <strong className="block mt-1 text-gray-800">{exams.find((e) => e.id === deleteId)?.name}</strong>}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><X className="h-4 w-4" /> Cancel</button>
              <button onClick={confirmDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}

      <Modal title={`Assign Students - ${selectedExam?.name || ""}`} show={showStudentsModal} onClose={() => setShowStudentsModal(false)} wide>
        <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">Select students to assign to this exam</p>
            <button onClick={selectAllStudents} className="text-xs text-[var(--primary)] hover:text-[var(--secondary)] font-medium">
              {selectedStudents.length === (students || []).length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-2 py-2"></th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Admission No</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Class (Section)</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Father Name</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Category</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Gender</th>
              </tr>
            </thead>
            <tbody>
              {(students || []).map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-2">
                    <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                  </td>
                  <td className="px-2 py-2 font-medium text-gray-800 whitespace-nowrap">{s.name}</td>
                  <td className="px-2 py-2 text-gray-600 font-mono text-xs">{s.admissionNo}</td>
                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{s.class} - {s.section}</td>
                  <td className="px-2 py-2 text-gray-600">{s.fatherName || "—"}</td>
                  <td className="px-2 py-2 text-gray-600">{s.category || "—"}</td>
                  <td className="px-2 py-2 text-gray-600">{s.gender || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">{selectedStudents.length} student(s) selected</span>
          <button onClick={saveStudents} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Done</button>
        </div>
      </Modal>

      <Modal title={`Exam Subjects - ${selectedExam?.name || ""}`} show={showSubjectsModal} onClose={() => setShowSubjectsModal(false)} wide>
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex justify-end">
            <button onClick={() => { setSubjectForm({ name: "", theoryMax: "100", practicalMax: "50", theoryPass: "33", practicalPass: "17", date: "", time: "", room: "" }); setEditSubjectId(null); setShowSubjectForm(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Plus className="h-3.5 w-3.5" /> Add Exam Subject</button>
          </div>
          {showSubjectForm && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Subject Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={subjectForm.name} onChange={handleSubjectFormChange} placeholder="e.g. Mathematics"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Date</label>
                  <input type="date" name="date" value={subjectForm.date} onChange={handleSubjectFormChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Theory Max</label>
                  <input type="number" name="theoryMax" value={subjectForm.theoryMax} onChange={handleSubjectFormChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Practical Max</label>
                  <input type="number" name="practicalMax" value={subjectForm.practicalMax} onChange={handleSubjectFormChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Time</label>
                  <input type="time" name="time" value={subjectForm.time} onChange={handleSubjectFormChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Room</label>
                  <input type="text" name="room" value={subjectForm.room} onChange={handleSubjectFormChange} placeholder="Room no."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowSubjectForm(false)} className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={addOrEditSubject} className="px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--secondary)]">{editSubjectId !== null ? "Update" : "Add"}</button>
              </div>
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Subject", "Theory Max", "Practical Max", "Date", "Time", "Room", "Action"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-6 text-gray-400">No subjects added yet</td></tr>
              ) : (
                subjects.map((s, idx) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{s.name}</td>
                    <td className="px-3 py-2 text-gray-600">{s.theoryMax}</td>
                    <td className="px-3 py-2 text-gray-600">{s.practicalMax}</td>
                    <td className="px-3 py-2 text-gray-600">{s.date || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{s.time || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{s.room || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => editSubject(s)} className="p-1 text-amber-600 hover:bg-amber-50 rounded" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteSubject(s.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => setShowSubjectsModal(false)} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Done</button>
        </div>
      </Modal>

      <Modal title={`Exam Marks - ${selectedExam?.name || ""}`} show={showMarksModal} onClose={() => setShowMarksModal(false)} wide>
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {subjects.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-gray-400">No subjects added for this exam yet.</p>
              <button onClick={() => { setShowMarksModal(false); if (selectedExam) openSubjectsModal(selectedExam) }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors"><Plus className="h-3.5 w-3.5" /> Add Exam Subject</button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-600">Select Subject:</label>
                <select value={activeMarkSubject} onChange={(e) => changeMarkSubject(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                  {subjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                {(() => {
                  const active = subjects.find((s) => s.name === activeMarkSubject)
                  return active ? (
                    <span className="text-xs text-gray-400">Theory max {active.theoryMax} · Practical max {active.practicalMax}</span>
                  ) : null
                })()}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">#</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">Student</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">Theory Marks</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">Practical Marks</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">Absent</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(students || []).map((s, idx) => {
                    const mark = getStudentMarks(s.id, activeMarkSubject)
                    const active = subjects.find((subj) => subj.name === activeMarkSubject)
                    return (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{s.name}</td>
                        <td className="px-3 py-2">
                          <input type="number" value={mark.absent ? "" : mark.theoryMarks || ""} onChange={(e) => updateStudentMark(s.id, "theoryMarks", e.target.value)} disabled={mark.absent}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent disabled:bg-gray-100" min="0" max={active?.theoryMax} />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={mark.absent ? "" : mark.practicalMarks || ""} onChange={(e) => updateStudentMark(s.id, "practicalMarks", e.target.value)} disabled={mark.absent}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent disabled:bg-gray-100" min="0" max={active?.practicalMax} />
                        </td>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={mark.absent} onChange={(e) => updateStudentMark(s.id, "absent", e.target.checked)}
                            className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="text" value={mark.notes} onChange={(e) => updateStudentMark(s.id, "notes", e.target.value)} placeholder="Notes"
                            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={saveMarks} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Done</button>
        </div>
      </Modal>

      <Modal title={`Attendance / Remark - ${selectedExam?.name || ""}`} show={showAttendanceModal} onClose={() => setShowAttendanceModal(false)} wide>
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-600">Total Attendance Days:</label>
            <input type="number" value={totalAttendanceDays} onChange={(e) => setTotalAttendanceDays(parseInt(e.target.value) || 0)}
              className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" min="1" />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-2 py-2"></th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Admission No</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Class (Section)</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Father Name</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Category</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Gender</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Attendance Count</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Teacher Remark</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => {
                const att = studentAttendance[s.id]?.[0]
                return (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-2 text-gray-600">{idx + 1}</td>
                    <td className="px-2 py-2 font-medium text-gray-800 whitespace-nowrap">{s.name}</td>
                    <td className="px-2 py-2 text-gray-600 font-mono text-xs">{s.admissionNo}</td>
                    <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{s.class} - {s.section}</td>
                    <td className="px-2 py-2 text-gray-600">{s.fatherName || "—"}</td>
                    <td className="px-2 py-2 text-gray-600">{s.category || "—"}</td>
                    <td className="px-2 py-2 text-gray-600">{s.gender || "—"}</td>
                    <td className="px-2 py-2">
                      <input type="number" value={att?.attendanceCount ?? ""} onChange={(e) => updateStudentAttendance(s.id, "attendanceCount", e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" min="0" max={totalAttendanceDays} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={att?.remark ?? ""} onChange={(e) => updateStudentAttendance(s.id, "remark", e.target.value)} placeholder="Remark"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[120px]" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={saveAttendance} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Done</button>
        </div>
      </Modal>

      <Modal title={`Teacher Remark - ${selectedExam?.name || ""}`} show={showRemarkModal} onClose={() => setShowRemarkModal(false)} wide>
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-2 py-2"></th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Admission No</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Roll No.</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Class</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Section</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Student Name</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Gender</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Marks</th>
                <th className="text-left px-2 py-2 font-semibold text-gray-600 text-xs uppercase">Remark</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-2 text-gray-600">{idx + 1}</td>
                  <td className="px-2 py-2 text-gray-600 font-mono text-xs">{s.admissionNo}</td>
                  <td className="px-2 py-2 text-gray-600">{s.rollNo}</td>
                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{s.class}</td>
                  <td className="px-2 py-2 text-gray-600">{s.section}</td>
                  <td className="px-2 py-2 font-medium text-gray-800 whitespace-nowrap">{s.name}</td>
                  <td className="px-2 py-2 text-gray-600">{s.gender || "—"}</td>
                  <td className="px-2 py-2 text-gray-600 font-medium">{studentTotals[s.id]?.toFixed(2) ?? "—"}</td>
                  <td className="px-2 py-2">
                    <input type="text" value={studentRemarks[s.id] ?? ""} onChange={(e) => setStudentRemarks((prev) => ({ ...prev, [s.id]: e.target.value }))} placeholder="Enter remark"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent min-w-[160px]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={saveRemarks} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors">Save</button>
        </div>
      </Modal>
    </div>
  )
}
