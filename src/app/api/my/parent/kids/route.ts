import { NextRequest } from "next/server"
import { handle, requireRole, getParentKids } from "@/lib/my-api"

export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["parent"])
  const kids = await getParentKids(ctx)
  return { kids }
})
