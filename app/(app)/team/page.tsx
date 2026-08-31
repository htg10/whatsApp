"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, TeamMember, RoleOption } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useUser } from "@/lib/user-context";
import { PageHeader } from "@/components/PageHeader";
import { LoadingBlock } from "@/components/Preloader";

const ROLE_LABEL: Record<string, string> = {
  "tenant-owner": "Owner", "manager": "Manager", "agent": "Agent", "super-admin": "Admin",
};

export default function TeamPage() {
  const me = useUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "agent" });
  const [submitting, setSubmitting] = useState(false);
  const canManage = (me.permissions ?? []).includes("team.invite");
  const canRemove = (me.permissions ?? []).includes("team.remove");

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.team.list(token);
      setMembers(res.members);
      setRoles(res.roles);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.team.create(token, form);
      setShowAdd(false);
      setForm({ name: "", email: "", password: "", role: "agent" });
      flash(`${form.name} added to the team.`);
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function changeRole(m: TeamMember, role: string) {
    const token = getToken();
    if (!token) return;
    try {
      await api.team.update(token, m.id, { role });
      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, role } : x)));
      flash(`${m.name} is now ${ROLE_LABEL[role] ?? role}.`);
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  async function toggleActive(m: TeamMember) {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.team.toggle(token, m.id);
      setMembers((prev) => prev.map((x) => (x.id === m.id ? res.member : x)));
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  async function removeMember(m: TeamMember) {
    const token = getToken();
    if (!token) return;
    if (!confirm(`Remove ${m.name} from the team? They will lose access.`)) return;
    try {
      await api.team.remove(token, m.id);
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
      flash(`${m.name} removed.`);
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Manage who can access your workspace and what they can do."
        action={canManage ? <button className="btn" onClick={() => setShowAdd(true)}>+ Add member</button> : undefined}
      />

      {error && <div className="error">{error}</div>}
      {notice && <div className="panel" style={{ background: "#e7f7ef", color: "#0a7d47", marginBottom: 16 }}>{notice}</div>}

      {loading ? (
        <LoadingBlock label="Loading team…" />
      ) : (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 12, color: "#667781", background: "#f8fafb", borderBottom: "1px solid #eef1f2" }}>
                <th style={{ padding: "12px 14px" }}>Member</th>
                <th style={{ padding: "12px 14px" }}>Role</th>
                <th style={{ padding: "12px 14px" }}>Status</th>
                <th style={{ padding: "12px 14px" }}>Last login</th>
                <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isMe = m.email === me.email;
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f4f6f7" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#128c7e,#25d366)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                          {initials(m.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{m.name} {isMe && <span className="muted" style={{ fontSize: 12 }}>(you)</span>}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {canManage && !isMe ? (
                        <select value={m.role ?? "agent"} onChange={(e) => changeRole(m, e.target.value)} style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}>
                          {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span style={{ background: "#eef1f2", color: "#54656f", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{ROLE_LABEL[m.role ?? ""] ?? m.role ?? "—"}</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        background: m.status === "active" ? "#e7f7ef" : "#fdecec",
                        color: m.status === "active" ? "#0a7d47" : "#c53030",
                        padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                      }}>{m.status}</span>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#54656f" }}>
                      {m.last_login_at ? new Date(m.last_login_at).toLocaleDateString("en-IN") : "Never"}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      {canManage && !isMe && (
                        <button className="btn-mini" onClick={() => toggleActive(m)}>{m.status === "active" ? "Deactivate" : "Activate"}</button>
                      )}
                      {canRemove && !isMe && (
                        <button className="btn-mini" style={{ color: "#c53030", marginLeft: 6 }} onClick={() => removeMember(m)}>Remove</button>
                      )}
                      {isMe && <span className="muted" style={{ fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="msg-info-overlay" onClick={() => setShowAdd(false)}>
          <div className="msg-info-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h2 style={{ marginTop: 0 }}>Add team member</h2>
            <form onSubmit={addMember}>
              <div className="field">
                <label>Full name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Jane Doe" />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required placeholder="jane@company.com" />
              </div>
              <div className="field">
                <label>Temporary password</label>
                <input type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} placeholder="Min 8 characters" />
                <span className="muted" style={{ fontSize: 12 }}>Share this with them; they can change it after signing in.</span>
              </div>
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn" disabled={submitting}>{submitting ? "Adding…" : "Add member"}</button>
                <button type="button" className="btn-mini" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
