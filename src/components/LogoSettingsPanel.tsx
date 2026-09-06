"use client"

import { Loader2 } from "lucide-react"
import { useSettingsForm, SettingsSection, SettingsSaveBar, PanelStatus } from "@/components/settings-bits"
import SettingsImageUpload from "@/components/SettingsImageUpload"

export default function LogoSettingsPanel() {
  const { form, set, loading, error, success, commit, saving } = useSettingsForm("logo.")

  return (
    <>
      <PanelStatus loading={loading} error={error} success={success} successMessage="Logo settings saved!" />
      <SettingsSection title="Logo" subtitle="Upload the logos used across the portal, admin panel and app">
        <SettingsImageUpload
          label="Print Logo"
          hint="Shown on printed documents (receipts, certificates)."
          value={form.printLogo || ""}
          onChange={(v) => set("printLogo", v)}
        />
        <SettingsImageUpload
          label="Admin Logo"
          hint="Shown in the admin sidebar (192x192 recommended)."
          value={form.adminLogo || ""}
          onChange={(v) => set("adminLogo", v)}
        />
        <SettingsImageUpload
          label="Admin Small Logo"
          hint="Collapsed sidebar view."
          value={form.adminSmallLogo || ""}
          onChange={(v) => set("adminSmallLogo", v)}
        />
        <SettingsImageUpload
          label="App Logo"
          hint="Used on the mobile app login screen."
          value={form.appLogo || ""}
          onChange={(v) => set("appLogo", v)}
        />
        <SettingsSaveBar onSave={commit} saving={saving} />
      </SettingsSection>
    </>
  )
}