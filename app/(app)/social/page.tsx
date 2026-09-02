"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, SocialConnection, SocialPost } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useUser } from "@/lib/user-context";
import { PageHeader } from "@/components/PageHeader";
import { LoadingBlock } from "@/components/Preloader";

export default function SocialPage() {
  const me = useUser();
  const perms = me.permissions ?? [];
  const canConnect = perms.includes("whatsapp.manage");
  const canPost = perms.includes("campaigns.create");

  const [connection, setConnection] = useState<SocialConnection | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // connect form
  const [showConnect, setShowConnect] = useState(false);
  const [connForm, setConnForm] = useState({ page_id: "", page_access_token: "" });
  const [connecting, setConnecting] = useState(false);

  // compose
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [targets, setTargets] = useState<string[]>(["facebook"]);
  const [scheduleOn, setScheduleOn] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);

  // Classify the image so we can show whether it's a feed post or a reel/story.
  function aspectInfo(d: { w: number; h: number } | null) {
    if (!d || !d.h) return null;
    const r = d.w / d.h;
    let label: string, hint: string;
    if (r >= 0.95 && r <= 1.05) { label = "Square 1:1"; hint = "Feed post"; }
    else if (r < 0.95) {
      if (r <= 0.62) { label = "Portrait 9:16"; hint = "Reel / Story"; }
      else { label = "Portrait 4:5"; hint = "Feed post"; }
    } else {
      label = "Landscape 1.91:1"; hint = "Feed post";
    }
    return { label, hint, ratio: r };
  }
  const ai = aspectInfo(imgDims);

  // Surface field-level validation messages (e.g. "page_id must be ≤64 chars")
  // instead of the generic "The given data was invalid."
  function errMsg(err: unknown): string {
    const e = err as ApiError;
    if (e?.errors) {
      const flat = Object.values(e.errors).flat();
      if (flat.length) return flat.join(" ");
    }
    return e?.message ?? "Something went wrong.";
  }

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        api.social.connection(token),
        api.social.posts(token).catch(() => ({ posts: [] as SocialPost[] })),
      ]);
      setConnection(c.connection);
      setPosts(p.posts);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setConnecting(true);
    setError(null);
    try {
      const res = await api.social.connect(token, connForm);
      setConnection(res.connection);
      setShowConnect(false);
      flash(`Connected to ${res.connection.page_name ?? "your Page"}.`);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    const token = getToken();
    if (!token) return;
    if (!confirm("Disconnect this Facebook Page & Instagram account?")) return;
    try {
      await api.social.disconnect(token);
      setConnection(null);
      flash("Disconnected.");
    } catch (err) {
      setError(errMsg(err));
    }
  }

  function toggleTarget(t: string) {
    setTargets((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    if (targets.length === 0) { setError("Select at least one destination (Facebook or Instagram)."); return; }
    if (imageMode === "url" && !imageUrl) { setError("Paste a public image URL, or switch to upload."); return; }
    if (imageMode === "upload" && !imageFile) { setError("Choose an image to upload."); return; }
    setPosting(true);
    setError(null);
    try {
      const res = await api.social.createPost(token, {
        caption,
        targets,
        image_url: imageMode === "url" ? imageUrl : undefined,
        image: imageMode === "upload" ? imageFile : undefined,
        scheduled_at: scheduleOn && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      const st = res.post.status;
      flash(st === "scheduled" ? "Post scheduled." : st === "published" ? "Published! 🎉" : st === "partial" ? "Published with some errors — see below." : "Post failed — see details below.");
      setCaption(""); setImageUrl(""); setImageFile(null); if (fileRef.current) fileRef.current.value = "";
      setScheduleOn(false); setScheduledAt("");
      await load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setPosting(false);
    }
  }

  async function publishNow(p: SocialPost) {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.social.publishPost(token, p.id);
      setPosts((prev) => prev.map((x) => (x.id === p.id ? res.post : x)));
      flash(res.post.status === "published" ? "Published! 🎉" : "Attempted — see status.");
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function editPost(p: SocialPost) {
    const token = getToken();
    if (!token) return;
    const next = window.prompt("Edit caption", p.caption ?? "");
    if (next === null) return; // cancelled
    try {
      const res = await api.social.updatePost(token, p.id, { caption: next });
      setPosts((prev) => prev.map((x) => (x.id === p.id ? res.post : x)));
      flash(res.note || "Caption updated.");
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function deletePost(p: SocialPost) {
    const token = getToken();
    if (!token) return;
    if (!confirm("Delete this post? It will be removed from PiziDesk (and Facebook if published there).")) return;
    try {
      const res = await api.social.deletePost(token, p.id);
      setPosts((prev) => prev.filter((x) => x.id !== p.id));
      flash(res.note || "Post deleted.");
    } catch (err) {
      setError(errMsg(err));
    }
  }

  const igLinked = connection?.instagram_linked;
  const [previewUrl, setPreviewUrl] = useState("");

  // Build the preview URL ONCE when the image changes (never in render, or the
  // object URL churns every render and the preview flickers). Revoke on cleanup.
  useEffect(() => {
    setImgDims(null);
    if (imageMode === "upload" && imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(imageMode === "url" ? imageUrl : "");
  }, [imageMode, imageFile, imageUrl]);

  // Is the selected media a video (Reel) rather than a photo?
  const isVideo = imageMode === "upload"
    ? !!imageFile && imageFile.type.startsWith("video")
    : /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(imageUrl);

  const statusColor = (s: string) => s === "published" ? { bg: "#e7f7ef", fg: "#0a7d47" }
    : s === "scheduled" ? { bg: "#fff3cd", fg: "#856404" }
    : s === "partial" ? { bg: "#fff3e0", fg: "#b45309" }
    : s === "failed" ? { bg: "#fdecec", fg: "#c53030" }
    : { bg: "#eef1f2", fg: "#667781" };

  return (
    <div>
      <PageHeader
        title="Social"
        subtitle="Publish to your Facebook Page and Instagram from PiziDesk."
        action={connection && canConnect ? <button className="btn-mini" onClick={disconnect}>Disconnect</button> : undefined}
      />

      {error && <div className="error">{error}</div>}
      {notice && <div className="panel" style={{ background: "#e7f7ef", color: "#0a7d47", marginBottom: 16 }}>{notice}</div>}

      {loading ? (
        <LoadingBlock label="Loading…" />
      ) : !connection ? (
        // ---- Not connected ----
        <div className="panel" style={{ textAlign: "center", padding: 40, background: "linear-gradient(135deg,#f5f0ff,#eef7ff)" }}>
          <div style={{ fontSize: 44 }}>📸</div>
          <h2 style={{ margin: "12px 0 6px" }}>Connect Facebook &amp; Instagram</h2>
          <p className="muted" style={{ maxWidth: 460, margin: "0 auto 18px" }}>
            Link your Facebook Page (and its connected Instagram Business account) to publish posts from here.
          </p>
          {canConnect ? (
            <button className="btn" onClick={() => setShowConnect(true)}>Connect a Facebook Page</button>
          ) : (
            <p className="muted">Ask your workspace admin to connect a Facebook Page.</p>
          )}
        </div>
      ) : (
        <>
          {/* Connected banner */}
          <div className="panel" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ fontSize: 30 }}>✅</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700 }}>{connection.page_name ?? "Facebook Page"}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                Facebook Page connected
                {igLinked ? ` · Instagram @${connection.ig_username}` : " · No Instagram linked"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, background: "#e7f0ff", color: "#1877f2", padding: "4px 10px", borderRadius: 999 }}>f Facebook</span>
              <span style={{ fontSize: 12, fontWeight: 600, background: igLinked ? "#fdeef5" : "#eef1f2", color: igLinked ? "#c13584" : "#98a2ab", padding: "4px 10px", borderRadius: 999 }}>◙ Instagram</span>
            </div>
          </div>

          {/* Compose */}
          {canPost && (
            <div className="panel">
              <h2 style={{ marginTop: 0 }}>New post</h2>
              <form onSubmit={submitPost}>
                <div className="grid" style={{ gridTemplateColumns: "1.2fr 1fr", gap: 18, alignItems: "start" }}>
                  <div>
                    <div className="field">
                      <label>Caption</label>
                      <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} placeholder="Write a caption… #hashtags welcome" />
                    </div>

                    <div className="field">
                      <label>Photo or video (Reel)</label>
                      <div className="filter-tabs" style={{ marginBottom: 10 }}>
                        <button type="button" className={imageMode === "url" ? "active" : ""} onClick={() => setImageMode("url")}>Paste URL</button>
                        <button type="button" className={imageMode === "upload" ? "active" : ""} onClick={() => setImageMode("upload")}>Upload</button>
                      </div>
                      {imageMode === "url" ? (
                        <input key="url-input" value={imageUrl ?? ""} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/photo.jpg or video.mp4" />
                      ) : (
                        <input key="file-input" ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                      )}
                      <span className="muted" style={{ fontSize: 12 }}>
                        Photo (JPG/PNG) or video (MP4/MOV). A video posts as a <b>Reel</b> on Instagram. Media must be a public URL for Meta to fetch it.
                      </span>
                    </div>

                    <div className="field">
                      <label>Publish to</label>
                      <div style={{ display: "flex", gap: 14, paddingTop: 4 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                          <input type="checkbox" checked={targets.includes("facebook")} onChange={() => toggleTarget("facebook")} />
                          <span style={{ color: "#1877f2", fontWeight: 600 }}>Facebook</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: igLinked ? "pointer" : "not-allowed", fontSize: 14, opacity: igLinked ? 1 : 0.5 }}>
                          <input type="checkbox" disabled={!igLinked} checked={targets.includes("instagram")} onChange={() => toggleTarget("instagram")} />
                          <span style={{ color: "#c13584", fontWeight: 600 }}>Instagram</span>
                          {!igLinked && <span className="muted" style={{ fontSize: 11 }}>(not linked)</span>}
                        </label>
                      </div>
                    </div>

                    <div className="field">
                      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="checkbox" checked={scheduleOn} onChange={(e) => setScheduleOn(e.target.checked)} />
                        <span>Schedule for later</span>
                      </label>
                      {scheduleOn && (
                        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={{ marginTop: 8 }} />
                      )}
                    </div>

                    <button className="btn" disabled={posting}>
                      {posting ? "Working…" : scheduleOn ? "Schedule post" : "Publish now"}
                    </button>
                  </div>

                  {/* Live preview */}
                  <div style={{ position: "sticky", top: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <label className="muted" style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Preview</label>
                      {(ai || isVideo) && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: isVideo ? "#f3e8ff" : "#e7f7ef", color: isVideo ? "#7c3aed" : "#0a7d47", padding: "2px 9px", borderRadius: 999 }}>
                          {isVideo ? "🎬 Reel / Video" : `${ai!.hint} · ${ai!.label}`}
                        </span>
                      )}
                    </div>
                    <div style={{ maxWidth: 320, margin: "0 auto", borderRadius: 14, overflow: "hidden", boxShadow: "0 6px 22px rgba(0,0,0,.08)", background: "#fff", border: "1px solid var(--border)" }}>
                      {/* Media frame — matches the image's own shape so the whole photo shows, uncropped. */}
                      <div style={{
                        width: "100%",
                        aspectRatio: imgDims ? `${imgDims.w} / ${imgDims.h}` : "1 / 1",
                        maxHeight: 420,
                        background: "#0b141a",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {previewUrl && isVideo ? (
                          <video
                            src={previewUrl}
                            controls
                            playsInline
                            onLoadedMetadata={(e) => setImgDims({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight })}
                            onError={() => setImgDims(null)}
                            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#000" }}
                          />
                        ) : previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt="preview"
                            onLoad={(e) => setImgDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                            onError={() => setImgDims(null)}
                            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                          />
                        ) : (
                          <span style={{ color: "#5b6b73", fontSize: 13 }}>🖼️ Photo / video preview</span>
                        )}
                      </div>
                      <div style={{ padding: 12, fontSize: 13, color: "#3b4a54", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{caption || <span className="muted">Your caption appears here…</span>}</div>
                    </div>
                    {imgDims && (
                      <div className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 8 }}>
                        {imgDims.w}×{imgDims.h}px
                        {ai && ai.hint === "Reel / Story" && " · tall image — best as a Reel/Story"}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* History */}
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Posts</h2>
            {posts.length === 0 ? (
              <p className="muted">No posts yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {posts.map((p) => {
                  const sc = statusColor(p.status);
                  return (
                    <div key={p.id} style={{ display: "flex", gap: 12, border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 10, background: "#0b141a", flex: "none", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22 }}>
                        {p.media_type === "video" ? (
                          "🎬"
                        ) : p.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : null}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ background: sc.bg, color: sc.fg, padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{p.status}</span>
                          {p.targets.map((t) => <span key={t} style={{ fontSize: 11, color: "#54656f" }}>{t === "facebook" ? "f FB" : "◙ IG"}</span>)}
                          {p.scheduled_at && p.status === "scheduled" && <span className="muted" style={{ fontSize: 12 }}>for {new Date(p.scheduled_at).toLocaleString("en-IN")}</span>}
                        </div>
                        <div style={{ fontSize: 13, color: "#3b4a54", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.caption || <span className="muted">No caption</span>}</div>
                        {p.results && (
                          <div style={{ fontSize: 12, marginTop: 4 }}>
                            {Object.entries(p.results).map(([plat, r]) => (
                              <span key={plat} style={{ marginRight: 12, color: r.status === "published" ? "#0a7d47" : "#c53030" }}>
                                {plat === "facebook" ? "Facebook" : "Instagram"}: {r.status === "published" ? "✓ posted" : `✗ ${r.error ?? "failed"}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {canPost && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignSelf: "center" }}>
                          {(p.status === "scheduled" || p.status === "failed" || p.status === "partial") && (
                            <button className="btn-mini" onClick={() => publishNow(p)}>Publish now</button>
                          )}
                          <button className="btn-mini" onClick={() => editPost(p)}>Edit</button>
                          <button className="btn-mini" style={{ color: "#c53030" }} onClick={() => deletePost(p)}>Delete</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Connect modal */}
      {showConnect && (
        <div className="msg-info-overlay" onClick={() => setShowConnect(false)}>
          <div className="msg-info-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h2 style={{ marginTop: 0 }}>Connect Facebook Page</h2>
            <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
              Paste your Facebook <b>Page ID</b> and a <b>Page access token</b> with <code>pages_manage_posts</code> and{" "}
              <code>instagram_content_publish</code> permissions. We&apos;ll auto-detect the linked Instagram account.
            </p>
            <form onSubmit={connect}>
              <div className="field">
                <label>Facebook Page ID</label>
                <input value={connForm.page_id} onChange={(e) => setConnForm((f) => ({ ...f, page_id: e.target.value }))} required placeholder="1234567890" />
              </div>
              <div className="field">
                <label>Page access token</label>
                <input value={connForm.page_access_token} onChange={(e) => setConnForm((f) => ({ ...f, page_access_token: e.target.value }))} required placeholder="EAAG…" />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn" disabled={connecting}>{connecting ? "Verifying…" : "Connect"}</button>
                <button type="button" className="btn-mini" onClick={() => setShowConnect(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
