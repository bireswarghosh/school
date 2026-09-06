// Payment gateway registry.
//
// Gateways are stored in the `payment_gateways` table (name, api_key, secret_key,
// mode, is_active). This module holds the well-known gateway definitions (including
// demo/test credentials) plus helpers used by the admin settings, the portal fees
// page and the order/verify payment routes.
import { query } from "@/lib/db"

export type GatewayDef = {
  name: string
  code: string
  demoApiKey: string
  demoSecretKey: string
  notes: string
}

export const GATEWAY_DEFS: GatewayDef[] = [
  {
    name: "Razorpay",
    code: "razorpay",
    demoApiKey: "rzp_test_9i7Xo2qLt5wEbPn",
    demoSecretKey: "rzp_test_secret_4k8mZ1cQv9rYtUa",
    notes: "Cards · UPI · NetBanking · Wallets",
  },
  {
    name: "PhonePe",
    code: "phonepe",
    demoApiKey: "phonepe_test_merchant_demo",
    demoSecretKey: "phonepe_test_mch_secret_demo",
    notes: "UPI · Cards · NetBanking",
  },
  {
    name: "Cashfree Payments",
    code: "cashfree",
    demoApiKey: "cashfree_test_client_demo",
    demoSecretKey: "cashfree_test_client_secret_demo",
    notes: "UPI · Cards · NetBanking · BNPL",
  },
  {
    name: "CCAvenue",
    code: "ccavenue",
    demoApiKey: "ccavenue_test_merchant_demo",
    demoSecretKey: "ccavenue_test_enc_key_demo",
    notes: "Cards · NetBanking · Wallets",
  },
  {
    name: "PayPal",
    code: "paypal",
    demoApiKey: "paypal_test_api_key",
    demoSecretKey: "paypal_test_secret_key",
    notes: "International payments",
  },
]

export function defForName(name: string | null | undefined): GatewayDef | undefined {
  const n = String(name || "").toLowerCase()
  return GATEWAY_DEFS.find((g) => g.code === n || g.name.toLowerCase() === n)
}

export function defForCode(code: string): GatewayDef | undefined {
  return GATEWAY_DEFS.find((g) => g.code === String(code || "").toLowerCase())
}

export type EnabledGateway = {
  code: string
  name: string
  mode: string
  notes?: string
  demo: boolean
}

// Gateways the school has enabled (is_active) and actually configured with keys.
// Never returns secret values.
export async function listEnabledGateways(): Promise<EnabledGateway[]> {
  const res = await query(
    `SELECT name, api_key AS "apiKey", mode
     FROM payment_gateways
     WHERE is_active = true AND api_key IS NOT NULL AND api_key <> ''
     ORDER BY id`
  )
  return res.rows.map((r: any) => {
    const def = defForName(r.name)
    return {
      code: def?.code || slugify(String(r.name)),
      name: String(r.name),
      mode: r.mode || "Live",
      notes: def?.notes,
      demo: (r.mode || "Test") === "Test" || Boolean(def && r.apiKey === def.demoApiKey),
    }
  })
}

// Resolve a gateway code ("razorpay", "phonepe", ...) to an active configured row,
// or null when inactive / not configured. Used by the order route.
export async function getActiveGateway(code: string): Promise<{ code: string; name: string; mode: string } | null> {
  const def = defForCode(code)
  if (!def) return null
  const res = await query(
    `SELECT name, mode, api_key AS "apiKey"
     FROM payment_gateways
     WHERE LOWER(name) = LOWER($1) AND is_active = true AND api_key IS NOT NULL AND api_key <> ''
     LIMIT 1`,
    [def.name]
  )
  const row = res.rows[0]
  if (!row) return null
  return { code: def.code, name: def.name, mode: row.mode || "Test" }
}

export function gatewayNameForCode(code: string): string {
  return defForCode(code)?.name || code
}

export function slugify(name: string): string {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim()
}