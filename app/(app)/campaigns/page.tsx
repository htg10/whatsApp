"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, BulkSend, BulkSendDetail } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

export default function CampaignsPage() {
  const [sends, setSends] = useState<BulkSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [numbers, setNumbers] = useState("");
  const [template, setTemplate] = useState("pg_owenr_welcome");
  const [language, setLanguage] = useState("en");
  const [submitting, setSubmitting] = useState(false);

  const [detail, setDetail] = useState<BulkSendDetail | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.bulk.list(token);
      setSends(res.bulk_sends);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function parseNumbers(text: string): string[] {
    return text
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter((n) => n.length >= 10);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split(/[\n\r]+/)
        .map((l) => {
          const cols = l.split(/[,;\t]+/);
          const phoneCol = cols.find((c) => /^\+?\d[\d\s\-]{8,}$/.test(c.trim()));
          return phoneCol?.trim() ?? "";
        })
        .filter(Boolean);
      setNumbers((prev) => (prev ? prev + "\n" : "") + lines.join("\n"));
      setNotice(`${lines.length} numbers loaded from file.`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    const nums = parseNumbers(numbers);
    if (nums.length === 0) {
      setError("No valid phone numbers found. Enter numbers with country code.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.bulk.send(token, {
        numbers: nums,
        template,
        language,
      });
      setNotice(`Bulk send complete: ${res.bulk_send.sent_count} sent, ${res.bulk_send.failed_count} failed out of ${res.bulk_send.total}.`);
      setNumbers("");
      setShowForm(false);
      await load();
    } catch (err) {
      const e = err as ApiError;
      const fieldErrors = e.errors ? Object.values(e.errors).flat().join(". ") : "";
      setError(fieldErrors || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function viewDetail(uuid: string) {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.bulk.get(token, uuid);
      setDetail(res.bulk_send);
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  const parsedCount = parseNumbers(numbers).length;

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle="Send bulk WhatsApp template messages"
        action={
          <button
            className="btn"
            style={{ width: "auto", padding: "10px 18px" }}
            onClick={() => { setShowForm((v) => !v); setNotice(null); setError(null); }}
          >
            {showForm ? "Close" : "+ New Bulk Send"}
          </button>
        }
      />

      {notice && <div className="panel" style={{ background: "#e7f7ef", borderColor: "#b6e6cd", color: "#0a7d47" }}>{notice}</div>}
      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="panel">
          <h2>Bulk Send Template Message</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Upload a CSV or paste phone numbers (one per line, with country code e.g. 919876543210).
            The template message will be sent from your default WhatsApp number.
          </p>
          <form onSubmit={send}>
            <div className="field">
              <label>Template name</label>
              <input
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                required
                placeholder="e.g. pg_owner_welcome"
              />
            </div>
            <div className="field">
              <label>Language</label>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[
                  { code: "en", label: "English" },
                  { code: "en_US", label: "English (US)" },
                  { code: "hi", label: "Hindi" },
                ].map((lang) => (
                  <label
                    key={lang.code}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: language === lang.code ? "2px solid #25d366" : "1px solid var(--border)",
                      background: language === lang.code ? "#e7f7ef" : "transparent",
                      fontSize: 13,
                      fontWeight: language === lang.code ? 600 : 400,
                    }}
                  >
                    <input
                      type="radio"
                      name="language"
                      value={lang.code}
                      checked={language === lang.code}
                      onChange={() => setLanguage(lang.code)}
                      style={{ display: "none" }}
                    />
                    {lang.label} <span style={{ color: "#888", fontSize: 11 }}>({lang.code})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Phone numbers</label>
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <button
                  type="button"
                  className="btn-mini"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload CSV
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt,.xlsx"
                  style={{ display: "none" }}
                  onChange={handleFile}
                />
                <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>
                  or paste numbers below
                </span>
              </div>
              <textarea
                value={numbers}
                onChange={(e) => setNumbers(e.target.value)}
                placeholder={"919876543210\n918765432109\n917654321098"}
                rows={10}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: "monospace",
                  resize: "vertical",
                }}
              />
              <span className="muted" style={{ fontSize: 12 }}>
                {parsedCount > 0 ? `${parsedCount} valid number${parsedCount > 1 ? "s" : ""} detected` : "No numbers yet"}
                {parsedCount > 200 && " — large batches may take a few minutes"}
              </span>
            </div>
            <button className="btn" disabled={submitting || parsedCount === 0}>
              {submitting ? `Sending to ${parsedCount} numbers…` : `Send to ${parsedCount} number${parsedCount !== 1 ? "s" : ""}`}
            </button>
          </form>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Bulk Send Details</h2>
            <button className="btn-mini" onClick={() => setDetail(null)}>Close</button>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", margin: "12px 0" }}>
            <div><span className="muted">Template:</span> <b>{detail.template_name}</b></div>
            <div><span className="muted">Status:</span> <StatusBadge status={detail.status} /></div>
            <div><span className="muted">Total:</span> {detail.total}</div>
            <div><span className="muted">Sent:</span> <span style={{ color: "#0a7d47" }}>{detail.sent_count}</span></div>
            <div><span className="muted">Failed:</span> <span style={{ color: "#c53030" }}>{detail.failed_count}</span></div>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Phone</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Error</th>
                </tr>
              </thead>
              <tbody>
                {detail.recipients.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 4px", fontFamily: "monospace" }}>{r.phone}</td>
                    <td style={{ padding: "6px 4px" }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: "6px 4px", color: "#c53030", fontSize: 12 }}>{r.error_message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History */}
      <div className="panel">
        <h2>Bulk Send History</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : sends.length === 0 ? (
          <p className="muted">No bulk sends yet. Click "+ New Bulk Send" to start.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Template</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Status</th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>Total</th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>Sent</th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>Failed</th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}></th>
                </tr>
              </thead>
              <tbody>
                {sends.map((s) => (
                  <tr key={s.uuid} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 4px" }}>{s.created_at ? new Date(s.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td style={{ padding: "8px 4px" }}>{s.template_name}</td>
                    <td style={{ padding: "8px 4px" }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding: "8px 4px", textAlign: "right" }}>{s.total}</td>
                    <td style={{ padding: "8px 4px", textAlign: "right", color: "#0a7d47" }}>{s.sent_count}</td>
                    <td style={{ padding: "8px 4px", textAlign: "right", color: "#c53030" }}>{s.failed_count}</td>
                    <td style={{ padding: "8px 4px", textAlign: "right" }}>
                      <button className="btn-mini" onClick={() => viewDetail(s.uuid)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    completed: { bg: "#e7f7ef", fg: "#0a7d47" },
    sent: { bg: "#e7f7ef", fg: "#0a7d47" },
    processing: { bg: "#fff3cd", fg: "#856404" },
    pending: { bg: "#eef1f2", fg: "#667781" },
    failed: { bg: "#fdecec", fg: "#c53030" },
  };
  const c = colors[status] ?? colors.pending;
  return (
    <span style={{ background: c.bg, color: c.fg, padding: "2px 9px", borderRadius: 999, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
      {status}
    </span>
  );
}
