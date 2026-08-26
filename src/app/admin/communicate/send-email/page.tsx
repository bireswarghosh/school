"use client"

import { useState } from "react"
import { Send, Plus, X, Mail, CheckCircle, XCircle } from "lucide-react"
import { useApi } from "@/lib/use-api"

interface SentEmail {
  id: number
  recipient: string
  subject: string
  date: string
  status: "Sent" | "Failed"
}

export default function SendEmailPage() {
  const { data: sentEmails, add } = useApi<SentEmail>("/api/communicate/email")
  const [recipientGroup, setRecipientGroup] = useState("All Students")
  const [individualEmail, setIndividualEmail] = useState("")
  const [individualEmails, setIndividualEmails] = useState<string[]>([])
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState("")

  const addIndividualEmail = () => {
    const trimmed = individualEmail.trim()
    if (trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && !individualEmails.includes(trimmed)) {
      setIndividualEmails([...individualEmails, trimmed])
      setIndividualEmail("")
    }
  }

  const removeEmail = (email: string) => {
    setIndividualEmails(individualEmails.filter(e => e !== email))
  }

  const handleSend = async () => {
    const recipient = recipientGroup === "Individual" ? individualEmails.join(", ") : recipientGroup
    if (!recipient || !subject || !message) return
    await add({ recipient, subject, message, attachments, date: new Date().toISOString().split("T")[0] })
    setSubject("")
    setMessage("")
    setAttachments("")
    setIndividualEmails([])
    setRecipientGroup("All Students")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Send Email</h1>
            <p className="text-blue-100 text-sm">Compose and send emails to recipients</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Compose Email</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Group</label>
              <select value={recipientGroup} onChange={e => setRecipientGroup(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white">
                <option>All Students</option>
                <option>All Staff</option>
                <option>Individual</option>
              </select>
            </div>
            {recipientGroup === "Individual" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Individual Email</label>
                <div className="flex gap-2">
                  <input type="email" value={individualEmail} onChange={e => setIndividualEmail(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addIndividualEmail() } }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Enter email address" />
                  <button onClick={addIndividualEmail} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"><Plus className="w-4 h-4" /></button>
                </div>
                {individualEmails.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {individualEmails.map(email => (
                      <span key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {email}
                        <button onClick={() => removeEmail(email)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Email subject" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" placeholder="Write your email message..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
              <input type="text" value={attachments} onChange={e => setAttachments(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="File names (comma separated)" />
            </div>
            <button onClick={handleSend} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md">
              <Send className="w-4 h-4" /> Send Email
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Sent Email Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Recipient</th>
                  <th className="text-left p-3">Subject</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {sentEmails.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-6 text-gray-400">No emails sent.</td></tr>
                ) : sentEmails.map((email, i) => (
                  <tr key={email.id} className={`border-t border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                    <td className="p-3 text-gray-500">{email.id}</td>
                    <td className="p-3 text-gray-800">{email.recipient}</td>
                    <td className="p-3 text-gray-600 max-w-[200px] truncate">{email.subject}</td>
                    <td className="p-3 text-gray-600">{email.date}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${email.status === "Sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {email.status === "Sent" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {email.status}
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
