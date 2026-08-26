import { NextRequest, NextResponse } from "next/server"
import { query, getById, create, update, remove } from "@/lib/db"
import { camelToSnake, mapResponse } from "@/lib/field-mapping"

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

const TABLE = "questions"
const JOIN_SELECT = `
  SELECT q.*,
    c.name AS class_name,
    s.name AS section_name,
    sub.name || ' (' || sub.code || ')' AS subject_display,
    st.name AS created_by_name
  FROM questions q
  LEFT JOIN classes c ON c.id = q.class_id
  LEFT JOIN sections s ON s.id = q.section_id
  LEFT JOIN subjects sub ON sub.name = q.subject
  LEFT JOIN staff st ON st.id = q.created_by
`

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (id) {
      const item = (await query(`${JOIN_SELECT} WHERE q.id = $1`, [parseInt(id)])).rows[0]
      return NextResponse.json(item ? mapResponse(item) : { error: "Not found" }, { status: item ? 200 : 404 })
    }

    const conditions: string[] = []
    const params: (string | number)[] = []

    const classId = searchParams.get("class_id")
    if (classId) { conditions.push(`q.class_id = $${params.length + 1}::int`); params.push(parseInt(classId)) }

    const sectionId = searchParams.get("section_id")
    if (sectionId) { conditions.push(`q.section_id = $${params.length + 1}::int`); params.push(parseInt(sectionId)) }

    const subject = searchParams.get("subject")
    if (subject) { conditions.push(`q.subject = $${params.length + 1}`); params.push(subject) }

    const questionType = searchParams.get("question_type")
    if (questionType) { conditions.push(`q.question_type = $${params.length + 1}`); params.push(questionType) }

    const questionLevel = searchParams.get("question_level")
    if (questionLevel) { conditions.push(`q.question_level = $${params.length + 1}`); params.push(questionLevel) }

    const createdBy = searchParams.get("created_by")
    if (createdBy) { conditions.push(`q.created_by = $${params.length + 1}::int`); params.push(parseInt(createdBy)) }

    const search = searchParams.get("search")
    if (search) { conditions.push(`q.question ILIKE $${params.length + 1}`); params.push(`%${search}%`) }

    const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""
    const items = (await query(`${JOIN_SELECT} ${where} ORDER BY q.id DESC`, params)).rows
    return NextResponse.json(mapResponse(items))
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (Array.isArray(body)) {
      const results = []
      for (const item of body) {
        const data = camelToSnake(item)
        const created = await create(TABLE, data)
        results.push(mapResponse(created))
      }
      return NextResponse.json(results, { status: 201 })
    }
    const data = camelToSnake(body)
    const item = await create(TABLE, data)
    return NextResponse.json(mapResponse(item), { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const data = camelToSnake(rest)
    const item = await update(TABLE, id, data)
    return NextResponse.json(item ? mapResponse(item) : { error: "Not found" }, { status: item ? 200 : 404 })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (body?.ids) {
      const ids = body.ids as number[]
      for (const id of ids) {
        await remove(TABLE, id)
      }
      return NextResponse.json({ success: true })
    }
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    await remove(TABLE, id)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 400 })
  }
}
