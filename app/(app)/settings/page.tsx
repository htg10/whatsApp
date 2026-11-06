"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, InvoiceSettings, AiSettings, AiSettingsUpdate, AiProvider, AiUsage } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useUser } from "@/lib/user-context";
import { PageHeader } from "@/components/PageHeader";
import { LoadingBlock } from "@/components/Preloader";

const EMPTY: InvoiceSettings = {
  company_name: "", address: "", gstin: "", email: "", phone: "",
  tax_details: "", invoice_prefix: "INV", gst_rate: 18,
};

export default function SettingsPage() {
  const me = useUser();
  const isSuper = !!me.is_super_admin;
  const [form, setForm] = useState<InvoiceSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // AI provider settings (keys are write-only, held separately).
  const [ai, setAi] = useState<AiSettings | null>(null);
  const [aiKeys, setAiKeys] = useState({ gemini_key: "", openai_key: "", anthropic_key: "" });
  const [aiSaving, setAiSaving] = useState(false);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [usageDays, setUsageDays] = useState(30);

  const loadUsage = useCallback(async (days: number) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.admin.aiUsage(token, days);
      setUsage(res.usage);
    } catch { /* non-fatal */ }
  }, []);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [res, aiRes] = await Promise.all([api.admin.settings(token), api.admin.aiSettings(token)]);
      setForm({ ...EMPTY, ...res.settings });
      setAi(aiRes.ai);
      loadUsage(30);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }, [loadUsage]);

  useEffect(() => { if (isSuper) load(); else setLoading(false); }, [isSuper, load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.admin.updateSettings(token, form);
      setForm({ ...EMPTY, ...res.settings });
      setNotice("Settings saved.");
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  }

  const set = <K extends keyof InvoiceSettings>(k: K, v: InvoiceSettings[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function saveAi(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !ai) return;
    setAiSaving(true);
    setError(null);
    try {
      const body: AiSettingsUpdate = {
        provider: ai.provider,
        enabled: ai.enabled,
        gemini_model: ai.gemini_model,
        openai_model: ai.openai_model,
        anthropic_model: ai.anthropic_model,
        gemini_price_in: ai.gemini_price_in, gemini_price_out: ai.gemini_price_out,
        openai_price_in: ai.openai_price_in, openai_price_out: ai.openai_price_out,
        anthropic_price_in: ai.anthropic_price_in, anthropic_price_out: ai.anthropic_price_out,
      };
      // Only send a key when the admin typed a new one (blank = keep existing).
      if (aiKeys.gemini_key) body.gemini_key = aiKeys.gemini_key;
      if (aiKeys.openai_key) body.openai_key = aiKeys.openai_key;
      if (aiKeys.anthropic_key) body.anthropic_key = aiKeys.anthropic_key;
      const res = await api.admin.updateAiSettings(token, body);
      setAi(res.ai);
      setAiKeys({ gemini_key: "", openai_key: "", anthropic_key: "" });
      setNotice("AI settings saved.");
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setAiSaving(false);
    }
  }

  if (!isSuper) {
    return <div><PageHeader title="Settings" /><div className="panel"><p className="muted">Super admin only.</p></div></div>;
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Seller / company details printed on every invoice." />

      {error && <div className="error">{error}</div>}
      {notice && <div className="panel" style={{ background: "#e7f7ef", color: "#0a7d47", marginBottom: 16 }}>{notice}</div>}

      {loading ? (
        <LoadingBlock label="Loading settings…" />
      ) : (
        <form onSubmit={save} className="panel" style={{ maxWidth: 640 }}>
          <h3 style={{ marginTop: 0 }}>Invoice / Seller details</h3>
          <div className="field">
            <label>Company / Business name</label>
            <input value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} placeholder="Heltog Technologies Pvt Ltd" />
          </div>
          <div className="field">
            <label>Business address</label>
            <textarea value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} rows={3} placeholder="Street, City, State, PIN" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>GSTIN</label>
              <input value={form.gstin ?? ""} onChange={(e) => set("gstin", e.target.value)} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>Tax details <span className="muted">(PAN / CIN)</span></label>
              <input value={form.tax_details ?? ""} onChange={(e) => set("tax_details", e.target.value)} placeholder="PAN / CIN" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>Email</label>
              <input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="billing@heltog.com" />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>Phone</label>
              <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+91…" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>Invoice prefix</label>
              <input value={form.invoice_prefix ?? ""} onChange={(e) => set("invoice_prefix", e.target.value)} placeholder="INV" />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>GST rate (%)</label>
              <input type="number" min={0} max={100} value={form.gst_rate} onChange={(e) => set("gst_rate", Number(e.target.value) || 0)} />
            </div>
          </div>
          <button className="btn" style={{ width: "auto", padding: "11px 24px" }} disabled={saving}>{saving ? "Saving…" : "Save settings"}</button>
        </form>
      )}

      {!loading && ai && (
        <form onSubmit={saveAi} className="panel" style={{ maxWidth: 640, marginTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>AI Chatbot Provider</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: -4 }}>
            Choose which AI powers the chatbot, switch it on/off, and set each provider&apos;s API key.
          </p>

          <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0", cursor: "pointer" }}>
            <input type="checkbox" checked={ai.enabled} onChange={(e) => setAi({ ...ai, enabled: e.target.checked })} />
            <span>AI chatbot replies: <b style={{ color: ai.enabled ? "#0a7d47" : "#c53030" }}>{ai.enabled ? "ON" : "OFF"}</b>
              <span className="muted"> — off = keyword rules + fallback only (no AI cost)</span></span>
          </label>

          <div className="field">
            <label>Preferred provider</label>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
              {([["gemini", "Gemini (Google)"], ["openai", "OpenAI (ChatGPT)"], ["anthropic", "Claude (Anthropic)"]] as [AiProvider, string][]).map(([v, l]) => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="radio" name="aiprovider" checked={ai.provider === v} onChange={() => setAi({ ...ai, provider: v })} />
                  {l}
                </label>
              ))}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Selected provider is tried first; any other that has a key acts as automatic fallback.</div>
          </div>

          {/* Per-provider API key + optional model */}
          <AiProviderFields
            title="Gemini" configured={ai.has_gemini_key}
            keyValue={aiKeys.gemini_key} onKey={(v) => setAiKeys((k) => ({ ...k, gemini_key: v }))}
            model={ai.gemini_model ?? ""} onModel={(v) => setAi({ ...ai, gemini_model: v })}
            modelPlaceholder="gemini-2.5-flash-lite"
            priceIn={ai.gemini_price_in} priceOut={ai.gemini_price_out}
            onPriceIn={(v) => setAi({ ...ai, gemini_price_in: v })} onPriceOut={(v) => setAi({ ...ai, gemini_price_out: v })} />
          <AiProviderFields
            title="OpenAI" configured={ai.has_openai_key}
            keyValue={aiKeys.openai_key} onKey={(v) => setAiKeys((k) => ({ ...k, openai_key: v }))}
            model={ai.openai_model ?? ""} onModel={(v) => setAi({ ...ai, openai_model: v })}
            modelPlaceholder="gpt-4o-mini"
            priceIn={ai.openai_price_in} priceOut={ai.openai_price_out}
            onPriceIn={(v) => setAi({ ...ai, openai_price_in: v })} onPriceOut={(v) => setAi({ ...ai, openai_price_out: v })} />
          <AiProviderFields
            title="Claude" configured={ai.has_anthropic_key}
            keyValue={aiKeys.anthropic_key} onKey={(v) => setAiKeys((k) => ({ ...k, anthropic_key: v }))}
            model={ai.anthropic_model ?? ""} onModel={(v) => setAi({ ...ai, anthropic_model: v })}
            modelPlaceholder="claude-haiku-4-5"
            priceIn={ai.anthropic_price_in} priceOut={ai.anthropic_price_out}
            onPriceIn={(v) => setAi({ ...ai, anthropic_price_in: v })} onPriceOut={(v) => setAi({ ...ai, anthropic_price_out: v })} />

          <button className="btn" style={{ width: "auto", padding: "11px 24px", marginTop: 4 }} disabled={aiSaving}>{aiSaving ? "Saving…" : "Save AI settings"}</button>
        </form>
      )}

      {!loading && usage && (
        <div className="panel" style={{ maxWidth: 820, marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ margin: 0 }}>AI Usage &amp; Estimated Cost</h3>
            <select value={usageDays} onChange={(e) => { const d = Number(e.target.value); setUsageDays(d); loadUsage(d); }}
              style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            Estimated from the tokens each call actually used × your ₹/1M rates above. This is a close estimate — the exact amount a
            provider charged is only in its own billing console (e.g. Google AI Studio → Billing).
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "10px 0 16px" }}>
            <Tile label="Estimated cost" value={`₹${usage.total_est_cost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} big accent="#c53030" />
            <Tile label="AI calls" value={usage.total_calls.toLocaleString("en-IN")} />
            <Tile label="Input tokens" value={usage.total_input_tokens.toLocaleString("en-IN")} />
            <Tile label="Output tokens" value={usage.total_output_tokens.toLocaleString("en-IN")} />
          </div>

          {usage.total_calls === 0 ? (
            <p className="muted">No AI usage recorded in this period yet. (Usage is logged from now on, as the chatbot answers.)</p>
          ) : (
            <>
              <h4 style={{ margin: "4px 0 6px", fontSize: 13 }}>By provider</h4>
              <UsageTable rows={usage.by_provider.map((r) => ({ label: r.provider, ...r }))} />
              <h4 style={{ margin: "16px 0 6px", fontSize: 13 }}>By model</h4>
              <UsageTable rows={usage.by_model.map((r) => ({ label: `${r.provider} · ${r.model ?? "—"}`, ...r }))} />
              {usage.daily.length > 0 && (
                <>
                  <h4 style={{ margin: "16px 0 6px", fontSize: 13 }}>Estimated cost per day</h4>
                  <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <tbody>
                        {usage.daily.slice().reverse().map((d) => (
                          <tr key={d.date} style={{ borderBottom: "1px solid #f4f6f7" }}>
                            <td style={{ padding: "6px 10px" }}>{new Date(d.date).toLocaleDateString("en-IN")}</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹{d.est_cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 140, border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", background: "#f8fafb" }}>
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: big ? 24 : 18, fontWeight: 700, color: accent ?? "inherit", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

function UsageTable({ rows }: { rows: { label: string; calls: number; input_tokens: number; output_tokens: number; est_cost: number }[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#667781", borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "6px 8px" }}>Provider / Model</th>
            <th style={{ padding: "6px 8px", textAlign: "right" }}>Calls</th>
            <th style={{ padding: "6px 8px", textAlign: "right" }}>Input</th>
            <th style={{ padding: "6px 8px", textAlign: "right" }}>Output</th>
            <th style={{ padding: "6px 8px", textAlign: "right" }}>Est. ₹</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f4f6f7" }}>
              <td style={{ padding: "6px 8px", textTransform: "capitalize" }}>{r.label}</td>
              <td style={{ padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.calls.toLocaleString("en-IN")}</td>
              <td style={{ padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.input_tokens.toLocaleString("en-IN")}</td>
              <td style={{ padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.output_tokens.toLocaleString("en-IN")}</td>
              <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>₹{r.est_cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One provider's API-key (write-only) + optional model + ₹/1M-token rates. */
function AiProviderFields(props: {
  title: string; configured: boolean;
  keyValue: string; onKey: (v: string) => void;
  model: string; onModel: (v: string) => void; modelPlaceholder: string;
  priceIn: number; priceOut: number; onPriceIn: (v: number) => void; onPriceOut: (v: number) => void;
}) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <b style={{ fontSize: 13 }}>{props.title}</b>
        <span style={{ fontSize: 12, color: props.configured ? "#0a7d47" : "#8696a0" }}>
          {props.configured ? "✓ Key configured" : "No key yet"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 2, minWidth: 220, margin: 0 }}>
          <label style={{ fontSize: 12 }}>API key {props.configured && <span className="muted">(leave blank to keep)</span>}</label>
          <input type="password" autoComplete="off" value={props.keyValue} onChange={(e) => props.onKey(e.target.value)}
            placeholder={props.configured ? "••••••••  (saved)" : "Paste API key"} />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 150, margin: 0 }}>
          <label style={{ fontSize: 12 }}>Model <span className="muted">(optional)</span></label>
          <input value={props.model} onChange={(e) => props.onModel(e.target.value)} placeholder={props.modelPlaceholder} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
        <div className="field" style={{ flex: 1, minWidth: 150, margin: 0 }}>
          <label style={{ fontSize: 12 }}>₹ / 1M input tokens</label>
          <input type="number" min={0} step="0.01" value={props.priceIn} onChange={(e) => props.onPriceIn(Number(e.target.value) || 0)} />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 150, margin: 0 }}>
          <label style={{ fontSize: 12 }}>₹ / 1M output tokens</label>
          <input type="number" min={0} step="0.01" value={props.priceOut} onChange={(e) => props.onPriceOut(Number(e.target.value) || 0)} />
        </div>
      </div>
    </div>
  );
}
