import { NextRequest } from "next/server"
import { handle, getStudentByUser, getStaffByUser, getParentKids } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  const user =
    (await query(`SELECT id, name, email, role FROM users WHERE id = $1`, [ctx.userId])).rows[0] || null

  const linked: any = { role: ctx.role }
  if (ctx.role === "student") {
    const st = await getStudentByUser(ctx)
    linked.studentId = st ? Number(st.id) : null
  } else if (ctx.role === "teacher" || ctx.role === "staff") {
    const staff = await getStaffByUser(ctx)
    linked.staffId = staff ? Number(staff.id) : null
  } else if (ctx.role === "parent") {
    const kids = await getParentKids(ctx)
    linked.kids = kids
  }

  return { user, schoolId: ctx.schoolId, linked }
})
