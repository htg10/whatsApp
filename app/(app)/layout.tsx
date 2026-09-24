"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api, ApiError, User } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { navFor } from "@/lib/nav";
import { UserContext } from "@/lib/user-context";
import { Preloader } from "@/components/Preloader";
import { NoPlanGate } from "@/components/PlanGate";

const ROLE_LABELS: Record<string, string> = {
  "super-admin": "Super Admin",
  "tenant-owner": "Admin",
  "agent": "Agent",
  "manager": "Admin",
  "user": "Agent",
};
function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

function TopBar({ user, onMenuToggle }: { user: User; onMenuToggle: () => void }) {
  const [dark, setDark] = useState(false);
  const [fs, setFs] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("theme"); } catch {}
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  }

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="appbar">
      <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu">☰</button>
      <div className="appbar-title">{user.tenant?.company_name ?? user.tenant?.name ?? "Heltog SocialFlow"}</div>
      <div className="appbar-actions">
        <div style={{ position: "relative" }}>
          <button className="appbar-btn" title="Notifications" onClick={() => setNotifOpen((v) => !v)}>🔔</button>
          {notifOpen && (
            <div className="appbar-pop" onMouseLeave={() => setNotifOpen(false)}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Notifications</div>
              <div className="muted" style={{ fontSize: 13 }}>You&apos;re all caught up — no new notifications.</div>
            </div>
          )}
        </div>
        <button className="appbar-btn" title={dark ? "Light mode" : "Dark mode"} onClick={toggleTheme}>{dark ? "☀️" : "🌙"}</button>
        <button className="appbar-btn" title={fs ? "Exit full screen" : "Full screen"} onClick={toggleFullscreen}>{fs ? "🡼" : "⛶"}</button>
        <div className="appbar-user">
          <div className="appbar-avatar">{initials}</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
            <div className="muted" style={{ fontSize: 11 }}>{user.roles?.[0] ? roleLabel(user.roles[0]) : ""}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    api
      .me(token)
      .then((data) => setUser(data.user))
      .catch((err) => {
        const e = err as ApiError;
        if (e.status === 401) {
          clearToken();
          router.replace("/login");
        } else {
          setError(e.message);
        }
      });
  }, [router]);

  function refreshUser() {
    const token = getToken();
    if (!token) return;
    api.me(token).then((data) => setUser(data.user)).catch(() => {});
  }

  function logout() {
    clearToken();
    router.replace("/login");
  }

  if (error) return <div className="center-screen">Error: {error}</div>;
  if (!user) return <Preloader label="Loading your workspace…" />;

  const hasActivePlan = user.is_super_admin ||
    user.subscription?.status === "active" ||
    user.subscription?.status === "trialing";

  if (!hasActivePlan) {
    return <NoPlanGate user={user} onActivated={refreshUser} />;
  }

  return (
    <UserContext.Provider value={user}>
      <div className="shell">
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
        <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
          <div className="logo" style={{ margin: "-20px -14px 18px", padding: "16px", background: "#fff", display: "flex", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.12)" }}>
            <img src="/logo.png" alt="Heltog SocialFlow" style={{ width: "100%", maxWidth: 180, height: "auto", display: "block" }} />
          </div>
          <nav>
            {navFor(user).map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} className={active ? "active" : ""} onClick={() => setSidebarOpen(false)}>
                  <span style={{ display: "inline-block", width: 22, opacity: 0.85 }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 13, color: "#cfe0dc" }}>{user.name}</div>
              {user.roles?.[0] && (
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", background: "rgba(255,255,255,.18)", color: "#fff", padding: "1px 7px", borderRadius: 999 }}>
                  {roleLabel(user.roles[0])}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#9fc0b8", marginBottom: 10 }}>{user.email}</div>
            <button className="btn-ghost" onClick={logout}>Log out</button>
            <div style={{ marginTop: 16, fontSize: 11, color: "#7fa89f", lineHeight: 1.5 }}>
              © {new Date().getFullYear()} Heltog Technologies Pvt Ltd
            </div>
          </div>
        </aside>
        <main className="main">
          <TopBar user={user} onMenuToggle={() => setSidebarOpen((v) => !v)} />
          <div className="main-content">{children}</div>
        </main>
      </div>
    </UserContext.Provider>
  );
}
