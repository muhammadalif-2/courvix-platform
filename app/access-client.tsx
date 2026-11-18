"use client";
import AccessControl from "./access-control";
import {
  SportSelect,
  CountrySelect,
  CurrencySelect,
  ZoneSelect,
} from "@/components/catalog-fields";
import { BrandLogo } from "@/components/brand";
import { T, usePreferences, PreferenceControls } from "./preferences";
import { Avatar } from "./account-profile";
import { ExportLink } from "./export-link";
import { useAppRequest, type AppRequest } from "./app-transport";
import { useState, useEffect, useRef, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Mail,
  ShieldCheck,
  Users,
  LogOut,
} from "lucide-react";
export async function accessAction(
  body: Record<string, unknown>,
  request: AppRequest = fetch,
) {
  const r = await request("/api/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const d: any = await r.json();
  if (!r.ok) throw Error(d.error || "The request failed. Try again.");
  return d;
}
export default function AccessPage({
  mode = "login",
}: {
  mode?: "login" | "register" | "join";
}) {
  const request = useAppRequest();
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [code, setCode] = useState(""),
    [retry, setRetry] = useState(0);
  const [product, setProduct] = useState("Club");
  const lock = useRef(false);
  useEffect(() => {
    const params = new URL(location.href).searchParams;
    setCode(params.get("code") || "");
    setProduct(params.get("product") === "training" ? "Trainer" : "Club");
    const c = new AbortController();
    request("/api/access", {
      signal: AbortSignal.any([c.signal, AbortSignal.timeout(15000)]),
      cache: "no-store",
    })
      .then(async (r) => {
        const d: any = await r.json();
        if (!r.ok) throw Error(d.error);
        setData(d);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [retry]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const f = Object.fromEntries(new FormData(e.currentTarget));
      await accessAction({
        ...f,
        action: mode === "join" ? "join" : "register",
        ...(mode === "join" ? { code } : {}),
      });
      location.assign("/dashboard");
    } catch (e) {
      setError((e as Error).message);
      lock.current = false;
      setBusy(false);
    }
  }
  async function local(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await request("/api/local-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      setRetry((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const returnTo =
    mode === "join"
      ? "/join?code=" + encodeURIComponent(code)
      : mode === "register"
        ? "/create-workspace?product=" + (product === "Trainer" ? "training" : "club")
        : "/login";
  return (
    <main className="access-shell v1-access">
      <aside className="access-story">
        <a href="/" className="access-logo">
          <BrandLogo />
        </a>
        <div>
          <span className="access-kicker">
            {mode === "register"
              ? product === "Trainer"
                ? "COURVIX / PERSONAL TRAINING"
                : "COURVIX / CLUB MANAGEMENT"
              : "TWO PRODUCTS. ONE ACCOUNT."}
          </span>
          <h1>
            {mode === "register" && product === "Trainer" ? (
              <>
                Your clients.
                <br />
                Every session.
                <br />
                <em>One clear view.</em>
              </>
            ) : (
              <>
                Your people.
                <br />
                Your progress.
                <br />
                <em>Less chasing.</em>
              </>
            )}
          </h1>
          <p>
            {mode === "register" && product === "Trainer"
              ? "Create a training business, sell visits or session packs, and keep every appointment and credit clear."
              : "Choose the workspace built for your club or personal training business. Access stays personal and role-based."}
          </p>
          <div className="access-steps">
            <span>01 · Sign in with your own account</span>
            <span>02 · Choose your product or accept an invitation</span>
            <span>03 · Set up your workspace and start training</span>
          </div>
        </div>
        <small>
          <ShieldCheck size={16} />
          Your identity · Role-based access
        </small>
      </aside>
      <section className="access-main">
        <nav aria-label="Account access">
          <a href="/login" aria-current={mode === "login" ? "page" : undefined}>
            <T>{"Sign in"}</T>
          </a>
          <a
            href={
              "/create-workspace?product=" +
              (product === "Trainer" ? "training" : "club")
            }
            aria-current={mode === "register" ? "page" : undefined}
          >
            <T>{"Create workspace"}</T>
          </a>
          <a href="/join" aria-current={mode === "join" ? "page" : undefined}>
            <T>{"Accept invitation"}</T>
          </a>
        </nav>
        <div>
          <span className="access-kicker">
            <T>{"COURVIX / VERSION 1.0"}</T>
          </span>
          <h2>
            {mode === "login"
              ? "Welcome back."
              : mode === "register"
                ? "Set up your workspace."
                : "Your workspace starts here."}
          </h2>
          <p>
            {mode === "login"
              ? "Sign in with your own account. Workspace records are available across devices."
              : mode === "register"
                ? "Try 14 days without a card. The first registrant becomes the workspace owner."
                : "Use the account with the verified email address that received the invitation."}
          </p>
        </div>
        {!data && !error && (
          <p role="status">
            <T>{"Checking your account…"}</T>
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}{" "}
            {!data && (
              <button
                className="text-btn"
                onClick={() => {
                  setError("");
                  setRetry((n) => n + 1);
                }}
              >
                <T>{"Try again"}</T>
              </button>
            )}
          </p>
        )}
        {data && !data.viewer && (
          <div className="sign-in-panel">
            <ShieldCheck />
            <h3>
              <T>{"One account for all your workspaces."}</T>
            </h3>
            <p>
              <T>
                {
                  "Sign in to Courvix before creating your workspace. Your personal account can belong to multiple workspaces."
                }
              </T>
            </p>
            {(
              <a
                className="btn primary"
                target="_top"
                href={
                  "/login?next=" +
                  encodeURIComponent(returnTo)
                }
              >
                <T>{"Sign in to Courvix "}</T>
                <ArrowRight size={18} />
              </a>
            )}
            <p className="hint">
              <T>
                {"You can create an account or recover your password on the sign-in page."}
              </T>
            </p>
          </div>
        )}
        {data?.viewer && (
          <>
            <div className="access-account">
              <ShieldCheck />
              <div>
                <strong>{data.viewer.name}</strong>
                <p>{data.viewer.email}</p>
              </div>
            </div>
            {mode === "login" ? (
              <>
                <div className="club-picker">
                  {data.clubs.map((c: any) => (
                    <button
                      className="club-choice"
                      key={c.club}
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await accessAction({
                            action: "switch",
                            club: c.club,
                          });
                          location.assign("/dashboard");
                        } catch (e) {
                          setError((e as Error).message);
                          setBusy(false);
                        }
                      }}
                    >
                      <span className="club-choice-icon">
                        <Users size={22} />
                      </span>
                      <span>
                        <strong>{c.name}</strong>
                        <small>
                          {c.workspace_type === "Trainer"
                            ? c.role === "Member"
                              ? "Client"
                              : c.role === "Coach"
                                ? "Trainer"
                                : c.role === "Owner"
                                  ? "Business owner"
                                  : c.role
                            : c.role === "Owner"
                              ? "Club owner"
                              : c.role}{" "}
                          ·{" "}
                          {c.workspace_type === "Trainer"
                            ? "Personal Training"
                            : "Club Management"}{" "}
                          · <T>{c.sport || ""}</T>
                        </small>
                      </span>
                      <ArrowRight size={18} />
                    </button>
                  ))}
                </div>
                {!data.clubs.length && (
                  <div className="empty">
                    <h3>
                      <T>{"Your workspace starts here."}</T>
                    </h3>
                    <p>
                      <T>{"Create a workspace or accept an invitation."}</T>
                    </p>
                  </div>
                )}
                <div className="actions">
                  <a className="btn" href="/profile">
                    <T>{"My profile"}</T>
                  </a>
                  {data.clubs.some((c: any) => c.role === "Owner") && (
                    <a className="btn" href="/hub">
                      <T>{"Headquarters"}</T>
                    </a>
                  )}
                  <a className="btn primary" href="/create-workspace">
                    <T>{"Create new club"}</T>
                  </a>
                  <a className="btn" href="/join">
                    <T>{"Have an invitation?"}</T>
                  </a>
                  {data.viewer.platformAdmin && (
                    <a className="btn" href="/operator">
                      <T>{"Manage Courvix"}</T>
                    </a>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={submit}>
                {mode === "register" ? (
                  <>
                    <fieldset className="product-choice">
                      <legend>Choose your Courvix product</legend>
                      <label>
                        <input
                          type="radio"
                          name="workspaceType"
                          value="Club"
                          checked={product === "Club"}
                          onChange={() => setProduct("Club")}
                        />
                        Club Management
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="workspaceType"
                          value="Trainer"
                          checked={product === "Trainer"}
                          onChange={() => setProduct("Trainer")}
                        />
                        Personal Training
                      </label>
                      <p>
                        {product === "Trainer"
                          ? "Clients, visit/session packs, appointments and training progress. Client packages are separate from your Courvix workspace subscription."
                          : "Members, teams, attendance, recurring club dues and club operations."}
                      </p>
                    </fieldset>
                    <label>
                      {mode === "register" && product === "Trainer" ? (
                        "Training business name"
                      ) : (
                        <T>{"Club name"}</T>
                      )}
                      <input
                        name="clubName"
                        required
                        maxLength={150}
                        placeholder="Example: Batam Sports Academy"
                      />
                    </label>
                    <div className="profile-grid">
                      <label>
                        <T>{"Sport"}</T>
                        <SportSelect
                          key={product}
                          defaultValue={
                            product === "Trainer" ? "Fitness" : undefined
                          }
                        />
                      </label>
                      {product === "Trainer" ? (
                        <input
                          type="hidden"
                          name="groupLabel"
                          value="Private"
                        />
                      ) : (
                        <label>
                          <T>{"Group terminology"}</T>
                          <select name="groupLabel">
                            <option value="Kelompok">
                              <T>{"Kelompok"}</T>
                            </option>
                            <option value="Private">
                              <T>{"Private"}</T>
                            </option>
                            <option value="Tim">
                              <T>{"Tim"}</T>
                            </option>
                            <option value="Kelas">
                              <T>{"Kelas"}</T>
                            </option>
                          </select>
                        </label>
                      )}
                    </div>
                    <div className="profile-grid">
                      <label>
                        <T>{"Country"}</T>
                        <CountrySelect />
                      </label>
                      <label>
                        <T>{"Currency"}</T>
                        <CurrencySelect />
                      </label>

                      <label>
                        <T>{"Time zone"}</T>
                        <ZoneSelect />
                      </label>
                      <label>
                        <T>{"Address / area"}</T>
                        <input name="location" maxLength={150} />
                      </label>
                    </div>
                    <p className="hint">
                      <T>{"Does not change amounts or convert balances."}</T>
                      <T>
                        {
                          "Your dues currency is fixed at registration. Courvix subscription billing remains in IDR."
                        }
                      </T>
                    </p>
                    <fieldset className="plan-options">
                      <legend>
                        <T>{"Choose your plan after trial"}</T>
                      </legend>
                      {[
                        [
                          "Starter",
                          "250.000",
                          "Self-managed workspace with all core operational features.",
                        ],
                        [
                          "Club Pro",
                          "500.000",
                          "Core features plus setup and onboarding support.",
                        ],
                      ].map(([plan, price, description]) => (
                        <label key={plan}>
                          <input
                            type="radio"
                            name="plan"
                            value={plan}
                            defaultChecked={plan === "Starter"}
                          />
                          <span>
                            <strong>
                              {plan === "Club Pro" ? "Pro" : plan}
                              <T>{"· Rp"}</T>
                              {price}
                              <T>{" / 30 days"}</T>
                            </strong>
                            <small>{description}</small>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    <p className="hint">
                      <T>
                        {
                          "14-day trial. Subscription transfers are reviewed by the Courvix team. There is no automatic charging."
                        }
                      </T>
                    </p>
                    <label className="checkbox-line">
                      <input type="checkbox" name="terms" required />
                      <T>{"I agree to the"}</T>{" "}
                      <a href="/policies" target="_blank" rel="noreferrer">
                        <T>{"terms and privacy policy"}</T>
                      </a>
                      .
                    </label>
                  </>
                ) : (
                  <label>
                    <T>{"Invitation link / code"}</T>
                    <input
                      name="code"
                      value={code}
                      onChange={(e) => {
                        const v = e.target.value;
                        try {
                          setCode(new URL(v).searchParams.get("code") || v);
                        } catch {
                          setCode(v);
                        }
                      }}
                      required
                      placeholder="Paste the invitation link from your administrator"
                    />
                  </label>
                )}
                <button className="btn primary" disabled={busy}>
                  {busy
                    ? "Please wait…"
                    : mode === "register"
                      ? "Create a workspace & start trial"
                      : "Accept invitation"}{" "}
                  <ArrowRight size={18} />
                </button>
              </form>
            )}
          </>
        )}
        {data?.localPreview && (
          <details className="local-preview-box">
            <summary>
              <T>{"Local test account"}</T>
            </summary>
            <p>
              <T>
                {
                  "Available only in local testing. Use separate emails for owner, admin, coach and member accounts."
                }
              </T>
            </p>
            <form onSubmit={local}>
              <label>
                <T>{"Name"}</T>
                <input
                  name="name"
                  required
                  defaultValue="Courvix administrator"
                />
              </label>
              <label>
                <T>{"Email"}</T>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue="owner@courvix.test"
                />
              </label>
              <button className="btn" disabled={busy}>
                <T>{"Use test account"}</T>
              </button>
            </form>
          </details>
        )}
        <p className="access-note">
          <a href="/policies">
            <T>{"Privacy & terms"}</T>
          </a>{" "}
          ·{" "}
          <a href="mailto:courvix.id@gmail.com">
            <T>{"Need help?"}</T>
          </a>
          {data?.viewer && (
            <>
              {" "}
              ·{" "}
              <a href="/waiting-room">Invitations & account</a>
            </>
          )}
        </p>
      </section>
    </main>
  );
}
export function ClubAccess({ onUpdated }: { onUpdated?: () => void }) {
  const request = useAppRequest();
  const [d, setD] = useState<any>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [url, setUrl] = useState("");
  const lock = useRef(false);
  async function refresh() {
    const r = await request("/api/access", {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const value: any = await r.json();
    if (!r.ok) throw Error(value.error);
    setD(value);
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  async function act(b: any) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const value = await accessAction(b, request);
      if (value.inviteUrl) setUrl(value.inviteUrl);
      await refresh();
      onUpdated?.();
      setNotice(
        value.delivery === "Sent"
          ? "Invitation sent by email."
          : value.inviteUrl
            ? "Invitation created. Copy the link below to share it."
            : "Changes saved.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const c = d?.club,
    a = d?.session;
  return (
    <div className="club-access v1-settings">
      {d ? <nav className="wg-settings-nav" aria-label="Jump to settings section"><a href="#workspace-settings">Workspace</a>{a?.isOwner ? <a href="#receiving-details">Receiving bank</a> : null}<a href="#courvix-subscription">Courvix subscription</a><a href="#invite-people">Invite people</a><a href="#access-roles">Roles & access</a><a href="#invitation-history">Invitation history</a></nav> : null}
      {d?.session && (d.session.isOwner || d.session.permissions?.Access !== "none") && <AccessControl onUpdated={onUpdated}/>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="access-success" role="status">
          {notice}
        </p>
      )}
      {!d && (
        <p>
          <T>{"Loading settings…"}</T>
        </p>
      )}
      {d && (
        <>
          <section id="workspace-settings" className="panel padded">
            <span className="eyebrow">
              <T>{"WORKSPACE"}</T>
            </span>
            <h2>{c.name}</h2>
            <p>
              <span className="badge amber">{c.status}</span> ·{" "}
              {c.plan === "Club Pro" ? "Pro" : c.plan}
            </p>
            <p className="hint">
              {c.status === "Trial"
                ? "Trial until " + date(c.trial_ends)
                : c.renew_at
                  ? "Active until " + date(c.renew_at)
                  : "Renew the subscription to enable changes."}
            </p>
            {a.isOwner ? (
              <form
                className="form"
                key={c.revision}
                onSubmit={(e) => {
                  e.preventDefault();
                  act({
                    action: "settings",
                    ...Object.fromEntries(new FormData(e.currentTarget)),
                  });
                }}
              >
                <label>
                  {c.workspace_type === "Trainer" ? (
                    "Training business name"
                  ) : (
                    <T>{"Club name"}</T>
                  )}
                  <input name="clubName" defaultValue={c.name} required />
                </label>
                <div className="profile-grid">
                  {c.workspace_type === "Trainer" ? (
                    <input type="hidden" name="groupLabel" value="Private" />
                  ) : (
                    <label>
                      <T>{"Group terminology"}</T>
                      <select name="groupLabel" defaultValue={c.group_label}>
                        <option value="Tim">
                          <T>{"Tim"}</T>
                        </option>
                        <option value="Kelas">
                          <T>{"Kelas"}</T>
                        </option>
                        <option value="Kelompok">
                          <T>{"Kelompok"}</T>
                        </option>
                        <option value="Private">
                          <T>{"Private"}</T>
                        </option>
                      </select>
                    </label>
                  )}
                  <label>
                    <T>{"Time zone"}</T>
                    <ZoneSelect defaultValue={c.timezone} />
                  </label>
                </div>
                <div className="profile-grid">
                  <label>
                    <T>{"Country"}</T>
                    <CountrySelect defaultValue={c.country || "ID"} />
                  </label>

                  <label>
                    <T>{"Location"}</T>
                    <input
                      name="location"
                      defaultValue={c.location}
                      maxLength={150}
                    />
                  </label>
                  <label>
                    <T>{"Currency"}</T>
                    <input value={c.currency || "IDR"} readOnly />
                    <small className="hint">
                      <T>{"Does not change amounts or convert balances."}</T>
                    </small>
                  </label>
                </div>
                <h3 id="receiving-details">
                  <T>{"Bank account for member dues"}</T>
                </h3>
                <p className="hint">
                  <T>
                    {
                      "Your workspace bank account, separate from the account used to pay Courvix subscriptions."
                    }
                  </T>
                </p>
                <label>
                  <T>{"Bank"}</T>
                  <input
                    name="bankName"
                    defaultValue={c.bank_name}
                    maxLength={80}
                  />
                </label>
                <label>
                  <T>{"Bank account number"}</T>
                  <input
                    name="bankAccount"
                    defaultValue={c.bank_account}
                    inputMode="numeric"
                    maxLength={40}
                  />
                </label>
                <label>
                  <T>{"Account holder"}</T>
                  <input
                    name="bankHolder"
                    defaultValue={c.bank_holder}
                    maxLength={150}
                  />
                </label>
                <button className="btn primary" disabled={busy}>
                  <T>{"Save settings"}</T>
                </button>
              </form>
            ) : (
              <p>
                <T>
                  {
                    "The workspace owner manages bank details, plans, and ownership."
                  }
                </T>
              </p>
            )}
          </section>
          <section id="courvix-subscription" className="panel padded">
            <span className="eyebrow">
              <T>{"LANGGANAN COURVIX"}</T>
            </span>
            <h2>
              <T>{"Plans for workspace administrators"}</T>
            </h2>
            <p>
              <T>
                {
                  "Starter IDR 250,000 · Pro IDR 500,000 per 30-day paid term. Both include the core tools; Pro adds scheduled setup/onboarding support with scope agreed before payment."
                }
              </T>
            </p>
            <p className="hint">
              <T>
                {
                  "Member dues go to your workspace bank account. Subscription payments go to Courvix and are reviewed by the platform owner."
                }
              </T>
            </p>
            {a.isOwner ? (
              <>
                <form
                  className="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    act({
                      action: "subscribe",
                      ...Object.fromEntries(new FormData(e.currentTarget)),
                    });
                  }}
                >
                  <label>
                    <T>{"Plan"}</T>
                    <select name="plan" defaultValue={c.plan}>
                      <option value="Starter">
                        <T>{"Starter"}</T>
                      </option>
                      <option value="Club Pro">
                        <T>{"Pro"}</T>
                      </option>
                    </select>
                  </label>
                  <button className="btn" disabled={busy}>
                    <T>{"Create subscription invoice"}</T>
                  </button>
                </form>
                {d.subscriptionBank.account ? (
                  <div className="bank-card">
                    <strong>{d.subscriptionBank.bank}</strong>
                    <b>{d.subscriptionBank.account}</b>
                    <span>
                      <T>{"a.n. "}</T>
                      {d.subscriptionBank.holder}
                    </span>
                  </div>
                ) : (
                  <p className="hint">
                    <T>
                      {
                        "Subscription bank instructions are not available. Contact"
                      }
                    </T>{" "}
                    <a href={"mailto:" + d.supportEmail}>{d.supportEmail}</a>{" "}
                    <T>{"before transferring."}</T>
                  </p>
                )}
                {d.billing.map((b: any) => (
                  <article className="billing-item" key={b.id}>
                    <strong>
                      {b.plan}
                      <T>{"· Rp"}</T>
                      {b.amount.toLocaleString("en-GB")}
                    </strong>
                    <p>
                      {b.status} · {date(b.created_at)}
                    </p>
                    {b.note && <p>{b.note}</p>}
                    {["Pending", "Rejected"].includes(b.status) && (
                      <form
                        className="form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          act({
                            action: "subscription-proof",
                            id: b.id,
                            ...Object.fromEntries(
                              new FormData(e.currentTarget),
                            ),
                          });
                        }}
                      >
                        <label>
                          <T>{"Transfer reference"}</T>
                          <input
                            name="reference"
                            minLength={4}
                            required
                            placeholder="Bank reference number"
                          />
                        </label>
                        <label>
                          <T>{"Sender name / notes"}</T>
                          <input name="note" maxLength={1000} />
                        </label>
                        <button
                          className="btn primary"
                          disabled={busy || !d.subscriptionBank.account}
                        >
                          <T>{"Submit for review"}</T>
                        </button>
                        <button
                          type="button"
                          className="text-btn"
                          disabled={busy}
                          onClick={() =>
                            act({
                              action: "cancel-subscription-invoice",
                              id: b.id,
                            })
                          }
                        >
                          <T>{"Cancel invoice"}</T>
                        </button>
                      </form>
                    )}
                  </article>
                ))}
              </>
            ) : (
              <p>
                <T>
                  {"Contact your owner for subscription payment or renewal."}
                </T>
              </p>
            )}
          </section>
          <section id="invite-people" className="panel padded">
            <span className="eyebrow">
              <T>{"THE PEOPLE BEHIND THE PROGRESS"}</T>
            </span>
            <h2>
              <T>{"Invite users"}</T>
            </h2>
            <p className="hint">
              <T>
                {
                  "You can record members without accounts. An invitation links the recipient’s account to the profile with the same email."
                }
              </T>
            </p>
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                act({
                  action: "invite",
                  ...Object.fromEntries(new FormData(e.currentTarget)),
                });
              }}
            >
              <label>
                <T>{"Recipient name"}</T>
                <input name="name" required maxLength={150} />
              </label>
              <label>
                <T>{"Recipient’s email address"}</T>
                <input name="email" type="email" required />
              </label>
              <div className="profile-grid">
                <label>
                  <T>{"Role"}</T>
                  <select name="role">
                    <option value="Member">
                      {c.workspace_type === "Trainer" ? (
                        "Client"
                      ) : (
                        <T>{"Member"}</T>
                      )}
                    </option>
                    <option value="Coach">
                      {c.workspace_type === "Trainer" ? (
                        "Trainer"
                      ) : (
                        <T>{"Coach"}</T>
                      )}
                    </option>
                    {(a.isOwner || a.canInviteAdmin) && (
                      <option value="Admin">
                        <T>{"Admin"}</T>
                      </option>
                    )}
                  </select>
                </label>
                {c.workspace_type !== "Trainer" && (
                  <label>
                    <T>{"Group (for Member/Coach)"}</T>
                    <select name="team">
                      <option value="">
                        <T>{"Choose group"}</T>
                      </option>
                      {d.teams.map((t: any) => (
                        <option value={t.id} key={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <button className="btn primary" disabled={busy}>
                <T>{"Create & send invitation"}</T>
              </button>
            </form>
            {url && (
              <div className="invite-link-box">
                <p>
                  <T>{"Single-use link · valid for 7 days"}</T>
                </p>
                <input aria-label="Invitation link" readOnly value={url} />
                <button
                  className="btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(url);
                      setNotice("Link copied.");
                    } catch {
                      setNotice(
                        "Select and copy the link from the field above.",
                      );
                    }
                  }}
                >
                  <Copy size={16} />
                  <T>{"Copy link"}</T>
                </button>
              </div>
            )}
            {!d.emailConfigured && (
              <p className="hint">
                <T>
                  {
                    "Email is not configured. You can share the link directly; it will not be marked as sent."
                  }
                </T>
              </p>
            )}
          </section>
          <section className="panel padded">
            <h2>
              <T>{"Workspace users"}</T>
            </h2>
            {d.users.map((u: any) => (
              <article className="user-access-item" key={u.id}>
                <Avatar name={u.name} url={u.avatarUrl} />
                <div>
                  <strong>{u.name}</strong>
                  <p>{u.email}</p>
                  <small>
                    {u.role} · {u.active ? "Active" : "Access revoked"}
                  </small>
                </div>
                {a.isOwner && u.active && u.role !== "Owner" && (
                  <button
                    className="text-btn danger"
                    disabled={busy}
                    onClick={() => {
                      if (
                        confirm(
                          "Revoke access for " +
                            u.name +
                            "? The profile and history will be preserved.",
                        )
                      )
                        act({ action: "revoke-user", id: u.id });
                    }}
                  >
                    <T>{"Revoke access"}</T>
                  </button>
                )}
              </article>
            ))}
            {a.isOwner && (
              <details>
                <summary>
                  <T>{"Transfer workspace ownership"}</T>
                </summary>
                <p>
                  <T>
                    {
                      "Only an active Admin can become the new owner. After transfer, your role becomes Admin. A linked branch is detached from its previous headquarters."
                    }
                  </T>{" "}
                  <T>
                    {
                      "A linked branch is detached from its old organization when ownership is transferred."
                    }
                  </T>
                </p>
                <form
                  className="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    act({
                      action: "transfer-owner",
                      ...Object.fromEntries(new FormData(e.currentTarget)),
                    });
                  }}
                >
                  <label>
                    <T>{"New owner"}</T>
                    <select name="id" required>
                      <option value="">
                        <T>{"Choose Admin"}</T>
                      </option>
                      {d.users
                        .filter((u: any) => u.role === "Admin" && u.active)
                        .map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.name} · {u.email}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    <T>{"Type the workspace name to confirm"}</T>
                    <input name="confirm" required placeholder={c.name} />
                  </label>
                  <button className="btn" disabled={busy}>
                    <T>{"Transfer ownership"}</T>
                  </button>
                </form>
              </details>
            )}
          </section>
          <section id="invitation-history" className="panel padded access-invites">
            <h2>
              <T>{"Invitations & delivery"}</T>
            </h2>
            {!d.invites.length && (
              <p>
                <T>{"No invitations yet. Use the form above."}</T>
              </p>
            )}
            {d.invites.map((i: any) => (
              <article key={i.id}>
                <div>
                  <strong>{i.email}</strong>
                  <p>
                    {i.role} ·{" "}
                    {i.used_at
                      ? "Diterima"
                      : i.revoked_at
                        ? "Dicabut"
                        : i.expires < Date.now()
                          ? "Kedaluwarsa"
                          : "Menunggu penerima"}
                  </p>
                  <small>
                    <T>{"Valid until "}</T>
                    {date(i.expires)}
                  </small>
                </div>
                {!i.used_at &&
                  !i.revoked_at &&
                  (a.isOwner || a.canInviteAdmin || i.role !== "Admin") && (
                    <button
                      className="text-btn"
                      disabled={busy}
                      onClick={() => act({ action: "revoke", id: i.id })}
                    >
                      <T>{"Revoke invitation"}</T>
                    </button>
                  )}
              </article>
            ))}
            {d.outbox.map((m: any) => (
              <div className="mail-delivery" key={m.id}>
                <span>
                  <Mail size={14} /> {m.to_email} · <b>{m.status}</b>
                  {m.error && <small>{m.error}</small>}
                </span>
                {["Failed", "Not configured", "Pending"].includes(m.status) && (
                  <button
                    className="text-btn"
                    disabled={busy}
                    onClick={() => act({ action: "resend", id: m.id })}
                  >
                    <T>{"Retry sending"}</T>
                  </button>
                )}
              </div>
            ))}
          </section>
          <section className="panel padded access-invites">
            <h2>
              <T>{"Data & support"}</T>
            </h2>
            <p>
              <T>
                {
                  "You can export your records even after your subscription expires. Exports contain only data your account can access."
                }
              </T>
            </p>
            <div className="actions">
              <ExportLink>
                <T>{"Export JSON"}</T>
              </ExportLink>
              <a className="btn" href="/policies">
                <T>{"Privacy & terms"}</T>
              </a>
              <a className="btn" href={"mailto:" + d.supportEmail}>
                <T>{"Contact support"}</T>
              </a>
            </div>
            <p className="hint">
              <T>
                {
                  "Data deletion request: email the workspace name from the owner’s address to "
                }
              </T>
              {d.supportEmail}
              <T>{". Our team will verify ownership before processing."}</T>
            </p>
          </section>
        </>
      )}
    </div>
  );
}
function date(v: any) {
  return v
    ? new Date(v).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
}
