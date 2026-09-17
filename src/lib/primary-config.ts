export type HeaderConfig = {
  tagline: string
  estd: string
  schoolName: string
  logo?: string
  title: string
  subtitle: string
}

export type AcademicSubjectConfig = {
  id: string
  label: string
  sub?: string
  hasSplit: boolean
}

export type SimpleItem = { id: string; label: string }

export type GradeRow = { grade: string; min?: number; max?: number; range: string }

export type Assignment = { classId: number; className: string; sectionIds: number[]; sectionNames: string[] }

export type PrimaryTemplateConfig = {
  header: HeaderConfig
  academicSubjects: AcademicSubjectConfig[]
  otherSubjects: SimpleItem[]
  workHabits: SimpleItem[]
  socialPersonal: SimpleItem[]
  regularity: SimpleItem[]
  coCurricular: SimpleItem[]
  gradeScale: GradeRow[]
  assignments?: Assignment[]
}

export const DEFAULT_PRIMARY_CONFIG: PrimaryTemplateConfig = {
  header: {
    tagline: "The Future begins here",
    estd: "Estd 2020",
    schoolName: "St. Jonas Convent School",
    logo: "",
    title: "Report Card",
    subtitle: "Class - I to IV",
  },
  academicSubjects: [
    { id: "en", label: "1. ENGLISH", sub: "LIT\nLANG", hasSplit: true },
    { id: "ben", label: "2. 2nd LANGUAGE", sub: "(Bengali/Hindi)", hasSplit: false },
    { id: "third", label: "3. 3rd LANGUAGE", sub: "(Bengali/Hindi)", hasSplit: false },
    { id: "maths", label: "4. MATHEMATICS", hasSplit: false },
    { id: "evs", label: "5. ENVIRONMENTAL SCIENCE", hasSplit: false },
    { id: "sst", label: "6. SOCIAL STUDIES", hasSplit: false },
    { id: "comp", label: "7. COMPUTER", hasSplit: false },
  ],
  otherSubjects: [
    { id: "life", label: "a) LIFE SKILL" },
    { id: "gk", label: "b) GENERAL KNOWLEDGE" },
  ],
  workHabits: [
    { id: "work_attent", label: "• Attentiveness" },
    { id: "work_eager", label: "• Eagerness to Learn" },
    { id: "work_neat", label: "• Neatness" },
    { id: "work_comp", label: "• Completion of Work" },
    { id: "work_hand", label: "• Handwriting" },
    { id: "work_resp", label: "• Response in Class" },
  ],
  socialPersonal: [
    { id: "social_punct", label: "• Punctuality" },
    { id: "social_resp", label: "• Sense of Responsibility" },
    { id: "social_courtesy", label: "• Courtesy & Politeness" },
    { id: "social_friendly", label: "• Friendly & Cheerful" },
    { id: "social_conf", label: "• Self Confidence" },
    { id: "social_tidy", label: "• Personal Tidiness" },
  ],
  regularity: [
    { id: "attend", label: "• Attendance" },
    { id: "attend_pct", label: "• Attendance Percentage" },
  ],
  coCurricular: [
    { id: "sports", label: "• Sports / Games" },
    { id: "art", label: "• Art & Craft" },
    { id: "dance", label: "• Dance" },
    { id: "music", label: "• Music" },
  ],
  gradeScale: [
    { grade: "A+", range: "91% - 100%", min: 91, max: 100 },
    { grade: "A", range: "81% - 90%", min: 81, max: 90 },
    { grade: "B+", range: "71% - 80%", min: 71, max: 80 },
    { grade: "B", range: "61% - 70%", min: 61, max: 70 },
    { grade: "C+", range: "51% - 60%", min: 51, max: 60 },
    { grade: "C", range: "40% - 50%", min: 40, max: 50 },
    { grade: "D", range: "Below 40%", min: 0, max: 39 },
  ],
}

export function uid() {
  return Math.random().toString(36).slice(2, 7)
}

export function extractConfigFromTemplate(tpl: any): PrimaryTemplateConfig | null {
  if (!tpl) return null
  // pages may be string, array, or object
  let pages: any = tpl.pages
  if (typeof pages === "string") {
    try { pages = JSON.parse(pages) } catch { pages = [] }
  }
  if (!Array.isArray(pages)) pages = []
  // look for our config marker
  const cfgEntry = pages.find((p: any) => p?.config && p?.id === "primary-config")
  if (cfgEntry?.config) return cfgEntry.config as PrimaryTemplateConfig
  // fallback: if pages[0] is config object itself (legacy)
  if (pages[0]?.header && pages[0]?.academicSubjects) return pages[0] as PrimaryTemplateConfig
  // also check if tpl has direct config field (future)
  if (tpl.config) return tpl.config as PrimaryTemplateConfig
  return null
}

export function wrapConfigForSave(config: PrimaryTemplateConfig, gradeScale?: any) {
  const pages = [{ id: "primary-config", label: "Primary Config", config }]
  // grade_scale stored separately, but also keep in config
  return { pages, grade_scale: config.gradeScale }
}

export function ensureDataForConfig(config: PrimaryTemplateConfig, existing: Record<string, string>): Record<string, string> {
  const out = { ...existing }
  const ensure = (k: string, def = "") => { if (out[k] === undefined) out[k] = def }
  // header defaults handled elsewhere
  // academic
  for (const s of config.academicSubjects) {
    if (s.hasSplit) {
      for (const suffix of ["f1_lit","f1_lang","s1_lit","s1_lang","t1_lit","t1_lang","f2_lit","f2_lang","s2_lit","s2_lang","t2_lit","t2_lang","ff_lit","ff_lang","ss_lit","ss_lang","overall_lit","overall_lang"]) {
        ensure(`${s.id}_${suffix}`, "")
      }
    } else {
      for (const suffix of ["f1","s1","t1","f2","s2","t2","ff","ss","overall"]) ensure(`${s.id}_${suffix}`, "")
    }
  }
  // other subjects: 5 keys each
  for (const o of config.otherSubjects) {
    ensure(`${o.id}_half`, "")
    ensure(`${o.id}_half_grade`, "")
    ensure(`${o.id}_annual`, "")
    ensure(`${o.id}_annual_grade`, "")
    ensure(`${o.id}_overall`, "")
  }
  // work, social, co, regularity each 2 keys
  for (const w of config.workHabits) { ensure(`${w.id}_half`, ""); ensure(`${w.id}_annual`, "") }
  for (const w of config.socialPersonal) { ensure(`${w.id}_half`, ""); ensure(`${w.id}_annual`, "") }
  for (const w of config.regularity) { ensure(`${w.id}_half`, ""); ensure(`${w.id}_annual`, "") }
  for (const w of config.coCurricular) { ensure(`${w.id}_half`, ""); ensure(`${w.id}_annual`, "") }
  return out
}
