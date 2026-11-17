import {
  db,
  loadStore,
  settings,
  uid,
  now,
  ApiError,
  audit,
  escapeHtml,
} from "./v1";
import {
  defaultReminderPreference,
  reminderSlot,
  reminderText,
  type ReminderPreference,
} from "./reminder-policy";
export async function preference(club: string): Promise<ReminderPreference> {
  const p = await db()
    .prepare("SELECT * FROM cv_reminder_preferences WHERE club=?")
    .bind(club)
    .first<any>();
  return p
    ? {
        enabled: !!p.enabled,
        emailEnabled: !!p.email_enabled,
        leadDays: p.lead_days,
        intervalDays: p.interval_days,
      }
    : { ...defaultReminderPreference };
}
export async function processReminders(onlyClub?: string) {
  const lease = await db()
    .prepare(
      "INSERT INTO cv_jobs(name,lease_until) VALUES('reminders',?) ON CONFLICT(name) DO UPDATE SET lease_until=excluded.lease_until WHERE cv_jobs.lease_until<? RETURNING name",
    )
    .bind(Date.now() + 600000, Date.now())
    .first();
  if (!lease) throw new ApiError(409, "A reminder check is already running.");
  const summary = { created: 0, sent: 0, blocked: 0, paused: 0 };
  let attempted = 0;
  try {
    await db()
      .prepare(
        "UPDATE cv_reminders SET delivery='Uncertain',error='The previous send was interrupted. Check the provider delivery history before retrying.' WHERE delivery='Sending'",
      )
      .run();
    const clubs = (
      await db()
        .prepare("SELECT * FROM cv_clubs" + (onlyClub ? " WHERE id=?" : ""))
        .bind(...(onlyClub ? [onlyClub] : []))
        .all<any>()
    ).results;
    for (const club of clubs) {
      const p = await preference(club.id);
      if (!p.enabled) continue;
      const active =
        (club.status === "Trial" && Date.parse(club.trial_ends) > Date.now()) ||
        (club.status === "Active" && Date.parse(club.renew_at) > Date.now());
      if (!active) continue;
      const invoiceModule =
        club.workspace_type === "Trainer" ? "PTOrders" : "Invoices";
      const rows = (
        await db()
          .prepare(
            "SELECT module,payload FROM cv_records WHERE club=? AND module IN (?,'Members')",
          )
          .bind(club.id, invoiceModule)
          .all<any>()
      ).results;
      const invoices = rows
          .filter((r) => r.module === invoiceModule)
          .map((r) => JSON.parse(r.payload)),
        members = rows
          .filter((r) => r.module === "Members")
          .map((r) => JSON.parse(r.payload));
      const choices = (
        await db()
          .prepare("SELECT * FROM cv_renewal_choices WHERE club=?")
          .bind(club.id)
          .all<any>()
      ).results;
      const today = new Date().toLocaleDateString("sv-SE", {
        timeZone: club.timezone,
      });
      for (const invoice of invoices) {
        const member = members.find((m) => m.id === invoice.member),
          choice =
            (club.workspace_type === "Trainer"
              ? "Undecided"
              : choices.find((c) => c.member === invoice.member)?.decision) ||
            "Undecided";
        const slot = reminderSlot(invoice, member, choice, today, p);
        if (!slot) {
          summary.paused++;
          await db()
            .prepare(
              "UPDATE cv_reminders SET delivery='Stopped' WHERE club=? AND invoice=? AND delivery IN ('Pending','Blocked','Failed')",
            )
            .bind(club.id, invoice.id)
            .run();
          continue;
        }
        const result = await db()
          .prepare(
            "INSERT OR IGNORE INTO cv_reminders(id,club,invoice,member,slot,message,delivery,created_at) VALUES(?,?,?,?,?,?,'Pending',?)",
          )
          .bind(
            uid(),
            club.id,
            invoice.id,
            invoice.member,
            slot,
            reminderText(invoice, club.name, club.currency || "IDR", "en"),
            now(),
          )
          .run();
        summary.created += result.meta.changes;
      }
      const pending = (
        await db()
          .prepare(
            "SELECT * FROM cv_reminders WHERE club=? AND delivery IN ('Pending','Blocked','Failed') AND attempts<3 ORDER BY created_at DESC LIMIT 25",
          )
          .bind(club.id)
          .all<any>()
      ).results;
      for (const reminder of pending) {
        if (attempted >= 50) break;
        const latestInvoice = await db()
          .prepare(
            "SELECT payload FROM cv_records WHERE club=? AND module=? AND id=?",
          )
          .bind(club.id, invoiceModule, reminder.invoice)
          .first<any>();
        const latestMember = await db()
          .prepare(
            "SELECT payload FROM cv_records WHERE club=? AND module='Members' AND id=?",
          )
          .bind(club.id, reminder.member)
          .first<any>();
        const latestChoice = await db()
          .prepare(
            "SELECT decision FROM cv_renewal_choices WHERE club=? AND member=?",
          )
          .bind(club.id, reminder.member)
          .first<any>();
        const invoice = latestInvoice
            ? JSON.parse(latestInvoice.payload)
            : null,
          member = latestMember ? JSON.parse(latestMember.payload) : null,
          choice =
            club.workspace_type === "Trainer"
              ? "Undecided"
              : latestChoice?.decision || "Undecided";
        const livePreference = await preference(club.id);
        if (!livePreference.enabled) {
          await db()
            .prepare("UPDATE cv_reminders SET delivery='Stopped' WHERE id=?")
            .bind(reminder.id)
            .run();
          continue;
        }
        if (!invoice || !reminderSlot(invoice, member, choice, today, p)) {
          await db()
            .prepare("UPDATE cv_reminders SET delivery='Stopped' WHERE id=?")
            .bind(reminder.id)
            .run();
          continue;
        }
        // Never send stale slots after a long outage; the latest current reminder is sufficient.
        if (reminder.slot !== reminderSlot(invoice, member, choice, today, p)) {
          await db()
            .prepare("UPDATE cv_reminders SET delivery='Superseded' WHERE id=?")
            .bind(reminder.id)
            .run();
          continue;
        }
        if (!livePreference.emailEnabled) {
          await db()
            .prepare("UPDATE cv_reminders SET delivery='In-app' WHERE id=?")
            .bind(reminder.id)
            .run();
          continue;
        }
        const cfg = settings();
        if (!cfg.RESEND_API_KEY || !cfg.COURVIX_FROM_EMAIL || !member?.email) {
          await db()
            .prepare(
              "UPDATE cv_reminders SET delivery='Blocked',error='The email sender or recipient address is not configured' WHERE id=?",
            )
            .bind(reminder.id)
            .run();
          summary.blocked++;
          continue;
        }
        attempted++;
        const claim = await db()
          .prepare(
            "UPDATE cv_reminders SET delivery='Sending',attempts=attempts+1 WHERE id=? AND delivery IN ('Pending','Blocked','Failed')",
          )
          .bind(reminder.id)
          .run();
        if (!claim.meta.changes) continue;
        try {
          const appOrigin = cfg.COURVIX_APP_URL;
          if (!appOrigin?.startsWith("https://"))
            throw Error("The application URL is not configured.");
          const url = new URL("/dashboard", appOrigin);
          url.searchParams.set("module", "Reminders");
          url.searchParams.set("invoice", invoice.id);
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            signal: AbortSignal.timeout(6000),
            headers: {
              Authorization: "Bearer " + cfg.RESEND_API_KEY,
              "Content-Type": "application/json",
              "Idempotency-Key": "reminder-" + reminder.id,
            },
            body: JSON.stringify({
              from: cfg.COURVIX_FROM_EMAIL,
              to: member.email,
              subject: "Payment reminder for " + club.name,
              html: `<p>Hi ${escapeHtml(member.name)},</p><p>${escapeHtml(reminder.message)}</p><p><a href="${escapeHtml(url.href)}">View payment details</a></p><p>This reminder is from your workspace administrator. If your transfer is under review, wait for verification.</p>`,
            }),
          });
          if (!r.ok) throw Error("Email provider status " + r.status);
          await db()
            .prepare(
              "UPDATE cv_reminders SET delivery='Sent',sent_at=?,error=NULL WHERE id=?",
            )
            .bind(now(), reminder.id)
            .run();
          summary.sent++;
        } catch (e) {
          await db()
            .prepare(
              "UPDATE cv_reminders SET delivery='Failed',error=? WHERE id=?",
            )
            .bind(
              e instanceof Error ? e.message : "Delivery failed",
              reminder.id,
            )
            .run();
        }
      }
    }
    return summary;
  } finally {
    await db()
      .prepare("UPDATE cv_jobs SET lease_until=0 WHERE name='reminders'")
      .run();
  }
}
export async function remindersFor(req: Request) {
  const s = await loadStore(req);
  if (!["Admin", "Member"].includes(s.identity.role))
    throw new ApiError(
      403,
      "Reminders are available to administrators and members.",
    );
  const own = s.identity.role === "Member" ? s.identity.member : null;
  const choices = (
    await db()
      .prepare(
        "SELECT * FROM cv_renewal_choices WHERE club=?" +
          (own ? " AND member=?" : ""),
      )
      .bind(s.club.id, ...(own ? [own] : []))
      .all<any>()
  ).results;
  const logs = (
    await db()
      .prepare(
        "SELECT * FROM cv_reminders WHERE club=?" +
          (own ? " AND member=?" : "") +
          " ORDER BY created_at DESC LIMIT 100",
      )
      .bind(s.club.id, ...(own ? [own] : []))
      .all<any>()
  ).results;
  return { s, choices, logs };
}
