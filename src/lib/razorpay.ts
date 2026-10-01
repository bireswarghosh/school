import { query } from "@/lib/db"

type RazorpayConfig = {
  keyId: string
  keySecret: string
  currency: string
  enabled: boolean
  callbackUrl?: string | null
}

// A Razorpay key is only usable when it looks like a genuine key (rzp_test_ /
// rzp_live_ with a real id). Placeholder / demo strings such as
// "rzp_test_api_key_12345" must NOT count as configured, otherwise the realtime
// checkout would try (and fail) against the API with invalid credentials.
function looksLikeRazorpayKey(key: string): boolean {
  const k = String(key || "").trim()
  return /^rzp_(test|live)_/.test(k) && k.length >= 18
}

// Resolve Razorpay keys in priority order:
//   1. RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET env vars (deployment override).
//   2. payment_gateways row named "Razorpay" — the row managed from the admin
//      Payment Methods panel (/admin/system-setting/general-setting?tab=payment).
//   3. payment_settings row id=1 — the legacy super-admin console setting.
// Only keys that look like genuine Razorpay keys are accepted; anything else is
// treated as not configured so the app falls back to the demo/manual flow.
export async function getConfig(): Promise<RazorpayConfig> {
  const envKey = process.env.RAZORPAY_KEY_ID || ""
  const envSecret = process.env.RAZORPAY_KEY_SECRET || ""
  if (looksLikeRazorpayKey(envKey) && looksLikeRazorpayKey(envSecret)) {
    return { keyId: envKey, keySecret: envSecret, currency: "INR", enabled: true }
  }

  try {
    const gw = (
      await query(
        `SELECT api_key AS "apiKey", secret_key AS "secretKey"
         FROM payment_gateways WHERE name = 'Razorpay' ORDER BY id LIMIT 1`
      )
    ).rows[0]
    if (gw && looksLikeRazorpayKey(gw.apiKey) && looksLikeRazorpayKey(gw.secretKey)) {
      return { keyId: gw.apiKey, keySecret: gw.secretKey, currency: "INR", enabled: true }
    }
  } catch {
    // fall through to payment_settings
  }

  try {
    const res = await query(`SELECT * FROM payment_settings WHERE id = 1`)
    const row = res.rows[0]
    if (
      row &&
      row.razorpay_enabled &&
      looksLikeRazorpayKey(row.razorpay_key_id) &&
      looksLikeRazorpayKey(row.razorpay_key_secret)
    ) {
      return {
        keyId: row.razorpay_key_id,
        keySecret: row.razorpay_key_secret,
        currency: row.currency || "INR",
        enabled: true,
        callbackUrl: row.callback_url,
      }
    }
    return { keyId: "", keySecret: "", currency: "INR", enabled: false }
  } catch {
    return { keyId: "", keySecret: "", currency: "INR", enabled: false }
  }
}

export async function razorpayConfigured() {
  const c = await getConfig()
  return c.enabled && Boolean(c.keyId && c.keySecret)
}

export async function createRazorpayOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  const c = await getConfig()
  const auth = Buffer.from(`${c.keyId}:${c.keySecret}`).toString("base64")
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: c.currency || "INR",
      receipt,
      notes,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Razorpay order failed (${res.status}): ${text}`)
  }
  return res.json()
}

export async function createRazorpayPaymentLink(amountPaise: number, description: string, customer: { name?: string; email?: string } = {}, callbackUrl?: string) {
  const c = await getConfig()
  const auth = Buffer.from(`${c.keyId}:${c.keySecret}`).toString("base64")
  const body: Record<string, any> = {
    amount: amountPaise,
    currency: c.currency || "INR",
    description,
    callback_url: callbackUrl || "https://localhost:3000/saas/pay/callback",
    callback_method: "get",
    notes: { purpose: "school_subscription" },
  }
  if (customer.name) body.customer = { ...body.customer, name: customer.name }
  if (customer.email) body.customer = { ...body.customer, email: customer.email }
  const res = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Razorpay payment link failed (${res.status}): ${text}`)
  }
  return res.json()
}

export async function verifyRazorpayPayment(paymentId: string): Promise<boolean> {
  const c = await getConfig()
  const auth = Buffer.from(`${c.keyId}:${c.keySecret}`).toString("base64")
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  if (!res.ok) return false
  const data = await res.json()
  return data.status === "captured"
}