"use client"

import { useApi } from "@/lib/use-api"

type InventoryItem = {
  id: number
  item: string
  category: string
  issueDate: string
  returnDate: string
  status: "Issued" | "Returned"
}

export default function InventoryPage() {
  const { data: items, loading } = useApi<InventoryItem>("/api/alumni/inventory")

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Inventory</h1>
        <p className="mt-1 text-sm text-white/80">Alumni / Inventory</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Item</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Issue Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Return Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{item.item}</td>
                  <td className="px-4 py-3 text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-gray-600">{item.issueDate}</td>
                  <td className="px-4 py-3 text-gray-600">{item.returnDate}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === "Returned" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{item.status}</span></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No inventory records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-sm text-gray-500">Showing {items.length} records</div>
      </div>
    </div>
  )
}
