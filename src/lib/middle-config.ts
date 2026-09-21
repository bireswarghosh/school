export type MiddleHeader = {
  schoolName: string
  tagline: string
  estd: string
  board: string
  title: string
  subtitle: string
}

export type MiddleSubject = {
  id: string
  label: string
}

export type MiddlePersonality = { id: string; label: string }
export type MiddleCo = { id: string; label: string }
export type MiddleReg = { id: string; label: string }
export type MiddleGrade = { grade: string; marks: string; param: string }

export type MiddleSchoolConfig = {
  header: MiddleHeader
  subjects: MiddleSubject[]
  personality: MiddlePersonality[]
  coCurricular: MiddleCo[]
  regularity: MiddleReg[]
  grades: MiddleGrade[]
}

export const DEFAULT_MIDDLE_CONFIG: MiddleSchoolConfig = {
  header: {
    schoolName: "St. Jonas Convent School",
    tagline: "The Future begins here",
    estd: "Estd 2020",
    board: "I.C.S.E (New Delhi) | Co-Ed. English Medium School",
    title: "REPORT CARD",
    subtitle: "Class - VI to VIII",
  },
  subjects: [
    { id: "eng_lang", label: "English\n(i) Language" },
    { id: "eng_lit", label: "(ii) Literature" },
    { id: "lang2", label: "2nd Language\n(Hindi/Bengali)" },
    { id: "lang3", label: "3rd Language\n(Hindi/Bengali)" },
    { id: "maths", label: "Mathematics" },
    { id: "phy", label: "Science\n(i) Physics" },
    { id: "chem", label: "(ii) Chemistry" },
    { id: "bio", label: "(iii) Biology" },
    { id: "hist", label: "Social Studies & Civics\n(i) History" },
    { id: "geo", label: "(ii) Geography" },
    { id: "comp", label: "Computer" },
  ],
  personality: [
    { id: "courteous", label: "Courteousness" },
    { id: "confidence", label: "Confidence" },
    { id: "care", label: "Care of belongings" },
    { id: "neatness", label: "Neatness" },
    { id: "regularity", label: "Regularity and Punctuality" },
  ],
  coCurricular: [
    { id: "sports", label: "• Sports" },
    { id: "yoga", label: "• Yoga" },
    { id: "martial", label: "• Martial Arts" },
    { id: "music", label: "• Music" },
    { id: "dance", label: "• Dance" },
  ],
  regularity: [
    { id: "working", label: "Working Days" },
    { id: "present", label: "Days Present" },
    { id: "attendance", label: "Attendance Percentage" },
  ],
  grades: [
    { grade: "A+", marks: "91%-100%", param: "Excellent" },
    { grade: "A", marks: "81%-90%", param: "Very Good" },
    { grade: "B+", marks: "71%-80%", param: "Good" },
    { grade: "B", marks: "61%-70%", param: "Satisfactory" },
  ],
}

export function uid() {
  return Math.random().toString(36).slice(2, 7)
}

export function extractMiddleConfig(tpl: any): MiddleSchoolConfig | null {
  if (!tpl) return null
  let pages: any = tpl.pages
  if (typeof pages === "string") {
    try { pages = JSON.parse(pages) } catch { pages = [] }
  }
  if (!Array.isArray(pages)) pages = []
  const entry = pages.find((p: any) => p?.config && p?.id === "middle-config")
  if (entry?.config && entry.config.subjects) return entry.config as MiddleSchoolConfig
  if (pages[0]?.subjects && pages[0]?.header) return pages[0] as MiddleSchoolConfig
  if (tpl.config && tpl.config.subjects) return tpl.config as MiddleSchoolConfig
  return null
}

export function ensureMiddleData(config: MiddleSchoolConfig, existing: Record<string, string>): Record<string, string> {
  const out = { ...existing }
  const ensure = (k: string, def = "") => { if (out[k] === undefined) out[k] = def }
  for (const s of config.subjects) {
    ensure(`${s.id}_ut1`, "")
    ensure(`${s.id}_mid1`, "")
    ensure(`${s.id}_total1`, "")
    ensure(`${s.id}_ut2`, "")
    ensure(`${s.id}_mid2`, "")
    ensure(`${s.id}_total2`, "")
    ensure(`${s.id}_total200`, "")
    ensure(`${s.id}_overall`, "")
  }
  for (const p of config.personality) {
    ensure(`${p.id}_t1`, "A+")
    ensure(`${p.id}_t2`, "A+")
  }
  for (const c of config.coCurricular) {
    ensure(`${c.id}_t1`, "A")
    ensure(`${c.id}_t2`, "A")
  }
  for (const r of config.regularity) {
    ensure(`${r.id}_t1`, "")
    ensure(`${r.id}_t2`, "")
  }
  return out
}
