import { NextRequest } from "next/server"
import { handle, requireRole } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["teacher", "staff", "admin", "student", "parent"])

  const res = await query(
    `SELECT e.id, e.name, e.session, e.publish_exam AS "publishExam",
       e.publish_result AS "publishResult", eg.name AS "group"
     FROM exams e
     LEFT JOIN exam_groups eg ON eg.id = e.group_id
     ORDER BY e.id DESC`
  )

  return {
    exams: res.rows.map((r: any) => ({
      id: Number(r.id),
      name: r.name,
      session: r.session,
      group: r.group,
      publishExam: Boolean(r.publishExam),
      publishResult: Boolean(r.publishResult),
    })),
  }
})
