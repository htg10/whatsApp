"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

export default function DashboardPage() {
  const user = useUser();
  const [numbers, setNumbers] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api.whatsapp.numbers(token).then((d) => setNumbers(d.numbers.length)).catch(() => {});
  }, []);

  const isSuperAdmin = user.is_super_admin;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name} 👋`}
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
        <div className="stat"><div className="label">Contacts</div><div className="value">0</div></div>
        <div className="stat"><div className="label">Conversations</div><div className="value">0</div></div>
        <div className="stat"><div className="label">Messages today</div><div className="value">0</div></div>
        <div className="stat"><div className="label">WhatsApp numbers</div><div className="value">{numbers}</div></div>
        <div className="stat"><div className="label">Wallet balance</div><div className="value">₹0</div></div>
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

      <div className="panel">
        <h2>Getting started</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Your workspace is live. Next: connect a WhatsApp number under <b>WhatsApp</b>,
          then import contacts and create a message template.
        </p>
      </div>
    </>
  );
}
