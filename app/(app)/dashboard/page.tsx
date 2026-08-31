"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import { api, DashboardStats } from "@/lib/api";
import { getToken } from "@/lib/auth";

const ROLE_LABELS: Record<string, string> = {
  "tenant-owner": "Admin", "user": "User", "super-admin": "Admin", "manager": "Manager", "agent": "User",
};

function StatCard({ icon, bg, label, value, color }: { icon: string; bg: string; label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="stat-card">
      <div className="ic" style={{ background: bg }}>{icon}</div>
      <div>
        <div className="sc-label">{label}</div>
        <div className="sc-value" style={color ? { color } : undefined}>{value}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [numbers, setNumbers] = useState(0);

  const perms = user.permissions ?? [];
  const isAdmin = (user.roles ?? []).includes("tenant-owner") || user.is_super_admin;
  const can = (p: string) => perms.includes(p);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    if (can("whatsapp.view")) api.whatsapp.numbers(token).then((d) => setNumbers(d.numbers.length)).catch(() => {});
    if (can("analytics.view")) api.analytics.dashboard(token).then(setStats).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleName = user.roles?.[0] ? (ROLE_LABELS[user.roles[0]] ?? user.roles[0]) : null;

  return (
    <>
      {/* Hero */}
      <div className="hero">
        <h1>
          Welcome, {user.name}
          {roleName && <span className="hero-badge">{roleName}</span>}
        </h1>
        <div className="hero-sub">
          {user.is_super_admin
            ? "Platform account"
            : `${user.tenant?.company_name ?? user.tenant?.name ?? "Your workspace"} · ${user.tenant?.status ?? "active"}`}
          {isAdmin ? " · You have full workspace access." : " · Agent workspace."}
        </div>
      </div>

      {user.is_super_admin && (
        <div className="panel" style={{ background: "#fff8e6", borderColor: "#f5e2a3" }}>
          You are signed in as the platform <b>Super Admin</b>. Register a company account to try tenant features.
        </div>
      )}

      {/* Quick actions (admins get more) */}
      <div className="quick-actions">
        {can("conversations.view") && <Link href="/inbox" className="quick-action">✉ Open Inbox</Link>}
        {can("campaigns.view") && <Link href="/campaigns" className="quick-action">📣 New Campaign</Link>}
        {can("contacts.view") && <Link href="/contacts" className="quick-action">☰ Contacts</Link>}
        {can("team.view") && <Link href="/team" className="quick-action">👥 Manage Team</Link>}
        {can("billing.view") && <Link href="/billing" className="quick-action">₹ Billing</Link>}
      </div>

      {/* Primary stats */}
      <div className="stat-cards">
        <StatCard icon="👥" bg="#e7f0ff" label="Contacts" value={stats?.total_contacts ?? 0} />
        <StatCard icon="💬" bg="#e7f7ef" label="Conversations" value={stats?.total_conversations ?? 0} />
        <StatCard icon="🟢" bg="#e0f2ff" label="Open now" value={stats?.open_conversations ?? 0} color="#007bfc" />
        <StatCard icon="📨" bg="#fff3e0" label="Messages today" value={stats?.messages_today ?? 0} />
        {can("whatsapp.view") && <StatCard icon="✆" bg="#eafaf1" label="WhatsApp numbers" value={numbers} />}
        {can("templates.view") && <StatCard icon="✓" bg="#e7f7ef" label="Approved templates" value={stats?.templates_approved ?? 0} color="#0a7d47" />}
      </div>

      {/* Admin-only deeper analytics */}
      {isAdmin && (
        <>
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Message activity</h2>
            <div className="stat-cards" style={{ marginBottom: 0 }}>
              <StatCard icon="📤" bg="#e7f7ef" label="Outbound today" value={stats?.outbound_today ?? 0} />
              <StatCard icon="📥" bg="#e7f0ff" label="Inbound today" value={stats?.inbound_today ?? 0} />
              <StatCard icon="📅" bg="#fff3e0" label="This week" value={stats?.messages_this_week ?? 0} />
              <StatCard icon="🗓️" bg="#f3e8ff" label="This month" value={stats?.messages_this_month ?? 0} />
            </div>
          </div>

          {can("campaigns.view") && (
            <div className="panel">
              <h2 style={{ marginTop: 0 }}>Campaigns</h2>
              <div className="stat-cards" style={{ marginBottom: 0 }}>
                <StatCard icon="🚀" bg="#e0f2ff" label="Active campaigns" value={stats?.active_campaigns ?? 0} color="#007bfc" />
                <StatCard icon="📣" bg="#fff3e0" label="Total campaigns" value={stats?.total_campaigns ?? 0} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Agent-focused panel */}
      {!isAdmin && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Your work</h2>
          <p className="muted" style={{ marginBottom: 14 }}>Jump straight to your conversations and contacts.</p>
          <div className="quick-actions" style={{ marginBottom: 0 }}>
            <Link href="/inbox" className="quick-action">✉ Go to Inbox</Link>
            <Link href="/contacts" className="quick-action">☰ Contacts</Link>
          </div>
        </div>
      )}

      {/* Account */}
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Your account</h2>
        <div className="row"><span className="k">Email</span><span>{user.email}</span></div>
        <div className="row"><span className="k">Role</span><span>{roleName ?? "—"}</span></div>
        <div className="row"><span className="k">Workspace</span><span>{user.tenant?.name ?? "— (platform)"}</span></div>
        <div className="row"><span className="k">Plan status</span><span>{user.tenant?.status ?? "—"}</span></div>
        <div className="row"><span className="k">Trial ends</span><span>{user.tenant?.trial_ends_at ? new Date(user.tenant.trial_ends_at).toLocaleDateString("en-IN") : "—"}</span></div>
        <div className="row"><span className="k">Permissions</span><span>{(user.permissions ?? []).length} granted</span></div>
      </div>
    </>
  );
}
