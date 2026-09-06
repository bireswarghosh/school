"use client"

import { useSettingsForm, SettingsSection, SettingsSaveBar, PanelStatus, ToggleRow, Field } from "@/components/settings-bits"

export default function FeesSettingsPanel() {
  const { form, set, setBool, loading, error, success, commit, saving } = useSettingsForm("fees.")

  return (
    <>
      <PanelStatus loading={loading} error={error} success={success} successMessage="Fees settings saved!" />
      <SettingsSection title="Fees" subtitle="Fee collection and receipt configuration">
        <ToggleRow
          label="Offline Bank Payment"
          desc="Allow parents to pay fees via offline bank transfer from the portal."
          checked={(form.offlineBankPayment ?? "0") === "1"}
          onChange={(v) => setBool("offlineBankPayment", v)}
        />
        <ToggleRow
          label="Enable Deposit Fee"
          desc="Allow partial/deposit payments toward a fee group."
          checked={(form.depositEnabled ?? "0") === "1"}
          onChange={(v) => setBool("depositEnabled", v)}
        />
        <ToggleRow
          label="Allow Back Date"
          desc="Allow fee payments to be recorded on a past date."
          checked={(form.backDate ?? "0") === "1"}
          onChange={(v) => setBool("backDate", v)}
        />
        <ToggleRow
          label="Lock Panel If Fees Due"
          desc="Require clearing remaining fees for a group before other actions."
          checked={(form.lockPanelIfFeeRemaining ?? "0") === "1"}
          onChange={(v) => setBool("lockPanelIfFeeRemaining", v)}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
          <Field label="Grace Days" value={form.graceDays ?? "0"} onChange={(v) => set("graceDays", v)} placeholder="0" />
          <Field
            label="Receipt Print Copies"
            value={form.printReceiptCopies ?? "2"}
            onChange={(v) => set("printReceiptCopies", v)}
            placeholder="2"
          />
          <Field
            label="Print Group On Single Page"
            value={form.singleGroupPrintPage ?? "0"}
            onChange={(v) => set("singleGroupPrintPage", v)}
            placeholder="0 = No, 1 = Yes"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Instructions</label>
          <textarea
            value={form.depositInstructions || ""}
            onChange={(e) => set("depositInstructions", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Details for Offline Payment</label>
          <textarea
            value={form.bankAccountInstructions || ""}
            onChange={(e) => set("bankAccountInstructions", e.target.value)}
            rows={2}
            placeholder="Account name, number, IFSC…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <SettingsSaveBar onSave={commit} saving={saving} />
      </SettingsSection>
    </>
  )
}