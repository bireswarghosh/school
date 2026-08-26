import { NextRequest, NextResponse } from "next/server"
import { query, getAll, update } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "system_fields"
const ORDER = "module ASC, sort_order ASC, id ASC"

const fieldMap: Record<string, string> = {
  isEnabled: "is_enabled",
  sortOrder: "sort_order",
}

const DEFAULT_FIELDS: { module: string; role: string; label: string; sortOrder: number }[] = [
  { module: "student", role: "roll_no", label: "Roll Number", sortOrder: 1 },
  { module: "student", role: "middlename", label: "Middle Name", sortOrder: 2 },
  { module: "student", role: "lastname", label: "Last Name", sortOrder: 3 },
  { module: "student", role: "category", label: "Category", sortOrder: 4 },
  { module: "student", role: "religion", label: "Religion", sortOrder: 5 },
  { module: "student", role: "cast", label: "Caste", sortOrder: 6 },
  { module: "student", role: "mobile_no", label: "Mobile Number", sortOrder: 7 },
  { module: "student", role: "student_email", label: "Email", sortOrder: 8 },
  { module: "student", role: "admission_date", label: "Admission Date", sortOrder: 9 },
  { module: "student", role: "student_photo", label: "Student Photo", sortOrder: 10 },
  { module: "student", role: "is_student_house", label: "House", sortOrder: 11 },
  { module: "student", role: "is_blood_group", label: "Blood Group", sortOrder: 12 },
  { module: "student", role: "student_height", label: "Height", sortOrder: 13 },
  { module: "student", role: "student_weight", label: "Weight", sortOrder: 14 },
  { module: "student", role: "measurement_date", label: "Measurement Date", sortOrder: 15 },
  { module: "student", role: "father_name", label: "Father Name", sortOrder: 16 },
  { module: "student", role: "father_phone", label: "Father Phone", sortOrder: 17 },
  { module: "student", role: "father_occupation", label: "Father Occupation", sortOrder: 18 },
  { module: "student", role: "father_pic", label: "Father Photo", sortOrder: 19 },
  { module: "student", role: "mother_name", label: "Mother Name", sortOrder: 20 },
  { module: "student", role: "mother_phone", label: "Mother Phone", sortOrder: 21 },
  { module: "student", role: "mother_occupation", label: "Mother Occupation", sortOrder: 22 },
  { module: "student", role: "mother_pic", label: "Mother Photo", sortOrder: 23 },
  { module: "student", role: "guardian_name", label: "Guardian Name", sortOrder: 24 },
  { module: "student", role: "guardian_phone", label: "Guardian Phone", sortOrder: 25 },
  { module: "student", role: "guardian_relation", label: "Guardian Relation", sortOrder: 26 },
  { module: "student", role: "guardian_email", label: "Guardian Email", sortOrder: 27 },
  { module: "student", role: "guardian_occupation", label: "Guardian Occupation", sortOrder: 28 },
  { module: "student", role: "guardian_pic", label: "Guardian Photo", sortOrder: 29 },
  { module: "student", role: "guardian_address", label: "Guardian Address", sortOrder: 30 },
  { module: "student", role: "current_address", label: "If Guardian Address Is Current Address", sortOrder: 31 },
  { module: "student", role: "permanent_address", label: "If Permanent Address Is Current Address", sortOrder: 32 },
  { module: "student", role: "route_list", label: "Route List", sortOrder: 33 },
  { module: "student", role: "hostel_id", label: "Hostel Details", sortOrder: 34 },
  { module: "student", role: "bank_account_no", label: "Bank Account Number", sortOrder: 35 },
  { module: "student", role: "bank_name", label: "Bank Name", sortOrder: 36 },
  { module: "student", role: "ifsc_code", label: "IFSC Code", sortOrder: 37 },
  { module: "student", role: "national_identification_no", label: "National Identification Number", sortOrder: 38 },
  { module: "student", role: "local_identification_no", label: "Local Identification Number", sortOrder: 39 },
  { module: "student", role: "rte", label: "RTE", sortOrder: 40 },
  { module: "student", role: "previous_school_details", label: "Previous School Details", sortOrder: 41 },
  { module: "student", role: "student_note", label: "Note", sortOrder: 42 },
  { module: "student", role: "upload_documents", label: "Upload Documents", sortOrder: 43 },
  { module: "student", role: "student_barcode", label: "Barcode", sortOrder: 44 },

  { module: "staff", role: "staff_designation", label: "Designation", sortOrder: 1 },
  { module: "staff", role: "staff_department", label: "Department", sortOrder: 2 },
  { module: "staff", role: "staff_last_name", label: "Last Name", sortOrder: 3 },
  { module: "staff", role: "staff_father_name", label: "Father Name", sortOrder: 4 },
  { module: "staff", role: "staff_mother_name", label: "Mother Name", sortOrder: 5 },
  { module: "staff", role: "staff_date_of_joining", label: "Date Of Joining", sortOrder: 6 },
  { module: "staff", role: "staff_phone", label: "Phone", sortOrder: 7 },
  { module: "staff", role: "staff_emergency_contact", label: "Emergency Contact Number", sortOrder: 8 },
  { module: "staff", role: "staff_marital_status", label: "Marital Status", sortOrder: 9 },
  { module: "staff", role: "staff_photo", label: "Photo", sortOrder: 10 },
  { module: "staff", role: "staff_current_address", label: "Current Address", sortOrder: 11 },
  { module: "staff", role: "staff_permanent_address", label: "Permanent Address", sortOrder: 12 },
  { module: "staff", role: "staff_qualification", label: "Qualification", sortOrder: 13 },
  { module: "staff", role: "staff_work_experience", label: "Work Experience", sortOrder: 14 },
  { module: "staff", role: "staff_note", label: "Note", sortOrder: 15 },
  { module: "staff", role: "staff_epf_no", label: "EPF No.", sortOrder: 16 },
  { module: "staff", role: "staff_basic_salary", label: "Basic Salary", sortOrder: 17 },
  { module: "staff", role: "staff_contract_type", label: "Contract Type", sortOrder: 18 },
  { module: "staff", role: "staff_work_shift", label: "Work Shift", sortOrder: 19 },
  { module: "staff", role: "staff_work_location", label: "Work Location", sortOrder: 20 },
  { module: "staff", role: "staff_leaves", label: "Leaves", sortOrder: 21 },
  { module: "staff", role: "staff_account_details", label: "Bank Account Details", sortOrder: 22 },
  { module: "staff", role: "staff_social_media", label: "Social Media Link", sortOrder: 23 },
  { module: "staff", role: "staff_upload_documents", label: "Upload Documents", sortOrder: 24 },
  { module: "staff", role: "staff_barcode", label: "Barcode", sortOrder: 25 },
]

export async function GET(req: NextRequest) {
  try {
    let items = await getAll(TABLE, ORDER)
    if (items.length === 0) {
      for (const f of DEFAULT_FIELDS) {
        await query(
          `INSERT INTO ${TABLE} (module, role, label, is_enabled, sort_order) VALUES ($1,$2,$3,true,$4)`,
          [f.module, f.role, f.label, f.sortOrder]
        )
      }
      items = await getAll(TABLE, ORDER)
    }
    return NextResponse.json(mapResponse(items, fieldMap))
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const data = camelToSnake(rest, fieldMap)
    const item = await update(TABLE, id, data)
    return NextResponse.json(mapResponse(item, fieldMap), { status: item ? 200 : 404 })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}