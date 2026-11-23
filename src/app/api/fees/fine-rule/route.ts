import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

/**
 * Fine rules for the Fees Master.
 *
 * Any number of rules can be kept per school; exactly one can be marked active.
 * Saving with an active rule applies it to every fees_masters row (all classes).
 * Rules are stored as JSON in school_settings under `fees.fineRules`.
 */
const SETTING_KEY = "fees.fineRules"

type FineRow = { overdueDays?: number; fineAmount?: number }
type FineRule = {
  id: string
  name: string
  fineType: "Percentage" | "Fix Amount" | "Cumulative"
  fineValue?: number | null
  perDay?: boolean
  fineRows?: FineRow[]
  dueDay?: number | null
  // YYYY-MM-DD when this rule became active. Fines accrue only from this date.
  activatedAt?: string | null
}

type FineRulesConfig = { rules: FineRule[]; activeId: string | null }

function parseConfig(raw: string | null | undefined): FineRulesConfig {
  if (!raw) return { rules: [], activeId: null }
  try {
    const parsed = JSON.parse(raw)
    const rules = Array.isArray(parsed?.rules) ? parsed.rules : []
    return { rules, activeId: typeof parsed?.activeId === "string" ? parsed.activeId : null }
  } catch {
    return { rules: [], activeId: null }
  }
}

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v))
const dateOnly = (v: unknown) => {
  const s = str(v).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}
const todayStr = () => new Date().toISOString().slice(0, 10)

export async function GET(req: NextRequest) {
  const schoolId = getSessionSchoolId(req)
  if (!schoolId) return NextResponse.json({ rules: [], activeId: null })
  try {
    const res = await query(`SELECT value FROM school_settings WHERE school_id = $1 AND key = $2`, [
      schoolId,
      SETTING_KEY,
    ])
    return NextResponse.json(parseConfig(res.rows[0]?.value))
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  const schoolId = getSessionSchoolId(req)
  if (!schoolId) return NextResponse.json({ error: "No school context" }, { status: 400 })
  try {
    const body = await req.json()
    const incoming = Array.isArray(body?.rules) ? body.rules : []

    // Previous config, so an already-active rule keeps its original activation
    // date (and a freshly activated one starts accruing from today).
    const existingRes = await query(
      `SELECT value, updated_at FROM school_settings WHERE school_id = $1 AND key = $2`,
      [schoolId, SETTING_KEY]
    )
    const existingRaw = existingRes.rows[0]?.value
    const existing = parseConfig(existingRaw)
    const prevActive = existing.activeId ? existing.rules.find((r) => r.id === existing.activeId) : null
    const prevActiveSince =
      dateOnly(prevActive?.activatedAt) ||
      dateOnly(existingRes.rows[0]?.updated_at instanceof Date
        ? (existingRes.rows[0].updated_at as Date).toISOString()
        : existingRes.rows[0]?.updated_at) ||
      todayStr()

    const rules: FineRule[] = incoming
      .map((r: any, i: number) => {
        const fineType = ["Percentage", "Fix Amount", "Cumulative"].includes(r?.fineType) ? r.fineType : "Percentage"
        const dueDayNum = Number(r?.dueDay)
        return {
          id: str(r?.id) || `rule-${Date.now()}-${i}`,
          name: str(r?.name).trim() || `Fine Rule ${i + 1}`,
          fineType,
          fineValue: fineType === "Cumulative" ? null : Number(r?.fineValue) || 0,
          perDay: fineType === "Cumulative" ? Boolean(r?.perDay) : false,
          fineRows:
            fineType === "Cumulative" && Array.isArray(r?.fineRows)
              ? r.fineRows.map((row: any) => ({
                  overdueDays: Math.max(0, Number(row?.overdueDays) || 0),
                  fineAmount: Math.max(0, Number(row?.fineAmount) || 0),
                }))
              : [],
          dueDay: dueDayNum >= 1 && dueDayNum <= 28 ? dueDayNum : null,
          activatedAt: dateOnly(r?.activatedAt),
        }
      })
      .filter((r: FineRule) => r.id)

    let activeId = typeof body?.activeId === "string" && body.activeId ? body.activeId : null
    let active = activeId ? rules.find((r) => r.id === activeId) : null
    if (!active) activeId = null

    if (active) {
      // The admin-selected activation date always wins. Otherwise keep the
      // existing date (same rule) or default to today for a newly active rule.
      active.activatedAt =
        dateOnly(active.activatedAt) ||
        (existing.activeId === active.id ? dateOnly(prevActive?.activatedAt) || prevActiveSince : todayStr())
    } else {
      // No rule active → nothing should accrue. Drop any prior activation date.
      for (const r of rules) r.activatedAt = null
    }

    const config: FineRulesConfig = { rules, activeId }

    await query(
      `INSERT INTO school_settings (school_id, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (school_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [schoolId, SETTING_KEY, JSON.stringify(config)]
    )

    let applied = 0
    if (active) {
      const res = await query(
        `UPDATE fees_masters
            SET fine_type = $1,
                fine_value = $2,
                per_day = $3,
                fine_rows = $4,
                due_day = COALESCE($5, due_day)
          WHERE school_id = $6`,
        [
          active.fineType,
          active.fineType === "Cumulative" ? null : active.fineValue ?? 0,
          active.fineType === "Cumulative" ? Boolean(active.perDay) : false,
          active.fineType === "Cumulative" ? JSON.stringify(active.fineRows || []) : null,
          active.dueDay ?? null,
          schoolId,
        ]
      )
      applied = res.rowCount ?? 0
    }

    return NextResponse.json({ success: true, rules, activeId, applied })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
