import { canFeature } from "@/lib/feature-access";
import { validAmount, canonicalSport } from "@/lib/sports";
import {
  loadStore,
  commitStore,
  db as database,
  MODULES,
  NO_FEE,
  ApiError,
  failure,
  writable,
  limit,
} from "@/lib/v1";
import { type DB } from "@/lib/courvix";
import { z } from "zod";

import { scoped, mergeScoped } from "@/lib/access-policy";

// Private, user-owned demonstration workspaces. These are not production club accounts.
export const dynamic = "force-dynamic";
const payloadSchema = z.object({
  reset: z.boolean().optional(),
  revision: z.number().int().min(0),
  data: z.object({
    records: z.record(z.string(),
      z
        .array(
          z
            .object({
              id: z.string().max(150),
              club: z.string().min(1).max(150),
            })
            .passthrough(),
        )
        .max(10000),
    ),
    fee: z.object({
      rate: z.number().min(0).max(100),
      min: z.number().int().min(0),
      max: z.number().int().min(0),
      gateway: z.number().int().min(0),
      flat: z.number().int().min(0),
      type: z.enum(["Percentage", "Fixed"]),
    }),
    websites: z.record(z.string(),
      z.object({
        title: z.string().max(200),
        headline: z.string().max(200),
        about: z.string().max(2000),
      }),
    ),
  }),
});
function fail(message: string, status: number) {
  return failure(new ApiError(status, message));
}
export async function GET(request: Request) {
  try {
    const store = await loadStore(request);
    const identity = store.identity;
    if (!identity) return fail("Masuk ke demo terlebih dahulu.", 401);
    return Response.json(
      {
        data: scoped(store.data, identity),
        revision: store.revision,
        session: identity,
        directory: (
          await database()
            .prepare(
              "SELECT m.subject,COALESCE(json_extract(r.payload,'$.team'),m.team) as team,m.role,u.id,p.avatar_key,p.updated_at,p.display_name FROM cv_memberships m JOIN cv_users u ON u.id=m.user_id LEFT JOIN cv_user_profiles p ON p.user_id=u.id LEFT JOIN cv_records r ON r.club=m.club AND r.id=m.subject AND r.module=CASE WHEN m.role='Member' THEN 'Members' ELSE 'Coaches' END WHERE m.club=? AND m.active=1",
            )
            .bind(store.club.id)
            .all<any>()
        ).results
          .filter(
            (m) =>
              (identity.role === "Admin" && canFeature(identity,m.role === "Coach" ? "Coaches" : "Members")) ||
              m.id === identity.userId ||
              (identity.role === "Coach" &&
                (identity.teams || [identity.team]).includes(m.team)),
          )
          .map((m) => ({
            subject: m.subject,
            userId: m.id,
            name: m.display_name,
            avatarUrl: m.avatar_key
              ? `/api/account?photo=${encodeURIComponent(m.id)}&v=${encodeURIComponent(m.updated_at)}`
              : "",
          })),
        renewalChoices:
          identity.role === "Coach" || !canFeature(identity,"Invoices")
            ? []
            : (
                await database()
                  .prepare(
                    "SELECT member,period,decision FROM cv_renewal_choices WHERE club=?" +
                      (identity.role === "Member" ? " AND member=?" : ""),
                  )
                  .bind(
                    store.club.id,
                    ...(identity.role === "Member" ? [identity.member] : []),
                  )
                  .all()
              ).results,
        readOnly: !(
          (store.club.status === "Trial" &&
            Date.parse(store.club.trial_ends) > Date.now()) ||
          (store.club.status === "Active" &&
            Date.parse(store.club.renew_at) > Date.now())
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return fail("Request not allowed.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return fail("Invalid request format.", 415);
  try {
    await limit(request, "workspace", 100);
    // Consume the incoming body before an early product/read-only response so
    // the local proxy can safely reuse its upstream connection.
    const body = await request.text();
    if (body.length > 3000000)
      return fail("This request exceeds the workspace size limit.", 413);
    const store = await loadStore(request);
    const identity = store.identity;
    writable(store.club);
    if (store.club.workspace_type === "Trainer")
      return fail(
        "Use the Personal Training workspace to update training records.",
        409,
      );
    let decoded: unknown;
    try {
      decoded = JSON.parse(body);
    } catch {
      return fail("Invalid JSON format.", 400);
    }
    const parsed = payloadSchema.safeParse(decoded);
    if (!parsed.success)
      return fail("Invalid records. Check the fields and try again.", 422);
    const { revision } = parsed.data;
    let data = parsed.data.data as DB;
    if (data.fee.min > data.fee.max) return fail("Invalid fee limits.", 422);
    const baseline = {
      records: Object.fromEntries(MODULES.map((k) => [k, []])),
    };
    if (
      Object.keys(baseline.records).some((k) => !Array.isArray(data.records[k]))
    )
      return fail("The record modules are incomplete.", 422);
    if (store.revision !== revision)
      return fail(
        "Records changed on another device. Refresh before saving.",
        409,
      );
    if (parsed.data.reset)
      return fail(
        "Reset is disabled to preserve registered accounts and workspace records.",
        409,
      );
    const old: DB = store.data;
    for (const ticket of data.records.Support || [])
      if (!old.records.Support.some((r) => r.id === ticket.id)) {
        ticket.createdBy = identity.email;
        ticket.status = "Open";
      }
    try {
      data = mergeScoped(store.data, data, identity);
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Access denied.", 403);
    }
    data.fee = { ...NO_FEE };
    data.records.Profiles = store.data.records.Profiles;
    data.records.Payments = structuredClone(store.data.records.Payments);
    // Identity, club subscriptions and invitation state can only change via /api/access.

    data.records.Clubs = store.data.records.Clubs;
    data.records["Audit logs"] = [
      {
        id: crypto.randomUUID(),
        club: identity.club,
        name: "Workspace update",
        actor: identity.name,
        date: new Date().toISOString(),
        status: "Success",
      },
      ...old.records["Audit logs"],
    ];
    const links = (
      await database()
        .prepare(
          "SELECT role,subject FROM cv_memberships WHERE club=? AND active=1 AND role IN ('Member','Coach')",
        )
        .bind(store.club.id)
        .all<any>()
    ).results;
    for (const linked of links)
      if (
        !data.records[linked.role === "Member" ? "Members" : "Coaches"].some(
          (m) => m.id === linked.subject,
        )
      )
        return fail(
          "This profile has sign-in access. Archive the profile and revoke access first.",
          409,
        );
    for (const team of data.records.Teams) {
      const oldTeam = old.records.Teams.find((t) => t.id === team.id);
      if (
        (!oldTeam || oldTeam.sport !== team.sport) &&
        !canonicalSport(team.sport || "")
      )
        return fail("Choose the group sport from the catalog.", 422);
      if (canonicalSport(team.sport || ""))
        team.sport = canonicalSport(team.sport);
    }
    for (const rows of Object.values(data.records))
      if (new Set(rows.map((r) => r.id)).size !== rows.length)
        return fail("Data duplikat terdeteksi.", 422);
    for (const key of ["Members", "Schedule", "Attendance", "Training"])
      for (const row of data.records[key] || []) {
        if (
          row.team &&
          !data.records.Teams.some(
            (t) => t.id === row.team && t.club === row.club,
          )
        )
          return fail("The group must belong to the same workspace.", 422);
        if (
          row.member &&
          !data.records.Members.some(
            (m) => m.id === row.member && m.club === row.club,
          )
        )
          return fail("The member must belong to the same workspace.", 422);
      }
    for (const key of ["Teams", "Schedule", "Competitions"])
      for (const row of data.records[key] || []) {
        if (
          row.coachId &&
          !data.records.Coaches.some(
            (c) => c.id === row.coachId && c.club === row.club,
          )
        )
          return fail("The coach must belong to the same workspace.", 422);
        if (
          row.team &&
          !data.records.Teams.some(
            (t) => t.id === row.team && t.club === row.club,
          )
        )
          return fail("Group unavailable.", 422);
      }
    for (const row of data.records.Schedule) {
      const prev = old.records.Schedule.find((s) => s.id === row.id);
      if (JSON.stringify(prev) === JSON.stringify(row)) continue;
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
        !/^\d{2}:\d{2}$/.test(row.time) ||
        !/^\d{2}:\d{2}$/.test(row.endTime) ||
        !row.team ||
        !row.coachId ||
        !row.venue
      )
        return fail(
          "Complete the session date, time, group, coach and location.",
          422,
        );
      if (
        data.records.Schedule.some(
          (s) =>
            s.id !== row.id &&
            s.club === row.club &&
            s.date === row.date &&
            row.time < (s.endTime || s.time) &&
            row.endTime > s.time &&
            (s.team === row.team ||
              s.coachId === row.coachId ||
              s.venue === row.venue),
        )
      )
        return fail(
          "Scheduling conflict: the group, coach or venue is already booked.",
          409,
        );
    }
    for (const m of data.records.Members)
      if (
        m.membership &&
        !data.records.Membership.some(
          (p) => p.id === m.membership && p.club === m.club,
        )
      )
        return fail(
          "This membership plan does not belong to the workspace.",
          422,
        );
    for (const expense of data.records.Expenses)
      if (!validAmount(expense.amount, store.club.currency))
        return fail(
          "Expenses must be positive and use the workspace currency precision.",
          422,
        );
    for (const p of data.records.Membership)
      if (!validAmount(p.amount, store.club.currency))
        return fail(
          "Plan prices must be positive and use the workspace currency precision.",
          422,
        );
    for (const row of data.records.Schedule) {
      if (row.endTime && row.endTime <= row.time)
        return fail("The end time must be after the start time.", 422);
    }
    for (const row of data.records.Training) {
      if (row.session) {
        const session = data.records.Schedule.find(
          (s) => s.id === row.session && s.club === row.club,
        );
        if (!session || row.team !== session.team)
          return fail(
            "The training program must match the session and group.",
            422,
          );
      }
    }
    const attendanceKeys = new Set<string>();
    for (const row of data.records.Attendance) {
      const session = data.records.Schedule.find(
        (s) => s.id === row.session && s.club === row.club,
      );
      const member = data.records.Members.find(
        (m) => m.id === row.member && m.club === row.club,
      );
      const before = old.records.Attendance.find((a) => a.id === row.id);
      const changed = JSON.stringify(before) !== JSON.stringify(row);
      if (
        !session ||
        !member ||
        (changed &&
          (member.team !== session.team || session.status === "Cancelled"))
      )
        return fail("This member does not belong to the session team.", 422);
      if (!["Present", "Late", "Absent", "Excused"].includes(row.status))
        return fail("Invalid attendance status.", 422);
      const key = row.session + ":" + row.member;
      if (attendanceKeys.has(key))
        return fail(
          "Attendance is already recorded for this participant and session.",
          422,
        );
      attendanceKeys.add(key);
      if (changed) {
        row.team = session.team;
        row.coachId = session.coachId;
        row.recordedAt = new Date().toISOString();
        row.recordedBy = identity.name;
      }
    }
    const billed = new Set<string>();
    for (const i of data.records.Invoices) {
      if (i.period && i.status !== "Cancelled") {
        if (!/^\d{4}-\d{2}$/.test(i.period))
          return fail("Invalid billing period.", 422);
        const key = i.club + ":" + i.member + ":" + i.period;
        if (billed.has(key))
          return fail(
            "This member already has an invoice for this period.",
            409,
          );
        billed.add(key);
      }
    }
    for (const invoice of data.records.Invoices) {
      if (
        !data.records.Members.some(
          (m) => m.id === invoice.member && m.club === invoice.club,
        )
      )
        return fail("The invoice member and workspace do not match.", 422);
      if (
        ![
          "Pending",
          "Processing",
          "Paid",
          "Failed",
          "Expired",
          "Cancelled",
          "Refunded",
        ].includes(invoice.status)
      )
        return fail("Invalid payment status.", 422);
    }
    if (
      !parsed.data.reset &&
      old.records.Invoices.some(
        (r) =>
          ["Paid", "Refunded"].includes(r.status) &&
          !data.records.Invoices.some((n) => n.id === r.id),
      )
    )
      return fail("Payment history cannot be deleted.", 409);
    for (const ticket of data.records.Support) {
      const prev = old.records.Support.find((r) => r.id === ticket.id);
      if (!prev) {
        ticket.createdBy = identity.email;
        ticket.createdAt = new Date().toISOString();
        ticket.status = "Open";
        delete ticket.response;
        delete ticket.respondedAt;
      } else if (JSON.stringify(ticket) !== JSON.stringify(prev))
        return fail(
          "Submitted tickets cannot be edited. Create a new ticket to add information.",
          403,
        );
    }
    if (
      old.records.Support.some(
        (r) => !data.records.Support.some((n) => n.id === r.id),
      )
    )
      return fail("Support tickets cannot be deleted from the workspace.", 403);
    // Payment state is changed only through the audited manual-payment command.
    for (const invoice of data.records.Invoices) {
      if (!validAmount(invoice.amount, store.club.currency))
        return fail("Enter a positive invoice amount in IDR.", 422);
      const before = old.records.Invoices.find((r) => r.id === invoice.id);
      if (!before) {
        const choice = await database()
          .prepare(
            "SELECT period FROM cv_renewal_choices WHERE club=? AND member=? AND decision='Stop'",
          )
          .bind(store.club.id, invoice.member)
          .first<any>();
        if (choice && invoice.period > choice.period)
          return fail(
            "This member declined renewal. Confirm membership before billing another period.",
            409,
          );
        if (invoice.status !== "Pending")
          return fail("New invoices must start as Pending.", 422);
        if (
          !/^\d{4}-\d{2}$/.test(invoice.period || "") ||
          !/^\d{4}-\d{2}-\d{2}$/.test(invoice.due || "")
        )
          return fail("Enter an invoice period and due date.", 422);
        invoice.fee = 0;
        invoice.gateway = 0;
        invoice.method = "Transfer bank";
      } else {
        if (
          before.status === "Paid" &&
          JSON.stringify(invoice) !== JSON.stringify(before)
        )
          return fail(
            "Paid invoices cannot be edited. Record a payment correction with a reason.",
            409,
          );
        if (
          invoice.status !== before.status &&
          !(
            ["Pending", "Rejected", "Expired"].includes(before.status) &&
            invoice.status === "Cancelled"
          )
        )
          return fail(
            "Use payment submission or verification to change this status.",
            403,
          );
        for (const key of [
          "reference",
          "paymentNote",
          "submittedAt",
          "verifiedAt",
          "verifiedBy",
          "paymentDate",
          "fee",
          "gateway",
        ])
          if (JSON.stringify(invoice[key]) !== JSON.stringify(before[key]))
            return fail(
              "Payment metadata can only change through verification.",
              403,
            );
      }
    }
    const nextRevision = await commitStore(store, data);
    return Response.json(
      { data: scoped(data, identity), revision: nextRevision },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
