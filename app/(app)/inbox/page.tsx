"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, Conversation, InboxMessage } from "@/lib/api";
import { getToken } from "@/lib/auth";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function StatusIcon({ status }: { status: string }) {
  if (status === "read") return <span className="status-checks status-read">✓✓</span>;
  if (status === "delivered") return <span className="status-checks">✓✓</span>;
  if (status === "sent") return <span className="status-checks">✓</span>;
  if (status === "failed") return <span className="status-checks" style={{ color: "var(--danger)" }}>!</span>;
  return null;
}

const FILTERS = ["all", "open", "pending", "resolved", "closed"] as const;

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConversations = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.inbox.conversations(token, {
        status: filter === "all" ? undefined : filter,
        search: search || undefined,
      });
      setConversations(res.conversations);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    setLoading(true);
    loadConversations();
    pollRef.current = setInterval(loadConversations, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    const token = getToken();
    if (!token) return;
    setMsgLoading(true);
    try {
      const res = await api.inbox.messages(token, convId);
      setMessages(res.messages);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const selectConversation = useCallback(async (conv: Conversation) => {
    setActiveId(conv.id);
    setMessages([]);
    setText("");
    setError(null);
    loadMessages(conv.id);

    if (conv.unread_count > 0) {
      const token = getToken();
      if (token) {
        api.inbox.markRead(token, conv.id).catch(() => {});
        setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c));
      }
    }

    if (msgPollRef.current) clearInterval(msgPollRef.current);
    msgPollRef.current = setInterval(() => loadMessages(conv.id), 5000);
  }, [loadMessages]);

  useEffect(() => {
    return () => { if (msgPollRef.current) clearInterval(msgPollRef.current); };
  }, []);

  async function sendMessage() {
    const token = getToken();
    if (!token || !activeId || !text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await api.inbox.send(token, activeId, { type: "text", body: text.trim() });
      setMessages((prev) => [res.message, ...prev]);
      setText("");
      loadConversations();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="inbox-layout">
      {/* Left: Conversation list */}
      <div className="convo-list">
        <div className="convo-list-header">
          <input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <div
              key={f}
              className={`filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </div>
          ))}
        </div>
        <div className="convo-list-items">
          {loading ? (
            <div style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>
              No conversations yet. Send a message from the WhatsApp page, or wait for incoming messages after configuring webhooks.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`convo-item ${activeId === conv.id ? "active" : ""}`}
                onClick={() => selectConversation(conv)}
              >
                <div className="convo-avatar">
                  {(conv.contact?.name?.[0] ?? conv.contact?.wa_id?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="convo-info">
                  <div className="convo-name">
                    <span>{conv.contact?.name || conv.contact?.phone || conv.contact?.wa_id || "Unknown"}</span>
                    <span className="time">{timeAgo(conv.last_message_at)}</span>
                  </div>
                  <div className="convo-preview">
                    <span>{conv.last_message_preview || "No messages"}</span>
                    {conv.unread_count > 0 && <span className="unread-badge">{conv.unread_count}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Chat area */}
      <div className="chat-area">
        {!activeConv ? (
          <div className="chat-empty">Select a conversation to start chatting</div>
        ) : (
          <>
            <div className="chat-header">
              <div className="convo-avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
                {(activeConv.contact?.name?.[0] ?? "?").toUpperCase()}
              </div>
              <div>
                <div className="name">{activeConv.contact?.name || activeConv.contact?.phone || "Unknown"}</div>
                <div className="phone">{activeConv.contact?.wa_id ? `+${activeConv.contact.wa_id}` : ""}</div>
              </div>
              <span className={`window-tag ${activeConv.window_open ? "window-open" : "window-closed"}`}>
                {activeConv.window_open ? "Window open" : "Window closed"}
              </span>
            </div>

            {error && <div className="error" style={{ margin: "8px 16px 0", borderRadius: 8 }}>{error}</div>}

            <div className="message-list">
              {msgLoading && messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--muted)", alignSelf: "center" }}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--muted)", alignSelf: "center" }}>No messages yet</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={msg.direction === "inbound" ? "bubble bubble-in" : "bubble bubble-out"}
                  >
                    <div>{msg.body || `[${msg.type}]`}</div>
                    <div className="meta">
                      <span>{formatTime(msg.created_at)}</span>
                      {msg.direction === "outbound" && <StatusIcon status={msg.status} />}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="compose-bar">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={activeConv.window_open ? "Type a message..." : "Window closed — send a template to re-open"}
                disabled={!activeConv.window_open}
              />
              <button onClick={sendMessage} disabled={sending || !text.trim() || !activeConv.window_open}>
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
