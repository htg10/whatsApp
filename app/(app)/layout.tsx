"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api, ApiError, User } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { navFor } from "@/lib/nav";
import { UserContext } from "@/lib/user-context";
import { Preloader } from "@/components/Preloader";

const ROLE_LABELS: Record<string, string> = {
  "tenant-owner": "Admin",
  "user": "User",
  "super-admin": "Admin",
  // legacy roles, still labelled sensibly if present
  "manager": "Manager",
  "agent": "User",
};
function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  function logout() {
    clearToken();
    router.replace("/login");
  }

  if (error) return <div className="center-screen">Error: {error}</div>;
  if (!user) return <Preloader label="Loading your workspace…" />;

  return (
    <UserContext.Provider value={user}>
      <div className="shell">
        <aside className="sidebar">
          <div className="logo" style={{ display: "flex", justifyContent: "center", padding: "4px 0 12px" }}>
            <img src="/logo.png" alt="PiziDesk" style={{ width: "100%", maxWidth: 180, height: "auto", borderRadius: 8 }} />
          </div>
          <nav>
            {navFor(user.permissions).map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} className={active ? "active" : ""}>
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
              © {new Date().getFullYear()} Pizi India Pvt Ltd
            </div>
          </div>
        </aside>
        <main className="main">{children}</main>
      </div>
    </UserContext.Provider>
  );
}
