"use client";
import { useUser } from "@/lib/user-context";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export default function BillingPage() {
  const user = useUser();
  return (
    <>
      <PageHeader title="Billing" subtitle="Plan, wallet & invoices" />
      <div className="panel">
        <h2>Current plan</h2>
        <div className="row"><span className="k">Workspace status</span><span>{user.tenant?.status ?? "—"}</span></div>
        <div className="row"><span className="k">Trial ends</span><span>{user.tenant?.trial_ends_at ? new Date(user.tenant.trial_ends_at).toLocaleDateString() : "—"}</span></div>
        <div className="row"><span className="k">Wallet balance</span><span>₹0.00</span></div>
      </div>
      <ComingSoon feature="Plans, wallet & invoices" phase="Phase 17 (Billing)" />
    </>
  );
}
