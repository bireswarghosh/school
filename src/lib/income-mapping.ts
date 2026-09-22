export type IncomeHead = { id: number; name: string }

const RULES: { pattern: RegExp; head: string }[] = [
  { pattern: /\btransport\b/i, head: "Transport Fees" },
  { pattern: /\blibrary\b/i, head: "Library Fees" },
  { pattern: /\bexam\b/i, head: "Exam Fees" },
  { pattern: /\btuition|coaching|admission|term\b/i, head: "Tuition Fees" },
  { pattern: /\bregistration\b/i, head: "Registration Form Purchase" },
]

/**
 * Pick an income head id for a fee collection based on the fee group name.
 * Falls back to the "Tuition Fees" head, then the "Miscellaneous" head,
 * then the first available head.
 */
export function incomeHeadForGroup(groupName: string, heads: IncomeHead[]): number | null {
  if (!heads || heads.length === 0) return null
  if (groupName) {
    for (const rule of RULES) {
      if (rule.pattern.test(groupName)) {
        const found = heads.find((h) => h.name.toLowerCase() === rule.head.toLowerCase())
        if (found) return found.id
      }
    }
  }
  const fallbacks = ["Tuition Fees", "Miscellaneous"]
  for (const fb of fallbacks) {
    const found = heads.find((h) => h.name.toLowerCase() === fb.toLowerCase())
    if (found) return found.id
  }
  return heads[0]?.id ?? null
}