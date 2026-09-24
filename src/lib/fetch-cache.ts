"use client"

// Tiny in-memory HTTP GET cache with deduplication.
// Dramatically cuts redundant fetch() calls on client-side navigation
// (sidebar menu, school info, currency, session lookups …) so repeated
// page visits feel instant. Mutations call invalidate() to drop entries,
// and high-frequency pages pass force -> fresh data.
//
// This is SAFE for multi-request GET endpoints AND for per-school data
// because it only ever helps when the SAME endpoint URL is fetched again
// within the TTL. Mutating endpoints are never cached.

type CacheEntry = { value: unknown; at: number }
const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<unknown>>()
const TTL_MS = 30_000
const MAX_ENTRIES = 250

function sweep() {
  if (cache.size < MAX_ENTRIES) return
  const now = Date.now()
  const entries = [...cache.entries()].filter(([, e]) => now - e.at >= TTL_MS)
  for (const [k] of entries) cache.delete(k)
  if (cache.size >= MAX_ENTRIES) {
    // hard cap: drop oldest
    const sorted = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)
    const toDrop = Math.ceil(cache.size * 0.4)
    for (let i = 0; i < toDrop; i++) cache.delete(sorted[i][0])
  }
}

export function invalidate(url: string) {
  cache.delete(url)
}

export async function fetchCached<T>(
  url: string,
  opts?: { ttl?: number; force?: boolean }
): Promise<T> {
  const ttl = opts?.ttl ?? TTL_MS
  const hit = cache.get(url)
  if (!opts?.force && hit && Date.now() - hit.at < ttl) {
    return hit.value as T
  }

  const pending = inflight.get(url)
  if (pending) return pending as Promise<T>

  const p = (async () => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch ${url}`)
    return (await res.json()) as T
  })()
    .then((value) => {
      cache.set(url, { value, at: Date.now() })
      sweep()
      return value
    })
    .catch((e) => {
      inflight.delete(url)
      throw e
    })

  inflight.set(url, p)
  try {
    return (await p) as T
  } finally {
    inflight.delete(url)
  }
}
