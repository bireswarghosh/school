import { NextRequest } from "next/server"
import { handle, requireRole } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent", "teacher", "staff", "admin"])

  const res = await query(
    `SELECT id, title, notice_date AS "noticeDate", publish_date AS "publishDate", message
     FROM notices
     ORDER BY publish_date DESC NULLS LAST, notice_date DESC NULLS LAST`
  )

  return { notices: res.rows }
})
