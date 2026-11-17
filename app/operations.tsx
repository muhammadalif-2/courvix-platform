"use client";
import { T } from "./preferences";
import { useState } from "react";
import {
  Users,
  ArrowUpRight,
  Plus,
  CalendarDays,
  MapPin,
  Clock,
  GraduationCap,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePreferences } from "./preferences";
import { type Row, money as formatMoney } from "@/lib/courvix";

export function TeamsView({
  teams,
  members,
  canEdit,
  create,
  open,
}: {
  teams: Row[];
  members: Row[];
  canEdit: boolean;
  create: () => void;
  open: (row: Row) => void;
}) {
  return (
    <>
      <div className="toolbar">
        <p className="hint">
          {teams.length}
          <T>{"groups · Built around your sport and your people."}</T>
        </p>
        {canEdit && (
          <button className="btn primary" onClick={create}>
            <Plus size={16} />
            <T>{"Create team"}</T>
          </button>
        )}
      </div>
      <div className="team-grid">
        {teams.map((team, i) => (
          <article className="panel team-card" key={team.id}>
            <div className="team-card-top">
              <span className={"team-symbol team-" + (i % 3)}>
                <Users size={25} />
              </span>
              <span className="tag">
                <T>{team.sport || ""}</T>
              </span>
            </div>
            <h2>{team.name}</h2>
            <p>
              <GraduationCap size={15} />
              {team.coach || "No coach assigned"}
            </p>
            <div className="roster-avatars">
              {members
                .filter((m) => m.team === team.id)
                .slice(0, 4)
                .map((m) => (
                  <span className="avatar" key={m.id}>
                    {m.name
                      .split(" ")
                      .slice(0, 2)
                      .map((s: string) => s[0])
                      .join("")}
                  </span>
                ))}
              <small>
                {members.filter((m) => m.team === team.id).length}
                <T>{"members"}</T>
              </small>
            </div>
            <button className="text-btn" onClick={() => open(team)}>
              <T>{"Open team workspace "}</T>
              <ArrowUpRight size={16} />
            </button>
          </article>
        ))}
      </div>
      {!teams.length && (
        <div className="empty">
          <Users />
          <h3>
            <T>{"No groups yet"}</T>
          </h3>
          <p>
            <T>{"Create your first group to organize members."}</T>
          </p>
        </div>
      )}
    </>
  );
}
export function CalendarView({
  sessions,
  create,
  open,
  canEdit,
  timezone = "Asia/Jakarta",
  todayOverride,
}: {
  timezone?: string;
  todayOverride?: string;
  sessions: Row[];
  create: () => void;
  open: (r: Row) => void;
  canEdit: boolean;
}) {
  const [month, setMonth] = useState(
    (
      todayOverride ||
      new Date().toLocaleDateString("sv-SE", { timeZone: timezone })
    ).slice(0, 7),
  );
  const [year, monthNumber] = month.split("-").map(Number);
  const count = new Date(year, monthNumber, 0).getDate();
  const offset = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7;
  const shown = sessions
    .filter((s) => s.date?.startsWith(month))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return (
    <>
      <div className="toolbar">
        <CalendarDays size={22} />
        <label>
          <T>{"Month"}</T>{" "}
          <input
            aria-label="Schedule month"
            type="month"
            value={month}
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
          />
        </label>
        <span className="hint">
          {timezone} · {shown.length}
          <T>{"scheduled sessions"}</T>
        </span>
        {canEdit && (
          <button className="btn primary" onClick={create}>
            <Plus size={16} />
            <T>{"Schedule session"}</T>
          </button>
        )}
      </div>
      <Tabs defaultValue="month">
        <TabsList>
          <TabsTrigger value="month">
            <T>{"Month"}</T>
          </TabsTrigger>
          <TabsTrigger value="agenda">
            <T>{"Agenda"}</T>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="month">
          <div className="panel calendar-wrap">
            <div className="calendar-grid day-names">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="calendar-grid">
              {Array.from({ length: offset }, (_, i) => (
                <div className="calendar-cell outside" key={"before" + i} />
              ))}
              {Array.from({ length: count }, (_, i) => {
                const date = month + "-" + String(i + 1).padStart(2, "0");
                return (
                  <div
                    className={
                      "calendar-cell " +
                      (date ===
                      new Date().toLocaleDateString("sv-SE", {
                        timeZone: timezone,
                      })
                        ? "current"
                        : "")
                    }
                    key={date}
                  >
                    <b>{i + 1}</b>
                    {sessions
                      .filter((s) => s.date === date)
                      .map((s) => (
                        <button key={s.id} onClick={() => open(s)}>
                          <time>{s.time}</time>
                          <strong>{s.name}</strong>
                        </button>
                      ))}
                  </div>
                );
              })}
              {Array.from(
                { length: (7 - ((offset + count) % 7)) % 7 },
                (_, i) => i,
              ).map((d) => (
                <div className="calendar-cell outside" key={d}>
                  {" "}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="agenda">
          <div className="panel agenda">
            {shown.map((s) => (
              <button key={s.id} onClick={() => open(s)}>
                <span className="date-tile">
                  <small>
                    {new Date(s.date + "T12:00:00").toLocaleDateString(
                      "en-GB",
                      { month: "short" },
                    )}
                  </small>
                  <b>{s.date.slice(-2)}</b>
                </span>
                <span>
                  <h3>{s.name}</h3>
                  <p>
                    <Clock size={13} />
                    {s.time}
                    <span>{" " + timezone + " "}</span>
                    <MapPin size={13} />
                    {s.venue}
                  </p>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
            {!shown.length && (
              <div className="empty">
                <T>
                  {
                    "No sessions yet. Schedule the first session for this workspace."
                  }
                </T>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
export function MemberDetails({
  member,
  team,
  attendance,
  invoices,
  audit,
  financial,
  currency = "IDR",
}: {
  currency?: string;
  member: Row;
  team?: Row;
  attendance: Row[];
  invoices: Row[];
  audit: Row[];
  financial: boolean;
}) {
  const { locale, t } = usePreferences();
  const money = (n: number) => formatMoney(n, currency, locale);
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">
          <T>{"Overview"}</T>
        </TabsTrigger>
        <TabsTrigger value="attendance">
          <T>{"Attendance"}</T>
        </TabsTrigger>
        {financial && (
          <TabsTrigger value="payments">
            <T>{"Payments"}</T>
          </TabsTrigger>
        )}
        <TabsTrigger value="activity">
          <T>{"Activity"}</T>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="breakdown">
          {[
            ["Name", member.name],
            ["Email", member.email],
            ["Team", team?.name || "Not assigned"],
            ["Status", member.status],
            ["Joined", member.date],
            ["Membership plan", member.membershipName || "Not selected"],
            ["Monthly dues", money(member.amount || 0)],
          ].map(([k, v]) => (
            <p key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </p>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="attendance">
        {attendance.length ? (
          <div className="breakdown">
            {attendance.map((a) => (
              <p key={a.id}>
                <span>{a.date}</span>
                <b>{a.status}</b>
              </p>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>
              <T>{"No attendance recorded"}</T>
            </h3>
            <p>
              <T>
                {"Attendance appears after your coach records the session."}
              </T>
            </p>
          </div>
        )}
      </TabsContent>
      {financial && (
        <TabsContent value="payments">
          {invoices.length ? (
            <div className="breakdown">
              {invoices.map((i) => (
                <p key={i.id}>
                  <span>
                    {i.description || i.id}
                    <br />
                    {i.status}
                  </span>
                  <b>{money(i.amount)}</b>
                </p>
              ))}
            </div>
          ) : (
            <div className="empty">
              <T>{"No member invoices yet."}</T>
            </div>
          )}
        </TabsContent>
      )}
      <TabsContent value="activity">
        <div className="breakdown">
          <p>
            <span>{member.date}</span>
            <b>
              <T>{"Join workspace"}</T>
            </b>
          </p>
          {audit
            .filter((a) => a.name?.includes(member.name))
            .map((a) => (
              <p key={a.id}>
                <span>{a.date.slice(0, 10)}</span>
                <b>{a.name}</b>
              </p>
            ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
