"use client"

import { useSettingsForm, SettingsSection, SettingsSaveBar, PanelStatus, ToggleRow, SelectField, Field } from "@/components/settings-bits"

export default function MiscSettingsPanel() {
  const { form, set, setBool, loading, error, success, commit, saving } = useSettingsForm("misc.")

  return (
    <>
      <PanelStatus loading={loading} error={error} success={success} successMessage="Miscellaneous settings saved!" />
      <SettingsSection title="Miscellaneous" subtitle="Additional school-wide behaviour toggles">
        <div className="max-w-md">
          <SelectField
            label="ID Card Scan Code Type"
            value={form.idCardScanCode || "barcode"}
            onChange={(v) => set("idCardScanCode", v)}
            options={[
              { value: "barcode", label: "Barcode" },
              { value: "qr", label: "QR Code" },
            ]}
          />
        </div>
        <div className={loading ? "opacity-50 pointer-events-none" : ""}>
          <ToggleRow
            label="Show Only My Questions"
            desc="Hide other teachers' question bank questions."
            checked={(form.showOnlyMyQuestions ?? "0") === "1"}
            onChange={(v) => setBool("showOnlyMyQuestions", v)}
          />
          <ToggleRow
            label="Exam Result Page On Front Site"
            desc="Allow exam results to be checked on the public website (no login)."
            checked={(form.frontSiteExamResult ?? "1") === "1"}
            onChange={(v) => setBool("frontSiteExamResult", v)}
          />
          <ToggleRow
            label="Teacher Restricted Mode"
            desc="Restrict teachers to viewing only their own classes and subjects."
            checked={(form.teacherRestrictedMode ?? "0") === "1"}
            onChange={(v) => setBool("teacherRestrictedMode", v)}
          />
          <ToggleRow
            label="Staff Leave Apply To Email"
            desc="Allow leave applications to be submitted by email."
            checked={(form.staffLeaveApplyEmail ?? "0") === "1"}
            onChange={(v) => setBool("staffLeaveApplyEmail", v)}
          />
          <div className="max-w-md">
            <Field
              label="Event Reminder Days"
              value={form.eventReminderDays ?? "7"}
              onChange={(v) => set("eventReminderDays", v)}
              placeholder="7"
            />
          </div>
        </div>
        <SettingsSaveBar onSave={commit} saving={saving} />
      </SettingsSection>
    </>
  )
}