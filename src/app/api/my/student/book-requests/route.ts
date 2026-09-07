import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent, ApiError } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)

  const result = await query(
    `SELECT b.id, b.name AS "bookName", b.book_number AS "bookNumber",
       b.isbn, b.author, b.publisher, b.subject, b.rack_number AS "rackNumber",
       b.quantity, b.price, b.post_date AS "postDate", b.description, b.pdf_file AS "pdfFile",
       COALESCE(br.requestStatus, '') AS "requestStatus",
       br.requestId AS "requestId"
     FROM books b
     LEFT JOIN (
       SELECT book_id, status AS "requestStatus", id AS "requestId"
       FROM book_requests
       WHERE student_id = $1
     ) br ON br.book_id = b.id
     ORDER BY b.id DESC`,
    [student.id]
  )

  return { books: result.rows }
})

export const POST = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)

  const body = await req.json()
  const { bookId } = body

  if (!bookId) {
    throw new ApiError(400, "bookId is required")
  }

  const existing = await query(
    `SELECT id, status FROM book_requests WHERE student_id = $1 AND book_id = $2 AND school_id = $3`,
    [student.id, bookId, student.school_id]
  )

  if (existing.rows.length > 0) {
    const status = existing.rows[0].status
    if (status === "Pending" || status === "Accepted") {
      throw new ApiError(400, `You already have a ${status.toLowerCase()} request for this book`)
    }
  }

  await query(
    `INSERT INTO book_requests (student_id, book_id, status, request_date, school_id)
     VALUES ($1, $2, 'Pending', CURRENT_DATE, $3)`,
    [student.id, bookId, student.school_id]
  )

  return { success: true, message: "Book request submitted" }
})
