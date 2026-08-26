"use client"

import { useMemo } from "react"
import { useApi } from "@/lib/use-api"

export type ClassItem = { id: number; name: string }
export type SectionItem = { id: number; name: string; class_id?: number | null }

const ROMAN: Record<string, number> = { x: 10, ix: 9, viii: 8, vii: 7, vi: 6, v: 5, iv: 4, iii: 3, ii: 2, i: 1 }
const KNOWN_GRADES: [string, number][] = [
  ["u.k.g", 0.55], ["ukg", 0.55], ["k.g", 0.5], ["kg", 0.5], ["kindergarten", 0.5],
  ["l.k.g", 0.45], ["lkg", 0.45], ["nursery", 0.4], ["pre-nursery", 0.35],
  ["montessori", 0.3], ["play group", 0.25], ["playgroup", 0.25],
]

function classRank(name: string): number {
  const s = name.toLowerCase().trim()
  const m = s.match(/\b(x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/)
  if (m && ROMAN[m[1]]) return ROMAN[m[1]]
  const n = s.match(/(\d+)/)
  if (n) return parseInt(n[0], 10)
  for (const [k, v] of KNOWN_GRADES) if (s.includes(k)) return v
  return 0
}

export function useClassesAndSections() {
  const { data: classes, loading: classesLoading, error: classesError, refetch: refetchClasses } = useApi<ClassItem>("/api/academics/class")
  const { data: sections, loading: sectionsLoading, error: sectionsError, refetch: refetchSections } = useApi<SectionItem>("/api/academics/section")

  const sortedClasses = useMemo(() =>
    [...classes].sort((a, b) => classRank(a.name) - classRank(b.name) || a.id - b.id),
    [classes]
  )

  const sectionsOf = (classId?: number | null) =>
    sections.filter((s) => s.class_id === classId).sort((a, b) => a.name.localeCompare(b.name))

  const sectionNames = useMemo(() => {
    const seen = new Set<string>()
    const names: string[] = []
    for (const s of sections) {
      const n = s.name.trim()
      if (!n) continue
      const key = n.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      names.push(n)
    }
    return names.sort((a, b) => a.localeCompare(b))
  }, [sections])

  return {
    classes: sortedClasses,
    sections,
    classNames: sortedClasses.map((c) => c.name),
    sectionNames,
    sectionsOf,
    loading: classesLoading || sectionsLoading,
    error: classesError || sectionsError,
    refetch: () => Promise.all([refetchClasses(), refetchSections()]),
  }
}
