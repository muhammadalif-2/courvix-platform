"use client";
import { useModalKeyboard } from "../modal-keyboard";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ShieldCheck,
  LifeBuoy,
  Activity,
  User,
  Search,
  ArrowUpRight,
  Trophy,
  Check,
  Clock,
  AlertCircle,
  Globe,
  Download,
  X,
} from "lucide-react";
import { useAppRequest } from "../app-transport";
import { ManagementShell } from "../management-shell";
import AccountProfile, { Avatar } from "../account-profile";
import { Metric } from "../organization-hub";
import { usePreferences } from "../preferences";
import { money } from "@/lib/courvix";
import "../access.css";
export default function Operator({ demo = false }: { demo?: boolean } = {}) {
  const request = useAppRequest(),
    { t, locale } = usePreferences(),
    [d, setD] = useState<any>(null),
    [page, setPage] = useState("overview"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [selected, setSelected] = useState<any>(null),
    [pg, setPg] = useState(1);
  const lock = useRef(false);
  async function refresh() {
    const r = await request("/api/operator", { cache: "no-store" });
    const v: any = await r.json();
    if (!r.ok) throw Error(v.error);
    setD(v);
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
      const r = await request("/api/operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      });
      const v: any = await r.json();
      if (!r.ok) throw Error(v.error);
      await refresh();
      setSelected(null);
      setNotice(t("Changes saved."));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function navigate(p: string) {
    setPage(p);
    setQuery("");
    setFilter(p === "billing" ? "Review" : "All");
    setPg(1);
    setSelected(null);
    setError("");
  }
  useModalKeyboard(!!selected, () => setSelected(null), busy);
  const sum = d?.summary || {},
    nav = [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      {
        id: "billing",
        label: "Subscription reviews",
        icon: CreditCard,
        count: sum.review,
      },
      { id: "clubs", label: "Workspace directory", icon: Building2 },
      { id: "users", label: "Users", icon: Users },
      {
        id: "support",
        label: "Support",
        icon: LifeBuoy,
        count: d?.support?.filter((s: any) => s.status !== "Resolved").length,
      },
      { id: "activity", label: "Activity history", icon: Activity },
      {
        id: "readiness",
        label: "Launch & service readiness",
        icon: ShieldCheck,
      },
      { id: "profile", label: "My profile", icon: User },
    ];
  const title =
    page === "overview"
      ? "Courvix administration"
      : nav.find((n) => n.id === page)?.label || "Overview";
  const date = (v: string) =>
    v
      ? new Date(v).toLocaleString(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";
  const idr = (v: number) => money(v || 0, "IDR", locale);
  const leaderboard = [...(d?.clubs || [])].sort(
    (a, b) => b.activeMembers - a.activeMembers,
  );
  function tableRows(
    rows: any[],
    columns: { title: string; cell: (r: any) => React.ReactNode }[],
    key = "id",
  ) {
    const pages = Math.max(1, Math.ceil(rows.length / 12)),
      current = Math.min(pg, pages);
    return (
      <>
        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.title}>{t(c.title)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice((current - 1) * 12, current * 12).map((r) => (
                <tr key={r[key]}>
                  {columns.map((c) => (
                    <td key={c.title}>{c.cell(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="management-empty">
              <Search size={27} />
              <p>{t("No matching data.")}</p>
            </div>
          )}
        </div>
        <div className="table-pagination">
          <span>
            {rows.length} {t("Search results")}
          </span>
          <div>
            <button
              className="btn"
              disabled={current <= 1}
              onClick={() => setPg(current - 1)}
            >
              {t("Previous")}
            </button>
            <span>
              {current} / {pages}
            </span>
            <button
              className="btn"
              disabled={current >= pages}
              onClick={() => setPg(current + 1)}
            >
              {t("Next")}
            </button>
          </div>
        </div>
      </>
    );
  }
  function toolbar(statuses: string[] = []) {
    return (
      <div className="directory-toolbar">
        <label>
          <Search size={17} />
          <input
            aria-label={t("Search")}
            placeholder={t("Search name, email, or workspace…")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPg(1);
            }}
          />
        </label>
        {statuses.length > 0 && (
          <select
            aria-label={t("Status")}
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPg(1);
            }}
          >
            <option value="All">{t("All statuses")}</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </div>
    );
  }
  const matches = (s: string) => s.toLowerCase().includes(query.toLowerCase());
  return (
    <ManagementShell
      title={title}
      subtitle="Monitor growth, subscriptions, and service quality."
      nav={nav}
      active={page}
      onNavigate={navigate}
      platform
      demo={demo}
    >
      {error && (
        <p className="error" role="alert">
          {error}
          <button
            className="text-btn"
            disabled={busy}
            onClick={() => refresh().catch((e) => setError(e.message))}
          >
            {t("Try again")}
          </button>
        </p>
      )}
      {notice && (
        <p className="access-success" role="status">
          {notice}
        </p>
      )}
      {!d && !error && <p>{t("Loading…")}</p>}
      {d && (
        <>
          {page === "profile" ? (
            <AccountProfile demo={demo} />
          ) : page === "overview" ? (
            <>
              <section className="platform-hero">
                <div>
                  <span className="eyebrow">COURVIX COMMAND CENTER</span>
                  <h2>
                    Every club.
                    <br />
                    <span>One clear picture.</span>
                  </h2>
                  <p>
                    {t("Clubs & trainers")} · {d.clubs.length}{" "}
                    {t("Total workspaces").toLowerCase()}
                  </p>
                  <button
                    className="btn primary"
                    onClick={() => navigate("clubs")}
                  >
                    {t("Clubs & trainers directory")}
                    <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="platform-hero-aside">
                  <span className="live-indicator">
                    <span /> PLATFORM OVERVIEW
                  </span>
                  <div>
                    <strong>{sum.activeMembers || 0}</strong>
                    <span>{t("Active members")}</span>
                  </div>
                  <small>{t("Across all branches")}</small>
                </div>
              </section>
              <div className="management-stats">
                <Metric
                  icon={Building2}
                  label={t("Total workspaces")}
                  value={sum.clubs || 0}
                  note={`${d.clubs.filter((c: any) => c.workspace_type === "Trainer").length} private trainer`}
                />
                <Metric
                  icon={Users}
                  label={t("Total users")}
                  value={sum.users || 0}
                  note={`${sum.members || 0} ${t("Total members").toLowerCase()}`}
                />
                <Metric
                  icon={ShieldCheck}
                  label={t("Active subscriptions")}
                  value={sum.active || 0}
                  note={`${sum.trial || 0} trial · ${sum.expired || 0} expired`}
                />
                <Metric
                  icon={CreditCard}
                  label={t("Subscription revenue")}
                  value={idr(sum.revenue)}
                  note={t("Verified payments")}
                />
              </div>
              {(sum.review > 0 || sum.expired > 0) && (
                <div className="platform-attention">
                  <AlertCircle size={19} />
                  <div>
                    <strong>{t("Needs attention")}</strong>
                    <p>
                      {sum.review} {t("Awaiting review").toLowerCase()} ·{" "}
                      {sum.expired} expired
                    </p>
                  </div>
                  <button
                    className="text-btn"
                    onClick={() => navigate("billing")}
                  >
                    {t("View details")}
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              )}
              <div className="management-two-col">
                <section className="panel growth-panel">
                  <div className="hub-section-heading">
                    <div>
                      <h3>{t("Network growth")}</h3>
                      <p>{t("Total workspaces")} · 6 months</p>
                    </div>
                    <span className="tag">{sum.clubs || 0} total</span>
                  </div>
                  <div className="growth-chart">
                    {d.history.map((m: any) => {
                      const max = Math.max(
                        1,
                        ...d.history.map((h: any) => h.clubs),
                      );
                      return (
                        <div key={m.month}>
                          <span>{m.clubs}</span>
                          <i
                            style={{
                              height: Math.max(3, (m.clubs / max) * 140),
                            }}
                          />
                          <small>
                            {new Date(
                              m.month + "-01T12:00:00",
                            ).toLocaleDateString(locale, { month: "short" })}
                          </small>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section className="panel">
                  <div className="hub-section-heading">
                    <h3>{t("Sports distribution")}</h3>
                    <Globe size={18} />
                  </div>
                  <div className="sport-distribution">
                    {Array.from(new Set(d.clubs.map((c: any) => c.sport)))
                      .slice(0, 6)
                      .map((sport: any) => {
                        const n = d.clubs.filter(
                          (c: any) => c.sport === sport,
                        ).length;
                        return (
                          <div key={sport}>
                            <div>
                              <b>{sport}</b>
                              <span>{n}</span>
                            </div>
                            <i>
                              <span
                                style={{
                                  width:
                                    (n / Math.max(1, d.clubs.length)) * 100 +
                                    "%",
                                }}
                              />
                            </i>
                          </div>
                        );
                      })}
                    {!d.clubs.length && <p>{t("No data yet")}</p>}
                  </div>
                  <div className="run-rate">
                    <small>{t("Monthly recurring run rate")}</small>
                    <strong>{idr(sum.runRate)}</strong>
                    <p>
                      {t(
                        "Current active plan value, not cash already received.",
                      )}
                    </p>
                  </div>
                </section>
              </div>
              <section className="panel leaderboard-panel">
                <div className="hub-section-heading">
                  <div>
                    <span className="eyebrow">NETWORK LEADERBOARD</span>
                    <h3>
                      <Trophy size={20} />
                      {t("Workspace leaderboard")}
                    </h3>
                    <p>
                      {t(
                        "Ranked by active members; this does not measure sporting performance.",
                      )}
                    </p>
                  </div>
                  <button
                    className="text-btn"
                    onClick={() => navigate("clubs")}
                  >
                    {t("All")}
                    <ArrowUpRight size={15} />
                  </button>
                </div>
                {tableRows(leaderboard.slice(0, 5), [
                  {
                    title: "Clubs & trainers",
                    cell: (c) => (
                      <div className="table-identity">
                        <span className="ranking-number">
                          {leaderboard.indexOf(c) + 1}
                        </span>
                        <div>
                          <strong>{c.name}</strong>
                          <small>
                            {t(c.sport || "")} ·{" "}
                            {c.workspace_type === "Trainer"
                              ? "Personal Training"
                              : "Club Management"}
                          </small>
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "Active members",
                    cell: (c) => <strong>{c.activeMembers}</strong>,
                  },
                  { title: "Total members", cell: (c) => c.members },
                  {
                    title: "Status",
                    cell: (c) => (
                      <span
                        className={
                          "status-pill " + c.effectiveStatus.toLowerCase()
                        }
                      >
                        {c.effectiveStatus}
                      </span>
                    ),
                  },
                  {
                    title: "Actions",
                    cell: (c) => (
                      <button
                        className="text-btn"
                        onClick={() => setSelected({ type: "club", id: c.id })}
                      >
                        {t("View details")}
                        <ArrowUpRight size={14} />
                      </button>
                    ),
                  },
                ])}
              </section>
            </>
          ) : page === "billing" ? (
            <section className="panel">
              <div className="hub-section-heading">
                <div>
                  <h3>{t("Subscription reviews")}</h3>
                  <p>
                    {t(
                      "Verify only after funds arrive in Courvix’s bank account. Each club manages its member dues.",
                    )}
                  </p>
                </div>
                <span className="tag">{sum.review} review</span>
              </div>
              {toolbar(["Review", "Pending", "Paid", "Rejected", "Cancelled"])}
              {tableRows(
                d.billing.filter(
                  (b: any) =>
                    (filter === "All" || b.status === filter) &&
                    matches(`${b.club_name} ${b.reference} ${b.id} ${b.plan}`),
                ),
                [
                  {
                    title: "Clubs & trainers",
                    cell: (b) => (
                      <div>
                        <strong>{b.club_name}</strong>
                        <small className="table-subline">{b.plan}</small>
                      </div>
                    ),
                  },
                  { title: "Amount", cell: (b) => idr(b.amount) },
                  {
                    title: "Status",
                    cell: (b) => (
                      <span className={"status-pill " + b.status.toLowerCase()}>
                        {b.status}
                      </span>
                    ),
                  },
                  {
                    title: "Transfer reference",
                    cell: (b) => b.reference || "—",
                  },
                  { title: "Submitted", cell: (b) => date(b.created_at) },
                  {
                    title: "Actions",
                    cell: (b) => (
                      <button
                        className="text-btn"
                        onClick={() =>
                          setSelected({ type: "billing", id: b.id })
                        }
                      >
                        {t("Payment details")}
                        <ArrowUpRight size={14} />
                      </button>
                    ),
                  },
                ],
              )}
            </section>
          ) : page === "clubs" ? (
            <section className="panel">
              <h3>{t("Clubs & trainers directory")}</h3>
              {toolbar(["Active", "Trial", "Expired"])}
              {tableRows(
                d.clubs
                  .filter(
                    (c: any) =>
                      (filter === "All" || c.effectiveStatus === filter) &&
                      matches(
                        `${c.name} ${c.sport} ${c.country} ${c.owner.map((o: any) => o.email).join(" ")}`,
                      ),
                  )
                  .sort((a: any, b: any) => b.activeMembers - a.activeMembers),
                [
                  {
                    title: "Clubs & trainers",
                    cell: (c) => (
                      <div className="table-identity">
                        <span className="branch-symbol">
                          <Building2 size={20} />
                        </span>
                        <div>
                          <strong>{c.name}</strong>
                          <small>
                            {t(c.sport || "")} ·{" "}
                            {c.workspace_type === "Trainer"
                              ? "Personal Training"
                              : "Club Management"}
                          </small>
                        </div>
                      </div>
                    ),
                  },
                  { title: "Owner", cell: (c) => c.owner[0]?.email || "—" },
                  {
                    title: "Active members",
                    cell: (c) => <b>{c.activeMembers}</b>,
                  },
                  { title: "Users", cell: (c) => c.users },
                  { title: "Plan", cell: (c) => c.plan },
                  {
                    title: "Status",
                    cell: (c) => (
                      <span
                        className={
                          "status-pill " + c.effectiveStatus.toLowerCase()
                        }
                      >
                        {c.effectiveStatus}
                      </span>
                    ),
                  },
                  {
                    title: "Actions",
                    cell: (c) => (
                      <button
                        className="text-btn"
                        onClick={() => setSelected({ type: "club", id: c.id })}
                      >
                        {t("View details")}
                      </button>
                    ),
                  },
                ],
              )}
            </section>
          ) : page === "users" ? (
            <section className="panel">
              <h3>{t("User accounts")}</h3>
              <p className="hint">
                {t(
                  "Accounts that have signed in and their access. Club member profiles are counted separately.",
                )}
              </p>
              {toolbar(["Owner", "Admin", "Coach", "Member"])}
              {tableRows(
                d.users.filter(
                  (u: any) =>
                    (filter === "All" ||
                      u.memberships.some(
                        (m: any) => m.role === filter && m.active,
                      )) &&
                    matches(
                      `${u.name} ${u.email} ${u.memberships.map((m: any) => m.clubName).join(" ")}`,
                    ),
                ),
                [
                  {
                    title: "Users",
                    cell: (u) => (
                      <div className="table-identity">
                        <Avatar name={u.name} url={u.avatarUrl} />
                        <div>
                          <strong>{u.name}</strong>
                          <small>{u.email}</small>
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "Role",
                    cell: (u) => (
                      <div className="role-pills">
                        {u.memberships.map((m: any) => (
                          <span className="tag" key={m.id}>
                            {m.role}
                            {!m.active ? " · revoked" : ""}
                          </span>
                        ))}
                      </div>
                    ),
                  },
                  {
                    title: "Clubs & trainers",
                    cell: (u) =>
                      u.memberships
                        .filter((m: any) => m.active)
                        .map((m: any) => m.clubName)
                        .join(", ") || "—",
                  },
                  { title: "Created", cell: (u) => date(u.created_at) },
                  {
                    title: "Actions",
                    cell: (u) => (
                      <button
                        className="text-btn"
                        onClick={() => setSelected({ type: "user", id: u.id })}
                      >
                        {t("View details")}
                      </button>
                    ),
                  },
                ],
              )}
            </section>
          ) : page === "support" ? (
            <section className="panel">
              <h3>{t("Support")}</h3>
              {toolbar(["Open", "In progress", "Resolved"])}
              {!d.support.length && <p>{t("No support tickets.")}</p>}
              {d.support
                .filter(
                  (s: any) =>
                    (filter === "All" || s.status === filter) &&
                    matches(`${s.name} ${s.clubName} ${s.description}`),
                )
                .map((s: any) => (
                  <article className="support-ticket" key={s.id}>
                    <div>
                      <span className="tag">{s.status}</span>
                      <h3>{s.name}</h3>
                      <p>{s.description}</p>
                      <small>
                        {s.clubName} · {s.createdBy}
                      </small>
                    </div>
                    <form
                      className="form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void act({
                          action: "support",
                          id: s.id,
                          club: s.club,
                          ...Object.fromEntries(new FormData(e.currentTarget)),
                        });
                      }}
                    >
                      <label>
                        {t("Status")}
                        <select name="status" defaultValue={s.status}>
                          <option>Open</option>
                          <option>In progress</option>
                          <option>Resolved</option>
                        </select>
                      </label>
                      <label>
                        {t("Response")}
                        <textarea
                          name="response"
                          defaultValue={s.response}
                          maxLength={2000}
                        />
                      </label>
                      <button className="btn primary" disabled={busy}>
                        {t("Save response")}
                      </button>
                    </form>
                  </article>
                ))}
            </section>
          ) : page === "activity" ? (
            <section className="panel">
              <h3>{t("Recent activity")}</h3>
              {toolbar()}
              {tableRows(
                d.audit.filter((a: any) =>
                  matches(`${a.action} ${a.actor} ${a.club_name}`),
                ),
                [
                  { title: "Date", cell: (a) => date(a.created_at) },
                  { title: "Club", cell: (a) => a.club_name || a.club },
                  { title: "Users", cell: (a) => a.actor },
                  {
                    title: "Actions",
                    cell: (a) => (
                      <div>
                        <strong>{a.action}</strong>
                        <small className="table-subline">{a.detail}</small>
                      </div>
                    ),
                  },
                ],
              )}
            </section>
          ) : page === "readiness" ? (
            <section className="panel">
              <h3>{t("Service readiness")}</h3>
              <div className="service-readiness">
                {Object.entries(d.readiness).map(([key, ok]) => (
                  <div key={key}>
                    <span className={ok ? "ready-icon" : "blocked-icon"}>
                      {ok ? <Check size={20} /> : <AlertCircle size={20} />}
                    </span>
                    <div>
                      <b>
                        {t(
                          (
                            {
                              admin: "Courvix owner",
                              email: "Email delivery",
                              bank: "Subscription bank account",
                              support: "Support contact",
                              schedulerKey: "Reminder job authentication",
                            } as any
                          )[key],
                        )}
                      </b>
                      <p>{t(ok ? "Configured" : "Configuration required")}</p>
                    </div>
                    <span
                      className={"status-pill " + (ok ? "active" : "pending")}
                    >
                      {ok ? "Configured" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="hint">
                {t(
                  "Services are configured through hosting settings. Secret values are never displayed in the application.",
                )}
              </p>
              <div className="launch-card-header">
                <h3>Release acceptance · {d.release || "Current version"}</h3>
                <span>
                  {(d.launch || []).filter((g: any) => g.verified).length} /{" "}
                  {(d.launch || []).length} verified
                </span>
              </div>
              <p className="hint">
                Configuration is separate from successful real-world testing.
                Record evidence only after completing a check. Evidence applies
                to this release; new releases require renewed acceptance. Never
                include secrets or client records.
              </p>
              <div>
                {(d.launch || []).map((g: any) => (
                  <div className="service-launch-item" key={g.id}>
                    <ShieldCheck size={18} />
                    <div>
                      <h4>{g.title}</h4>
                      <p>{g.help}</p>
                      {g.note && (
                        <p>
                          <b>Evidence:</b> {g.note}
                          <br />
                          {date(g.checkedAt)} · {g.checkedBy}
                        </p>
                      )}
                      <button
                        className="text-btn"
                        onClick={() => setSelected({ type: "launch", gate: g })}
                      >
                        {g.note ? "Update evidence" : "Record evidence"}
                      </button>
                    </div>
                    <span
                      className={
                        "status-pill " + (g.verified ? "active" : "pending")
                      }
                    >
                      {g.verified
                        ? "Verified by operator"
                        : "Needs verification"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="launch-job-table">
                <h3>Scheduled reminder receipts</h3>
                <p>
                  A receipt confirms a completed call to the job endpoint. Check
                  the hosting schedule separately; no receipt or an old receipt
                  does not establish that scheduling is enabled.
                </p>
                {(d.jobRuns || []).length ? (
                  <div className="management-table-wrap">
                    <table className="management-table">
                      <thead>
                        <tr>
                          <th>Finished</th>
                          <th>Created</th>
                          <th>Sent</th>
                          <th>Blocked</th>
                          <th>Paused</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.jobRuns.map((j: any, i: number) => (
                          <tr key={i}>
                            <td>{date(j.at)}</td>
                            <td>{j.created}</td>
                            <td>{j.sent}</td>
                            <td>{j.blocked}</td>
                            <td>{j.paused}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="management-empty">
                    <p>No completed scheduled run recorded yet.</p>
                  </div>
                )}
                <div className="role-pills">
                  {(d.delivery || []).map((r: any) => (
                    <span className="status-pill" key={r.delivery}>
                      {r.delivery}: {r.count}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </>
      )}
      {selected?.type === "launch" && d && (
        <div
          className="management-modal-backdrop"
          role="presentation"
          onClick={() => !busy && setSelected(null)}
        >
          <section
            className="management-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="launch-evidence-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="management-modal-close"
              aria-label="Close"
              disabled={busy}
              onClick={() => setSelected(null)}
            >
              <X size={18} />
            </button>
            <h2 id="launch-evidence-title">{selected.gate.title}</h2>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <p className="hint">{selected.gate.help}</p>
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void act({
                  action: "launch-evidence",
                  gate: selected.gate.id,
                  verified: f.get("verified") === "yes",
                  note: f.get("note"),
                });
              }}
            >
              <label>
                Result
                <select
                  name="verified"
                  defaultValue={selected.gate.verified ? "yes" : "no"}
                >
                  <option value="no">Pending / needs another check</option>
                  <option value="yes">Verified with evidence</option>
                </select>
              </label>
              <label>
                Evidence or remaining issue
                <textarea
                  name="note"
                  minLength={20}
                  maxLength={600}
                  required
                  defaultValue={selected.gate.note}
                  placeholder="What was tested, when, the result and an internal reference. No credentials or customer details."
                />
              </label>
              <button className="btn primary" disabled={busy}>
                {busy ? "Saving…" : "Save acceptance record"}
              </button>
            </form>
          </section>
        </div>
      )}
      {selected && selected.type !== "launch" && d && (
        <div
          className="management-modal-backdrop"
          onClick={() => !busy && setSelected(null)}
        >
          <section
            className={
              "management-modal panel " +
              (selected.type === "user" ? "wide" : "")
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="operator-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hub-section-heading">
              <h2 id="operator-detail-title">
                {t(
                  selected.type === "billing"
                    ? "Payment details"
                    : selected.type === "club"
                      ? "Workspace details"
                      : "User details",
                )}
              </h2>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setSelected(null)}
              >
                {t("Close")}
              </button>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {selected.type === "user" ? (
              <AccountProfile userId={selected.id} demo={demo} />
            ) : selected.type === "billing" ? (
              (() => {
                const b = d.billing.find((b: any) => b.id === selected.id),
                  c = d.clubs.find((c: any) => c.id === b?.club);
                if (!b) return null;
                return (
                  <>
                    <span className={"status-pill " + b.status.toLowerCase()}>
                      {b.status}
                    </span>
                    <h3 className="detail-business-name">{b.club_name}</h3>
                    <strong className="finance-total">{idr(b.amount)}</strong>
                    <dl className="management-detail-grid">
                      {[
                        ["Workspace ID", b.club],
                        ["Reference number", b.id],
                        ["Plan", b.plan],
                        ["Owner", c?.owner[0]?.email],
                        ["Transfer reference", b.reference],
                        ["Submitted", date(b.created_at)],
                        ["Reviewer", b.reviewed_by],
                        ["Reviewed", date(b.reviewed_at)],
                        ["Notes", b.note],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt>{t(label)}</dt>
                          <dd>{value || "—"}</dd>
                        </div>
                      ))}
                    </dl>
                    {b.status === "Review" && (
                      <form
                        className="form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void act({
                            action: "review-subscription",
                            id: b.id,
                            decision: "approve",
                            ...Object.fromEntries(
                              new FormData(e.currentTarget),
                            ),
                          });
                        }}
                      >
                        <label>
                          {t("Review notes")}
                          <textarea name="note" maxLength={1000} />
                        </label>
                        <p className="hint">
                          {t(
                            "Match the amount and reference with your bank statement before approving.",
                          )}
                        </p>
                        <div className="actions">
                          <button className="btn primary" disabled={busy}>
                            {t("Approve payment")}
                          </button>
                          <button
                            className="btn danger"
                            type="button"
                            disabled={busy}
                            onClick={(e) => {
                              const note = String(
                                new FormData(
                                  e.currentTarget.closest("form")!,
                                ).get("note") || "",
                              );
                              if (!note.trim()) {
                                setError("Enter a reason for rejection.");
                                return;
                              }
                              void act({
                                action: "review-subscription",
                                id: b.id,
                                decision: "reject",
                                note,
                              });
                            }}
                          >
                            {t("Reject")}
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                );
              })()
            ) : (
              (() => {
                const c = d.clubs.find((c: any) => c.id === selected.id);
                if (!c) return null;
                return (
                  <>
                    <h3 className="detail-business-name">{c.name}</h3>
                    <span
                      className={
                        "status-pill " + c.effectiveStatus.toLowerCase()
                      }
                    >
                      {c.effectiveStatus}
                    </span>
                    <div className="management-stats compact">
                      <Metric
                        icon={Users}
                        label={t("Total members")}
                        value={c.members}
                      />
                      <Metric icon={User} label={t("Users")} value={c.users} />
                    </div>
                    <dl className="management-detail-grid">
                      {[
                        ["Workspace ID", c.id],
                        ["Business type", c.workspace_type],
                        ["Sport", c.sport],
                        ["Country", c.country],
                        ["Currency", c.currency],
                        ["Location", c.location],
                        ["Time zone", c.timezone],
                        [
                          "Owner",
                          c.owner
                            .map((o: any) => `${o.name} · ${o.email}`)
                            .join(", "),
                        ],
                        ["Plan", c.plan],
                        ["Created", date(c.created_at)],
                        ["Trial ends", date(c.trial_ends)],
                        ["Subscription ends", date(c.renew_at)],
                        ["Active members", c.activeMembers],
                        ["Coach", c.coaches],
                        ["Kelompok", c.teams],
                        ["Sessions", c.sessions],
                        [
                          "Dues collected",
                          money(c.collected, c.currency || "IDR", locale),
                        ],
                        [
                          "Outstanding payments",
                          money(c.outstanding, c.currency || "IDR", locale),
                        ],
                      ].map(([label, value]) => (
                        <div key={String(label)}>
                          <dt>{t(String(label))}</dt>
                          <dd>{value === 0 ? 0 : value || "—"}</dd>
                        </div>
                      ))}
                    </dl>
                    <button
                      className="btn"
                      onClick={() => {
                        setSelected(null);
                        navigate("billing");
                        setQuery(c.name);
                        setFilter("All");
                      }}
                    >
                      {t("Payment history")}
                      <ArrowUpRight size={15} />
                    </button>
                  </>
                );
              })()
            )}
          </section>
        </div>
      )}
    </ManagementShell>
  );
}
