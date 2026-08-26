import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")
    if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

    // Fetch the public link + exam
    const linkResult = await query(
      `SELECT epl.id, epl.exam_id, epl.visit_count, epl.is_active,
              e.name, e.duration, e.description, e.subject
       FROM exam_public_links epl
       JOIN online_exams e ON e.id = epl.exam_id
       WHERE epl.token = $1`,
      [token]
    )
    const link = linkResult.rows[0]
    if (!link || !link.is_active) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })

    // Increment visit count
    await query("UPDATE exam_public_links SET visit_count = visit_count + 1, updated_at = NOW() WHERE token = $1", [token])

    // Fetch exam questions
    const questionsResult = await query(
      `SELECT q.id, q.subject, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
              q.correct_answer, q.correct_answers, q.correct_answer_true_false, q.question_type
       FROM online_exam_questions oeq
       JOIN questions q ON q.id = oeq.question_id
       WHERE oeq.exam_id = $1
       ORDER BY oeq.sort_order, oeq.id`,
      [link.exam_id]
    )

    const questions = questionsResult.rows.map(r => ({
      id: r.id,
      subject: r.subject,
      question: r.question,
      optionA: r.option_a || "",
      optionB: r.option_b || "",
      optionC: r.option_c || "",
      optionD: r.option_d || "",
      optionE: r.option_e || "",
      correctAnswer: r.correct_answer || "",
      correctAnswers: r.correct_answers || "",
      correctAnswerTrueFalse: r.correct_answer_true_false || "",
      questionType: r.question_type || "singlechoice",
    }))

    // Shuffle questions if random order is enabled
    // (could check exam.random_question_order here)

    return NextResponse.json({
      exam: { id: link.exam_id, name: link.name, duration: link.duration, description: link.description, subject: link.subject },
      questions,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
