"use client";
import { useMemo, useState, useRef } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Layers,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  Target,
  Pencil,
  GraduationCap,
} from "lucide-react";
import { money, type DB, type Row } from "@/lib/courvix";
import type { Identity } from "@/lib/access-policy";
import { clubControlRoom, trainingControlRoom } from "@/lib/control-room";
import { Avatar } from "./account-profile";
import { PersonProfile } from "./person-profile";
import "./control-room.css";
type OpenRecord = (module: string, row: Row, edit?: boolean) => void;
function Section({
  title,
  hint,
  children,
  icon: Icon = Layers,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  icon?: any;
}) {
  return (
    <section className="control-section">
      <header>
        <span>
          <Icon size={17} />
          <h3>{title}</h3>
        </span>
        {hint && <p>{hint}</p>}
      </header>
      {children}
    </section>
  );
}
function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: any;
  hint: string;
  icon: any;
}) {
  return (
    <div className="control-stat">
      <div>
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="control-empty">
      <CheckCircle2 size={20} />
      <p>{text}</p>
    </div>
  );
}
function Records({
  rows,
  onOpen,
  sub,
  empty = "No related records yet.",
}: {
  rows: Row[];
  onOpen: (r: Row) => void;
  sub: (r: Row) => string;
  empty?: string;
}) {
  const [all, setAll] = useState(false);
  return rows.length ? (
    <>
      <div className="control-records">
        {(all ? rows : rows.slice(0, 5)).map((r) => (
          <button key={r.id} onClick={() => onOpen(r)}>
            <span>
              <b>{r.name || r.planName || "Recorded activity"}</b>
              <small>{sub(r)}</small>
            </span>
            <span className="control-row-status">
              {r.status}
              <ArrowUpRight size={13} />
            </span>
          </button>
        ))}
      </div>
      {rows.length > 5 && (
        <button
          className="text-btn control-show-all"
          onClick={() => setAll(!all)}
        >
          {all ? "Show fewer" : "Show all " + rows.length + " records"}
          <ChevronDown size={13} />
        </button>
      )}
    </>
  ) : (
    <Empty text={empty} />
  );
}
function Frame({
  training,
  name,
  today,
  onRefresh,
  children,
}: {
  training: boolean;
  name: string;
  today: string;
  onRefresh: () => Promise<any>;
  children: React.ReactNode;
}) {
  const [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="control-room">
      <div className="control-room-hero">
        <div>
          <span className="eyebrow">
            {training ? "PERSONAL TRAINING" : "CLUB MANAGEMENT"} / CONTROL ROOM
          </span>
          <h2>
            {training
              ? "Every client. Every next step."
              : "Your club. The full picture."}
          </h2>
          <p>
            {name} · Connected records, attention items and quick actions in one
            place.
          </p>
        </div>
        <div>
          <span>
            <Clock3 size={13} />
            {today} · All stored records
          </span>
          <button
            className="btn"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true);
              setError("");
              try {
                await onRefresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setRefreshing(false);
              }
            }}
          >
            {refreshing ? "Refreshing…" : "Refresh records"}
          </button>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {children}
      <p className="control-scope-note">
        <ShieldCheck size={14} />
        This page combines records already available to your role. Counts
        describe stored records; payment review is manual.
      </p>
    </div>
  );
}
function PersonPicker({
  people,
  selected,
  onSelect,
  query,
  setQuery,
  training,
}: {
  people: any[];
  selected: string;
  onSelect: (s: string) => void;
  query: string;
  setQuery: (s: string) => void;
  training: boolean;
}) {
  const visible = people.filter((p) =>
    (
      p.person.name +
      " " +
      p.person.email +
      " " +
      (p.team?.name || "") +
      " " +
      (p.coach?.name || "")
    )
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const [page, setPage] = useState(0);
  const current = Math.min(
    page,
    Math.max(0, Math.ceil(visible.length / 8) - 1),
  );
  return (
    <section className="control-roster">
      <div className="control-roster-heading">
        <div>
          <h3>{training ? "Client 360" : "Member 360"}</h3>
          <p>
            Select a person to see their connected records together below. No
            tab switching required.
          </p>
        </div>
        <label>
          <Search size={15} />
          <input
            aria-label={
              training ? "Search client overview" : "Search member overview"
            }
            placeholder="Search a name, team or trainer…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </label>
      </div>
      <div className="control-roster-table">
        <table>
          <thead>
            <tr>
              <th>{training ? "Client" : "Member"}</th>
              <th>{training ? "Trainer / goal" : "Team / coach"}</th>
              <th>{training ? "Completed" : "Attendance"}</th>
              <th>Next session</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.slice(current * 8, current * 8 + 8).map((p) => (
              <tr
                key={p.person.id}
                className={p.person.id === selected ? "selected" : ""}
              >
                <td>
                  <button
                    className="control-person-link"
                    onClick={() => onSelect(p.person.id)}
                  >
                    <Avatar name={p.person.name} url={p.person.avatarUrl} />
                    <span>
                      <b>{p.person.name}</b>
                      <small>{p.person.status}</small>
                    </span>
                  </button>
                </td>
                <td>
                  <b>{p.team?.name || p.coach?.name || "Not assigned"}</b>
                  <small>
                    {training
                      ? p.person.goal || "Goal not recorded"
                      : p.coach?.name || "Coach not assigned"}
                  </small>
                </td>
                <td>
                  {training
                    ? p.completed + " session(s)"
                    : p.attendance.length
                      ? p.present + " / " + p.attendance.length + " present"
                      : "No attendance yet"}
                </td>
                <td>
                  {p.upcoming[0]
                    ? p.upcoming[0].date + " · " + p.upcoming[0].time
                    : "Not scheduled"}
                </td>
                <td>
                  <button
                    className="text-btn"
                    onClick={() => onSelect(p.person.id)}
                  >
                    Open full overview <ArrowRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!visible.length && <Empty text="No people match this search." />}
      <footer>
        <span>
          {visible.length} {training ? "client(s)" : "member(s)"} · Page{" "}
          {current + 1} of {Math.max(1, Math.ceil(visible.length / 8))}
        </span>
        <div>
          <button
            className="btn"
            disabled={!current}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </button>
          <button
            className="btn"
            disabled={(current + 1) * 8 >= visible.length}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      </footer>
    </section>
  );
}
export function ClubControlRoom({
  data,
  identity,
  today,
  name,
  currency,
  onOpen,
  onNavigate,
  onRefresh,
}: {
  data: DB;
  identity: Identity;
  today: string;
  name: string;
  currency: string;
  onOpen: OpenRecord;
  onNavigate: (m: string) => void;
  onRefresh: () => Promise<any>;
}) {
  const room = useMemo(
      () => clubControlRoom(data, identity, today),
      [data, identity, today],
    ),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState("");
  const detail = useRef<HTMLDivElement>(null);
  const current =
    room.people.find((p) => p.person.id === selected) || room.people[0];
  const fmt = (n: number) => money(n, currency, "en-GB");
  function choose(id: string) {
    setSelected(id);
    requestAnimationFrame(() =>
      detail.current?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      }),
    );
  }
  return (
    <Frame training={false} name={name} today={today} onRefresh={onRefresh}>
      <div className="control-stats">
        <Stat
          label="Active members"
          value={room.people.filter((p) => p.person.status === "Active").length}
          hint={room.people.length + " member records"}
          icon={Users}
        />
        <Stat
          label="Upcoming training"
          value={room.upcoming.length}
          hint="Today and future dates"
          icon={CalendarDays}
        />
        <Stat
          label="Teams & coaches"
          value={room.teams.length + " / " + room.coaches.length}
          hint="Visible to your role"
          icon={GraduationCap}
        />
        {room.finance ? (
          <Stat
            label="Outstanding dues"
            value={fmt(room.finance.outstanding)}
            hint="All unpaid / review invoices"
            icon={Wallet}
          />
        ) : (
          <Stat
            label="Training programs"
            value={room.programs.length}
            hint="Assigned training context"
            icon={Target}
          />
        )}
      </div>
      <Section
        title="What needs attention"
        hint="Open the source record to review it or take the next action."
        icon={Activity}
      >
        <div className="control-attention">
          {room.finance?.review.map((r) => (
            <button key={r.id} onClick={() => onOpen("Invoices", r)}>
              <Wallet size={17} />
              <span>
                <b>Review {r.name}’s transfer</b>
                <small>{fmt(r.amount)} · Payment under review</small>
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
          {room.finance?.overdue.slice(0, 5).map((r) => (
            <button key={r.id} onClick={() => onOpen("Invoices", r)}>
              <Clock3 size={17} />
              <span>
                <b>{r.name} · overdue dues</b>
                <small>
                  Due {r.due} · {fmt(r.amount)}
                </small>
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
          {room.financial &&
            room.people
              .filter((p) => p.person.status === "Active" && !p.team)
              .slice(0, 4)
              .map((p) => (
                <button
                  key={p.person.id}
                  onClick={() => onOpen("Members", p.person, true)}
                >
                  <Users size={17} />
                  <span>
                    <b>Assign {p.person.name} to a team</b>
                    <small>Keep the roster and schedule connected.</small>
                  </span>
                  <ArrowRight size={15} />
                </button>
              ))}
          {!room.upcoming.length && (
            <button onClick={() => onNavigate("Schedule")}>
              <CalendarDays size={17} />
              <span>
                <b>Plan the next training session</b>
                <small>No upcoming sessions are recorded.</small>
              </span>
              <ArrowRight size={15} />
            </button>
          )}
          {!!room.upcoming.length &&
            !room.finance?.review.length &&
            !room.finance?.overdue.length &&
            room.people.every(
              (p) => p.team || p.person.status !== "Active",
            ) && (
              <Empty text="No attention items in these records. Review the operational sections below." />
            )}
        </div>
      </Section>
      <PersonPicker
        people={room.people}
        selected={current?.person.id || ""}
        onSelect={choose}
        query={query}
        setQuery={setQuery}
        training={false}
      />
      {current && (
        <div
          className="control-person-overview"
          ref={detail}
          key={current.person.id}
        >
          <div className="control-person-heading">
            <Avatar name={current.person.name} />
            <div>
              <span>MEMBER 360 / CONNECTED RECORDS</span>
              <h2>{current.person.name}</h2>
              <p>
                {current.person.email} · {current.team?.name || "No team"} ·{" "}
                {current.coach?.name || "No assigned coach"}
              </p>
            </div>
            {room.financial && (
              <button
                className="btn primary"
                onClick={() => onOpen("Members", current.person, true)}
              >
                <Pencil size={14} />
                Edit member
              </button>
            )}
          </div>
          <div className="control-detail-grid">
            <Section title="Schedule & training" icon={CalendarDays}>
              <Records
                rows={current.schedule}
                sub={(r) => r.date + " · " + r.time + " · " + r.venue}
                onOpen={(r) => onOpen("Schedule", r)}
              />
              <h4>Related programs</h4>
              <Records
                rows={current.programs}
                sub={(r) => r.objective || r.description || "Training program"}
                onOpen={(r) => onOpen("Training", r)}
              />
            </Section>
            <Section title="Attendance & competitions" icon={CheckCircle2}>
              <div className="control-mini-metrics">
                <span>
                  <b>{current.present}</b> present
                </span>
                <span>
                  <b>{current.attendance.length}</b> recorded
                </span>
              </div>
              <Records
                rows={current.attendance}
                sub={(r) => (r.date || "") + " · " + (r.status || "Recorded")}
                onOpen={(r) => onNavigate("Attendance")}
                empty="Attendance has not been recorded for this member."
              />
              <h4>Competition agenda</h4>
              <Records
                rows={current.competitions}
                sub={(r) =>
                  (r.date || "") + " · " + (r.venue || r.description || "")
                }
                onOpen={(r) => onOpen("Competitions", r)}
              />
            </Section>
            {current.finance && (
              <>
                <Section
                  title="Dues & invoices"
                  hint={
                    fmt(current.finance.outstanding) +
                    " outstanding · All stored periods"
                  }
                  icon={Wallet}
                >
                  <Records
                    rows={current.finance.invoices}
                    sub={(r) =>
                      (r.period || "") +
                      " · " +
                      fmt(r.amount) +
                      " · Due " +
                      (r.due || "—")
                    }
                    onOpen={(r) => onOpen("Invoices", r)}
                  />
                </Section>
                <Section
                  title="Recorded payments"
                  hint="Corrections remain in the ledger; these are not bank settlement reports."
                  icon={FileText}
                >
                  <Records
                    rows={current.finance.payments}
                    sub={(r) =>
                      fmt(r.amount) + " · " + (r.date || "").slice(0, 10)
                    }
                    onOpen={(r) => onOpen("Payments", r)}
                  />
                </Section>
              </>
            )}
            <Section
              title="Profile & contact details"
              hint="Profile access and editing follow your existing permissions."
              icon={Users}
            >
              <PersonProfile
                kind="Members"
                person={current.person}
                onUpdated={onRefresh}
              />
            </Section>
            <Section title="Guidance & announcements" icon={FileText}>
              <Records
                rows={current.announcements}
                sub={(r) => r.description || "Announcement"}
                onOpen={(r) => onOpen("Announcements", r)}
              />
              <h4>Club guidance</h4>
              <Records
                rows={current.documents}
                sub={(r) => r.description || "Club guide"}
                onOpen={(r) => onOpen("Documents", r)}
              />
            </Section>
          </div>
        </div>
      )}
      <div className="control-detail-grid">
        <Section title="Teams & coaches" icon={Users}>
          <Records
            rows={room.teams}
            sub={(r) =>
              (r.coach ||
                room.coaches.find((c) => c.id === r.coachId)?.name ||
                "Coach not assigned") +
              " · " +
              room.people.filter((p) => p.person.team === r.id).length +
              " member(s)"
            }
            onOpen={(r) => onOpen("Teams", r)}
          />
          <h4>Coaching staff</h4>
          <Records
            rows={room.coaches}
            sub={(r) => r.description || r.email || "Coach"}
            onOpen={(r) => onOpen("Coaches", r)}
          />
        </Section>
        <Section title="Workspace schedule & programs" icon={CalendarDays}>
          <Records
            rows={room.sessions}
            sub={(r) => r.date + " · " + r.time + " · " + r.venue}
            onOpen={(r) => onOpen("Schedule", r)}
          />
          <h4>Training programs</h4>
          <Records
            rows={room.programs}
            sub={(r) => r.objective || r.description || "Training"}
            onOpen={(r) => onOpen("Training", r)}
          />
        </Section>
        {room.financial && (
          <Section title="Membership plans" icon={FileText}>
            <Records
              rows={room.plans}
              sub={(r) =>
                money(r.amount, currency) +
                " · " +
                (r.benefits || r.description || "")
              }
              onOpen={(r) => onOpen("Membership", r)}
            />
          </Section>
        )}
        <Section title="Club operations" icon={Layers}>
          <div className="control-module-actions">
            {[
              ["Teams", room.teams.length],
              ["Coaches", room.coaches.length],
              ["Schedule", room.sessions.length],
              ["Training", room.programs.length],
              ["Competitions", room.competitions.length],
            ].map(([label, n]) => (
              <button
                key={String(label)}
                onClick={() => onNavigate(String(label))}
              >
                <span>{label}</span>
                <b>{n}</b>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
        </Section>
        {room.finance && (
          <Section
            title="Financial overview"
            hint="All stored records. Manual payment records; no automatic bank reconciliation."
            icon={Wallet}
          >
            <div className="control-finance-lines">
              <p>
                <span>Recorded net receipts</span>
                <b>{fmt(room.finance.receipts)}</b>
              </p>
              <p>
                <span>Recorded expenses</span>
                <b>{fmt(room.finance.expensesTotal)}</b>
              </p>
              <p>
                <span>Outstanding dues</span>
                <b>{fmt(room.finance.outstanding)}</b>
              </p>
            </div>
            <button className="text-btn" onClick={() => onNavigate("Reports")}>
              Open reports <ArrowUpRight size={14} />
            </button>
          </Section>
        )}
      </div>
    </Frame>
  );
}
export function TrainingControlRoom({
  view,
  onOpen,
  onNavigate,
  onRefresh,
}: {
  view: any;
  onOpen: (value: any) => void;
  onNavigate: (s: string) => void;
  onRefresh: () => Promise<any>;
}) {
  const room = useMemo(() => trainingControlRoom(view), [view]),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState("");
  const detail = useRef<HTMLDivElement>(null),
    current =
      room.people.find((p: any) => p.person.id === selected) || room.people[0];
  const fmt = (n: number) => money(n, view.club.currency, "en-GB");
  function choose(id: string) {
    setSelected(id);
    requestAnimationFrame(() =>
      detail.current?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      }),
    );
  }
  return (
    <Frame
      training
      name={view.club.name}
      today={view.today}
      onRefresh={onRefresh}
    >
      <div className="control-stats">
        <Stat
          label="Active clients"
          value={
            room.people.filter((p: any) => p.person.status === "Active").length
          }
          hint="Clients visible to your role"
          icon={Users}
        />
        <Stat
          label="Upcoming sessions"
          value={room.upcoming.length}
          hint="Requested and scheduled"
          icon={CalendarDays}
        />
        <Stat
          label="Awaiting confirmation"
          value={room.requested.length}
          hint="Private appointment requests"
          icon={Clock3}
        />
        {room.finance ? (
          <Stat
            label="Sessions available"
            value={room.finance.available}
            hint="Paid, unexpired, unreserved"
            icon={Activity}
          />
        ) : (
          <Stat
            label="Classes"
            value={room.classes.length}
            hint="Assigned class records"
            icon={Layers}
          />
        )}
      </div>
      <Section
        title="What needs attention"
        icon={Activity}
        hint="Review the connected record without searching through separate modules."
      >
        <div className="control-attention">
          {room.requested.map((r: Row) => (
            <button
              key={r.id}
              onClick={() => onOpen({ type: "appointment", record: r })}
            >
              <CalendarDays size={17} />
              <span>
                <b>
                  Confirm{" "}
                  {room.people.find((p: any) => p.person.id === r.client)
                    ?.person.name || "client"}
                  ’s request
                </b>
                <small>
                  {r.date} · {r.time} · {r.venue}
                </small>
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
          {room.needsOutcome.map((r: Row) => (
            <button
              key={r.id}
              onClick={() => onOpen({ type: "appointment", record: r })}
            >
              <CheckCircle2 size={17} />
              <span>
                <b>Record the outcome of {r.name}</b>
                <small>{r.date} · A session credit is still reserved.</small>
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
          {room.finance?.review.map((r: Row) => (
            <button
              key={r.id}
              onClick={() => onOpen({ type: "payment", record: r })}
            >
              <Wallet size={17} />
              <span>
                <b>Review {r.name}’s payment</b>
                <small>
                  {r.planName} · {fmt(r.amount)}
                </small>
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
          {room.finance?.expiring.map((r: Row) => (
            <button
              key={r.id}
              onClick={() => onOpen({ type: "payment", record: r })}
            >
              <Clock3 size={17} />
              <span>
                <b>{r.name} · pack expires soon</b>
                <small>
                  {r.expires} · {r.balance.available} sessions available
                </small>
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
          {!room.requested.length &&
            !room.needsOutcome.length &&
            !room.finance?.review.length &&
            !room.finance?.expiring.length && (
              <Empty text="No attention items in these records. Keep an eye on upcoming training below." />
            )}
        </div>
      </Section>
      <PersonPicker
        people={room.people}
        selected={current?.person.id || ""}
        onSelect={choose}
        query={query}
        setQuery={setQuery}
        training
      />
      {current && (
        <div
          className="control-person-overview"
          ref={detail}
          key={current.person.id}
        >
          <div className="control-person-heading">
            <Avatar name={current.person.name} url={current.person.avatarUrl} />
            <div>
              <span>CLIENT 360 / CONNECTED RECORDS</span>
              <h2>{current.person.name}</h2>
              <p>
                {current.person.email} ·{" "}
                {current.coach?.name || "Trainer not assigned"} ·{" "}
                {current.person.level || "Beginner"}
              </p>
            </div>
            <div className="actions">
              {room.financial && (
                <>
                  <button
                    className="btn primary"
                    onClick={() =>
                      onOpen({ type: "client", record: current.person })
                    }
                  >
                    <Pencil size={14} />
                    Edit client
                  </button>
                  <button
                    className="btn"
                    onClick={() =>
                      onOpen({ type: "booking", client: current.person.id })
                    }
                  >
                    Book session
                  </button>
                  <button
                    className="btn"
                    onClick={() =>
                      onOpen({ type: "order", client: current.person.id })
                    }
                  >
                    Assign pack
                  </button>
                  <button
                    className="btn"
                    onClick={() =>
                      onOpen({
                        type: "invite",
                        record: current.person,
                        inviteRole: "Member",
                      })
                    }
                  >
                    Invite
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="control-client-goal">
            <Target size={19} />
            <p>
              <b>Training goal</b>
              {current.person.goal || "Agree on a goal with this client."}
            </p>
          </div>
          <div className="control-detail-grid">
            <Section title="Appointments & outcomes" icon={CalendarDays}>
              <Records
                rows={current.appointments}
                sub={(r) => r.date + " · " + r.time + " · " + r.venue}
                onOpen={(r) => onOpen({ type: "appointment", record: r })}
              />
            </Section>
            <Section title="Progress & next focus" icon={Target}>
              {current.progress.length ? (
                current.progress.map((r: Row) => (
                  <article className="control-progress" key={r.id}>
                    <button
                      onClick={() => onOpen({ type: "appointment", record: r })}
                    >
                      {r.date} · {r.name}
                      <ArrowUpRight size={13} />
                    </button>
                    <p>{r.progress}</p>
                    {r.note && <small>{r.note}</small>}
                  </article>
                ))
              ) : (
                <Empty text="Progress recorded after training will appear here." />
              )}
            </Section>
            {current.finance && (
              <>
                <Section
                  title="Session packs & balances"
                  hint={
                    current.finance.available +
                    " available · " +
                    current.finance.reserved +
                    " reserved"
                  }
                  icon={Activity}
                >
                  <Records
                    rows={current.finance.orders}
                    sub={(r) =>
                      r.planName +
                      " · " +
                      (r.status === "Paid"
                        ? r.balance.available +
                          " available / " +
                          r.balance.reserved +
                          " reserved · until " +
                          r.expires
                        : "Not activated")
                    }
                    onOpen={(r) => onOpen({ type: "payment", record: r })}
                  />
                </Section>
                <Section
                  title="Client payment overview"
                  hint="Purchased terms and transfer review remain visible on each order."
                  icon={Wallet}
                >
                  <div className="control-finance-lines">
                    <p>
                      <span>Outstanding purchases</span>
                      <b>{fmt(current.finance.outstanding)}</b>
                    </p>
                    <p>
                      <span>Completed sessions</span>
                      <b>{current.completed}</b>
                    </p>
                  </div>
                  <Records
                    rows={current.finance.orders.filter(
                      (r: Row) => !["Paid", "Cancelled"].includes(r.status),
                    )}
                    sub={(r) => fmt(r.amount) + " · " + r.planName}
                    onOpen={(r) => onOpen({ type: "payment", record: r })}
                    empty="No unpaid orders for this client."
                  />
                </Section>
              </>
            )}
          </div>
        </div>
      )}
      <div className="control-detail-grid">
        {room.financial && (
          <Section title="Training offers" icon={FileText}>
            <Records
              rows={room.offers}
              sub={(r) =>
                r.sessions +
                " session(s) · " +
                r.duration +
                " min · " +
                r.validDays +
                " days · " +
                fmt(r.amount)
              }
              onOpen={(r) => onOpen({ type: "offer", record: r })}
            />
          </Section>
        )}
        <Section
          title="Current booking policies"
          hint="New bookings use these settings. Existing appointments keep their own recorded policy."
          icon={ShieldCheck}
        >
          <div className="control-finance-lines">
            <p>
              <span>Free cancellation notice</span>
              <b>{view.settings.cancelHours} hours</b>
            </p>
            <p>
              <span>No-show</span>
              <b>
                {view.settings.noShowCharge
                  ? "Use one credit"
                  : "Release reservation"}
              </b>
            </p>
            <p>
              <span>Training hours</span>
              <b>
                {view.settings.openTime}–{view.settings.closeTime}
              </b>
            </p>
          </div>
          {room.financial && (
            <button className="text-btn" onClick={() => onNavigate("settings")}>
              Manage policies <ArrowUpRight size={14} />
            </button>
          )}
        </Section>
        <Section title="Classes & capacity" icon={Layers}>
          <Records
            rows={room.classes}
            sub={(r) =>
              r.date +
              " · " +
              r.time +
              " · " +
              r.booked +
              " / " +
              r.capacity +
              " places"
            }
            onOpen={(r) => onOpen({ type: "class-detail", record: r })}
          />
        </Section>
        <Section
          title="Trainer workload"
          hint="Counts show appointments visible to your role, not full calendar availability."
          icon={GraduationCap}
        >
          <div className="control-module-actions">
            {room.coaches.map((c: Row) => (
              <button
                key={c.id}
                onClick={() =>
                  onNavigate(room.financial ? "trainers" : "appointments")
                }
              >
                <span>
                  {c.name}
                  <small>
                    {
                      room.appointments.filter((a: Row) => a.coachId === c.id)
                        .length
                    }{" "}
                    recorded appointments
                  </small>
                </span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
        </Section>
        {room.finance && (
          <Section
            title="Training business overview"
            hint="All stored orders; manual verification, no automatic bank settlement."
            icon={Wallet}
          >
            <div className="control-finance-lines">
              <p>
                <span>Verified training purchases</span>
                <b>{fmt(room.finance.receipts)}</b>
              </p>
              <p>
                <span>Outstanding purchases</span>
                <b>{fmt(room.finance.outstanding)}</b>
              </p>
            </div>
            <button className="text-btn" onClick={() => onNavigate("payments")}>
              Open all payments <ArrowUpRight size={14} />
            </button>
          </Section>
        )}
      </div>
    </Frame>
  );
}
