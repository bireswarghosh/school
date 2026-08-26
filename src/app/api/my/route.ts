import { NextRequest } from "next/server"
import { handle, getMyContext } from "@/lib/my-api"

const LINKS: Record<string, string[]> = {
  student: ["/api/my/dashboard", "/api/my/student/profile", "/api/my/student/details", "/api/my/student/homework", "/api/my/student/timetable", "/api/my/student/exams", "/api/my/student/attendance", "/api/my/student/fees", "/api/my/student/notices", "/api/my/student/library", "/api/my/exams", "/api/my/leave"],
  parent: ["/api/my/dashboard", "/api/my/parent/kids", "/api/my/parent/kids/details", "/api/my/parent/kids/attendance", "/api/my/parent/kids/fees", "/api/my/parent/kids/homework", "/api/my/parent/kids/exams", "/api/my/parent/kids/timetable", "/api/my/parent/kids/library", "/api/my/student/notices", "/api/my/exams", "/api/my/leave"],
  teacher: ["/api/my/dashboard", "/api/my/teacher", "/api/my/teacher/classes", "/api/my/teacher/students", "/api/my/teacher/attendance", "/api/my/teacher/homework", "/api/my/teacher/homework/create", "/api/my/teacher/marks", "/api/my/teacher/timetable", "/api/my/student/notices", "/api/my/exams", "/api/my/leave"],
  admin: ["/api/my/dashboard", "/api/my/teacher/classes", "/api/my/teacher/students", "/api/my/teacher/attendance", "/api/my/teacher/homework", "/api/my/teacher/marks", "/api/my/teacher/timetable"],
}

export const GET = handle(async (req: NextRequest, ctx) => {
  const links = LINKS[ctx.role] || []
  return {
    authenticated: true,
    userId: ctx.userId,
    schoolId: ctx.schoolId,
    role: ctx.role,
    links,
  }
})
