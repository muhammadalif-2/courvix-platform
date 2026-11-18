"use client";
import { canFeature } from "@/lib/feature-access";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Dumbbell,
  FileText,
  GraduationCap,
  Layers,
  LifeBuoy,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  User,
  Users,
  Wallet,
  Building2,
  Bell,
  Pencil,
  Mail,
  Copy,
  ChevronLeft,
} from "lucide-react";
import { useAppRequest } from "./app-transport";
import { ManagementShell } from "./management-shell";
import AccountProfile, { Avatar } from "./account-profile";
import OrganizationHub, { Metric } from "./organization-hub";
import { ClubAccess, accessAction } from "./access-client";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { ExportLink } from "./export-link";
import { useModalKeyboard } from "./modal-keyboard";
import { money } from "@/lib/courvix";
import { TrainingControlRoom } from "./control-room";
import "./personal-training.css";
const statusClass = (s: string) =>
  ["Paid", "Completed", "Active"].includes(s)
    ? "active"
    : ["Cancelled", "Rejected", "No-show"].includes(s)
      ? "rejected"
      : "review";
export default function PersonalTraining({
  demo = false,
  demoToday,
  initialPage = "Dashboard",
  onSwitch,
  onExit,
}: {
  demo?: boolean;
  demoToday?: string;
  initialPage?: string;
  onSwitch: (id: string) => Promise<void>;
  onExit?: () => void;
}) {
  const request = useAppRequest(),
    [d, setD] = useState<any>(null),
    [page, setPage] = useState(
      (
        {
          Dashboard: "overview",
          ControlRoom: "control",
          PTOffers: "offers",
          PTPayments: "payments",
          PTBookings: "appointments",
          PTCredits: "credits",
          PTClasses: "classes",
          PTProgress: "progress",
          Network: "network",
          Profile: "profile",
          Settings: "settings",
          Invoices: "payments",
          Reminders: "followups",
          Members: "clients",
          Coaches: "trainers",
          Schedule: "appointments",
          Teams: "classes",
        } as Record<string, string>
      )[initialPage] || "overview",
    ),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [modal, setModal] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [reminders, setReminders] = useState<any>(null),
    [dirty, setDirty] = useState(false),
    [discard, setDiscard] = useState(false),
    [inviteResult, setInviteResult] = useState<any>(null),
    [bookingClient, setBookingClient] = useState(""),
    [bookingOrder, setBookingOrder] = useState(""),
    [bookingStart, setBookingStart] = useState("09:00");
  const lock = useRef(false);
  function finishClose() {
    setModal(modal?.returnTo || null);
    setDirty(false);
    setDiscard(false);
    setInviteResult(null);
  }
  function closeModal() {
    if (busy) return;
    if (dirty) setDiscard(true);
    else finishClose();
  }
  useModalKeyboard(!!modal, closeModal, busy);
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  async function refresh() {
    const r = await request("/api/personal-training", { cache: "no-store" }),
      v: any = await r.json();
    if (!r.ok) throw Error(v.error || "Unable to load Personal Training.");
    setD(v);
    return v;
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
      const r = await request("/api/personal-training", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...b, revision: d.revision }),
        }),
        v: any = await r.json();
      if (!r.ok) throw Error(v.error || "Unable to save.");
      await refresh();
      setModal(modal?.returnTo || null);
      setDirty(false);
      setDiscard(false);
      setNotice(v.message || "Changes saved.");
      return true;
    } catch (e) {
      setError((e as Error).message);
      await refresh().catch(() => {});
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function loadReminders() {
    const r = await request("/api/reminders"),
      v: any = await r.json();
    if (!r.ok) throw Error(v.error);
    setReminders(v);
  }
  useEffect(() => {
    if (page === "followups") loadReminders().catch((e) => setError(e.message));
  }, [page]);
  async function reminderAction(b: any) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await request("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(b),
        }),
        v: any = await r.json();
      if (!r.ok) throw Error(v.error);
      await loadReminders();
      setNotice(
        b.action === "run"
          ? `${v.created} new reminder(s). ${demo ? "Messages appear only in the demo inbox." : v.blocked ? "Email is blocked until a verified sender is configured." : "Delivery history updated."}`
          : "Follow-up preferences saved.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const isAdmin = d?.session.role === "Admin",
    isClient = d?.session.role === "Member",
    isTrainer = d?.session.role === "Coach",
    fmt = (n: number) => money(n, d?.club.currency || "IDR", "en-GB"),
    name = (id: string) =>
      d?.clients.find((c: any) => c.id === id)?.name || "Client",
    trainer = (id: string) =>
      d?.coaches.find((c: any) => c.id === id)?.name || "Trainer";
  const nav = [
    {
      id: "overview",
      label: isClient ? "My training" : "Overview",
      icon: Activity,
    },
    ...(!isClient
      ? [
          { id: "control", label: "Training control room", icon: Layers },
          { id: "clients", label: "Clients", icon: Users },
        ]
      : []),
    ...(isAdmin
      ? [{ id: "trainers", label: "Trainers", icon: GraduationCap }]
      : []),
    ...(!isTrainer
      ? [
          {
            id: "offers",
            label: isClient ? "Buy sessions" : "Training offers",
            icon: Ticket,
          },
        ]
      : []),
    { id: "appointments", label: "Appointments", icon: CalendarDays },
    { id: "classes", label: "Small-group classes", icon: Layers },
    ...(!isTrainer
      ? [
          {
            id: "payments",
            label: "Payments",
            icon: Wallet,
            count: d?.orders.filter((o: any) => o.status === "Review").length,
          },
        ]
      : []),
    { id: "progress", label: "Training progress", icon: Dumbbell },
    ...(!isTrainer
      ? [
          { id: "credits", label: "Session ledger", icon: FileText },
          { id: "followups", label: "Payment follow-ups", icon: Bell },
        ]
      : []),
    { id: "profile", label: "My profile", icon: User },
    ...(isAdmin
      ? [{ id: "settings", label: "Business & access", icon: Settings }]
      : []),
    ...(d?.session.isOwner
      ? [{ id: "network", label: "Training locations", icon: Building2 }]
      : []),
    { id: "support", label: "Support", icon: LifeBuoy },
  ].filter(n=>!d||canFeature(d.session,({clients:"Members",trainers:"Coaches",offers:"PTPlans",appointments:"PTSessions",classes:"PTClasses",payments:"PTOrders",progress:"PTSessions",credits:"PTCredits",followups:"Reminders",settings:"Access",support:"Support"} as Record<string,string>)[n.id]||n.id));
  function navigate(id: string) {
    if(!nav.some(n=>n.id===id))return;
    setPage(id);
    setQuery("");
    setFilter("All");
    setError("");
    setModal(null);
  }
  const subtitle =
    page === "overview"
      ? isClient
        ? "Your next session starts with a plan."
        : "Personal coaching. Clear schedules. Every session accounted for."
      : "Courvix Personal Training · Packages, appointments and client progress";
  const canWrite = !!d && !d.readOnly && !busy && canFeature(d.session,({clients:"Members",trainers:"Coaches",offers:"PTPlans",appointments:"PTSessions",classes:"PTClasses",payments:"PTOrders",progress:"PTSessions",settings:"PTSettings",support:"Support"} as Record<string,string>)[page]||page,true);
  function open(value: any) {
    setError("");
    setNotice("");
    setDirty(false);
    setDiscard(false);
    setInviteResult(null);
    if (value.type === "booking") {
      setBookingClient(value.client || (isClient ? d.session.member : ""));
      setBookingOrder("");
      setBookingStart("09:00");
    }
    setModal(value);
  }
  function pill(status: string) {
    return (
      <span className={"status-pill " + statusClass(status)}>{status}</span>
    );
  }
  function search(statuses: string[] = []) {
    return (
      <div className="directory-toolbar">
        <label>
          <Search size={17} />
          <input
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, offers or appointments…"
          />
        </label>
        {statuses.length > 0 && (
          <select
            aria-label="Filter by status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </div>
    );
  }
  const match = (s: string, status?: string) =>
    s.toLowerCase().includes(query.toLowerCase()) &&
    (filter === "All" || filter === status);
  function empty(title: string, text: string) {
    return (
      <div className="management-empty">
        <Dumbbell size={30} />
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    );
  }
  function appointments(rows: any[], returnTo?: any) {
    return !rows.length ? (
      empty(
        "No appointments yet",
        "Reserve a paid session or publish a class to get started.",
      )
    ) : (
      <div className="pt-appointment-list">
        {rows.map((s) => (
          <button
            className="pt-appointment-row"
            key={s.id}
            onClick={() => open({ type: "appointment", record: s, returnTo })}
          >
            <div className="pt-date-tile">
              <strong>{s.date.slice(8)}</strong>
              <small>
                {new Date(s.date + "T12:00:00").toLocaleDateString("en", {
                  month: "short",
                })}
              </small>
            </div>
            <div>
              <strong>{s.name}</strong>
              <p>
                {isClient ? trainer(s.coachId) : name(s.client)} · {s.type}
              </p>
              <small>
                {s.time}–{s.endTime} · {s.venue}
              </small>
            </div>
            <div className="pt-appointment-end">
              {pill(s.status)}
              <ArrowUpRight size={15} />
            </div>
          </button>
        ))}
      </div>
    );
  }
  function orders(rows: any[], returnTo?: any) {
    return !rows.length ? (
      empty(
        "No training orders",
        "Choose a per-visit offer or a session pack. Credits activate after payment verification.",
      )
    ) : (
      <div className="management-table-wrap">
        <table className="management-table">
          <thead>
            <tr>
              <th>Client / offer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Session balance</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.name}</strong>
                  <small className="table-subline">
                    {o.planName} · {o.sessions} session(s)
                  </small>
                </td>
                <td>{fmt(o.amount)}</td>
                <td>
                  {pill(o.status)}
                  {o.balance.expired && (
                    <small className="table-subline">Pack expired</small>
                  )}
                </td>
                <td>
                  {o.status === "Paid"
                    ? `${o.balance.available} available · ${o.balance.reserved} reserved`
                    : "Credits not activated"}
                </td>
                <td>
                  <button
                    className="text-btn"
                    onClick={() =>
                      open({ type: "payment", record: o, returnTo })
                    }
                  >
                    View details <ArrowUpRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  function packageCards() {
    const plans = d.plans.filter((p: any) =>
      match(`${p.name} ${p.sessions}`, p.status),
    );
    return (
      <>
        {isAdmin && (
          <div className="hub-section-heading">
            <p>
              Sell a single visit or a bundle of 4, 8 or 16 sessions. Each
              purchase keeps its original price and terms.
            </p>
            <button
              className="btn primary"
              disabled={!canWrite}
              onClick={() => open({ type: "offer" })}
            >
              <Plus size={15} />
              Create offer
            </button>
          </div>
        )}
        {search()}
        <div className="pt-offer-grid">
          {plans.map((p: any) => (
            <article
              className={
                "panel pt-offer-card " + (p.sessions === 8 ? "featured" : "")
              }
              key={p.id}
            >
              <div className="pt-offer-top">
                <span className="tag">
                  {p.sessions === 1 ? "PER VISIT" : "SESSION PACK"}
                </span>
                {p.status === "Archived" && pill("Archived")}
              </div>
              <div className="pt-pack-number">
                {p.sessions}
                <span>{p.sessions === 1 ? "visit" : "sessions"}</span>
              </div>
              <h3>{p.name}</h3>
              <strong className="pt-offer-price">{fmt(p.amount)}</strong>
              <p>
                {p.description ||
                  "Structured personal training with a progress check-in."}
              </p>
              <ul>
                <li>
                  <Check size={14} />
                  {p.duration} minutes per session
                </li>
                <li>
                  <Check size={14} />
                  {p.validDays} days from activation
                </li>
                <li>
                  <Check size={14} />
                  {fmt(p.amount / p.sessions)} per session
                </li>
                <li>
                  <Check size={14} />
                  Credits tracked automatically
                </li>
              </ul>
              <button
                className={"btn " + (p.sessions === 8 ? "primary" : "")}
                disabled={!canWrite || p.status !== "Active"}
                onClick={() => open({ type: "order", plan: p })}
              >
                {isClient ? "Choose this offer" : "Assign to a client"}
                <ArrowRight size={15} />
              </button>
              {isAdmin && (
                <button
                  className="text-btn"
                  disabled={!canWrite}
                  onClick={() => open({ type: "offer", record: p })}
                >
                  Edit offer
                </button>
              )}
            </article>
          ))}
        </div>
        {!plans.length &&
          empty(
            "Create your first training offer",
            "Start with a single visit or a 4-, 8- or 16-session pack.",
          )}
      </>
    );
  }
  if (!d)
    return (
      <main className="access-main">
        <h1>Courvix Personal Training</h1>
        <p role={error ? "alert" : "status"}>
          {error || "Loading your training workspace…"}
        </p>
        {error && (
          <button
            className="btn"
            onClick={() => refresh().catch((e) => setError(e.message))}
          >
            Try again
          </button>
        )}
      </main>
    );
  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: d.club.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(d.now));
  const needsOutcome = d.appointments.filter(
    (s: any) =>
      s.status === "Scheduled" &&
      s.date + " " + s.endTime < d.today + " " + localTime,
  );
  const paid = d.orders.filter((o: any) => o.status === "Paid"),
    available = paid.reduce((n: number, o: any) => n + o.balance.available, 0),
    reserved = paid.reduce((n: number, o: any) => n + o.balance.reserved, 0),
    upcoming = d.appointments
      .filter(
        (s: any) =>
          ["Requested", "Scheduled"].includes(s.status) &&
          s.date + " " + s.endTime >= d.today + " " + localTime,
      )
      .sort((a: any, b: any) =>
        (a.date + a.time).localeCompare(b.date + b.time),
      ),
    completed = d.appointments.filter((s: any) => s.status === "Completed"),
    review = d.orders.filter((o: any) => o.status === "Review");
  return (
    <div className="pt-product">
      <ManagementShell
        title={nav.find((n) => n.id === page)?.label || "Personal Training"}
        subtitle={subtitle}
        nav={nav}
        active={page}
        onNavigate={navigate}
        demo={demo}
        searchItems={[
          ...d.clients.map((c: any) => ({
            id: "client:" + c.id,
            label: c.name,
            description: c.goal || c.email,
            group: "Clients",
            onSelect: () => open({ type: "client-detail", record: c }),
          })),
          ...d.appointments.map((s: any) => ({
            id: "session:" + s.id,
            label: s.name,
            description: name(s.client) + " · " + s.date + " · " + s.status,
            group: "Appointments",
            onSelect: () => open({ type: "appointment", record: s }),
          })),
          ...d.orders.map((o: any) => ({
            id: "order:" + o.id,
            label: o.name + " · " + o.planName,
            description: o.status,
            group: "Payments",
            onSelect: () => open({ type: "payment", record: o }),
          })),
          ...d.classes.map((c: any) => ({
            id: "class:" + c.id,
            label: c.name,
            description:
              c.date + " · " + c.booked + " / " + c.capacity + " places",
            group: "Classes",
            onSelect: () => open({ type: "class-detail", record: c }),
          })),
        ]}
        productLabel="Personal Training"
        workspaceName={d.club.name}
        roleLabel={
          isClient
            ? "Client"
            : isTrainer
              ? "Trainer"
              : d.session.isOwner
                ? "Business owner"
                : "Training admin"
        }
      >
        <WorkspaceSwitcher
          product="Trainer"
          club={d.club.id}
          isOwner={false}
          onNetwork={() => navigate("network")}
          onSwitch={onSwitch}
        />
        <div className="pt-workspace-caption">
          <span>PERSONAL TRAINING</span>
          <span>
            {d.club.timezone} · {d.club.currency}
          </span>
          <a href={demo ? "/demo" : "/products"}>
            Switch product <ArrowUpRight size={12} />
          </a>
          {demo && onExit && (
            <button className="text-btn" onClick={onExit}>
              Demo roles
            </button>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="access-success" role="status">
            <CheckCircle2 size={15} />
            {notice}
          </p>
        )}
        {d.readOnly && (
          <div className="platform-attention">
            <ShieldCheck size={18} />
            <div>
              <strong>Read-only · Workspace subscription expired</strong>
              <p>
                Your records and exports remain available. The owner can renew
                in Business & access.
              </p>
            </div>
          </div>
        )}
        {page === "control" && !isClient ? (
          <TrainingControlRoom
            view={d}
            onOpen={open}
            onNavigate={navigate}
            onRefresh={refresh}
          />
        ) : page === "overview" || (page === "control" && isClient) ? (
          <>
            <section className="pt-hero">
              <div>
                <span className="eyebrow">COURVIX / PERSONAL TRAINING</span>
                <h2>
                  {isClient ? (
                    <>
                      Build consistency.
                      <br />
                      <span>One session at a time.</span>
                    </>
                  ) : (
                    <>
                      Less admin.
                      <br />
                      <span>More personal progress.</span>
                    </>
                  )}
                </h2>
                <p>
                  {isClient
                    ? "Choose your pack, reserve your next session, and see every credit."
                    : "A dedicated workspace for private trainers and training studios."}
                </p>
                <div className="actions">
                  <button
                    className="btn primary"
                    onClick={() =>
                      navigate(
                        isTrainer
                          ? "appointments"
                          : isClient
                            ? "offers"
                            : "clients",
                      )
                    }
                  >
                    {isTrainer
                      ? "View my appointments"
                      : isClient
                        ? "Choose a training offer"
                        : "Manage clients"}
                    <ArrowRight size={15} />
                  </button>
                  <button
                    className="btn"
                    onClick={() => navigate("appointments")}
                  >
                    Session calendar
                  </button>
                </div>
              </div>
              <div className="pt-hero-summary">
                <span>
                  {isTrainer ? "ASSIGNED CLIENTS" : "AVAILABLE SESSIONS"}
                </span>
                <strong>{isTrainer ? d.clients.length : available}</strong>
                <small>
                  {isTrainer
                    ? "Personal attention. Shared progress."
                    : `${reserved} reserved · ${completed.length} completed`}
                </small>
              </div>
            </section>
            {needsOutcome.length > 0 && (
              <div className="pt-balance-notice">
                <Clock size={19} />
                <div>
                  <strong>
                    {needsOutcome.length} past appointment(s) awaiting an
                    outcome
                  </strong>
                  <p>
                    {isClient
                      ? "Your trainer needs to record completion or a cancellation before these reserved credits can be finalized."
                      : "Complete the training record or record a cancellation/no-show. Reserved credits remain held until an outcome is recorded."}
                  </p>
                </div>
                <button
                  className="text-btn"
                  onClick={() => navigate("appointments")}
                >
                  View appointments <ArrowRight size={13} />
                </button>
              </div>
            )}
            <div className="management-stats">
              <Metric
                icon={isClient ? Ticket : Users}
                label={isClient ? "Available sessions" : "Active clients"}
                value={
                  isClient
                    ? available
                    : d.clients.filter((c: any) => c.status === "Active").length
                }
              />
              <Metric
                icon={CalendarDays}
                label="Upcoming appointments"
                value={upcoming.length}
              />
              <Metric
                icon={isTrainer ? Dumbbell : CreditCard}
                label={
                  isTrainer
                    ? "Completed sessions"
                    : isClient
                      ? "Active packs"
                      : "Payments to review"
                }
                value={
                  isTrainer
                    ? completed.length
                    : isClient
                      ? paid.filter(
                          (o: any) =>
                            !o.balance.expired && o.balance.credits > 0,
                        ).length
                      : review.length
                }
              />
              <Metric
                icon={isAdmin ? Wallet : CheckCircle2}
                label={isAdmin ? "Training revenue" : "Sessions completed"}
                value={
                  isAdmin
                    ? fmt(paid.reduce((n: number, o: any) => n + o.amount, 0))
                    : completed.length
                }
              />
            </div>
            <div className="pt-journey">
              {[
                "Register & profile",
                "Choose an offer",
                "Verify payment",
                "Reserve training",
                "Complete & review",
              ].map((step, i) => (
                <div key={step}>
                  <span>0{i + 1}</span>
                  <strong>{step}</strong>
                  {i < 4 && <ArrowRight size={13} />}
                </div>
              ))}
            </div>
            {isClient && available <= 2 && (
              <div className="pt-balance-notice">
                <Ticket size={20} />
                <div>
                  <strong>
                    {available === 0
                      ? "Ready for your next chapter?"
                      : `${available} available session(s) left`}
                  </strong>
                  <p>
                    Purchase a new pack when you are ready. Packages do not
                    renew or charge automatically.
                  </p>
                </div>
                <button className="text-btn" onClick={() => navigate("offers")}>
                  Browse offers <ArrowRight size={14} />
                </button>
              </div>
            )}
            {isAdmin &&
              (!d.plans.length ||
                !d.clients.length ||
                !d.coaches.length ||
                !d.club.bank_account) && (
                <section className="panel pt-setup">
                  <h3>Set up Personal Training</h3>
                  <p>
                    Set your business up once, then run every client through a
                    clear training journey.
                  </p>
                  <div>
                    {[
                      ["offers", "Create a training offer", !!d.plans.length],
                      [
                        "trainers",
                        "Add your trainer profile",
                        !!d.coaches.length,
                      ],
                      ["clients", "Add and invite clients", !!d.clients.length],
                      [
                        "settings",
                        "Set bank details & access",
                        !!d.club.bank_account,
                      ],
                    ].map(([target, label, done]) => (
                      <button
                        key={String(target)}
                        onClick={() => navigate(String(target))}
                      >
                        <span>
                          {done ? <Check size={16} /> : <Plus size={16} />}
                        </span>
                        <strong>{String(label)}</strong>
                        <ArrowUpRight size={14} />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            <div className="management-two-col">
              <section className="panel">
                <div className="hub-section-heading">
                  <div>
                    <h3>
                      {isTrainer ? "Your training day" : "Upcoming training"}
                    </h3>
                    <p>
                      {d.today} · {d.club.timezone}
                    </p>
                  </div>
                  <button
                    className="text-btn"
                    onClick={() => navigate("appointments")}
                  >
                    View all
                  </button>
                </div>
                {appointments(upcoming.slice(0, 4))}
              </section>
              <section className="panel">
                <h3>{isTrainer ? "Client progress" : "Session packs"}</h3>
                {isTrainer ? (
                  completed.slice(0, 4).map((s: any) => (
                    <div className="pt-progress-item" key={s.id}>
                      <b>{name(s.client)}</b>
                      <p>{s.progress || "Session completed."}</p>
                    </div>
                  ))
                ) : paid.length ? (
                  paid.slice(0, 4).map((o: any) => (
                    <div className="pt-pack-summary" key={o.id}>
                      <div>
                        <strong>{o.planName}</strong>
                        <small>
                          {isClient ? `Valid through ${o.expires}` : o.name}
                        </small>
                      </div>
                      <b>
                        {o.balance.available}
                        <small>available</small>
                      </b>
                      <progress max={o.sessions} value={o.balance.credits} />
                      <small>
                        {o.balance.reserved} reserved · {o.balance.used} used
                        {o.balance.expired ? " · expired" : ""}
                      </small>
                    </div>
                  ))
                ) : (
                  <p className="hint">
                    Paid packs and remaining session credits appear here after
                    payment verification.
                  </p>
                )}
              </section>
            </div>
          </>
        ) : page === "clients" ? (
          <>
            <div className="hub-section-heading">
              <p>
                Client goals and session history. Invitations give clients their
                own portal.
              </p>
              {isAdmin && (
                <button
                  className="btn primary"
                  disabled={!canWrite}
                  onClick={() => open({ type: "client" })}
                >
                  <Plus size={15} />
                  Add client
                </button>
              )}
            </div>
            {search(["Active", "Archived"])}
            <div className="pt-client-grid">
              {d.clients
                .filter((c: any) => match(`${c.name} ${c.email}`, c.status))
                .map((c: any) => (
                  <article className="panel pt-client-card" key={c.id}>
                    <div className="table-identity">
                      <Avatar name={c.name} url={c.avatarUrl} />
                      <div>
                        <h3>{c.name}</h3>
                        <small>{c.email}</small>
                      </div>
                    </div>
                    <p>{c.goal || "Set a training goal with this client."}</p>
                    <div className="pt-client-meta">
                      <span>{c.level || "Beginner"}</span>
                      <span>{trainer(c.coachId)}</span>
                    </div>
                    <div className="actions">
                      <button
                        className="btn"
                        onClick={() =>
                          open({ type: "client-detail", record: c })
                        }
                      >
                        View client <ArrowUpRight size={14} />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            className="text-btn"
                            disabled={!canWrite}
                            onClick={() =>
                              open({
                                type: "client",
                                record: c,
                                returnTo: { type: "client-detail", record: c },
                              })
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="text-btn"
                            onClick={() =>
                              open({
                                type: "invite",
                                record: c,
                                inviteRole: "Member",
                                returnTo: { type: "client-detail", record: c },
                              })
                            }
                          >
                            Invite
                          </button>
                          <button
                            className="text-btn"
                            onClick={() =>
                              open({ type: "order", client: c.id })
                            }
                          >
                            Assign pack
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
            </div>
            {!d.clients.length &&
              empty(
                "No clients yet",
                "Add a client, record their goal, then send an invitation from Business & access.",
              )}
          </>
        ) : page === "trainers" ? (
          <>
            <div className="hub-section-heading">
              <p>
                Add yourself or another trainer. Send an invitation from
                Business & access for separate trainer access.
              </p>
              <button
                className="btn primary"
                disabled={!canWrite}
                onClick={() => open({ type: "trainer" })}
              >
                <Plus size={15} />
                Add trainer
              </button>
            </div>
            <div className="pt-client-grid">
              {d.coaches.map((c: any) => (
                <article className="panel" key={c.id}>
                  <div className="table-identity">
                    <Avatar name={c.name} />
                    <div>
                      <h3>{c.name}</h3>
                      <small>{c.email}</small>
                    </div>
                  </div>
                  <p className="hint" style={{ marginTop: 15 }}>
                    {c.description || "Personal trainer"}
                  </p>
                  <div className="actions">
                    <button
                      className="btn"
                      disabled={!canWrite}
                      onClick={() => open({ type: "trainer", record: c })}
                    >
                      <Pencil size={13} />
                      Edit trainer
                    </button>
                    <button
                      className="text-btn"
                      onClick={() =>
                        open({ type: "invite", record: c, inviteRole: "Coach" })
                      }
                    >
                      <Mail size={13} />
                      Invite trainer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : page === "offers" ? (
          packageCards()
        ) : page === "appointments" ? (
          <section className="panel">
            <div className="hub-section-heading">
              <div>
                <h3>
                  {isClient ? "Your appointments" : "Training appointments"}
                </h3>
                <p>
                  Booking reserves one paid credit. Completion uses it exactly
                  once.
                </p>
              </div>
              {!isTrainer && (
                <button
                  className="btn primary"
                  disabled={!canWrite}
                  onClick={() => open({ type: "booking" })}
                >
                  <Plus size={15} />
                  {isClient ? "Request a private session" : "Book a session"}
                </button>
              )}
            </div>
            {search([
              "Requested",
              "Scheduled",
              "Completed",
              "No-show",
              "Cancelled",
            ])}
            {appointments(
              d.appointments
                .filter((s: any) =>
                  match(
                    `${s.name} ${name(s.client)} ${s.date} ${trainer(s.coachId)}`,
                    s.status,
                  ),
                )
                .sort((a: any, b: any) =>
                  (b.date + b.time).localeCompare(a.date + a.time),
                ),
            )}
          </section>
        ) : page === "classes" ? (
          <>
            <div className="hub-section-heading">
              <div>
                <h3>Small-group training</h3>
                <p>
                  Each participant reserves one credit from their own
                  matching-duration pack.
                </p>
              </div>
              {isAdmin && (
                <button
                  className="btn primary"
                  disabled={!canWrite}
                  onClick={() => open({ type: "class" })}
                >
                  <Plus size={15} />
                  Publish a class
                </button>
              )}
            </div>
            <div className="branch-grid">
              {d.classes.map((c: any) => (
                <article className="panel pt-class-card" key={c.id}>
                  <span className="tag">{c.status}</span>
                  <h3>
                    <button
                      className="record-title-link"
                      onClick={() => open({ type: "class-detail", record: c })}
                    >
                      {c.name}
                      <ArrowUpRight size={14} />
                    </button>
                  </h3>
                  <p>{trainer(c.coachId)}</p>
                  <p>
                    <CalendarDays size={14} />
                    {c.date} · {c.time}–{c.endTime}
                  </p>
                  <p>{c.venue}</p>
                  <div className="pt-capacity">
                    <span>
                      {c.booked} / {c.capacity} reserved
                    </span>
                    <progress max={c.capacity} value={c.booked} />
                  </div>
                  <button
                    className="btn"
                    onClick={() => open({ type: "class-detail", record: c })}
                  >
                    View class <ArrowUpRight size={13} />
                  </button>
                  {!isTrainer && (
                    <button
                      className="btn primary"
                      disabled={
                        !canWrite ||
                        c.status !== "Scheduled" ||
                        c.booked >= c.capacity
                      }
                      onClick={() => open({ type: "booking", class: c })}
                    >
                      Reserve a place
                    </button>
                  )}
                  {isAdmin && c.status === "Scheduled" && (
                    <button
                      className="text-btn"
                      disabled={!canWrite}
                      onClick={() => open({ type: "cancel-class", record: c })}
                    >
                      Cancel class
                    </button>
                  )}
                </article>
              ))}
            </div>
            {!d.classes.length &&
              empty(
                "No group classes published",
                "Private appointments remain available. Publish a class when you want to train a small group.",
              )}
          </>
        ) : page === "payments" ? (
          <section className="panel">
            <div className="hub-section-heading">
              <div>
                <h3>Training payments</h3>
                <p>
                  Client payments go to this training business. Courvix
                  subscriptions are billed separately.
                </p>
              </div>
              {isAdmin && (
                <span className="tag">{review.length} awaiting review</span>
              )}
            </div>
            {search(["Pending", "Review", "Paid", "Rejected", "Cancelled"])}
            {orders(
              d.orders.filter((o: any) =>
                match(`${o.name} ${o.planName} ${o.reference}`, o.status),
              ),
            )}
          </section>
        ) : page === "credits" ? (
          <section className="panel">
            <div className="hub-section-heading">
              <div>
                <h3>Session credit ledger</h3>
                <p>
                  Purchases add credits. Completed or chargeable missed sessions
                  subtract one. Corrections append an entry.
                </p>
              </div>
              <ExportLink>Export my records</ExportLink>
            </div>
            <div className="management-table-wrap">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Event</th>
                    <th>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {d.credits.map((c: any) => (
                    <tr key={c.id}>
                      <td>{new Date(c.date).toLocaleDateString("en-GB")}</td>
                      <td>{name(c.client)}</td>
                      <td>{c.reason}</td>
                      <td
                        className={
                          c.delta > 0
                            ? "pt-credit-positive"
                            : "pt-credit-negative"
                        }
                      >
                        {c.delta > 0 ? "+" : ""}
                        {c.delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!d.credits.length &&
                empty(
                  "No session credits yet",
                  "A verified package purchase creates the first credit entry.",
                )}
            </div>
          </section>
        ) : page === "progress" ? (
          <section className="panel">
            <h3>Training progress</h3>
            <p className="hint">
              Progress notes are tied to completed sessions and visible only to
              the client and assigned trainers/admins.
            </p>
            {search()}
            {completed
              .filter((s: any) =>
                match(`${name(s.client)} ${s.progress} ${s.date}`),
              )
              .map((s: any) => (
                <article className="pt-progress-item" key={s.id}>
                  <div>
                    <b>{name(s.client)}</b>
                    <small>
                      {s.date} · {trainer(s.coachId)}
                    </small>
                  </div>
                  <p>
                    {s.progress ||
                      "Session completed. No additional progress note was recorded."}
                  </p>
                  <small>{s.note}</small>
                </article>
              ))}
            {!completed.length &&
              empty(
                "Progress starts with your first session",
                "Complete a scheduled session and record the outcome.",
              )}
          </section>
        ) : page === "followups" ? (
          <section className="panel">
            <div className="hub-section-heading">
              <div>
                <h3>Unpaid training orders</h3>
                <p>
                  Follow-ups stop after verified payment or cancellation.
                  Session packs never generate recurring club dues.
                </p>
              </div>
              {isAdmin && (
                <button
                  className="btn"
                  disabled={busy || d.readOnly}
                  onClick={() => reminderAction({ action: "run" })}
                >
                  Check due orders
                </button>
              )}
            </div>
            {isAdmin && (
              <form
                className="pt-followup-form"
                key={JSON.stringify(reminders?.preference)}
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void reminderAction({
                    action: "configure",
                    enabled: f.has("enabled"),
                    emailEnabled: f.has("emailEnabled"),
                    leadDays: Number(f.get("leadDays")),
                    intervalDays: Number(f.get("intervalDays")),
                  });
                }}
              >
                <label>
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={reminders?.preference.enabled}
                  />
                  Enable order follow-ups
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="emailEnabled"
                    defaultChecked={reminders?.preference.emailEnabled}
                  />
                  Email clients when a sender is configured
                </label>
                <label>
                  Days before due date
                  <input
                    type="number"
                    name="leadDays"
                    min={0}
                    max={14}
                    defaultValue={reminders?.preference.leadDays ?? 3}
                  />
                </label>
                <label>
                  Repeat every (days)
                  <input
                    type="number"
                    name="intervalDays"
                    min={1}
                    max={30}
                    defaultValue={reminders?.preference.intervalDays ?? 3}
                  />
                </label>
                <button className="btn primary" disabled={busy}>
                  Save follow-up rules
                </button>
              </form>
            )}
            {orders(
              d.orders.filter(
                (o: any) => !["Paid", "Cancelled"].includes(o.status),
              ),
            )}
            <h3 style={{ marginTop: 25 }}>Reminder history</h3>
            {reminders?.logs?.map((l: any) => (
              <div className="pt-progress-item" key={l.id}>
                <span className="tag">{l.delivery}</span>
                <p>{l.message}</p>
                <small>
                  {l.created_at}
                  {l.error ? " · " + l.error : ""}
                </small>
              </div>
            ))}
          </section>
        ) : page === "profile" ? (
          <AccountProfile demo={demo} onUpdated={refresh} />
        ) : page === "network" ? (
          <OrganizationHub demo={demo} onSwitch={onSwitch} product="Trainer" />
        ) : page === "settings" ? (
          <>
            <section className="panel pt-policy-panel">
              <h3>Training policies</h3>
              <p className="hint">
                These settings apply to new bookings. Existing appointments keep
                the cancellation and no-show policy recorded for them, including
                after a reschedule.
              </p>
              <form
                className="form"
                key={JSON.stringify(d.settings)}
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void act({
                    action: "settings",
                    ...Object.fromEntries(f),
                    noShowCharge: f.has("noShowCharge"),
                  });
                }}
              >
                <div className="profile-grid">
                  <label>
                    Free cancellation closes (hours before)
                    <input
                      name="cancelHours"
                      type="number"
                      min={0}
                      max={168}
                      required
                      defaultValue={d.settings.cancelHours}
                    />
                  </label>
                  <label className="pt-checkbox">
                    <input
                      type="checkbox"
                      name="noShowCharge"
                      defaultChecked={d.settings.noShowCharge}
                    />
                    Charge one credit for a no-show
                  </label>
                  <label>
                    Training opens
                    <input
                      name="openTime"
                      type="time"
                      required
                      defaultValue={d.settings.openTime}
                    />
                  </label>
                  <label>
                    Training closes
                    <input
                      name="closeTime"
                      type="time"
                      required
                      defaultValue={d.settings.closeTime}
                    />
                  </label>
                </div>
                <button className="btn primary" disabled={!canWrite}>
                  Save training policies
                </button>
              </form>
            </section>
            <ClubAccess onUpdated={refresh} />
            {d.legacyCount > 0 && (
              <section className="panel" style={{ marginTop: 20 }}>
                <h3>Earlier records are preserved</h3>
                <p className="hint">
                  {d.legacyCount} earlier membership invoice(s) remain in your
                  export. They do not grant training credits. New session packs
                  use this product’s own checkout.
                </p>
                <ExportLink>Export complete workspace records</ExportLink>
              </section>
            )}
          </>
        ) : page === "support" ? (
          <section className="panel">
            <h3>Ask Courvix for help</h3>
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                void act({
                  action: "support",
                  ...Object.fromEntries(new FormData(e.currentTarget)),
                });
              }}
            >
              <label>
                Subject
                <input name="name" required maxLength={150} />
              </label>
              <label>
                What do you need help with?
                <textarea name="description" required maxLength={2000} />
              </label>
              <button className="btn primary" disabled={!canWrite}>
                Send support request
              </button>
            </form>
            {d.support?.map((s: any) => (
              <article className="pt-progress-item" key={s.id}>
                <b>{s.name}</b>
                <p>{s.description}</p>
                <span className="tag">{s.status}</span>
                {s.response && (
                  <p>
                    <strong>Courvix:</strong> {s.response}
                  </p>
                )}
              </article>
            ))}
          </section>
        ) : null}
        {modal && (
          <div className="management-modal-backdrop" onClick={closeModal}>
            <section
              className="management-modal panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pt-dialog-title"
              onClick={(e) => e.stopPropagation()}
              onChangeCapture={(e) => {
                if ((e.target as HTMLElement).closest("form")) setDirty(true);
              }}
            >
              <div className="hub-section-heading">
                <h2 id="pt-dialog-title">
                  {
                    (
                      {
                        offer: "Training offer",
                        client: "Client profile",
                        trainer: modal.record?.id
                          ? "Edit trainer"
                          : "Add trainer",
                        "client-detail": "Client workspace",
                        "class-detail": "Class details",
                        invite: "Invite to this workspace",
                        order: "Choose a training offer",
                        booking: modal.class
                          ? "Reserve a class"
                          : "Book a private session",
                        class: modal.record?.id
                          ? "Edit small-group class"
                          : "Publish a small-group class",
                        payment: "Training payment",
                        appointment: "Appointment details",
                        complete: "Complete training",
                        reschedule: "Reschedule appointment",
                        cancel: "Cancel appointment",
                        "cancel-class": "Cancel this class",
                        correct: "Restore a session credit",
                      } as any
                    )[modal.type]
                  }
                </h2>
                <button className="btn" disabled={busy} onClick={closeModal}>
                  Close
                </button>
              </div>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              {modal.returnTo && (
                <button
                  className="text-btn record-back"
                  disabled={busy}
                  onClick={closeModal}
                >
                  <ChevronLeft size={14} />
                  Back to details
                </button>
              )}
              {notice && (
                <p className="access-success" role="status">
                  {notice}
                </p>
              )}
              {renderModal()}
              {dirty && (
                <div className="draft-status">
                  <span />
                  Unsaved changes · Your changes are saved only when you submit.
                </div>
              )}
              {discard && (
                <div className="draft-discard" role="alert">
                  <strong>Keep your changes?</strong>
                  <p>
                    You have unsaved edits. Continue editing, or discard this
                    draft.
                  </p>
                  <div className="actions">
                    <button
                      className="btn primary"
                      onClick={() => setDiscard(false)}
                    >
                      Keep editing
                    </button>
                    <button className="btn danger" onClick={finishClose}>
                      Discard changes
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </ManagementShell>
    </div>
  );
  function clientsSelect(
    defaultValue?: string,
    onChange?: (s: string) => void,
  ) {
    return isClient ? (
      <input type="hidden" name="client" value={d.session.member} />
    ) : (
      <label>
        Client
        <select
          name="client"
          defaultValue={
            onChange ? undefined : defaultValue || modal.client || ""
          }
          value={onChange ? bookingClient : undefined}
          onChange={
            onChange
              ? (e) => {
                  onChange(e.target.value);
                  setBookingOrder("");
                }
              : undefined
          }
          required
        >
          <option value="">Choose client</option>
          {d.clients
            .filter((c: any) => c.status === "Active")
            .map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </label>
    );
  }
  function coachSelect(value?: string) {
    return (
      <label>
        Trainer
        <select
          name="coachId"
          defaultValue={value || d.coaches[0]?.id}
          required
        >
          {d.coaches.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    );
  }
  function formSubmit(action: string, extra: any = {}) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void act({
        action,
        ...Object.fromEntries(new FormData(e.currentTarget)),
        ...extra,
      });
    };
  }
  function saveButton(label = "Save") {
    return (
      <button className="btn primary" disabled={!canWrite}>
        {busy ? "Saving…" : label}
      </button>
    );
  }
  function bookingEndTime() {
    if (!bookingOrder) return "";
    const duration =
      d.orders.find((o: any) => o.id === bookingOrder)?.duration || 60;
    const [h, m] = bookingStart.split(":").map(Number);
    const end = h * 60 + m + duration;
    return Number.isFinite(end) && end < 1440
      ? String(Math.floor(end / 60)).padStart(2, "0") +
          ":" +
          String(end % 60).padStart(2, "0")
      : "";
  }
  function renderModal() {
    const recordId = modal.record?.id;
    const source = ["client", "client-detail"].includes(modal.type)
      ? d.clients
      : modal.type === "trainer"
        ? d.coaches
        : ["class", "class-detail", "cancel-class"].includes(modal.type)
          ? d.classes
          : modal.type === "payment"
            ? d.orders
            : d.appointments;
    const r =
      source.find((item: any) => item.id === recordId) || modal.record || {};
    if (modal.type === "client-detail") {
      const sessions = d.appointments.filter((a: any) => a.client === r.id),
        packs = d.orders.filter((o: any) => o.client === r.id),
        completed = sessions.filter((a: any) => a.status === "Completed"),
        progress = sessions.filter((a: any) => a.progress),
        tab = modal.tab || "overview";
      return (
        <>
          <div className="record-person-heading">
            <Avatar name={r.name} url={r.avatarUrl} />
            <div>
              <h3>{r.name}</h3>
              <p>{r.email}</p>
            </div>
            {pill(r.status)}
          </div>
          <div className="record-context-actions">
            {isAdmin && (
              <>
                <button
                  className="btn primary"
                  disabled={!canWrite}
                  onClick={() =>
                    open({ type: "client", record: r, returnTo: modal })
                  }
                >
                  <Pencil size={14} />
                  Edit profile
                </button>
                <button
                  className="btn"
                  disabled={!canWrite || r.status !== "Active"}
                  onClick={() =>
                    open({
                      type: "invite",
                      record: r,
                      inviteRole: "Member",
                      returnTo: modal,
                    })
                  }
                >
                  <Mail size={14} />
                  Invite client
                </button>
                <button
                  className="btn"
                  disabled={!canWrite || r.status !== "Active"}
                  onClick={() =>
                    open({ type: "booking", client: r.id, returnTo: modal })
                  }
                >
                  <CalendarDays size={14} />
                  Book session
                </button>
                <button
                  className="text-btn"
                  disabled={!canWrite || r.status !== "Active"}
                  onClick={() =>
                    open({ type: "order", client: r.id, returnTo: modal })
                  }
                >
                  Assign pack <ArrowRight size={13} />
                </button>
              </>
            )}
          </div>
          <div
            className="record-tabs"
            role="group"
            aria-label="Client detail sections"
          >
            {[
              ["overview", "Overview"],
              ["appointments", "Appointments"],
              ...(!isTrainer ? [["packs", "Packs & payments"]] : []),
              ["progress", "Progress"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={tab === id}
                onClick={() => setModal({ ...modal, tab: id })}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "overview" ? (
            <>
              <div className="record-summary-grid">
                <div>
                  <span>Appointments</span>
                  <strong>{sessions.length}</strong>
                </div>
                <div>
                  <span>Completed</span>
                  <strong>{completed.length}</strong>
                </div>
                {!isTrainer && (
                  <div>
                    <span>Sessions available</span>
                    <strong>
                      {packs.reduce(
                        (n: number, o: any) => n + o.balance.available,
                        0,
                      )}
                    </strong>
                  </div>
                )}
              </div>
              <dl className="management-detail-grid">
                {[
                  ["Training goal", r.goal || "Not recorded"],
                  ["Assigned trainer", trainer(r.coachId)],
                  ["Experience", r.level || "Beginner"],
                  ["Client since", r.date],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="hint">
                This view links this client’s records. Account email changes
                require support so invitations and account access stay
                consistent.
              </p>
            </>
          ) : tab === "appointments" ? (
            appointments(sessions, modal)
          ) : tab === "packs" && !isTrainer ? (
            orders(packs, modal)
          ) : (
            <div>
              {progress.length
                ? progress.map((a: any) => (
                    <article className="pt-progress-item" key={a.id}>
                      <button
                        className="record-title-link"
                        onClick={() =>
                          open({
                            type: "appointment",
                            record: a,
                            returnTo: modal,
                          })
                        }
                      >
                        {a.date} · {a.name}
                        <ArrowUpRight size={13} />
                      </button>
                      <p>{a.progress}</p>
                      <small>{trainer(a.coachId)}</small>
                    </article>
                  ))
                : empty(
                    "No progress notes yet",
                    "Progress recorded after training will appear here.",
                  )}
            </div>
          )}
        </>
      );
    }
    if (modal.type === "class-detail") {
      const participants = d.appointments.filter(
          (a: any) => a.classId === r.id,
        ),
        upcoming =
          r.status === "Scheduled" &&
          r.date + " " + r.time > d.today + " " + localTime;
      return (
        <>
          <div className="pt-payment-head">
            {pill(r.status)}
            <h3>{r.name}</h3>
            <p>{trainer(r.coachId)}</p>
          </div>
          <dl className="management-detail-grid">
            {[
              ["Date", r.date],
              ["Time", r.time + "–" + r.endTime],
              ["Location", r.venue],
              ["Reserved places", r.booked + " / " + r.capacity],
              ["Time zone", d.club.timezone],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="record-context-actions">
            {isAdmin && (
              <button
                className="btn primary"
                disabled={!canWrite || !upcoming}
                onClick={() =>
                  open({ type: "class", record: r, returnTo: modal })
                }
              >
                <Pencil size={14} />
                Edit class
              </button>
            )}
            {!isTrainer && (
              <button
                className="btn"
                disabled={!canWrite || !upcoming || r.booked >= r.capacity}
                onClick={() =>
                  open({ type: "booking", class: r, returnTo: modal })
                }
              >
                Reserve a place
              </button>
            )}
            {isAdmin && (
              <button
                className="text-btn"
                disabled={!canWrite || !upcoming}
                onClick={() =>
                  open({ type: "cancel-class", record: r, returnTo: modal })
                }
              >
                Cancel class
              </button>
            )}
          </div>
          {isAdmin || isTrainer ? (
            <>
              <h4 className="record-section-label">Participant bookings</h4>
              {appointments(participants, modal)}
            </>
          ) : (
            <p className="hint">
              Participant identities stay private. Each place uses one available
              credit from a matching-duration package.
            </p>
          )}
        </>
      );
    }
    if (modal.type === "invite")
      return (
        <div className="record-invite">
          <div className="record-person-heading">
            <Avatar name={r.name} />
            <div>
              <h3>{r.name}</h3>
              <p>{r.email}</p>
            </div>
          </div>
          {inviteResult ? (
            <>
              <p className="access-success" role="status">
                {demo
                  ? "Simulated invitation created. Open the demo inbox to accept it."
                  : inviteResult.delivery === "Sent"
                    ? "Invitation submitted to the email provider."
                    : "Invitation created. Email delivery is not confirmed; share the link directly."}
              </p>
              <label>
                Single-use invitation link
                <input
                  className="record-invite-link"
                  readOnly
                  value={inviteResult.inviteUrl}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <button
                className="btn"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteResult.inviteUrl);
                    setNotice("Invitation link copied.");
                  } catch {
                    setError("Select and copy the invitation link manually.");
                  }
                }}
              >
                <Copy size={14} />
                Copy link
              </button>
            </>
          ) : (
            <>
              <p className="hint">
                Invite this person as a{" "}
                {modal.inviteRole === "Coach" ? "Trainer" : "Client"} using the
                email above. They must sign in with the matching ChatGPT
                account. The link is single-use and expires in seven days.
              </p>
              <button
                className="btn primary"
                disabled={!canWrite}
                onClick={async () => {
                  if (lock.current) return;
                  lock.current = true;
                  setBusy(true);
                  setError("");
                  try {
                    const result = await accessAction(
                      {
                        action: "invite",
                        role: modal.inviteRole,
                        email: r.email,
                        name: r.name,
                      },
                      request,
                    );
                    setInviteResult(result);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    lock.current = false;
                    setBusy(false);
                  }
                }}
              >
                <Mail size={14} />
                {busy ? "Creating invitation…" : "Create & send invitation"}
              </button>
              <p className="hint">
                Email delivery requires a configured sender. If an active
                invitation already exists, manage it in Business & access.
              </p>
            </>
          )}
        </div>
      );
    if (modal.type === "offer")
      return (
        <form className="form" onSubmit={formSubmit("save-plan", { id: r.id })}>
          <label>
            Offer name
            <input name="name" defaultValue={r.name} required maxLength={150} />
          </label>
          <div className="profile-grid">
            <label>
              Sessions included
              <input
                name="sessions"
                type="number"
                list="pt-pack-sizes"
                min={1}
                max={200}
                step={1}
                required
                defaultValue={r.sessions || 4}
              />
              <datalist id="pt-pack-sizes">
                {[1, 4, 8, 16].map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? "Per visit" : "Session pack"}
                  </option>
                ))}
              </datalist>
              <small className="hint">
                1 = per visit. Use 4, 8, 16 or a custom session count.
              </small>
            </label>
            <label>
              Price ({d.club.currency})
              <input
                name="amount"
                type="number"
                min="0.001"
                step="any"
                required
                defaultValue={r.amount}
              />
            </label>
            <label>
              Minutes per session
              <input
                name="duration"
                type="number"
                required
                min={15}
                max={240}
                defaultValue={r.duration || 60}
              />
            </label>
            <label>
              Validity after activation (days)
              <input
                name="validDays"
                type="number"
                min={1}
                max={730}
                required
                defaultValue={r.validDays || 30}
              />
            </label>
          </div>
          <label>
            What is included?
            <textarea
              name="description"
              maxLength={1000}
              defaultValue={r.description}
            />
          </label>
          <label>
            Status
            <select name="status" defaultValue={r.status || "Active"}>
              <option>Active</option>
              <option>Archived</option>
            </select>
          </label>
          <p className="hint">
            Changes apply to future purchases. Existing orders keep their
            original price, session count, duration and validity.
          </p>
          {saveButton("Save training offer")}
        </form>
      );
    if (modal.type === "client")
      return (
        <form
          className="form"
          onSubmit={formSubmit("save-client", { id: r.id })}
        >
          <label>
            Full name
            <input name="name" required defaultValue={r.name} maxLength={150} />
          </label>
          <label>
            Email for the client portal
            <input
              type="email"
              name="email"
              required
              readOnly={!!r.id}
              defaultValue={r.email}
            />
          </label>
          {coachSelect(r.coachId)}
          <label>
            Training goal
            <textarea name="goal" defaultValue={r.goal} maxLength={1000} />
          </label>
          <div className="profile-grid">
            <label>
              Experience level
              <select name="level" defaultValue={r.level || "Beginner"}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue={r.status || "Active"}>
                <option>Active</option>
                <option>Archived</option>
              </select>
            </label>
          </div>
          <p className="hint">
            Saving a client does not send an invitation. Use Business & access
            to invite this email to the client portal.
          </p>
          {saveButton("Save client")}
        </form>
      );
    if (modal.type === "trainer")
      return (
        <form
          className="form"
          onSubmit={formSubmit("save-trainer", { id: r.id })}
        >
          <label>
            Trainer name
            <input name="name" required defaultValue={r.name} maxLength={150} />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              required
              defaultValue={r.email}
              readOnly={!!r.id}
            />
          </label>
          <label>
            Specialty
            <select
              name="specialty"
              defaultValue={r.description || "Strength & conditioning"}
            >
              {r.description &&
                ![
                  "Strength & conditioning",
                  "General fitness",
                  "Mobility",
                  "Sport performance",
                  "Rehabilitation support",
                ].includes(r.description) && <option>{r.description}</option>}
              <option>Strength & conditioning</option>
              <option>General fitness</option>
              <option>Mobility</option>
              <option>Sport performance</option>
              <option>Rehabilitation support</option>
            </select>
          </label>
          <p className="hint">
            The invited email is kept unchanged to preserve account access.
            Update name and specialty here; manage permissions in Business &
            access.
          </p>
          {saveButton(r.id ? "Save trainer changes" : "Add trainer")}
        </form>
      );
    if (modal.type === "order")
      return (
        <form className="form" onSubmit={formSubmit("order")}>
          {clientsSelect()}
          <label>
            Training offer
            <select name="plan" required defaultValue={modal.plan?.id}>
              {d.plans
                .filter((p: any) => p.status === "Active")
                .map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.sessions} session(s) · {fmt(p.amount)} ·{" "}
                    {p.validDays} days
                  </option>
                ))}
            </select>
          </label>
          <div className="pt-info-note">
            Choose offer → transfer to the training business → submit your
            reference → admin verifies → session credits activate. No automatic
            recurring charges.
          </div>
          {saveButton("Create training order")}
        </form>
      );
    if (modal.type === "booking") {
      const cls = modal.class;
      const classDuration = cls
        ? Number(cls.endTime.slice(0, 2)) * 60 +
          Number(cls.endTime.slice(3)) -
          (Number(cls.time.slice(0, 2)) * 60 + Number(cls.time.slice(3)))
        : null;
      const eligiblePacks = paid.filter(
        (o: any) =>
          o.balance.available > 0 &&
          o.client === (isClient ? d.session.member : bookingClient) &&
          (!cls || o.duration === classDuration),
      );
      return (
        <form
          className="form"
          onSubmit={formSubmit("book", { classId: cls?.id })}
        >
          {clientsSelect(undefined, setBookingClient)}
          <label>
            Paid package
            <select
              name="order"
              required
              value={bookingOrder}
              disabled={!isClient && !bookingClient}
              onChange={(e) => setBookingOrder(e.target.value)}
            >
              <option value="">Choose a package with available sessions</option>
              {eligiblePacks.map((o: any) => (
                <option value={o.id} key={o.id}>
                  {isClient ? "" : o.name + " · "}
                  {o.planName} · {o.balance.available} available · {o.duration}{" "}
                  min · until {o.expires}
                </option>
              ))}
            </select>
          </label>
          {(isClient || bookingClient) && eligiblePacks.length === 0 && (
            <p className="hint">
              This client has no available paid pack
              {cls ? " matching the class duration" : ""}. Choose another client
              or activate a matching package first.
            </p>
          )}
          {bookingOrder && !cls && !bookingEndTime() && (
            <p className="error" role="alert">
              Choose a start time that lets this session finish on the same day
              within training hours.
            </p>
          )}
          {cls ? (
            <div className="pt-info-note">
              <b>{cls.name}</b>
              <p>
                {cls.date} · {cls.time}–{cls.endTime} · {cls.venue}
              </p>
              <p>
                {cls.booked}/{cls.capacity} places reserved
              </p>
            </div>
          ) : (
            <>
              {coachSelect()}
              <div className="profile-grid">
                <label>
                  Date
                  <input name="date" type="date" min={d.today} required />
                </label>
                <label>
                  Location
                  <input
                    name="venue"
                    defaultValue={d.club.location || "Training studio"}
                    required
                  />
                </label>
                <label>
                  Start
                  <input
                    name="time"
                    type="time"
                    required
                    value={bookingStart}
                    onChange={(e) => setBookingStart(e.target.value)}
                  />
                </label>
                <label>
                  End
                  <input
                    name="endTime"
                    type="time"
                    required
                    readOnly
                    value={bookingEndTime()}
                  />
                </label>
              </div>
            </>
          )}
          <p className="hint">
            One credit is reserved now and used after completion. The end time
            follows your selected package’s duration. Choose a start that ends
            within business hours. Private requests from clients require trainer
            confirmation.
          </p>
          <div className="pt-info-note">
            <b>Cancellation & missed sessions</b>
            <p>
              Free cancellation closes {d.settings.cancelHours} hours before
              training.{" "}
              {d.settings.noShowCharge
                ? "A no-show uses one session credit."
                : "A no-show releases the reserved credit."}{" "}
              Contact your trainer for late changes.
            </p>
          </div>
          {!paid.some((o: any) => o.balance.available > 0) && (
            <p className="error">
              No paid, unexpired package has available credits. Purchase and
              verify a package first.
            </p>
          )}
          {saveButton(
            cls
              ? "Reserve one place"
              : isClient
                ? "Request appointment"
                : "Book appointment",
          )}
        </form>
      );
    }
    if (modal.type === "class")
      return (
        <form
          className="form"
          onSubmit={formSubmit(r.id ? "update-class" : "create-class", {
            id: r.id,
          })}
        >
          <label>
            Class name
            <input name="name" required maxLength={150} defaultValue={r.name} />
          </label>
          {coachSelect(r.coachId)}
          <div className="profile-grid">
            <label>
              Date
              <input
                name="date"
                type="date"
                min={d.today}
                required
                defaultValue={r.date}
              />
            </label>
            <label>
              Capacity
              <input
                name="capacity"
                type="number"
                min={2}
                max={50}
                defaultValue={r.capacity || 4}
                required
              />
            </label>
            <label>
              Start
              <input
                name="time"
                type="time"
                defaultValue={r.time || "10:00"}
                required
              />
            </label>
            <label>
              End
              <input
                name="endTime"
                type="time"
                defaultValue={r.endTime || "11:00"}
                required
              />
            </label>
          </div>
          <label>
            Location
            <input
              name="venue"
              defaultValue={r.venue || d.club.location}
              required
            />
          </label>
          <p className="hint">
            Each participant needs their own paid pack covering the class
            duration. Overlapping trainer appointments are blocked. When
            editing, reserved bookings update together while their credit and
            policy stay unchanged. Coordinate schedule changes with
            participants; this form does not send a rescheduling email.
          </p>
          <p className="hint">
            Updating a reserved class updates participant appointments together.
            Credit balances and booking policies are preserved. Capacity,
            package validity and schedule conflicts are checked before saving.
          </p>
          {saveButton(r.id ? "Save class changes" : "Publish class")}
        </form>
      );
    if (modal.type === "payment")
      return (
        <>
          <div className="pt-payment-head">
            {pill(r.status)}
            <h3>{r.planName}</h3>
            <strong>{fmt(r.amount)}</strong>
            <p>
              {r.name} · {r.sessions} session(s) · {r.duration} min ·{" "}
              {r.validDays} validity days
            </p>
          </div>
          <dl className="management-detail-grid">
            {[
              ["Order reference", r.id],
              ["Due date", r.due],
              ["Transfer reference", r.reference],
              ["Submitted", r.submittedAt],
              ["Reviewed by", r.reviewedBy],
              ["Activated", r.paidAt],
              ["Expires", r.expires],
              ["Review note", r.reviewNote],
              ["Sender note", r.note],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "—"}</dd>
              </div>
            ))}
          </dl>
          {r.status === "Paid" ? (
            <div className="pt-info-note">
              {r.balance.available} available · {r.balance.reserved} reserved ·{" "}
              {r.balance.used} used
              {r.balance.expired ? " · This pack has expired." : ""}
            </div>
          ) : ["Pending", "Rejected"].includes(r.status) ? (
            <>
              <div className="pt-info-note">
                <b>Transfer directly to the training business</b>
                {d.club.bank_account ? (
                  <>
                    <p>
                      {d.club.bank_name} · {d.club.bank_account}
                    </p>
                    <p>Account holder: {d.club.bank_holder}</p>
                  </>
                ) : (
                  <p>
                    The owner has not configured bank details yet. Contact your
                    trainer.
                  </p>
                )}
              </div>
              <form
                className="form"
                onSubmit={formSubmit("submit-payment", { id: r.id })}
              >
                <label>
                  Bank transfer reference
                  <input
                    name="reference"
                    minLength={4}
                    maxLength={150}
                    required
                  />
                </label>
                <label>
                  Sender name / note
                  <input name="note" maxLength={1000} />
                </label>
                <p className="hint">
                  Submitting a reference does not mark the order as paid.
                  Credits activate only after the administrator verifies
                  receipt.
                </p>
                <button
                  className="btn primary"
                  disabled={!canWrite || !d.club.bank_account}
                >
                  Submit payment for review
                </button>
              </form>
              <button
                className="text-btn"
                disabled={!canWrite}
                onClick={() => void act({ action: "cancel-order", id: r.id })}
              >
                Cancel this unpaid order
              </button>
            </>
          ) : r.status === "Review" && isAdmin ? (
            <form
              className="form"
              onSubmit={formSubmit("review-payment", {
                id: r.id,
                decision: "approve",
              })}
            >
              <label>
                Review note
                <textarea name="note" maxLength={1000} />
              </label>
              <p className="hint">
                Verify the actual bank receipt, amount and reference before
                activating credits.
              </p>
              <div className="actions">
                {saveButton("Verify payment & activate sessions")}
                <button
                  type="button"
                  className="btn danger"
                  disabled={!canWrite}
                  onClick={(e) =>
                    void act({
                      action: "review-payment",
                      id: r.id,
                      decision: "reject",
                      note: new FormData(e.currentTarget.closest("form")!).get(
                        "note",
                      ),
                    })
                  }
                >
                  Reject with reason
                </button>
              </div>
            </form>
          ) : (
            <p className="hint">
              {r.status === "Review"
                ? "Your payment is waiting for administrator review."
                : "This order is closed."}
            </p>
          )}
        </>
      );
    if (modal.type === "appointment")
      return (
        <>
          <div className="pt-payment-head">
            {pill(r.status)}
            <h3>{r.name}</h3>
            <p>
              {name(r.client)} · {trainer(r.coachId)}
            </p>
          </div>
          <dl className="management-detail-grid">
            {[
              ["Date", r.date],
              ["Time", r.time + "–" + r.endTime],
              ["Time zone", d.club.timezone],
              ["Location", r.venue],
              ["Type", r.type],
              [
                "Credit status",
                r.charged
                  ? "Used"
                  : holdingStatus(r.status)
                    ? "Reserved"
                    : "Released / not charged",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="pt-info-note">
            <b>This booking’s policy</b>
            <p>
              Free cancellation until {(r.policy || d.settings).cancelHours}{" "}
              hours before training.{" "}
              {(r.policy || d.settings).noShowCharge
                ? "A no-show uses one credit."
                : "A no-show releases the reserved credit."}{" "}
              Future policy changes do not change these terms.
              {r.policy?.legacy &&
                " This older appointment keeps the policy captured when it was upgraded."}
            </p>
          </div>
          {r.progress && (
            <div className="pt-info-note">
              <b>Progress</b>
              <p>{r.progress}</p>
            </div>
          )}
          {r.note && <p>{r.note}</p>}
          <div className="actions">
            {(isAdmin || isTrainer) && r.status === "Requested" && (
              <button
                className="btn primary"
                disabled={!canWrite}
                onClick={() => void act({ action: "confirm", id: r.id })}
              >
                Confirm appointment
              </button>
            )}
            {(isAdmin || isTrainer) && r.status === "Scheduled" && (
              <>
                <button
                  className="btn primary"
                  disabled={!canWrite}
                  onClick={() =>
                    open({
                      type: "complete",
                      record: r,
                      returnTo: { type: "appointment", record: r },
                    })
                  }
                >
                  Complete session
                </button>
                <button
                  className="btn"
                  disabled={!canWrite}
                  onClick={() =>
                    open({
                      type: "complete",
                      record: r,
                      noShow: true,
                      returnTo: { type: "appointment", record: r },
                    })
                  }
                >
                  Mark no-show
                </button>
              </>
            )}
            {(isAdmin || isTrainer) &&
              holdingStatus(r.status) &&
              !r.classId && (
                <button
                  className="btn"
                  disabled={!canWrite}
                  onClick={() =>
                    open({
                      type: "reschedule",
                      record: r,
                      returnTo: { type: "appointment", record: r },
                    })
                  }
                >
                  Reschedule
                </button>
              )}
            {holdingStatus(r.status) && (
              <button
                className="btn"
                disabled={!canWrite}
                onClick={() =>
                  open({
                    type: "cancel",
                    record: r,
                    returnTo: { type: "appointment", record: r },
                  })
                }
              >
                Cancel appointment
              </button>
            )}
            {isAdmin && r.charged && (
              <button
                className="btn"
                disabled={!canWrite}
                onClick={() =>
                  open({
                    type: "correct",
                    record: r,
                    returnTo: { type: "appointment", record: r },
                  })
                }
              >
                Restore credit with correction
              </button>
            )}
          </div>
        </>
      );
    if (modal.type === "complete")
      return (
        <form
          className="form"
          onSubmit={formSubmit(modal.noShow ? "no-show" : "complete", {
            id: r.id,
          })}
        >
          <div className="pt-info-note">
            {modal.noShow
              ? `No-show policy for this booking: ${(r.policy || d.settings).noShowCharge ? "use one credit" : "release the reserved credit"}.`
              : "Completing training uses exactly one reserved session credit."}{" "}
            Training can only be closed after its scheduled end.
          </div>
          {!modal.noShow && (
            <label>
              Progress & next focus
              <textarea
                name="progress"
                maxLength={2000}
                placeholder="What improved, what to work on next, and any agreed follow-up."
              />
            </label>
          )}
          <label>
            Session note
            <textarea name="note" maxLength={1000} />
          </label>
          {saveButton(
            modal.noShow ? "Record no-show" : "Complete & use one session",
          )}
        </form>
      );
    if (modal.type === "reschedule")
      return (
        <form
          className="form"
          onSubmit={formSubmit("reschedule", { id: r.id })}
        >
          <label>
            Date
            <input
              name="date"
              type="date"
              min={d.today}
              required
              defaultValue={r.date}
            />
          </label>
          <div className="profile-grid">
            <label>
              Start
              <input name="time" type="time" required defaultValue={r.time} />
            </label>
            <label>
              End
              <input
                name="endTime"
                type="time"
                required
                defaultValue={r.endTime}
              />
            </label>
          </div>
          <p className="hint">
            The package validity, duration and trainer/client conflict checks
            still apply. No extra credit is used.
          </p>
          {saveButton("Save new appointment time")}
        </form>
      );
    if (["cancel", "cancel-class", "correct"].includes(modal.type))
      return (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void act({
              action:
                modal.type === "correct"
                  ? "correct-session"
                  : modal.type === "cancel-class"
                    ? "cancel-class"
                    : "cancel",
              id: r.id,
              note: f.get("note"),
              charge: f.has("charge"),
            });
          }}
        >
          <p className="hint">
            {modal.type === "correct"
              ? "The original ledger entry remains. A correction restores one session credit without moving or refunding money."
              : modal.type === "cancel-class"
                ? "All upcoming bookings in this class will be cancelled and reserved credits released."
                : `This booking allows free cancellation until ${(r.policy || d.settings).cancelHours} hours before training. Late cancellations require a reason from the trainer/admin.`}
          </p>
          <label>
            Reason
            <textarea
              name="note"
              required
              minLength={modal.type === "correct" ? 10 : 1}
              maxLength={1000}
            />
          </label>
          {modal.type === "cancel" && isAdmin && (
            <label className="pt-checkbox">
              <input type="checkbox" name="charge" />
              If inside the late-cancellation window, use one session credit
            </label>
          )}
          {saveButton(
            modal.type === "correct"
              ? "Restore one credit"
              : "Confirm cancellation",
          )}
        </form>
      );
    return null;
  }
}
function holdingStatus(status: string) {
  return ["Requested", "Scheduled"].includes(status);
}
