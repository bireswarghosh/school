"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Currency = {
  id: number
  name: string
  code: string
  symbol: string
  isActive: boolean
  isDefault: boolean
}

const CurrencyContext = createContext<{ symbol: string; currency: Currency | null }>({
  symbol: "$",
  currency: null,
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/system-setting/currency")
        const list: Currency[] = await res.json()
        const def = list.find((c) => c.isDefault && c.isActive) || list.find((c) => c.isDefault) || list[0]
        setCurrency(def || null)
      } catch {
        setCurrency(null)
      }
    })()
  }, [])

  const symbol = currency?.symbol || "$"

  return (
    <CurrencyContext.Provider value={{ symbol, currency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
