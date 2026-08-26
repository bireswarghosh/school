"use client"

import { useState, useEffect } from "react"
import { Settings, CalendarRange, CreditCard, Printer, Receipt, Archive, Languages, Coins, ListChecks, ShieldCheck, FileType, TableProperties } from "lucide-react"
import GeneralSettingsPanel from "@/components/GeneralSettingsPanel"
import SessionSettingsPanel from "@/components/SessionSettingsPanel"
import PaymentMethodsPanel from "@/components/PaymentMethodsPanel"
import PrintHeaderFooterPanel from "@/components/PrintHeaderFooterPanel"
import ThermalPrintPanel from "@/components/ThermalPrintPanel"
import BackupRestorePanel from "@/components/BackupRestorePanel"
import LanguagesPanel from "@/components/LanguagesPanel"
import CurrencyPanel from "@/components/CurrencyPanel"
import CustomFieldsPanel from "@/components/CustomFieldsPanel"
import CaptchaSettingsPanel from "@/components/CaptchaSettingsPanel"
import FileTypesPanel from "@/components/FileTypesPanel"
import SystemFieldsPanel from "@/components/SystemFieldsPanel"

type TabKey =
  | "general"
  | "session"
  | "payment"
  | "print"
  | "thermal"
  | "backup"
  | "languages"
  | "currency"
  | "custom-fields"
  | "captcha"
  | "file-types"
  | "system-fields"

const VALID_TABS: TabKey[] = [
  "general",
  "session",
  "payment",
  "print",
  "thermal",
  "backup",
  "languages",
  "currency",
  "custom-fields",
  "captcha",
  "file-types",
  "system-fields",
]

export default function GeneralSettingPage() {
  const [tab, setTab] = useState<TabKey>("general")

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab")
    if (tabParam && (VALID_TABS as string[]).includes(tabParam)) {
      setTab(tabParam as TabKey)
    }
  }, [])

  const selectTab = (key: TabKey) => {
    setTab(key)
    const url = new URL(window.location.href)
    if (key === "general") url.searchParams.delete("tab")
    else url.searchParams.set("tab", key)
    window.history.replaceState({}, "", url)
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "general", label: "General Setting", icon: Settings },
    { key: "session", label: "Session Setting", icon: CalendarRange },
    { key: "payment", label: "Payment Methods", icon: CreditCard },
    { key: "print", label: "Print Header Footer", icon: Printer },
    { key: "thermal", label: "Thermal Print", icon: Receipt },
    { key: "languages", label: "Languages", icon: Languages },
    { key: "currency", label: "Currency", icon: Coins },
    { key: "custom-fields", label: "Custom Fields", icon: ListChecks },
    { key: "captcha", label: "Captcha Setting", icon: ShieldCheck },
    { key: "file-types", label: "File Types", icon: FileType },
    { key: "system-fields", label: "System Fields", icon: TableProperties },
    { key: "backup", label: "Backup & Restore", icon: Archive },
  ]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">General Setting</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / General Setting</p>
      </div>

      <div className="flex items-center flex-wrap gap-1 border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => selectTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === key
                ? "text-[var(--primary)] border-[var(--primary)]"
                : "text-gray-500 hover:text-gray-700 border-transparent"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "general" && <GeneralSettingsPanel />}
      {tab === "session" && <SessionSettingsPanel />}
      {tab === "payment" && <PaymentMethodsPanel />}
      {tab === "print" && <PrintHeaderFooterPanel />}
      {tab === "thermal" && <ThermalPrintPanel />}
      {tab === "backup" && <BackupRestorePanel />}
      {tab === "languages" && <LanguagesPanel />}
      {tab === "currency" && <CurrencyPanel />}
      {tab === "custom-fields" && <CustomFieldsPanel />}
      {tab === "captcha" && <CaptchaSettingsPanel />}
      {tab === "file-types" && <FileTypesPanel />}
      {tab === "system-fields" && <SystemFieldsPanel />}
    </div>
  )
}