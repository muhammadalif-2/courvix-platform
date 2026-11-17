"use client";
import { useModalKeyboard } from "./modal-keyboard";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Users,
  MapPin,
  ArrowUpRight,
  Plus,
  Layers,
  LayoutDashboard,
  User,
  Check,
  GraduationCap,
  Wallet,
  Activity,
} from "lucide-react";
import { useAppRequest } from "./app-transport";
import { usePreferences } from "./preferences";
import {
  SportSelect,
  CountrySelect,
  CurrencySelect,
  ZoneSelect,
} from "@/components/catalog-fields";
import { money } from "@/lib/courvix";
export default function OrganizationHub({
  onSwitch,
  demo = false,
  product,
}: {
  onSwitch?: (id: string) => Promise<void>;
  demo?: boolean;
  product?: "Club" | "Trainer";
}) {
  const request = useAppRequest(),
    { t, locale } = usePreferences(),
    [d, setD] = useState<any>(null),
    [selected, setSelected] = useState(""),
    [tab, setTab] = useState("overview"),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [form, setForm] = useState<"" | "org" | "branch" | "attach">("");
  const lock = useRef(false);
  useModalKeyboard(!!form, () => setForm(""), busy);
  async function refresh() {
    const r = await request("/api/organization");
    const v: any = await r.json();
    if (!r.ok) throw Error(v.error);
    if (product) {
      v.clubs = v.clubs.filter((c: any) => c.workspace_type === product);
      v.organizations = v.organizations.filter((o: any) => o.kind === product);
    }
    setD(v);
    setSelected((old) =>
      v.organizations.some((o: any) => o.id === old)
        ? old
        : v.organizations[0]?.id || "",
    );
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  async function act(path: string, b: any) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      });
      const v: any = await r.json();
      if (!r.ok) throw Error(v.error);
      await refresh();
      if (b.action === "register" && v.club && onSwitch) await onSwitch(v.club);
      if (b.action === "create" && v.id) setSelected(v.id);
      setForm("");
      setNotice(t("Changes saved."));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function open(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (onSwitch) await onSwitch(id);
      else {
        const r = await request("/api/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "switch", club: id }),
        });
        const b: any = await r.json();
        if (!r.ok) throw Error(b.error);
        location.assign("/dashboard");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!d)
    return (
      <div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : (
          <p>{t("Loading…")}</p>
        )}
        <button
          className="btn"
          onClick={() => refresh().catch((e) => setError(e.message))}
        >
          {t("Try again")}
        </button>
      </div>
    );
  const org = d.organizations.find((o: any) => o.id === selected),
    branches = d.clubs.filter(
      (c: any) => c.organization_id === selected && selected,
    ),
    shown = branches.filter((c: any) =>
      `${c.name} ${c.location} ${t(c.sport || "")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
    stats = d.stats.filter((s: any) =>
      branches.some((c: any) => c.id === s.club),
    );
  const totals = stats.reduce(
    (a: any, s: any) => ({
      members: a.members + s.activeMembers,
      sessions: a.sessions + s.sessions,
      coaches: a.coaches + s.coaches,
    }),
    { members: 0, sessions: 0, coaches: 0 },
  );
  const amounts: Record<string, { outstanding: number; collected: number }> =
    {};
  for (const c of branches) {
    const s = stats.find((s: any) => s.club === c.id);
    const curr = c.currency || "IDR";
    amounts[curr] ||= { outstanding: 0, collected: 0 };
    amounts[curr].outstanding += s?.outstanding || 0;
    amounts[curr].collected += s?.collected || 0;
  }
  const unlinked = d.clubs.filter((c: any) => !c.organization_id);
  return (
    <div className="hub-page">
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
      <div className="hub-toolbar">
        <label>
          <span>{t("Organization name")}</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {!d.organizations.length && <option value="">—</option>}
            {d.organizations.map((o: any) => (
              <option value={o.id} key={o.id}>
                {o.name} ·{" "}
                {o.kind === "Trainer" ? t("Private trainer") : t("Club")}
              </option>
            ))}
          </select>
        </label>
        <div className="actions">
          <button className="btn" onClick={() => setForm("org")}>
            <Plus size={16} />
            {t("Create headquarters")}
          </button>
          {org && (
            <button className="btn primary" onClick={() => setForm("branch")}>
              <Plus size={16} />
              {t("Add branch / location")}
            </button>
          )}
        </div>
      </div>
      <div className="hub-hero">
        <div>
          <span className="eyebrow">
            {org?.kind === "Trainer"
              ? "PRIVATE TRAINING NETWORK"
              : "CLUB NETWORK"}
          </span>
          <h2>{org?.name || t("Headquarters")}</h2>
          <p>{t("Your entire network, in one place.")}</p>
          <span className="hub-hero-meta">
            <MapPin size={14} />
            {branches.length} {t("Branches & locations").toLowerCase()}
            <span>·</span>
            {org?.kind === "Trainer" ? t("Private trainer") : t("Club")}
          </span>
        </div>
        <div className="hub-hero-art">
          <Building2 size={76} strokeWidth={1} />
          <span>
            ONE NETWORK.
            <br />
            EVERY POSSIBILITY.
          </span>
        </div>
      </div>
      <div className="management-stats">
        <Metric
          icon={Building2}
          label={t("Branch count")}
          value={branches.length}
        />
        <Metric
          icon={Users}
          label={t("Active members")}
          value={totals.members}
        />
        <Metric
          icon={GraduationCap}
          label={t("Coach")}
          value={totals.coaches}
        />
        <Metric icon={Activity} label={t("Sessions")} value={totals.sessions} />
      </div>
      <div className="management-tabs">
        <button
          className={tab === "overview" ? "active" : ""}
          onClick={() => setTab("overview")}
        >
          {t("Overview")}
        </button>
        <button
          className={tab === "locations" ? "active" : ""}
          onClick={() => setTab("locations")}
        >
          {t("Branches & locations")}
        </button>
        <button
          className={tab === "finance" ? "active" : ""}
          onClick={() => setTab("finance")}
        >
          {t("Finance")}
        </button>
        {org && (
          <button className="link-tab" onClick={() => setForm("attach")}>
            {t("Link an existing workspace")}
            <ArrowUpRight size={13} />
          </button>
        )}
      </div>
      {tab === "finance" ? (
        <div className="management-two-col">
          {Object.entries(amounts).map(([currency, a]) => (
            <section className="panel" key={currency}>
              <span className="eyebrow">{currency}</span>
              <h3>{t("Dues collected")}</h3>
              <strong className="finance-total">
                {money(a.collected, currency, locale)}
              </strong>
              <p>
                {t("Outstanding payments")}:{" "}
                {money(a.outstanding, currency, locale)}
              </p>
              <p className="hint">
                {t("Does not change amounts or convert balances.")}
              </p>
            </section>
          ))}
        </div>
      ) : (
        <>
          <div className="hub-section-heading">
            <div>
              <h3>
                {t(
                  tab === "overview"
                    ? "Operational overview"
                    : "Branches & locations",
                )}
              </h3>
              <p>
                {t("Each branch has separate access, invoices and records.")}
              </p>
            </div>
            <input
              type="search"
              aria-label={t("Search")}
              placeholder={t("Search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {!shown.length ? (
            <div className="management-empty">
              <Building2 size={35} />
              <h3>{t(branches.length ? "No results" : "No branches yet")}</h3>
              <p>
                {t("Add your first location to start managing your network.")}
              </p>
              {org && (
                <button
                  className="btn primary"
                  onClick={() => setForm("branch")}
                >
                  {t("Add branch / location")}
                </button>
              )}
            </div>
          ) : (
            <div className="branch-grid">
              {shown.map((c: any, i: number) => {
                const s = stats.find((s: any) => s.club === c.id) || {};
                return (
                  <article className="panel branch-card" key={c.id}>
                    <div className="branch-card-top">
                      <span className={"branch-symbol variant-" + (i % 3)}>
                        {c.workspace_type === "Trainer" ? (
                          <GraduationCap size={24} />
                        ) : (
                          <Building2 size={24} />
                        )}
                      </span>
                      <span className="tag">{c.status}</span>
                    </div>
                    <small>
                      {c.workspace_type === "Trainer"
                        ? t("Private trainer")
                        : t("Club")}{" "}
                      · {t(c.sport || "")}
                    </small>
                    <h3>{c.name}</h3>
                    <p>
                      <MapPin size={14} />
                      {c.location || c.timezone} · {c.country || "ID"}
                    </p>
                    <div className="branch-card-stats">
                      <div>
                        <strong>{s.activeMembers || 0}</strong>
                        <small>{t("Active members")}</small>
                      </div>
                      <div>
                        <strong>{s.sessions || 0}</strong>
                        <small>{t("Sessions")}</small>
                      </div>
                      <div>
                        <strong>
                          {s.attendance === null
                            ? "—"
                            : (s.attendance || 0) + "%"}
                        </strong>
                        <small>{t("Attendance")}</small>
                      </div>
                    </div>
                    <button
                      className="branch-open"
                      disabled={busy}
                      onClick={() => void open(c.id)}
                    >
                      {t("Open workspace")}
                      <ArrowUpRight size={16} />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
      <p className="hub-permission-note">
        <ShieldNote />
        {t("Cross-branch data is available only to the organization owner.")}
      </p>
      {form && (
        <div
          className="management-modal-backdrop"
          onClick={() => !busy && setForm("")}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="hub-form-title"
            className="management-modal panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hub-section-heading">
              <h2 id="hub-form-title">
                {t(
                  form === "org"
                    ? "Create headquarters"
                    : form === "branch"
                      ? "Add branch / location"
                      : "Link an existing workspace",
                )}
              </h2>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setForm("")}
              >
                {t("Close")}
              </button>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                void act(
                  form === "branch" ? "/api/access" : "/api/organization",
                  {
                    ...f,
                    ...(form === "org" && product ? { kind: product } : {}),
                    organizationId: selected,
                    action:
                      form === "org"
                        ? "create"
                        : form === "branch"
                          ? "register"
                          : "attach",
                    terms: true,
                    plan: "Starter",
                  },
                );
              }}
            >
              {form === "org" ? (
                <>
                  <label>
                    {t("Organization name")}
                    <input name="name" required maxLength={150} />
                  </label>
                  <input type="hidden" name="kind" value={product || "Club"} />
                  <label>
                    {t("Business type")}
                    <select name="kind" value={product} disabled={!!product}>
                      <option value="Club">{t("Club")}</option>
                      <option value="Trainer">{t("Private trainer")}</option>
                    </select>
                  </label>
                </>
              ) : form === "attach" ? (
                <>
                  <label>
                    {t("Choose a branch")}
                    <select name="club" required>
                      <option value="">—</option>
                      {unlinked.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="hint">
                    {t(
                      !unlinked.length
                        ? "No other workspaces available to link."
                        : "Linked branches cannot be moved from this page.",
                    )}
                  </p>
                </>
              ) : (
                <>
                  <input
                    type="hidden"
                    name="workspaceType"
                    value={org?.kind || "Club"}
                  />
                  <label>
                    {t("Branch / business name")}
                    <input name="clubName" required maxLength={150} />
                  </label>
                  <label>
                    {t("Address / area")}
                    <input name="location" required maxLength={150} />
                  </label>
                  <div className="profile-grid">
                    <label>
                      {t("Sport")}
                      <SportSelect />
                    </label>
                    <label>
                      {t("Country")}
                      <CountrySelect />
                    </label>
                    <label>
                      {t("Currency")}
                      <CurrencySelect />
                    </label>

                    <label>
                      {t("Time zone")}
                      <ZoneSelect />
                    </label>
                    <label>
                      {t("Group terminology")}
                      <select
                        name="groupLabel"
                        defaultValue={org?.kind === "Trainer" ? "Kelas" : "Tim"}
                      >
                        <option>{"Team"}</option>
                        <option>{"Class"}</option>
                        <option>{"Groups"}</option>
                        <option>Private</option>
                      </select>
                    </label>
                  </div>
                  <p className="hint">
                    {t(
                      "Each branch uses its own Courvix plan. Headquarters has no additional charge.",
                    )}{" "}
                    Trial 14 hari.
                  </p>
                  <p className="hint">
                    {t("Does not change amounts or convert balances.")}
                  </p>
                </>
              )}
              <button
                className="btn primary"
                disabled={busy || (form === "attach" && !unlinked.length)}
              >
                {t(
                  busy
                    ? "Saving…"
                    : form === "attach"
                      ? "Link"
                      : form === "org"
                        ? "Create headquarters"
                        : "Create branch",
                )}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
function ShieldNote() {
  return <Check size={15} />;
}
export function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: any;
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <article className="management-metric">
      <div>
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}
