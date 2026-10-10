"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Aaj kitne messages aaye?",
  "How many open conversations do I have?",
  "Kitne hot leads hain?",
  "Give me a summary of my dashboard",
];

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: "Hi! Apne data ke baare mein kuch bhi poochho — aaj ke messages, open chats, hot leads ya overall summary. Main sirf aapka hi data dekhta hoon." },
  ]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, busy]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const token = getToken();
    if (!token) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await api.assistant.ask(token, q);
      setMsgs((m) => [...m, { role: "assistant", text: res.answer }]);
    } catch (err) {
      setMsgs((m) => [...m, { role: "assistant", text: (err as ApiError).message || "Sorry, kuch galat ho gaya. Dubara try karein." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="appbar-btn"
        title="Ask AI about your data"
        onClick={() => setOpen((v) => !v)}
        style={{ position: "relative" }}
      >
        💬
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.25)", zIndex: 300 }} />
          <div
            role="dialog"
            aria-label="AI assistant"
            style={{
              position: "fixed", right: 16, bottom: 16, top: 72, width: "min(400px, calc(100vw - 32px))",
              background: "var(--panel, #fff)", borderRadius: 16, boxShadow: "0 12px 48px rgba(0,0,0,.22)",
              display: "flex", flexDirection: "column", zIndex: 301, overflow: "hidden",
            }}
          >
            <div style={{ background: "linear-gradient(135deg,#0e7c7b,#143d3c)", color: "#fff", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Data Assistant</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)" }}>🔒 Sirf aapke apne data par</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,.18)", color: "#fff", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>

            <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, background: "var(--bg, #f6f7f8)" }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                  <div style={{
                    padding: "9px 13px", borderRadius: 14, fontSize: 14, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word",
                    background: m.role === "user" ? "#0e7c7b" : "#fff",
                    color: m.role === "user" ? "#fff" : "#1f2a2a",
                    border: m.role === "user" ? "none" : "1px solid #e3edeb",
                    borderBottomRightRadius: m.role === "user" ? 4 : 14,
                    borderBottomLeftRadius: m.role === "user" ? 14 : 4,
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div style={{ alignSelf: "flex-start", fontSize: 13, color: "#667781", padding: "6px 4px" }}>Soch raha hoon…</div>
              )}

              {msgs.length <= 1 && !busy && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => ask(s)} style={{
                      background: "#eafaf7", color: "#0a7d47", border: "1px solid #cfeee4", borderRadius: 999,
                      padding: "5px 11px", fontSize: 12, cursor: "pointer",
                    }}>{s}</button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); ask(input); }}
              style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #e3edeb", background: "var(--panel,#fff)" }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Apna sawaal likhein…"
                style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--border,#d7e3e0)", borderRadius: 10, fontSize: 14 }}
              />
              <button type="submit" disabled={busy || !input.trim()} className="btn" style={{ width: "auto", padding: "0 18px" }}>Send</button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
