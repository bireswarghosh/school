"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchCached, invalidate } from "@/lib/fetch-cache"

const notifyMenuChange = (endpoint: string) => {
  if (endpoint.includes("sidebar-menu")) {
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event("sidebar-visibility-changed"))
  }
}

export function useApi<T extends { id?: number }>(endpoint: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetchCached<T[]>(endpoint)
      setData(result)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => { fetchData() }, [fetchData])

  const add = async (item: any) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Failed to create")
    }
    const saved = await res.json()
    setData((prev) => [...prev, saved])
    invalidate(endpoint)
    return saved
  }

  const update = async (id: number, item: any) => {
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...item }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Failed to update")
    }
    const saved = await res.json()
    setData((prev) => prev.map((d) => (d.id === id ? saved : d)))
    invalidate(endpoint)
    return saved
  }

  const remove = async (id: number) => {
    const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Failed to delete")
    }
    setData((prev) => prev.filter((d) => d.id !== id))
    invalidate(endpoint)
  }

  return { data, loading, error, add, update, remove, refetch: fetchData }
}
