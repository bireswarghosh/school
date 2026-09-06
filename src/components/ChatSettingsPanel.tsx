"use client"

import { useSettingsForm, SettingsSection, SettingsSaveBar, PanelStatus, ToggleRow } from "@/components/settings-bits"

const ROLES = [
  { key: "allowTeacher", label: "Teachers can use chat" },
  { key: "allowParent", label: "Parents can use chat" },
  { key: "allowStudent", label: "Students can use chat" },
  { key: "allowStaff", label: "Staff can use chat" },
]

export default function ChatSettingsPanel() {
  const { form, setBool, loading, error, success, commit, saving } = useSettingsForm("chat.")

  return (
    <>
      <PanelStatus loading={loading} error={error} success={success} successMessage="Chat settings saved!" />
      <SettingsSection title="Chat" subtitle="Enable the in-app messaging system for each role">
        <ToggleRow
          label="Enable Chat"
          desc="Turn the messaging system on for everyone below."
          checked={(form.enabled ?? "0") === "1"}
          onChange={(v) => setBool("enabled", v)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {ROLES.map((role) => (
            <ToggleRow
              key={role.key}
              label={role.label}
              checked={(form[role.key] ?? "1") === "1"}
              onChange={(v) => setBool(role.key, v)}
            />
          ))}
        </div>
        <SettingsSaveBar onSave={commit} saving={saving} />
      </SettingsSection>
    </>
  )
}