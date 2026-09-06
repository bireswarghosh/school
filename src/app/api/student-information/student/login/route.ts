import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import {
  usernameFromAdmissionNo,
  parentUsernameFromAdmissionNo,
} from "@/lib/login-usernames"
import { DEFAULT_STUDENT_PASSWORD, DEFAULT_PARENT_PASSWORD } from "@/lib/portal-login"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get("id") || "0", 10)
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const s = (await query(`SELECT * FROM students WHERE id = $1`, [id])).rows[0]
    if (!s) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    const admissionBase = usernameFromAdmissionNo(s.admission_no) || null
    const parentBase = admissionBase ? `${admissionBase}P` : null

    const studentUsername = admissionBase || (s.email ? null : `student_${s.id}`)
    const parentUsername = parentBase || `parent_${s.id}`

    let studentUser = null
    if (s.user_id) {
      const u = (await query(
        `SELECT id, username, email, status FROM users WHERE id = $1`,
        [Number(s.user_id)]
      )).rows[0]
      if (u) studentUser = u
    } else if (admissionBase) {
      const u = (await query(
        `SELECT id, username, email, status FROM users WHERE username = $1 AND role = 'student'`,
        [admissionBase]
      )).rows[0]
      if (u) studentUser = u
    }

    const guard = (await query(
      `SELECT sg.parent_user_id FROM student_guardians sg WHERE sg.student_id = $1 ORDER BY sg.id LIMIT 1`,
      [id]
    )).rows[0]

    let parentUser = null
    if (guard) {
      parentUser = (await query(
        `SELECT id, username, email, status FROM users WHERE id = $1`,
        [Number(guard.parent_user_id)]
      )).rows[0]
    }

    const synthDomain = "school"
    return NextResponse.json({
      admissionNo: s.admission_no,
      student: {
        username: studentUsername,
        email: studentUser?.email || s.email || (admissionBase ? `${admissionBase}@${synthDomain}.school` : null),
        exists: Boolean(studentUser),
        userId: studentUser?.id ?? null,
        status: studentUser?.status ?? null,
        defaultPassword: DEFAULT_STUDENT_PASSWORD,
      },
      parent: {
        username: parentUsername,
        email: parentUser?.email || s.guardian_email || (parentBase ? `${parentBase}@${synthDomain}.school` : null),
        exists: Boolean(parentUser),
        userId: parentUser?.id ?? null,
        status: parentUser?.status ?? null,
        defaultPassword: DEFAULT_PARENT_PASSWORD,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}