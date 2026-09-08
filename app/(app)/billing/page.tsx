"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import { PageHeader } from "@/components/PageHeader";
import { LoadingBlock } from "@/components/Preloader";
import { getToken } from "@/lib/auth";
import {
  api, ApiError, PlanItem, SubscriptionItem2, InvoiceItem,
} from "@/lib/api";

const LIMIT_LABELS: Record<string, string> = {
  max_agents: "Agents", max_contacts: "Contacts", max_campaigns: "Campaigns",
  max_chatbots: "Chatbots", max_templates: "Templates",
};
const FEATURE_LABELS: Record<string, string> = {
  reports: "Reports", advanced_reports: "Advanced reports", export: "Export",
  social: "Social publishing", chatbot: "Chatbot", automations: "Automations", api_access: "API access",
};
const showLimit = (v: number | undefined) => (v === undefined || v < 0 ? "Unlimited" : v.toLocaleString("en-IN"));

export default function BillingPage() {
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [subscription, setSubscription] = useState<SubscriptionItem2 | null>(null);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [ov, pl, inv] = await Promise.all([
        api.billing.overview(token).catch(() => ({
          subscription: null as SubscriptionItem2 | null,
          tenant: { status: null, trial_ends_at: null },
        })),
        api.billing.plans(token).catch(() => ({ plans: [] as PlanItem[] })),
        api.billing.invoices(token).catch(() => ({ invoices: [] as InvoiceItem[], meta: { current_page: 1, last_page: 1, total: 0 } })),
      ]);
      setSubscription(ov.subscription);
      setPlans(pl.plans);
      setInvoices(inv.invoices);
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

  function loadRazorpay(): Promise<boolean> {
    return new Promise((resolve) => {
      const w = window as unknown as { Razorpay?: unknown };
      if (w.Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  async function buyPlan(plan: PlanItem) {
    const token = getToken();
    if (!token) return;
    setSwitching(plan.id);
    setError(null);
    try {
      const order = await api.billing.order(token, plan.id);

      // Free plan — assigned immediately, no checkout.
      if (order.free) {
        setSubscription(order.subscription ?? null);
        flash(`You're now on the ${plan.name} plan.`);
        await load();
        setSwitching(null);
        return;
      }

      const ready = await loadRazorpay();
      if (!ready) {
        setError("Could not load the payment gateway. Check your connection and try again.");
        setSwitching(null);
        return;
      }

      const RazorpayCtor = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
      const rzp = new RazorpayCtor({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "Heltog SocialFlow",
        description: `${plan.name} plan`,
        prefill: { name: user.name, email: user.email },
        theme: { color: "#0e7c7b" },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const v = await api.billing.verify(token, {
              plan_id: plan.id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            setSubscription(v.subscription);
            flash(v.message);
            await load();
          } catch (err) {
            setError((err as ApiError).message);
          } finally {
            setSwitching(null);
          }
        },
        modal: { ondismiss: () => setSwitching(null) },
      });
      rzp.open();
    } catch (err) {
      setError((err as ApiError).message);
      setSwitching(null);
    }
  }

  const currentPlanId = subscription?.plan?.id;
  const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN") : "—");

  return (
    <>
      <PageHeader title="Billing" subtitle="Your plan & invoices" />

      {error && <div className="error">{error}</div>}
      {notice && <div className="panel" style={{ background: "#e7f7ef", color: "#0a7d47", marginBottom: 16 }}>{notice}</div>}

      {loading ? (
        <LoadingBlock label="Loading billing…" />
      ) : (
        <>
          {/* Summary row */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 18 }}>
            <div className="stat">
              <div className="label">Current plan</div>
              <div className="value" style={{ fontSize: 20 }}>{subscription?.plan?.name ?? "No plan"}</div>
            </div>
            <div className="stat">
              <div className="label">Status</div>
              <div className="value" style={{ fontSize: 20, textTransform: "capitalize" }}>{subscription?.status ?? user.tenant?.status ?? "—"}</div>
            </div>
            <div className="stat">
              <div className="label">Renews / ends</div>
              <div className="value" style={{ fontSize: 20 }}>{fmtDate(subscription?.current_period_end ?? user.tenant?.trial_ends_at ?? null)}</div>
            </div>
          </div>

          {/* Available plans */}
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Plans</h2>
            {plans.length === 0 ? (
              <p className="muted">No plans available. Ask an administrator to configure plans.</p>
            ) : (
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                {plans.map((p) => {
                  const isCurrent = p.id === currentPlanId;
                  return (
                    <div key={p.id} className="panel" style={{
                      border: isCurrent ? "2px solid var(--green)" : "1px solid var(--border)",
                      position: "relative",
                    }}>
                      {isCurrent && (
                        <span style={{ position: "absolute", top: 12, right: 12, background: "#e7f7ef", color: "#0a7d47", fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999 }}>
                          CURRENT
                        </span>
                      )}
                      <h3 style={{ margin: "0 0 4px" }}>{p.name}</h3>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {p.price_display}
                        <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}> / {p.billing_period === "yearly" ? "yr" : "mo"}</span>
                      </div>
                      {p.description && <p className="muted" style={{ fontSize: 13, margin: "8px 0" }}>{p.description}</p>}

                      {/* Numeric limits */}
                      <div style={{ display: "grid", gap: 4, fontSize: 13, color: "#54656f", margin: "12px 0 10px", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                        {Object.keys(LIMIT_LABELS).map((k) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>{LIMIT_LABELS[k]}</span>
                            <strong>{showLimit(p.limits?.[k])}</strong>
                          </div>
                        ))}
                      </div>

                      {/* Enabled features */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                        {Object.keys(FEATURE_LABELS).filter((k) => p.features?.[k]).map((k) => (
                          <span key={k} style={{ background: "#eafaf7", color: "#0a7d47", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                            ✓ {FEATURE_LABELS[k]}
                          </span>
                        ))}
                        {Object.keys(FEATURE_LABELS).filter((k) => p.features?.[k]).length === 0 && (
                          <span className="muted" style={{ fontSize: 12 }}>Core features included</span>
                        )}
                      </div>

                      <button
                        className="btn"
                        style={{ width: "100%", marginTop: 10, opacity: isCurrent ? 0.6 : 1 }}
                        disabled={isCurrent || switching === p.id}
                        onClick={() => buyPlan(p)}
                      >
                        {isCurrent ? "Current plan" : switching === p.id ? "Processing…" : p.price > 0 ? `Buy — ${p.price_display}` : "Choose plan"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Invoices</h2>
            {invoices.length === 0 ? (
              <p className="muted">No invoices yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 12, color: "#667781", borderBottom: "1px solid #eef1f2" }}>
                    <th style={{ padding: "8px 6px" }}>Number</th>
                    <th style={{ padding: "8px 6px" }}>Status</th>
                    <th style={{ padding: "8px 6px" }}>Issued</th>
                    <th style={{ padding: "8px 6px", textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid #f6f7f8" }}>
                      <td style={{ padding: "8px 6px", fontSize: 13, fontFamily: "monospace" }}>{inv.number ?? inv.id.slice(0, 8)}</td>
                      <td style={{ padding: "8px 6px", fontSize: 13, textTransform: "capitalize" }}>{inv.status}</td>
                      <td style={{ padding: "8px 6px", fontSize: 13 }}>{fmtDate(inv.issued_at)}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{inv.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Payments are processed securely by Razorpay (card / UPI / netbanking). Your plan activates automatically once payment succeeds.
          </p>
        </>
      )}
    </>
  );
}
