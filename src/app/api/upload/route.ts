import { NextRequest, NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import path from "path"

const MAX_SIZE = 15 * 1024 * 1024 // 15 MB per file

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const rawFiles = form.getAll("files").filter((f) => f instanceof File) as File[]
    if (rawFiles.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const dir = path.join(process.cwd(), "data", "uploads")
    await mkdir(dir, { recursive: true })

    const uploaded: { name: string; url: string; size: number; type: string }[] = []
    for (const file of rawFiles) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `File "${file.name}" exceeds 15 MB limit` }, { status: 400 })
      }
      const buf = Buffer.from(await file.arrayBuffer())
      const ext = path.extname(file.name).toLowerCase()
      const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : ""
      const stored = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`
      await writeFile(path.join(dir, stored), buf)
      uploaded.push({
        name: file.name,
        url: `/api/files/${stored}`,
        size: buf.length,
        type: file.type || "application/octet-stream",
      })
    }

    return NextResponse.json({ success: true, files: uploaded })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}