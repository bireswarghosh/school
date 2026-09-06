"use client"

import { useSettingsForm, SettingsSection, SettingsSaveBar, PanelStatus } from "@/components/settings-bits"
import SettingsImageUpload from "@/components/SettingsImageUpload"

export default function LoginBackgroundPanel() {
  const { form, set, loading, error, success, commit, saving } = useSettingsForm("loginbg.")

  return (
    <>
      <PanelStatus loading={loading} error={error} success={success} successMessage="Login background saved!" />
      <SettingsSection
        title="Login Page Background"
        subtitle="Background images shown on the admin and the student/parent login pages"
      >
        <SettingsImageUpload
          label="Admin Login Background"
          hint="Background for the school-staff login page."
          value={form.adminBg || ""}
          onChange={(v) => set("adminBg", v)}
        />
        <SettingsImageUpload
          label="Student & Parent Login Background"
          hint="Background for the student/parent portal login page."
          value={form.userBg || ""}
          onChange={(v) => set("userBg", v)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Overlay Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.adminOverlayColor || "#1e293b"}
                onChange={(e) => set("adminOverlayColor", e.target.value)}
                className="h-9 w-14 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500">{form.adminOverlayColor || "#1e293b"}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student & Parent Overlay Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.overlayColor || "#1e293b"}
                onChange={(e) => set("overlayColor", e.target.value)}
                className="h-9 w-14 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500">{form.overlayColor || "#1e293b"}</span>
            </div>
          </div>
        </div>
        <SettingsSaveBar onSave={commit} saving={saving} />
      </SettingsSection>
    </>
  )
}