import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent, requireStaff, getParentKids, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

function today() {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from).getTime()
  const b = new Date(to).getTime()
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 1
  return Math.round((b - a) / 86400000) + 1
}

async function kidsUserIds(ctxUserId: number): Promise<number[]> {
  const kids = await getParentKids({ userId: ctxUserId } as any)
  if (kids.length === 0) return []
  const ids = kids.map((k) => Number(k.id))
  const users = await query(`SELECT user_id FROM students WHERE id = ANY(string_to_array($1, ',')::int[])`, [ids.join(",")])
  return users.rows.map((r: any) => r.user_id).filter((v: any) => v != null)
}

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent", "teacher", "staff", "admin"])

  let ownerIdList = [ctx.userId]
  if (ctx.role === "parent") {
    const kidIds = await kidsUserIds(ctx.userId)
    ownerIdList = [ctx.userId, ...kidIds]
  }
  const ownerCsv = ownerIdList.join(",")

  const res = await query(
    `SELECT lr.id, lr.user_id AS "userId", lr.name, lr.role,
       lt.name AS "leaveType", lr.from_date AS "fromDate", lr.to_date AS "toDate",
       lr.days, lr.reason, lr.status, lr.created_at AS "appliedAt"
     FROM leave_requests lr
     LEFT JOIN leave_types lt ON lt.id = lr.leave_type_id
     WHERE lr.user_id = ANY(string_to_array($1, ',')::int[])
     ORDER BY lr.id DESC LIMIT 100`,
    [ownerCsv]
  )

  return { leaves: res.rows }
})

export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent", "teacher", "staff", "admin"])
  const body = await req.json()
  const { leaveTypeId, fromDate, toDate, reason, studentId } = body || {}
  if (!fromDate || !reason) throw new ApiError(400, "fromDate and reason are required")

  let userId = ctx.userId
  let name: string | null = null
  let role = ctx.role

  if (ctx.role === "student") {
    const s = await requireStudent(ctx)
    name = s.name || `${s.first_name || ""} ${s.last_name || ""}`.trim()
    userId = ctx.userId
  } else if (ctx.role === "teacher" || ctx.role === "staff") {
    const staff = await requireStaff(ctx)
    name = staff.name
  } else if (ctx.role === "parent") {
    if (!studentId) throw new ApiError(400, "studentId is required when applying as parent")
    const kids = await getParentKids(ctx)
    const kid = kids.find((k) => Number(k.id) === Number(studentId))
    if (!kid) throw new ApiError(403, "This student is not linked to your login")
    name = kid.name
    role = "student"
    const u = await query(`SELECT user_id FROM students WHERE id = $1`, [Number(studentId)])
    userId = u.rows[0]?.user_id ?? ctx.userId
  }

  const to = toDate || fromDate
  const days = daysBetween(String(fromDate), String(to))

  const res = await query(
    `INSERT INTO leave_requests (user_id, name, role, leave_type_id, from_date, to_date, days, reason, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Pending') RETURNING id`,
    [
      userId,
      name || null,
      role,
      leaveTypeId ? Number(leaveTypeId) : null,
      String(fromDate),
      String(to),
      days,
      String(reason),
    ]
  )

  return {
    success: true,
    leave: {
      id: Number(res.rows[0].id),
      fromDate: String(fromDate),
      toDate: String(to),
      days,
      status: "Pending",
      appliedOn: today(),
    },
  }
})
