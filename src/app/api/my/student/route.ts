import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent, getClassSectionNames } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)
  const { className, sectionName } = await getClassSectionNames(student.class_id, student.section_id)

  return {
    id: Number(student.id),
    admissionNo: student.admission_no,
    rollNo: student.roll_no,
    name: (student.name || "").trim() || `${student.first_name || ""} ${student.last_name || ""}`.trim(),
    firstName: student.first_name,
    middleName: student.middle_name,
    lastName: student.last_name,
    className,
    sectionName,
    classId: student.class_id ? Number(student.class_id) : null,
    sectionId: student.section_id ? Number(student.section_id) : null,
    gender: student.gender,
    dob: student.dob,
    category: student.category,
    bloodGroup: student.blood_group,
    house: student.house,
    email: student.email,
    mobile: student.mobile || student.phone,
    admissionDate: student.admission_date,
    status: student.status,
  }
})
