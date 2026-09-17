import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (id) {
      const r = await query("SELECT * FROM subject_types WHERE id=$1 AND school_id=$2", [Number(id), schoolId])
      if (!r.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
      return NextResponse.json(r.rows[0])
    }
    const r = await query("SELECT * FROM subject_types WHERE school_id=$1 ORDER BY name ASC", [schoolId])
    return NextResponse.json(r.rows)
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    if (!schoolId) return NextResponse.json({ error: "No school session" }, { status: 401 })
    const body = await req.json()
    const name = String(body.name || "").trim()
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })
    const r = await query("INSERT INTO subject_types (name, school_id) VALUES ($1,$2) RETURNING *", [name, schoolId])
    return NextResponse.json(r.rows[0], { status: 201 })
  } catch (e: any) {
    const msg = getErrorMessage(e)
    if (msg.includes("duplicate") || msg.includes("UNIQUE")) {
      return NextResponse.json({ error: "Subject type already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    const body = await req.json()
    const id = Number(body.id)
    const name = String(body.name || "").trim()
    if (!id || !name) return NextResponse.json({ error: "id and name required" }, { status: 400 })
    const r = await query("UPDATE subject_types SET name=$1 WHERE id=$2 AND school_id=$3 RETURNING *", [name, id, schoolId])
    if (!r.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(r.rows[0])
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const schoolId = getSessionSchoolId(req)
    const id = Number(req.nextUrl.searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const r = await query("DELETE FROM subject_types WHERE id=$1 AND school_id=$2 RETURNING id", [id, schoolId])
    if (!r.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 })
  }
}
