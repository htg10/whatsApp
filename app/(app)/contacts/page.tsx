"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, ContactItem, TagItem } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ContactItem | null>(null);
  const [form, setForm] = useState({ phone: "", name: "", email: "", company: "", tags: "" });
  const [submitting, setSubmitting] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [detail, setDetail] = useState<ContactItem | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        api.contacts.list(token, { search: search || undefined, tag: filterTag || undefined, page }),
        api.tags.list(token),
      ]);
      setContacts(c.contacts);
      setMeta(c.meta);
      setTags(t.tags);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }, [search, filterTag, page]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ phone: "", name: "", email: "", company: "", tags: "" });
    setShowForm(true);
    setShowImport(false);
    setError(null);
  }

  function openEdit(c: ContactItem) {
    setEditing(c);
    setForm({
      phone: c.phone,
      name: c.name ?? "",
      email: c.email ?? "",
      company: c.company ?? "",
      tags: c.tags?.map((t) => t.name).join(", ") ?? "",
    });
    setShowForm(true);
    setShowImport(false);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    const tagList = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    try {
      if (editing) {
        await api.contacts.update(token, editing.id, {
          name: form.name || null,
          email: form.email || null,
          company: form.company || null,
          tags: tagList,
        });
        setNotice("Contact updated.");
      } else {
        await api.contacts.create(token, {
          phone: form.phone,
          name: form.name || undefined,
          email: form.email || undefined,
          company: form.company || undefined,
          tags: tagList.length ? tagList : undefined,
        });
        setNotice("Contact created.");
      }
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

  async function remove(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      await api.contacts.remove(token, id);
      setNotice("Contact deleted.");
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportText(ev.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function parseCSV(text: string): { phone: string; name?: string; email?: string; company?: string }[] {
    const lines = text.split(/[\n\r]+/).filter(Boolean);
    if (lines.length === 0) return [];
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes("phone") || header.includes("name") || header.includes("email");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      const cols = line.split(/[,;\t]+/).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      if (cols.length === 1) return { phone: cols[0] };
      return { phone: cols[0], name: cols[1] || undefined, email: cols[2] || undefined, company: cols[3] || undefined };
    }).filter((r) => r.phone.length >= 10);
  }

  async function doImport() {
    const token = getToken();
    if (!token) return;
    const parsed = parseCSV(importText);
    if (parsed.length === 0) { setError("No valid contacts found."); return; }

    setImporting(true);
    setError(null);
    try {
      const res = await api.contacts.import(token, parsed);
      setNotice(`Import done: ${res.created} created, ${res.updated} updated, ${res.skipped} skipped.`);
      setShowImport(false);
      setImportText("");
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setImporting(false);
    }
  }

  async function viewDetail(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.contacts.get(token, id);
      setDetail(res.contact);
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  const parsedImportCount = parseCSV(importText).length;

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle={`${meta.total} contacts`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" style={{ width: "auto", padding: "10px 18px", background: "#555" }} onClick={() => { setShowImport((v) => !v); setShowForm(false); setError(null); }}>
              {showImport ? "Close" : "Import CSV"}
            </button>
            <button className="btn" style={{ width: "auto", padding: "10px 18px" }} onClick={openCreate}>
              + Add Contact
            </button>
          </div>
        }
      />

      {notice && <div className="panel" style={{ background: "#e7f7ef", borderColor: "#b6e6cd", color: "#0a7d47" }}>{notice}</div>}
      {error && <div className="error">{error}</div>}

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, phone, email..."
          style={{ flex: 1, minWidth: 200, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14 }}
        />
        <select
          value={filterTag}
          onChange={(e) => { setFilterTag(e.target.value); setPage(1); }}
          style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14 }}
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.contacts_count})</option>
          ))}
        </select>
      </div>

      {/* Import form */}
      {showImport && (
        <div className="panel">
          <h2>Import Contacts</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Upload a CSV file or paste data. Format: phone, name, email, company (one per line). First row can be a header.
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            <button type="button" className="btn-mini" onClick={() => fileRef.current?.click()}>Upload CSV</button>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleFile} />
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={"phone,name,email,company\n919876543210,John,john@example.com,Acme Inc"}
            rows={8}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, fontFamily: "monospace", resize: "vertical" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span className="muted" style={{ fontSize: 12 }}>{parsedImportCount} contacts detected</span>
            <button className="btn" style={{ width: "auto", padding: "10px 18px" }} disabled={importing || parsedImportCount === 0} onClick={doImport}>
              {importing ? "Importing…" : `Import ${parsedImportCount} contacts`}
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="panel">
          <h2>{editing ? "Edit Contact" : "Add Contact"}</h2>
          <form onSubmit={save}>
            <div className="field">
              <label>Phone (with country code)</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required disabled={!!editing} placeholder="919876543210" />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div className="field" style={{ flex: 1, minWidth: 180 }}>
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
              </div>
              <div className="field" style={{ flex: 1, minWidth: 180 }}>
                <label>Email</label>
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="john@example.com" type="email" />
              </div>
              <div className="field" style={{ flex: 1, minWidth: 180 }}>
                <label>Company</label>
                <input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Acme Inc" />
              </div>
            </div>
            <div className="field">
              <label>Tags (comma-separated)</label>
              <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="vip, lead, pg-owner" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" disabled={submitting}>{submitting ? "Saving…" : editing ? "Update" : "Add Contact"}</button>
              <button type="button" className="btn" style={{ background: "#888" }} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Contact detail */}
      {detail && (
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>{detail.name || detail.phone}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-mini" onClick={() => { openEdit(detail); setDetail(null); }}>Edit</button>
              <button className="btn-mini" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, margin: "12px 0" }}>
            <div><span className="muted">Phone:</span> {detail.phone}</div>
            <div><span className="muted">WhatsApp ID:</span> {detail.wa_id}</div>
            <div><span className="muted">Email:</span> {detail.email ?? "—"}</div>
            <div><span className="muted">Company:</span> {detail.company ?? "—"}</div>
            <div><span className="muted">Source:</span> {detail.source ?? "—"}</div>
            <div><span className="muted">Blocked:</span> {detail.is_blocked ? "Yes" : "No"}</div>
            <div><span className="muted">Opted out:</span> {detail.opted_out ? "Yes" : "No"}</div>
            <div><span className="muted">Last active:</span> {detail.last_interaction_at ? new Date(detail.last_interaction_at).toLocaleDateString("en-IN") : "—"}</div>
            {detail.conversations_count !== undefined && <div><span className="muted">Conversations:</span> {detail.conversations_count}</div>}
          </div>
          {detail.tags && detail.tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {detail.tags.map((t) => (
                <span key={t.id} style={{ background: t.color + "22", color: t.color, padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{t.name}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contacts table */}
      <div className="panel">
        {loading ? (
          <div className="loading-block"><span className="spinner" /><span>Loading…</span></div>
        ) : contacts.length === 0 ? (
          <p className="muted">No contacts found. Add contacts or import a CSV.</p>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "8px 4px", width: 48 }}>#</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Name</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Phone</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Email</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Tags</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Source</th>
                    <th style={{ textAlign: "right", padding: "8px 4px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 4px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                        {(meta.current_page - 1) * 25 + i + 1}
                      </td>
                      <td style={{ padding: "8px 4px", cursor: "pointer", color: "#1a7f64", fontWeight: 500 }} onClick={() => viewDetail(c.id)}>
                        {c.name || "—"}
                      </td>
                      <td style={{ padding: "8px 4px", fontFamily: "monospace" }}>{c.phone}</td>
                      <td style={{ padding: "8px 4px" }}>{c.email ?? "—"}</td>
                      <td style={{ padding: "8px 4px" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {c.tags?.map((t) => (
                            <span key={t.id} style={{ background: t.color + "22", color: t.color, padding: "1px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{t.name}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "8px 4px", textTransform: "capitalize" }}>{c.source ?? "—"}</td>
                      <td style={{ padding: "8px 4px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button className="btn-mini" onClick={() => openEdit(c)}>Edit</button>
                          <button className="btn-mini danger" onClick={() => remove(c.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta.last_page > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                <button className="btn-mini" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                <span className="muted" style={{ alignSelf: "center", fontSize: 13 }}>Page {meta.current_page} of {meta.last_page}</span>
                <button className="btn-mini" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
