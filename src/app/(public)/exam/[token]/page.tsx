"use client"
import { toast as notify } from "@/lib/toast"

import { useState, useEffect } from "react"
import { use } from "react"

type StudentInfo = {
  id: number
  admissionNo: string
  name: string
  gender: string
  rollNo: number
  className: string
  sectionName: string
}

type ExamQ = {
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
}

export default function PublicExamPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [examInfo, setExamInfo] = useState<{ id: number; name: string; duration: number; description: string; subject: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Registration form
  const [step, setStep] = useState<"register" | "quiz" | "thankyou">("register")
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [studentSection, setStudentSection] = useState("")
  const [studentRollNo, setStudentRollNo] = useState("")
  const [studentGender, setStudentGender] = useState("")
  const [lookupMsg, setLookupMsg] = useState("")
  const [searchingStudent, setSearchingStudent] = useState(false)

  // Quiz
  const [questions, setQuestions] = useState<ExamQ[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Result
  const [result, setResult] = useState<{ score: number; correct: number; wrong: number; total: number } | null>(null)

  const lookupStudent = async () => {
    if (!studentId.trim()) return
    setSearchingStudent(true)
    setLookupMsg("")
    try {
      const res = await fetch(`/api/students/lookup?admission_no=${encodeURIComponent(studentId.trim())}`)
      if (!res.ok) {
        setLookupMsg("Student not found. Fill details manually.")
        return
      }
      const data: StudentInfo = await res.json()
      setStudentName(data.name)
      setStudentClass(data.className || "")
      setStudentSection(data.sectionName || "")
      setStudentRollNo(data.rollNo?.toString() || "")
      setStudentGender(data.gender || "")
      setLookupMsg(`Found: ${data.name}`)
    } catch {
      setLookupMsg("Error looking up student")
    } finally {
      setSearchingStudent(false)
    }
  }

  const startQuiz = async () => {
    if (!studentName.trim()) return notify.error("Please enter student name")
    // Fetch exam info and questions
    try {
      const res = await fetch(`/api/exam-public?token=${encodeURIComponent(token)}`)
      if (!res.ok) throw new Error("Exam not found")
      const data = await res.json()
      setExamInfo(data.exam)
      setQuestions(data.questions)
      setStep("quiz")
    } catch {
      setError("Failed to load exam questions")
    }
  }

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const submitQuiz = async () => {
    setSubmitting(true)
    try {
      const payload = {
        exam_id: examInfo!.id,
        admission_no: studentId.trim() || null,
        student_name: studentName.trim(),
        student_class: studentClass.trim() || null,
        student_section: studentSection.trim() || null,
        student_roll_no: studentRollNo.trim() || null,
        student_gender: studentGender.trim() || null,
        answers: questions.map(q => ({
          question_id: q.id,
          selected_answer: answers[q.id] || "",
        })),
      }
      const res = await fetch("/api/exam-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Submission failed")
      const data = await res.json()
      setResult(data)
      setStep("thankyou")
    } catch {
      notify.error("Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    fetch(`/api/exam-public?token=${encodeURIComponent(token)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setExamInfo(data.exam)
        else setError("Invalid or expired exam link")
      })
      .catch(() => setError("Failed to load exam"))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
      <div className="text-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /><p className="mt-2 text-sm text-gray-500">Loading exam...</p></div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center"><p className="text-red-500 font-medium">{error}</p></div>
    </div>
  )

  if (step === "thankyou" && result) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Thank You!</h1>
        <p className="text-gray-500">Your exam has been submitted successfully.</p>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Total Questions</span><span className="font-medium">{result.total}</span></div>
          <div className="flex justify-between text-sm"><span className="text-green-600">Correct</span><span className="font-medium text-green-600">{result.correct}</span></div>
          <div className="flex justify-between text-sm"><span className="text-red-500">Wrong</span><span className="font-medium text-red-500">{result.wrong}</span></div>
          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold"><span>Score</span><span className="text-[var(--primary)]">{result.score.toFixed(1)}%</span></div>
        </div>
      </div>
    </div>
  )

  if (step === "quiz" && examInfo) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-800">{examInfo.name}</h1>
            <p className="text-xs text-gray-500">{questions.length} questions</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">Question {currentQ + 1} of {questions.length}</span>
            <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1">
              <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
            </div>
          </div>
        </div>

        {questions[currentQ] && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white bg-[var(--primary)] px-2 py-0.5 rounded">{questions[currentQ].questionType === "singlechoice" ? "MCQ" : questions[currentQ].questionType === "true_false" ? "T/F" : questions[currentQ].questionType === "multichoice" ? "Multiple" : "Descriptive"}</span>
              <span className="text-xs text-gray-400">{questions[currentQ].subject}</span>
            </div>
            <p className="text-gray-800 font-medium">{questions[currentQ].question}</p>

            {questions[currentQ].questionType === "singlechoice" && (
              <div className="space-y-2">
                {(["A", "B", "C", "D", "E"] as const).map(k => {
                  const val = questions[currentQ][`option${k}` as keyof ExamQ] as string
                  if (!val) return null
                  return (
                    <label key={k} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[questions[currentQ].id] === k ? "border-[var(--primary)] bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name={`q-${questions[currentQ].id}`} value={k} checked={answers[questions[currentQ].id] === k} onChange={() => handleAnswer(questions[currentQ].id, k)} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                      <span className="text-sm font-medium text-gray-700">{k}.</span>
                      <span className="text-sm text-gray-600">{val}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {questions[currentQ].questionType === "true_false" && (
              <div className="flex gap-3">
                {["true", "false"].map(v => (
                  <label key={v} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${answers[questions[currentQ].id] === v ? "border-[var(--primary)] bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name={`q-${questions[currentQ].id}`} value={v} checked={answers[questions[currentQ].id] === v} onChange={() => handleAnswer(questions[currentQ].id, v)} className="text-[var(--primary)] focus:ring-[var(--primary)]" />
                    <span className="text-sm font-medium">{v === "true" ? "True" : "False"}</span>
                  </label>
                ))}
              </div>
            )}

            {questions[currentQ].questionType === "multichoice" && (
              <div className="space-y-2">
                {(["A", "B", "C", "D", "E"] as const).map(k => {
                  const val = questions[currentQ][`option${k}` as keyof ExamQ] as string
                  if (!val) return null
                  const checked = (answers[questions[currentQ].id] || "").split(",").includes(k)
                  return (
                    <label key={k} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked ? "border-[var(--primary)] bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="checkbox" checked={checked} onChange={() => {
                        const current = answers[questions[currentQ].id] ? answers[questions[currentQ].id].split(",").filter(Boolean) : []
                        const next = checked ? current.filter(v => v !== k) : [...current, k]
                        handleAnswer(questions[currentQ].id, next.join(","))
                      }} className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                      <span className="text-sm font-medium text-gray-700">{k}.</span>
                      <span className="text-sm text-gray-600">{val}</span>
                    </label>
                  )
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))} disabled={currentQ === 0}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Previous</button>
              {currentQ < questions.length - 1 ? (
                <button onClick={() => setCurrentQ(prev => prev + 1)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)]">Next</button>
              ) : (
                <button onClick={submitQuiz} disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Registration step
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-[#ff7732]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{examInfo?.name || "Online Exam"}</h1>
          <p className="text-sm text-gray-500 mt-1">{examInfo?.description || "Please register to start the exam"}</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Student ID / Admission No</label>
            <div className="flex gap-2">
              <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)}
                placeholder="Enter admission number"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
              <button onClick={lookupStudent} disabled={searchingStudent || !studentId.trim()}
                className="px-4 py-2 text-xs font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50">
                {searchingStudent ? "..." : "Lookup"}
              </button>
            </div>
            {lookupMsg && <p className={`text-xs ${lookupMsg.startsWith("Found") ? "text-green-600" : "text-amber-600"}`}>{lookupMsg}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Gender</label>
              <select value={studentGender} onChange={e => setStudentGender(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Class</label>
              <input type="text" value={studentClass} onChange={e => setStudentClass(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Section</label>
              <input type="text" value={studentSection} onChange={e => setStudentSection(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Roll Number</label>
              <input type="text" value={studentRollNo} onChange={e => setStudentRollNo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
            </div>
          </div>

          <button onClick={startQuiz} disabled={!studentName.trim()}
            className="w-full py-3 mt-2 text-sm font-bold text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] disabled:opacity-50 transition-colors">
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  )
}
