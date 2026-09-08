export type BackendTheme = {
  key: "default" | "white" | "red" | "blue" | "gray" | "custom"
  label: string
  primary: string
  sidebar?: string
  header?: string
}

export const BACKEND_THEME_EVENT = "backend-theme-change"

export const CUSTOM_THEME_KEY = "custom"

export const BACKEND_THEMES: BackendTheme[] = [
  { key: "default", label: "Default", primary: "#ff7732" },
  { key: "white", label: "White", primary: "#ff7732", sidebar: "#ffffff" },
  { key: "red", label: "Red", primary: "#e53935" },
  { key: "blue", label: "Blue", primary: "#1e88e5" },
  { key: "gray", label: "Gray", primary: "#37474f" },
]

export function themeFor(key: string | null | undefined): BackendTheme {
  return BACKEND_THEMES.find((t) => t.key === key) || BACKEND_THEMES[0]
}

export function resolveTheme(key: string | null | undefined, customColor?: string): BackendTheme {
  if (key === CUSTOM_THEME_KEY && customColor) {
    return { key: CUSTOM_THEME_KEY, label: "Custom", primary: customColor.toUpperCase(), sidebar: "#0f172a" }
  }
  return themeFor(key)
}