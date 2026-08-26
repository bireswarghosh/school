import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { randomBytes } from "crypto"

function getErrorMessage(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const examId = searchParams.get("exam_id")
    if (!examId) return NextResponse.json({ error: "exam_id required" }, { status: 400 })
    const result = await query(
      "SELECT id, exam_id, token, visit_count, is_active, created_at, updated_at FROM exam_public_links WHERE exam_id = $1 ORDER BY id DESC LIMIT 1",
      [parseInt(examId)]
    )
    return NextResponse.json(result.rows[0] || null)
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const examId = body.exam_id
    if (!examId) return NextResponse.json({ error: "exam_id required" }, { status: 400 })

    // Check if one already exists
    const existing = await query(
      "SELECT id, token, visit_count, is_active, created_at FROM exam_public_links WHERE exam_id = $1 AND is_active = true ORDER BY id DESC LIMIT 1",
      [parseInt(examId)]
    )
    if (existing.rows[0]) return NextResponse.json(existing.rows[0])

    const token = randomBytes(24).toString("hex")
    const result = await query(
      "INSERT INTO exam_public_links (exam_id, token) VALUES ($1, $2) RETURNING id, exam_id, token, visit_count, is_active, created_at",
      [parseInt(examId), token]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
