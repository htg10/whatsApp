"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, WaConfig, WaNumber } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { EmbeddedSignupButton } from "@/components/EmbeddedSignupButton";

function QualityBadge({ rating }: { rating: string | null }) {
  const color = rating === "GREEN" ? "#0a7d47" : rating === "YELLOW" ? "#b7791f" : rating === "RED" ? "#c53030" : "#667781";
  const bg = rating === "GREEN" ? "#e7f7ef" : rating === "YELLOW" ? "#fdf4dd" : rating === "RED" ? "#fdecec" : "#eef1f2";
  return <span style={{ background: bg, color, padding: "2px 9px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{rating ?? "—"}</span>;
}

const EMPTY_FORM = { waba_id: "", phone_number_id: "", display_phone_number: "", access_token: "", name: "" };

export default function WhatsAppPage() {
  const [numbers, setNumbers] = useState<WaNumber[]>([]);
  const [config, setConfig] = useState<WaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sendId, setSendId] = useState<string | null>(null);
  const [sendTo, setSendTo] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [n, c] = await Promise.all([api.whatsapp.numbers(token), api.whatsapp.config(token)]);
      setNumbers(n.numbers);
      setConfig(c);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.whatsapp.connectManual(token, form);
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      setNotice("WhatsApp number connected successfully.");
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onEmbeddedComplete(r: { code: string; waba_id: string; phone_number_id: string | null }) {
    const token = getToken();
    if (!token) return;
    setError(null);
    try {
      await api.whatsapp.embeddedSignup(token, r);
      setNotice("WhatsApp connected via Meta Embedded Signup.");
      setShowForm(false);
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  async function sync(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      await api.whatsapp.sync(token, id);
      setNotice("Number metadata synced from Meta.");
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  async function sendTest(id: string) {
    const token = getToken();
    if (!token || !sendTo.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await api.whatsapp.sendTest(token, id, {
        to: sendTo,
        type: "template",
        template: "hello_world",
        language: "en_US",
      });
      setNotice(`Message sent to ${res.to} (id: ${res.wamid ?? "queued"}). Check WhatsApp on that phone.`);
      setSendId(null);
      setSendTo("");
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSending(false);
    }
  }

  async function disconnect(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      await api.whatsapp.disconnect(token, id);
      setNotice("Number disconnected.");
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <>
      <PageHeader
        title="WhatsApp"
        subtitle="Connect and manage your WhatsApp Business numbers (Meta Cloud API)"
        action={<button className="btn" style={{ width: "auto", padding: "10px 18px" }} onClick={() => { setShowForm((v) => !v); setNotice(null); }}>{showForm ? "Close" : "+ Connect WhatsApp"}</button>}
      />

      {notice && <div className="panel" style={{ background: "#e7f7ef", borderColor: "#b6e6cd", color: "#0a7d47" }}>{notice}</div>}
      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="panel">
          <h2>Connect a WhatsApp number</h2>
          {config?.embedded_signup_configured && config.app_id && config.config_id && (
            <div style={{ marginBottom: 18 }}>
              <p className="muted" style={{ marginTop: 0 }}>
                One-click connect with Meta. A Facebook window opens where you pick your
                WhatsApp Business Account and number.
              </p>
              <EmbeddedSignupButton
                appId={config.app_id}
                configId={config.config_id}
                apiVersion={config.api_version}
                onComplete={onEmbeddedComplete}
                onError={(m) => setError(m)}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 4px" }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span className="muted" style={{ fontSize: 12 }}>or connect manually</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
            </div>
          )}
          {!config?.embedded_signup_configured && (
            <p className="muted" style={{ marginTop: 0 }}>
              One-click Embedded Signup activates once META_APP_ID and META_CONFIG_ID are set and
              META_USE_FAKE=false. Meanwhile, connect manually using your Cloud API credentials.
            </p>
          )}
          <form onSubmit={connect}>
            <div className="field"><label>WABA ID</label><input value={form.waba_id} onChange={(e) => update("waba_id", e.target.value)} required placeholder="WhatsApp Business Account ID" /></div>
            <div className="field"><label>Phone number ID</label><input value={form.phone_number_id} onChange={(e) => update("phone_number_id", e.target.value)} required placeholder="Meta phone_number_id" /></div>
            <div className="field"><label>Display phone number</label><input value={form.display_phone_number} onChange={(e) => update("display_phone_number", e.target.value)} required placeholder="+91 98765 43210" /></div>
            <div className="field"><label>System User access token</label><input value={form.access_token} onChange={(e) => update("access_token", e.target.value)} required placeholder="Permanent / 60-day token (stored encrypted)" /></div>
            <div className="field"><label>Label (optional)</label><input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Sales line" /></div>
            <button className="btn" disabled={submitting}>{submitting ? "Connecting…" : "Connect number"}</button>
          </form>
        </div>
      )}

      <div className="panel">
        <h2>Connected numbers</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : numbers.length === 0 ? (
          <p className="muted">No WhatsApp numbers connected yet. Click “Connect WhatsApp” to add one.</p>
        ) : (
          <div>
            <div className="row" style={{ fontWeight: 600 }}>
              <span style={{ flex: 2 }}>Number</span>
              <span style={{ flex: 1 }}>Quality</span>
              <span style={{ flex: 1 }}>Status</span>
              <span style={{ flex: 1.4, textAlign: "right" }}>Actions</span>
            </div>
            {numbers.map((n) => (
              <div key={n.id}>
                <div className="row" style={{ alignItems: "center" }}>
                  <span style={{ flex: 2 }}>
                    <b>{n.display_phone_number}</b>{n.is_default && <span className="badge" style={{ marginLeft: 8 }}>default</span>}
                    <div className="muted" style={{ fontSize: 12 }}>{n.waba?.name}</div>
                  </span>
                  <span style={{ flex: 1 }}><QualityBadge rating={n.quality_rating} /></span>
                  <span style={{ flex: 1, textTransform: "capitalize" }}>{n.status}</span>
                  <span style={{ flex: 1.6, textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="btn-mini" onClick={() => { setSendId(sendId === n.id ? null : n.id); setSendTo(""); setNotice(null); }}>Send test</button>
                    <button className="btn-mini" onClick={() => sync(n.id)}>Sync</button>
                    <button className="btn-mini danger" onClick={() => disconnect(n.id)}>Disconnect</button>
                  </span>
                </div>
                {sendId === n.id && (
                  <div style={{ padding: "12px 0 16px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      value={sendTo}
                      onChange={(e) => setSendTo(e.target.value)}
                      placeholder="Recipient number, e.g. 9198XXXXXXXX (with country code)"
                      style={{ flex: 1, minWidth: 260, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14 }}
                    />
                    <button className="btn" style={{ width: "auto", padding: "10px 18px" }} disabled={sending || !sendTo.trim()} onClick={() => sendTest(n.id)}>
                      {sending ? "Sending…" : "Send hello_world"}
                    </button>
                    <span className="muted" style={{ fontSize: 12, width: "100%" }}>
                      Sends the pre-approved <b>hello_world</b> template — the reliable way to start a chat.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
