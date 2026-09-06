"use client"

import { useSettingsForm, SettingsSection, SettingsSaveBar, PanelStatus, Field } from "@/components/settings-bits"

export default function GoogleDriveSettingsPanel() {
  const { form, set, loading, error, success, commit, saving } = useSettingsForm("googledrive.")

  return (
    <>
      <PanelStatus loading={loading} error={error} success={success} successMessage="Google Drive settings saved!" />
      <SettingsSection
        title="Google Drive Setting"
        subtitle="Connect a Google Drive folder used for uploads and backups"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Google Client ID" value={form.clientId || ""} onChange={(v) => set("clientId", v)} placeholder="1234-xxxx.apps.googleusercontent.com" />
          <Field label="Google Client Secret" type="password" value={form.clientSecret || ""} onChange={(v) => set("clientSecret", v)} placeholder="GOCSPX-…" />
          <Field label="Drive Folder ID" value={form.folderId || ""} onChange={(v) => set("folderId", v)} placeholder="1AbCdEfGhIjK…" />
          <Field label="Max Upload Size (MB)" value={form.maxUploadSize ?? "5"} onChange={(v) => set("maxUploadSize", v)} placeholder="5" />
        </div>
        <SettingsSaveBar onSave={commit} saving={saving} />
      </SettingsSection>
    </>
  )
}