import { NextRequest } from "next/server"
import { handle, requireRole, assertParentHasStudent, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["parent"])
  const { searchParams } = new URL(req.url)
  const studentId = parseInt(searchParams.get("studentId") || searchParams.get("student_id") || "0", 10)
  if (!studentId) throw new ApiError(400, "studentId is required")
  await assertParentHasStudent(ctx, studentId)

  const res = await query(
    `SELECT bi.id, b.name AS "book", b.book_number AS "bookNumber", b.author,
       bi.issue_date AS "issueDate", bi.return_date AS "returnDate", bi.status
     FROM book_issues bi
     LEFT JOIN books b ON b.id = bi.book_id
     WHERE bi.member_type = 'student' AND bi.member_id = $1
     ORDER BY bi.id DESC`,
    [String(studentId)]
  )

  const issued = res.rows.filter((r: any) => r.status === "Issued").length

  return {
    studentId,
    summary: { total: res.rows.length, currentlyIssued: issued },
    books: res.rows,
  }
})
