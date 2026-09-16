import { NextRequest, NextResponse } from "next/server"
import { query, getAll, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"
import { getSessionSchoolId } from "@/lib/auth"


function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "timetable_entries"
const ORDER = "id DESC"

const fieldMap: Record<string, string> = {
  classId: "class_id",
  sectionId: "section_id",
  teacher: "teacher_name",
  teacherName: "teacher_name",
  subject: "subject_name",
  subjectName: "subject_name",
  startTime: "start_time",
  endTime: "end_time",
}

function toTimeValue(v: any): string | null {
  if (!v) return null
  const s = String(v).trim()
  if (!s) return null
  // accept HH:MM or HH:MM AM/PM
  if (/^\d{1,2}:\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (m) {
    let h = parseInt(m[1], 10)
    const min = m[2]
    const ap = m[3].toUpperCase()
    if (ap === "PM" && h !== 12) h += 12
    if (ap === "AM" && h === 12) h = 0
    return `${String(h).padStart(2, "0")}:${min}`
  }
  return s
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const schoolId = getSessionSchoolId(req)
  const id = searchParams.get("id")
  if (id) {
    const item = await getById(TABLE, parseInt(id), schoolId ?? undefined)
    return NextResponse.json(item ? mapResponse(item as any, fieldMap) : { error: "Not found" }, { status: item ? 200 : 404 })
  }
  const classId = searchParams.get("classId") || searchParams.get("class_id")
  const sectionId = searchParams.get("sectionId") || searchParams.get("section_id")
  // support filtering
  if (classId || sectionId) {
    let where = ""
    const params: any[] = []
    if (classId) { where += `class_id = $${params.length + 1}`; params.push(parseInt(classId)) }
    if (sectionId) {
      const secVal = parseInt(sectionId)
      if (!Number.isNaN(secVal)) {
        where += where ? " AND " : ""
        where += `section_id = $${params.length + 1}`
        params.push(secVal)
      } else {
        // sectionId is name, need lookup - fallback to no filter
      }
    }
    const items = await getAll(TABLE, ORDER, where || undefined, params.length ? params : undefined, schoolId ?? undefined)
    return NextResponse.json(mapResponse(items as any, fieldMap))
  }
  const items = await getAll(TABLE, ORDER, undefined, undefined, schoolId ?? undefined)
  return NextResponse.json(mapResponse(items as any, fieldMap))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const schoolId = getSessionSchoolId(req)
    const snake = camelToSnake(body, fieldMap)
    // normalize times
    if (snake.start_time) snake.start_time = toTimeValue(snake.start_time)
    if (snake.end_time) snake.end_time = toTimeValue(snake.end_time)
    // basic validation
    if (!snake.day) return NextResponse.json({ error: "Day is required" }, { status: 400 })
    if (!snake.subject_name) return NextResponse.json({ error: "Subject is required" }, { status: 400 })
    if (!snake.teacher_name) return NextResponse.json({ error: "Teacher is required" }, { status: 400 })
    if (!snake.start_time) return NextResponse.json({ error: "Start Time is required" }, { status: 400 })
    if (!snake.end_time) return NextResponse.json({ error: "End Time is required" }, { status: 400 })
    // ensure period is integer
    if (snake.period !== undefined) snake.period = parseInt(String(snake.period), 10)
    const item = await create(TABLE, snake as any, schoolId ?? undefined)
    return NextResponse.json(mapResponse(item as any, fieldMap), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const schoolId = getSessionSchoolId(req)
    const snake = camelToSnake(rest, fieldMap)
    if (snake.start_time) snake.start_time = toTimeValue(snake.start_time)
    if (snake.end_time) snake.end_time = toTimeValue(snake.end_time)
    if (snake.period !== undefined) snake.period = parseInt(String(snake.period), 10)
    const item = await update(TABLE, id, snake as any, schoolId ?? undefined)
    return NextResponse.json(item ? mapResponse(item as any, fieldMap) : { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e: any) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") || "0")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const schoolId = getSessionSchoolId(req)
  await remove(TABLE, id, schoolId ?? undefined)
  return NextResponse.json({ success: true })
}
