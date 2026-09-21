import { NextRequest, NextResponse } from "next/server"
import { query, create, update, remove } from "@/lib/db"
import { camelToSnake } from "@/lib/field-mapping"
import { provisionPortalLogin } from "@/lib/portal-login"

function getSchoolId(req: NextRequest): number | null {
  const raw = req.headers.get("x-school-id")
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

async function getSchoolCode(schoolId: number): Promise<string | undefined> {
  const r = await query(`SELECT code FROM schools WHERE id = $1`, [schoolId])
  return r.rows[0]?.code ?? undefined
}

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "students"
const fieldMap: Record<string, string> = {
  admissionNo: "admission_no",
  rollNo: "roll_no",
  firstName: "first_name",
  middleName: "middle_name",
  lastName: "last_name",
  admissionDate: "admission_date",
  bloodGroup: "blood_group",
  fatherName: "father_name",
  fatherPhone: "father_phone",
  fatherOccupation: "father_occupation",
  motherName: "mother_name",
  motherPhone: "mother_phone",
  motherOccupation: "mother_occupation",
  guardianIs: "guardian_is",
  guardianName: "guardian_name",
  guardianRelation: "guardian_relation",
  guardianEmail: "guardian_email",
  guardianPhone: "guardian_phone",
  guardianOccupation: "guardian_occupation",
  guardianAddress: "guardian_address",
  currentAddress: "current_address",
  permanentAddress: "permanent_address",
  bankAccount: "bank_account_no",
  bankName: "bank_name",
  ifscCode: "ifsc_code",
  nationalId: "national_identification_no",
  localId: "local_identification_no",
  previousSchool: "previous_school",
  measurementDate: "measure_date",
  studentPhoto: "student_photo",
  fatherPhoto: "father_photo",
  motherPhoto: "mother_photo",
  guardianPhoto: "guardian_photo",
}

const DATE_FIELDS = ["dob", "admission_date", "measure_date"]

function isValidDateValue(v: any) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)
}

function mapBody(body: Record<string, any>) {
  const mapped = camelToSnake(body, fieldMap)
  const data: Record<string, any> = {}
  for (const [key, value] of Object.entries(mapped)) {
    if (key === "id") continue
    if (key === "class" || key === "section") continue
    if (key === "category" || key === "house") {
      data[key] = value || null
    } else if (key === "name" && !value && (data.first_name || data.last_name)) {
      // name is auto-built below
    } else {
      data[key] = value === "" || value === null || value === undefined ? null : value
    }
  }
  for (const f of DATE_FIELDS) {
    const v = data[f]
    if (v !== null && v !== undefined && !isValidDateValue(v)) data[f] = null
  }
  if (!data.name) {
    const fn = data.first_name || body.firstName || ""
    const mn = data.middle_name || body.middleName || ""
    const ln = data.last_name || body.lastName || ""
    data.name = `${fn} ${mn} ${ln}`.trim().replace(/\s+/g, " ")
  }
  return data
}

type ClassSectionLookup = {
  classByName: Map<string, number>
  sectionsByClass: Map<number, Map<string, number>>
  sectionByName: Map<string, number>
}

async function getClassSectionLookup(): Promise<ClassSectionLookup> {
  const classByName = new Map<string, number>()
  const sectionsByClass = new Map<number, Map<string, number>>()
  const sectionByName = new Map<string, number>()
  const classesRes = await query("SELECT id, name FROM classes")
  for (const c of classesRes.rows) classByName.set(String(c.name), Number(c.id))
  const sectionsRes = await query("SELECT id, name, class_id FROM sections")
  for (const s of sectionsRes.rows) {
    const sid = Number(s.id)
    if (!sectionByName.has(String(s.name))) sectionByName.set(String(s.name), sid)
    const cid = s.class_id === null ? null : Number(s.class_id)
    if (cid !== null) {
      if (!sectionsByClass.has(cid)) sectionsByClass.set(cid, new Map())
      if (!sectionsByClass.get(cid)!.has(String(s.name))) sectionsByClass.get(cid)!.set(String(s.name), sid)
    }
  }
  return { classByName, sectionsByClass, sectionByName }
}

function resolveClassSection(body: Record<string, any>, lookup: ClassSectionLookup) {
  const className = String(body.class || "")
  const sectionName = String(body.section || "")
  const class_id = className ? (lookup.classByName.get(className) ?? null) : null
  let section_id: number | null = null
  if (sectionName) {
    const byClass = class_id !== null ? lookup.sectionsByClass.get(class_id)?.get(sectionName) : undefined
    section_id = byClass !== undefined ? byClass : (lookup.sectionByName.get(sectionName) ?? null)
  }
  return { class_id, section_id }
}

async function buildInsertData(body: Record<string, any>, lookup: ClassSectionLookup) {
  const data = mapBody(body)
  const { class_id, section_id } = resolveClassSection(body, lookup)
  data.class_id = class_id
  data.section_id = section_id
  return data
}

async function getWithJoins(id?: number) {
  const where = id ? `WHERE s.id = ${id}` : ""
  const sql = `
    SELECT s.id, s.admission_no AS "admissionNo", s.roll_no AS "rollNo",
      s.first_name AS "firstName", s.middle_name AS "middleName", s.last_name AS "lastName",
      c.name AS "class", sec.name AS "section",
      s.gender, s.dob, s.category, s.religion, s.caste,
      COALESCE(s.mobile, s.phone) AS "mobile", s.email,
      s.admission_date AS "admissionDate", s.blood_group AS "bloodGroup",
      s.house, s.height, s.weight, s.measure_date AS "measurementDate",
      s.father_name AS "fatherName", s.father_phone AS "fatherPhone", s.father_occupation AS "fatherOccupation",
      s.mother_name AS "motherName", s.mother_phone AS "motherPhone", s.mother_occupation AS "motherOccupation",
      s.guardian_is AS "guardianIs", s.guardian_name AS "guardianName", s.guardian_relation AS "guardianRelation",
      s.guardian_email AS "guardianEmail", s.guardian_phone AS "guardianPhone", s.guardian_occupation AS "guardianOccupation",
      s.guardian_address AS "guardianAddress", s.current_address AS "currentAddress", s.permanent_address AS "permanentAddress",
      s.bank_account_no AS "bankAccount", s.bank_name AS "bankName", s.ifsc_code AS "ifscCode",
      s.national_identification_no AS "nationalId", s.local_identification_no AS "localId", s.rte,
      s.address, s.previous_school AS "previousSchool", s.note, s.status,
      s.student_photo AS "studentPhoto", s.father_photo AS "fatherPhoto",
      s.mother_photo AS "motherPhoto", s.guardian_photo AS "guardianPhoto"
    FROM ${TABLE} s
    LEFT JOIN classes c ON c.id = s.class_id
    LEFT JOIN sections sec ON sec.id = s.section_id
    ${where}
    ORDER BY s.id DESC
  `
  const result = await query(sql)
  return result.rows
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  try {
    const items = await getWithJoins(id ? parseInt(id) : undefined)
    const result = id ? (items[0] || { error: "Not found" }) : items
    return NextResponse.json(result, { status: id && !items[0] ? 404 : 200 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const lookup = await getClassSectionLookup()
    const schoolId = getSchoolId(req)
    const schoolCode = schoolId ? await getSchoolCode(schoolId) : undefined

    if (Array.isArray(body)) {
      const created = []
      const errors = []
      let provisioned = 0
      for (const item of body) {
        try {
          const rec = await create(TABLE, await buildInsertData(item, lookup))
          if (schoolId && rec?.id) {
            try {
              const raw = (await query(`SELECT * FROM ${TABLE} WHERE id = $1`, [rec.id])).rows[0]
              if (raw) await provisionPortalLogin(raw, schoolId, schoolCode)
              provisioned += 1
            } catch {
              // login provisioning is best-effort; never fail the import
            }
          }
          const rows = rec ? await getWithJoins(rec.id) : []
          created.push(rows[0] || rec)
        } catch (e: any) {
          errors.push({
            row: {
              admissionNo: item.admissionNo || "",
              firstName: item.firstName || "",
              lastName: item.lastName || "",
              rollNo: item.rollNo || "",
            },
            error: getErrorMessage(e),
          })
        }
      }
      return NextResponse.json({
        created,
        errors,
        provisioned: schoolId ? provisioned : 0,
        loginsProvisioned: provisioned,
      }, { status: 200 })
    }
    const item = await create(TABLE, await buildInsertData(body, lookup))
    if (schoolId && item?.id) {
      try {
        const raw = (await query(`SELECT * FROM ${TABLE} WHERE id = $1`, [item.id])).rows[0]
        if (raw) await provisionPortalLogin(raw, schoolId, schoolCode)
      } catch {
        // best-effort
      }
    }
    const rows = await getWithJoins(item.id)
    return NextResponse.json(rows[0] || item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const lookup = await getClassSectionLookup()
    const item = await update(TABLE, id, await buildInsertData(rest, lookup))
    const rows = item ? await getWithJoins(item.id) : []
    return NextResponse.json(rows[0] || item || { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get("ids") || searchParams.get("id") || ""
  const ids = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0)
  if (ids.length === 0) return NextResponse.json({ error: "id required" }, { status: 400 })
  for (const id of ids) await remove(TABLE, id)
  return NextResponse.json({ success: true, deleted: ids.length })
}