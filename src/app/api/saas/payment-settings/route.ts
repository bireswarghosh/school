import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionRole } from "@/lib/auth"

function requireSuperAdmin(req: NextRequest): NextResponse | null {
  if (getSessionRole(req) !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function GET(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden
  try {
    const res = await query(`SELECT * FROM payment_settings WHERE id = 1`)
    const row = res.rows[0]
    if (!row) return NextResponse.json({ error: "Settings not found" }, { status: 404 })
    return NextResponse.json({
      razorpayEnabled: Boolean(row.razorpay_enabled),
      razorpayKeyId: row.razorpay_key_id || "",
      hasSecret: Boolean(row.razorpay_key_secret),
      currency: row.currency || "INR",
      callbackUrl: row.callback_url || "",
    })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden
  try {
    const body = await req.json()
    const current = (await query(`SELECT * FROM payment_settings WHERE id = 1`)).rows[0]

    const updates: string[] = []
    const params: (string | number | boolean | null)[] = []

    if (typeof body.razorpayEnabled === "boolean") {
      params.push(body.razorpayEnabled)
      updates.push(`razorpay_enabled = $${params.length}`)
    }
    if (typeof body.razorpayKeyId === "string") {
      params.push(body.razorpayKeyId.trim())
      updates.push(`razorpay_key_id = $${params.length}`)
    }
    // Only overwrite the secret when a new value is supplied
    if (typeof body.razorpayKeySecret === "string" && body.razorpayKeySecret.trim()) {
      params.push(body.razorpayKeySecret.trim())
      updates.push(`razorpay_key_secret = $${params.length}`)
    } else if (body.clearSecret) {
      params.push(null)
      updates.push(`razorpay_key_secret = $${params.length}`)
    }
    if (typeof body.currency === "string" && body.currency.trim()) {
      params.push(body.currency.trim().toUpperCase())
      updates.push(`currency = $${params.length}`)
    }
    if (typeof body.callbackUrl === "string") {
      params.push(body.callbackUrl.trim() || null)
      updates.push(`callback_url = $${params.length}`)
    }
    if (updates.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    params.push(new Date().toISOString())
    updates.push(`updated_at = $${params.length}`)

    await query(`UPDATE payment_settings SET ${updates.join(", ")} WHERE id = 1`, params)
    const fresh = (await query(`SELECT * FROM payment_settings WHERE id = 1`)).rows[0]
    return NextResponse.json({
      razorpayEnabled: Boolean(fresh.razorpay_enabled),
      razorpayKeyId: fresh.razorpay_key_id || "",
      hasSecret: Boolean(fresh.razorpay_key_secret),
      currency: fresh.currency || "INR",
      callbackUrl: fresh.callback_url || "",
    })
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
