"use client"

import { useSettingsForm, SettingsSection, SettingsSaveBar, PanelStatus, Field } from "@/components/settings-bits"

export default function MobileAppSettingsPanel() {
  const { form, set, loading, error, success, commit, saving } = useSettingsForm("mobile.")

  return (
    <>
      <PanelStatus loading={loading} error={error} success={success} successMessage="Mobile app settings saved!" />
      <SettingsSection title="Mobile App" subtitle="Configuration for the school mobile application">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="App / API Base URL"
            value={form.appUrl || ""}
            onChange={(v) => set("appUrl", v)}
            placeholder="https://api.yourschool.in"
          />
          <Field
            label="Firebase Cloud Messaging Sender ID"
            value={form.fcmSenderId || ""}
            onChange={(v) => set("fcmSenderId", v)}
            placeholder="123456789012"
          />
          <Field
            label="Primary Colour"
            value={form.primaryColor || ""}
            onChange={(v) => set("primaryColor", v)}
            placeholder="#ff7732"
          />
          <Field
            label="Secondary Colour"
            value={form.secondaryColor || ""}
            onChange={(v) => set("secondaryColor", v)}
            placeholder="#1e293b"
          />
          <Field
            label="Google Play Store URL"
            value={form.androidUrl || ""}
            onChange={(v) => set("androidUrl", v)}
            placeholder="https://play.google.com/store/apps/..."
          />
          <Field
            label="App Store URL"
            value={form.iosUrl || ""}
            onChange={(v) => set("iosUrl", v)}
            placeholder="https://apps.apple.com/app/..."
          />
        </div>
        <SettingsSaveBar onSave={commit} saving={saving} />
      </SettingsSection>
    </>
  )
}