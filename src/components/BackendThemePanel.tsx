"use client"

import { Check } from "lucide-react"
import { useSettingsForm, SettingsSection, SettingsSaveBar, PanelStatus } from "@/components/settings-bits"
import { BACKEND_THEMES, BACKEND_THEME_EVENT } from "@/lib/backend-themes"

export default function BackendThemePanel() {
  const { form, set, loading, error, success, commit, saving } = useSettingsForm("theme.")
  const current = form.backendTheme || "default"

  const pick = (key: string) => {
    set("backendTheme", key)
    window.dispatchEvent(new CustomEvent(BACKEND_THEME_EVENT, { detail: key }))
  }

  return (
    <>
      <PanelStatus loading={loading} error={error} success={success} successMessage="Backend theme saved!" />
      <SettingsSection title="Backend Theme" subtitle="Pick the colour theme for the admin panel. Changes apply live.">
        <div className={loading ? "opacity-50 pointer-events-none" : ""}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {BACKEND_THEMES.map((theme) => {
              const active = current === theme.key
              return (
                <button
                  key={theme.key}
                  onClick={() => pick(theme.key)}
                  className={`relative rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${
                    active ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {active && (
                    <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <span className="h-10 w-10 rounded-full shadow-inner" style={{ backgroundColor: theme.primary }} />
                  <span className="text-sm font-medium text-gray-700">{theme.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        <SettingsSaveBar onSave={commit} saving={saving} />
      </SettingsSection>
    </>
  )
}