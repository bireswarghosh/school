"use client"

import { useState, useEffect } from "react"
import { Settings, CalendarRange, CreditCard, Printer, Receipt, Archive, Languages, Coins, ListChecks, ShieldCheck, FileType, TableProperties, Palette, Smartphone, Users, Wallet, Hash, ClipboardCheck, HardDrive, MessagesSquare, MessageSquare, Mail, Wrench, Settings2, Bell, Image as ImageIcon } from "lucide-react"
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
import AppearancePanel from "@/components/AppearancePanel"
import MobileAppSettingsPanel from "@/components/MobileAppSettingsPanel"
import StudentGuardianPanel from "@/components/StudentGuardianPanel"
import FeesSettingsPanel from "@/components/FeesSettingsPanel"
import IdAutoGenerationPanel from "@/components/IdAutoGenerationPanel"
import AttendanceTypePanel from "@/components/AttendanceTypePanel"
import GoogleDriveSettingsPanel from "@/components/GoogleDriveSettingsPanel"
import NotificationSettingsPanel from "@/components/NotificationSettingsPanel"
import WhatsAppSettingsPanel from "@/components/WhatsAppSettingsPanel"
import SmsSettingsPanel from "@/components/SmsSettingsPanel"
import EmailSettingsPanel from "@/components/EmailSettingsPanel"
import ChatSettingsPanel from "@/components/ChatSettingsPanel"
import MaintenancePanel from "@/components/MaintenancePanel"
import MiscSettingsPanel from "@/components/MiscSettingsPanel"

type TabKey =
  | "general"
  | "appearance"
  | "mobile-app"
  | "student-guardian"
  | "fees"
  | "id-auto"
  | "attendance-type"
  | "google-drive"
  | "notification"
  | "chat"
  | "maintenance"
  | "misc"
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
  "appearance",
  "mobile-app",
  "student-guardian",
  "fees",
  "id-auto",
  "attendance-type",
  "google-drive",
  "notification",
  "chat",
  "maintenance",
  "misc",
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

// Map legacy tab names so old URLs still resolve into the merged Appearance tab
const LEGACY_REDIRECT: Record<string, TabKey> = {
  logo: "appearance",
  "login-bg": "appearance",
  theme: "appearance",
}

export default function GeneralSettingPage() {
  const [tab, setTab] = useState<TabKey>("general")

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab")
    if (tabParam) {
      const resolved = LEGACY_REDIRECT[tabParam] || tabParam
      if ((VALID_TABS as string[]).includes(resolved)) {
        setTab(resolved as TabKey)
      }
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
    { key: "notification", label: "Notification Setting", icon: Bell },
    { key: "appearance", label: "Appearance", icon: ImageIcon },
    { key: "mobile-app", label: "Mobile App", icon: Smartphone },
    { key: "student-guardian", label: "Student / Guardian Panel", icon: Users },
    { key: "fees", label: "Fees", icon: Wallet },
    { key: "id-auto", label: "ID Auto Generation", icon: Hash },
    { key: "attendance-type", label: "Attendance Type", icon: ClipboardCheck },
    { key: "google-drive", label: "Google Drive Setting", icon: HardDrive },
    { key: "chat", label: "Chat", icon: MessagesSquare },
    { key: "maintenance", label: "Maintenance", icon: Wrench },
    { key: "misc", label: "Miscellaneous", icon: Settings2 },
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

  const panel = (key: TabKey) =>
    ({
      general: <GeneralSettingsPanel />,
      appearance: <AppearancePanel />,
      "mobile-app": <MobileAppSettingsPanel />,
      "student-guardian": <StudentGuardianPanel />,
      fees: <FeesSettingsPanel />,
      "id-auto": <IdAutoGenerationPanel />,
      "attendance-type": <AttendanceTypePanel />,
      "google-drive": <GoogleDriveSettingsPanel />,
      notification: <NotificationTabsPanel />,
      chat: <ChatSettingsPanel />,
      maintenance: <MaintenancePanel />,
      misc: <MiscSettingsPanel />,
      session: <SessionSettingsPanel />,
      payment: <PaymentMethodsPanel />,
      print: <PrintHeaderFooterPanel />,
      thermal: <ThermalPrintPanel />,
      languages: <LanguagesPanel />,
      currency: <CurrencyPanel />,
      "custom-fields": <CustomFieldsPanel />,
      captcha: <CaptchaSettingsPanel />,
      "file-types": <FileTypesPanel />,
      "system-fields": <SystemFieldsPanel />,
      backup: <BackupRestorePanel />,
    })[key]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">General Setting</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / General Setting</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="md:w-64 shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-2 md:sticky md:top-4">
            <p className="px-3 pt-2 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Settings</p>
            <div className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-1 md:pb-0">
              {tabs.map(({ key, label, icon: Icon }) => {
                const active = tab === key
                return (
                  <button
                    key={key}
                    onClick={() => selectTab(key)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                      active
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-[var(--primary)]"}`} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {panel(tab)}
        </div>
      </div>
    </div>
  )
}

type SubTabKey = "notification" | "whatsapp" | "sms" | "email"

function NotificationTabsPanel() {
  const [sub, setSub] = useState<SubTabKey>("notification")

  const subTabs: { key: SubTabKey; label: string; icon: React.ElementType }[] = [
    { key: "notification", label: "Notification Setting", icon: Bell },
    { key: "whatsapp", label: "WhatsApp Messaging", icon: MessageSquare },
    { key: "sms", label: "SMS Setting", icon: Smartphone },
    { key: "email", label: "Email Setting", icon: Mail },
  ]

  return (
    <div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-4 mb-5">
        <h3 className="text-base font-semibold text-gray-800">Notification Setting</h3>
        <p className="text-xs text-gray-500 mt-0.5">Configure how your school sends notifications</p>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 mb-5">
        {subTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              sub === key ? "text-[var(--primary)] border-[var(--primary)]" : "text-gray-500 hover:text-gray-700 border-transparent"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {sub === "notification" && <NotificationSettingsPanel />}
      {sub === "whatsapp" && <WhatsAppSettingsPanel />}
      {sub === "sms" && <SmsSettingsPanel />}
      {sub === "email" && <EmailSettingsPanel />}
    </div>
  )
}