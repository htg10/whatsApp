"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { saveToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      saveToken(data.token);
      router.push("/dashboard");
    } catch (err) {
      setError((err as ApiError).message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card">
        <div className="brand" style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <img src="/logo.png" alt="PiziDesk" style={{ width: "100%", maxWidth: 220, height: "auto", borderRadius: 10 }} />
        </div>
        <p className="subtitle" style={{ textAlign: "center" }}>Sign in to your workspace</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button className="btn" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
        </form>

        <div className="switch">
          New here? <Link href="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
