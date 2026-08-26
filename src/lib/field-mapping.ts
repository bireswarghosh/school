export function camelToSnake(obj: Record<string, any>, map?: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (map?.[key]) {
      result[map[key]] = value
    } else {
      result[key.replace(/([A-Z])/g, "_$1").toLowerCase()] = value
    }
  }
  return result
}

export function snakeToCamel(obj: Record<string, any>, map?: Record<string, string>): Record<string, any> {
  const reversed = map ? Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) : undefined
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (reversed?.[key]) {
      result[reversed[key]] = value
    } else {
      result[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = value
    }
  }
  return result
}

export function mapResponse(items: Record<string, any>[], map?: Record<string, string>): Record<string, any>[]
export function mapResponse(item: Record<string, any> | null, map?: Record<string, string>): Record<string, any> | null
export function mapResponse(items: any, map?: Record<string, string>): any {
  if (Array.isArray(items)) return items.map((i) => snakeToCamel(i, map))
  if (items && typeof items === "object") return snakeToCamel(items, map)
  return items
}
