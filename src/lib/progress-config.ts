export type ProgressHeader = {
  schoolName: string
  board: string
  address: string
  title: string
}

export type ProgressSubject = {
  id: string
  label: string
  hasSplit: boolean
}

export type ProgressOther = {
  id: string
  label: string
}

export type ProgressTemplateConfig = {
  header: ProgressHeader
  yearLabel: string
  subjects: ProgressSubject[]
  otherSubjects: ProgressOther[]
  principalLabel: string
}

export const DEFAULT_PROGRESS_CONFIG: ProgressTemplateConfig = {
  header: {
    schoolName: "ST. JONAS CONVENT SCHOOL",
    board: "I.C.S.E (New Delhi)",
    address: "Udang, Amta, Howrah - 711401",
    title: "PROGRESS REPORT",
  },
  yearLabel: "ANNUAL",
  subjects: [
    { id: "en", label: "a) ENGLISH", hasSplit: true },
    { id: "lang2", label: "b) 2nd LANGUAGE", hasSplit: false },
    { id: "lang3", label: "c) 3rd LANGUAGE", hasSplit: false },
    { id: "maths", label: "d) MATHEMATICS", hasSplit: false },
    { id: "evs", label: "e) ENVIRONMENTAL SCIENCE", hasSplit: false },
    { id: "sst", label: "f) SOCIAL STUDIES", hasSplit: false },
    { id: "comp", label: "g) COMPUTER", hasSplit: false },
  ],
  otherSubjects: [
    { id: "life_skill", label: "a) LIFE SKILL" },
    { id: "gk", label: "b) GENERAL KNOWLEDGE" },
  ],
  principalLabel: "Principal's Signature",
}

export function uid() {
  return Math.random().toString(36).slice(2, 7)
}

export function extractProgressConfig(tpl: any): ProgressTemplateConfig | null {
  if (!tpl) return null
  let pages: any = tpl.pages
  if (typeof pages === "string") {
    try { pages = JSON.parse(pages) } catch { pages = [] }
  }
  if (!Array.isArray(pages)) pages = []
  const entry = pages.find((p: any) => p?.config && p?.id === "progress-config")
  if (entry?.config && entry.config.subjects) return entry.config as ProgressTemplateConfig
  if (pages[0]?.header && pages[0]?.subjects) return pages[0] as ProgressTemplateConfig
  if (tpl.config && tpl.config.subjects) return tpl.config as ProgressTemplateConfig
  return null
}

export function ensureProgressData(config: ProgressTemplateConfig, existing: Record<string, string>): Record<string, string> {
  const out = { ...existing }
  const ensure = (k: string, def = "") => { if (out[k] === undefined) out[k] = def }
  // student fields handled elsewhere, but ensure subjects
  for (const s of config.subjects) {
    if (s.hasSplit) {
      for (const suf of ["fa2_lit","fa2_lang","proj_lit","proj_lang","ct_lit","ct_lang","sa2_lit","sa2_lang","ct2_lit","ct2_lang","viva_lit","viva_lang"]) ensure(`${s.id}_${suf}`, "")
    } else {
      for (const suf of ["fa2","proj","ct","sa2","ct2","viva"]) ensure(`${s.id}_${suf}`, "")
    }
  }
  for (const o of config.otherSubjects) ensure(o.id, "")
  ensure("principalName", "")
  return out
}
