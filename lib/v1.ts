import { accountIdentity } from "./account-auth";
import { effectivePermissions } from "./feature-access";
import { env } from "cloudflare:workers";
import { type DB, type Row } from "./courvix";
import type { Identity } from "./access-policy";

export const MODULES = [
  "PTPlans",
  "PTOrders",
  "PTSessions",
  "PTClasses",
  "PTCredits",
  "PTSettings",
  "Members",
  "Teams",
  "Coaches",
  "Schedule",
  "Attendance",
  "Training",
  "Competitions",
  "Membership",
  "Invoices",
  "Payments",
  "Expenses",
  "Announcements",
  "Documents",
  "Support",
  "Profiles",
  "Projects",
  "Clubs",
  "Audit logs",
];
export const NO_FEE = {
  rate: 0,
  min: 0,
  max: 0,
  flat: 0,
  type: "Fixed",
  gateway: 0,
};
export const PLANS: Record<string, number> = {
  Starter: 250000,
  "Club Pro": 500000,
};
export const db = () => (env as any).DB as D1Database;
export const settings = () => env as unknown as Record<string, string>;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();
export const clean = (v: unknown, max = 150) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
export const email = (v: unknown) => clean(v, 254).toLowerCase();
export const hash = async (value: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
export const token = () => uid() + uid();
export function cookieValue(req: Request, key: string) {
  return (
    req.headers
      .get("cookie")
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith(key + "="))
      ?.slice(key.length + 1) || ""
  );
}
export function localPreview(req: Request) {
  return (
    settings().COURVIX_LOCAL_AUTH === "1" &&
    ["localhost", "127.0.0.1", "terminal.local"].includes(
      new URL(req.url).hostname,
    )
  );
}
export async function viewer(req: Request) {
  let id = "",
    address = "",
    name = "";
  const nativeAccount = await accountIdentity(req);
  if (nativeAccount) {
    id=nativeAccount.id; address=nativeAccount.email; name=nativeAccount.name;
  } else if (localPreview(req)) {
    const t = cookieValue(req, "courvix_dev_session");
    const s = t
      ? await db()
          .prepare(
            "SELECT email,name FROM cv_dev_sessions WHERE token_hash=? AND expires>?",
          )
          .bind(await hash(t), Date.now())
          .first<any>()
      : null;
    if (s) {
      address = s.email;
      name = s.name;
      id = "local:" + address;
    }
  } else if (settings().COURVIX_SITES_AUTH === "1") {
    // Trusted identity is supplied and sanitized by the Sites dispatcher.
    // Deploying this application outside Sites requires an OIDC adapter, not forwarding browser headers.
    id = req.headers.get("oai-authenticated-user-id") || "";
    address = email(req.headers.get("oai-authenticated-user-email"));
    try {
      name = decodeURIComponent(
        req.headers.get("oai-authenticated-user-full-name") || "",
      );
    } catch {}
  }
  if (!id || !/^\S+@\S+\.\S+$/.test(address))
    throw new ApiError(401, "Sign in to your Courvix account to continue.");
  // Only verified provider identity or a guarded local fixture reaches this point.
  // One verified email retains one existing workspace identity across login methods.
  const existingIdentity = await db().prepare("SELECT id FROM cv_users WHERE email=?").bind(address).first<{id:string}>();
  if(existingIdentity) id=existingIdentity.id;
  name = clean(name) || address.split("@")[0];
  await db()
    .prepare(
      "INSERT INTO cv_users(id,email,name,created_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name",
    )
    .bind(id, address, name, now())
    .run();
  const operators = (settings().COURVIX_ADMIN_EMAILS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase());
  const profile = await db()
    .prepare(
      "SELECT display_name,avatar_key,updated_at FROM cv_user_profiles WHERE user_id=?",
    )
    .bind(id)
    .first<any>();
  return {
    id,
    email: address,
    name: profile?.display_name || name,
    avatarUrl: profile?.avatar_key
      ? `/api/account?photo=${encodeURIComponent(id)}&v=${encodeURIComponent(profile.updated_at)}`
      : "",
    platformAdmin: operators.includes(address),
    authMode: nativeAccount ? "account" : localPreview(req) ? "local" : "sites",
  };
}
export async function limit(req: Request, key: string, max = 90, seconds = 60) {
  const identity = await hash(
    (req.headers.get("cf-connecting-ip") ||
      cookieValue(req, "courvix_dev_session") ||
      "anonymous") +
      ":" +
      key,
  );
  const t = Date.now(),
    reset = t + seconds * 1000;
  const r = await db()
    .prepare(
      "INSERT INTO cv_rate_limits(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<? THEN 1 ELSE count+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END RETURNING count,reset_at",
    )
    .bind(identity, reset, t, t)
    .first<any>();
  if (r.count > max)
    throw new ApiError(429, "Too many requests. Please try again shortly.");
}
export function origin(req: Request) {
  if (req.headers.get("origin") !== new URL(req.url).origin)
    throw new ApiError(403, "The request origin is not allowed.");
}
export async function body(req: Request, max = 15000) {
  origin(req);
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new ApiError(415, "Send a JSON request.");
  const raw = await req.text();
  if (raw.length > max) throw new ApiError(413, "The request is too large.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError(400, "Invalid JSON.");
  }
}
export function failure(e: unknown) {
  const status =
    e instanceof ApiError
      ? e.status
      : /UNIQUE constraint|CHECK constraint/.test(String(e))
        ? 409
        : 503;
  if (status === 503)
    console.error(
      "courvix_api_failure",
      e instanceof Error ? e.message : "Unknown failure",
    );
  return Response.json(
    {
      error:
        e instanceof ApiError
          ? e.message
          : status === 409
            ? "Records changed or this action was already processed. Refresh before trying again."
            : "The service is temporarily unavailable. Try again.",
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(status === 429 ? { "Retry-After": "60" } : {}),
      },
    },
  );
}
export const json = (
  value: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
export async function audit(
  club: string,
  actor: string,
  action: string,
  detail = "",
) {
  await db()
    .prepare(
      "INSERT INTO cv_audit(id,club,actor,action,detail,created_at) VALUES(?,?,?,?,?,?)",
    )
    .bind(uid(), club, actor, action, detail.slice(0, 1000), now())
    .run();
}
export async function memberships(user: string) {
  return (
    await db()
      .prepare(
        "SELECT m.*,c.name,c.sport,c.status,c.plan,c.organization_id,c.workspace_type,c.country,c.currency,c.locale,c.timezone,c.location FROM cv_memberships m JOIN cv_clubs c ON c.id=m.club WHERE m.user_id=? AND m.active=1 ORDER BY c.created_at",
      )
      .bind(user)
      .all<any>()
  ).results;
}
export async function context(req: Request) {
  const who = await viewer(req),
    list = await memberships(who.id),
    wanted = cookieValue(req, "courvix_club");
  const m = list.find((m) => m.club === wanted) || list[0];
  if (!m)
    throw new ApiError(
      403,
      "Create a workspace or accept an invitation first.",
    );
  const club = await db()
    .prepare("SELECT * FROM cv_clubs WHERE id=?")
    .bind(m.club)
    .first<any>();
  if (!club) throw new ApiError(404, "Workspace unavailable.");
  const identity: Identity = {
    id: m.id,
    userId: who.id,
    name: who.name,
    email: who.email,
    role: m.role === "Owner" ? "Admin" : m.role,
    authMode: who.authMode as "local" | "sites" | "account",
    club: m.club,
    team: m.team || undefined,
    isOwner: m.role === "Owner",
    canInviteAdmin: m.role === "Owner" || !!m.can_invite_admin,
    ...(m.role === "Coach"
      ? { coach: m.subject }
      : m.role === "Member"
        ? { member: m.subject }
        : {}),
  };
  const defaults=await db().prepare("SELECT permissions FROM cv_role_defaults WHERE club=? AND role=?").bind(m.club,m.role).first<any>();
  identity.permissions=effectivePermissions(m.role, defaults?.permissions, m.permissions);
  if (["Member", "Coach"].includes(m.role)) {
    const r = await db()
      .prepare(
        "SELECT payload FROM cv_records WHERE club=? AND module=? AND id=?",
      )
      .bind(m.club, m.role === "Member" ? "Members" : "Coaches", m.subject)
      .first<any>();
    const profile = r ? JSON.parse(r.payload) : null;
    if (!profile || profile.status !== "Active")
      throw new ApiError(
        403,
        "This profile is inactive. Contact your administrator.",
      );
    if (m.role === "Member") identity.team = profile.team;
    else {
      const rows = (
        await db()
          .prepare(
            "SELECT payload FROM cv_records WHERE club=? AND module='Teams'",
          )
          .bind(m.club)
          .all<any>()
      ).results.map((r) => JSON.parse(r.payload));
      identity.teams = Array.from(
        new Set(
          [
            m.team,
            ...rows.filter((r) => r.coachId === m.subject).map((r) => r.id),
          ].filter(Boolean),
        ),
      );
    }
  }
  return { who, m, club, identity, list };
}
export function writable(club: any) {
  if (
    (club.status === "Trial" && Date.parse(club.trial_ends) > Date.now()) ||
    (club.status === "Active" && Date.parse(club.renew_at) > Date.now())
  )
    return;
  throw new ApiError(
    402,
    "The subscription expired. Records remain readable and exportable; the owner can renew in Settings.",
  );
}
export function admin(identity: Identity) {
  if (identity.role !== "Admin")
    throw new ApiError(
      403,
      "Only workspace administrators can perform this action.",
    );
}
export function ownerOnly(identity: Identity) {
  if (!identity.isOwner)
    throw new ApiError(
      403,
      "Only the workspace owner can perform this action.",
    );
}
export async function loadStore(req: Request) {
  const ctx = await context(req);
  const records: Record<string, Row[]> = Object.fromEntries(
    MODULES.map((k) => [k, []]),
  );
  const rows = await db()
    .prepare(
      "SELECT module,payload FROM cv_records WHERE club=? ORDER BY rowid DESC",
    )
    .bind(ctx.club.id)
    .all<any>();
  for (const r of rows.results)
    if (records[r.module]) records[r.module].push(JSON.parse(r.payload));
  records.Clubs = [
    {
      ...ctx.club,
      club: ctx.club.id,
      short: ctx.club.name.slice(0, 3).toUpperCase(),
      trialEnds: ctx.club.trial_ends,
      renewAt: ctx.club.renew_at,
      groupLabel: ctx.club.group_label,
    },
  ];
  records["Audit logs"] = (
    await db()
      .prepare(
        "SELECT id,club,actor,action as name,detail,created_at as date FROM cv_audit WHERE club=? ORDER BY created_at DESC LIMIT 200",
      )
      .bind(ctx.club.id)
      .all<any>()
  ).results;
  const data: DB = {
    records,
    fee: { ...NO_FEE },
    websites: {
      [ctx.club.id]: {
        title: ctx.club.name,
        headline: "",
        about: "",
        ...JSON.parse(ctx.club.website),
      },
    },
  };
  return {
    ...ctx,
    data,
    revision: ctx.club.revision,
    who: ctx.club.id,
    exists: true,
  };
}
export async function commitStore(
  store: Awaited<ReturnType<typeof loadStore>>,
  next: DB,
  message = "Workspace update",
) {
  const statements: D1PreparedStatement[] = [];
  // Guard the whole transaction; a failed CHECK aborts and rolls back every record change.
  statements.push(
    db()
      .prepare(
        "INSERT INTO cv_revision_guard(value) SELECT CASE WHEN revision=? THEN 1 ELSE 0 END FROM cv_clubs WHERE id=?",
      )
      .bind(store.revision, store.club.id),
  );
  statements.push(
    db()
      .prepare(
        "UPDATE cv_clubs SET revision=revision+1 WHERE id=? AND revision=?",
      )
      .bind(store.club.id, store.revision),
  );
  for (const mod of MODULES.filter(
    (m) => !["Clubs", "Audit logs", "Projects"].includes(m),
  )) {
    const old = new Map(store.data.records[mod].map((r) => [r.id, r]));
    const incoming = new Map((next.records[mod] || []).map((r) => [r.id, r]));
    for (const [id, r] of incoming) {
      if (new TextEncoder().encode(JSON.stringify(r)).length > 24000)
        throw new ApiError(413, "This record is too long. Shorten the notes.");
      if (r.club !== store.club.id)
        throw new ApiError(403, "These records belong to another workspace.");
      if (JSON.stringify(old.get(id)) === JSON.stringify(r)) continue;
      if (old.has(id))
        statements.push(
          db()
            .prepare(
              "INSERT INTO cv_record_history(id,club,module,record_id,payload,actor,created_at) VALUES(?,?,?,?,?,?,?)",
            )
            .bind(
              uid(),
              store.club.id,
              mod,
              id,
              JSON.stringify(old.get(id)),
              store.identity.email,
              now(),
            ),
        );
      statements.push(
        db()
          .prepare(
            "INSERT INTO cv_records(club,module,id,payload) VALUES(?,?,?,?) ON CONFLICT(club,module,id) DO UPDATE SET payload=excluded.payload",
          )
          .bind(store.club.id, mod, id, JSON.stringify(r)),
      );
    }
    for (const [id, r] of old)
      if (!incoming.has(id)) {
        statements.push(
          db()
            .prepare(
              "INSERT INTO cv_record_history(id,club,module,record_id,payload,actor,created_at) VALUES(?,?,?,?,?,?,?)",
            )
            .bind(
              uid(),
              store.club.id,
              mod,
              id,
              JSON.stringify(r),
              store.identity.email,
              now(),
            ),
        );
        statements.push(
          db()
            .prepare(
              "DELETE FROM cv_records WHERE club=? AND module=? AND id=?",
            )
            .bind(store.club.id, mod, id),
        );
      }
  }
  statements.push(
    db()
      .prepare(
        "INSERT INTO cv_audit(id,club,actor,action,detail,created_at) VALUES(?,?,?,?,?,?)",
      )
      .bind(uid(), store.club.id, store.identity.email, message, "", now()),
  );
  statements.push(db().prepare("DELETE FROM cv_revision_guard"));
  try {
    await db().batch(statements);
  } catch (e) {
    if (String(e).includes("CHECK constraint"))
      throw new ApiError(
        409,
        "Records changed. Refresh and retry your changes.",
      );
    throw e;
  }
  return store.revision + 1;
}
export const escapeHtml = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export async function sendInvite(id: string) {
  const mail = await db()
    .prepare("SELECT * FROM cv_outbox WHERE id=?")
    .bind(id)
    .first<any>();
  if (!mail || mail.status === "Sent") return;
  const invite = mail.invite_id
    ? await db()
        .prepare("SELECT * FROM cv_invites WHERE id=?")
        .bind(mail.invite_id)
        .first<any>()
    : null;
  if (
    !invite ||
    invite.used_at ||
    invite.revoked_at ||
    invite.expires < Date.now()
  ) {
    await db()
      .prepare("UPDATE cv_outbox SET status='Cancelled' WHERE id=?")
      .bind(id)
      .run();
    return;
  }
  const cfg = settings();
  if (!cfg.RESEND_API_KEY || !cfg.COURVIX_FROM_EMAIL) {
    await db()
      .prepare(
        "UPDATE cv_outbox SET status='Not configured',error='The email sender is not configured' WHERE id=?",
      )
      .bind(id)
      .run();
    return;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + cfg.RESEND_API_KEY,
        "Content-Type": "application/json",
        "Idempotency-Key": id,
      },
      body: JSON.stringify({
        from: cfg.COURVIX_FROM_EMAIL,
        to: mail.to_email,
        subject: mail.subject,
        html: mail.html,
      }),
    });
    if (!response.ok) throw Error("Email provider status " + response.status);
    await db()
      .prepare(
        "UPDATE cv_outbox SET status='Sent',attempts=attempts+1,error=NULL,sent_at=? WHERE id=?",
      )
      .bind(now(), id)
      .run();
  } catch (e) {
    await db()
      .prepare(
        "UPDATE cv_outbox SET status='Failed',attempts=attempts+1,error=? WHERE id=?",
      )
      .bind(e instanceof Error ? e.message : "Delivery failed", id)
      .run();
  }
}
