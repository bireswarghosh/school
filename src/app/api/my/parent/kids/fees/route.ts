import { NextRequest } from "next/server"
import { handle, requireRole, assertParentHasStudent, ApiError, getStudentById } from "@/lib/my-api"
import { getFeeLedger } from "@/lib/fee-pay"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["parent"])
  const { searchParams } = new URL(req.url)
  const studentId = parseInt(searchParams.get("studentId") || searchParams.get("student_id") || "0", 10)
  if (!studentId) throw new ApiError(400, "studentId is required")
  await assertParentHasStudent(ctx, studentId)
  const student = await getStudentById(studentId)

  const ledger = await getFeeLedger(student)
  return { ...ledger, student }
})
