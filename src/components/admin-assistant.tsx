"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Sparkles, Loader2 } from "lucide-react"

type Table = { title?: string; headers: string[]; rows: (string | number)[][]; note?: string }
type Msg = { from: "bot" | "user"; text: string; tables?: Table[] }

const SUGGESTIONS = [
  "Pending fees group by class",
  "Absent today",
  "Pending leaves",
  "Collected this month",
  "Class strength",
  "Top students",
]

function BotTable({ t }: { t: Table }) {
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-[var(--border)] max-w-full">
      {t.title && <p className="text-[11px] font-bold text-[var(--title-color)] bg-[var(--accent)] px-2.5 py-1.5 border-b border-[var(--border)]">{t.title}</p>}
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-[var(--accent)] text-[var(--subtitle-color)] uppercase tracking-wide text-[10px]">
            {t.headers.map((h) => (
              <th key={h} className="text-left font-semibold px-2 py-1.5 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {t.rows.map((r, i) => (
            <tr key={i} className="hover:bg-[var(--accent)]/60">
              {r.map((c, j) => (
                <td key={j} className={`px-2 py-1.5 whitespace-nowrap ${j === 0 ? "font-semibold text-[var(--title-color)]" : "text-[var(--subtitle-color)]"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {t.note && <p className="text-[10px] text-[var(--subtitle-color)] px-2.5 py-1">{t.note}</p>}
    </div>
  )
}

export default function AdminAssistant() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Hi! I'm your school data assistant. Ask me about fees, attendance, leaves, results, staff — anything in the database." },
  ])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [ping, setPing] = useState(true)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" })
  }, [msgs, busy, open])

  const ask = async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    setMsgs((m) => [...m, { from: "user", text: q }])
    setInput("")
    setBusy(true)
    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      })
      const d = await res.json()
      setMsgs((m) => [...m, { from: "bot", text: d.reply || "No answer.", tables: d.tables }])
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "Network error — please try again." }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {!open && (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50">
          <button
            onClick={() => { setOpen(true); setPing(false) }}
            title="Ask school assistant"
            className="relative h-14 w-14 rounded-full text-white shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 animate-[assistant-pop_.35s_ease-out]"
            style={{ background: "linear-gradient(135deg, #ff7732, #b34a12)", boxShadow: "0 8px 28px rgba(255,119,50,.45)" }}
          >
            {ping && <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(255,119,50,.35)" }} />}
            <Bot className="h-6 w-6" />
            <style>{`@keyframes assistant-pop { from { transform: scale(0); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
          </button>
        </div>
      )}

      {open && (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50">
          <div className="w-[min(420px,calc(100vw-3rem))] h-[min(600px,calc(100vh-6rem))] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden animate-[assistant-in_.25s_ease-out] origin-right">
          <style>{`@keyframes assistant-in { from { transform: scale(.9) translateY(16px); opacity: 0 } to { transform: scale(1) translateY(0); opacity: 1 } }`}</style>
          <div className="flex items-center gap-2.5 px-4 py-3 text-white shrink-0" style={{ background: "linear-gradient(135deg, #ff7732, #c24e0e)" }}>
            <span className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">School Assistant</p>
              <p className="text-[11px] text-white/80 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" /> answers from live database
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={bodyRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-[var(--background)]">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[92%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-line ${
                    m.from === "user"
                      ? "text-white rounded-br-md"
                      : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-md shadow-sm"
                  }`}
                  style={m.from === "user" ? { background: "var(--primary)" } : {}}
                >
                  {m.text}
                  {m.tables?.map((t, j) => <BotTable key={j} t={t} />)}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-[var(--card)] border border-[var(--border)] px-3.5 py-2.5 shadow-sm flex items-center gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {msgs.length <= 2 && !busy && (
            <div className="px-3 pt-2 flex flex-wrap gap-1.5 bg-[var(--background)]">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); ask(input) }}
            className="flex items-center gap-2 p-2.5 border-t border-[var(--border)] bg-[var(--card)] shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about fees, attendance, results…"
              className="flex-1 h-9 px-3 text-[13px] bg-[var(--input-background,var(--input))] text-[var(--foreground)] border border-[var(--border)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder:text-[var(--subtitle-color)]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="h-9 w-9 rounded-full text-white flex items-center justify-center shrink-0 transition-transform hover:scale-105 disabled:opacity-50"
              style={{ background: "var(--primary)" }}
              title="Send"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
        </div>
      )}
    </>
  )
}
