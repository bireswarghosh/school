"use client"

import { useState, useEffect, useCallback } from "react"
import { Settings, X } from "lucide-react"

type ThemeVars = {
  sidebarBg: string
  sidebarText: string
  sidebarActiveBg: string
  bodyFont: string
  headingFont: string
  fontSize: string
  primaryColor: string
  btnTextColor: string
  cardBg: string
  inputFont: string
}

const GOOGLE_FONTS: Record<string, string> = {
  "var(--font-sans)": "",
  "Arial, sans-serif": "",
  "'Segoe UI', sans-serif": "",
  "'Open Sans', sans-serif": "Open+Sans:wght@300;400;500;600;700;800",
  "'Roboto', sans-serif": "Roboto:wght@300;400;500;600;700",
  "var(--font-heading)": "",
  "'Poppins', sans-serif": "Poppins:wght@400;500;600;700;800",
  "'Inter', sans-serif": "Inter:wght@300;400;500;600;700;800",
  "'Nunito', sans-serif": "Nunito:wght@400;500;600;700;800",
  "'Montserrat', sans-serif": "Montserrat:wght@300;400;500;600;700;800",
}

function loadGoogleFont(cssValue: string) {
  const family = GOOGLE_FONTS[cssValue]
  if (!family) return
  const href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`
  const id = `gf-${cssValue.replace(/\W/g, "")}`
  if (!document.getElementById(id)) {
    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href = href
    document.head.appendChild(link)
  }
}

const DEFAULTS: ThemeVars = {
  sidebarBg: "#1e293b",
  sidebarText: "#cbd5e1",
  sidebarActiveBg: "var(--primary)",
  bodyFont: "var(--font-sans)",
  headingFont: "var(--font-heading)",
  fontSize: "15px",
  primaryColor: "#ff7732",
  btnTextColor: "#ffffff",
  cardBg: "#ffffff",
  inputFont: "inherit",
}

function applyVars(vars: ThemeVars) {
  const root = document.documentElement
  root.style.setProperty("--sidebar-bg", vars.sidebarBg)
  root.style.setProperty("--sidebar-text", vars.sidebarText)
  root.style.setProperty("--sidebar-active-bg", vars.sidebarActiveBg)
  root.style.setProperty("--font-size-base", vars.fontSize)
  root.style.setProperty("--primary", vars.primaryColor)
  root.style.setProperty("--btn-text", vars.btnTextColor)
  root.style.setProperty("--card-bg", vars.cardBg)
  root.style.setProperty("--input-font", vars.inputFont)
  root.style.setProperty("--font-family", vars.bodyFont)
  root.style.setProperty("--heading-font-family", vars.headingFont)
  loadGoogleFont(vars.bodyFont)
  loadGoogleFont(vars.headingFont)
}

export default function ThemeSettings() {
  const [open, setOpen] = useState(false)
  const [vars, setVars] = useState<ThemeVars>(DEFAULTS)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme-vars")
      if (saved) {
        const parsed = { ...DEFAULTS, ...JSON.parse(saved) }
        setVars(parsed)
        applyVars(parsed)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    applyVars(vars)
    localStorage.setItem("theme-vars", JSON.stringify(vars))
  }, [vars])

  const set = (key: keyof ThemeVars, value: string) =>
    setVars((prev) => ({ ...prev, [key]: value }))

  const reset = () => setVars(DEFAULTS)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
        title="Theme Settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative pointer-events-auto w-80 max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-5 mt-14 mr-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Theme Settings</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <Section label="Sidebar">
                <Row label="Background">
                  <ColorInput value={vars.sidebarBg} onChange={(v) => set("sidebarBg", v)} />
                </Row>
                <Row label="Text Color">
                  <ColorInput value={vars.sidebarText} onChange={(v) => set("sidebarText", v)} />
                </Row>
                <Row label="Active BG">
                  <ColorInput value={vars.sidebarActiveBg} onChange={(v) => set("sidebarActiveBg", v)} />
                </Row>
              </Section>

              <Section label="Colors">
                <Row label="Primary">
                  <ColorInput value={vars.primaryColor} onChange={(v) => set("primaryColor", v)} />
                </Row>
                <Row label="Button Text">
                  <ColorInput value={vars.btnTextColor} onChange={(v) => set("btnTextColor", v)} />
                </Row>
                <Row label="Card BG">
                  <ColorInput value={vars.cardBg} onChange={(v) => set("cardBg", v)} />
                </Row>
              </Section>

              <Section label="Fonts">
                <Row label="Body Font">
                  <select
                    value={vars.bodyFont}
                    onChange={(e) => set("bodyFont", e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                  >
                    <option value="var(--font-sans)">Plus Jakarta Sans</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Segoe UI', sans-serif">Segoe UI</option>
                    <option value="'Open Sans', sans-serif">Open Sans</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                  </select>
                </Row>
                <Row label="Heading Font">
                  <select
                    value={vars.headingFont}
                    onChange={(e) => set("headingFont", e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                  >
                    <option value="var(--font-heading)">Outfit</option>
                    <option value="'Poppins', sans-serif">Poppins</option>
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="'Nunito', sans-serif">Nunito</option>
                    <option value="'Montserrat', sans-serif">Montserrat</option>
                  </select>
                </Row>
                <Row label="Font Size">
                  <select
                    value={vars.fontSize}
                    onChange={(e) => set("fontSize", e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                  >
                    {["12px", "13px", "14px", "15px", "16px"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Row>
                <Row label="Input Font">
                  <select
                    value={vars.inputFont}
                    onChange={(e) => set("inputFont", e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                  >
                    <option value="inherit">Same as body</option>
                    <option value="'Courier New', monospace">Monospace</option>
                    <option value="Arial, sans-serif">Arial</option>
                  </select>
                </Row>
              </Section>

              <button
                onClick={reset}
                className="w-full mt-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wider">{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-600 text-xs whitespace-nowrap">{label}</span>
      <div className="w-32 flex-shrink-0">{children}</div>
    </div>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs font-mono"
      />
    </div>
  )
}
