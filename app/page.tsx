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

/** A friendly, premium 3D-style chatbot mascot drawn as inline SVG (crisp at any size). */
function BotIllustration() {
  return (
    <svg viewBox="0 0 320 360" width="100%" height="100%" role="img" aria-label="AI chatbot" style={{ maxWidth: 320, display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id="botAura" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#5df0d8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#5df0d8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="botBody" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#5ff0d8" />
          <stop offset="0.45" stopColor="#1fc9bb" />
          <stop offset="1" stopColor="#0a6476" />
        </linearGradient>
        <linearGradient id="botRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="botScreen" cx="0.5" cy="0.35" r="0.85">
          <stop offset="0" stopColor="#1a4651" />
          <stop offset="0.7" stopColor="#0a2a33" />
          <stop offset="1" stopColor="#051a20" />
        </radialGradient>
        <radialGradient id="botEye" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#d6fffa" />
          <stop offset="0.45" stopColor="#4ff0dd" />
          <stop offset="1" stopColor="#12b9ad" />
        </radialGradient>
        <linearGradient id="botAccent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc06a" />
          <stop offset="1" stopColor="#f26f21" />
        </linearGradient>
        <linearGradient id="botPill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e4f7f3" />
        </linearGradient>
        <filter id="botSoft" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="22" stdDeviation="20" floodColor="#001015" floodOpacity="0.5" />
        </filter>
        <filter id="botGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="botBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>

      {/* aura + ground shadow */}
      <circle cx="160" cy="180" r="140" fill="url(#botAura)" />
      <ellipse cx="160" cy="330" rx="104" ry="18" fill="#00141a" opacity="0.4" filter="url(#botBlur)" />

      {/* antenna */}
      <rect x="155" y="22" width="10" height="34" rx="5" fill="#0a6476" />
      <circle cx="160" cy="20" r="13" fill="url(#botAccent)" filter="url(#botGlow)" />
      <circle cx="156" cy="16" r="4" fill="#fff" opacity="0.8" />

      {/* headphones ears */}
      <rect x="44" y="150" width="40" height="76" rx="20" fill="url(#botAccent)" filter="url(#botSoft)" />
      <rect x="236" y="150" width="40" height="76" rx="20" fill="url(#botAccent)" filter="url(#botSoft)" />
      <rect x="52" y="158" width="12" height="40" rx="6" fill="#fff" opacity="0.35" />
      <rect x="244" y="158" width="12" height="40" rx="6" fill="#fff" opacity="0.25" />

      {/* body */}
      <rect x="60" y="56" width="200" height="206" rx="52" fill="url(#botBody)" filter="url(#botSoft)" />
      {/* rim light + top sheen */}
      <rect x="60" y="56" width="200" height="206" rx="52" fill="none" stroke="url(#botRim)" strokeWidth="3" opacity="0.6" />
      <ellipse cx="160" cy="92" rx="86" ry="34" fill="#ffffff" opacity="0.22" />

      {/* face screen */}
      <rect x="88" y="98" width="144" height="114" rx="36" fill="url(#botScreen)" />
      <rect x="88" y="98" width="144" height="114" rx="36" fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="2" />
      {/* glossy screen highlight */}
      <path d="M100 118 Q160 104 220 118 L220 134 Q160 122 100 134 Z" fill="#ffffff" opacity="0.08" />

      {/* eyes */}
      <circle cx="131" cy="150" r="20" fill="url(#botEye)" filter="url(#botGlow)" />
      <circle cx="189" cy="150" r="20" fill="url(#botEye)" filter="url(#botGlow)" />
      <circle cx="137" cy="143" r="6" fill="#ffffff" />
      <circle cx="195" cy="143" r="6" fill="#ffffff" />
      {/* cheeks */}
      <circle cx="108" cy="178" r="8" fill="#ff8a5c" opacity="0.55" />
      <circle cx="212" cy="178" r="8" fill="#ff8a5c" opacity="0.55" />
      {/* smile */}
      <path d="M138 182 Q160 200 182 182" fill="none" stroke="#5ff0dd" strokeWidth="6" strokeLinecap="round" filter="url(#botGlow)" />

      {/* AI pill */}
      <rect x="112" y="224" width="96" height="40" rx="20" fill="url(#botPill)" filter="url(#botSoft)" />
      <text x="160" y="251" textAnchor="middle" fontSize="20" fontWeight="800" fill="#f26f21" fontFamily="system-ui, sans-serif" letterSpacing="1">AI</text>

      {/* sparkles */}
      <g fill="#ffd98a">
        <path d="M286 96 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5 z" opacity="0.95" />
        <path d="M34 74 l3.5 8 8 3.5 -8 3.5 -3.5 8 -3.5 -8 -8 -3.5 8 -3.5 z" opacity="0.8" />
        <circle cx="270" cy="210" r="4" opacity="0.7" />
        <circle cx="52" cy="128" r="3.5" opacity="0.6" />
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
              <Link href="/register" className="lp-btn lp-btn-ghost lp-btn-lg">Get Started</Link>
            </div>
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
            <Link href="/register" className="lp-btn lp-btn-accent lp-btn-lg">Try the chatbot</Link>
          </div>

          {/* 3D chatbot visual */}
          <div className="lp-bot-stage">
            <div className="lp-bot-ring" />
            <div className="lp-bot-float"><BotIllustration /></div>
            <div className="lp-bot-chat lp-bot-chat-1">How do I get started?</div>
            <div className="lp-bot-chat lp-bot-chat-2">Tap “Get Started” — you&apos;re live in 2 minutes! 🚀</div>
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
