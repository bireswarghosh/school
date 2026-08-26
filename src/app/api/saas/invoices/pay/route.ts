import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionRole } from "@/lib/auth"
import { createRazorpayOrder, createRazorpayPaymentLink, razorpayConfigured, getConfig as getRazorpayConfig } from "@/lib/razorpay"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function requireSuperAdmin(req: NextRequest): NextResponse | null {
  if (getSessionRole(req) !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

export async function POST(req: NextRequest) {
  const forbidden = requireSuperAdmin(req)
  if (forbidden) return forbidden

  try {
    const body = await req.json()
    const id = parseInt(body.id || "0")
    const mode = body.mode || "payment_link" // "payment_link" | "order"
    if (!id) return NextResponse.json({ error: "invoice id required" }, { status: 400 })

    const inv = (await query(`SELECT * FROM invoices WHERE id = $1`, [id])).rows[0]
    if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    if (inv.status === "paid") return NextResponse.json({ error: "Invoice already paid" }, { status: 400 })

    const school = (await query(`SELECT name, email FROM schools WHERE id = $1`, [inv.school_id])).rows[0]
    const amountPaise = Math.round(Number(inv.amount) * 100)
    const description = `School subscription invoice ${inv.invoice_no} - ${inv.plan_name || "Plan"}`
    const publicLink = `${new URL(req.url).origin}/saas/pay?invoice=${id}`

    let result: any = { mode: "checkout", checkoutUrl: publicLink }

    if (await razorpayConfigured()) {
      if (mode === "order") {
        const cfg = await getRazorpayConfig()
        const order = await createRazorpayOrder(amountPaise, inv.invoice_no, { invoice_id: String(inv.id), school_id: String(inv.school_id) })
        await query(
          `UPDATE invoices SET razorpay_order_id = $1, payment_link = $2, status = 'unpaid' WHERE id = $3`,
          [order.id, publicLink, id]
        )
        result = {
          mode: "razorpay_order",
          invoiceId: inv.id,
          orderId: order.id,
          amountPaise,
          amount: Number(inv.amount),
          currency: cfg.currency || "INR",
          keyId: cfg.keyId,
          description,
          receipt: order.receipt,
          name: school?.name || "School",
          prefillEmail: school?.email,
          checkoutFallback: publicLink,
        }
      } else {
        const cfg = await getRazorpayConfig()
        const link = await createRazorpayPaymentLink(amountPaise, description, { name: school?.name, email: school?.email }, cfg.callbackUrl || undefined)
        await query(
          `UPDATE invoices SET payment_link = $1, razorpay_order_id = $2, status = 'unpaid' WHERE id = $3`,
          [link.short_url || publicLink, link.id, id]
        )
        result = {
          mode: "payment_link",
          invoiceId: inv.id,
          payLink: link.short_url || link.link_url || publicLink,
          paymentLinkId: link.id,
          amount: Number(inv.amount),
          fallback: publicLink,
        }
      }
    } else {
      // No Razorpay keys → public checkout page (no keys configured in dev)
      await query(
        `UPDATE invoices SET payment_link = $1, status = 'unpaid' WHERE id = $2`,
        [publicLink, id]
      )
      result = {
        mode: "checkout",
        invoiceId: inv.id,
        checkoutUrl: publicLink,
      }
    }

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}