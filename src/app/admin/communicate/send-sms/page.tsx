"use client"

import { useState } from "react"
import { Send, MessageSquare, CheckCircle, XCircle } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface SmsRecord {
  id: number
  recipient: string
  message: string
  date: string
  status: "Sent" | "Failed"
}

export default function SendSmsPage() {
  const { data: smsLog, add } = useApi<SmsRecord>("/api/communicate/sms")
  const [recipientGroup, setRecipientGroup] = useState("All Students")
  const [phoneNumbers, setPhoneNumbers] = useState("")
  const [message, setMessage] = useState("")

  const handleSend = async () => {
    const recipient = recipientGroup === "Bulk" ? phoneNumbers : recipientGroup
    if (!recipient || !message) return
    await add({ recipient, message, date: new Date().toISOString().split("T")[0] })
    setMessage("")
    setPhoneNumbers("")
    setRecipientGroup("All Students")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Send SMS</h1>
            <p className="text-blue-100 text-sm">Send bulk SMS to students and staff</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Compose SMS</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Group</label>
              <select value={recipientGroup} onChange={e => setRecipientGroup(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white">
                <option>All Students</option>
                <option>All Staff</option>
                <option>Bulk</option>
              </select>
            </div>
            {recipientGroup === "Bulk" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Numbers</label>
                <textarea value={phoneNumbers} onChange={e => setPhoneNumbers(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" placeholder="Enter phone numbers (comma or newline separated)" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" placeholder="Type your SMS message..." />
              <p className="text-xs text-gray-400 mt-1">{message.length} / 160 characters</p>
            </div>
            <button onClick={handleSend} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md">
              <Send className="w-4 h-4" /> Send SMS
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">SMS Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Recipient</th>
                  <th className="text-left p-3">Message</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {smsLog.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-6 text-gray-400">No SMS records.</td></tr>
                ) : smsLog.map((sms, i) => (
                  <tr key={sms.id} className={`border-t border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                    <td className="p-3 text-gray-500">{sms.id}</td>
                    <td className="p-3 text-gray-800 max-w-[150px] truncate">{sms.recipient}</td>
                    <td className="p-3 text-gray-600 max-w-[200px] truncate">{sms.message}</td>
                    <td className="p-3 text-gray-600">{sms.date}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sms.status === "Sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {sms.status === "Sent" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {sms.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
