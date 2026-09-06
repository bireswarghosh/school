import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import path from "path"
import sharp from "sharp"
import { query } from "@/lib/db"

// Files are stored in Postgres (uploaded_files.data BYTEA), not on disk.
// Vercel serverless filesystems are read-only and ephemeral, so disk
// storage breaks in production. DB storage works identically everywhere.
const MAX_SIZE = 4 * 1024 * 1024 // 4 MB — Vercel request-body limit is ~4.5 MB

// Raster images are converted to WebP on upload (small, universal, print-safe).
// SVG stays as-is (vector logos must stay crisp); non-images are stored raw.
const RASTER: Record<string, boolean> = {
  ".jpg": true, ".jpeg": true, ".png": true, ".gif": true,
  ".webp": true, ".avif": true, ".bmp": true, ".tif": true, ".tiff": true,
}

async function toWebP(buf: Buffer, ext: string): Promise<Buffer> {
  // PNG (usually logos with transparency) → lossless WebP to preserve alpha
  if (ext === ".png") {
    return sharp(buf, { animated: true }).webp({ lossless: true }).toBuffer()
  }
  return sharp(buf, { animated: true }).webp({ quality: 80 }).toBuffer()
}

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

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const rawFiles = form.getAll("files").filter((f) => f instanceof File) as File[]
    if (rawFiles.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    let schoolId: number | null = null
    try {
      const h = await headers()
      const raw = h.get("x-school-id")
      if (raw) schoolId = parseInt(raw, 10) || null
    } catch {}

    const uploaded: { name: string; url: string; size: number; type: string }[] = []
    for (const file of rawFiles) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `File "${file.name}" exceeds 4 MB limit` }, { status: 400 })
      }
      let buf: Buffer = Buffer.from(await file.arrayBuffer()) as Buffer
      const ext = path.extname(file.name).toLowerCase()
      const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : ""
      let mime = file.type || MIME[safeExt] || "application/octet-stream"

      // Convert raster images to WebP (best effort — falls back to original on failure)
      if (RASTER[safeExt]) {
        try {
          buf = await toWebP(buf, safeExt)
          if (buf.length > MAX_SIZE) {
            return NextResponse.json({ error: `Converted image "${file.name}" exceeds 4 MB limit` }, { status: 400 })
          }
        } catch (e) {
          buf = Buffer.from(await file.arrayBuffer())
          if (e instanceof Error) console.warn(`[upload] WebP conversion skipped for ${file.name}:`, e.message)
        }
      }

      // Name the stored file after its final format so mime detection stays correct
      const storedExt = RASTER[safeExt] ? ".webp" : safeExt
      const stored = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${storedExt}`
      if (RASTER[safeExt]) mime = "image/webp"
      await query(
        `INSERT INTO uploaded_files (name, mime, size, data, school_id) VALUES ($1, $2, $3, $4, $5)`,
        [stored, mime, buf.length, buf, schoolId]
      )
      uploaded.push({ name: file.name, url: `/api/files/${stored}`, size: buf.length, type: mime })
    }

    return NextResponse.json({ success: true, files: uploaded })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
