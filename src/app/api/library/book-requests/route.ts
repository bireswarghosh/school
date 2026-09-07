import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  let sql = `SELECT br.id, br.student_id AS "studentId", br.book_id AS "bookId",
    br.status, br.request_date AS "requestDate", br.response_date AS "responseDate",
    s.name AS "studentName", s.admission_no AS "admissionNo",
    c.name AS "className", sc.name AS "sectionName",
    b.name AS "bookName", b.book_number AS "bookNumber", b.author, b.subject,
    u.email AS "studentEmail"
  FROM book_requests br
  LEFT JOIN students s ON s.id = br.student_id
  LEFT JOIN classes c ON c.id = s.class_id
  LEFT JOIN sections sc ON sc.id = s.section_id
  LEFT JOIN books b ON b.id = br.book_id
  LEFT JOIN users u ON u.id = s.user_id`

  const params: any[] = []
  if (status) {
    sql += ` WHERE br.status = $1`
    params.push(status)
  }
  sql += ` ORDER BY br.id DESC`

  const result = await query(sql, params)
  return NextResponse.json({ requests: result.rows })
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 })
    }

    if (!["Accepted", "Rejected"].includes(status)) {
      return NextResponse.json({ error: "status must be Accepted or Rejected" }, { status: 400 })
    }

    await query(
      `UPDATE book_requests SET status = $1, response_date = CURRENT_DATE WHERE id = $2`,
      [status, id]
    )

    if (status === "Accepted") {
      const reqResult = await query(
        `SELECT student_id, book_id FROM book_requests WHERE id = $1`,
        [id]
      )
      const r = reqResult.rows[0]
      if (r) {
        const memberName = await query(`SELECT name FROM students WHERE id = $1`, [r.student_id])
        await query(
          `INSERT INTO book_issues (book_id, member_type, member_id, member_name, issue_date, status)
           VALUES ($1, 'student', $2, $3, CURRENT_DATE, 'Issued')`,
          [r.book_id, r.student_id, memberName.rows[0]?.name || "Student"]
        )
      }
    }

    return NextResponse.json({ success: true, message: `Request ${status.toLowerCase()}` })
  } catch (e: any) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
