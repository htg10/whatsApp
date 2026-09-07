"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";

const FEATURES = [
  { icon: "💬", title: "Team Inbox", desc: "One shared WhatsApp inbox — assign chats to agents, reply with media, reopen 24-hour windows with templates." },
  { icon: "📣", title: "Campaigns & Bulk Send", desc: "Blast approved templates to thousands, with delivery, read and reply reports you can download." },
  { icon: "🧩", title: "Template Builder", desc: "Design WhatsApp templates with a live phone preview and submit them to Meta for approval in a click." },
  { icon: "🤖", title: "Chatbot", desc: "Auto-reply to keywords 24×7 with text or templates — no code, just rules." },
  { icon: "📸", title: "Facebook & Instagram", desc: "Compose, schedule and publish posts and reels to FB & IG right from your workspace." },
  { icon: "📊", title: "Analytics & Roles", desc: "Track everything, manage agents with fine-grained access, and run it all on flexible plans." },
];

export default function Landing() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => { setLoggedIn(!!getToken()); }, []);

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-brand">
          <img src="/logo.png" alt="PiziDesk" />
        </div>
        <nav className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          {loggedIn
            ? <Link href="/dashboard" className="lp-btn lp-btn-solid">Go to dashboard</Link>
            : <Link href="/login" className="lp-btn lp-btn-solid">Login</Link>}
        </nav>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-inner">
          <span className="lp-eyebrow">WhatsApp Business Suite</span>
          <h1>Live Better, Support Smarter.</h1>
          <p>
            PiziDesk is the all-in-one platform to run WhatsApp for your business — shared inbox,
            campaigns, chatbots, templates, and Facebook &amp; Instagram publishing, in one place.
          </p>
          <div className="lp-cta">
            <Link href="/login" className="lp-btn lp-btn-solid lp-btn-lg">Login</Link>
            <Link href="/register" className="lp-btn lp-btn-ghost lp-btn-lg">Create account</Link>
          </div>
        </div>
      </section>

      <section id="features" className="lp-section">
        <h2>Everything your team needs</h2>
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

      <section id="pricing" className="lp-cta-band">
        <h2>Ready to get started?</h2>
        <p>Sign in to your workspace, or create a new account in minutes.</p>
        <div className="lp-cta">
          <Link href="/login" className="lp-btn lp-btn-solid lp-btn-lg">Login</Link>
          <Link href="/register" className="lp-btn lp-btn-outline lp-btn-lg">Create account</Link>
        </div>
      </section>

      <footer className="lp-footer">
        © {new Date().getFullYear()} Pizi India Pvt Ltd · PiziDesk
      </footer>
    </div>
  );
}
