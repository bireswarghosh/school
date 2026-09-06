import { NextRequest } from "next/server"
import { handle, requireRole } from "@/lib/my-api"
import { listEnabledGateways } from "@/lib/gateways"

// Gateways the school has enabled for online fee payments. Returns only public
// info (code, name, mode, whether it runs in demo/test mode) — never the keys.
// Students/parents are shown these options when paying fees.
export const GET = handle(async (req: NextRequest, ctx) => {
  requireRole(ctx, ["student", "parent"])
  const gateways = await listEnabledGateways()
  return { gateways }
})