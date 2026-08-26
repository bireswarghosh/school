import { NextRequest, NextResponse } from "next/server"
import { query, create } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

async function resolveSchool(code: string) {
  const result = await query(
    `SELECT id, code, name FROM schools WHERE code = $1 AND status = 'Active'`,
    [code]
  )
  return result.rows[0] as { id: number; code: string; name: string } | undefined
}

const str = (v: unknown) => (v === null || v === undefined ? null : String(v).trim() || null)

const CLOSED_MESSAGE = "Online admission is not open at present. Please contact the school for admission."

async function loadSettings(schoolId: number) {
  const res = await query(`SELECT * FROM online_admission_settings WHERE school_id = $1`, [schoolId])
  return res.rows[0] || null
}

function isWithinWindow(s: any, today: string) {
  if (!s.enabled) return false
  const start = s.start_date ? String(s.start_date).slice(0, 10) : ""
  const end = s.end_date ? String(s.end_date).slice(0, 10) : ""
  if (start && today < start) return false
  if (end && today > end) return false
  return true
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = (searchParams.get("code") || "").trim()
    if (!code) return NextResponse.json({ error: "code required" }, { status: 400 })

    const school = await resolveSchool(code)
    if (!school) return NextResponse.json({ error: "Invalid school code" }, { status: 404 })

    const s = await loadSettings(school.id)
    const today = new Date().toISOString().slice(0, 10)
    const admissionOpen = isWithinWindow(s, today)

    let selectedClasses: string[] = []
    let settings = {
      requireParentEmail: Boolean(s?.require_parent_email),
      requireDocuments: Boolean(s?.require_documents),
      maxStudents: s?.max_students ?? 30,
    }
    if (admissionOpen && s) {
      selectedClasses = Array.isArray(s.selected_classes) ? s.selected_classes : []
    }

    const classes = admissionOpen
      ? await query(`SELECT id, name FROM classes WHERE school_id = $1 ORDER BY id`, [school.id])
      : { rows: [] }
    let classList = classes.rows as { id: number; name: string }[]
    if (selectedClasses.length > 0) {
      classList = classList.filter((c) => selectedClasses.includes(String(c.name)))
    }

    const sections = admissionOpen
      ? await query(
          `SELECT s.id, s.class_id, s.name FROM sections s
           JOIN classes c ON c.id = s.class_id
           WHERE c.school_id = $1 ORDER BY c.id, s.name`,
          [school.id]
        )
      : { rows: [] }

    return NextResponse.json({
      school: { code: school.code, name: school.name },
      admissionOpen,
      message: admissionOpen ? "" : CLOSED_MESSAGE,
      classes: classList,
      sections: sections.rows,
      settings,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      code,
      firstName, middleName, lastName,
      classId, section,
      gender, dateOfBirth,
      category, religion, caste,
      mobileNumber, email,
      bloodGroup, house,
      previousSchool, note, rte, siblingName,
      fatherName, fatherPhone, fatherOccupation,
      motherName, motherPhone, motherOccupation,
      guardianIs, guardianName, guardianRelation, guardianPhone,
      guardianOccupation, guardianEmail, guardianAddress,
      currentAddress, permanentAddress,
    } = body

    if (!code) return NextResponse.json({ error: "School code is required" }, { status: 400 })
    const fullName = [firstName, middleName, lastName].filter(Boolean).map(String).join(" ").trim()
    if (!fullName) return NextResponse.json({ error: "Student name is required" }, { status: 400 })
    if (!classId) return NextResponse.json({ error: "Class selection is required" }, { status: 400 })

    const school = await resolveSchool(String(code))
    if (!school) return NextResponse.json({ error: "Invalid school code" }, { status: 404 })

    const s = await loadSettings(school.id)
    const today = new Date().toISOString().slice(0, 10)
    if (!isWithinWindow(s, today)) {
      return NextResponse.json({ error: CLOSED_MESSAGE }, { status: 403 })
    }
    const selectedClasses = Array.isArray(s?.selected_classes) ? s.selected_classes : []
    if (selectedClasses.length > 0) {
      const cls = await query(
        `SELECT id, name FROM classes WHERE id = $1 AND school_id = $2`,
        [parseInt(String(classId), 10), school.id]
      )
      if (!cls.rows[0] || !selectedClasses.includes(String(cls.rows[0].name))) {
        return NextResponse.json(
          { error: "Admission for the selected class is not available." },
          { status: 403 }
        )
      }
    }
    if (s?.require_parent_email && !email) {
      return NextResponse.json({ error: "Parent email is required" }, { status: 400 })
    }

    const year = new Date().getFullYear()
    const rand = String(Math.floor(Math.random() * 9000) + 1000)
    const admissionNo = `ONL-${year}-${rand}`

    const record = (await create("online_admissions", {
      name: fullName,
      first_name: str(firstName),
      middle_name: str(middleName),
      last_name: str(lastName),
      email: str(email),
      phone: str(mobileNumber),
      mobile_number: str(mobileNumber),
      class_id: parseInt(String(classId), 10),
      section: str(section),
      gender: str(gender),
      date_of_birth: str(dateOfBirth),
      category: str(category),
      religion: str(religion),
      caste: str(caste),
      blood_group: str(bloodGroup),
      house: str(house),
      previous_school: str(previousSchool),
      note: str(note),
      rte: str(rte),
      sibling_name: str(siblingName),
      admission_no: admissionNo,
      father_name: str(fatherName),
      father_phone: str(fatherPhone),
      father_occupation: str(fatherOccupation),
      mother_name: str(motherName),
      mother_phone: str(motherPhone),
      mother_occupation: str(motherOccupation),
      guardian_is: str(guardianIs),
      guardian_name: str(guardianName),
      guardian_relation: str(guardianRelation),
      guardian_phone: str(guardianPhone),
      guardian_occupation: str(guardianOccupation),
      guardian_email: str(guardianEmail),
      guardian_address: str(guardianAddress),
      address: str(currentAddress) || str(permanentAddress),
      current_address: str(currentAddress),
      permanent_address: str(permanentAddress),
      status: "Pending for payment",
    }, school.id)) as unknown as { id: number }

    return NextResponse.json(
      { id: record.id, admissionNo, school: school.name, status: "Pending for payment" },
      { status: 201 }
    )
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
