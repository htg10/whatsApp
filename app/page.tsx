"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";

const FEATURES = [
  { icon: "💬", title: "Team Inbox", desc: "One shared WhatsApp inbox — assign chats to agents, reply with media, reopen 24-hour windows with templates." },
  { icon: "📣", title: "Campaigns & Bulk Send", desc: "Blast approved templates to thousands, with delivery, read and reply reports you can download." },
  { icon: "🧩", title: "Template Builder", desc: "Design WhatsApp templates with a live phone preview and submit them to Meta for approval in one click." },
  { icon: "🤖", title: "Chatbot", desc: "Auto-reply to keywords 24×7 with text or templates — no code, just rules." },
  { icon: "📸", title: "Facebook & Instagram", desc: "Compose, schedule and publish posts and reels to FB & IG right from your workspace." },
  { icon: "📊", title: "Analytics & Roles", desc: "Track everything, manage agents with fine-grained access, and run it all on flexible plans." },
];

const STATS = [
  { value: "3-in-1", label: "WhatsApp · Facebook · Instagram" },
  { value: "24×7", label: "Automated replies" },
  { value: "1 Inbox", label: "For your whole team" },
  { value: "0 code", label: "Set up in minutes" },
];

export default function Landing() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => { setLoggedIn(!!getToken()); }, []);

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-brand"><img src="/logo.png" alt="Heltog SocialFlow" /></div>
        <nav className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#why">Why us</a>
          {loggedIn
            ? <Link href="/dashboard" className="lp-btn lp-btn-solid">Go to dashboard</Link>
            : <Link href="/login" className="lp-btn lp-btn-solid">Login</Link>}
        </nav>
      </header>

      <section className="lp-hero">
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-hero-grid">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow">Heltog SocialFlow</span>
            <h1>One platform for every customer conversation.</h1>
            <p>
              Run WhatsApp, Facebook and Instagram for your business from a single, beautiful
              workspace — shared inbox, campaigns, chatbots, templates and publishing, all in one place.
            </p>
            <div className="lp-cta">
              <Link href="/login" className="lp-btn lp-btn-accent lp-btn-lg">Login</Link>
              <Link href="/register" className="lp-btn lp-btn-ghost lp-btn-lg">Start free</Link>
            </div>
            <div className="lp-trust">No credit card needed · 14-day free trial</div>
          </div>

          {/* Chat mockup */}
          <div className="lp-mock">
            <div className="lp-mock-head">
              <span className="lp-mock-dot" /> <span className="lp-mock-dot" /> <span className="lp-mock-dot" />
              <span style={{ marginLeft: 10, fontSize: 12, color: "#8aa" }}>Heltog SocialFlow · Inbox</span>
            </div>
            <div className="lp-mock-body">
              <div className="lp-bubble lp-bubble-in">Hi! Do you deliver to Jaipur? 🚚</div>
              <div className="lp-bubble lp-bubble-out">Yes! Same-day delivery available. Want me to share the catalogue?</div>
              <div className="lp-bubble lp-bubble-in">Yes please 🙌</div>
              <div className="lp-bubble lp-bubble-out">📄 Catalogue_2026.pdf · sent ✓✓</div>
            </div>
          </div>
        </div>

        <div className="lp-stats">
          {STATS.map((s) => (
            <div key={s.label} className="lp-stat">
              <div className="lp-stat-v">{s.value}</div>
              <div className="lp-stat-l">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="lp-section">
        <h2>Everything your team needs</h2>
        <p className="lp-sub">From the first hello to the closed deal — all channels, one screen.</p>
        <div className="lp-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-card">
              <div className="lp-card-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="why" className="lp-why">
        <div className="lp-why-inner">
          <h2>Why Heltog SocialFlow?</h2>
          <div className="lp-why-grid">
            <div><div className="lp-why-ic">⚡</div><h4>Fast to launch</h4><p>Connect a number, import contacts, and start messaging the same day.</p></div>
            <div><div className="lp-why-ic">🔒</div><h4>Secure & isolated</h4><p>Every business&apos;s data is fully separated — agents only ever see their own workspace.</p></div>
            <div><div className="lp-why-ic">📈</div><h4>Built to scale</h4><p>From one agent to a hundred, with plans and permissions that grow with you.</p></div>
          </div>
        </div>
      </section>

      <section className="lp-cta-band">
        <h2>Ready to get started?</h2>
        <p>Sign in to your workspace, or create a new account in minutes.</p>
        <div className="lp-cta" style={{ justifyContent: "center" }}>
          <Link href="/login" className="lp-btn lp-btn-accent lp-btn-lg">Login</Link>
          <Link href="/register" className="lp-btn lp-btn-outline lp-btn-lg">Create account</Link>
        </div>
      </section>

      <footer className="lp-footer">
        © {new Date().getFullYear()} Heltog Technologies Pvt Ltd · Heltog SocialFlow
      </footer>
    </div>
  );
}
