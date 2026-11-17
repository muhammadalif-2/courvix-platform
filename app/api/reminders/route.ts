import { requireFeature } from "@/lib/access-control-server";
import {
  body,
  admin,
  db,
  uid,
  now,
  clean,
  ApiError,
  failure,
  json,
  audit,
  limit,
  settings,
} from "@/lib/v1";
import { preference, processReminders, remindersFor } from "@/lib/reminders";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const { s, choices, logs } = await remindersFor(req);
    requireFeature(s.identity,"Reminders");
    requireFeature(s.identity,s.club.workspace_type === "Trainer" ? "PTOrders" : "Invoices");
    const own = s.identity.role === "Member" ? s.identity.member : null;
    return json({
      session: s.identity,
      club: { currency: s.club.currency, locale: s.club.locale },
      preference: await preference(s.club.id),
      choices,
      logs,
      invoices: s.data.records[
        s.club.workspace_type === "Trainer" ? "PTOrders" : "Invoices"
      ].filter((i) => !own || i.member === own),
      members: s.data.records.Members.filter((m) => !own || m.id === own),
      emailConfigured:
        !!settings().RESEND_API_KEY && !!settings().COURVIX_FROM_EMAIL,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const b = await body(req);
    await limit(req, "reminders", 35);
    const { s } = await remindersFor(req);
    requireFeature(s.identity,"Reminders",s.identity.role === "Admin");
    requireFeature(s.identity,s.club.workspace_type === "Trainer" ? "PTOrders" : "Invoices");
    if (b.action === "configure") {
      admin(s.identity);
      if (typeof b.enabled !== "boolean" || typeof b.emailEnabled !== "boolean")
        throw new ApiError(422, "Invalid reminder options.");
      const lead = Number(b.leadDays),
        interval = Number(b.intervalDays);
      if (
        !Number.isInteger(lead) ||
        lead < 0 ||
        lead > 14 ||
        !Number.isInteger(interval) ||
        interval < 1 ||
        interval > 30
      )
        throw new ApiError(
          422,
          "Reminder intervals must be 0–14 days before and 1–30 days after the due date.",
        );
      await db()
        .prepare(
          "INSERT INTO cv_reminder_preferences(club,enabled,email_enabled,lead_days,interval_days,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(club) DO UPDATE SET enabled=excluded.enabled,email_enabled=excluded.email_enabled,lead_days=excluded.lead_days,interval_days=excluded.interval_days,updated_at=excluded.updated_at",
        )
        .bind(
          s.club.id,
          b.enabled ? 1 : 0,
          b.emailEnabled ? 1 : 0,
          lead,
          interval,
          now(),
        )
        .run();
      await audit(s.club.id, s.identity.email, "Reminder preferences updated");
      return json({ ok: true });
    }
    if (b.action === "run") {
      admin(s.identity);
      return json({ ok: true, ...(await processReminders(s.club.id)) });
    }
    if (b.action === "choice") {
      const member =
        s.identity.role === "Member" ? s.identity.member : clean(b.member);
      const row = s.data.records.Members.find((m) => m.id === member);
      if (!row) throw new ApiError(404, "Member unavailable.");
      if (!["Continue", "Stop"].includes(b.decision))
        throw new ApiError(422, "Choose whether to continue or stop renewal.");
      if (s.identity.role === "Admin" && clean(b.note).length < 5)
        throw new ApiError(422, "Catat persetujuan atau permintaan member.");
      const period = clean(b.period);
      if (!/^\d{4}-\d{2}$/.test(period))
        throw new ApiError(422, "Invalid renewal decision period.");
      const currentPeriod = new Date()
        .toLocaleDateString("sv-SE", { timeZone: s.club.timezone })
        .slice(0, 7);
      if (
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(period) ||
        (period !== currentPeriod &&
          !s.data.records.Invoices.some(
            (i) => i.member === member && i.period === period,
          ))
      )
        throw new ApiError(
          422,
          "Choose the current period or a member invoice period.",
        );
      const choiceWrite = db()
        .prepare(
          "INSERT INTO cv_renewal_choices(club,member,period,decision,note,updated_by,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(club,member) DO UPDATE SET period=excluded.period,decision=excluded.decision,note=excluded.note,updated_by=excluded.updated_by,updated_at=excluded.updated_at",
        )
        .bind(
          s.club.id,
          member,
          period,
          b.decision,
          clean(b.note, 500),
          s.identity.email,
          now(),
        );
      await db().batch([
        choiceWrite,
        db()
          .prepare("UPDATE cv_clubs SET revision=revision+1 WHERE id=?")
          .bind(s.club.id),
      ]);
      if (b.decision === "Stop")
        await db()
          .prepare(
            "UPDATE cv_reminders SET delivery='Stopped' WHERE club=? AND member=? AND delivery IN ('Pending','Blocked','Failed')",
          )
          .bind(s.club.id, member)
          .run();
      await audit(
        s.club.id,
        s.identity.email,
        b.decision === "Stop"
          ? "Member declined renewal"
          : "Member chose to renew",
        row.name + " · " + period,
      );
      return json({ ok: true });
    }
    if (b.action === "read") {
      const own = s.identity.role === "Member" ? s.identity.member : null;
      await db()
        .prepare(
          "UPDATE cv_reminders SET read_at=? WHERE id=? AND club=?" +
            (own ? " AND member=?" : ""),
        )
        .bind(now(), b.id, s.club.id, ...(own ? [own] : []))
        .run();
      return json({ ok: true });
    }
    throw new ApiError(404, "Action unavailable.");
  } catch (e) {
    return failure(e);
  }
}
