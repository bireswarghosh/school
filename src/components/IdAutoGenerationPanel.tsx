"use client"

import { useSettingsForm, SettingsSection, SettingsSaveBar, PanelStatus, ToggleRow, Field } from "@/components/settings-bits"

function DigitGroup({ title, enabled, prefix, digit, startFrom, onEnabled, onPrefix, onDigit, onStartFrom, loading }: {
  title: string
  enabled: string
  prefix: string
  digit: string
  startFrom: string
  onEnabled: (v: boolean) => void
  onPrefix: (v: string) => void
  onDigit: (v: string) => void
  onStartFrom: (v: string) => void
  loading: boolean
}) {
  return (
    <div className={loading ? "opacity-50 pointer-events-none" : ""}>
      <ToggleRow label={`${title} ID Auto Generation`} desc="Auto-generate the ID when adding a new record." checked={enabled === "1"} onChange={onEnabled} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        <Field label="Prefix" value={prefix} onChange={onPrefix} placeholder="S" />
        <Field label="Number of Digits" value={digit} onChange={onDigit} placeholder="4" />
        <Field label="Start From" value={startFrom} onChange={onStartFrom} placeholder="1" />
      </div>
    </div>
  )
}

export default function IdAutoGenerationPanel() {
  const { form, set, setBool, loading, error, success, commit, saving } = useSettingsForm("idautogen.")

  return (
    <>
      <PanelStatus loading={loading} error={error} success={success} successMessage="ID auto generation settings saved!" />
      <SettingsSection title="ID Auto Generation" subtitle="Control how admission numbers and staff IDs are generated">
        <DigitGroup
          title="Student Admission No"
          enabled={form.studentAdmissionNoEnabled ?? "1"}
          prefix={form.studentPrefix ?? "S"}
          digit={form.studentDigit ?? "4"}
          startFrom={form.studentStartFrom ?? "1"}
          loading={loading}
          onEnabled={(v) => setBool("studentAdmissionNoEnabled", v)}
          onPrefix={(v) => set("studentPrefix", v)}
          onDigit={(v) => set("studentDigit", v)}
          onStartFrom={(v) => set("studentStartFrom", v)}
        />
        <div className="border-t border-gray-100 pt-5">
          <DigitGroup
            title="Staff ID"
            enabled={form.staffIdEnabled ?? "0"}
            prefix={form.staffPrefix ?? "STAFF"}
            digit={form.staffDigit ?? "4"}
            startFrom={form.staffStartFrom ?? "1"}
            loading={loading}
            onEnabled={(v) => setBool("staffIdEnabled", v)}
            onPrefix={(v) => set("staffPrefix", v)}
            onDigit={(v) => set("staffDigit", v)}
            onStartFrom={(v) => set("staffStartFrom", v)}
          />
        </div>
        <SettingsSaveBar onSave={commit} saving={saving} />
      </SettingsSection>
    </>
  )
}