"use client"

import { useState } from "react"
import { Bell, MessageSquare, Smartphone, Mail, Settings2 } from "lucide-react"
import NotificationSettingsPanel from "@/components/NotificationSettingsPanel"
import WhatsAppSettingsPanel from "@/components/WhatsAppSettingsPanel"
import SmsSettingsPanel from "@/components/SmsSettingsPanel"
import EmailSettingsPanel from "@/components/EmailSettingsPanel"

type TabKey = "notification" | "whatsapp" | "sms" | "email"

export default function NotificationSettingPage() {
  const [tab, setTab] = useState<TabKey>("notification")

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "notification", label: "Notification Setting", icon: Bell },
    { key: "whatsapp", label: "WhatsApp Messaging", icon: MessageSquare },
    { key: "sms", label: "SMS Setting", icon: Smartphone },
    { key: "email", label: "Email Setting", icon: Mail },
  ]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Notification Setting</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / Notification Setting</p>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? "text-[var(--primary)] border-[var(--primary)]"
                : "text-gray-500 hover:text-gray-700 border-transparent"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
        <div className="ml-auto hidden lg:flex items-center gap-1.5 text-xs text-gray-400">
          <Settings2 className="h-3.5 w-3.5" /> Configure notification channels
        </div>
      </div>

      {tab === "notification" && <NotificationSettingsPanel />}
      {tab === "whatsapp" && <WhatsAppSettingsPanel />}
      {tab === "sms" && <SmsSettingsPanel />}
      {tab === "email" && <EmailSettingsPanel />}
    </div>
  )
}