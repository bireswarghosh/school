"use client"

import { useState } from "react"
import { Users, Shield, UserCog, GraduationCap, UsersRound } from "lucide-react"
import UsersPanel from "@/components/UsersPanel"
import RolesPermissionsPanel from "@/components/RolesPermissionsPanel"
import StudentsPanel from "@/components/StudentsPanel"
import ParentsPanel from "@/components/ParentsPanel"

type TabKey = "users" | "students" | "parents" | "permissions"

export default function UsersPermissionsPage() {
  const [tab, setTab] = useState<TabKey>("users")

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "users", label: "Users", icon: Users },
    { key: "students", label: "Students", icon: GraduationCap },
    { key: "parents", label: "Parents", icon: UsersRound },
    { key: "permissions", label: "Permissions", icon: Shield },
  ]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Users & Permissions</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / Users & Permissions</p>
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
        <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
          <UserCog className="h-3.5 w-3.5" /> Manage users and role permissions
        </div>
      </div>

      {tab === "users" && <UsersPanel />}
      {tab === "students" && <StudentsPanel />}
      {tab === "parents" && <ParentsPanel />}
      {tab === "permissions" && <RolesPermissionsPanel />}
    </div>
  )
}
