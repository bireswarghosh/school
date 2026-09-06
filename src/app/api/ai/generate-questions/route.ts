import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { AI_PROVIDERS } from "@/lib/ai-providers"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

type QuestionInput = {
  question: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  optionE?: string
  correctAnswer?: string
  correctAnswers?: string
  correctAnswerTrueFalse?: string
}

const PROVIDERS = Object.fromEntries(
  AI_PROVIDERS.map((p) => [
    p.id,
    { name: p.name, model: p.model, url: p.url, keyDb: `ai_key_${p.id}`, free: p.free, needsKey: p.needsKey !== false, special: p.special },
  ])
) as Record<string, { name: string; model: string; url: string; keyDb: string; free: boolean; needsKey: boolean; special?: "gemini" | "openrouter" }>

function buildPrompt(className: string, subject: string, schoolModel: string, numQuestions: number, typeInstruction: string, questionLevel: string) {
  const schoolMap: Record<string, string> = {
    cbse: "Follow the CBSE (Central Board of Secondary Education) curriculum syllabus.",
    icsc: "Follow the ICSE (Indian Certificate of Secondary Education) curriculum syllabus.",
  }
  const schoolPrompt = schoolMap[schoolModel] || "Follow the general/standard curriculum syllabus."

  return `You are an expert question paper setter for ${className} ${subject} students.

${schoolPrompt}

Generate exactly ${numQuestions} questions of type "${typeInstruction}" with difficulty level "${questionLevel}".

For each question, follow these rules:
- The question must be age-appropriate and syllabus-relevant for ${className} ${subject}.
- For Single Choice: provide 4 options (A-D) and indicate the correct answer letter.
- For Multiple Choice: provide 4-5 options (A-E) and list ALL correct answer letters (e.g., "A,C").
- For True/False: provide just the statement; the answer is "true" or "false".
- For Descriptive: provide just the question; no options or answer needed.

Return the response as a valid JSON array only (no markdown, no code fences). Each object in the array must have these fields:
{
  "question": "the question text",
  "optionA": "option A text (omit if descriptive)",
  "optionB": "option B text (omit if descriptive)",
  "optionC": "option C text (omit if descriptive)",
  "optionD": "option D text (omit if descriptive)",
  "optionE": "option E text (omit if not applicable)",
  "correctAnswer": "correct option letter like A, B, C, D (for singlechoice)",
  "correctAnswers": "comma-separated letters like A,C,D (for multichoice)",
  "correctAnswerTrueFalse": "true or false (for true_false)"
}
Do not include any text outside the JSON array.`
}

async function callOpenAICompatible(url: string, apiKey: string, model: string, prompt: string): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 4096 }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(`${PROVIDERS.gemini.url}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}

async function callOpenRouter(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(PROVIDERS.openrouter.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

async function extractContent(provider: string, apiKey: string, prompt: string): Promise<string> {
  const cfg = PROVIDERS[provider]
  if (!cfg) throw new Error("Unknown AI provider")
  switch (cfg.special) {
    case "gemini":
      return callGemini(apiKey, prompt)
    case "openrouter":
      return callOpenRouter(apiKey, prompt)
    default:
      return callOpenAICompatible(cfg.url, apiKey, cfg.model, prompt)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subject, questionType, questionLevel, classId, numQuestions, schoolModel, provider: rawProvider, apiKey: inlineKey } = body

    const provider: string = Object.prototype.hasOwnProperty.call(PROVIDERS, rawProvider || "openai")
      ? rawProvider
      : "openai"

    if (!subject || !questionType || !questionLevel || !classId || !numQuestions) {
      return NextResponse.json({ error: "subject, questionType, questionLevel, classId, and numQuestions are required" }, { status: 400 })
    }

    // Resolve API key: prefer inline (from request body), fall back to DB
    let apiKey = inlineKey
    if (!apiKey) {
      const dbResult = await query("SELECT value FROM system_settings WHERE key = $1", [PROVIDERS[provider].keyDb])
      apiKey = dbResult.rows[0]?.value
    }
    if (!apiKey && PROVIDERS[provider].needsKey) {
      return NextResponse.json({ error: `No API key found for ${PROVIDERS[provider].name}. Save it in AI Settings first.` }, { status: 400 })
    }
    if (apiKey && !PROVIDERS[provider].needsKey) apiKey = ""

    const classResult = await query("SELECT name FROM classes WHERE id = $1", [parseInt(classId)])
    const className = classResult.rows[0]?.name || `Class ${classId}`

    const typeInstructions: Record<string, string> = {
      singlechoice: "Single Choice (MCQ with one correct answer out of 4 options A-D)",
      multichoice: "Multiple Choice (MCQ with one or more correct answers out of 4-5 options A-E)",
      true_false: "True/False (statement that is either true or false)",
      descriptive: "Descriptive (long answer / essay type question with no options)",
    }
    const typeInstruction = typeInstructions[questionType as string] || questionType
    const prompt = buildPrompt(className, subject, schoolModel, numQuestions, typeInstruction, questionLevel)
    const content = await extractContent(provider, apiKey, prompt)

    if (!content) return NextResponse.json({ error: "No content in AI response" }, { status: 502 })

    let questions: QuestionInput[]
    try {
      const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
      questions = JSON.parse(cleaned)
      if (!Array.isArray(questions)) throw new Error("Response is not an array")
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response as JSON. Raw: " + content.substring(0, 500) }, { status: 502 })
    }

    // Look up Ai Teacher staff ID
    const aiStaff = await query("SELECT id FROM staff WHERE staff_id = 'AI-TEACHER' OR name = 'Ai Teacher' LIMIT 1")
    const aiTeacherId = aiStaff.rows[0]?.id || null

    const results = []
    for (const q of questions.slice(0, numQuestions)) {
      const row = {
        subject,
        question: q.question,
        question_type: questionType === "true_false" ? "true_false" : questionType === "multichoice" ? "multichoice" : questionType === "descriptive" ? "descriptive" : "singlechoice",
        question_level: questionLevel,
        class_id: parseInt(classId),
        option_a: q.optionA || null,
        option_b: q.optionB || null,
        option_c: q.optionC || null,
        option_d: q.optionD || null,
        option_e: q.optionE || null,
        correct_answer: q.correctAnswer || null,
        correct_answers: q.correctAnswers || null,
        correct_answer_true_false: q.correctAnswerTrueFalse || null,
        created_by: aiTeacherId,
      }
      const insert = await query(
        `INSERT INTO questions (subject, question, question_type, question_level, class_id, option_a, option_b, option_c, option_d, option_e, correct_answer, correct_answers, correct_answer_true_false, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
        Object.values(row)
      )
      results.push({ id: insert.rows[0].id, ...row })
    }

    return NextResponse.json({ success: true, count: results.length, questions: results })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
