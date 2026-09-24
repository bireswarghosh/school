import { NextRequest } from "next/server"
import { handle, requireRole, requireStudent } from "@/lib/my-api"
import { getFeeLedger } from "@/lib/fee-pay"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student"])
  const student = await requireStudent(ctx)
  return getFeeLedger(student)
})