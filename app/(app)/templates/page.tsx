"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, TemplateItem } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  APPROVED: { bg: "#e7f7ef", fg: "#0a7d47" },
  PENDING: { bg: "#fff3cd", fg: "#856404" },
  REJECTED: { bg: "#fdecec", fg: "#c53030" },
  PAUSED: { bg: "#eef1f2", fg: "#667781" },
  DISABLED: { bg: "#eef1f2", fg: "#667781" },
};

const CATEGORY_COLORS: Record<string, string> = {
  MARKETING: "#6f42c1",
  UTILITY: "#0d6efd",
  AUTHENTICATION: "#fd7e14",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [detail, setDetail] = useState<TemplateItem | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.templates.list(token, {
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });
      setTemplates(res.templates);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => { load(); }, [load]);

  async function syncTemplates() {
    const token = getToken();
    if (!token) return;
    setSyncing(true);
    setError(null);
    try {
      const res = await api.templates.sync(token);
      setNotice(res.message);
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSyncing(false);
    }
  }

  async function viewDetail(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.templates.get(token, id);
      setDetail(res.template);
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Templates"
        subtitle="WhatsApp message templates synced from Meta"
        action={
          <button className="btn" style={{ width: "auto", padding: "10px 18px" }} disabled={syncing} onClick={syncTemplates}>
            {syncing ? "Syncing…" : "Sync from Meta"}
          </button>
        }
      />

      {notice && <div className="panel" style={{ background: "#e7f7ef", borderColor: "#b6e6cd", color: "#0a7d47" }}>{notice}</div>}
      {error && <div className="error">{error}</div>}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          style={{ flex: 1, minWidth: 200, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14 }}
        >
          <option value="">All statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14 }}
        >
          <option value="">All categories</option>
          <option value="MARKETING">Marketing</option>
          <option value="UTILITY">Utility</option>
          <option value="AUTHENTICATION">Authentication</option>
        </select>
      </div>

      {/* Template detail */}
      {detail && (
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: "monospace" }}>{detail.name}</h2>
            <button className="btn-mini" onClick={() => setDetail(null)}>Close</button>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "12px 0" }}>
            <div><span className="muted">Language:</span> {detail.language}</div>
            <div><span className="muted">Category:</span> <span style={{ color: CATEGORY_COLORS[detail.category] ?? "#333" }}>{detail.category}</span></div>
            <div><span className="muted">Status:</span> <StatusBadge status={detail.status} /></div>
            {detail.quality_score && <div><span className="muted">Quality:</span> {detail.quality_score}</div>}
            {detail.last_synced_at && <div><span className="muted">Last synced:</span> {new Date(detail.last_synced_at).toLocaleString("en-IN")}</div>}
          </div>
          {detail.rejection_reason && (
            <div style={{ background: "#fdecec", padding: "8px 12px", borderRadius: 8, color: "#c53030", fontSize: 13, marginBottom: 12 }}>
              Rejection reason: {detail.rejection_reason}
            </div>
          )}
          {detail.components && detail.components.length > 0 && (
            <div>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>Components</h3>
              {detail.components.map((comp, i) => (
                <div key={i} style={{ background: "var(--bg-subtle, #f8f9fa)", padding: "10px 14px", borderRadius: 8, marginBottom: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#888", marginBottom: 4 }}>
                    {comp.type} {comp.format && `(${comp.format})`}
                  </div>
                  {comp.text && <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{comp.text}</div>}
                  {comp.buttons && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      {(comp.buttons as { type: string; text: string }[]).map((btn, j) => (
                        <span key={j} style={{ padding: "4px 12px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}>
                          {btn.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Templates table */}
      <div className="panel">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : templates.length === 0 ? (
          <p className="muted">No templates found. Click "Sync from Meta" to pull your approved templates.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Template name</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Language</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Category</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>WABA</th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 4px", fontFamily: "monospace", fontWeight: 500 }}>{t.name}</td>
                    <td style={{ padding: "8px 4px" }}>{t.language}</td>
                    <td style={{ padding: "8px 4px" }}>
                      <span style={{ color: CATEGORY_COLORS[t.category] ?? "#333", fontWeight: 500 }}>{t.category}</span>
                    </td>
                    <td style={{ padding: "8px 4px" }}><StatusBadge status={t.status} /></td>
                    <td style={{ padding: "8px 4px" }}>{t.waba?.name ?? "—"}</td>
                    <td style={{ padding: "8px 4px", textAlign: "right" }}>
                      <button className="btn-mini" onClick={() => viewDetail(t.id)}>View</button>
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
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;
  return (
    <span style={{ background: c.bg, color: c.fg, padding: "2px 9px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      {status}
    </span>
  );
}
