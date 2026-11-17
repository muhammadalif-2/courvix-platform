"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, MapPin, ShieldCheck, Mail, Check } from "lucide-react";
import { useAppRequest } from "./app-transport";
import { usePreferences, PreferenceControls, T } from "./preferences";
import {
  SportSelect,
  CountrySelect,
  ZoneSelect,
} from "@/components/catalog-fields";
export function Avatar({
  name,
  url,
  size = "",
}: {
  name: string;
  url?: string;
  size?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return (
    <span className={"cv-avatar " + size}>
      {url && !failed ? (
        <img src={url} alt={name} onError={() => setFailed(true)} />
      ) : (
        <span>
          {name
            .split(" ")
            .slice(0, 2)
            .map((s) => s[0])
            .join("")
            .toUpperCase()}
        </span>
      )}
    </span>
  );
}
async function preparePhoto(file: File) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  )
    throw Error("Choose JPG, PNG or WebP up to 8 MB.");
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const side = Math.min(bitmap.width, bitmap.height),
    canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 320;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 320, 320);
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    320,
    320,
  );
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(Error("Unable to process this photo."))),
      "image/jpeg",
      0.83,
    ),
  );
}
export default function AccountProfile({
  onUpdated,
  demo = false,
  userId,
}: {
  onUpdated?: () => Promise<void>;
  demo?: boolean;
  userId?: string;
}) {
  const request = useAppRequest(),
    { t } = usePreferences(),
    [d, setD] = useState<any>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null),
    lock = useRef(false);
  const endpoint =
    "/api/account" + (userId ? "?user=" + encodeURIComponent(userId) : "");
  async function load() {
    const r = await request(endpoint, { cache: "no-store" });
    const v: any = await r.json();
    if (!r.ok) throw Error(v.error);
    setD(v);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [userId]);
  async function act(
    method: string,
    body?: BodyInit,
    contentType = "application/json",
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await request("/api/account", {
        method,
        body,
        headers: { "Content-Type": contentType },
      });
      const v: any = await r.json();
      if (!r.ok) throw Error(v.error);
      await load();
      await onUpdated?.();
      window.dispatchEvent(new Event("courvix-account-updated"));
      setNotice(t("Changes saved."));
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const p = d?.profile || {},
    name = p.display_name || d?.user?.name || "";
  return (
    <section className="account-page">
      {error && (
        <p className="error" role="alert">
          {error}{" "}
          <button
            className="text-btn"
            onClick={() => load().catch((e) => setError(e.message))}
          >
            {t("Try again")}
          </button>
        </p>
      )}
      {notice && (
        <p className="access-success" role="status">
          <Check size={16} />
          {notice}
        </p>
      )}
      {!d ? (
        <p>{t("Loading…")}</p>
      ) : (
        <>
          <div className="account-cover">
            <span>YOUR SPACE. YOUR GAME.</span>
            <div className="account-cover-lines" />
          </div>
          <div className="account-summary">
            <div className="account-photo">
              <Avatar name={name} url={d.avatarUrl} size="large" />
              {d.editable && (
                <button
                  className="photo-camera"
                  aria-label={t("Upload photo")}
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera size={18} />
                </button>
              )}
            </div>
            <div>
              <h2>{name}</h2>
              <p>
                {p.title ||
                  t(d.user.platformAdmin ? "Courvix owner" : "User accounts")}
              </p>
              <div className="account-meta">
                <span>
                  <Mail size={14} />
                  {d.user.email}
                </span>
                {p.city && (
                  <span>
                    <MapPin size={14} />
                    {p.city}
                  </span>
                )}
              </div>
            </div>
            {d.user.platformAdmin && (
              <span className="tag">
                <ShieldCheck size={14} />
                {t("Courvix owner")}
              </span>
            )}
          </div>
          {d.editable && (
            <>
              <div className="photo-actions">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const b = await preparePhoto(f);
                      if (demo) {
                        const reader = new FileReader();
                        reader.onload = () =>
                          void act(
                            "POST",
                            JSON.stringify({ avatarData: reader.result }),
                          );
                        reader.readAsDataURL(b);
                      } else await act("POST", b, b.type);
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      if (fileRef.current) fileRef.current.value = "";
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  {t("Upload photo")}
                </button>
                {d.avatarUrl && (
                  <button
                    type="button"
                    className="text-btn"
                    disabled={busy}
                    onClick={() => void act("DELETE")}
                  >
                    {t("Remove photo")}
                  </button>
                )}
                <small>
                  {t("JPG, PNG, or WebP. Photos are resized before saving.")}
                </small>
              </div>
              <p className="hint">
                {t(
                  "Your account photo and profile are used across your workspaces.",
                )}
              </p>
            </>
          )}
          <div className="account-columns">
            <form
              className="panel account-form"
              key={p.updated_at || "initial"}
              onSubmit={(e) => {
                e.preventDefault();
                const b = Object.fromEntries(new FormData(e.currentTarget));
                void act("PUT", JSON.stringify(b));
              }}
            >
              <h3>{t("Personal information")}</h3>
              <p className="hint">
                {t(
                  "A complete profile helps people recognize you and find the right person.",
                )}
              </p>
              <fieldset disabled={!d.editable || busy}>
                <div className="profile-grid">
                  <label>
                    {t("Display name")}
                    <input
                      name="displayName"
                      defaultValue={name}
                      required
                      maxLength={150}
                    />
                  </label>
                  <label>
                    {t("Title / profession")}
                    <input
                      name="title"
                      defaultValue={p.title}
                      maxLength={100}
                    />
                  </label>
                  <label>
                    {t("Phone")}
                    <input name="phone" defaultValue={p.phone} maxLength={40} />
                  </label>
                  <label>
                    {t("City")}
                    <input name="city" defaultValue={p.city} maxLength={150} />
                  </label>
                  <label>
                    {t("Country")}
                    <CountrySelect defaultValue={p.country || "ID"} />
                  </label>
                  <label>
                    {t("Sport")}
                    <SportSelect
                      defaultValue={p.sport}
                      required={false}
                      allowBlank
                    />
                  </label>
                </div>
                <label>
                  {t("About me")}
                  <textarea
                    name="bio"
                    defaultValue={p.bio}
                    maxLength={1000}
                    rows={4}
                  />
                </label>
                <p className="hint">
                  {t(
                    "Contact information is visible only to you and authorized administrators.",
                  )}
                </p>
                <h3>{t("Preferences")}</h3>
                <div className="profile-grid">
                  <label>
                    {t("Time zone")}
                    <ZoneSelect defaultValue={p.timezone || "Asia/Jakarta"} />
                  </label>
                </div>
                {d.editable && (
                  <button className="btn primary" disabled={busy}>
                    {t(busy ? "Saving…" : "Save profile")}
                  </button>
                )}
              </fieldset>
            </form>
            <aside>
              <section className="panel">
                <h3>{t(d.editable ? "My access" : "Role & workspace")}</h3>
                {d.user.platformAdmin && (
                  <div className="access-role-row">
                    <ShieldCheck size={19} />
                    <div>
                      <b>Courvix</b>
                      <small>{t("Courvix owner")}</small>
                    </div>
                  </div>
                )}
                {d.memberships?.map((m: any) => (
                  <div className="access-role-row" key={m.club}>
                    <Avatar name={m.name} />
                    <div>
                      <b>{m.name}</b>
                      <small>
                        {m.role} · {t(m.sport || "")}
                      </small>
                    </div>
                  </div>
                ))}
                {!d.memberships?.length && !d.user.platformAdmin && (
                  <p className="hint">{t("No data yet")}</p>
                )}
              </section>
              {d.editable && (
                <section className="panel">
                  <h3>{t("Appearance")}</h3>
                  <PreferenceControls expanded />
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
