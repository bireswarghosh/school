import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import sharp from "sharp"
import { query } from "@/lib/db"

// Generate a colorful flat icon image for a product/category name using Pollinations (no key required)
// and store as WebP in uploaded_files. Returns {url}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawName: string = body.name || body.prompt || ""
    const name = rawName.trim()
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })

    // Build a prompt for a flat vector icon: colorful, school product icon, white background, centered
    const prompt = `flat vector icon of ${name}, school uniform product icon, colorful, minimal, white background, centered, high detail, 512x512`
    const url = `https://image.pollinations.ai/p/${encodeURIComponent(prompt)}?model=turbo&width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 100000)}`

    const fetchRes = await fetch(url, { cache: "no-store" })
    if (!fetchRes.ok) {
      const txt = await fetchRes.text().catch(() => "")
      return NextResponse.json({ error: `Pollinations failed: ${fetchRes.status} ${txt.slice(0,200)}` }, { status: 500 })
    }
    const buf = Buffer.from(await fetchRes.arrayBuffer())
    // Convert to WebP (quality 85) to keep small and consistent with upload flow
    let webp: Buffer
    try {
      webp = await sharp(buf).webp({ quality: 85 }).toBuffer()
    } catch {
      webp = buf
    }

    let schoolId: number | null = null
    try {
      const h = await headers()
      const raw = h.get("x-school-id")
      if (raw) schoolId = parseInt(raw, 10) || null
    } catch {}

    const stored = `ai-icon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.webp`
    await query(`INSERT INTO uploaded_files (name, mime, size, data, school_id) VALUES ($1,$2,$3,$4,$5)`, [stored, "image/webp", webp.length, webp, schoolId])
    return NextResponse.json({ success: true, url: `/api/files/${stored}`, prompt })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
