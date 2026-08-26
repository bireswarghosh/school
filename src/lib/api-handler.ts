import { NextRequest, NextResponse } from "next/server"
import { getAll, getById, create, update, remove } from "@/lib/db"
import { getSessionSchoolId } from "@/lib/auth"

type ColumnDef = { name: string; type: string }

export function createApi(table: string, options?: {
  orderBy?: string
  searchFields?: string[]
  columns?: ColumnDef[]
  beforeCreate?: (body: any) => any
  afterCreate?: (item: any) => any
}) {
  const { orderBy = "id DESC", searchFields = [] } = options || {}

  return {
    async GET(req: NextRequest) {
      const { searchParams } = new URL(req.url)
      const schoolId = getSessionSchoolId(req)
      const id = searchParams.get("id")
      if (id) {
        const item = await getById(table, parseInt(id), schoolId)
        return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
      }

      const search = searchParams.get("search")
      if (search && searchFields.length > 0) {
        const conditions = searchFields.map((f, i) => `${f}::text ILIKE $${i + 1}`)
        const params = searchFields.map(() => `%${search}%`)
        const items = await getAll(table, orderBy, conditions.join(" OR "), params, schoolId)
        return NextResponse.json(items)
      }

      const items = await getAll(table, orderBy, undefined, undefined, schoolId)
      return NextResponse.json(items)
    },

    async POST(req: NextRequest) {
      const schoolId = getSessionSchoolId(req)
      const body = await req.json()
      const data = options?.beforeCreate ? options.beforeCreate(body) : body
      try {
        const item = await create(table, data, schoolId)
        const result = options?.afterCreate ? options.afterCreate(item) : item
        return NextResponse.json(result, { status: 201 })
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
    },

    async PUT(req: NextRequest) {
      const schoolId = getSessionSchoolId(req)
      const body = await req.json()
      const { id, ...data } = body
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
      try {
        const item = await update(table, id, data, schoolId)
        return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 })
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
    },

    async DELETE(req: NextRequest) {
      const schoolId = getSessionSchoolId(req)
      const { searchParams } = new URL(req.url)
      const id = parseInt(searchParams.get("id") || "0")
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
      const ok = await remove(table, id, schoolId)
      return NextResponse.json({ success: ok }, { status: ok ? 200 : 404 })
    },
  }
}
