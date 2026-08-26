import { NextRequest, NextResponse } from "next/server"
import { createReadStream, existsSync, statSync } from "fs"
import { Readable } from "stream"
import path from "path"

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads")
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".zip": "application/zip",
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params
  const safe = path.basename(name)
  if (safe !== name || !/^[\w.-]+$/.test(safe)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
  }
  const filePath = path.join(UPLOAD_DIR, safe)
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const stats = statSync(filePath)
  const ext = path.extname(safe).toLowerCase()
  const contentType = MIME[ext] || "application/octet-stream"
  const stream = createReadStream(filePath)
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stats.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
