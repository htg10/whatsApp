"use client";

import { PageHeader } from "@/components/PageHeader";

export default function SocialPage() {
  return (
    <div>
      <PageHeader title="Social" subtitle="Publish to Facebook & Instagram from PiziDesk." />

      <div className="panel" style={{
        textAlign: "center", padding: "48px 24px",
        background: "linear-gradient(135deg,#f5f0ff,#eef7ff)",
      }}>
        <div style={{ fontSize: 46 }}>📸</div>
        <h2 style={{ margin: "12px 0 6px" }}>Facebook &amp; Instagram publishing</h2>
        <p className="muted" style={{ maxWidth: 460, margin: "0 auto 20px" }}>
          Compose a post once — image plus caption — and publish it to your Facebook Page
          and Instagram Business account, now or scheduled for later. Coming very soon.
        </p>

        {/* Compose preview */}
        <div style={{ maxWidth: 380, margin: "0 auto", textAlign: "left", background: "#fff", borderRadius: 14, boxShadow: "0 8px 30px rgba(0,0,0,.08)", overflow: "hidden" }}>
          <div style={{ height: 150, background: "linear-gradient(135deg,#128c7e22,#25d36622)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8aa", fontSize: 13 }}>
            🖼️ Post image
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 13, color: "#54656f", marginBottom: 12 }}>Diwali sale — 20% off everything! 🎉 #festival #offer</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, background: "#e7f0ff", color: "#1877f2", padding: "4px 10px", borderRadius: 999 }}>f  Facebook</span>
              <span style={{ fontSize: 12, fontWeight: 600, background: "#fdeef5", color: "#c13584", padding: "4px 10px", borderRadius: 999 }}>◙  Instagram</span>
            </div>
            <button className="btn" style={{ width: "100%" }} disabled>Publish (coming soon)</button>
          </div>
        </div>

        <p className="muted" style={{ fontSize: 12, marginTop: 20 }}>
          Requires connecting your Facebook Page and Instagram Business account.
        </p>
      </div>
    </div>
  );
}
