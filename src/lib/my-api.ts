import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export type MyContext = {
  userId: number
  schoolId: number | null
  role: string
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getMyContext(req: NextRequest): MyContext {
  const rawUid = req.headers.get("x-user-id")
  const rawSid = req.headers.get("x-school-id")
  const role = req.headers.get("x-role") || ""
  const userId = rawUid ? parseInt(rawUid, 10) : NaN
  if (!Number.isFinite(userId)) {
    throw new ApiError(401, "Unauthorized")
  }
  return {
    userId,
    schoolId: rawSid && rawSid !== "" ? parseInt(rawSid, 10) : null,
    role,
  }
}

export function requireRole(ctx: MyContext, roles: string[]): void {
  if (!roles.includes(ctx.role)) {
    throw new ApiError(403, `This API is only available to ${roles.join("/")} logins`)
  }
}

export function handle(
  fn: (req: NextRequest, ctx: MyContext) => Promise<unknown>
) {
  return async (req: NextRequest) => {
    try {
      const ctx = getMyContext(req)
      const data = await fn(req, ctx)
      return NextResponse.json(data)
    } catch (e: any) {
      if (e instanceof ApiError) {
        return NextResponse.json({ error: e.message }, { status: e.status })
      }
      return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
    }
  }
}

// ----------------------------------------------------------------
// User -> record resolution (all queries are auto-scoped by school_id
// via the x-school-id header injected by proxy.ts)
// ----------------------------------------------------------------

export async function getStudentByUser(ctx: MyContext): Promise<any | null> {
  const res = await query(`SELECT * FROM students WHERE user_id = $1`, [ctx.userId])
  return res.rows[0] || null
}

export async function getStaffByUser(ctx: MyContext): Promise<any | null> {
  const res = await query(`SELECT * FROM staff WHERE user_id = $1`, [ctx.userId])
  return res.rows[0] || null
}

export async function getParentKids(ctx: MyContext): Promise<any[]> {
  const res = await query(
    `SELECT s.id, s.admission_no AS "admissionNo", s.roll_no AS "rollNo",
       COALESCE(TRIM(CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name)), s.name) AS "name",
       c.name AS "class", sec.name AS "section", s.gender, s.dob, s.status
     FROM students s
     LEFT JOIN classes c ON c.id = s.class_id
     LEFT JOIN sections sec ON sec.id = s.section_id
     JOIN student_guardians sg ON sg.student_id = s.id
     WHERE sg.parent_user_id = $1
     ORDER BY s.id DESC`,
    [ctx.userId]
  )
  return res.rows
}

export async function requireStudent(ctx: MyContext): Promise<any> {
  const student = await getStudentByUser(ctx)
  if (!student) {
    throw new ApiError(404, "No student record is linked to this login. Ask admin to set students.user_id.")
  }
  return student
}

export async function requireStaff(ctx: MyContext): Promise<any> {
  const staff = await getStaffByUser(ctx)
  if (!staff) {
    throw new ApiError(404, "No staff record is linked to this login. Ask admin to set staff.user_id.")
  }
  return staff
}

export async function assertParentHasStudent(ctx: MyContext, studentId: number): Promise<any> {
  const kids = await getParentKids(ctx)
  const kid = kids.find((k) => Number(k.id) === Number(studentId))
  if (!kid) {
    throw new ApiError(403, "This student is not linked to your login")
  }
  return kid
}

export async function getStudentById(id: number): Promise<any | null> {
  const res = await query(`SELECT * FROM students WHERE id = $1`, [id])
  return res.rows[0] || null
}

export async function getClassSectionNames(classId: number | null, sectionId: number | null) {
  const cls = classId
    ? (await query(`SELECT name FROM classes WHERE id = $1`, [classId])).rows[0]
    : null
  const sec = sectionId
    ? (await query(`SELECT name FROM sections WHERE id = $1`, [sectionId])).rows[0]
    : null
  return { className: cls?.name ?? null, sectionName: sec?.name ?? null }
}
