"use client"

import { useState, useMemo } from "react"
import { Search, X, Save, Users, GraduationCap, BookOpen } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

type ClassItem = { id?: number; name: string }
type Section = { id?: number; name: string }
type ExamGroup = { id?: number; name: string }
type SessionItem = { id?: number; name: string; session?: string }
type Student = { id: number; admissionNo?: string; admission_no?: string; name: string; firstname?: string; lastname?: string; class?: string; section?: string }

const GRADES_7 = ["A+", "A", "B+", "B", "C+", "C", "D"]
const GRADES_5 = ["Excellent", "Very Good", "Good", "Satisfactory", "Needs Improvement"]

const KG_ENGLISH_POINTS: { id: number; label: string }[] = [
  { id: 1, label: "Identification of Phonic Sounds" },
  { id: 2, label: "Recognition of Alphabets + Identification of Objects Around" },
  { id: 3, label: "Understanding of the Topic" },
  { id: 4, label: "Conversational Ability" },
  { id: 5, label: "Basic Strokes / Letters" },
  { id: 6, label: "Writing Ability + Written Work" },
  { id: 7, label: "Picture Reading Ability" },
  { id: 8, label: "Spelling Ability" },
]
const KG_MATH_POINTS: { id: number; label: string }[] = [
  { id: 9, label: "Identification of Numbers" },
  { id: 10, label: "Classifies Objects with Respect to Numbers" },
  { id: 11, label: "Verbal Counting" },
  { id: 12, label: "Writing Ability + Written Work" },
  { id: 13, label: "Understanding of the Concept" },
]
const KG_LANGUAGE_POINTS: { id: number; label: string }[] = [
  { id: 14, label: "Identification of Letters" },
  { id: 15, label: "Understanding of the Topic" },
  { id: 16, label: "Writing Ability + Written Work" },
]

const OTHER_SUBJECTS = [
  { key: "environmental", label: "c) ENVIRONMENTAL STUDY" },
  { key: "rhymes", label: "d) RHYMES" },
  { key: "art_craft", label: "e) ART & CRAFT WORK" },
]

const WORK_HABITS = [
  { key: "attentiveness", label: "Attentiveness" },
  { key: "eagerness", label: "Eagerness" },
  { key: "neatness", label: "Neatness" },
  { key: "completion", label: "Completion" },
]

const SENSORIAL = [
  { key: "colours", label: "Recognition of Colours" },
  { key: "shapes", label: "Recognition of Shapes" },
  { key: "sizes", label: "Recognition of Sizes" },
  { key: "weight", label: "Recognition of Weight" },
]

const SOCIAL = [
  { key: "punctuality", label: "Punctuality" },
  { key: "responsibility", label: "Responsibility" },
  { key: "courtesy", label: "Courtesy" },
  { key: "friendly", label: "Friendly" },
  { key: "response", label: "Response" },
  { key: "tidiness", label: "Tidiness" },
]

const TABS = [
  { id: "english", label: "Subject: a) ENGLISH" },
  { id: "math", label: "Subject: b) MATHEMATICS" },
  { id: "language", label: "Subject: c) 2nd LANGUAGE" },
  { id: "other", label: "Other Subjects" },
  { id: "work", label: "WORK HABITS" },
  { id: "sensorial", label: "SENSORIAL" },
  { id: "social", label: "SOCIAL & PERSONAL DEVELOPMENT" },
  { id: "attendance", label: "REGULARITY RECORD" },
  { id: "remarks", label: "TEACHER REMARKS" },
] as const

export default function ICSECustomMarksheetEntryPage() {
  const { classNames, sectionNames } = useClassesAndSections()
  const { data: sessions } = useApi<SessionItem>("/api/system-setting/session")
  const { data: examGroups } = useApi<ExamGroup>("/api/icse/exam")
  // student list will be fetched on demand via search

  const [filters, setFilters] = useState({ class_id: "", section_id: "", exam_group_id: "", session_id: "" })
  const [students, setStudents] = useState<Student[]>([])
  const [enteredIds, setEnteredIds] = useState<Set<number>>(new Set())
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [activeStudent, setActiveStudent] = useState<Student | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("english")
  const [saving, setSaving] = useState(false)

  // form state per tab: store as Record<key, {half, annual}>
  const [englishData, setEnglishData] = useState<Record<string, { half: string; annual: string }>>({})
  const [mathData, setMathData] = useState<Record<string, { half: string; annual: string }>>({})
  const [langData, setLangData] = useState<Record<string, { half: string; annual: string }>>({})
  const [otherData, setOtherData] = useState<Record<string, { half: string; annual: string }>>({})
  const [workData, setWorkData] = useState<Record<string, { half: string; annual: string }>>({})
  const [sensorialData, setSensorialData] = useState<Record<string, { half: string; annual: string }>>({})
  const [socialData, setSocialData] = useState<Record<string, { half: string; annual: string }>>({})
  const [attendance, setAttendance] = useState({ half_working: "", half_present: "", annual_working: "", annual_present: "" })
  const [remarks, setRemarks] = useState({ half: "", annual: "" })

  const handleSearch = async () => {
    if (!filters.class_id || !filters.section_id) return
    setLoadingStudents(true)
    try {
      // Use student-information/student filtered by class/section
      const qs = new URLSearchParams()
      if (filters.class_id) qs.set("class_id", filters.class_id)
      if (filters.section_id) qs.set("section_id", filters.section_id)
      const res = await fetch(`/api/student-information/student?${qs.toString()}`)
      const data = await res.json()
      const list: Student[] = Array.isArray(data) ? data : data.students || []
      // Normalize to our Student type
      const norm = list.map((s: any) => ({
        id: s.id,
        admissionNo: s.admission_no || s.admissionNo,
        name: s.name || `${s.firstName || s.firstname || ""} ${s.middleName || ""} ${s.lastName || s.lastname || ""}`.trim().replace(/\s+/g, " "),
        class: s.class || "",
        section: s.section || "",
      }))
      setStudents(norm)
      // Batch-check which students already have entries for the selected filters
      if (norm.length > 0) {
        try {
          const qs = new URLSearchParams({
            student_id: norm.map((s: any) => s.id).join(","),
            class_id: filters.class_id,
            section_id: filters.section_id,
          })
          if (filters.session_id) qs.set("session_id", filters.session_id)
          if (filters.exam_group_id) qs.set("exam_group_id", filters.exam_group_id)
          const res = await fetch(`/api/icse/custom-marksheet-entry?${qs.toString()}`)
          const body = await res.json()
          setEnteredIds(new Set(body && Array.isArray(body.entered) ? body.entered : []))
        } catch {
          setEnteredIds(new Set())
        }
      } else {
        setEnteredIds(new Set())
      }
    } catch {
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const openForStudent = async (stu: Student) => {
    setActiveStudent(stu)
    setActiveTab("english")
    // Reset or load existing: try to fetch saved entry if exists via ICSE API (if implemented)
    // For now, reset to empty and allow fresh entry; attempt to load from API silently
    setEnglishData({})
    setMathData({})
    setLangData({})
    setOtherData({})
    setWorkData({})
    setSensorialData({})
    setSocialData({})
    setAttendance({ half_working: "", half_present: "", annual_working: "", annual_present: "" })
    setRemarks({ half: "", annual: "" })
    setShowModal(true)
    try {
      const res = await fetch(`/api/icse/custom-marksheet-entry?student_id=${stu.id}&session_id=${filters.session_id}&class_id=${filters.class_id}&section_id=${filters.section_id}&exam_group_id=${filters.exam_group_id}`)
      if (res.ok) {
        const saved = await res.json()
        if (saved && saved.data) {
          // Hydrate if backend returns structured data
          const d = saved.data
          if (d.kg_english) setEnglishData(d.kg_english)
          if (d.kg_math) setMathData(d.kg_math)
          if (d.kg_language) setLangData(d.kg_language)
          if (d.kg_other) setOtherData(d.kg_other)
          if (d.kg_work_habits) setWorkData(d.kg_work_habits)
          if (d.kg_sensorial) setSensorialData(d.kg_sensorial)
          if (d.kg_social) setSocialData(d.kg_social)
          if (d.kg_attendance) setAttendance(d.kg_attendance)
          if (d.kg_remarks) setRemarks(d.kg_remarks)
        }
      }
    } catch {}
  }

  const handleSave = async () => {
    if (!activeStudent) return
    setSaving(true)
    try {
      const payload = {
        student_id: activeStudent.id,
        class_id: filters.class_id,
        section_id: filters.section_id,
        session_id: filters.session_id,
        exam_group_id: filters.exam_group_id,
        category: "kg",
        kg_english: englishData,
        kg_math: mathData,
        kg_language: langData,
        kg_other: otherData,
        kg_work_habits: workData,
        kg_sensorial: sensorialData,
        kg_social: socialData,
        kg_attendance: attendance,
        kg_remarks: remarks,
      }
      const res = await fetch("/api/icse/custom-marksheet-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to save")
      setEnteredIds((prev) => new Set(prev).add(activeStudent.id))
      setShowModal(false)
    } catch (e: any) {
      alert(e.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const renderGradeRow = (
    label: string,
    key: string,
    value: { half: string; annual: string } | undefined,
    onChange: (half: string, annual: string) => void,
    options: string[]
  ) => (
    <tr key={key} className="border-b last:border-0">
      <td className="px-3 py-2 text-sm text-gray-700 w-1/3">{label}</td>
      <td className="px-2 py-1">
        <select value={value?.half || ""} onChange={(e) => onChange(e.target.value, value?.annual || "")} className="w-full rounded border border-gray-300 px-2 py-1 text-sm">
          <option value="">-</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1">
        <select value={value?.annual || ""} onChange={(e) => onChange(value?.half || "", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-sm">
          <option value="">-</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">ICSE Custom Marksheet Entry</h2>
          <p className="text-sm text-white/80 mt-1">ICSE Examination / Custom Marksheet Entry — KG Entry (ENGLISH, MATHEMATICS, 2nd LANGUAGE...)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Criteria</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class *</label>
            <select value={filters.class_id} onChange={(e) => setFilters({ ...filters, class_id: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select Class</option>
              {classNames.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Section *</label>
            <select value={filters.section_id} onChange={(e) => setFilters({ ...filters, section_id: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select Section</option>
              {sectionNames.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Exam Group *</label>
            <select value={filters.exam_group_id} onChange={(e) => setFilters({ ...filters, exam_group_id: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select Exam Group</option>
              {examGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
            <select value={filters.session_id} onChange={(e) => setFilters({ ...filters, session_id: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select Session</option>
              {sessions.map((s: any) => (
                <option key={s.id} value={s.id}>{s.session || s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSearch} className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] flex items-center gap-2">
            <Search className="h-4 w-4" /> Search
          </button>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Students</h4>
          {loadingStudents ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-gray-400">No students found. Select Class/Section and Search.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Admission No</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Student Name</th><th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">Action</th></tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs">{s.admissionNo || "-"}</td>
                      <td className="px-4 py-2 font-medium">{s.name}</td>
                      <td className="px-4 py-2 text-right"><button onClick={() => openForStudent(s)} className={`px-3 py-1.5 text-white text-xs rounded-lg ${enteredIds.has(s.id) ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[var(--primary)] hover:bg-[var(--secondary)]"}`}>{enteredIds.has(s.id) ? "Update Fields" : "Enter Custom Fields"}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col z-10">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2"><GraduationCap className="h-5 w-5" /> {activeStudent.name} — {filters.class_id} / {filters.section_id}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex border-b bg-gray-50 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? "border-[var(--primary)] text-[var(--primary)] bg-white" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {activeTab === "english" && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Subject: a) ENGLISH</h4>
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Sub Point</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Half Yearly</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Annual</th></tr></thead>
                    <tbody>
                      {KG_ENGLISH_POINTS.map((sp) => {
                        const key = String(sp.id)
                        const val = englishData[key]
                        return (
                          <tr key={sp.id} className="border-b last:border-0">
                            <td className="px-3 py-2 text-sm text-gray-700 w-1/3">{sp.label}</td>
                            <td className="px-2 py-1">
                              <select value={val?.half || ""} onChange={(e) => setEnglishData((p) => ({ ...p, [key]: { half: e.target.value, annual: val?.annual || "" } }))} className="w-full rounded border border-gray-300 px-2 py-1 text-sm">
                                <option value="">Select Grade</option>
                                <option value="A+">A+ (Excellent)</option>
                                <option value="A">A (Very Good)</option>
                                <option value="B+">B+ (Good)</option>
                                <option value="B">B (Satisfactory)</option>
                                <option value="C+">C+ (Average)</option>
                                <option value="C">C (Needs Improvement)</option>
                                <option value="D">D (Below Average)</option>
                              </select>
                            </td>
                            <td className="px-2 py-1">
                              <select value={val?.annual || ""} onChange={(e) => setEnglishData((p) => ({ ...p, [key]: { half: val?.half || "", annual: e.target.value } }))} className="w-full rounded border border-gray-300 px-2 py-1 text-sm">
                                <option value="">Select Grade</option>
                                <option value="A+">A+ (Excellent)</option>
                                <option value="A">A (Very Good)</option>
                                <option value="B+">B+ (Good)</option>
                                <option value="B">B (Satisfactory)</option>
                                <option value="C+">C+ (Average)</option>
                                <option value="C">C (Needs Improvement)</option>
                                <option value="D">D (Below Average)</option>
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "math" && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Subject: b) MATHEMATICS</h4>
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Sub Point</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Half Yearly</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Annual</th></tr></thead>
                    <tbody>
                      {KG_MATH_POINTS.map((sp) => {
                        const key = String(sp.id)
                        const val = mathData[key]
                        return (
                          <tr key={sp.id} className="border-b last:border-0">
                            <td className="px-3 py-2 text-sm text-gray-700 w-1/3">{sp.label}</td>
                            <td className="px-2 py-1">
                              <select value={val?.half || ""} onChange={(e) => setMathData((p) => ({ ...p, [key]: { half: e.target.value, annual: val?.annual || "" } }))} className="w-full rounded border border-gray-300 px-2 py-1 text-sm">
                                <option value="">Select Grade</option>
                                {GRADES_7.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-1">
                              <select value={val?.annual || ""} onChange={(e) => setMathData((p) => ({ ...p, [key]: { half: val?.half || "", annual: e.target.value } }))} className="w-full rounded border border-gray-300 px-2 py-1 text-sm">
                                <option value="">Select Grade</option>
                                {GRADES_7.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "language" && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Subject: c) 2nd LANGUAGE (Bengali / Hindi)</h4>
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Sub Point</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Half Yearly</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Annual</th></tr></thead>
                    <tbody>
                      {KG_LANGUAGE_POINTS.map((sp) => {
                        const key = String(sp.id)
                        const val = langData[key]
                        return (
                          <tr key={sp.id} className="border-b last:border-0">
                            <td className="px-3 py-2 text-sm text-gray-700 w-1/3">{sp.label}</td>
                            <td className="px-2 py-1">
                              <select value={val?.half || ""} onChange={(e) => setLangData((p) => ({ ...p, [key]: { half: e.target.value, annual: val?.annual || "" } }))} className="w-full rounded border border-gray-300 px-2 py-1 text-sm">
                                <option value="">Select Grade</option>
                                {GRADES_7.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-1">
                              <select value={val?.annual || ""} onChange={(e) => setLangData((p) => ({ ...p, [key]: { half: val?.half || "", annual: e.target.value } }))} className="w-full rounded border border-gray-300 px-2 py-1 text-sm">
                                <option value="">Select Grade</option>
                                {GRADES_7.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "other" && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Other Subjects</h4>
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Subject</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Half Yearly</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Annual</th></tr></thead>
                    <tbody>
                      {OTHER_SUBJECTS.map((s) => renderGradeRow(s.label, s.key, otherData[s.key], (h, a) => setOtherData((p) => ({ ...p, [s.key]: { half: h, annual: a } })), GRADES_7))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "work" && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3">WORK HABITS</h4>
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Habit</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Half Yearly</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Annual</th></tr></thead>
                    <tbody>
                      {WORK_HABITS.map((h) => renderGradeRow(h.label, h.key, workData[h.key], (hh, aa) => setWorkData((p) => ({ ...p, [h.key]: { half: hh, annual: aa } })), GRADES_5))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "sensorial" && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3">SENSORIAL</h4>
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Sensorial</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Half Yearly</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Annual</th></tr></thead>
                    <tbody>
                      {SENSORIAL.map((s) => renderGradeRow(s.label, s.key, sensorialData[s.key], (h, a) => setSensorialData((p) => ({ ...p, [s.key]: { half: h, annual: a } })), GRADES_5))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "social" && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3">SOCIAL & PERSONAL DEVELOPMENT</h4>
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Development</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Half Yearly</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Annual</th></tr></thead>
                    <tbody>
                      {SOCIAL.map((s) => renderGradeRow(s.label, s.key, socialData[s.key], (h, a) => setSocialData((p) => ({ ...p, [s.key]: { half: h, annual: a } })), GRADES_5))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "attendance" && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3">REGULARITY RECORD</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                      <h5 className="text-xs font-semibold text-gray-600 mb-2">Half Yearly</h5>
                      <label className="block text-xs text-gray-600 mb-1">Working Days</label>
                      <input type="number" value={attendance.half_working} onChange={(e) => setAttendance({ ...attendance, half_working: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-1 text-sm mb-2" />
                      <label className="block text-xs text-gray-600 mb-1">Days Present</label>
                      <input type="number" value={attendance.half_present} onChange={(e) => setAttendance({ ...attendance, half_present: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                    </div>
                    <div className="rounded-lg border p-4">
                      <h5 className="text-xs font-semibold text-gray-600 mb-2">Annual</h5>
                      <label className="block text-xs text-gray-600 mb-1">Working Days</label>
                      <input type="number" value={attendance.annual_working} onChange={(e) => setAttendance({ ...attendance, annual_working: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-1 text-sm mb-2" />
                      <label className="block text-xs text-gray-600 mb-1">Days Present</label>
                      <input type="number" value={attendance.annual_present} onChange={(e) => setAttendance({ ...attendance, annual_present: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "remarks" && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3">TEACHER REMARKS</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Half Yearly Remarks</label>
                      <textarea value={remarks.half} onChange={(e) => setRemarks({ ...remarks, half: e.target.value })} rows={4} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Enter remarks..." />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Annual Remarks</label>
                      <textarea value={remarks.annual} onChange={(e) => setRemarks({ ...remarks, annual: e.target.value })} rows={4} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Enter remarks..." />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex justify-between items-center bg-gray-50">
              <div className="text-xs text-gray-500">Student: <b>{activeStudent.name}</b> • {activeStudent.admissionNo}</div>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] disabled:opacity-50 flex items-center gap-2">
                  <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save All Fields"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
