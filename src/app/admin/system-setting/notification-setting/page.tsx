"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NotificationSettingPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/system-setting/general-setting?tab=notification")
  }, [router])

  return (
    <div className="p-6 text-sm text-gray-500">Redirecting to Notification Setting…</div>
  )
}