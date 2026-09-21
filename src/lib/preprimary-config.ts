export type PreHeader = {
  schoolName: string
  tagline: string
  estd: string
  title: string
  subtitle: string
}

export type PreSubjectGroup = {
  id: string
  title: string
  items: { id: string; label: string }[]
}

export type PreRightGroup = {
  id: string
  title: string
  items: { id: string; label: string }[]
}

export type PreGradeRow = { grade: string; marks: string; remarks: string }

export type PrePrimaryConfig = {
  header: PreHeader
  leftGroups: PreSubjectGroup[]
  rightGroups: PreRightGroup[]
  gradeRows: PreGradeRow[]
}

export const DEFAULT_PREPRIMARY_CONFIG: PrePrimaryConfig = {
  header: {
    schoolName: "St. Jonas Convent School",
    tagline: "The Future begins here",
    estd: "Estd 2020",
    title: "Report Card",
    subtitle: "Montessori to K.G.",
  },
  leftGroups: [
    {
      id: "eng",
      title: "Subject: a) ENGLISH",
      items: [
        { id: "eng_phonic", label: "• Identification of Phonic Sounds" },
        { id: "eng_alpha", label: "• Recognition of Alphabets +\n  Identification of Objects Around" },
        { id: "eng_topic", label: "• Understanding of the Topic" },
        { id: "eng_conv", label: "• Conversational Ability" },
        { id: "eng_strokes", label: "• Basic Strokes / Letters" },
        { id: "eng_write", label: "• Writing Ability + Written Work" },
        { id: "eng_pic", label: "• Picture Reading Ability" },
        { id: "eng_spell", label: "• Spelling Ability" },
      ],
    },
    {
      id: "maths",
      title: "Subject: b) MATHEMATICS",
      items: [
        { id: "maths_num", label: "• Identification of Numbers" },
        { id: "maths_classify", label: "• Classifies Objects with Respect to\n  Numbers" },
        { id: "maths_verbal", label: "• Verbal Counting" },
        { id: "maths_write", label: "• Writing Ability + Written Work" },
        { id: "maths_concept", label: "• Understanding of the Concept" },
      ],
    },
    {
      id: "lang2",
      title: "Subject: c) 2nd LANGUAGE\n              (Bengali / Hindi)",
      items: [
        { id: "lang2_letters", label: "• Identification of Letters" },
        { id: "lang2_topic", label: "• Understanding of the Topic" },
        { id: "lang2_write", label: "• Writing Ability + Written Work" },
      ],
    },
    {
      id: "otherLeft",
      title: "",
      items: [
        { id: "env", label: "c) ENVIRONMENTAL STUDY" },
        { id: "rhymes", label: "d) RHYMES" },
        { id: "art", label: "e) ART & CRAFT WORK" },
      ],
    },
  ],
  rightGroups: [
    {
      id: "work",
      title: "WORK HABITS",
      items: [
        { id: "work_attent", label: "• Attentiveness" },
        { id: "work_eager", label: "• Eagerness to Learn" },
        { id: "work_neat", label: "• Neatness" },
        { id: "work_comp", label: "• Completion of Work" },
      ],
    },
    {
      id: "sensorial",
      title: "SENSORIAL",
      items: [
        { id: "sens_colour", label: "• Recognition of Colours" },
        { id: "sens_shapes", label: "• Recognition of Basic Shapes" },
        { id: "sens_sizes", label: "• Concept of Sizes" },
        { id: "sens_weight", label: "• Determination of Weight of an Object" },
      ],
    },
    {
      id: "social",
      title: "SOCIAL & PERSONAL DEVELOPMENT",
      items: [
        { id: "soc_punct", label: "• Punctuality" },
        { id: "soc_resp", label: "• Sense of Responsibility" },
        { id: "soc_courtesy", label: "• Courtesy & Politeness" },
        { id: "soc_friendly", label: "• Friendly & Cheerful" },
        { id: "soc_response", label: "• Response in Class" },
        { id: "soc_tidy", label: "• Personal Tidiness" },
      ],
    },
    {
      id: "regularity",
      title: "REGULARITY RECORD",
      items: [
        { id: "reg_att", label: "• Attendance" },
        { id: "reg_pct", label: "• Attendance Percentage" },
      ],
    },
  ],
  gradeRows: [
    { grade: "A+", marks: "91% - 100%", remarks: "Excellent" },
    { grade: "A", marks: "81% - 90%", remarks: "Very Good" },
    { grade: "B+", marks: "71% - 80%", remarks: "Good" },
    { grade: "B", marks: "61% - 70%", remarks: "Satisfactory" },
    { grade: "C+", marks: "51% - 60%", remarks: "Average" },
    { grade: "C", marks: "40% - 50%", remarks: "Needs Improvement" },
    { grade: "D", marks: "Below 40%", remarks: "Below Average" },
  ],
}

export function uid() {
  return Math.random().toString(36).slice(2, 7)
}

export function extractPrePrimaryConfig(tpl: any): PrePrimaryConfig | null {
  if (!tpl) return null
  let pages: any = tpl.pages
  if (typeof pages === "string") {
    try { pages = JSON.parse(pages) } catch { pages = [] }
  }
  if (!Array.isArray(pages)) pages = []
  const entry = pages.find((p: any) => p?.config && p?.id === "preprimary-config")
  if (entry?.config && entry.config.leftGroups) return entry.config as PrePrimaryConfig
  if (pages[0]?.leftGroups) return pages[0] as PrePrimaryConfig
  if (tpl.config && tpl.config.leftGroups) return tpl.config as PrePrimaryConfig
  return null
}

export function ensurePrePrimaryData(config: PrePrimaryConfig, existing: Record<string, string>): Record<string, string> {
  const out = { ...existing }
  const ensure = (k: string, def = "") => { if (out[k] === undefined) out[k] = def }
  // left groups
  for (const g of config.leftGroups) {
    for (const it of g.items) {
      ensure(`${it.id}_half`, "A+")
      ensure(`${it.id}_annual`, "A+")
    }
  }
  for (const g of config.rightGroups) {
    for (const it of g.items) {
      ensure(`${it.id}_half`, "A")
      ensure(`${it.id}_annual`, "A")
    }
  }
  // ensure some defaults for overall etc. are handled by component defaults
  return out
}
