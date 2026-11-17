import {
  RELEASE_VERSION,
  releaseReadiness,
  validateReleaseEvidence,
} from "@/lib/release-readiness";
import { platformSummary } from "@/lib/platform-summary";
import {
  db,
  viewer,
  ApiError,
  body,
  limit,
  now,
  uid,
  audit,
  json,
  failure,
  settings,
} from "@/lib/v1";
export const dynamic = "force-dynamic";
async function guard(req: Request) {
  const u = await viewer(req);
  if (!u.platformAdmin)
    throw new ApiError(403, "Only the Courvix administrator can access this.");
  return u;
}
export async function GET(req: Request) {
  try {
    await guard(req);
    const clubs = (
      await db()
        .prepare("SELECT * FROM cv_clubs ORDER BY created_at DESC")
        .all()
    ).results;
    const billing = (
      await db()
        .prepare(
          "SELECT b.*,c.name as club_name FROM cv_billing b JOIN cv_clubs c ON c.id=b.club ORDER BY b.created_at DESC",
        )
        .all()
    ).results;
    const support = (
      await db()
        .prepare(
          "SELECT r.club,r.id,r.payload,c.name as club_name FROM cv_records r JOIN cv_clubs c ON c.id=r.club WHERE r.module='Support'",
        )
        .all<any>()
    ).results.map((r) => ({ ...JSON.parse(r.payload), clubName: r.club_name }));
    const users = (
      await db()
        .prepare(
          "SELECT u.*,p.display_name,p.title,p.country,p.sport,p.avatar_key,p.updated_at FROM cv_users u LEFT JOIN cv_user_profiles p ON p.user_id=u.id ORDER BY u.created_at DESC",
        )
        .all<any>()
    ).results.map((u) => {
      const { avatar_key, ...safe } = u;
      return {
        ...safe,
        name: u.display_name || u.name,
        avatarUrl: avatar_key
          ? `/api/account?photo=${encodeURIComponent(u.id)}&v=${encodeURIComponent(u.updated_at)}`
          : "",
      };
    });
    const memberships = (
      await db().prepare("SELECT * FROM cv_memberships").all<any>()
    ).results;
    const records = (
      await db()
        .prepare(
          "SELECT club,module,payload FROM cv_records WHERE module IN ('Members','Coaches','Teams','Schedule','Invoices','Payments','PTOrders','PTSessions','PTClasses')",
        )
        .all<any>()
    ).results;
    const audit = (
      await db()
        .prepare(
          "SELECT a.*,c.name as club_name FROM cv_audit a LEFT JOIN cv_clubs c ON c.id=a.club ORDER BY a.created_at DESC LIMIT 100",
        )
        .all<any>()
    ).results;
    const overview = platformSummary({
      clubs,
      users,
      memberships,
      records,
      billing,
      audit,
    });
    const evidence = (
      await db()
        .prepare(
          "SELECT actor,detail,created_at FROM cv_audit WHERE club='platform' AND action='Launch check recorded' ORDER BY created_at DESC,rowid DESC LIMIT 200",
        )
        .all<any>()
    ).results;
    const jobRuns = (
      await db()
        .prepare(
          "SELECT detail,created_at FROM cv_audit WHERE club='platform' AND action='Reminder scheduler run' ORDER BY created_at DESC LIMIT 12",
        )
        .all<any>()
    ).results.map((r) => ({ ...JSON.parse(r.detail), at: r.created_at }));
    const delivery = (
      await db()
        .prepare(
          "SELECT delivery,COUNT(*) AS count FROM cv_reminders GROUP BY delivery",
        )
        .all<any>()
    ).results;
    return json({
      ...overview,
      release: RELEASE_VERSION,
      launch: releaseReadiness(evidence),
      jobRuns,
      delivery,
      support,
      readiness: {
        admin: !!settings().COURVIX_ADMIN_EMAILS,
        email: !!settings().RESEND_API_KEY && !!settings().COURVIX_FROM_EMAIL,
        bank:
          !!settings().COURVIX_BANK_NAME &&
          !!settings().COURVIX_BANK_ACCOUNT &&
          !!settings().COURVIX_BANK_HOLDER,
        support: !!settings().COURVIX_SUPPORT_EMAIL,
        schedulerKey: !!settings().COURVIX_REMINDER_JOB_KEY,
      },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const b = await body(req);
    await limit(req, "operator", 40);
    const u = await guard(req);
    if (b.action === "launch-evidence") {
      const error = validateReleaseEvidence(b);
      if (error) throw new ApiError(422, error);
      await audit(
        "platform",
        u.email,
        "Launch check recorded",
        JSON.stringify({
          gate: b.gate,
          verified: b.verified,
          note: b.note.trim(),
          release: RELEASE_VERSION,
        }),
      );
      return json({ ok: true });
    }
    if (b.action === "review-subscription") {
      const invoice = await db()
        .prepare("SELECT * FROM cv_billing WHERE id=? AND status='Review'")
        .bind(b.id)
        .first<any>();
      if (!invoice || !["approve", "reject"].includes(b.decision))
        throw new ApiError(409, "This invoice is no longer awaiting review.");
      const club = await db()
        .prepare("SELECT * FROM cv_clubs WHERE id=?")
        .bind(invoice.club)
        .first<any>();
      if (b.decision === "reject" && !String(b.note || "").trim())
        throw new ApiError(422, "Enter a rejection reason.");
      const queries = [
        db()
          .prepare(
            "INSERT INTO cv_revision_guard(value) SELECT CASE WHEN status='Review' THEN 1 ELSE 0 END FROM cv_billing WHERE id=?",
          )
          .bind(invoice.id),
        db()
          .prepare(
            "UPDATE cv_billing SET status=?,reviewed_by=?,reviewed_at=?,note=? WHERE id=?",
          )
          .bind(
            b.decision === "approve" ? "Paid" : "Rejected",
            u.email,
            now(),
            String(b.note || "").slice(0, 1000),
            invoice.id,
          ),
      ];
      if (b.decision === "approve")
        queries.push(
          db()
            .prepare(
              "UPDATE cv_clubs SET status='Active',plan=?,renew_at=?,revision=revision+1 WHERE id=?",
            )
            .bind(
              invoice.plan,
              new Date(
                Math.max(Date.now(), Date.parse(club.renew_at) || 0) +
                  30 * 86400000,
              ).toISOString(),
              invoice.club,
            ),
        );
      await db().batch(queries);
      await audit(
        invoice.club,
        u.email,
        b.decision === "approve"
          ? "Subscription verified"
          : "Subscription payment rejected",
        invoice.id,
      );
      return json({ ok: true });
    }
    if (b.action === "support") {
      const row = await db()
        .prepare(
          "SELECT payload FROM cv_records WHERE club=? AND module='Support' AND id=?",
        )
        .bind(b.club, b.id)
        .first<any>();
      if (!row || !["Open", "In progress", "Resolved"].includes(b.status))
        throw new ApiError(422, "Support ticket unavailable.");
      const payload = {
        ...JSON.parse(row.payload),
        status: b.status,
        response: String(b.response || "").slice(0, 2000),
        respondedAt: now(),
      };
      await db().batch([
        db()
          .prepare(
            "UPDATE cv_records SET payload=? WHERE club=? AND module='Support' AND id=?",
          )
          .bind(JSON.stringify(payload), b.club, b.id),
        db()
          .prepare("UPDATE cv_clubs SET revision=revision+1 WHERE id=?")
          .bind(b.club),
      ]);
      await audit(b.club, u.email, "Support ticket updated", b.id);
      return json({ ok: true });
    }
    throw new ApiError(404, "Action unavailable.");
  } catch (e) {
    return failure(e);
  }
}
