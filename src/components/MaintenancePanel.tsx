"use client"

import { useSettingsForm, SettingsSection, SettingsSaveBar, PanelStatus, ToggleRow, Field } from "@/components/settings-bits"

export default function MaintenancePanel() {
  const { form, set, setBool, loading, error, success, commit, saving } = useSettingsForm("maintenance.")

  const quickSet = (durationHours: string) => {
    setBool("enabled", true)
    const endsAt = new Date(Date.now() + Number(durationHours) * 3600_000).toISOString()
    set("endsAt", endsAt)
  }

  return (
    <>
      <PanelStatus loading={loading} error={error} success={success} successMessage="Maintenance mode saved!" />
      <SettingsSection
        title="Maintenance"
        subtitle="While enabled, student & parent logins are blocked and the site shows a maintenance notice"
      >
        <ToggleRow
          label="Site Under Maintenance"
          desc="Blocks portal logins. Staff can continue working normally."
          checked={(form.enabled ?? "0") === "1"}
          onChange={(v) => setBool("enabled", v)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          <Field
            label="Auto-disable at (ISO date-time)"
            value={form.endsAt || ""}
            onChange={(v) => set("endsAt", v)}
            placeholder="2026-12-31T23:59:00Z"
          />
          <div className="flex items-end gap-2">
            {[
              { label: "Set Now", hours: "0" },
              { label: "All Night", hours: "8" },
              { label: "Next Morning", hours: "12" },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => quickSet(a.hours)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <SettingsSaveBar onSave={commit} saving={saving} />
      </SettingsSection>
    </>
  )
}