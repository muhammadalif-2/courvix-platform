"use client";
import { T } from "./preferences";
import { useState } from "react";
import { usePreferences } from "./preferences";
import { money as formatMoney, type DB, type Row } from "@/lib/courvix";
export const moduleHelp: Record<string, [string, string]> = {
  Schedule: [
    "Schedule · when, where, and with whom",
    "Create sessions with a group, assigned coach, start/end time, and venue. Sessions connect attendance with training plans.",
  ],
  Attendance: [
    "Attendance · per-session records",
    "Select a scheduled session. The roster includes its group members; the coach records present, late, absent, or excused.",
  ],
  Training: [
    "Training · programs and evaluations",
    "Set objectives, drills, duration, and evaluations linked to a session. Schedule controls the time; Training covers the work.",
  ],
  Competitions: [
    "Competitions · events and participation",
    "Manage participating groups, coaches, categories, registration deadlines, venues, and results. Participants follow the selected group roster.",
  ],
  Membership: [
    "Membership · member plans",
    "These are your own membership plans, separate from Courvix subscriptions. Set prices and benefits, assign plans to members, and issue monthly invoices without duplicates.",
  ],
  Invoices: [
    "Invoices · amounts due",
    "Invoices contain a member, period, amount, and due date. Members transfer to the workspace bank account and submit a reference for administrator review. V1.0 has no per-dues platform fee.",
  ],
  Payments: [
    "Payments · transaction history",
    "Administrator-verified payments and correction entries. Original transactions cannot be edited or deleted.",
  ],
  Teams: [
    "Groups · members and coaches",
    "A group has an assigned coach and members. Update assignments from member records; schedules and attendance follow the group.",
  ],
  Coaches: [
    "Coaches · professional profiles",
    "Manage specialties, group assignments, and license details. Private coaching records are visible only to the coach and authorized administrators.",
  ],
  Members: [
    "Members · workspace directory",
    "View member profiles, guardians, groups, membership plans, invoices, and attendance history.",
  ],
  Profile: [
    "My profile · account and sport details",
    "Complete your account and sports information so administrators can manage membership or coaching details.",
  ],
};
export function ModuleIntro({ page }: { page: string }) {
  const help = moduleHelp[page];
  return help ? (
    <div className="operation-context">
      <h3>
        <T>{help[0]}</T>
      </h3>
      <p>
        <T>{help[1]}</T>
      </p>
    </div>
  ) : null;
}
export function OperationDetails({
  module,
  row,
  db,
  onOpen,
  onAttendance,
  onGenerate,
  busy,
  canEdit,
}: {
  module: string;
  row: Row;
  db: DB;
  onOpen: (kind: string, row: Row) => void;
  onAttendance: (id: string) => void;
  onGenerate: (period: string, due: string) => void;
  busy: boolean;
  canEdit: boolean;
}) {
  const { locale, t } = usePreferences();
  const club = db.records.Clubs.find((c) => c.id === row.club);
  const money = (n: number) => formatMoney(n, club?.currency || "IDR", locale);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)),
    [due, setDue] = useState(new Date().toISOString().slice(0, 8) + "28");
  const team =
      module === "Teams"
        ? row
        : db.records.Teams.find((t) => t.id === row.team),
    coach = db.records.Coaches.find(
      (c) => c.id === (row.coachId || team?.coachId),
    );
  const roster = db.records.Members.filter(
    (m) =>
      m.club === row.club &&
      (module === "Membership" ? m.membership === row.id : m.team === team?.id),
  );
  const values: Record<string, any> = {
    Nama: row.name,
    Status: row.status,
    Tim: team?.name,
    Coach: coach?.name || team?.coach,
    Cabang: row.sport,
    Tanggal: row.date,
    Waktu: row.time
      ? `${row.time}–${row.endTime || "?"} ${club?.timezone || "Asia/Jakarta"}`
      : null,
    Lokasi: row.venue,
    "Tujuan latihan": row.objective,
    "Drill / program": row.description,
    "Durasi (menit)": row.duration,
    Evaluasi: row.evaluation,
    Kategori: row.category,
    Penyelenggara: row.organizer,
    "Tenggat daftar": row.deadline,
    "Hasil / skor": row.result,
    "Iuran bulanan": module === "Membership" ? money(row.amount) : null,
    Manfaat: row.benefits,
  };
  return (
    <>
      <div className="detail-grid">
        {Object.entries(values)
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <small>{t(k)}</small>
              <strong>{String(v)}</strong>
            </div>
          ))}
      </div>
      {module === "Schedule" && (
        <button className="btn primary" onClick={() => onAttendance(row.id)}>
          <T>{"Open session attendance"}</T>
        </button>
      )}
      {module === "Training" && row.session && (
        <button
          className="btn"
          onClick={() => {
            const s = db.records.Schedule.find((s) => s.id === row.session);
            if (s) onOpen("Schedule", s);
          }}
        >
          <T>{"View session schedule"}</T>
        </button>
      )}
      {["Teams", "Competitions", "Membership", "Schedule"].includes(module) && (
        <>
          <h3>
            {module === "Membership" ? "Members on this plan" : "Group roster"}{" "}
            · {roster.length}
          </h3>
          <div className="detail-roster">
            {roster.length ? (
              roster.map((m) => (
                <div key={m.id}>
                  <span>
                    {m.name} · {m.status}
                  </span>
                  <button
                    className="text-btn"
                    onClick={() => onOpen("Members", m)}
                  >
                    <T>{"Profile"}</T>
                  </button>
                </div>
              ))
            ) : (
              <p>
                <T>{"No members yet. Add members from the Members page."}</T>
              </p>
            )}
          </div>
        </>
      )}
      {module === "Membership" && canEdit && (
        <form
          className="profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            onGenerate(period, due);
          }}
        >
          <h3>
            <T>{"Issue monthly invoices"}</T>
          </h3>
          <p>
            <T>
              {
                "For active members on this plan. Members with an invoice for the same period are skipped."
              }
            </T>
          </p>
          <div className="profile-grid">
            <label>
              <T>{"Period"}</T>
              <input
                type="month"
                required
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </label>
            <label>
              <T>{"Due date"}</T>
              <input
                type="date"
                required
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </label>
          </div>
          <button
            disabled={busy || !roster.some((m) => m.status === "Active")}
            className="btn primary"
          >
            <T>{"Issue invoices"}</T>
          </button>
        </form>
      )}
    </>
  );
}
export function TransactionDetails({
  row,
  currency = "IDR",
}: {
  row: Row;
  currency?: string;
}) {
  const { locale, t } = usePreferences();
  const money = (n: number) => formatMoney(n, currency, locale);
  return (
    <div className="breakdown">
      {[
        ["Transaksi", row.id],
        ["Invoice", row.invoice],
        ["Member", row.name],
        ["Status", row.status],
        ["Time", row.date],
        ["Method", row.method],
        ["Referensi", row.reference],
        ["Iuran", money(row.amount)],
        ["Fee platform", money(row.fee || 0)],
        ["Gateway", money(row.gateway || 0)],
        ["Total dibayar", money(row.total || row.amount)],
      ].map(([k, v]) => (
        <p key={k}>
          <span>{k}</span>
          <b>{v || "—"}</b>
        </p>
      ))}
      <p className="hint">
        <T>
          {
            "Transfers verified by the administrator. Courvix does not move money."
          }
        </T>
      </p>
    </div>
  );
}
