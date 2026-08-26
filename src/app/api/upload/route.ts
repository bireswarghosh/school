import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import path from "path"
import { query } from "@/lib/db"

// Files are stored in Postgres (uploaded_files.data BYTEA), not on disk.
// Vercel serverless filesystems are read-only and ephemeral, so disk
// storage breaks in production. DB storage works identically everywhere.
const MAX_SIZE = 4 * 1024 * 1024 // 4 MB — Vercel request-body limit is ~4.5 MB

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
      const buf = Buffer.from(await file.arrayBuffer())
      const ext = path.extname(file.name).toLowerCase()
      const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : ""
      const stored = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`
      const mime = file.type || MIME[safeExt] || "application/octet-stream"
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
