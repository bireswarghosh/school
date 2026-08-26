"use client"

import { useEffect, useState, useCallback } from "react"

export function useReportData<T>(endpoint: string, params?: Record<string, string>) {
  const qs = new URLSearchParams(params || {}).toString()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(qs ? `${endpoint}?${qs}` : endpoint)
      if (!res.ok) throw new Error("Failed to load data")
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
      setError(null)
    } catch (e: any) {
      setError(e.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [endpoint, qs])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}

export function useReportDataObject<T>(endpoint: string, params?: Record<string, string>) {
  const qs = new URLSearchParams(params || {}).toString()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(qs ? `${endpoint}?${qs}` : endpoint)
      if (!res.ok) throw new Error("Failed to load data")
      setData(await res.json())
      setError(null)
    } catch (e: any) {
      setError(e.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [endpoint, qs])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}
