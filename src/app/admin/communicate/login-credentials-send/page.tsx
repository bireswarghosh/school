"use client"

import { useState } from "react"
import { Search, Send, UserCheck, Filter } from "lucide-react"
import { useApi } from "@/lib/use-api"
import { useClassesAndSections } from "@/lib/use-classes-sections"

interface User {
  id: number
  name: string
  username: string
  email: string
  mobile: string
  role: string
  classVal: string
  section: string
}

export default function LoginCredentialsSendPage() {
  const { classNames: classOptions, sectionNames: sectionOptions } = useClassesAndSections()
  const { data: users } = useApi<User>("/api/communicate/users")
  const [userType, setUserType] = useState("All")
  const [classVal, setClassVal] = useState("")
  const [section, setSection] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [sentMessage, setSentMessage] = useState<string | null>(null)

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    const filteredIds = filteredUsers.map(u => u.id)
    const allSelected = filteredIds.every(id => selectedIds.includes(id))
    setSelectedIds(allSelected ? selectedIds.filter(id => !filteredIds.includes(id)) : [...new Set([...selectedIds, ...filteredIds])])
  }

  const filteredUsers = users.filter(u => {
    if (userType !== "All" && u.role !== userType) return false
    if (classVal && u.classVal !== classVal) return false
    if (section && u.section !== section) return false
    return true
  })

  const handleSend = () => {
    if (selectedIds.length === 0) return
    const names = users.filter(u => selectedIds.includes(u.id)).map(u => u.name).join(", ")
    setSentMessage(`Login credentials sent successfully to: ${names}`)
    setSelectedIds([])
    setTimeout(() => setSentMessage(null), 4000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Send Login Credentials</h1>
            <p className="text-blue-100 text-sm">Send login credentials to selected users</p>
          </div>
        </div>
      </div>

      {sentMessage && (
        <div className="mb-6 px-4 py-3 bg-green-100 text-green-700 rounded-lg border border-green-200 text-sm">{sentMessage}</div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2"><Filter className="w-5 h-5 text-gray-500" /></div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">User Type</label>
            <select value={userType} onChange={e => setUserType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-sm">
              <option>All</option>
              <option>Student</option>
              <option>Staff</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Class</label>
            <select value={classVal} onChange={e => setClassVal(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-sm">
              <option value="">All</option>
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Section</label>
            <select value={section} onChange={e => setSection(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-sm">
              <option value="">All</option>
              {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md text-sm">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Users</h2>
          <button onClick={handleSend} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md text-sm">
            <Send className="w-4 h-4" /> Send ({selectedIds.length})
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                <th className="text-left p-3">
                  <input type="checkbox" checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.includes(u.id))} onChange={toggleSelectAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Username</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Mobile</th>
                <th className="text-left p-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-400">No users found.</td></tr>
              ) : filteredUsers.map((user, i) => (
                <tr key={user.id} className={`border-t border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                  <td className="p-3">
                    <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                  <td className="p-3 text-gray-500">{user.id}</td>
                  <td className="p-3 font-medium text-gray-800">{user.name}</td>
                  <td className="p-3 text-gray-600">{user.username}</td>
                  <td className="p-3 text-gray-600">{user.email}</td>
                  <td className="p-3 text-gray-600">{user.mobile}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "Student" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>{user.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
