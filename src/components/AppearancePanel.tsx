"use client"

import { useState } from "react"
import { Check, Image as ImageIcon, LayoutTemplate, Palette, Loader2, Save, AlertCircle } from "lucide-react"
import SettingsImageUpload from "@/components/SettingsImageUpload"
import { useSchoolSettings } from "@/lib/use-school-settings"
import { useSchoolInfo } from "@/lib/use-school-info"
import { PanelStatus } from "@/components/settings-bits"
import { BACKEND_THEMES, BACKEND_THEME_EVENT } from "@/lib/backend-themes"

type SubAction = "logo" | "login-bg" | "theme"

export default function AppearancePanel() {
  const logo = useSchoolSettings("logo.")
  const loginBg = useSchoolSettings("loginbg.")
  const theme = useSchoolSettings("theme.")
  const { info: schoolInfo } = useSchoolInfo()

  const [sub, setSub] = useState<SubAction>("logo")

  const subTabs: { key: SubAction; label: string; icon: React.ElementType }[] = [
    { key: "logo", label: "Logo", icon: ImageIcon },
    { key: "login-bg", label: "Login Page Background", icon: LayoutTemplate },
    { key: "theme", label: "Backend Theme", icon: Palette },
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <PanelStatus loading={false} error={null} success={false} successMessage="" />
      <h3 className="text-base font-semibold text-gray-800">Appearance</h3>
      <p className="text-xs text-gray-500 mt-0.5 mb-5">Branding, login background and admin theme</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {subTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              sub === key ? "bg-[var(--primary)] text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {sub === "logo" && (
        <div className="space-y-5">
          <SettingsImageUpload
            label="Print Logo"
            hint="Shown on printed documents (receipts, certificates)."
            value={logo.settings.printLogo || ""}
            onChange={(v) => logo.saveScoped({ printLogo: v })}
          />
          <SettingsImageUpload
            label="Admin Logo"
            hint="Shown in the admin sidebar (192x192 recommended)."
            value={logo.settings.adminLogo || ""}
            onChange={(v) => logo.saveScoped({ adminLogo: v })}
          />
          <SettingsImageUpload
            label="Admin Small Logo"
            hint="Collapsed sidebar view."
            value={logo.settings.adminSmallLogo || ""}
            onChange={(v) => logo.saveScoped({ adminSmallLogo: v })}
          />
          <SettingsImageUpload
            label="App Logo"
            hint="Used on the mobile app login screen."
            value={logo.settings.appLogo || ""}
            onChange={(v) => logo.saveScoped({ appLogo: v })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Name Color</label>
            <p className="text-xs text-gray-500 -mt-0.5 mb-2">Used for the school name shown next to the logo in the admin header.</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={logo.settings.schoolNameColor || "#ff7732"}
                onChange={(e) => logo.saveScoped({ schoolNameColor: e.target.value })}
                className="h-9 w-14 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500">{logo.settings.schoolNameColor || "#ff7732"}</span>
              {logo.settings.schoolNameColor && (
                <button
                  onClick={() => logo.saveScoped({ schoolNameColor: "" })}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Reset to default
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Header Preview</label>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              {logo.settings.adminLogo ? (
                <img src={logo.settings.adminLogo} alt="Admin logo" className="h-9 w-9 object-contain rounded-md" />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
              <span
                className="text-base font-bold truncate"
                style={{ color: logo.settings.schoolNameColor || "#ff7732" }}
              >
                {schoolInfo.name}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              This is how it appears in the admin header. Pick the hex color above for the school name.
            </p>
          </div>

          <PanelStatus loading={logo.loading} error={logo.error} success={false} successMessage="" />
          <SaveRow saving={logo.saving} onSave={() => logo.save({})} />
        </div>
      )}

      {sub === "login-bg" && (
        <div className="space-y-5">
          <SettingsImageUpload
            label="Admin Login Background"
            hint="Background for the school-staff login page."
            value={loginBg.settings.adminBg || ""}
            onChange={(v) => loginBg.saveScoped({ adminBg: v })}
          />
          <SettingsImageUpload
            label="Student & Parent Login Background"
            hint="Background for the student/parent portal login page."
            value={loginBg.settings.userBg || ""}
            onChange={(v) => loginBg.saveScoped({ userBg: v })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Overlay Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={loginBg.settings.adminOverlayColor || "#1e293b"}
                  onChange={(e) => loginBg.saveScoped({ adminOverlayColor: e.target.value })}
                  className="h-9 w-14 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-500">{loginBg.settings.adminOverlayColor || "#1e293b"}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student & Parent Overlay Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={loginBg.settings.overlayColor || "#1e293b"}
                  onChange={(e) => loginBg.saveScoped({ overlayColor: e.target.value })}
                  className="h-9 w-14 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-500">{loginBg.settings.overlayColor || "#1e293b"}</span>
              </div>
            </div>
          </div>
          <PanelStatus loading={loginBg.loading} error={loginBg.error} success={false} successMessage="" />
          <SaveRow saving={loginBg.saving} onSave={() => loginBg.save({})} />
        </div>
      )}

      {sub === "theme" && (
        <div className="space-y-5">
          <div className={theme.loading ? "opacity-50 pointer-events-none" : ""}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {BACKEND_THEMES.map((t) => {
                const active = (theme.settings.backendTheme || "default") === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      theme.saveScoped({ backendTheme: t.key })
                      window.dispatchEvent(new CustomEvent(BACKEND_THEME_EVENT, { detail: { key: t.key } }))
                    }}
                    className={`relative rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${
                      active ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {active && (
                      <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <span className="h-10 w-10 rounded-full shadow-inner" style={{ backgroundColor: t.primary }} />
                    <span className="text-sm font-medium text-gray-700">{t.label}</span>
                  </button>
                )
              })}
            </div>

            <div
              className={`mt-4 rounded-xl border-2 p-4 flex flex-wrap items-center gap-4 transition-all ${
                (theme.settings.backendTheme || "") === "custom"
                  ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                  : "border-gray-200"
              }`}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Theme Color</label>
                <p className="text-xs text-gray-500 mb-2">Pick any hex color to use as your admin theme color.</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.settings.backendThemeColor || "#ff7732"}
                    onChange={(e) => {
                      const hex = e.target.value
                      theme.saveScoped({ backendTheme: "custom", backendThemeColor: hex })
                      window.dispatchEvent(
                        new CustomEvent(BACKEND_THEME_EVENT, { detail: { key: "custom", customColor: hex } })
                      )
                    }}
                    className="h-9 w-14 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">{theme.settings.backendThemeColor || "#ff7732"}</span>
                </div>
              </div>
            </div>
          </div>
          <PanelStatus loading={theme.loading} error={theme.error} success={false} successMessage="" />
          <SaveRow saving={theme.saving} onSave={() => theme.save({})} />
        </div>
      )}
    </div>
  )
}

function SaveRow({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save
      </button>
    </div>
  )
}
