import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUserId } from "@/lib/auth"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

// PUT /api/auth/profile — update your own display name / email
export async function PUT(req: NextRequest) {
  try {
    const uid = getSessionUserId(req)
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const sets: string[] = []
    const params: (string | number)[] = []

    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
      params.push(name)
      sets.push(`name = $${params.length}`)
    }

    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
      }
      const clash = await query(`SELECT id FROM users WHERE lower(email) = lower($1) AND id <> $2`, [email, uid])
      if (clash.rows[0]) {
        return NextResponse.json({ error: "That email is already in use by another account" }, { status: 409 })
      }
      params.push(email)
      sets.push(`email = $${params.length}`)
    }

    if (sets.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })

    params.push(uid)
    const result = await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING id, username, name, email`, params)
    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}