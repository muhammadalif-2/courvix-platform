"use client";
import { T } from "./preferences";
import { useEffect, useState, type FormEvent } from "react";
import { Bell, CheckCircle, Clock, Mail, RefreshCw } from "lucide-react";
import { useAppRequest } from "./app-transport";
import { usePreferences } from "./preferences";
import { money as formatMoney } from "@/lib/courvix";
import { stopReason } from "@/lib/reminder-policy";
import "./reminders.css";
export default function Reminders({
  demo = false,
  onInvoice,
}: {
  demo?: boolean;
  onInvoice?: (id: string) => void;
}) {
  const { locale } = usePreferences();
  const request = useAppRequest(),
    [d, setD] = useState<any>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  async function refresh() {
    const r = await request("/api/reminders");
    const v: any = await r.json();
    if (!r.ok) throw Error(v.error);
    setD(v);
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  async function act(b: any) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await request("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(b),
        }),
        v: any = await r.json();
      if (!r.ok) throw Error(v.error);
      await refresh();
      setNotice(
        b.action === "run"
          ? `${v.created} new reminder(s) created. ${demo ? "Emails appear only in the simulated inbox." : v.blocked ? "Some emails are blocked until a sender is configured." : "Delivery history updated."}`
          : "Choice saved.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!d)
    return (
      <div className="panel padded">
        <p role={error ? "alert" : "status"}>{error || "Loading reminders…"}</p>
      </div>
    );
  const admin = d.session.role === "Admin",
    unpaid = d.invoices.filter(
      (i: any) => !["Paid", "Cancelled"].includes(i.status),
    ),
    continueCount = d.choices.filter(
      (c: any) => c.decision === "Continue",
    ).length,
    stopCount = d.choices.filter((c: any) => c.decision === "Stop").length;
  return (
    <div className="reminder-module">
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
      <section className="reminder-intro">
        <span className="eyebrow">
          <Bell size={14} />
          <T>{"PAYMENT FOLLOW-UPS & MEMBERSHIP RENEWAL"}</T>
        </span>
        <h2>
          {admin
            ? "Iuran ditindaklanjuti, member tetap didengar."
            : "Selesaikan iuran atau tentukan langkah berikutnya."}
        </h2>
        <p>
          <T>
            {
              "Reminders pause during payment review and stop when paid or when the member declines renewal. Declining stops future invoices; existing debt remains recorded."
            }
          </T>
        </p>
        {demo && (
          <p className="demo-note">
            <T>
              {
                "Demo emails appear in the simulated inbox. Use +3 days to see the next reminder."
              }
            </T>
          </p>
        )}
      </section>
      <div className="reminder-metrics">
        <div>
          <small>
            <T>{"Unpaid"}</T>
          </small>
          <strong>{unpaid.length}</strong>
        </div>
        <div>
          <small>
            <T>{"Recorded reminders"}</T>
          </small>
          <strong>{d.logs.length}</strong>
        </div>
        <div>
          <small>
            <T>{"Continuing"}</T>
          </small>
          <strong>{continueCount}</strong>
        </div>
        <div>
          <small>
            <T>{"Stop renewal"}</T>
          </small>
          <strong>{stopCount}</strong>
        </div>
      </div>
      {admin && (
        <section className="panel padded">
          <h3>
            <T>{"Reminder rules"}</T>
          </h3>
          <form
            className="reminder-config"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              act({
                action: "configure",
                enabled: f.has("enabled"),
                emailEnabled: f.has("emailEnabled"),
                leadDays: Number(f.get("leadDays")),
                intervalDays: Number(f.get("intervalDays")),
              });
            }}
          >
            <label className="reminder-check">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={d.preference.enabled}
              />{" "}
              <T>{"Enable workspace reminders"}</T>
            </label>
            <label className="reminder-check">
              <input
                type="checkbox"
                name="emailEnabled"
                defaultChecked={d.preference.emailEnabled}
              />{" "}
              <T>{"Also send by email"}</T>
            </label>
            <label>
              <T>{"First reminder"}</T>
              <input
                type="number"
                name="leadDays"
                min={0}
                max={14}
                defaultValue={d.preference.leadDays}
                required
              />
              <small>
                <T>{"days before the due date"}</T>
              </small>
            </label>
            <label>
              <T>{"Repeat after the due date"}</T>
              <input
                type="number"
                name="intervalDays"
                min={1}
                max={30}
                defaultValue={d.preference.intervalDays}
                required
              />
              <small>
                <T>{"days until paid or renewal is declined"}</T>
              </small>
            </label>
            <div className="actions">
              <button className="btn primary" disabled={busy}>
                <T>{"Save rules"}</T>
              </button>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => act({ action: "run" })}
              >
                <RefreshCw size={15} />
                <T>{"Check now"}</T>
              </button>
            </div>
          </form>
          {!d.emailConfigured && (
            <p className="hint">
              <T>
                {
                  "The sender is not configured. In-app reminders are recorded; emails are not marked as sent."
                }
              </T>
            </p>
          )}
        </section>
      )}
      {!admin && (
        <section className="panel padded">
          <h3>
            <T>{"Next-period membership"}</T>
          </h3>
          <p className="hint">
            <T>
              {
                "You can decide whether to renew after paying. This decision does not remove existing invoices."
              }
            </T>
          </p>
          <form
            className="reminder-config"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              act({
                action: "choice",
                period:
                  d.invoices
                    .map((i: any) => i.period)
                    .filter(Boolean)
                    .sort()
                    .at(-1) || new Date().toISOString().slice(0, 7),
                decision: f.get("decision"),
                note: f.get("note"),
              });
            }}
          >
            <label>
              <T>{"Choice"}</T>
              <select
                name="decision"
                defaultValue={
                  d.choices.find((c: any) => c.member === d.session.member)
                    ?.decision === "Stop"
                    ? "Stop"
                    : "Continue"
                }
              >
                <option value="Continue">
                  <T>{"I will continue"}</T>
                </option>
                <option value="Stop">
                  <T>{"I will stop after this period"}</T>
                </option>
              </select>
            </label>
            <label>
              <T>{"Notes (optional)"}</T>
              <textarea name="note" maxLength={500} />
            </label>
            <label className="reminder-check">
              <input type="checkbox" required />
              <T>{"I understand issued invoices remain recorded."}</T>
            </label>
            <button className="btn" disabled={busy}>
              <T>{"Save membership choice"}</T>
            </button>
          </form>
        </section>
      )}
      <section className="panel padded">
        <h3>{admin ? "Invoice follow-up" : "My invoices & renewal"}</h3>
        {!unpaid.length && (
          <div className="reminder-clear">
            <CheckCircle />
            <strong>
              <T>{"No invoices need follow-up."}</T>
            </strong>
          </div>
        )}
        <div className="reminder-invoices">
          {unpaid.map((i: any) => {
            const choice = d.choices.find((c: any) => c.member === i.member),
              reason = stopReason(i, choice?.decision || "Undecided");
            return (
              <article key={i.id}>
                <div className="reminder-invoice-head">
                  <div>
                    <strong>{i.name}</strong>
                    <p>
                      {i.period}
                      <T>{"· Jatuh tempo "}</T>
                      {i.due}
                    </p>
                  </div>
                  <b>
                    {formatMoney(i.amount, d.club?.currency || "IDR", locale)}
                  </b>
                </div>
                <p>
                  <span className="badge">{i.status}</span>{" "}
                  {reason ||
                    "Awaiting payment or the member’s renewal decision."}
                </p>
                {choice && (
                  <p className="hint">
                    <T>{"Choice:"}</T>{" "}
                    {choice.decision === "Stop" ? "Stop renewal" : "Continue"} ·{" "}
                    {choice.note || "Dicatat oleh member"}
                  </p>
                )}
                {onInvoice && (
                  <button className="btn small" onClick={() => onInvoice(i.id)}>
                    {i.status === "Review"
                      ? admin
                        ? "Review payments"
                        : "Lihat pengajuan"
                      : "View invoice / submit transfer"}
                  </button>
                )}
                <details className="renewal-decision">
                  <summary>
                    {admin
                      ? "Catat keputusan member"
                      : "Tentukan kelanjutan keanggotaan"}
                  </summary>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      act({
                        action: "choice",
                        member: i.member,
                        period: i.period,
                        decision: f.get("decision"),
                        note: f.get("note"),
                      });
                    }}
                  >
                    <label>
                      <T>{"Choice"}</T>
                      <select
                        name="decision"
                        defaultValue={choice?.decision || "Continue"}
                      >
                        <option value="Continue">
                          <T>{"I will continue — payment is still required"}</T>
                        </option>
                        <option value="Stop">
                          <T>{"I will stop after this period"}</T>
                        </option>
                      </select>
                    </label>
                    <label>
                      {admin
                        ? "Member consent notes"
                        : "Reason / notes (optional)"}
                      <textarea
                        name="note"
                        required={admin}
                        minLength={admin ? 5 : undefined}
                        maxLength={500}
                      />
                    </label>
                    <label className="reminder-check">
                      <input type="checkbox" required />
                      <T>
                        {
                          "I understand this choice does not remove invoices already issued."
                        }
                      </T>
                    </label>
                    <button className="btn" disabled={busy}>
                      <T>{"Save decision"}</T>
                    </button>
                  </form>
                </details>
              </article>
            );
          })}
        </div>
      </section>
      <section className="panel padded">
        <h3>
          <T>{"Reminder history"}</T>
        </h3>
        {!d.logs.length && (
          <p className="hint">
            <T>
              {
                "No reminders yet. An administrator can enable rules and check invoices that are due."
              }
            </T>
          </p>
        )}
        {d.logs.map((r: any) => {
          const invoice = d.invoices.find((i: any) => i.id === r.invoice),
            choice = d.choices.find((c: any) => c.member === r.member),
            reason = invoice
              ? stopReason(invoice, choice?.decision || "Undecided")
              : null;
          return (
            <article className="reminder-log" key={r.id}>
              <Bell size={17} />
              <div>
                <p>{r.message}</p>
                <small>
                  {new Date(r.created_at).toLocaleDateString("en-GB")} ·{" "}
                  {reason
                    ? "Berhenti / jeda: " + reason
                    : (
                        {
                          Sent: demo ? "Simulated email" : "Email sent",
                          "In-app": "In app",
                          Blocked: "Email is not configured",
                          Failed: "Email delivery failed",
                          Stopped: "Stopped",
                          Pending: "Queued",
                          Sending: "Sending",
                          Superseded: "Superseded by a newer reminder",
                        } as any
                      )[r.delivery] || r.delivery}
                </small>
                {r.error && <small>{r.error}</small>}
              </div>
              {!r.read_at && (
                <button
                  className="text-btn"
                  disabled={busy}
                  onClick={() => act({ action: "read", id: r.id })}
                >
                  <T>{"Read"}</T>
                </button>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
