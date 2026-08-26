import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { query } from "@/lib/db"

// Serves files stored in the uploaded_files table (see /api/upload).
export async function GET(_req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params
  const safe = path.basename(name)
  if (safe !== name || !/^[\w.-]+$/.test(safe)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
  }
  let row: { mime: string; size: number; data: Buffer } | undefined
  try {
    const result = await query(`SELECT mime, size, data FROM uploaded_files WHERE name = $1`, [safe])
    row = result.rows[0]
  } catch {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 500 })
  }
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return new NextResponse(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime || "application/octet-stream",
      "Content-Length": String(row.size ?? row.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
