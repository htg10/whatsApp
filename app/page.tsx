"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";

const FEATURES = [
  { icon: "💬", title: "Team Inbox", desc: "One shared WhatsApp inbox — assign chats to agents, reply with media, reopen 24-hour windows with templates." },
  { icon: "📣", title: "Campaigns & Bulk Send", desc: "Blast approved templates to thousands, with delivery, read and reply reports you can download." },
  { icon: "🧩", title: "Template Builder", desc: "Design WhatsApp templates with a live phone preview and submit them to Meta for approval in one click." },
  { icon: "🤖", title: "AI Chatbot", desc: "Auto-reply 24×7 with AI or keyword rules — capture leads and answer customers instantly, no code." },
  { icon: "📸", title: "Facebook & Instagram", desc: "Compose, schedule and publish posts and reels to FB & IG right from your workspace." },
  { icon: "📊", title: "Analytics & Roles", desc: "Track everything, manage agents with fine-grained access, and run it all on flexible plans." },
];

const STATS = [
  { value: "3-in-1", label: "WhatsApp · Facebook · Instagram" },
  { value: "24×7", label: "AI automated replies" },
  { value: "1 Inbox", label: "For your whole team" },
  { value: "0 code", label: "Set up in minutes" },
];

type PlanCard = { name: string; price: string; period: string; popular?: boolean; bullets: string[]; cta: string };

// Pricing shown on the landing page. Kept in sync with the admin Plans page.
const PLANS: PlanCard[] = [
  {
    name: "Starter",
    price: "₹14,999",
    period: "yr",
    cta: "Get started",
    bullets: ["1 team agent", "500 contacts", "10 campaigns / month", "50 chatbot flows", "50 templates", "Reports & AI chatbot"],
  },
  {
    name: "Business",
    price: "₹24,999",
    period: "yr",
    popular: true,
    cta: "Get started",
    bullets: ["2 team agents", "1,000 contacts", "20 campaigns / month", "100 chatbot flows", "100 templates", "Social publishing, export & automations"],
  },
  {
    name: "Enterprise",
    price: "₹34,999",
    period: "yr",
    cta: "Get started",
    bullets: ["5 team agents", "Unlimited contacts", "Unlimited campaigns", "Unlimited chatbots", "Unlimited templates", "API access + everything in Business"],
  },
];

/** A friendly, 3D-style chatbot mascot drawn as inline SVG (crisp at any size). */
function BotIllustration() {
  return (
    <svg viewBox="0 0 320 340" width="100%" height="100%" role="img" aria-label="AI chatbot" style={{ maxWidth: 320, display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="botBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2fe0c6" />
          <stop offset="0.5" stopColor="#12b4ac" />
          <stop offset="1" stopColor="#0a6f7e" />
        </linearGradient>
        <linearGradient id="botBelly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9f3ef" />
        </linearGradient>
        <radialGradient id="botScreen" cx="0.5" cy="0.4" r="0.8">
          <stop offset="0" stopColor="#123a44" />
          <stop offset="1" stopColor="#06222a" />
        </radialGradient>
        <linearGradient id="botAccent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb257" />
          <stop offset="1" stopColor="#f26f21" />
        </linearGradient>
        <filter id="botSoft" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#001b1f" floodOpacity="0.45" />
        </filter>
        <filter id="botGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="160" cy="314" rx="96" ry="16" fill="#00161a" opacity="0.35" />

      {/* antenna */}
      <rect x="156" y="20" width="8" height="30" rx="4" fill="#0a6f7e" />
      <circle cx="160" cy="18" r="11" fill="url(#botAccent)" filter="url(#botGlow)" />

      {/* headphones band + ears */}
      <path d="M70 150 A90 90 0 0 1 250 150" fill="none" stroke="#0a6f7e" strokeWidth="12" strokeLinecap="round" />
      <rect x="48" y="138" width="34" height="62" rx="16" fill="url(#botAccent)" />
      <rect x="238" y="138" width="34" height="62" rx="16" fill="url(#botAccent)" />

      {/* body */}
      <rect x="66" y="52" width="188" height="186" rx="46" fill="url(#botBody)" filter="url(#botSoft)" />
      {/* top sheen */}
      <rect x="84" y="66" width="152" height="60" rx="30" fill="#ffffff" opacity="0.18" />

      {/* face screen */}
      <rect x="94" y="92" width="132" height="104" rx="30" fill="url(#botScreen)" />
      {/* eyes */}
      <circle cx="132" cy="138" r="15" fill="#39e0cf" filter="url(#botGlow)" />
      <circle cx="188" cy="138" r="15" fill="#39e0cf" filter="url(#botGlow)" />
      <circle cx="137" cy="133" r="5" fill="#eafffb" />
      <circle cx="193" cy="133" r="5" fill="#eafffb" />
      {/* smile */}
      <path d="M128 166 Q160 190 192 166" fill="none" stroke="#39e0cf" strokeWidth="6" strokeLinecap="round" />

      {/* belly / AI panel */}
      <rect x="110" y="210" width="100" height="40" rx="20" fill="url(#botBelly)" />
      <text x="160" y="237" textAnchor="middle" fontSize="20" fontWeight="800" fill="#f26f21" fontFamily="system-ui, sans-serif">AI</text>

      {/* sparkles */}
      <g fill="#ffd27a">
        <path d="M284 90 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" opacity="0.9" />
        <path d="M40 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" opacity="0.75" />
      </g>
    </svg>
  );
}

export default function Landing() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => { setLoggedIn(!!getToken()); }, []);

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-brand"><img src="/logo.png" alt="Heltog SocialFlow" /></div>
        <nav className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#chatbot">Chatbot</a>
          <a href="#pricing">Pricing</a>
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

      {/* ---- AI Chatbot ---- */}
      <section id="chatbot" className="lp-chatbot">
        <div className="lp-chatbot-inner">
          <div className="lp-chatbot-copy">
            <span className="lp-eyebrow">AI Chatbot</span>
            <h2>Your 24×7 AI assistant on WhatsApp</h2>
            <p>
              Reply to every customer instantly — even at 2 AM. The AI understands questions,
              answers from your business info, captures hot leads, and hands off to your team
              when it matters.
            </p>
            <ul className="lp-check-list">
              <li>Instant AI replies in Hindi, English &amp; Hinglish</li>
              <li>Keyword rules for instant, zero-wait answers</li>
              <li>Auto-detects &amp; tags hot leads</li>
              <li>Smart follow-ups to quiet customers</li>
            </ul>
            <Link href="/register" className="lp-btn lp-btn-accent lp-btn-lg">Try the chatbot free</Link>
          </div>

          {/* 3D chatbot visual */}
          <div className="lp-bot-stage">
            <div className="lp-bot-ring" />
            <div className="lp-bot-float"><BotIllustration /></div>
            <div className="lp-bot-chat lp-bot-chat-1">How do I start a free trial?</div>
            <div className="lp-bot-chat lp-bot-chat-2">Tap “Start free” — you&apos;re live in 2 minutes! 🚀</div>
          </div>
        </div>
      </section>

      {/* ---- Pricing / Packages ---- */}
      <section id="pricing" className="lp-pricing">
        <h2>Simple, transparent pricing</h2>
        <p className="lp-sub">Pick the plan that fits your team. Upgrade anytime.</p>
        <div className="lp-price-grid">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`lp-price-card ${plan.popular ? "lp-price-popular" : ""}`}>
              {plan.popular && <div className="lp-price-tag">Most popular</div>}
              <h3>{plan.name}</h3>
              <div className="lp-price-amount">
                <span className="lp-price-value">{plan.price}</span>
                <span className="lp-price-per">/{plan.period}</span>
              </div>
              <div className="lp-price-trial">14-day free trial</div>
              <ul className="lp-check-list">
                {plan.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
              <Link href="/register" className={`lp-btn lp-btn-lg ${plan.popular ? "lp-btn-accent" : "lp-btn-outline"}`} style={{ width: "100%", justifyContent: "center" }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Features (below pricing) ---- */}
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
            <div><div className="lp-why-ic">🔒</div><h4>Secure &amp; isolated</h4><p>Every business&apos;s data is fully separated — agents only ever see their own workspace.</p></div>
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
