import { NextRequest } from "next/server"
import { handle, requireRole, requireStaff } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["teacher", "staff", "admin"])
  const staff = await requireStaff(ctx)

  const dept =
    staff.department_id != null
      ? (await query(`SELECT name FROM departments WHERE id = $1`, [staff.department_id])).rows[0]?.name
      : null
  const desig =
    staff.designation_id != null
      ? (await query(`SELECT name FROM designations WHERE id = $1`, [staff.designation_id])).rows[0]?.name
      : null

  return {
    id: Number(staff.id),
    staffId: staff.staff_id,
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    department: dept,
    designation: desig,
    status: staff.status,
  }
})
