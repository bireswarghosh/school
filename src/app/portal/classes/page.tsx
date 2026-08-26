"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, CalendarDays, BookOpen } from "lucide-react"

export default function PortalClasses() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/my/teacher/classes")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError("Failed to load classes"))
      .finally(() => setLoading(false))
  }, [])

  const classes = data?.classes || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--title-color)]">My Classes</h2>
        <p className="text-sm text-[var(--subtitle-color)] mt-1">Classes and sections assigned to you</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-sm text-[var(--subtitle-color)]">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((c: any) => (
              <div key={`${c.classId}-${c.sectionId}`} className="glass-panel rounded-xl p-5">
                <h3 className="font-semibold text-[var(--title-color)]">
                  {c.className}-{c.sectionName}
                </h3>
                <p className="text-xs text-[var(--subtitle-color)] mt-0.5">Class Teacher: {c.teacher || data?.name}</p>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  <Link
                    href={`/portal/students?classId=${c.classId}&sectionId=${c.sectionId}`}
                    className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--secondary)] px-3 py-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    View Students
                  </Link>
                  <Link
                    href={`/portal/attendance?classId=${c.classId}&sectionId=${c.sectionId}`}
                    className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--secondary)] px-3 py-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Mark Attendance
                  </Link>
                  <Link
                    href={`/portal/homework?classId=${c.classId}&sectionId=${c.sectionId}`}
                    className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--secondary)] px-3 py-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    Homework
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {data?.subjects?.length > 0 && (
            <div className="glass-panel rounded-xl p-5">
              <h3 className="font-semibold text-[var(--title-color)] mb-3">Subjects You Teach</h3>
              <div className="flex flex-wrap gap-2">
                {data.subjects.map((s: any) => (
                  <span
                    key={s}
                    className="text-sm px-3 py-1.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
