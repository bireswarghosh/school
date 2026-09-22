import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

type ReorderItem = { id: number; order: number }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawItems: unknown[] = Array.isArray(body?.items) ? body.items : []
    if (rawItems.length === 0) return NextResponse.json({ error: "items array required" }, { status: 400 })

    const valid: ReorderItem[] = rawItems
      .map((i: unknown) => {
        const it = i as Partial<ReorderItem>
        const id = Number(it?.id)
        const order = Number(it?.order)
        return { id, order, ok: Number.isFinite(id) && id > 0 && Number.isFinite(order) }
      })
      .filter((x) => x.ok)
      .map(({ id, order }) => ({ id, order }))
    if (valid.length === 0) return NextResponse.json({ error: "items must include id and order" }, { status: 400 })

    for (const { id, order } of valid) {
      await query(`UPDATE classes SET order_number = $1 WHERE id = $2`, [order, id])
    }
    return NextResponse.json({ success: true, updated: valid.length })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}