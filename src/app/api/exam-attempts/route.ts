import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const examId = searchParams.get("exam_id")
    if (!examId) return NextResponse.json({ error: "exam_id required" }, { status: 400 })

    const result = await query(
      `SELECT ea.id, ea.exam_id, ea.student_id, ea.student_name, ea.student_class, ea.student_section,
              ea.student_roll_no, ea.student_gender, ea.admission_no, ea.total_questions, ea.correct_answers,
              ea.wrong_answers, ea.score, ea.status, ea.submitted_at
       FROM exam_attempts ea
       WHERE ea.exam_id = $1
       ORDER BY ea.submitted_at DESC`,
      [parseInt(examId)]
    )

    return NextResponse.json(result.rows.map(r => ({
      id: r.id,
      examId: r.exam_id,
      studentId: r.student_id,
      studentName: r.student_name,
      studentClass: r.student_class,
      studentSection: r.student_section,
      studentRollNo: r.student_roll_no,
      studentGender: r.student_gender,
      admissionNo: r.admission_no,
      totalQuestions: r.total_questions,
      correctAnswers: r.correct_answers,
      wrongAnswers: r.wrong_answers,
      score: r.score,
      status: r.status,
      submittedAt: r.submitted_at,
    })))
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { exam_id, student_id, admission_no, student_name, student_class, student_section, student_roll_no, student_gender, answers } = body

    if (!exam_id || !student_name || !answers) {
      return NextResponse.json({ error: "exam_id, student_name, and answers are required" }, { status: 400 })
    }

    let correct = 0
    let wrong = 0

    for (const ans of answers) {
      const qRes = await query(
        "SELECT correct_answer, correct_answers, correct_answer_true_false, question_type FROM questions WHERE id = $1",
        [ans.question_id]
      )
      const q = qRes.rows[0]
      if (!q) continue

      let isCorrect = false
      if (q.question_type === "singlechoice") {
        isCorrect = ans.selected_answer === q.correct_answer
      } else if (q.question_type === "true_false") {
        isCorrect = ans.selected_answer === q.correct_answer_true_false
      } else if (q.question_type === "multichoice") {
        const selected = (ans.selected_answer || "").split(",").filter(Boolean).sort().join(",")
        const correct = (q.correct_answers || "").split(",").filter(Boolean).sort().join(",")
        isCorrect = selected === correct
      }
      if (isCorrect) correct++; else wrong++
    }

    const total = answers.length
    const score = total > 0 ? (correct / total) * 100 : 0

    const attempt = await query(
      `INSERT INTO exam_attempts (exam_id, student_id, student_name, student_class, student_section, student_roll_no, student_gender, admission_no, total_questions, correct_answers, wrong_answers, score, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'completed')
       RETURNING id`,
      [parseInt(exam_id), student_id || null, student_name, student_class || null, student_section || null, student_roll_no || null, student_gender || null, admission_no || null, total, correct, wrong, score]
    )

    const attemptId = attempt.rows[0].id

    for (const ans of answers) {
      const qRes = await query("SELECT question_type, correct_answer, correct_answers, correct_answer_true_false FROM questions WHERE id = $1", [ans.question_id])
      const q = qRes.rows[0]
      let isCorrect = false
      if (q) {
        if (q.question_type === "singlechoice") isCorrect = ans.selected_answer === q.correct_answer
        else if (q.question_type === "true_false") isCorrect = ans.selected_answer === q.correct_answer_true_false
        else if (q.question_type === "multichoice") {
          const s = (ans.selected_answer || "").split(",").filter(Boolean).sort().join(",")
          const c = (q.correct_answers || "").split(",").filter(Boolean).sort().join(",")
          isCorrect = s === c
        }
      }
      await query(
        "INSERT INTO exam_answers (attempt_id, question_id, selected_answer, is_correct) VALUES ($1,$2,$3,$4)",
        [attemptId, ans.question_id, ans.selected_answer || null, isCorrect]
      )
    }

    return NextResponse.json({ success: true, attemptId, score, correct, wrong, total })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
