import { menuData } from "@/lib/menu-data"

export const PERM_ACTIONS = ["view", "add", "edit", "delete"] as const
export type PermAction = (typeof PERM_ACTIONS)[number]

export type PermActions = { view: boolean; add: boolean; edit: boolean; delete: boolean }
export type PermMap = Record<string, PermActions>

export type PermItem = { label: string; path: string; code: string }
export type PermCategory = { label: string; icon: string; items: PermItem[] }

export const baseCode = (path: string) =>
  path === "/admin"
    ? "dashboard"
    : path.replace(/^\/admin\//, "").replace(/\//g, "_").replace(/-/g, "_")

export const permissionsTree: PermCategory[] = [
  {
    label: "Dashboard",
    icon: "Home",
    items: [{ label: "Dashboard", path: "/admin", code: baseCode("/admin") }],
  },
  ...menuData.map((cat) => ({
    label: cat.label,
    icon: cat.icon,
    items: cat.items.map((item) => ({
      label: item.label,
      path: item.path,
      code: baseCode(item.path),
    })),
  })),
]

export const allPermItems = permissionsTree.flatMap((c) => c.items)

export function buildEmptyPermMap(): PermMap {
  const map: PermMap = {}
  for (const item of allPermItems) map[item.code] = { view: false, add: false, edit: false, delete: false }
  return map
}

export function parsePermissions(perms: string[]): PermMap {
  const map = buildEmptyPermMap()
  if (perms.includes("*")) {
    for (const code of Object.keys(map)) map[code] = { view: true, add: true, edit: true, delete: true }
    return map
  }
  for (const raw of perms) {
    if (typeof raw !== "string") continue
    const sep = raw.indexOf(":")
    const code = sep === -1 ? raw : raw.slice(0, sep)
    const action = sep === -1 ? "" : raw.slice(sep + 1)
    if (!map[code]) continue
    if (action === "") {
      map[code] = { view: true, add: true, edit: true, delete: true }
    } else if ((PERM_ACTIONS as readonly string[]).includes(action)) {
      map[code][action as PermAction] = true
    }
  }
  return map
}

export function collectPermissions(map: PermMap): string[] {
  const out: string[] = []
  let allOn = true
  for (const item of allPermItems) {
    const m = map[item.code]
    if (!m) continue
    if (m.view) out.push(`${item.code}:view`)
    if (m.add) out.push(`${item.code}:add`)
    if (m.edit) out.push(`${item.code}:edit`)
    if (m.delete) out.push(`${item.code}:delete`)
    if (!(m.view && m.add && m.edit && m.delete)) allOn = false
  }
  return allOn ? ["*"] : out
}

export function enabledPermissionCount(perms: string[]): number {
  if (!Array.isArray(perms)) return 0
  if (perms.includes("*")) return allPermItems.length
  return perms.filter((p) => typeof p === "string").length
}

export const itemAllOn = (m: PermActions) => m.view && m.add && m.edit && m.delete

export function canViewPermission(perms: string[] | undefined | null, path: string): boolean {
  if (!Array.isArray(perms) || perms.length === 0) return false
  if (perms.includes("*")) return true
  const code = baseCode(path)
  return perms.some((p) => {
    const k = typeof p === "string" ? p.split(":")[0] : ""
    return k === code
  })
}

const LEGACY_CATEGORY_PERMS: Record<string, string> = {
  front_office: "Front Office",
  student_view: "Student Information",
  fees_view: "Fees Collection",
  my_class: "Academics",
  homework: "Homework",
  homework_view: "Homework",
  attendance_mark: "Attendance",
  online_exam: "Online Examinations",
}

export function legacyCategoryVisible(perms: string[] | undefined | null, categoryLabel: string): boolean {
  if (!Array.isArray(perms) || perms.length === 0) return false
  if (perms.includes("*")) return true
  return perms.some((p) => {
    const code = typeof p === "string" ? p.split(":")[0] : ""
    return LEGACY_CATEGORY_PERMS[code] === categoryLabel
  })
}