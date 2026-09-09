"use client";

import Link from "next/link";
import { useUser } from "@/lib/user-context";
import { PageHeader } from "@/components/PageHeader";

/**
 * Returns false only when the plan explicitly sets this limit to 0 (feature not
 * included). null (unlimited), a positive number, or no gating → true.
 */
export function planAllows(limits: Record<string, number | null> | null | undefined, key: string): boolean {
  if (!limits) return true; // no gating (super admin / no plan map)
  return limits[key] !== 0;
}

/**
 * "Upgrade your plan" screen shown in place of a restricted module. The backend
 * enforces the same limit on every write, so this cannot be bypassed via URL/API.
 */
export function UpgradePrompt({ title, feature }: { title: string; feature: string }) {
  const user = useUser();
  const company = user.tenant?.company_name ?? user.tenant?.name ?? null;
  return (
    <div>
      <PageHeader title={title} />
      <div className="panel" style={{ textAlign: "center", padding: "48px 24px", maxWidth: 560, margin: "0 auto" }}>
        <div style={{ fontSize: 46 }}>🔒</div>
        <h2 style={{ margin: "14px 0 6px" }}>Upgrade your plan</h2>
        <p className="muted" style={{ marginBottom: 4 }}>
          {feature} isn&apos;t included in your current plan{company ? ` (${company})` : ""}.
        </p>
        <p className="muted" style={{ marginBottom: 22 }}>Upgrade to unlock {feature.toLowerCase()} and more.</p>
        <Link href="/billing" className="btn" style={{ display: "inline-block", width: "auto", padding: "12px 28px", textDecoration: "none" }}>
          View plans &amp; upgrade
        </Link>
      </div>
    </div>
  );
}
