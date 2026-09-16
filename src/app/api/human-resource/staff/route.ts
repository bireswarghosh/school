import { NextRequest, NextResponse } from "next/server"
import { query, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "staff"

const fieldMap: Record<string, string> = {
  staffId: "staff_id",
  department: "department_id",
  departmentId: "department_id",
  designation: "designation_id",
  designationId: "designation_id",
  contactNo: "contact_no",
  emergencyContactNo: "emergency_contact_no",
  fatherName: "father_name",
  motherName: "mother_name",
  maritalStatus: "marital_status",
  dateOfJoining: "date_of_joining",
  dateOfLeaving: "date_of_leaving",
  localAddress: "local_address",
  currentAddress: "local_address",
  permanentAddress: "permanent_address",
  workExp: "work_exp",
  workExperience: "work_exp",
  epfNo: "epf_no",
  contractType: "contract_type",
  basicSalary: "basic_salary",
  shift: "shift",
  workShift: "shift",
  workLocation: "location",
  accountTitle: "account_title",
  bankAccountNo: "bank_account_no",
  bankName: "bank_name",
  ifscCode: "ifsc_code",
  bankBranch: "bank_branch",
  joiningLetter: "joining_letter",
  resignationLetter: "resignation_letter",
  otherDocumentFile: "other_document_file",
  otherDocumentName: "other_document_name",
  leavesData: "leaves_data",
  mobile: "contact_no",
}

function sanitize(data: Record<string, any>): Record<string, any> {
  const d = { ...data }
  // empty date strings -> null (postgres DATE)
  for (const k of ["dob", "date_of_joining", "date_of_leaving"]) {
    if (d[k] === "" || d[k] === undefined) d[k] = null
  }
  if (d.basic_salary === "" || d.basic_salary === undefined) d.basic_salary = null
  else if (typeof d.basic_salary === "string") {
    const n = parseInt(d.basic_salary, 10)
    d.basic_salary = Number.isNaN(n) ? null : n
  }
  // keep legacy phone in sync with contact_no
  if (d.contact_no && !d.phone) d.phone = d.contact_no
  if (d.phone && !d.contact_no) d.contact_no = d.phone
  // ensure leaves_data is jsonb
  if (d.leaves_data && typeof d.leaves_data === "object" && !(d.leaves_data instanceof Array)) {
    // keep as object, pg will stringify
  }
  // coerce department/designation empty -> null
  if (d.department_id === "" || d.department_id === undefined) d.department_id = null
  if (d.designation_id === "" || d.designation_id === undefined) d.designation_id = null
  else {
    const n = parseInt(String(d.designation_id), 10)
    d.designation_id = Number.isNaN(n) ? null : n
  }
  if (d.department_id !== null && d.department_id !== undefined) {
    const n = parseInt(String(d.department_id), 10)
    d.department_id = Number.isNaN(n) ? d.department_id : n
  }
  return d
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    const res = await query(`SELECT s.*, d.name as department_name, des.name as designation_name FROM staff s LEFT JOIN departments d ON d.id = s.department_id LEFT JOIN designations des ON des.id = s.designation_id WHERE s.id = $1`, [parseInt(id)])
    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const row = res.rows[0]
    // expose department / designation as names for backward compat, keep ids
    const merged: any = { ...row, department: row.department_name || row.department_id || "", designation: row.designation_name || row.designation_id || "" }
    return NextResponse.json(mapResponse(merged, fieldMap))
  }
  const res = await query(`SELECT s.*, d.name as department_name, des.name as designation_name FROM staff s LEFT JOIN departments d ON d.id = s.department_id LEFT JOIN designations des ON des.id = s.designation_id ORDER BY s.id DESC`)
  const mapped = res.rows.map((row: any) => {
    const merged: any = { ...row, department: row.department_name || row.department_id || "", designation: row.designation_name || row.designation_id || "" }
    return mapResponse(merged, fieldMap)
  })
  return NextResponse.json(mapped)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const snake = camelToSnake(body, fieldMap)
    const data = sanitize(snake)
    // staff_id is unique, allow auto if empty
    if (!data.staff_id) delete data.staff_id
    const item = await create(TABLE, data)
    return NextResponse.json(mapResponse(item as any, fieldMap), { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const snake = camelToSnake(rest, fieldMap)
    const data = sanitize(snake)
    if (data.department_name) delete data.department_name
    if (data.designation_name) delete data.designation_name
    const item = await update(TABLE, id, data)
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(mapResponse(item as any, fieldMap))
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const idParam = searchParams.get("id")
  if (idParam) {
    const id = parseInt(idParam)
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    await remove(TABLE, id)
    return NextResponse.json({ success: true })
  }
  // bulk delete via body { ids: number[] }
  try {
    const body = await req.json()
    if (body?.ids && Array.isArray(body.ids)) {
      for (const delId of body.ids) await remove(TABLE, parseInt(String(delId)))
      return NextResponse.json({ success: true })
    }
  } catch {}
  return NextResponse.json({ error: "id required" }, { status: 400 })
}
