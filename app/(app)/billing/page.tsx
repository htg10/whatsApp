"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import { PageHeader } from "@/components/PageHeader";
import { LoadingBlock } from "@/components/Preloader";
import { getToken } from "@/lib/auth";
import {
  api, ApiError, PlanItem, SubscriptionItem2, WalletInfo, WalletTxn, InvoiceItem,
} from "@/lib/api";

export default function BillingPage() {
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [subscription, setSubscription] = useState<SubscriptionItem2 | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [txns, setTxns] = useState<WalletTxn[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [ov, pl, wl, inv] = await Promise.all([
        api.billing.overview(token).catch(() => ({
          subscription: null as SubscriptionItem2 | null,
          wallet: null as unknown as WalletInfo,
          tenant: { status: null, trial_ends_at: null },
        })),
        api.billing.plans(token).catch(() => ({ plans: [] as PlanItem[] })),
        api.billing.wallet(token).catch(() => ({ wallet: null as WalletInfo | null, transactions: [] as WalletTxn[] })),
        api.billing.invoices(token).catch(() => ({ invoices: [] as InvoiceItem[], meta: { current_page: 1, last_page: 1, total: 0 } })),
      ]);
      setSubscription(ov.subscription);
      setWallet(ov.wallet ?? wl.wallet);
      setPlans(pl.plans);
      setTxns(wl.transactions);
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

  async function switchPlan(plan: PlanItem) {
    const token = getToken();
    if (!token) return;
    if (!confirm(`Switch to the ${plan.name} plan?`)) return;
    setSwitching(plan.id);
    setError(null);
    try {
      const res = await api.billing.subscribe(token, plan.id);
      setSubscription(res.subscription);
      flash(`You're now on the ${plan.name} plan.`);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setSwitching(null);
    }
  }

  const currentPlanId = subscription?.plan?.id;
  const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN") : "—");

  return (
    <>
      <PageHeader title="Billing" subtitle="Plan, wallet & invoices" />

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
              <div className="label">Wallet balance</div>
              <div className="value" style={{ fontSize: 20, color: "#0a7d47" }}>{wallet?.balance ?? "₹0.00"}</div>
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
                      {p.features.length > 0 && (
                        <ul style={{ margin: "10px 0", paddingLeft: 18, fontSize: 13, color: "#54656f" }}>
                          {p.features.slice(0, 6).map((f, i) => <li key={i} style={{ marginBottom: 3 }}>{f}</li>)}
                        </ul>
                      )}
                      <button
                        className="btn"
                        style={{ width: "100%", marginTop: 10, opacity: isCurrent ? 0.6 : 1 }}
                        disabled={isCurrent || switching === p.id}
                        onClick={() => switchPlan(p)}
                      >
                        {isCurrent ? "Current plan" : switching === p.id ? "Switching…" : "Choose plan"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Wallet ledger */}
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Wallet activity</h2>
            {txns.length === 0 ? (
              <p className="muted">No wallet transactions yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 12, color: "#667781", borderBottom: "1px solid #eef1f2" }}>
                    <th style={{ padding: "8px 6px" }}>Date</th>
                    <th style={{ padding: "8px 6px" }}>Type</th>
                    <th style={{ padding: "8px 6px" }}>Description</th>
                    <th style={{ padding: "8px 6px", textAlign: "right" }}>Amount</th>
                    <th style={{ padding: "8px 6px", textAlign: "right" }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #f6f7f8" }}>
                      <td style={{ padding: "8px 6px", fontSize: 13 }}>{fmtDate(t.created_at)}</td>
                      <td style={{ padding: "8px 6px", fontSize: 13, textTransform: "capitalize" }}>{t.type}</td>
                      <td style={{ padding: "8px 6px", fontSize: 13 }}>{t.description ?? "—"}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: t.amount_minor < 0 ? "#c53030" : "#0a7d47" }}>{t.amount}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{t.balance_after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            Online payments (card / UPI via Razorpay) are coming next. For now, plan changes are applied directly and wallet top-ups are handled by your account manager.
          </p>
        </>
      )}
    </>
  );
}
