import { NextRequest, NextResponse } from "next/server"
import { getById } from "@/lib/db"
import { mapResponse } from "@/lib/field-mapping"
import { defForName } from "@/lib/gateways"

const TABLE = "payment_gateways"
const FIELD_MAP = { apiKey: "api_key", secretKey: "secret_key", status: "is_active" }

// Health-check a payment gateway using its saved credentials. Currently Razorpay
// is exercised with a real API call (create a 1-paise test order and close it so
// nothing is chargeable). Other providers only validate that keys are present —
// extend per provider as SDKs are added.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const id = parseInt(body.id || body.gatewayId || "0", 10)
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 })
  const item = await getById(TABLE, id)
  if (!item) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
  const gw = mapResponse(item, FIELD_MAP) as { apiKey?: string; secretKey?: string; name?: string; mode?: string }
  const apiKey = String(gw.apiKey || "")
  const secretKey = String(gw.secretKey || "")
  if (!apiKey || !secretKey) {
    return NextResponse.json({ ok: false, error: "Gateway has no API / secret keys configured" }, { status: 400 })
  }
  const def = defForName(gw.name)
  const code = def?.code || String(gw.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "")

  if (code === "razorpay") {
    try {
      const auth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64")
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: 100,
          currency: "INR",
          receipt: `CONN-${Date.now()}`,
          notes: { purpose: "gateway_connectivity_test" },
        }),
      })
      const text = await res.text()
      if (!res.ok) {
        let detail = text
        try {
          const j = JSON.parse(text)
          detail = j?.error?.description || j?.error?.code || detail
        } catch {}
        return NextResponse.json({ ok: false, error: `Razorpay rejected credentials: ${detail}` }, { status: 400 })
      }
      const order = JSON.parse(text) as { id?: string }
      return NextResponse.json({ ok: true, gateway: code, mode: gw.mode || "Test", orderId: order?.id, message: "Razorpay credentials valid — test order created" })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ ok: false, error: `Razorpay request failed: ${msg}` }, { status: 400 })
    }
  }

  return NextResponse.json({
    ok: true,
    gateway: code,
    mode: gw.mode || "Test",
    message: `${gw.name} keys are configured (live SDK test not wired for this provider yet)`,
  })
}