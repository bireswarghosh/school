"use client"

// Generic Excel-like pricing matrix for Variable Products.
// Rows = variants (sizes), Columns = components (grouped), Cells = price.
// Size-independent components render one merged cell (variantId null).
// Supports: inline edit, arrow/Tab/Enter navigation, drag multi-select,
// Ctrl+C / Ctrl+V (Excel TSV), fill down/right, bulk price, clear.

import { useMemo, useRef, useState, useCallback } from "react"
import { Loader2 } from "lucide-react"

export type VpGroup = { id: number; name: string; displayOrder?: number }
export type VpComponent = {
  id: number
  name: string
  shortName?: string | null
  code?: string | null
  category?: string | null
  groupId?: number | null
  gender?: string | null
  color?: string | null
  sizeDependent?: boolean
  isActive?: boolean
  displayOrder?: number
}
export type VpVariant = { id: number; name: string; code?: string | null; isActive?: boolean; displayOrder?: number }
export type VpPrice = { componentId: number; variantId: number | null; price: number | null }

export type CellRef = { componentId: number; variantId: number | null; price: number | null }

type Props = {
  groups: VpGroup[]
  components: VpComponent[]
  variants: VpVariant[]
  prices: VpPrice[]
  symbol: string
  saving?: boolean
  onSave: (cells: CellRef[]) => Promise<boolean>
}

export const cellKey = (componentId: number, variantId: number | null) => `${componentId}:${variantId ?? 0}`

const fmtPrice = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === "") return ""
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return String(Math.round(n * 100) / 100)
}

export default function VariableProductMatrix({ groups, components, variants, prices, symbol, saving, onSave }: Props) {
  // Ordered columns: by group order, then component display order
  const orderedComponents = useMemo(() => {
    const groupOrder = new Map(groups.map((g, i) => [g.id, g.displayOrder ?? i]))
    const active = components.filter((c) => c.isActive !== false)
    return [...active].sort((a, b) => {
      const ga = a.groupId ? groupOrder.get(a.groupId) ?? 9999 : 9998
      const gb = b.groupId ? groupOrder.get(b.groupId) ?? 9999 : 9998
      if (ga !== gb) return ga - gb
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.id - b.id
    })
  }, [components, groups])

  const orderedVariants = useMemo(() => variants.filter((v) => v.isActive !== false), [variants])

  // Column group headers: [{ name, span }]
  const columnGroups = useMemo(() => {
    const out: { name: string; span: number }[] = []
    for (const c of orderedComponents) {
      const gName = c.groupId ? groups.find((g) => g.id === c.groupId)?.name || "" : ""
      const last = out[out.length - 1]
      if (last && last.name === gName) last.span++
      else out.push({ name: gName, span: 1 })
    }
    return out
  }, [orderedComponents, groups])

  // Draft model: `edits` holds only cells the user has touched (string input);
  // display value falls back to the saved price. No effects needed — when the
  // parent refreshes `prices` after a save, `edits` is cleared in handleSave.
  const baseMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of prices) m.set(cellKey(p.componentId, p.variantId), fmtPrice(p.price))
    return m
  }, [prices])

  const [edits, setEdits] = useState<Record<string, string>>({})

  const getDraft = useCallback(
    (componentId: number, variantId: number | null) => {
      const k = cellKey(componentId, variantId)
      return k in edits ? edits[k] : baseMap.get(k) ?? ""
    },
    [edits, baseMap]
  )

  const setDraft = useCallback((componentId: number, variantId: number | null, value: string) => {
    const key = cellKey(componentId, variantId)
    setEdits((prev) => ({ ...prev, [key]: value }))
  }, [])

  const dirtyKeys = useMemo(() => {
    return Object.keys(edits).filter((k) => {
      const base = baseMap.get(k) ?? ""
      const cur = (edits[k] ?? "").trim()
      if (cur === "") return base !== ""
      const n = Number(cur)
      if (Number.isNaN(n)) return false
      return base === "" || Math.abs(Number(base) - n) > 0.0001
    })
  }, [edits, baseMap])

  // ---- Selection model (grid coordinates over variant rows x component cols) ----
  const [sel, setSel] = useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null)
  const selecting = useRef(false)
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  const selNorm = useMemo(() => {
    if (!sel) return null
    return { r1: Math.min(sel.r1, sel.r2), r2: Math.max(sel.r1, sel.r2), c1: Math.min(sel.c1, sel.c2), c2: Math.max(sel.c1, sel.c2) }
  }, [sel])

  const inSelection = (r: number, c: number) =>
    !!selNorm && r >= selNorm.r1 && r <= selNorm.r2 && c >= selNorm.c1 && c <= selNorm.c2

  const cellAt = (r: number, c: number): { componentId: number; variantId: number | null } | null => {
    const comp = orderedComponents[c]
    if (!comp) return null
    if (comp.sizeDependent === false) return { componentId: comp.id, variantId: null }
    const v = orderedVariants[r]
    if (!v) return null
    return { componentId: comp.id, variantId: v.id }
  }

  const focusCell = (r: number, c: number) => {
    const cell = cellAt(r, c)
    if (!cell) return
    const el = inputRefs.current.get(cellKey(cell.componentId, cell.variantId))
    if (el) {
      el.focus()
      el.select()
      el.scrollIntoView({ block: "nearest", inline: "nearest" })
    }
  }

  const moveFocus = (r: number, c: number, dr: number, dc: number) => {
    let nr = r + dr
    let nc = c + dc
    if (nr < 0 || nr >= Math.max(orderedVariants.length, 1)) return
    if (nc < 0 || nc >= orderedComponents.length) return
    // Skip merged cells (size-independent columns are only focusable at row 0)
    const comp = orderedComponents[nc]
    if (comp && comp.sizeDependent === false && nr !== 0) nr = 0
    setSel({ r1: nr, c1: nc, r2: nr, c2: nc })
    focusCell(nr, nc)
  }

  // ---- Clipboard helpers ----
  const selectionCells = useCallback((): { r: number; c: number; componentId: number; variantId: number | null }[] => {
    const s = selNorm
    if (!s) return []
    const out: { r: number; c: number; componentId: number; variantId: number | null }[] = []
    for (let r = s.r1; r <= s.r2; r++) {
      for (let c = s.c1; c <= s.c2; c++) {
        const cell = cellAt(r, c)
        if (!cell) continue
        // Merged size-independent cell belongs to row 0 only
        if (cell.variantId === null && r !== 0) continue
        out.push({ r, c, ...cell })
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selNorm, orderedComponents, orderedVariants])

  const copySelection = useCallback(() => {
    const s = selNorm
    if (!s) return
    const lines: string[] = []
    for (let r = s.r1; r <= s.r2; r++) {
      const row: string[] = []
      for (let c = s.c1; c <= s.c2; c++) {
        const cell = cellAt(r, c)
        if (!cell) { row.push(""); continue }
        if (cell.variantId === null && r !== s.r1) continue
        row.push(getDraft(cell.componentId, cell.variantId))
      }
      lines.push(row.join("\t"))
    }
    navigator.clipboard?.writeText(lines.join("\n")).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selNorm, getDraft])

  const [pastePreview, setPastePreview] = useState<{ changes: { label: string; from: string; to: string }[]; errors: string[]; apply: () => void } | null>(null)

  const parseGrid = (text: string): string[][] =>
    text
      .replace(/\r/g, "")
      .split("\n")
      .filter((l, i, arr) => !(l.trim() === "" && i === arr.length - 1))
      .map((line) => (line.includes("\t") ? line.split("\t") : line.split(",")))

  const buildPastePreview = (text: string, startR: number, startC: number) => {
    const grid = parseGrid(text)
    if (grid.length === 0) return
    const changes: { label: string; from: string; to: string; componentId: number; variantId: number | null; value: string }[] = []
    const errors: string[] = []
    grid.forEach((row, ri) => {
      row.forEach((raw, ci) => {
        const r = startR + ri
        const c = startC + ci
        const cell = cellAt(r, c)
        if (!cell) return
        const comp = orderedComponents[c]
        const vName = cell.variantId === null ? "Common" : orderedVariants[r]?.name || `Row ${r + 1}`
        const label = `${vName} / ${comp?.name || "?"}`
        const val = String(raw ?? "").trim()
        if (val === "") return
        const clean = val.replace(/[^\d.\-]/g, "")
        const n = Number(clean)
        if (clean === "" || Number.isNaN(n)) {
          errors.push(`Invalid price at ${label}: "${val}"`)
          return
        }
        if (n < 0) {
          errors.push(`Price cannot be negative at ${label}`)
          return
        }
        const from = getDraft(cell.componentId, cell.variantId)
        const to = fmtPrice(n)
        if (from !== to) changes.push({ label, from, to, componentId: cell.componentId, variantId: cell.variantId, value: to })
      })
    })
    if (changes.length === 0 && errors.length === 0) return
    setPastePreview({
      changes: changes.map(({ label, from, to }) => ({ label, from, to })),
      errors,
      apply: () => {
        for (const ch of changes) setDraft(ch.componentId, ch.variantId, ch.value)
      },
    })
  }

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text/plain")
      if (!text) return
      e.preventDefault()
      const s = selNorm
      const startR = s ? s.r1 : 0
      const startC = s ? s.c1 : 0
      const grid = parseGrid(text)
      if (grid.length === 1 && grid[0].length === 1) {
        // Single value — put directly into the focused/first selected cell
        const cell = cellAt(startR, startC)
        if (cell) {
          const val = grid[0][0].trim()
          if (val === "") setDraft(cell.componentId, cell.variantId, "")
          else {
            const n = Number(val.replace(/[^\d.\-]/g, ""))
            if (Number.isNaN(n) || n < 0) setPastePreview({ changes: [], errors: [`Invalid price: "${val}"`], apply: () => {} })
            else setDraft(cell.componentId, cell.variantId, fmtPrice(n))
          }
        }
        return
      }
      buildPastePreview(text, startR, startC)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selNorm, orderedComponents, orderedVariants, edits, baseMap]
  )

  // ---- Toolbar bulk operations ----
  const applyToSelection = (fn: (componentId: number, variantId: number | null, current: string) => string) => {
    for (const { componentId, variantId } of selectionCells()) {
      const cur = getDraft(componentId, variantId)
      const next = fn(componentId, variantId, cur)
      if (next !== cur) setDraft(componentId, variantId, next)
    }
  }

  const [bulkPrice, setBulkPrice] = useState("")
  const applyBulkPrice = () => {
    const val = bulkPrice.trim()
    if (val === "") return
    const n = Number(val.replace(/[^\d.\-]/g, ""))
    if (Number.isNaN(n) || n < 0) return
    applyToSelection(() => fmtPrice(n))
    setBulkPrice("")
  }

  const fillDown = () => {
    const s = selNorm
    if (!s) return
    for (let c = s.c1; c <= s.c2; c++) {
      const src = cellAt(s.r1, c)
      if (!src) continue
      const val = getDraft(src.componentId, src.variantId)
      for (let r = s.r1 + 1; r <= s.r2; r++) {
        const cell = cellAt(r, c)
        if (!cell || cell.variantId === null) continue
        setDraft(cell.componentId, cell.variantId, val)
      }
    }
  }

  const fillRight = () => {
    const s = selNorm
    if (!s) return
    for (let r = s.r1; r <= s.r2; r++) {
      const src = cellAt(r, s.c1)
      if (!src) continue
      const val = getDraft(src.componentId, src.variantId)
      for (let c = s.c1 + 1; c <= s.c2; c++) {
        const cell = cellAt(r, c)
        if (!cell) continue
        if (cell.variantId === null && r !== 0) continue
        setDraft(cell.componentId, cell.variantId, val)
      }
    }
  }

  const copyPreviousPrice = () => {
    // For each selected cell, take the price from the row above (previous size)
    const s = selNorm
    if (!s) return
    for (let c = s.c1; c <= s.c2; c++) {
      for (let r = s.r1; r <= s.r2; r++) {
        const cell = cellAt(r, c)
        if (!cell || cell.variantId === null) continue
        const above = cellAt(r - 1, c)
        if (!above || above.variantId === null) continue
        setDraft(cell.componentId, cell.variantId, getDraft(above.componentId, above.variantId))
      }
    }
  }

  const clearSelection = () => applyToSelection(() => "")

  // ---- Keyboard handling on the grid container ----
  const handleKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    const ctrl = e.ctrlKey || e.metaKey
    if (ctrl && e.key.toLowerCase() === "c") {
      if (selNorm && (selNorm.r1 !== selNorm.r2 || selNorm.c1 !== selNorm.c2)) {
        e.preventDefault()
        copySelection()
      }
      return
    }
    if (ctrl && e.key.toLowerCase() === "d") { e.preventDefault(); fillDown(); return }
    if (ctrl && e.key.toLowerCase() === "r") { e.preventDefault(); fillRight(); return }
    switch (e.key) {
      case "ArrowUp": e.preventDefault(); moveFocus(r, c, -1, 0); break
      case "ArrowDown": e.preventDefault(); moveFocus(r, c, 1, 0); break
      case "ArrowLeft": {
        const el = e.target as HTMLInputElement
        if (el.selectionStart === 0) { e.preventDefault(); moveFocus(r, c, 0, -1) }
        break
      }
      case "ArrowRight": {
        const el = e.target as HTMLInputElement
        if (el.selectionStart === el.value.length) { e.preventDefault(); moveFocus(r, c, 0, 1) }
        break
      }
      case "Enter": e.preventDefault(); moveFocus(r, c, 1, 0); break
      case "Tab": {
        const lastCol = c >= orderedComponents.length - 1
        if (!e.shiftKey && lastCol && r < orderedVariants.length - 1) {
          e.preventDefault()
          moveFocus(r + 1, 0, 0, 0)
          setSel({ r1: r + 1, c1: 0, r2: r + 1, c2: 0 })
          focusCell(r + 1, 0)
        }
        break
      }
      case "Delete":
      case "Backspace": {
        if (selNorm && (selNorm.r1 !== selNorm.r2 || selNorm.c1 !== selNorm.c2)) {
          e.preventDefault()
          clearSelection()
        }
        break
      }
      case "Escape": setSel(null); break
    }
  }

  // ---- Save ----
  const handleSave = async () => {
    const changed: CellRef[] = []
    for (const key of dirtyKeys) {
      const [cid, vid] = key.split(":").map(Number)
      const raw = (edits[key] ?? "").trim()
      if (raw !== "") {
        const n = Number(raw)
        if (Number.isNaN(n) || n < 0) continue
        changed.push({ componentId: cid, variantId: vid || null, price: Number(fmtPrice(n)) })
      } else {
        changed.push({ componentId: cid, variantId: vid || null, price: null })
      }
    }
    if (changed.length === 0) {
      setEdits({})
      return true
    }
    const ok = await onSave(changed)
    if (ok) setEdits({})
    return ok
  }

  const hasChanges = dirtyKeys.length > 0

  const inputProps = (componentId: number, variantId: number | null, r: number, c: number) => ({
    ref: (el: HTMLInputElement | null) => {
      const k = cellKey(componentId, variantId)
      if (el) inputRefs.current.set(k, el)
      else inputRefs.current.delete(k)
    },
    value: getDraft(componentId, variantId),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      if (v === "" || /^-?\d*\.?\d*$/.test(v)) setDraft(componentId, variantId, v)
    },
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
    onMouseDown: (e: React.MouseEvent) => {
      if (e.shiftKey && sel) {
        e.preventDefault()
        setSel({ ...sel, r2: r, c2: c })
        return
      }
      selecting.current = true
      setSel({ r1: r, c1: c, r2: r, c2: c })
    },
    onMouseEnter: () => {
      if (selecting.current && sel) setSel((prev) => (prev ? { ...prev, r2: r, c2: c } : prev))
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, r, c),
    className: "w-full min-w-[64px] px-1.5 py-1 text-right text-xs bg-transparent focus:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[var(--primary)] rounded-sm",
    inputMode: "decimal" as const,
    "aria-label": `Price for ${orderedComponents[c]?.name || ""} ${variantId === null ? "" : orderedVariants[r]?.name || ""}`,
  })

  const tdClass = (r: number, c: number) =>
    `border border-gray-200 p-0 ${inSelection(r, c) ? "bg-blue-100/60" : r % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1">
          <span className="text-gray-500 font-medium">{symbol}</span>
          <input
            type="text"
            inputMode="decimal"
            value={bulkPrice}
            onChange={(e) => setBulkPrice(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applyBulkPrice() }}
            placeholder="Bulk price"
            className="w-20 px-1 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
          <button onClick={applyBulkPrice} className="px-2 py-0.5 bg-[var(--primary)] text-white rounded font-medium hover:opacity-90">Apply to selection</button>
        </div>
        <button onClick={copyPreviousPrice} className="px-2.5 py-1.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Copy previous price</button>
        <button onClick={fillDown} className="px-2.5 py-1.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 text-gray-700 font-medium" title="Ctrl+D">Fill down</button>
        <button onClick={fillRight} className="px-2.5 py-1.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 text-gray-700 font-medium" title="Ctrl+R">Fill right</button>
        <button onClick={copySelection} className="px-2.5 py-1.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 text-gray-700 font-medium" title="Ctrl+C">Copy</button>
        <button onClick={clearSelection} className="px-2.5 py-1.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 text-red-600 font-medium" title="Delete key">Clear cells</button>
        <span className="ml-auto text-gray-400 hidden md:inline">Drag to select · Ctrl+C/V Excel copy-paste · Ctrl+D fill down · Ctrl+R fill right · Enter ↓ · Tab →</span>
      </div>

      {/* Desktop / tablet matrix */}
      <div
        className="hidden md:block overflow-auto max-h-[70vh] border border-gray-200 rounded-lg"
        onPaste={handlePaste}
        onMouseUp={() => { selecting.current = false }}
        onMouseLeave={() => { selecting.current = false }}
        tabIndex={-1}
      >
        <table className="border-collapse text-xs" style={{ minWidth: "100%" }}>
          <thead className="sticky top-0 z-10">
            {columnGroups.some((g) => g.name) && (
              <tr>
                <th className="border border-gray-200 bg-gray-100 px-2 py-1 text-left text-[10px] uppercase tracking-wide text-gray-500 sticky left-0 z-10" rowSpan={2}>
                  Size
                </th>
                {columnGroups.map((g, i) => (
                  <th key={i} colSpan={g.span} className="border border-gray-200 bg-amber-50 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-amber-800">
                    {g.name || "\u00A0"}
                  </th>
                ))}
              </tr>
            )}
            <tr>
              {!columnGroups.some((g) => g.name) && (
                <th className="border border-gray-200 bg-gray-100 px-2 py-1.5 text-left text-[10px] uppercase tracking-wide text-gray-500 sticky left-0 z-10">Size</th>
              )}
              {orderedComponents.map((c) => (
                <th
                  key={c.id}
                  className="border border-gray-200 bg-gray-100 px-1.5 py-1.5 text-center font-semibold text-gray-700 align-bottom"
                  style={{ minWidth: 72, maxWidth: 110 }}
                  title={[c.name, c.gender, c.color].filter(Boolean).join(" · ")}
                >
                  <span className="block break-words leading-tight" style={{ maxWidth: 100 }}>
                    {c.shortName || c.name}
                  </span>
                  {c.sizeDependent === false && <span className="block text-[9px] font-normal text-gray-400 mt-0.5">one price</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedVariants.length === 0 || orderedComponents.length === 0 ? (
              <tr>
                <td colSpan={orderedComponents.length + 1} className="border border-gray-200 px-4 py-8 text-center text-gray-400">
                  Add components and sizes to build the pricing matrix.
                </td>
              </tr>
            ) : (
              orderedVariants.map((v, r) => (
                <tr key={v.id}>
                  <td className={`border border-gray-200 px-2.5 py-1 font-semibold text-gray-700 bg-gray-50 sticky left-0 z-[5] whitespace-nowrap ${inSelection(r, -1) ? "" : ""}`}>
                    {v.name}
                  </td>
                  {orderedComponents.map((c, ci) => {
                    if (c.sizeDependent === false) {
                      if (r !== 0) return null
                      return (
                        <td key={c.id} className={tdClass(0, ci)} rowSpan={orderedVariants.length}>
                          <input {...inputProps(c.id, null, 0, ci)} />
                        </td>
                      )
                    }
                    return (
                      <td key={c.id} className={tdClass(r, ci)}>
                        <input {...inputProps(c.id, v.id, r, ci)} />
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view — same data, per-size cards */}
      <div className="md:hidden space-y-3" onPaste={handlePaste}>
        {orderedComponents.some((c) => c.sizeDependent === false) && (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">Common Price (no size)</p>
            <div className="space-y-1.5">
              {orderedComponents.filter((c) => c.sizeDependent === false).map((c, i) => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-700 truncate">{c.shortName || c.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-gray-400">{symbol}</span>
                    <input {...inputProps(c.id, null, 0, orderedComponents.indexOf(c))} className="w-20 border border-gray-300 rounded px-2 py-1 text-right text-xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {orderedVariants.map((v, r) => (
          <div key={v.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs font-bold text-gray-800 mb-2">SIZE {v.name}</p>
            <div className="space-y-1.5">
              {orderedComponents.filter((c) => c.sizeDependent !== false).map((c) => {
                const ci = orderedComponents.indexOf(c)
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-700 truncate">{c.shortName || c.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-gray-400">{symbol}</span>
                      <input {...inputProps(c.id, v.id, r, ci)} className="w-20 border border-gray-300 rounded px-2 py-1 text-right text-xs" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5">
        <p className="text-xs text-gray-500">
          {hasChanges ? (
            <span className="text-amber-600 font-medium">{dirtyKeys.length} cell(s) changed — not saved yet</span>
          ) : (
            <span>All changes saved</span>
          )}
        </p>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Prices
        </button>
      </div>

      {/* Paste / import preview modal */}
      {pastePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPastePreview(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto z-10">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-base font-semibold text-gray-800">Preview changes</h3>
              <button onClick={() => setPastePreview(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {pastePreview.errors.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">{pastePreview.errors.length} value(s) rejected:</p>
                  <ul className="text-xs text-red-600 space-y-0.5 max-h-28 overflow-y-auto list-disc pl-4">
                    {pastePreview.errors.slice(0, 50).map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              {pastePreview.changes.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">{pastePreview.changes.length} price(s) will be updated:</p>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {pastePreview.changes.slice(0, 200).map((ch, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
                        <span className="text-gray-700 truncate">{ch.label}</span>
                        <span className="shrink-0 text-gray-500">
                          {ch.from === "" ? "-" : `${symbol}${ch.from}`} <span className="text-gray-400">→</span> <span className="font-semibold text-gray-800">{symbol}{ch.to}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No valid changes to apply.</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white">
              <button onClick={() => setPastePreview(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => { pastePreview.apply(); setPastePreview(null) }}
                disabled={pastePreview.changes.length === 0}
                className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--secondary)] disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Exposed for the detail page (import preview building)
export { fmtPrice }
