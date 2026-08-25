"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import { api, DashboardStats } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

export default function DashboardPage() {
  const user = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [numbers, setNumbers] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api.whatsapp.numbers(token).then((d) => setNumbers(d.numbers.length)).catch(() => {});
    api.analytics.dashboard(token).then(setStats).catch(() => {});
  }, []);

  const isSuperAdmin = user.is_super_admin;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name}`}
        subtitle={
          isSuperAdmin
            ? "Super Admin · platform account"
            : `${user.tenant?.company_name ?? user.tenant?.name} · ${user.tenant?.status}`
        }
      />

      {isSuperAdmin && (
        <div className="panel" style={{ background: "#fff8e6", borderColor: "#f5e2a3" }}>
          You are signed in as the platform <b>Super Admin</b>. Tenant features (WhatsApp,
          Contacts, Campaigns) belong to a company workspace — register a company account to try them.
        </div>
      )}

      <div className="grid">
        <div className="stat">
          <div className="label">Contacts</div>
          <div className="value">{stats?.total_contacts ?? 0}</div>
        </div>
        <div className="stat">
          <div className="label">Conversations</div>
          <div className="value">{stats?.total_conversations ?? 0}</div>
        </div>
        <div className="stat">
          <div className="label">Open conversations</div>
          <div className="value" style={{ color: "#007bfc" }}>{stats?.open_conversations ?? 0}</div>
        </div>
        <div className="stat">
          <div className="label">Messages today</div>
          <div className="value">{stats?.messages_today ?? 0}</div>
        </div>
        <div className="stat">
          <div className="label">WhatsApp numbers</div>
          <div className="value">{numbers}</div>
        </div>
        <div className="stat">
          <div className="label">Approved templates</div>
          <div className="value" style={{ color: "#0a7d47" }}>{stats?.templates_approved ?? 0}</div>
        </div>
      </div>

      {/* Message summary */}
      <div className="panel">
        <h2>Message activity</h2>
        <div className="grid" style={{ marginTop: 12 }}>
          <div className="stat">
            <div className="label">Outbound today</div>
            <div className="value">{stats?.outbound_today ?? 0}</div>
          </div>
          <div className="stat">
            <div className="label">Inbound today</div>
            <div className="value">{stats?.inbound_today ?? 0}</div>
          </div>
          <div className="stat">
            <div className="label">This week</div>
            <div className="value">{stats?.messages_this_week ?? 0}</div>
          </div>
          <div className="stat">
            <div className="label">This month</div>
            <div className="value">{stats?.messages_this_month ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Campaigns */}
      <div className="panel">
        <h2>Campaigns</h2>
        <div className="grid" style={{ marginTop: 12 }}>
          <div className="stat">
            <div className="label">Active campaigns</div>
            <div className="value" style={{ color: "#007bfc" }}>{stats?.active_campaigns ?? 0}</div>
          </div>
          <div className="stat">
            <div className="label">Total campaigns</div>
            <div className="value">{stats?.total_campaigns ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Your account</h2>
        <div className="row"><span className="k">Email</span><span>{user.email}</span></div>
        <div className="row"><span className="k">Role</span><span>{user.roles.join(", ") || "—"}</span></div>
        <div className="row"><span className="k">Workspace</span><span>{user.tenant?.name ?? "— (platform)"}</span></div>
        <div className="row"><span className="k">Plan status</span><span>{user.tenant?.status ?? "—"}</span></div>
        <div className="row"><span className="k">Trial ends</span><span>{user.tenant?.trial_ends_at ? new Date(user.tenant.trial_ends_at).toLocaleDateString() : "—"}</span></div>
        <div className="row"><span className="k">Permissions</span><span>{user.permissions.length} granted</span></div>
      </div>
    </>
  );
}
