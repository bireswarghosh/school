import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent, getParentKids } from "@/lib/my-api"
import { query } from "@/lib/db"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent"])

  let studentIds: number[] = []

  if (ctx.role === "student") {
    const student = await requireStudent(ctx)
    studentIds = [student.id]
  } else {
    const kids = await getParentKids(ctx)
    studentIds = kids.map((k: any) => Number(k.id))
  }

  if (studentIds.length === 0) {
    return { sales: [] }
  }

  const ids = studentIds.join(",")
  const result = await query(
    `SELECT si.id, si.sale_no AS "saleNo", si.student_id AS "studentId",
       si.student_name AS "studentName", si.product_id AS "productId",
       si.book_id AS "bookId", si.quantity, si.unit_price AS "unitPrice",
       si.subtotal, si.discount_amount AS "discountAmount",
       si.total_amount AS "totalAmount", si.sale_date AS "saleDate",
       si.payment_status AS "paymentStatus",
       p.name AS "productName", b.name AS "bookName"
     FROM si_sales si
     LEFT JOIN si_products p ON p.id = si.product_id
     LEFT JOIN books b ON b.id = si.book_id
     WHERE si.student_id IN (${ids})
     ORDER BY si.id DESC`
  )

  return { sales: result.rows }
})
