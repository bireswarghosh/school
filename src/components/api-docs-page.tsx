"use client"

import { useState, useMemo, useSyncExternalStore } from "react"
import {
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  FileJson,
  Copy,
  Check,
  ShieldCheck,
  KeyRound,
  Terminal,
  Users,
  GraduationCap,
  UserCog,
  School,
  Crown,
  BookOpen,
} from "lucide-react"
import {
  authType,
  authEndpoints,
  loginSamples,
  studentSection,
  parentSection,
  teacherSection,
  schoolAdminModules,
  crudDesc,
  schoolAdminCrudSamples,
  superAdminLogin,
  superAdminEndpoints,
  type EndpointDoc,
  type LoginSample,
} from "@/lib/api-docs-data"

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {}
      }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
        copied ? "text-green-600 bg-green-500/10" : "text-[var(--subtitle-color)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)]"
      }`}
      title={label || "Copy"}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  )
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${methodColors[method] || "bg-[var(--accent)] text-[var(--title-color)]"}`}>
      {method}
    </span>
  )
}

function CodeBlock({ title, code }: { title: string; code: unknown }) {
  const text = typeof code === "string" ? code : JSON.stringify(code ?? {}, null, 2)
  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--accent)] border-b border-[var(--border)]">
        <span className="text-xs font-medium text-[var(--subtitle-color)]">{title}</span>
        <CopyButton text={text} />
      </div>
      <pre className="px-3 py-2.5 text-xs font-mono text-[var(--foreground)] bg-[var(--muted)] overflow-x-auto max-h-72">{text}</pre>
    </div>
  )
}

function curlFor(baseUrl: string, ep: EndpointDoc) {
  const lines = [`curl -X ${ep.method} "${baseUrl}/api/${ep.path}"`]
  if (ep.body) lines.push(`  -H "Content-Type: application/json"`)
  if (ep.body && Object.keys(ep.body as object).length > 0) {
    lines.push(`  -d '${JSON.stringify(ep.body)}'`)
  }
  return lines.join(" \\\n")
}

function EndpointCard({
  ep,
  baseUrl,
  expanded,
  onToggle,
}: {
  ep: EndpointDoc
  baseUrl: string
  expanded: boolean
  onToggle: () => void
}) {
  const key = `${ep.method} /api/${ep.path}`
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]">
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--accent)] transition-colors">
        <button onClick={onToggle} className="flex-1 flex items-center gap-3 text-left min-w-0">
          <span className={`p-1 rounded-lg ${expanded ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-[var(--subtitle-color)] opacity-70"}`}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
          <MethodBadge method={ep.method} />
          <code className="text-xs font-mono text-[var(--primary)]">{key}</code>
          <span className="flex-1 text-xs text-[var(--subtitle-color)] truncate hidden sm:block">{ep.summary}</span>
        </button>
        <CopyButton text={`${baseUrl}/api/${ep.path}`} label="" />
      </div>
      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-3 space-y-3">
          {ep.desc && <p className="text-xs text-[var(--subtitle-color)]">{ep.desc}</p>}
          {ep.roles && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-[var(--subtitle-color)] opacity-80">Allowed roles:</span>
              {(ep.roles.includes("*") ? ["any logged-in role"] : ep.roles).map((r) => (
                <span key={r} className="px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500 text-xs">
                  {r}
                </span>
              ))}
            </div>
          )}
          {ep.params && ep.params.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--title-color)] mb-1">Query parameters</p>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[var(--border)]">
                  {ep.params.map((p) => (
                    <tr key={p.name}>
                      <td className="py-1 pr-3 font-mono text-[var(--primary)] whitespace-nowrap">{p.name}</td>
                      <td className="py-1 pr-3">
                        {p.required ? (
                          <span className="text-red-500">required</span>
                        ) : (
                          <span className="text-[var(--subtitle-color)] opacity-70">optional</span>
                        )}
                      </td>
                      <td className="py-1 pr-3 font-mono text-[var(--subtitle-color)]">{p.example}</td>
                      <td className="py-1 text-[var(--subtitle-color)]">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            {ep.body !== undefined && Object.keys(ep.body as object).length > 0 && (
              <CodeBlock title="Sample request body" code={ep.body} />
            )}
            {ep.response !== undefined && <CodeBlock title="Sample response (200)" code={ep.response} />}
          </div>
          <CodeBlock title="cURL" code={curlFor(baseUrl, ep)} />
        </div>
      )}
    </div>
  )
}

function EndpointList({ endpoints, baseUrl }: { endpoints: EndpointDoc[]; baseUrl: string }) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const toggle = (k: string) =>
    setExpandedKeys((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]))
  return (
    <div className="space-y-2">
      {endpoints.map((ep) => {
        const k = `${ep.method} /api/${ep.path}`
        return <EndpointCard key={k} ep={ep} baseUrl={baseUrl} expanded={expandedKeys.includes(k)} onToggle={() => toggle(k)} />
      })}
    </div>
  )
}

function RoleHeader({ icon: Icon, title, tagline }: { icon: React.ElementType; title: string; tagline: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-base font-bold text-[var(--title-color)]">{title}</h3>
        <p className="text-xs text-[var(--subtitle-color)] mt-0.5">{tagline}</p>
      </div>
    </div>
  )
}

function LoginGuide({ sample, baseUrl }: { sample: LoginSample; baseUrl: string }) {
  const body: Record<string, string> = { email: sample.email, password: sample.password }
  if (sample.schoolCode) body.schoolCode = sample.schoolCode
  return (
    <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-light)] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-[var(--primary)]" />
        <h4 className="text-sm font-semibold text-[var(--title-color)]">Step 1 — Login as {sample.role}</h4>
      </div>
      <p className="text-xs text-[var(--subtitle-color)]">
        Send this request once. The response sets the <code className="font-mono text-[var(--primary)]">smart_school_session</code>{" "}
        httpOnly cookie which authenticates every other call.
        {sample.note ? ` ${sample.note}` : ""}
      </p>
      <div className="grid md:grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg border border-[var(--border)] px-3 py-2 bg-[var(--card)]">
          <p className="text-[var(--subtitle-color)] opacity-80">email</p>
          <p className="font-mono text-[var(--title-color)] truncate">{sample.email}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] px-3 py-2 bg-[var(--card)]">
          <p className="text-[var(--subtitle-color)] opacity-80">password</p>
          <p className="font-mono text-[var(--title-color)] truncate">{sample.password}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] px-3 py-2 bg-[var(--card)]">
          <p className="text-[var(--subtitle-color)] opacity-80">schoolCode</p>
          <p className="font-mono text-[var(--title-color)] truncate">{sample.schoolCode ?? "omit — not required"}</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <CodeBlock
          title={`POST ${baseUrl}/api/auth/login`}
          code={{ email: sample.email, password: sample.password, ...(sample.schoolCode ? { schoolCode: sample.schoolCode } : {}) }}
        />
        <CodeBlock
          title="Response — then redirect to"
          code={{
            user: { id: 2, name: sample.role + " User", email: sample.email, role: sample.role.toLowerCase().replace(/[^a-z]+/g, "_"), permissions: [], schoolId: 1 },
            redirect: sample.redirect,
          }}
        />
      </div>
      <CodeBlock
        title="cURL (save cookie, then call any API with it)"
        code={`curl -X POST "${baseUrl}/api/auth/login" -H "Content-Type: application/json" -d '${JSON.stringify(body)}' -c cookies.txt\ncurl "${baseUrl}/api/my/dashboard" -b cookies.txt`}
      />
      <p className="text-xs text-[var(--subtitle-color)]">
        Step 2 — After login succeeds in Postman the cookie is stored automatically; simply run any endpoint below.
      </p>
    </div>
  )
}

// ----------------------------------------------------------------

export default function ApiDocsPage({ showSuperAdmin = false }: { showSuperAdmin?: boolean }) {
  // Client-only value: server snapshot is empty, real origin appears after hydration.
  const baseUrl = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ""
  )
  const [activeTab, setActiveTab] = useState("student")

  const postmanHref = showSuperAdmin ? "/smart-school-saas.postman_collection.json" : "/smart-school.postman_collection.json"

  const tabs = useMemo(() => {
    const base = [
      { id: "student", label: "Student", icon: GraduationCap },
      { id: "parent", label: "Parent", icon: Users },
      { id: "teacher", label: "Teacher / Staff", icon: UserCog },
      { id: "admin", label: "School Admin", icon: School },
    ]
    if (showSuperAdmin) base.push({ id: "super", label: "Super Admin", icon: Crown })
    return base
  }, [showSuperAdmin])

  const roleSections: Record<string, { section: typeof studentSection; endpoints: EndpointDoc[] }> = {
    student: { section: studentSection, endpoints: studentSection.endpoints },
    parent: { section: parentSection, endpoints: parentSection.endpoints },
    teacher: { section: teacherSection, endpoints: teacherSection.endpoints },
  }

  const totalEndpoints =
    authEndpoints.length +
    studentSection.endpoints.length +
    parentSection.endpoints.length +
    teacherSection.endpoints.length +
    schoolAdminModules.reduce((s, m) => s + m.endpoints.length, 0) +
    (showSuperAdmin ? superAdminEndpoints.length : 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--title-color)]">REST API Documentation</h2>
          <p className="text-xs text-[var(--subtitle-color)] mt-0.5">
            {totalEndpoints}+ endpoints · role-based access · Postman-ready samples
            {showSuperAdmin ? " · includes Super Admin APIs" : ""}
          </p>
        </div>
        <a
          href={postmanHref}
          download
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors shadow-sm"
        >
          <Download className="h-4 w-4" />
          Download Postman Collection{showSuperAdmin ? " (full)" : ""}
        </a>
      </div>

      {/* Authentication guide */}
      <div className="glass-panel overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <h3 className="text-sm font-semibold text-[var(--title-color)]">Authentication — how login works</h3>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">{authType.kind}</span>
        </div>
        <div className="p-5 grid lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-[var(--subtitle-color)] mb-1">Base URL</p>
              <code className="block bg-[var(--muted)] border border-[var(--border)] px-3 py-2 rounded-lg font-mono text-xs text-[var(--primary)] break-all">
                {baseUrl || "<your-server>"}
              </code>
            </div>
            <ul className="list-disc pl-4 space-y-1.5 text-xs text-[var(--subtitle-color)]">
              {authType.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
            <div className="rounded-lg bg-[var(--muted)] border border-[var(--border)] p-3">
              <p className="text-xs font-semibold text-[var(--title-color)] mb-1.5">Common error responses</p>
              <ul className="space-y-1 text-xs text-[var(--subtitle-color)] font-mono">
                <li><span className="text-red-500">401</span> {"{ error: \"Unauthorized\" }"} — no/invalid session cookie</li>
                <li><span className="text-red-500">403</span> {"{ error: \"Forbidden\" }"} — role not allowed for this API</li>
                <li><span className="text-red-500">400</span> {"{ error: \"...\" }"} — validation or database error</li>
                <li><span className="text-red-500">404</span> {"{ error: \"Not found\" }"} — resource does not exist</li>
              </ul>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[var(--primary)]" />
              <p className="text-xs font-semibold text-[var(--title-color)]">Login credentials per role</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--accent)] text-[var(--subtitle-color)] uppercase tracking-wider">
                  <th className="text-left px-3 py-2 font-medium">Role</th>
                  <th className="text-left px-3 py-2 font-medium">Email</th>
                  <th className="text-left px-3 py-2 font-medium">Password</th>
                  <th className="text-left px-3 py-2 font-medium">School Code</th>
                  <th className="text-left px-3 py-2 font-medium">Panel</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {(showSuperAdmin ? [superAdminLogin, ...loginSamples] : loginSamples).map((l) => (
                  <tr key={l.role}>
                    <td className="px-3 py-2 font-medium text-[var(--title-color)]">{l.role}</td>
                    <td className="px-3 py-2 font-mono text-[var(--subtitle-color)] max-w-[160px] truncate">{l.email}</td>
                    <td className="px-3 py-2 font-mono text-[var(--subtitle-color)]">{l.password}</td>
                    <td className="px-3 py-2 font-mono text-[var(--subtitle-color)]">{l.schoolCode ?? "—"}</td>
                    <td className="px-3 py-2"><code className="text-[var(--primary)]">{l.redirect}</code></td>
                    <td className="px-2 py-2 text-right">
                      <CopyButton
                        text={JSON.stringify({ email: l.email, password: l.password, ...(l.schoolCode ? { schoolCode: l.schoolCode } : {}) })}
                        label=""
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-[var(--subtitle-color)] opacity-75 italic">
              Teacher / Student / Parent accounts are created by the School Admin under System Setting → Users; passwords shown are placeholders set at creation time.
            </p>
          </div>
        </div>
      </div>

      {/* Auth endpoints */}
      <div className="glass-panel overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold text-[var(--title-color)]">Auth endpoints (public — no session needed)</h3>
        </div>
        <div className="p-4">
          <EndpointList endpoints={authEndpoints} baseUrl={baseUrl} />
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex gap-1.5 flex-wrap glass-panel p-1.5">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--subtitle-color)] hover:text-[var(--title-color)] hover:bg-[var(--accent)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* STUDENT tab */}
      {activeTab === "student" && (
        <div className="space-y-4">
          <RoleHeader icon={GraduationCap} title={`${studentSection.label} APIs`} tagline={studentSection.tagline} />
          <LoginGuide sample={studentSection.login} baseUrl={baseUrl} />
          <EndpointList endpoints={roleSections.student.endpoints} baseUrl={baseUrl} />
        </div>
      )}

      {/* PARENT tab */}
      {activeTab === "parent" && (
        <div className="space-y-4">
          <RoleHeader icon={Users} title={`${parentSection.label} APIs`} tagline={parentSection.tagline} />
          <LoginGuide sample={parentSection.login} baseUrl={baseUrl} />
          <EndpointList endpoints={roleSections.parent.endpoints} baseUrl={baseUrl} />
        </div>
      )}

      {/* TEACHER tab */}
      {activeTab === "teacher" && (
        <div className="space-y-4">
          <RoleHeader icon={UserCog} title={`${teacherSection.label} APIs`} tagline={teacherSection.tagline} />
          <LoginGuide sample={teacherSection.login} baseUrl={baseUrl} />
          <EndpointList endpoints={roleSections.teacher.endpoints} baseUrl={baseUrl} />
        </div>
      )}

      {/* SCHOOL ADMIN tab */}
      {activeTab === "admin" && <SchoolAdminTab baseUrl={baseUrl} />}

      {/* SUPER ADMIN tab */}
      {activeTab === "super" && showSuperAdmin && (
        <div className="space-y-4">
          <RoleHeader icon={Crown} title="Super Admin APIs (SaaS Console)" tagline="Platform-level management of schools, plans and invoices. Every endpoint requires a super_admin session." />
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="h-4 w-4 text-purple-500" />
              <h4 className="text-sm font-semibold text-[var(--title-color)]">Step 1 — Login as Super Admin (no school code)</h4>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <CodeBlock
                title={`POST ${baseUrl}/api/auth/login`}
                code={{ email: superAdminLogin.email, password: superAdminLogin.password }}
              />
              <CodeBlock
                title="Response"
                code={{ user: { id: 1, name: "Platform Owner", email: superAdminLogin.email, role: "super_admin", permissions: [], schoolId: null }, school: null, redirect: "/saas" }}
              />
            </div>
            <p className="text-xs text-[var(--subtitle-color)] mt-2">
              Note: calling <code className="font-mono text-[var(--primary)]">/api/saas/*</code> without a super_admin session returns{" "}
              <code className="font-mono text-red-500">403 Forbidden</code>.
            </p>
          </div>
          <EndpointList endpoints={superAdminEndpoints} baseUrl={baseUrl} />
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}

// ----------------------------------------------------------------
// School admin tab — CRUD conventions + module browser + samples
// ----------------------------------------------------------------

function SchoolAdminTab({ baseUrl }: { baseUrl: string }) {
  const adminSample = loginSamples.find((l) => l.role === "School Admin")!
  const [keyword, setKeyword] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("all")
  const [expanded, setExpanded] = useState<string[]>([])
  const [samplesOpen, setSamplesOpen] = useState<string[]>([])

  const filtered = useMemo(() => {
    if (!keyword.trim()) return schoolAdminModules
    const kw = keyword.toLowerCase().trim()
    return schoolAdminModules
      .map((mod) => ({
        ...mod,
        endpoints: mod.endpoints.filter(
          (ep) =>
            ep.path.toLowerCase().includes(kw) ||
            ep.table.toLowerCase().includes(kw) ||
            ep.desc.toLowerCase().includes(kw) ||
            mod.label.toLowerCase().includes(kw)
        ),
      }))
      .filter((mod) => mod.endpoints.length > 0)
  }, [keyword])

  const toggleModule = (label: string) =>
    setExpanded((prev) => (prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]))

  const allModulesOpen = expanded.length === filtered.length && filtered.length > 0

  return (
    <div className="space-y-4">
      <RoleHeader
        icon={School}
        title="School Admin APIs"
        tagline="Full CRUD over every school module. All queries are auto-scoped to your school via the session."
      />
      <LoginGuide sample={adminSample} baseUrl={baseUrl} />

      {/* CRUD conventions */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileJson className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold text-[var(--title-color)]">Generic CRUD convention</h3>
        </div>
        <p className="text-xs text-[var(--subtitle-color)] mb-3">
          Each module below exposes the same four operations. Field names are sent in{" "}
          <b>snake_case</b> exactly as they appear in the PostgreSQL table (the UI uses camelCase internally — the API layer maps it).
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {(["GET", "POST", "PUT", "DELETE"] as const).map((m) => (
            <div key={m} className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3">
              <MethodBadge method={m} />
              <p className="text-xs text-[var(--subtitle-color)] mt-2">{crudDesc[m]}</p>
            </div>
          ))}
        </div>
        <CodeBlock
          title="Example — create a class, then update & delete it"
          code={`POST   ${baseUrl}/api/academics/class     body: { "name": "Class 11" }\nPUT    ${baseUrl}/api/academics/class     body: { "id": 8, "name": "Class 11 renamed" }\nDELETE ${baseUrl}/api/academics/class?id=8`}
        />
      </div>

      {/* Module browser */}
      <div className="glass-panel overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] flex flex-wrap items-center gap-3">
          <Search className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold text-[var(--title-color)]">Module browser</h3>
          <div className="relative ml-auto min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--subtitle-color)] opacity-70" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search module, table, path…"
              className="w-full h-8 pl-8 pr-3 text-xs bg-[var(--input-background,var(--input))] text-[var(--foreground)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none placeholder:text-[var(--subtitle-color)]"
            />
          </div>
          <div className="flex gap-0.5 bg-[var(--accent)] rounded-lg p-0.5">
            {["all", "GET", "POST", "PUT", "DELETE"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMethod(m)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedMethod === m ? "bg-[var(--card)] text-[var(--title-color)] shadow-sm" : "text-[var(--subtitle-color)] hover:text-[var(--title-color)]"
                }`}
              >
                {m === "all" ? "All" : m}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(allModulesOpen ? [] : filtered.map((m) => m.label))}
            className="h-8 px-3 text-xs text-[var(--subtitle-color)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] hover:text-[var(--title-color)] transition-colors"
          >
            {allModulesOpen ? "Collapse All" : "Expand All"}
          </button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {filtered.map((mod) => {
            const isOpen = expanded.includes(mod.label)
            return (
              <div key={mod.label}>
                <button
                  onClick={() => toggleModule(mod.label)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-[var(--accent)] transition-colors"
                >
                  <span className={`p-1 rounded-lg ${isOpen ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-[var(--subtitle-color)] opacity-70"}`}>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </span>
                  <span className="text-sm font-semibold text-[var(--title-color)]">{mod.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--subtitle-color)]">{mod.endpoints.length}</span>
                </button>
                {isOpen && (
                  <div className="overflow-x-auto pb-2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[var(--accent)] text-[var(--subtitle-color)] uppercase tracking-wider">
                          <th className="text-left px-5 py-2 font-medium">Endpoint</th>
                          <th className="text-left px-3 py-2 font-medium">Table</th>
                          <th className="text-left px-3 py-2 font-medium">Description</th>
                          <th className="text-left px-3 py-2 font-medium">Methods</th>
                          <th className="text-left px-3 py-2 font-medium">Query Params</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {mod.endpoints.map((ep) => (
                          <tr key={ep.path} className="hover:bg-[var(--accent)]/60 transition-colors">
                            <td className="px-5 py-2.5">
                              <code className="text-xs font-mono text-[var(--primary)] bg-[var(--primary-light)] px-1.5 py-0.5 rounded">/api/{ep.path}</code>
                            </td>
                            <td className="px-3 py-2.5"><code className="text-xs font-mono text-[var(--subtitle-color)]">{ep.table}</code></td>
                            <td className="px-3 py-2.5 text-[var(--subtitle-color)] max-w-[220px] truncate">{ep.desc}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex gap-1 flex-wrap">
                                {ep.path === "student-information/bulk-delete" ? (
                                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-500/15 text-orange-500">POST</span>
                                ) : (
                                  (["GET", "POST", "PUT", "DELETE"] as const)
                                    .filter((m) => selectedMethod === "all" || selectedMethod === m)
                                    .map((m) => <MethodBadge key={m} method={m} />)
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              {ep.params ? (
                                <div className="flex gap-1 flex-wrap max-w-[220px]">
                                  {ep.params.map((p) => (
                                    <span key={p} className="px-1.5 py-0.5 rounded text-xs font-mono bg-[var(--accent)] text-[var(--subtitle-color)]">{p}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[var(--subtitle-color)] opacity-40">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <CopyButton text={`${baseUrl}/api/${ep.path}`} label="" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && <div className="text-center py-10 text-[var(--subtitle-color)] text-sm">No matching modules</div>}
        </div>
      </div>

      {/* Sample payloads */}
      <div className="glass-panel overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <FileJson className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold text-[var(--title-color)]">Ready-to-use Postman payloads</h3>
        </div>
        <div className="p-4 space-y-2">
          {Object.entries(schoolAdminCrudSamples).map(([path, s]) => {
            const open = samplesOpen.includes(path)
            return (
              <div key={path} className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]">
                <button
                  onClick={() => setSamplesOpen((prev) => (open ? prev.filter((x) => x !== path) : [...prev, path]))}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--accent)] transition-colors text-left"
                >
                  <span className={`p-1 rounded-lg ${open ? "bg-[var(--primary-light)] text-[var(--primary)]" : "text-[var(--subtitle-color)] opacity-70"}`}>
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </span>
                  <MethodBadge method="POST" />
                  <code className="text-xs font-mono text-[var(--primary)]">/api/{path}</code>
                  <span className="ml-auto text-xs text-[var(--subtitle-color)] opacity-75">sample body + response</span>
                </button>
                {open && (
                  <div className="border-t border-[var(--border)] px-4 py-3 grid md:grid-cols-2 gap-3">
                    <CodeBlock title="Sample request body" code={s.body} />
                    <CodeBlock title="Sample response (201)" code={s.response} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
