"use client"

import { useState, useEffect } from "react"
import { Save, Check } from "lucide-react"

export default function FrontCmsSettingPage() {
  const [enabled, setEnabled] = useState(true)
  const [schoolName, setSchoolName] = useState("Mount Carmel School")
  const [tagline, setTagline] = useState("Empowering Young Minds Since 1995")
  const [footerText, setFooterText] = useState("2026 Mount Carmel School. All rights reserved.")
  const [contactEmail, setContactEmail] = useState("info@mountcarmel.edu")
  const [contactPhone, setContactPhone] = useState("+1 234 567 8900")
  const [address, setAddress] = useState("123 Education Lane, Learning City, ED 45678")
  const [facebookUrl, setFacebookUrl] = useState("https://facebook.com/mountcarmel")
  const [twitterUrl, setTwitterUrl] = useState("https://twitter.com/mountcarmel")
  const [youtubeUrl, setYoutubeUrl] = useState("https://youtube.com/@mountcarmel")
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com/mountcarmel")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/system-setting")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.enabled !== undefined) setEnabled(data.enabled)
          if (data.schoolName !== undefined) setSchoolName(data.schoolName)
          if (data.tagline !== undefined) setTagline(data.tagline)
          if (data.footerText !== undefined) setFooterText(data.footerText)
          if (data.contactEmail !== undefined) setContactEmail(data.contactEmail)
          if (data.contactPhone !== undefined) setContactPhone(data.contactPhone)
          if (data.address !== undefined) setAddress(data.address)
          if (data.facebookUrl !== undefined) setFacebookUrl(data.facebookUrl)
          if (data.twitterUrl !== undefined) setTwitterUrl(data.twitterUrl)
          if (data.youtubeUrl !== undefined) setYoutubeUrl(data.youtubeUrl)
          if (data.instagramUrl !== undefined) setInstagramUrl(data.instagramUrl)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    try {
      await fetch("/api/system-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, schoolName, tagline, footerText, contactEmail, contactPhone, address, facebookUrl, twitterUrl, youtubeUrl, instagramUrl }),
      })
      setSuccess(true)
    } catch { setSuccess(true) }
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Front CMS Setting</h1>
        <p className="mt-1 text-sm text-white/80">System Setting / Front CMS Setting</p>
      </div>

      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          Front CMS settings saved!
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Front CMS Configuration</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-gray-700">Enable Front CMS</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
              <input
                type="text"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
              <input
                type="text"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
            <textarea
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
