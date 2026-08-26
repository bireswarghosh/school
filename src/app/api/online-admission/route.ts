import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function getSchoolId(req: NextRequest): number | null {
  const raw = req.headers.get("x-school-id")
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

const str = (v: unknown) => (v === null || v === undefined ? null : String(v).trim() || null)

function generateAdmissionNo() {
  const year = new Date().getFullYear()
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return `S${year}${rand}`
}

async function createStudentFromApplication(app: Record<string, any>, schoolId: number) {
  const className = app.class_id ? await query(`SELECT id, name FROM classes WHERE id = $1`, [app.class_id]) : null
  const cls = className?.rows[0] as { id: number; name: string } | undefined

  let sectionId: number | null = null
  if (app.class_id && app.section) {
    const sec = await query(`SELECT id FROM sections WHERE class_id = $1 AND name = $2`, [app.class_id, String(app.section)])
    sectionId = sec.rows[0] ? Number(sec.rows[0].id) : null
  }

  const firstName = str(app.first_name) || ""
  const middleName = str(app.middle_name) || ""
  const lastName = str(app.last_name) || ""
  const fullName = str(app.name) || [firstName, middleName, lastName].filter(Boolean).join(" ").trim()
  const phone = str(app.mobile_number) || str(app.phone)
  const today = new Date().toISOString().slice(0, 10)
  const year = new Date().getFullYear().toString()

  const student = await create<any>("students", {
    admission_no: str(app.admission_no) || generateAdmissionNo(),
    name: fullName,
    first_name: firstName || null,
    middle_name: middleName || null,
    last_name: lastName || null,
    class_id: app.class_id ?? null,
    section_id: sectionId,
    gender: str(app.gender),
    dob: str(app.date_of_birth),
    category: str(app.category),
    religion: str(app.religion),
    caste: str(app.caste),
    blood_group: str(app.blood_group),
    house: str(app.house),
    mobile: phone,
    phone: phone,
    email: str(app.email),
    admission_date: today,
    session: year,
    previous_school: str(app.previous_school),
    note: str(app.note),
    rte: str(app.rte),
    father_name: str(app.father_name),
    father_phone: str(app.father_phone),
    father_occupation: str(app.father_occupation),
    mother_name: str(app.mother_name),
    mother_phone: str(app.mother_phone),
    mother_occupation: str(app.mother_occupation),
    guardian_is: str(app.guardian_is),
    guardian_name: str(app.guardian_name),
    guardian_relation: str(app.guardian_relation),
    guardian_phone: str(app.guardian_phone),
    guardian_occupation: str(app.guardian_occupation),
    guardian_email: str(app.guardian_email),
    guardian_address: str(app.guardian_address),
    address: str(app.current_address) || str(app.address),
    current_address: str(app.current_address),
    permanent_address: str(app.permanent_address),
    status: "Active",
  }, schoolId)

  return { student, class: cls?.name || null }
}

export async function GET(req: NextRequest) {
  try {
    const schoolId = getSchoolId(req)
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const schoolRes = await query(
      `SELECT code, name FROM schools WHERE id = $1`,
      [schoolId]
    )
    const school = schoolRes.rows[0] as { code: string; name: string } | undefined
    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 })

    const applications = await getAll<any>("online_admissions", "created_at DESC")

    return NextResponse.json({
      code: school.code,
      name: school.name,
      applications,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    if (status && !["Pending", "Pending for payment", "Approved", "Rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const schoolId = getSchoolId(req)
    const existing = await getById<Record<string, any>>("online_admissions", parseInt(id, 10))
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    let studentId = existing.student_id || null
    if (status === "Approved" && !studentId && schoolId) {
      const { student } = await createStudentFromApplication(existing, schoolId)
      studentId = student.id
      await update("online_admissions", existing.id, { status, student_id: studentId })
      return NextResponse.json({ ...existing, status, student_id: studentId, studentCreated: true })
    }

    const item = await update("online_admissions", existing.id, { status })
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const ok = await remove("online_admissions", id)
    return NextResponse.json({ success: ok }, { status: ok ? 200 : 404 })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
