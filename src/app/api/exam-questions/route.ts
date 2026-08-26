import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const examId = searchParams.get("exam_id")
    if (!examId) return NextResponse.json({ error: "exam_id required" }, { status: 400 })

    const result = await query(
      `SELECT q.id, q.subject, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
              q.correct_answer, q.correct_answers, q.correct_answer_true_false, q.question_type,
              q.question_level, q.class_id, q.section_id, q.created_by
       FROM online_exam_questions oeq
       JOIN questions q ON q.id = oeq.question_id
       WHERE oeq.exam_id = $1
       ORDER BY oeq.sort_order, oeq.id`,
      [parseInt(examId)]
    )

    return NextResponse.json(result.rows.map(r => ({
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
      questionLevel: r.question_level,
      classId: r.class_id,
      sectionId: r.section_id,
      createdBy: r.created_by,
    })))
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { exam_id, question_ids } = body
    if (!exam_id || !question_ids || !Array.isArray(question_ids) || question_ids.length === 0) {
      return NextResponse.json({ error: "exam_id and question_ids array required" }, { status: 400 })
    }
    const results = []
    for (let i = 0; i < question_ids.length; i++) {
      try {
        const r = await query(
          `INSERT INTO online_exam_questions (exam_id, question_id, sort_order)
           VALUES ($1, $2, $3) ON CONFLICT (exam_id, question_id) DO NOTHING RETURNING id`,
          [parseInt(exam_id), question_ids[i], i]
        )
        if (r.rows[0]) results.push(r.rows[0].id)
      } catch {}
    }
    return NextResponse.json({ success: true, count: results.length })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { exam_id, question_id } = body
    if (!exam_id || !question_id) {
      return NextResponse.json({ error: "exam_id and question_id required" }, { status: 400 })
    }
    await query("DELETE FROM online_exam_questions WHERE exam_id = $1 AND question_id = $2",
      [parseInt(exam_id), parseInt(question_id)])
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
