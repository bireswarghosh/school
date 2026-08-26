"use client"

import { useState, useEffect } from "react"
import { Save, Check } from "lucide-react"

export default function PrintHeaderFooterPanel() {
  const [headerTitle, setHeaderTitle] = useState("Mount Carmel School")
  const [headerContent, setHeaderContent] = useState("Affiliated to CBSE | Established 1995")
  const [footerContent, setFooterContent] = useState("This is a computer generated document. Signature not required.")
  const [leftLogoUrl, setLeftLogoUrl] = useState("")
  const [rightLogoUrl, setRightLogoUrl] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/system-setting")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.headerTitle !== undefined) setHeaderTitle(data.headerTitle)
          if (data.headerContent !== undefined) setHeaderContent(data.headerContent)
          if (data.footerContent !== undefined) setFooterContent(data.footerContent)
          if (data.leftLogoUrl !== undefined) setLeftLogoUrl(data.leftLogoUrl)
          if (data.rightLogoUrl !== undefined) setRightLogoUrl(data.rightLogoUrl)
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
        body: JSON.stringify({ headerTitle, headerContent, footerContent, leftLogoUrl, rightLogoUrl }),
      })
      setSuccess(true)
    } catch { setSuccess(true) }
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <>
      {success && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4" />
          Print settings saved!
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Header & Footer Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Header Title</label>
            <input
              type="text"
              value={headerTitle}
              onChange={(e) => setHeaderTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Header Content</label>
            <textarea
              value={headerContent}
              onChange={(e) => setHeaderContent(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Footer Content</label>
            <textarea
              value={footerContent}
              onChange={(e) => setFooterContent(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Left Logo URL</label>
              <input
                type="text"
                value={leftLogoUrl}
                onChange={(e) => setLeftLogoUrl(e.target.value)}
                placeholder="https://example.com/left-logo.png"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Right Logo URL</label>
              <input
                type="text"
                value={rightLogoUrl}
                onChange={(e) => setRightLogoUrl(e.target.value)}
                placeholder="https://example.com/right-logo.png"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
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

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Preview</h3>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-300 flex items-center justify-between">
            {leftLogoUrl ? (
              <img src={leftLogoUrl} alt="Left Logo" className="h-12 w-auto object-contain" />
            ) : (
              <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">Logo</div>
            )}
            <div className="text-center">
              <h4 className="text-base font-bold text-gray-800">{headerTitle || "School Name"}</h4>
              <p className="text-xs text-gray-500">{headerContent}</p>
            </div>
            {rightLogoUrl ? (
              <img src={rightLogoUrl} alt="Right Logo" className="h-12 w-auto object-contain" />
            ) : (
              <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">Logo</div>
            )}
          </div>
          <div className="px-6 py-12 text-center text-sm text-gray-400">Document Content Area</div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-300 text-center">
            <p className="text-xs text-gray-500">{footerContent}</p>
          </div>
        </div>
      </div>
    </>
  )
}