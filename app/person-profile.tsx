"use client";
import { sportOptions } from "@/lib/sports";
import { T, usePreferences } from "./preferences";
import { Avatar } from "./account-profile";
import { useAppRequest, type AppRequest } from "./app-transport";
import { useEffect, useState, useRef } from "react";
import { CourvixSelect } from "@/components/courvix-select";
import type { Row } from "@/lib/courvix";
const memberFields = [
  ["phone", "Phone"],
  ["birthDate", "Date of birth", "date"],
  ["city", "City"],
  ["parentName", "Parent / guardian name"],
  ["parentPhone", "Guardian phone"],
  ["emergencyName", "Emergency contact"],
  ["emergencyPhone", "Emergency phone"],
  ["position", "Position / athlete category"],
  ["jersey", "Jersey number"],
];
const coachFields = [
  ["phone", "Phone"],
  ["specialty", "Specialty"],
  ["experience", "Coaching experience"],
  ["licenseName", "License level"],
  ["licenseIssuer", "License issuer"],
  ["licenseExpires", "Valid until", "date"],
  ["emergencyName", "Emergency contact"],
  ["emergencyPhone", "Emergency phone"],
];
export function PersonProfile({
  kind,
  person,
  onUpdated,
}: {
  kind: "Members" | "Coaches";
  person: Row;
  onUpdated: () => Promise<void>;
}) {
  const request = useAppRequest();
  const { t } = usePreferences();
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0),
    [confirm, setConfirm] = useState("");
  const lock = useRef(false);
  const endpoint = `/api/profile?kind=${kind}&subject=${encodeURIComponent(person.id)}`;
  const fields = kind === "Members" ? memberFields : coachFields;
  useEffect(() => {
    const c = new AbortController();
    setData(null);
    setError("");
    request(endpoint, {
      signal: AbortSignal.any([c.signal, AbortSignal.timeout(15000)]),
    })
      .then(async (r) => {
        const d: any = await r.json();
        if (!r.ok) throw Error(d.error);
        setData(d);
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setError(
            e.name === "TimeoutError"
              ? "The connection timed out. Try again."
              : e.message,
          );
      });
    return () => c.abort();
  }, [endpoint, retry]);
  async function act(method: string, body?: BodyInit, file = "") {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await request(
        endpoint + (file ? "&file=" + encodeURIComponent(file) : ""),
        {
          method,
          body,
          headers:
            method === "PUT"
              ? { "Content-Type": "application/json" }
              : undefined,
          signal: AbortSignal.timeout(20000),
        },
      );
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error || "Unable to save.");
      await onUpdated();
      setRetry((n) => n + 1);
      setNotice(method === "DELETE" ? "Dokumen dihapus." : "Changes saved.");
      setConfirm("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="person-profile">
      <div className="profile-heading">
        <Avatar
          name={person.name}
          url={data?.base?.avatarUrl || person.avatarUrl}
          size="large"
        />
        <div>
          <h2>{person.name}</h2>
          <p>
            {person.email} · {person.status}
          </p>
        </div>
      </div>
      <p className="hint">
        <T>{"Profil "}</T>
        {kind === "Members" ? "member" : "coach"}
        <T>
          {
            "and private records. Enter only the information needed for workspace operations."
          }
        </T>
      </p>
      {error && (
        <p className="error" role="alert">
          {error}{" "}
          <button
            className="text-btn"
            onClick={() => setRetry((n) => n + 1)}
            disabled={busy}
          >
            <T>{"Try again"}</T>
          </button>
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!data ? (
        <p aria-live="polite">
          {error ? "Profile not available." : "Loading profile…"}
        </p>
      ) : (
        <>
          <form
            className="profile-form"
            key={retry}
            onSubmit={(e) => {
              e.preventDefault();
              void act(
                "PUT",
                JSON.stringify(
                  Object.fromEntries(new FormData(e.currentTarget)),
                ),
              );
            }}
          >
            <div className="profile-grid">
              {fields.map(([key, label, type]) => (
                <label key={key}>
                  {t(label)}
                  {sportOptions(data.sport || "", key).length ? (
                    <>
                      <select name={key} defaultValue={data.profile[key] || ""}>
                        <option value="">—</option>
                        {data.profile[key] &&
                          !sportOptions(data.sport || "", key).includes(
                            data.profile[key],
                          ) && <option>{data.profile[key]}</option>}
                        {sportOptions(data.sport || "", key).map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                      <small className="hint">
                        {t(
                          "Choose from the catalog to keep naming consistent.",
                        )}
                      </small>
                    </>
                  ) : (
                    <input
                      name={key}
                      type={type || "text"}
                      defaultValue={data.profile[key] || ""}
                      maxLength={500}
                    />
                  )}
                </label>
              ))}
            </div>
            <label>
              <T>{"Additional notes"}</T>
              <textarea
                name="notes"
                defaultValue={data.profile.notes || ""}
                maxLength={1500}
              />
            </label>
            <button className="btn primary" disabled={busy}>
              {busy ? "Saving…" : "Save profile"}
            </button>
          </form>
          <p className="hint">
            <T>
              {
                "Identity document uploads are unavailable in V1.0. Do not enter identity document numbers or sensitive information in notes."
              }
            </T>
          </p>
        </>
      )}
    </section>
  );
}
