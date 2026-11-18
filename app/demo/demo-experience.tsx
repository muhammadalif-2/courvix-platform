"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  GraduationCap,
  Mail,
  Play,
  RotateCcw,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import Workspace from "../workspace-client";
import Operator from "../operator/page";
import { AppTransportProvider, type AppRequest } from "../app-transport";
import { PreferenceControls } from "../preferences";
import { ProductCards } from "../marketing";
import { BrandLogo } from "@/components/brand";
import {
  SportSelect,
  CountrySelect,
  CurrencySelect,
  ZoneSelect,
} from "@/components/catalog-fields";
import {
  createDemoState,
  upgradeDemoState,
  simulateRequest,
  advanceDemo,
  demoIdentity,
  type DemoState,
  type DemoRole,
} from "@/lib/demo-engine";
import "./demo.css";
import "../personal-training.css";
const storageKey = "courvix-v1-interactive-demo-v2";
export default function DemoExperience() {
  const [state, setState] = useState<DemoState | null>(null),
    [product, setProduct] = useState<"club" | "training">("club"),
    [view, setView] = useState("products"),
    [module, setModule] = useState("Dashboard"),
    [error, setError] = useState(""),
    [resetPrompt, setResetPrompt] = useState(false),
    [guide, setGuide] = useState(false);
  const current = useRef<DemoState | null>(null),
    header = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let value: DemoState;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      value =
        [2, 3].includes(saved?.version) &&
        saved.data?.records &&
        Array.isArray(saved.users)
          ? upgradeDemoState(saved)
          : createDemoState();
    } catch {
      value = createDemoState();
    }
    const params = new URL(location.href).searchParams,
      training =
        params.get("product") === "training" ||
        params.get("workspace") === "demo-nusa",
      wanted =
        params.get("workspace") ||
        (params.has("product")
          ? training
            ? "demo-nusa"
            : "demo-batam"
          : undefined);
    setProduct(training ? "training" : "club");
    if (wanted && value.data.records.Clubs.some((c) => c.id === wanted))
      value.club = wanted;
    else if (wanted) setResetPrompt(true);
    if (
      !value.data.records.Members.some(
        (m) => m.id === value.member && m.club === value.club,
      )
    )
      value.member =
        value.data.records.Members.find((m) => m.club === value.club)?.id || "";
    if (params.has("product") || params.has("workspace")) setView("roles");
    const role = params.get("role");
    if (
      ["Platform", "Owner", "Admin", "Coach", "Member"].includes(role || "")
    ) {
      value.role = role as DemoRole;
      try {
        demoIdentity(value);
        setView("workspace");
      } catch {
        setView("roles");
      }
    }
    const initial = params.get("module");
    if (initial) setModule(initial);
    current.current = value;
    setState(value);
  }, []);
  const update = useCallback((value: DemoState) => {
    current.current = value;
    setState(value);
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {}
  }, []);
  const request = useCallback<AppRequest>(
    async (path, options) => {
      if (options?.signal?.aborted)
        throw new DOMException("Aborted", "AbortError");
      try {
        if (!current.current) throw Error("The demo is not ready.");
        const next = structuredClone(current.current),
          method = options?.method || "GET",
          b = typeof options?.body === "string" ? JSON.parse(options.body) : {},
          result = simulateRequest(next, path, method, b);
        if (method !== "GET") update(next);
        return Response.json(result.value, { status: result.status || 200 });
      } catch (e) {
        return Response.json({ error: (e as Error).message }, { status: 400 });
      }
    },
    [update],
  );
  useEffect(() => {
    if (!header.current) return;
    const observer = new ResizeObserver(() =>
      header.current?.parentElement?.style.setProperty(
        "--demo-toolbar-height",
        (header.current?.offsetHeight || 0) + "px",
      ),
    );
    observer.observe(header.current);
    return () => observer.disconnect();
  }, [!!state]);
  function selectProduct(nextProduct: "club" | "training") {
    if (!current.current) return;
    const next = structuredClone(current.current),
      wanted = nextProduct === "training" ? "demo-nusa" : "demo-batam";
    setProduct(nextProduct);
    if (!next.data.records.Clubs.some((c) => c.id === wanted)) {
      setResetPrompt(true);
      return;
    }
    next.club = wanted;
    next.member =
      next.data.records.Members.find((m) => m.club === wanted)?.id || "";
    next.role = "Owner";
    update(next);
    setModule("Dashboard");
    setView("roles");
    setError("");
  }
  function choose(role: DemoRole, target = "Dashboard", member?: string) {
    if (!current.current) return;
    const next = structuredClone(current.current);
    next.role = role;
    if (member) next.member = member;
    try {
      demoIdentity(next);
      update(next);
      setModule(target);
      setView("workspace");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function reset(populated: boolean) {
    const next = createDemoState(populated);
    if (populated && product === "training") next.club = "demo-nusa";
    update(next);
    setView(populated ? "roles" : "onboarding");
    setModule("Dashboard");
    setError("");
    setResetPrompt(false);
  }
  async function accept(code: string) {
    const r = await request("/api/access", {
        method: "POST",
        body: JSON.stringify({ action: "join", code }),
      }),
      v: any = await r.json();
    if (!r.ok) {
      setError(v.error);
      return;
    }
    setView("workspace");
    setModule("Dashboard");
    setError("");
  }
  if (!state)
    return (
      <main className="demo-loading">
        <BrandLogo />
        <p>Preparing your interactive demo…</p>
      </main>
    );
  const training = product === "training",
    club = state.data.records.Clubs.find((c) => c.id === state.club),
    roles: [DemoRole, string, string, any][] = [
      [
        "Platform",
        "Courvix owner",
        "Platform metrics, products and subscription reviews.",
        Shield,
      ],
      [
        "Owner",
        training ? "Business owner" : "Club owner",
        training
          ? "Offers, clients, payments and training policies."
          : "Club operations, staff access and branch oversight.",
        Users,
      ],
      [
        "Admin",
        training ? "Training admin" : "Club admin",
        "Manage daily operations and verify incoming transfers.",
        Shield,
      ],
      [
        "Coach",
        training ? "Trainer" : "Coach",
        training
          ? "Assigned clients, appointments and session outcomes."
          : "Group roster, schedules and attendance.",
        GraduationCap,
      ],
      [
        "Member",
        training ? "Client" : "Member",
        training
          ? "Choose a pack, pay, book and track remaining sessions."
          : "Accept invitations, view training and manage dues.",
        User,
      ],
    ];
  const mail = state.mail.filter((m) => m.club === state.club),
    clients = state.data.records.Members.filter((m) => m.club === state.club);
  const steps = training
    ? [
        ["Set up offers & business", "Owner", "PTOffers"],
        ["Add and invite a client", "Owner", "Settings"],
        ["Client chooses a package", "Member", "PTOffers"],
        ["Review incoming transfers", "Admin", "PTPayments"],
        ["Reserve a private appointment", "Member", "PTBookings"],
        ["Trainer completes yesterday’s example", "Coach", "PTBookings"],
        ["Client checks remaining sessions", "Member", "PTCredits"],
      ]
    : [
        ["Create groups & membership plans", "Owner", "Teams"],
        ["Invite a coach or member", "Owner", "Settings"],
        ["Coach records attendance", "Coach", "Attendance"],
        ["Member submits dues", "Member", "Invoices"],
        ["Admin verifies payment", "Admin", "Invoices"],
        ["Review payment reminders", "Admin", "Reminders"],
        ["View all club branches", "Owner", "Network"],
      ];
  return (
    <AppTransportProvider request={request}>
      <div
        className={
          "demo-shell " + (view === "workspace" ? "demo-in-workspace" : "")
        }
      >
        <div className="demo-controls" ref={header}>
          <div className="demo-controls-top">
            <a href="/" className="demo-back">
              <ArrowLeft size={13} />
              Landing page
            </a>
            <span className="demo-safe-label">
              <span />
              INTERACTIVE DEMO · SAMPLE DATA
            </span>
            <PreferenceControls />
            <div className="demo-time">
              <Clock size={13} />
              <span>{state.today}</span>
              {[1, 3].map((days) => (
                <button
                  key={days}
                  onClick={() => {
                    const next = structuredClone(state);
                    advanceDemo(next, days);
                    update(next);
                  }}
                >
                  +{days} day{days > 1 ? "s" : ""}
                </button>
              ))}
            </div>
            <button className="demo-reset" title="Reset browser-local demo edits and load the latest sample dataset" onClick={() => setResetPrompt(true)}>
              <RotateCcw size={12} />
              Reset demo
            </button>
          </div>
          <div className="demo-role-bar">
            <button
              className="demo-logo-link"
              onClick={() => setView("products")}
            >
              <BrandLogo />
            </button>
            <label className="demo-product-select">
              <span>PRODUCT</span>
              <select
                aria-label="Demo product"
                value={product}
                onChange={(e) => selectProduct(e.target.value as any)}
              >
                <option value="club">Club Management</option>
                <option value="training">Personal Training</option>
              </select>
            </label>
            <div className="demo-role-buttons">
              {roles.map(([role, label]) => (
                <button
                  className={
                    state.role === role && view === "workspace" ? "active" : ""
                  }
                  key={role}
                  onClick={() => choose(role)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="demo-inbox-btn" onClick={() => setView("inbox")}>
              <Mail size={15} />
              Inbox <span>{mail.length}</span>
            </button>
            <button className="demo-guide-btn" onClick={() => setGuide(!guide)}>
              <Play size={13} />
              Demo guide
            </button>
          </div>
        </div>
        {error && (
          <p className="demo-error" role="alert">
            {error}
          </p>
        )}
        {guide && (
          <section className="demo-product-guide">
            <div>
              <span className="demo-eyebrow">
                {training
                  ? "PERSONAL TRAINING JOURNEY"
                  : "CLUB MANAGEMENT JOURNEY"}
              </span>
              <button onClick={() => setGuide(false)} aria-label="Close guide">
                <X size={15} />
              </button>
            </div>
            <p>
              {training
                ? "Session credits activate after verified payment. Booking reserves one; completion uses one."
                : "The club keeps its member dues, group-based schedules and attendance workflow."}
            </p>
            <ol>
              {steps.map(([label, role, target], i) => (
                <li key={label}>
                  <button onClick={() => choose(role as DemoRole, target)}>
                    <b>0{i + 1}</b>
                    {label}
                    <ArrowRight size={12} />
                  </button>
                </li>
              ))}
            </ol>
            <button className="text-btn" onClick={() => setView("inbox")}>
              Accept a simulated invitation in the inbox →
            </button>
            <p className="hint">
              Use +1 day to move past a future appointment’s end time. Emails,
              bank transfers and dates here are simulated.
            </p>
          </section>
        )}
        {resetPrompt && (
          <div
            className="demo-reset-confirm"
            role="dialog"
            aria-modal="true"
            aria-label="Reset demo"
          >
            <h3>Choose a fresh demo</h3>
            <p>
              This only replaces sample data stored in this browser. Real
              workspace records are preserved.
            </p>
            <div>
              <button onClick={() => reset(true)}>
                Load complete examples
              </button>
              <button onClick={() => reset(false)}>
                Start an empty {training ? "training business" : "club"}
              </button>
              <button
                onClick={() => {
                  setResetPrompt(false);
                  setProduct(
                    club?.workspace_type === "Trainer" ? "training" : "club",
                  );
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {view === "products" ? (
          <main className="demo-hub">
            <div className="demo-hub-heading">
              <span className="demo-eyebrow">
                TWO PRODUCTS. DISTINCT WORKFLOWS.
              </span>
              <h1>
                Your club.
                <br />
                Your clients.
                <br />
                <em>Your next level.</em>
              </h1>
              <p>
                Choose Club Management or Personal Training. Each product has
                its own workspace, workflow and role experience.
              </p>
            </div>
            <ProductCards demo />
            <button
              className="demo-secondary"
              onClick={() => choose("Platform")}
            >
              Explore the Courvix owner dashboard <ArrowRight size={15} />
            </button>
          </main>
        ) : view === "roles" ? (
          <main className="demo-hub">
            <div className="demo-hub-heading">
              <span className="demo-eyebrow">
                COURVIX / {training ? "PERSONAL TRAINING" : "CLUB MANAGEMENT"}
              </span>
              <h1>
                {training ? "Personal coaching." : "Club operations."}
                <br />
                <em>Every perspective.</em>
              </h1>
              <p>
                {training
                  ? "Try per-visit purchases, session packs, payment review, scheduling, completion and the remaining-session ledger."
                  : "Try club invitations, coaching, attendance, dues, payment verification and reminders."}
              </p>
              <div className="demo-hub-actions">
                <button
                  className="demo-primary"
                  onClick={() => choose("Owner")}
                >
                  Open {training ? "training" : "club"} workspace{" "}
                  <ArrowRight size={17} />
                </button>
                <button
                  className="demo-secondary"
                  onClick={() => setResetPrompt(true)}
                >
                  Start from registration
                </button>
              </div>
            </div>
            <div className="demo-role-grid">
              {roles.map(([role, label, description, Icon], i) => (
                <button key={role} onClick={() => choose(role)}>
                  <span className="demo-role-number">0{i + 1} / ROLE</span>
                  <Icon size={28} />
                  <h2>{label}</h2>
                  <p>{description}</p>
                  <strong>
                    Open view <ArrowRight size={15} />
                  </strong>
                </button>
              ))}
            </div>
            <section className="demo-journey">
              <div>
                <span className="demo-eyebrow">FOLLOW THE FULL JOURNEY</span>
                <h2>
                  {training ? "From first pack." : "From invitation."}
                  <br />
                  {training ? "To real progress." : "To a connected club."}
                </h2>
                <p>
                  Switch roles as you go. The example records are shared inside
                  this simulation.
                </p>
              </div>
              <ol>
                {steps.map(([label, role, target], i) => (
                  <li key={label}>
                    <button onClick={() => choose(role as DemoRole, target)}>
                      <span>0{i + 1}</span>
                      <strong>{label}</strong>
                      <ArrowRight size={14} />
                    </button>
                  </li>
                ))}
                <li>
                  <button onClick={() => setView("inbox")}>
                    <span>
                      <Mail size={14} />
                    </span>
                    <strong>Open invitation & reminder inbox</strong>
                    <ArrowRight size={14} />
                  </button>
                </li>
              </ol>
            </section>
          </main>
        ) : view === "onboarding" ? (
          <main className="demo-onboarding">
            <span className="demo-eyebrow">
              SIMULATED BUSINESS REGISTRATION
            </span>
            <h1>Start your {training ? "training business" : "club"}.</h1>
            <p>
              New workspaces start empty. No real account, email or payment is
              created.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const b = Object.fromEntries(new FormData(e.currentTarget)),
                  r = await request("/api/access", {
                    method: "POST",
                    body: JSON.stringify({
                      ...b,
                      action: "register",
                      terms: true,
                      plan: "Starter",
                      workspaceType: training ? "Trainer" : "Club",
                      groupLabel: training ? "Private" : "Tim",
                    }),
                  }),
                  v: any = await r.json();
                if (!r.ok) {
                  setError(v.error);
                  return;
                }
                setModule("Dashboard");
                setView("workspace");
              }}
            >
              <label>
                Business / club name
                <input
                  name="clubName"
                  required
                  defaultValue={
                    training ? "My Personal Training" : "My Sports Club"
                  }
                />
              </label>
              <label>
                Sport
                <SportSelect defaultValue={training ? "Fitness" : "Basket"} />
              </label>
              <div className="profile-grid">
                <label>
                  Country
                  <CountrySelect />
                </label>
                <label>
                  Currency
                  <CurrencySelect />
                </label>
                <label>
                  Time zone
                  <ZoneSelect />
                </label>
                <label>
                  Location
                  <input name="location" required defaultValue="Main studio" />
                </label>
              </div>
              <p>
                14-day workspace trial. Business subscription: Starter IDR
                250,000 / Pro IDR 500,000 per 30 days after activation.{" "}
                {training
                  ? "Client visit/session-pack prices are set separately by your business."
                  : ""}
              </p>
              <button className="demo-primary">
                Create an empty demo workspace <ArrowRight size={15} />
              </button>
            </form>
          </main>
        ) : view === "inbox" ? (
          <main className="demo-inbox">
            <div className="demo-inbox-heading">
              <span className="demo-eyebrow">SIMULATED EMAILS</span>
              <h1>Invitations & follow-ups.</h1>
              <p>
                No real messages are sent. Accept an invitation to enter the
                recipient’s role.
              </p>
              <button
                className="demo-secondary"
                onClick={() => choose("Owner", "Settings")}
              >
                Create an invitation <ArrowRight size={14} />
              </button>
            </div>
            {!mail.length ? (
              <div className="demo-mail-card">
                <h3>Your demo inbox is empty.</h3>
                <p>
                  Create an invitation from the owner workspace or run payment
                  follow-ups.
                </p>
              </div>
            ) : (
              mail.map((m) => {
                const invite = state.invites.find((i) => i.id === m.invite);
                return (
                  <article className="demo-mail-card" key={m.id}>
                    <span className="demo-eyebrow">
                      {m.type.toUpperCase()} · SIMULATED
                    </span>
                    <h3>{m.subject}</h3>
                    <small>To: {m.to_email}</small>
                    <p>{m.message}</p>
                    {invite ? (
                      <button
                        className="demo-primary"
                        disabled={
                          !!invite.used_at ||
                          !!invite.revoked_at ||
                          invite.expires < Date.parse(state.today)
                        }
                        onClick={() => accept(invite.code)}
                      >
                        {invite.used_at
                          ? "Invitation accepted"
                          : invite.revoked_at
                            ? "Invitation revoked"
                            : "Accept as " +
                              (training
                                ? invite.role === "Member"
                                  ? "Client"
                                  : invite.role === "Coach"
                                    ? "Trainer"
                                    : invite.role
                                : invite.role)}
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        className="demo-secondary"
                        onClick={() => {
                          const person = clients.find(
                            (c) => c.email === m.to_email,
                          );
                          choose(
                            "Member",
                            training ? "PTPayments" : "Invoices",
                            person?.id,
                          );
                        }}
                      >
                        View payment details <ArrowRight size={14} />
                      </button>
                    )}
                  </article>
                );
              })
            )}
          </main>
        ) : view === "workspace" ? (
          <div
            key={state.role + state.club + state.member + state.today + module}
          >
            {state.role === "Platform" ? (
              <Operator demo />
            ) : (
              <>
                <div className="demo-recipient-selector">
                  {training ? "Client" : "Member"} preview:{" "}
                  <select
                    aria-label="Preview client or member"
                    value={state.member}
                    onChange={(e) => choose("Member", module, e.target.value)}
                  >
                    {clients.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => setView("roles")}>
                    All {training ? "training" : "club"} roles
                  </button>
                </div>
                <Workspace
                  demo
                  demoToday={state.today}
                  initialPage={module}
                  onDemoExit={() => setView("roles")}
                />
              </>
            )}
          </div>
        ) : null}
        <footer className="demo-product-footer">
          <span>
            Isolated demo · Browser-local sample records · No real messages or
            payments
          </span>
          <a href="/login">
            Sign in to your real workspace <ArrowRight size={13} />
          </a>
        </footer>
      </div>
    </AppTransportProvider>
  );
}
