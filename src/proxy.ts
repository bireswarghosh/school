import { NextResponse, type NextRequest } from "next/server"
import { verifySession, SESSION_COOKIE } from "@/lib/session"

const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/register",
  "/api/exam-public",
  "/api/exam-attempts",
  "/api/students/lookup",
  "/api/online-exam/public-link",
  "/api/online-admission/public",
  "/api/students-inventory/sale/invoice",
]

const PUBLIC_PAGE_PREFIXES = [
  "/_next",
  "/favicon",
  "/images",
  "/fonts",
  "/login",
  "/register",
  "/saas/login",
  "/saas/pay",
  "/exam",
  "/online-admission",
]

function isPublicApi(path: string) {
  return PUBLIC_API_PREFIXES.some((p) => path.startsWith(p))
}

function isPublicPage(path: string) {
  return PUBLIC_PAGE_PREFIXES.some((p) => path.startsWith(p)) || path === "/"
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rawToken = request.cookies.get(SESSION_COOKIE)?.value
  const authHeader = request.headers.get("authorization") || ""
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined
  const token = (rawToken ? decodeURIComponent(rawToken) : undefined) || bearer
  const session = token ? await verifySession(token) : null

  // API routes: require session unless public
  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname)) {
      return NextResponse.next()
    }
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", String(session.uid))
    requestHeaders.set("x-school-id", String(session.sid ?? ""))
    requestHeaders.set("x-role", session.role)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Super admin portal
  if (pathname.startsWith("/saas")) {
    if (pathname === "/saas/login") {
      return session?.role === "super_admin"
        ? NextResponse.redirect(new URL("/saas", request.url))
        : NextResponse.next()
    }
    if (pathname.startsWith("/saas/pay")) {
      // Public checkout — no auth required to view/pay an invoice
      return NextResponse.next()
    }
    if (!session) {
      return NextResponse.redirect(new URL("/saas/login", request.url))
    }
    if (session.role !== "super_admin") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }

  // Self-service portal (students / parents / teachers)
  if (pathname.startsWith("/portal")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    if (session.role === "super_admin") {
      return NextResponse.redirect(new URL("/saas", request.url))
    }
    return NextResponse.next()
  }

  // School admin panel
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    // Students and parents are not allowed in the admin panel
    if (session.role === "student" || session.role === "parent") {
      return NextResponse.redirect(new URL("/portal", request.url))
    }
    return NextResponse.next()
  }

  // Public pages
  if (isPublicPage(pathname)) {
    return NextResponse.next()
  }

  // Everything else requires a session
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/portal/:path*",
    "/saas/:path*",
    "/login",
    "/register",
    "/exam/:path*",
    "/online-admission/:path*",
  ],
}
