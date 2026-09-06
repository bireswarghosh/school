"use client"

import { useSettingsForm, SettingsSection, SettingsSaveBar, PanelStatus, ToggleRow, SelectField } from "@/components/settings-bits"

export default function StudentGuardianPanel() {
  const { form, set, setBool, loading, error, success, commit, saving } = useSettingsForm("studentlogin.")

  return (
    <>
      <PanelStatus loading={loading} error={error} success={success} successMessage="Student & guardian panel settings saved!" />
      <SettingsSection
        title="Student / Guardian Panel"
        subtitle="Control portal login for students, parents and guardians"
      >
        <ToggleRow
          label="Login Allowed for Student"
          desc="Students can sign in to the student portal."
          checked={(form.studentEnabled ?? "1") === "1"}
          onChange={(v) => setBool("studentEnabled", v)}
        />
        <ToggleRow
          label="Login Allowed for Parent"
          desc="Parents can sign in to the parent portal."
          checked={(form.parentEnabled ?? "1") === "1"}
          onChange={(v) => setBool("parentEnabled", v)}
        />
        <ToggleRow
          label="Login Allowed for Guardian"
          desc="Guardians that are not the parent can sign in."
          checked={(form.guardianEnabled ?? "1") === "1"}
          onChange={(v) => setBool("guardianEnabled", v)}
        />
        <div className="max-w-md">
          <SelectField
            label="Additional Username Options"
            value={form.additionalUsername || "none"}
            onChange={(v) => set("additionalUsername", v)}
            options={[
              { value: "none", label: "Email only" },
              { value: "admission_no", label: "Admission No" },
              { value: "mobile", label: "Mobile Number" },
              { value: "email_mobile", label: "Email or Mobile Number" },
            ]}
          />
          <p className="text-xs text-gray-500 mt-1">
            Allow students/parents to sign in using these identifiers instead of email.
          </p>
        </div>
        <SettingsSaveBar onSave={commit} saving={saving} />
      </SettingsSection>
    </>
  )
}