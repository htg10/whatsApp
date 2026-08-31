"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, BulkSend, BulkSendDetail, CampaignItem, CampaignDetail, TemplateItem, TagItem } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  draft: { bg: "#eef1f2", fg: "#667781" },
  scheduled: { bg: "#fff3cd", fg: "#856404" },
  running: { bg: "#cce5ff", fg: "#004085" },
  paused: { bg: "#fff3cd", fg: "#856404" },
  completed: { bg: "#e7f7ef", fg: "#0a7d47" },
  cancelled: { bg: "#eef1f2", fg: "#667781" },
  failed: { bg: "#fdecec", fg: "#c53030" },
  sent: { bg: "#e7f7ef", fg: "#0a7d47" },
  processing: { bg: "#cce5ff", fg: "#004085" },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.draft;
  return (
    <span style={{ background: c.bg, color: c.fg, padding: "2px 9px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      {status}
    </span>
  );
}

type Tab = "campaigns" | "bulk";

export default function CampaignsPage() {
  const [tab, setTab] = useState<Tab>("campaigns");
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [sends, setSends] = useState<BulkSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Campaign create form
  const [showCreate, setShowCreate] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [form, setForm] = useState({ name: "", template_id: "", tags: [] as string[], scheduled_at: "" });
  const [submitting, setSubmitting] = useState(false);

  // Campaign detail
  const [detail, setDetail] = useState<CampaignDetail | null>(null);

  // Bulk send form
  const [showBulk, setShowBulk] = useState(false);
  const [bulkNumbers, setBulkNumbers] = useState("");
  const [bulkTemplate, setBulkTemplate] = useState("pg_owenr_welcome");
  const [bulkLang, setBulkLang] = useState("en");
  const [bulkVars, setBulkVars] = useState<string[]>([]);
  const [bulkDetail, setBulkDetail] = useState<BulkSendDetail | null>(null);

  const loadCampaigns = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.campaigns.list(token);
      setCampaigns(res.campaigns);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBulkSends = useCallback(async () => {
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

  useEffect(() => {
    if (tab === "campaigns") loadCampaigns();
    else loadBulkSends();
  }, [tab, loadCampaigns, loadBulkSends]);

  async function openCreateForm() {
    const token = getToken();
    if (!token) return;
    setShowCreate(true);
    setShowBulk(false);
    setError(null);
    try {
      const [t, tg] = await Promise.all([api.templates.list(token, { status: "APPROVED" }), api.tags.list(token)]);
      setTemplates(t.templates);
      setTags(tg.tags);
    } catch {}
  }

  // Open Bulk Send and load the tenant's approved templates for the dropdown.
  async function openBulk() {
    if (showBulk) { setShowBulk(false); return; }
    setShowBulk(true);
    setShowCreate(false);
    setError(null);
    const token = getToken();
    if (!token) return;
    try {
      const t = await api.templates.list(token, { status: "APPROVED" });
      setTemplates(t.templates);
      // Default the picker to the first approved template if the current one isn't in the list.
      if (t.templates.length > 0 && !t.templates.some((x) => x.name === bulkTemplate)) {
        const first = t.templates[0];
        setBulkTemplate(first.name);
        setBulkLang(first.language || "en");
        const body = first.components?.find((c) => (c.type || "").toUpperCase() === "BODY");
        const matches = body?.text?.match(/\{\{\s*(\d+)\s*\}\}/g);
        const count = matches ? Math.max(...matches.map((m) => parseInt(m.replace(/\D/g, ""), 10))) : 0;
        setBulkVars(Array(count).fill(""));
      }
    } catch {}
  }

  // Number of BODY variables ({{1}}, {{2}}, …) a template expects.
  function templateVarCount(name: string): number {
    const tpl = templates.find((t) => t.name === name);
    const body = tpl?.components?.find((c) => (c.type || "").toUpperCase() === "BODY");
    if (!body?.text) return 0;
    const matches = body.text.match(/\{\{\s*(\d+)\s*\}\}/g);
    if (!matches) return 0;
    return Math.max(...matches.map((m) => parseInt(m.replace(/\D/g, ""), 10)));
  }

  // When a template is picked, set its name, language, and reset variable slots.
  function pickBulkTemplate(name: string) {
    setBulkTemplate(name);
    const tpl = templates.find((t) => t.name === name);
    if (tpl?.language) setBulkLang(tpl.language);
    setBulkVars(Array(templateVarCount(name)).fill(""));
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const body: Parameters<typeof api.campaigns.create>[1] = {
        name: form.name,
        template_id: form.template_id,
      };
      if (form.tags.length) body.audience_filter = { tags: form.tags };
      if (form.scheduled_at) body.scheduled_at = form.scheduled_at;
      await api.campaigns.create(token, body);
      setNotice("Campaign created.");
      setShowCreate(false);
      setForm({ name: "", template_id: "", tags: [], scheduled_at: "" });
      loadCampaigns();
    } catch (err) {
      const e = err as ApiError;
      setError(e.errors ? Object.values(e.errors).flat().join(". ") : e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function viewCampaignDetail(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.campaigns.get(token, id);
      setDetail(res.campaign);
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  async function campaignAction(id: string, action: "start" | "pause" | "cancel") {
    const token = getToken();
    if (!token) return;
    setError(null);
    try {
      await api.campaigns[action](token, id);
      setNotice(`Campaign ${action}ed.`);
      loadCampaigns();
      if (detail?.id === id) viewCampaignDetail(id);
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  async function deleteCampaign(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      await api.campaigns.remove(token, id);
      setNotice("Campaign deleted.");
      setDetail(null);
      loadCampaigns();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  // Bulk send
  function parseNumbers(text: string): string[] {
    return text.split(/[\n,;]+/).map((n) => n.trim().replace(/[^0-9+]/g, "")).filter((n) => n.length >= 10);
  }

  async function sendBulk(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    const nums = parseNumbers(bulkNumbers);
    if (!nums.length) { setError("No valid numbers found."); return; }
    if (bulkVars.some((v) => v.trim() === "")) {
      setError("Please fill in all template variables before sending.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.bulk.send(token, {
        numbers: nums,
        template: bulkTemplate,
        language: bulkLang,
        ...(bulkVars.length > 0 ? { variables: bulkVars } : {}),
      });
      setNotice(`Bulk send started to ${nums.length} numbers.`);
      setShowBulk(false);
      setBulkNumbers("");
      loadBulkSends();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function viewBulkDetail(uuid: string) {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.bulk.get(token, uuid);
      setBulkDetail(res.bulk_send);
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  const parsedCount = parseNumbers(bulkNumbers).length;

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle="Template campaigns & bulk sends"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            {tab === "campaigns" ? (
              <button className="btn" style={{ width: "auto", padding: "10px 18px" }} onClick={openCreateForm}>
                + New Campaign
              </button>
            ) : (
              <button className="btn" style={{ width: "auto", padding: "10px 18px" }} onClick={openBulk}>
                {showBulk ? "Close" : "+ Bulk Send"}
              </button>
            )}
          </div>
        }
      />

      {notice && <div className="panel" style={{ background: "#e7f7ef", borderColor: "#b6e6cd", color: "#0a7d47" }}>{notice}</div>}
      {error && <div className="error">{error}</div>}

      {/* Tabs */}
      <div className="filter-tabs" style={{ marginBottom: 16 }}>
        <div className={`filter-tab ${tab === "campaigns" ? "active" : ""}`} onClick={() => { setTab("campaigns"); setShowBulk(false); setShowCreate(false); }}>
          Campaigns
        </div>
        <div className={`filter-tab ${tab === "bulk" ? "active" : ""}`} onClick={() => { setTab("bulk"); setShowBulk(false); setShowCreate(false); }}>
          Bulk Send
        </div>
      </div>

      {/* Campaign create form */}
      {showCreate && tab === "campaigns" && (
        <div className="panel">
          <h2>Create Campaign</h2>
          <form onSubmit={createCampaign}>
            <div className="field">
              <label>Campaign name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Summer sale blast" />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div className="field" style={{ flex: 1, minWidth: 200 }}>
                <label>Template</label>
                <select value={form.template_id} onChange={(e) => setForm((f) => ({ ...f, template_id: e.target.value }))} required style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14 }}>
                  <option value="">Select template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: 1, minWidth: 200 }}>
                <label>Schedule (optional)</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label>Target audience — tags (leave empty for all contacts)</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {tags.map((t) => (
                  <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.tags.includes(t.id)}
                      onChange={(e) => {
                        setForm((f) => ({
                          ...f,
                          tags: e.target.checked ? [...f.tags, t.id] : f.tags.filter((id) => id !== t.id),
                        }));
                      }}
                    />
                    <span style={{ background: t.color + "22", color: t.color, padding: "1px 8px", borderRadius: 999, fontWeight: 600 }}>{t.name}</span>
                  </label>
                ))}
                {tags.length === 0 && <span className="muted">No tags — campaign will target all contacts</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" disabled={submitting}>{submitting ? "Creating..." : "Create Campaign"}</button>
              <button type="button" className="btn" style={{ background: "#888" }} onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Campaign detail */}
      {detail && tab === "campaigns" && (
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h2>{detail.name}</h2>
            <div style={{ display: "flex", gap: 6 }}>
              {(detail.status === "draft" || detail.status === "scheduled") && (
                <button className="btn-mini" onClick={() => campaignAction(detail.id, "start")}>Start</button>
              )}
              {detail.status === "running" && (
                <button className="btn-mini" onClick={() => campaignAction(detail.id, "pause")}>Pause</button>
              )}
              {(detail.status === "draft" || detail.status === "scheduled" || detail.status === "running" || detail.status === "paused") && (
                <button className="btn-mini danger" onClick={() => campaignAction(detail.id, "cancel")}>Cancel</button>
              )}
              {detail.status === "draft" && (
                <button className="btn-mini danger" onClick={() => deleteCampaign(detail.id)}>Delete</button>
              )}
              <button className="btn-mini" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "12px 0" }}>
            <div><span className="muted">Status:</span> <StatusBadge status={detail.status} /></div>
            <div><span className="muted">Template:</span> {detail.template?.name ?? "—"}</div>
            <div><span className="muted">Phone:</span> {detail.phone_number?.display_phone_number ?? "—"}</div>
            {detail.scheduled_at && <div><span className="muted">Scheduled:</span> {new Date(detail.scheduled_at).toLocaleString("en-IN")}</div>}
            {detail.started_at && <div><span className="muted">Started:</span> {new Date(detail.started_at).toLocaleString("en-IN")}</div>}
            {detail.completed_at && <div><span className="muted">Completed:</span> {new Date(detail.completed_at).toLocaleString("en-IN")}</div>}
          </div>
          <div className="grid" style={{ marginBottom: 16 }}>
            <div className="stat"><div className="label">Recipients</div><div className="value">{detail.total_recipients}</div></div>
            <div className="stat"><div className="label">Sent</div><div className="value" style={{ color: "#0a7d47" }}>{detail.sent_count}</div></div>
            <div className="stat"><div className="label">Delivered</div><div className="value" style={{ color: "#007bfc" }}>{detail.delivered_count}</div></div>
            <div className="stat"><div className="label">Read</div><div className="value" style={{ color: "#53bdeb" }}>{detail.read_count}</div></div>
            <div className="stat"><div className="label">Failed</div><div className="value" style={{ color: "#c53030" }}>{detail.failed_count}</div></div>
            <div className="stat"><div className="label">Replied</div><div className="value">{detail.replied_count}</div></div>
          </div>
          {detail.contacts && detail.contacts.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>Recipients</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>Contact</th>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>Phone</th>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.contacts.map((cc) => (
                    <tr key={cc.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "6px 4px" }}>{cc.contact.name || "—"}</td>
                      <td style={{ padding: "6px 4px", fontFamily: "monospace" }}>{cc.contact.phone}</td>
                      <td style={{ padding: "6px 4px" }}><StatusBadge status={cc.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Campaigns list */}
      {tab === "campaigns" && (
        <div className="panel">
          {loading ? (
            <div className="loading-block"><span className="spinner" /><span>Loading…</span></div>
          ) : campaigns.length === 0 ? (
            <p className="muted">No campaigns yet. Click "+ New Campaign" to create one targeting your contacts.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Name</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Template</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Status</th>
                    <th style={{ textAlign: "right", padding: "8px 4px" }}>Recipients</th>
                    <th style={{ textAlign: "right", padding: "8px 4px" }}>Sent</th>
                    <th style={{ textAlign: "right", padding: "8px 4px" }}>Failed</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Created</th>
                    <th style={{ textAlign: "right", padding: "8px 4px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 4px", fontWeight: 500, cursor: "pointer", color: "#1a7f64" }} onClick={() => viewCampaignDetail(c.id)}>{c.name}</td>
                      <td style={{ padding: "8px 4px", fontFamily: "monospace" }}>{c.template?.name ?? "—"}</td>
                      <td style={{ padding: "8px 4px" }}><StatusBadge status={c.status} /></td>
                      <td style={{ padding: "8px 4px", textAlign: "right" }}>{c.total_recipients}</td>
                      <td style={{ padding: "8px 4px", textAlign: "right", color: "#0a7d47" }}>{c.sent_count}</td>
                      <td style={{ padding: "8px 4px", textAlign: "right", color: "#c53030" }}>{c.failed_count}</td>
                      <td style={{ padding: "8px 4px" }}>{c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : "—"}</td>
                      <td style={{ padding: "8px 4px", textAlign: "right" }}>
                        <button className="btn-mini" onClick={() => viewCampaignDetail(c.id)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bulk send form */}
      {showBulk && tab === "bulk" && (
        <div className="panel">
          <h2>Bulk Send</h2>
          <form onSubmit={sendBulk}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div className="field" style={{ flex: 1, minWidth: 240 }}>
                <label>Template</label>
                {templates.length > 0 ? (
                  <select value={bulkTemplate} onChange={(e) => pickBulkTemplate(e.target.value)} required>
                    {!templates.some((t) => t.name === bulkTemplate) && <option value={bulkTemplate}>{bulkTemplate} (manual)</option>}
                    {templates.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} · {t.language}{t.category ? ` · ${t.category.toLowerCase()}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input value={bulkTemplate} onChange={(e) => setBulkTemplate(e.target.value)} required placeholder="No approved templates found — type a name" />
                )}
                <span className="muted" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
                  {templates.length > 0 ? `${templates.length} approved template${templates.length === 1 ? "" : "s"} available` : "Only approved templates can be sent."}
                </span>
              </div>
              <div className="field" style={{ minWidth: 180 }}>
                <label>Language</label>
                <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
                  {[{ label: "English", value: "en" }, { label: "English US", value: "en_US" }, { label: "Hindi", value: "hi" }].map((l) => (
                    <label key={l.value} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
                      <input type="radio" name="lang" value={l.value} checked={bulkLang === l.value} onChange={() => setBulkLang(l.value)} />
                      {l.label}
                    </label>
                  ))}
                </div>
                <span className="muted" style={{ fontSize: 12, marginTop: 4, display: "block" }}>Auto-set from template; change if needed.</span>
              </div>
            </div>
            {bulkVars.length > 0 && (
              <div className="field">
                <label>Template variables</label>
                <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                  This template has {bulkVars.length} variable{bulkVars.length === 1 ? "" : "s"}. The same values are sent to every number.
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {bulkVars.map((v, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 13, color: "#54656f", minWidth: 42 }}>{`{{${i + 1}}}`}</span>
                      <input
                        value={v}
                        onChange={(e) => setBulkVars((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                        placeholder={`Value for {{${i + 1}}}`}
                        style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="field">
              <label>Phone numbers (one per line, or comma-separated)</label>
              <textarea
                value={bulkNumbers}
                onChange={(e) => setBulkNumbers(e.target.value)}
                rows={6}
                placeholder={"919876543210\n919876543211\n919876543212"}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, fontFamily: "monospace", resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="muted" style={{ fontSize: 12 }}>{parsedCount} numbers detected</span>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" disabled={submitting || parsedCount === 0}>{submitting ? "Sending..." : `Send to ${parsedCount}`}</button>
                <button type="button" className="btn" style={{ background: "#888" }} onClick={() => setShowBulk(false)}>Cancel</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Bulk send detail */}
      {bulkDetail && tab === "bulk" && (
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Bulk Send Detail</h2>
            <button className="btn-mini" onClick={() => setBulkDetail(null)}>Close</button>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "12px 0" }}>
            <div><span className="muted">Template:</span> {bulkDetail.template_name}</div>
            <div><span className="muted">Language:</span> {bulkDetail.language}</div>
            <div><span className="muted">Status:</span> <StatusBadge status={bulkDetail.status} /></div>
            <div><span className="muted">Total:</span> {bulkDetail.total}</div>
            <div><span className="muted">Sent:</span> <span style={{ color: "#0a7d47" }}>{bulkDetail.sent_count}</span></div>
            <div><span className="muted">Failed:</span> <span style={{ color: "#c53030" }}>{bulkDetail.failed_count}</span></div>
          </div>
          {bulkDetail.recipients.length > 0 && (
            <div style={{ overflowX: "auto", maxHeight: 300, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>Phone</th>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>Status</th>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkDetail.recipients.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "6px 4px", fontFamily: "monospace" }}>{r.phone}</td>
                      <td style={{ padding: "6px 4px" }}><StatusBadge status={r.status} /></td>
                      <td style={{ padding: "6px 4px", color: "var(--danger)", fontSize: 11 }}>{r.error_message || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bulk sends list */}
      {tab === "bulk" && (
        <div className="panel">
          {loading ? (
            <div className="loading-block"><span className="spinner" /><span>Loading…</span></div>
          ) : sends.length === 0 ? (
            <p className="muted">No bulk sends yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Template</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Language</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Status</th>
                    <th style={{ textAlign: "right", padding: "8px 4px" }}>Total</th>
                    <th style={{ textAlign: "right", padding: "8px 4px" }}>Sent</th>
                    <th style={{ textAlign: "right", padding: "8px 4px" }}>Failed</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Date</th>
                    <th style={{ textAlign: "right", padding: "8px 4px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sends.map((s) => (
                    <tr key={s.uuid} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 4px", fontFamily: "monospace" }}>{s.template_name}</td>
                      <td style={{ padding: "8px 4px" }}>{s.language}</td>
                      <td style={{ padding: "8px 4px" }}><StatusBadge status={s.status} /></td>
                      <td style={{ padding: "8px 4px", textAlign: "right" }}>{s.total}</td>
                      <td style={{ padding: "8px 4px", textAlign: "right", color: "#0a7d47" }}>{s.sent_count}</td>
                      <td style={{ padding: "8px 4px", textAlign: "right", color: "#c53030" }}>{s.failed_count}</td>
                      <td style={{ padding: "8px 4px" }}>{s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN") : "—"}</td>
                      <td style={{ padding: "8px 4px", textAlign: "right" }}>
                        <button className="btn-mini" onClick={() => viewBulkDetail(s.uuid)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
