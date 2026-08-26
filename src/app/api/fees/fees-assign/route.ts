import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function toInt(value: any): number | undefined {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function parseIds(value: any): number[] {
  if (Array.isArray(value)) {
    return value.map((v) => parseInt(v, 10)).filter((n) => Number.isFinite(n) && n > 0)
  }
  return String(value || "")
    .split(",")
    .map((v) => parseInt(v.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
}

async function getMasters(ids: number[]) {
  if (ids.length === 0) return []
  const result = await query(
    `SELECT m.id, m.fees_group_id, m.fees_type_id, m.amount, m.class_id,
       m.due_date::text AS "dueDate",
       fg.name AS "feesGroup", ft.name AS "feesType", c.name AS "className"
     FROM fees_masters m
     LEFT JOIN fees_groups fg ON fg.id = m.fees_group_id
     LEFT JOIN fees_types ft ON ft.id = m.fees_type_id
     LEFT JOIN classes c ON c.id = m.class_id
     WHERE m.id = ANY($1::int[])
     ORDER BY m.id`,
    [ids as any]
  )
  return result.rows as Record<string, any>[]
}

function buildStudentQuery(params: {
  classId?: number
  sectionId?: number
  category?: string
  studentIds?: number[]
}) {
  const conditions: string[] = ["s.status = 'Active'"]
  const args: any[] = []
  if (params.studentIds && params.studentIds.length > 0) {
    conditions.push(`s.id = ANY($${args.length + 1}::int[])`)
    args.push(params.studentIds)
  } else {
    if (params.classId) {
      conditions.push(`s.class_id = $${args.length + 1}`)
      args.push(params.classId)
    }
    if (params.sectionId) {
      conditions.push(`s.section_id = $${args.length + 1}`)
      args.push(params.sectionId)
    }
    if (params.category) {
      conditions.push(`s.category = $${args.length + 1}`)
      args.push(params.category)
    }
  }
  const sql = `
    SELECT s.id, s.admission_no AS "admissionNo", s.name, s.class_id, s.section_id,
      s.roll_no AS "rollNo", s.category,
      c.name AS "className", sec.name AS "sectionName"
    FROM students s
    JOIN classes c ON c.id = s.class_id
    JOIN sections sec ON sec.id = s.section_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY s.name
  `
  return { sql, args }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const masterIds = parseIds(searchParams.get("masterIds") || searchParams.get("masterId"))
    const classId = toInt(searchParams.get("class_id"))
    const sectionId = toInt(searchParams.get("section_id"))
    const category = searchParams.get("category")?.trim() || undefined

    const masters = await getMasters(masterIds)
    let students: Record<string, any>[] = []
    if (classId || sectionId || category) {
      const { sql, args } = buildStudentQuery({ classId, sectionId, category })
      const result = await query(sql, args)
      students = result.rows as Record<string, any>[]
    }

    return NextResponse.json({ masters, students })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const masterIds = parseIds(body.masterIds || body.masterId)
    if (masterIds.length === 0) {
      return NextResponse.json({ error: "masterIds required" }, { status: 400 })
    }

    const masters = await getMasters(masterIds)
    const valid = masters.filter((m) => m.fees_group_id && m.fees_type_id)
    if (valid.length === 0) {
      return NextResponse.json({ error: "Fees master records not found" }, { status: 404 })
    }

    const studentIds = Array.isArray(body.studentIds)
      ? body.studentIds.map((v: any) => parseInt(v, 10)).filter((n: number) => Number.isFinite(n) && n > 0)
      : undefined

    const { sql, args } = buildStudentQuery({
      classId: toInt(body.classId),
      sectionId: toInt(body.sectionId),
      category: body.category?.trim() || undefined,
      studentIds,
    })
    const studentsResult = await query(sql, args)
    const students = studentsResult.rows as { id: number; class_id: number }[]
    if (students.length === 0) {
      return NextResponse.json({ error: "No students match the selected criteria" }, { status: 400 })
    }

    const perMaster: { id: number; feesGroup: string; feesType: string; amount: string; assigned: number; skipped: number }[] = []
    let totalAssigned = 0
    let totalSkipped = 0

    for (const m of valid) {
      const existingResult = await query(
        `SELECT student_id FROM fees_payments WHERE fees_type_id = $1 AND student_id = ANY($2::int[])`,
        [m.fees_type_id, students.map((s) => s.id)]
      )
      const existing = new Set((existingResult.rows as { student_id: number }[]).map((r) => Number(r.student_id)))
      const toInsert = students.filter((s) => !existing.has(s.id))
      let assigned = 0
      if (toInsert.length > 0) {
        const tuples = toInsert
          .map(
            (_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
          )
          .join(", ")
        const values: (string | number)[] = []
        for (const s of toInsert) {
          values.push(s.id, s.class_id ?? m.class_id, m.fees_group_id, m.fees_type_id, m.amount, "Unpaid")
        }
        await query(
          `INSERT INTO fees_payments
             (student_id, class_id, fees_group_id, fees_type_id, amount, status)
           VALUES ${tuples}`,
          values
        )
        assigned = toInsert.length
      }
      const skipped = students.length - assigned
      totalAssigned += assigned
      totalSkipped += skipped
      perMaster.push({
        id: m.id,
        feesGroup: m.feesGroup,
        feesType: m.feesType,
        amount: String(m.amount),
        assigned,
        skipped,
      })
    }

    return NextResponse.json({
      total: students.length,
      assigned: totalAssigned,
      skipped: totalSkipped,
      feesCount: valid.length,
      masters: perMaster,
    })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
