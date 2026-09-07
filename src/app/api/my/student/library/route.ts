import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)

  const res = await query(
    `SELECT bi.id, b.name AS "book", b.book_number AS "bookNumber", b.author,
       bi.member_id AS "memberId", bi.issue_date AS "issueDate",
       bi.due_return_date AS "dueReturnDate",
       bi.return_date AS "returnDate", bi.status
     FROM book_issues bi
     LEFT JOIN books b ON b.id = bi.book_id
     WHERE bi.member_type = 'student' AND bi.member_id = $1
     ORDER BY bi.id DESC`,
    [String(student.id)]
  )

  const issued = res.rows.filter((r: any) => r.status === "Issued").length

  return {
    studentId: Number(student.id),
    summary: { total: res.rows.length, currentlyIssued: issued },
    books: res.rows,
  }
})
