"use client";

import { useState } from "react";
import { useUser } from "@/lib/user-context";
import { PageHeader } from "@/components/PageHeader";
import { api, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function ProfilePage() {
  const user = useUser();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdNotice, setPwdNotice] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  function flash(msg: string, setter: (v: string | null) => void) {
    setter(msg);
    setTimeout(() => setter(null), 3500);
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateProfile(token, { name, email, phone: phone || undefined });
      flash("Profile updated.", setNotice);
    } catch (err) {
      const e2 = err as ApiError;
      setError(e2.errors ? Object.values(e2.errors).flat().join(". ") : e2.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    if (newPwd !== confirmPwd) {
      setPwdError("New password and confirmation do not match.");
      return;
    }
    setPwdSaving(true);
    setPwdError(null);
    try {
      const res = await api.changePassword(token, {
        ...(user.is_super_admin ? {} : { current_password: curPwd }),
        password: newPwd,
        password_confirmation: confirmPwd,
      });
      flash(res.message, setPwdNotice);
      setCurPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      const e2 = err as ApiError;
      setPwdError(e2.errors ? Object.values(e2.errors).flat().join(". ") : e2.message);
    } finally {
      setPwdSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18 }}>
        {/* Profile details */}
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Account Details</h2>
          {error && <div className="error">{error}</div>}
          {notice && <div className="panel" style={{ background: "#e7f7ef", color: "#0a7d47", marginBottom: 12, padding: "8px 14px" }}>{notice}</div>}
          <form onSubmit={handleProfile}>
            <div className="field">
              <label>Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Phone <span className="muted">(optional)</span></label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." />
            </div>
            <div className="field" style={{ marginTop: 4 }}>
              <label className="muted" style={{ fontSize: 12 }}>Role</label>
              <div style={{ fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>{user.is_super_admin ? "Super Admin" : user.roles?.[0] ?? "User"}</div>
            </div>
            <button className="btn" disabled={saving} style={{ marginTop: 8, width: "auto", padding: "10px 24px" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Password change */}
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Change Password</h2>
          {pwdError && <div className="error">{pwdError}</div>}
          {pwdNotice && <div className="panel" style={{ background: "#e7f7ef", color: "#0a7d47", marginBottom: 12, padding: "8px 14px" }}>{pwdNotice}</div>}
          <form onSubmit={handlePassword}>
            {!user.is_super_admin && (
              <div className="field">
                <label>Current Password</label>
                <input type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} required autoComplete="current-password" />
              </div>
            )}
            <div className="field">
              <label>New Password</label>
              <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <div className="field">
              <label>Confirm New Password</label>
              <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <button className="btn" disabled={pwdSaving} style={{ marginTop: 8, width: "auto", padding: "10px 24px" }}>
              {pwdSaving ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
