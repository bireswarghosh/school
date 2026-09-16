import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { AI_PROVIDERS } from "@/lib/ai-providers"

const PROVIDERS = Object.fromEntries(
  AI_PROVIDERS.map((p) => [
    p.id,
    { name: p.name, model: p.model, url: p.url, keyDb: `ai_key_${p.id}`, free: p.free, needsKey: p.needsKey !== false, special: p.special },
  ])
) as Record<string, { name: string; model: string; url: string; keyDb: string; free: boolean; needsKey: boolean; special?: "gemini" | "openrouter" }>

async function callOpenAICompatible(url: string, apiKey: string, model: string, prompt: string): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 4096 }) })
  if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}
async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(`${PROVIDERS.gemini.url}?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 4096 } }) })
  if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}
async function callOpenRouter(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(PROVIDERS.openrouter.url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "openai/gpt-4o-mini", messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 4096 }) })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}
async function extractContent(provider: string, apiKey: string, prompt: string): Promise<string> {
  const cfg = PROVIDERS[provider]
  if (!cfg) throw new Error("Unknown provider")
  switch (cfg.special) {
    case "gemini": return callGemini(apiKey, prompt)
    case "openrouter": return callOpenRouter(apiKey, prompt)
    default: return callOpenAICompatible(cfg.url, apiKey, cfg.model, prompt)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const year = parseInt(String(body.year || new Date().getFullYear()))
    if (!year || year < 2000 || year > 2100) return NextResponse.json({ error: "Invalid year" }, { status: 400 })

    // Resolve provider from DB (AI Settings) or body
    let provider = body.provider || "openai"
    if (!PROVIDERS[provider]) provider = "openai"
    // Try to get saved provider
    try {
      const provRes = await query("SELECT value FROM system_settings WHERE key='ai_provider'")
      if (provRes.rows[0]?.value && PROVIDERS[provRes.rows[0].value]) provider = provRes.rows[0].value
    } catch {}
    if (body.provider && PROVIDERS[body.provider]) provider = body.provider

    let apiKey = body.apiKey
    if (!apiKey) {
      const dbRes = await query("SELECT value FROM system_settings WHERE key=$1", [PROVIDERS[provider].keyDb])
      apiKey = dbRes.rows[0]?.value || ""
    }
    const needsKey = PROVIDERS[provider].needsKey
    if (!apiKey && needsKey) {
      // No key configured — return static fallback so UI still works, but indicate AI not configured
      return NextResponse.json({ holidays: [], note: `AI provider ${provider} has no API key in AI Settings` }, { status: 200 })
    }
    if (apiKey && !needsKey) apiKey = ""

    const prompt = `List all official public and gazetted holidays for India for the year ${year}. Include national holidays (Republic Day, Independence Day, Gandhi Jayanti), major religious festivals (Holi, Diwali, Dussehra, Eid, Christmas), and widely observed state holidays.
Return ONLY a valid JSON array (no markdown, no explanation). Each element must be {"date":"${year}-MM-DD","localName":"Holiday Name","name":"Holiday Name"}.
Sort by date ascending. Use ISO date "${year}-MM-DD". Include 15-20 holidays.`

    const content = await extractContent(provider, apiKey || "", prompt)
    if (!content) return NextResponse.json({ error: "Empty AI response" }, { status: 502 })
    const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
    let holidays: any[]
    try {
      holidays = JSON.parse(cleaned)
      if (!Array.isArray(holidays)) throw new Error("Not array")
    } catch {
      // try to extract array substring
      const m = cleaned.match(/\[[\s\S]*\]/)
      if (!m) return NextResponse.json({ error: "Failed to parse AI JSON", raw: content.slice(0, 800) }, { status: 502 })
      holidays = JSON.parse(m[0])
    }
    // normalize
    holidays = holidays.map((h: any) => ({ date: String(h.date || "").slice(0, 10), localName: String(h.localName || h.name || "").trim(), name: String(h.name || h.localName || "").trim() })).filter((h: any) => /^\d{4}-\d{2}-\d{2}$/.test(h.date) && h.localName)
    return NextResponse.json({ holidays, provider })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 400 })
  }
}
