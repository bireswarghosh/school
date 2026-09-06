import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { AI_PROVIDERS, providerById } from "@/lib/ai-providers"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

async function callOpenAICompatible(url: string, apiKey: string, model: string): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
      temperature: 0,
      max_tokens: 10,
    }),
  })
  if (!res.ok) throw new Error(await readableApiError("API error", res))
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

async function readableApiError(label: string, res: Response): Promise<string> {
  const text = (await res.text()).substring(0, 400)
  try {
    const j = JSON.parse(text)
    const msg = j?.error?.message || j?.message
    if (msg) return `${label}: ${res.status} - ${msg}`
  } catch {
    /* not json */
  }
  return `${label}: ${res.status} ${text}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const providerId = body?.provider
    const cfg = providerById(providerId)

    let apiKey = (body?.apiKey as string) || ""
    let keyProvided = !!apiKey
    if (!apiKey) {
      const dbResult = await query("SELECT value FROM system_settings WHERE key = $1", [`ai_key_${cfg.id}`])
      apiKey = dbResult.rows[0]?.value || ""
    }
    if (cfg.needsKey === false) apiKey = ""
    if (cfg.needsKey !== false && !apiKey) {
      return NextResponse.json({ error: `No API key saved for ${cfg.name}.`, provider: cfg.id }, { status: 400 })
    }

    let content = ""
    if (cfg.special === "gemini") {
      const res = await fetch(`${cfg.url}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with exactly: OK" }] }] }),
      })
      if (!res.ok) throw new Error(await readableApiError("API error", res))
      const data = await res.json()
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    } else {
      content = await callOpenAICompatible(cfg.url, apiKey, cfg.model)
    }

    if (keyProvided) {
      await query(
        `INSERT INTO system_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [`ai_key_${cfg.id}`, apiKey]
      )
    }

    return NextResponse.json({ success: !!content, provider: cfg.id, name: cfg.name, details: content })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export const dynamic = "force-dynamic"