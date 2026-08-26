import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

const KEY_MAP: Record<string, string> = {
  openai: "ai_key_openai",
  gemini: "ai_key_gemini",
  groq: "ai_key_groq",
  openrouter: "ai_key_openrouter",
  deepseek: "ai_key_deepseek",
  mistral: "ai_key_mistral",
}

export async function GET() {
  try {
    const keys = Object.values(KEY_MAP)
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
    const result = await query(
      `SELECT key, value FROM system_settings WHERE key IN (${placeholders}) OR key = 'ai_provider'`,
      keys
    )
    const settings: Record<string, string> = { provider: "openai" }
    for (const row of result.rows) {
      if (row.key === "ai_provider") {
        settings.provider = row.value
      } else {
        const provider = Object.entries(KEY_MAP).find(([, v]) => v === row.key)?.[0]
        if (provider) settings[provider] = row.value
      }
    }
    return NextResponse.json(settings)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { keys, provider } = body

    if (keys && typeof keys === "object") {
      for (const [prov, apiKey] of Object.entries(keys)) {
        const dbKey = KEY_MAP[prov]
        if (!dbKey) continue
        await query(
          `INSERT INTO system_settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [dbKey, apiKey as string]
        )
      }
    }

    if (provider) {
      await query(
        `INSERT INTO system_settings (key, value) VALUES ('ai_provider', $1)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [provider]
      )
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
