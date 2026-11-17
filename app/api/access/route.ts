import { canFeature } from "@/lib/feature-access";
import { requireInviteRole, grantable, membershipStatements, inheritedPermissions } from "@/lib/access-control-server";
import {
  canonicalSport,
  COUNTRIES,
  CURRENCIES,
  GROUPS,
  validTimezone,
} from "@/lib/sports";
import { validLocale } from "@/lib/locales";
import { organizationOwner } from "@/lib/organization";
import {
  ApiError,
  PLANS,
  db,
  viewer,
  memberships,
  context,
  clean,
  email,
  hash,
  token,
  uid,
  now,
  body,
  origin,
  limit,
  json,
  failure,
  ownerOnly,
  admin,
  writable,
  audit,
  escapeHtml,
  sendInvite,
  settings,
  localPreview,
  cookieValue,
} from "@/lib/v1";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const who = await viewer(req),
      clubs = await memberships(who.id);
    let ctx = null;
    try {
      ctx = await context(req);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 403)) throw e;
    }
    let invites: any[] = [],
      users: any[] = [],
      billing: any[] = [],
      teams: any[] = [],
      outbox: any[] = [];
    if (ctx) {
      if (ctx.identity.role === "Admin" && canFeature(ctx.identity,"Access")) {
        invites = (
          await db()
            .prepare(
              "SELECT id,email,name,role,team,expires,used_at,revoked_at FROM cv_invites WHERE club=? ORDER BY created_at DESC",
            )
            .bind(ctx.club.id)
            .all()
        ).results;
        users = (
          await db()
            .prepare(
              "SELECT m.id,m.role,m.team,m.active,COALESCE(NULLIF(p.display_name,''),u.name) as name,u.email,u.id as user_id,p.avatar_key,p.updated_at FROM cv_memberships m JOIN cv_users u ON u.id=m.user_id LEFT JOIN cv_user_profiles p ON p.user_id=u.id WHERE m.club=? ORDER BY m.role,u.name",
            )
            .bind(ctx.club.id)
            .all()
        ).results.map((row: any) => {
          const { avatar_key, updated_at, ...safe } = row;
          return {
            ...safe,
            avatarUrl: avatar_key
              ? `/api/account?photo=${encodeURIComponent(row.user_id)}&v=${encodeURIComponent(updated_at)}`
              : "",
          };
        });
        outbox = (
          await db()
            .prepare(
              "SELECT id,to_email,subject,status,error,created_at FROM cv_outbox WHERE club=? ORDER BY created_at DESC LIMIT 30",
            )
            .bind(ctx.club.id)
            .all()
        ).results;
      }
      if (ctx.identity.isOwner)
        billing = (
          await db()
            .prepare(
              "SELECT * FROM cv_billing WHERE club=? ORDER BY created_at DESC",
            )
            .bind(ctx.club.id)
            .all()
        ).results;
      teams = (
        await db()
          .prepare(
            "SELECT payload FROM cv_records WHERE club=? AND module='Teams'",
          )
          .bind(ctx.club.id)
          .all<any>()
      ).results.map((r) => JSON.parse(r.payload));
    }
    return json({
      viewer: who,
      session: ctx?.identity || null,
      clubs,
      club: ctx?.club || null,
      invites,
      users,
      billing,
      teams,
      outbox,
      plans: PLANS,
      localPreview: localPreview(req),
      emailConfigured: !!settings().RESEND_API_KEY,
      subscriptionBank: {
        bank: settings().COURVIX_BANK_NAME || "",
        account: settings().COURVIX_BANK_ACCOUNT || "",
        holder: settings().COURVIX_BANK_HOLDER || "",
      },
      supportEmail: settings().COURVIX_SUPPORT_EMAIL || "courvix.id@gmail.com",
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401)
      return json(
        {
          viewer: null,
          session: null,
          clubs: [],
          localPreview: localPreview(req),
        },
        200,
      );
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const b = await body(req);
    await limit(req, "access", 60);
    const who = await viewer(req);
    if (b.action === "login")
      throw new ApiError(
        410,
        "Sign in to your Courvix account to continue.",
      );
    if (b.action === "logout") {
      if (localPreview(req)) {
        const t = cookieValue(req, "courvix_dev_session");
        if (t)
          await db()
            .prepare("DELETE FROM cv_dev_sessions WHERE token_hash=?")
            .bind(await hash(t))
            .run();
        return json({ ok: true }, 200, {
          "Set-Cookie":
            "courvix_dev_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
        });
      }
      return json({ ok: true }, 200, {
        "Set-Cookie":
          "courvix_club=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      });
    }
    if (b.action === "register") {
      if (b.terms !== true && b.terms !== "on")
        throw new ApiError(
          422,
          "Accept the terms and privacy policy to create a workspace.",
        );
      const name = clean(b.clubName),
        sport = canonicalSport(clean(b.sport, 80)),
        plan = clean(b.plan),
        group = clean(b.groupLabel, 30) || "Kelompok",
        zone = clean(b.timezone) || "Asia/Jakarta";
      if (
        !name ||
        !sport ||
        !PLANS[plan] ||
        !validTimezone(zone) ||
        !GROUPS.includes(group)
      )
        throw new ApiError(
          422,
          "Complete the workspace name, sport, time zone and plan.",
        );
      if (
        (await memberships(who.id)).filter((m) => m.role === "Owner").length >=
        25
      )
        throw new ApiError(
          409,
          "Contact support to create more than 25 locations.",
        );
      const kind = clean(b.workspaceType) || "Club",
        country = clean(b.country) || "ID",
        currency = clean(b.currency) || "IDR",
        locale = "en";
      if (
        !["Club", "Trainer"].includes(kind) ||
        !COUNTRIES.includes(country) ||
        !CURRENCIES.includes(currency) ||
        !validLocale(locale)
      )
        throw new ApiError(
          422,
          "Choose a valid product, country and currency.",
        );
      const orgId = clean(b.organizationId) || uid();
      if (b.organizationId) await organizationOwner(orgId, who.id);
      const id = uid(),
        trial = new Date(Date.now() + 14 * 86400000).toISOString();
      const organizationQueries: D1PreparedStatement[] = b.organizationId
        ? []
        : [
            db()
              .prepare(
                "INSERT INTO cv_organizations(id,owner,name,kind,created_at) VALUES(?,?,?,?,?)",
              )
              .bind(
                orgId,
                who.id,
                clean(b.organizationName) || name,
                kind,
                now(),
              ),
          ];
      await db().batch([
        ...organizationQueries,
        db()
          .prepare(
            "INSERT INTO cv_clubs(id,name,sport,timezone,group_label,plan,status,trial_ends,organization_id,workspace_type,country,currency,locale,location,created_at) VALUES(?,?,?,?,?,?,'Trial',?,?,?,?,?,?,?,?)",
          )
          .bind(
            id,
            name,
            sport,
            zone,
            group,
            plan,
            trial,
            orgId,
            kind,
            country,
            currency,
            locale,
            clean(b.location),
            now(),
          ),
        db()
          .prepare(
            "INSERT INTO cv_memberships(id,club,user_id,role) VALUES(?,?,?,'Owner')",
          )
          .bind(uid(), id, who.id),
      ]);
      await audit(
        id,
        who.email,
        "Workspace created",
        "14-day trial; plan " + plan,
      );
      return json({ ok: true, club: id }, 201, {
        "Set-Cookie": clubCookie(req, id),
      });
    }
    if (b.action === "join") {
      const code = clean(b.code, 200), invitationId=clean(b.invitationId,150);
      if (!code&&!invitationId) throw new ApiError(422, "The invitation link is incomplete.");
      const i = await db().prepare(code?"SELECT * FROM cv_invites WHERE token_hash=?":"SELECT * FROM cv_invites WHERE id=? AND email=?")
        .bind(...(code?[await hash(code)]:[invitationId,who.email])).first<any>();
      if (!i || i.used_at || i.revoked_at || i.expires < Date.now())
        throw new ApiError(
          410,
          "This invitation expired, was already used or was revoked. Request a new one.",
        );
      if (i.email !== who.email)
        throw new ApiError(
          403,
          "This invitation is addressed to " +
            i.email +
            ". Sign in using that verified email address.",
        );
      if (
        await db()
          .prepare(
            "SELECT id FROM cv_memberships WHERE club=? AND user_id=? AND active=1",
          )
          .bind(i.club, who.id)
          .first()
      )
        throw new ApiError(409, "You already belong to this workspace.");
      const club = await db()
        .prepare("SELECT * FROM cv_clubs WHERE id=?")
        .bind(i.club)
        .first<any>();
      writable(club);
      const permissions=await inheritedPermissions(i.club,i.role,i.permissions);
      const statements: D1PreparedStatement[] = [
        db().prepare("INSERT INTO cv_revision_guard(value) VALUES(COALESCE((SELECT CASE WHEN used_at IS NULL AND revoked_at IS NULL AND expires>? THEN 1 ELSE 0 END FROM cv_invites WHERE id=? AND email=?),0))").bind(Date.now(),i.id,who.email),
        ...(await membershipStatements(club,who,i.role,i.team,permissions)),
      ];
      statements.push(
        db()
          .prepare("UPDATE cv_invites SET used_at=? WHERE id=?")
          .bind(now(), i.id),
      );
      statements.push(
        db()
          .prepare("UPDATE cv_clubs SET revision=revision+1 WHERE id=?")
          .bind(i.club),
      );
      statements.push(db().prepare("DELETE FROM cv_revision_guard"));
      await db().batch(statements);
      await audit(i.club, who.email, "Invitation accepted", i.role);
      return json({ ok: true }, 200, { "Set-Cookie": clubCookie(req, i.club) });
    }
    if (b.action === "switch") {
      if (!(await memberships(who.id)).some((m) => m.club === b.club))
        throw new ApiError(
          403,
          "This workspace is unavailable to your account.",
        );
      return json({ ok: true }, 200, { "Set-Cookie": clubCookie(req, b.club) });
    }
    const ctx = await context(req),
      a = ctx.identity;
    if (b.action === "invite") {
      admin(a);
      writable(ctx.club);
      const role = clean(b.role),
        address = email(b.email),
        name = clean(b.name) || address.split("@")[0];
      requireInviteRole(a,role);
      const permissions=await grantable(a,role,b.permissions||{});
      if (
        !["Admin", "Coach", "Member"].includes(role) ||
        !/^\S+@\S+\.\S+$/.test(address)
      )
        throw new ApiError(422, "Invalid invitation email or role.");
      if (address === who.email)
        throw new ApiError(409, "You already have access to this workspace.");
      const team =
        role === "Admin" || ctx.club.workspace_type === "Trainer"
          ? null
          : clean(b.team);
      if (
        role !== "Admin" &&
        ctx.club.workspace_type !== "Trainer" &&
        !(await db()
          .prepare(
            "SELECT id FROM cv_records WHERE club=? AND module='Teams' AND id=?",
          )
          .bind(ctx.club.id, team)
          .first())
      )
        throw new ApiError(422, "Choose an existing group.");
      const existing = (
        await db()
          .prepare("SELECT payload FROM cv_records WHERE club=? AND module=?")
          .bind(ctx.club.id, role === "Coach" ? "Coaches" : "Members")
          .all<any>()
      ).results
        .map((r) => JSON.parse(r.payload))
        .find((r) => email(r.email) === address);
      if (existing && role !== "Admin") {
        if (
          ctx.club.workspace_type !== "Trainer" &&
          existing.team &&
          existing.team !== team
        )
          throw new ApiError(
            409,
            "The invitation group must match the existing profile.",
          );
        if (existing.status !== "Active")
          throw new ApiError(
            409,
            "Activate the profile before sending an invitation.",
          );
      }
      if (
        await db()
          .prepare(
            "SELECT m.id FROM cv_memberships m JOIN cv_users u ON u.id=m.user_id WHERE m.club=? AND u.email=? AND m.active=1",
          )
          .bind(ctx.club.id, address)
          .first()
      )
        throw new ApiError(409, "This email already has active access.");
      await db()
        .prepare(
          "UPDATE cv_invites SET revoked_at=? WHERE club=? AND email=? AND used_at IS NULL AND revoked_at IS NULL AND expires<?",
        )
        .bind(now(), ctx.club.id, address, Date.now())
        .run();
      if (
        await db()
          .prepare(
            "SELECT id FROM cv_invites WHERE club=? AND email=? AND used_at IS NULL AND revoked_at IS NULL",
          )
          .bind(ctx.club.id, address)
          .first()
      )
        throw new ApiError(
          409,
          "An active invitation already exists. Resend or revoke it.",
        );
      const code = token(),
        id = uid(),
        mailId = uid(),
        url = new URL("/join", req.url);
      url.searchParams.set("code", code);
      const roleName =
        ctx.club.workspace_type === "Trainer"
          ? role === "Member"
            ? "Client"
            : role === "Coach"
              ? "Trainer"
              : role
          : role;
      const html = `<p>You are invited as ${escapeHtml(roleName)} at ${escapeHtml(ctx.club.name)}.</p><p><a href="${escapeHtml(url.href)}">Accept your Courvix invitation</a></p><p>Sign in using the verified email ${escapeHtml(address)}. This single-use link expires in seven days.</p>`;
      await db().batch([
        db()
          .prepare(
            "INSERT INTO cv_invites(id,club,email,name,role,team,subject,token_hash,expires,created_by,created_at,permissions) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
          )
          .bind(
            id,
            ctx.club.id,
            address,
            name,
            role,
            team,
            role === "Admin" ? null : existing?.id || null,
            await hash(code),
            Date.now() + 7 * 86400000,
            who.id,
            now(),
            JSON.stringify(permissions),
          ),
        db()
          .prepare(
            "INSERT INTO cv_outbox(id,club,to_email,subject,html,status,created_at,invite_id) VALUES(?,?,?,?,?,'Pending',?,?)",
          )
          .bind(
            mailId,
            ctx.club.id,
            address,
            "Invitation " + ctx.club.name + " — Courvix",
            html,
            now(),
            id,
          ),
      ]);
      await sendInvite(mailId);
      await audit(
        ctx.club.id,
        who.email,
        "Invitation created",
        address + " · " + role,
      );
      return json(
        {
          ok: true,
          inviteUrl: url.href,
          delivery: (
            await db()
              .prepare("SELECT status FROM cv_outbox WHERE id=?")
              .bind(mailId)
              .first<any>()
          )?.status,
        },
        201,
      );
    }
    if (b.action === "revoke") {
      admin(a);
      const i = await db()
        .prepare("SELECT * FROM cv_invites WHERE id=? AND club=?")
        .bind(b.id, ctx.club.id)
        .first<any>();
      if (!i || i.used_at) throw new ApiError(404, "Invitation unavailable.");
      requireInviteRole(a,i.role);
      await db()
        .prepare("UPDATE cv_invites SET revoked_at=? WHERE id=?")
        .bind(now(), i.id)
        .run();
      await audit(ctx.club.id, who.email, "Invitation revoked", i.email);
      return json({ ok: true });
    }
    if (b.action === "resend") {
      admin(a);
      const mail = await db()
        .prepare("SELECT * FROM cv_outbox WHERE id=? AND club=?")
        .bind(b.id, ctx.club.id)
        .first<any>();
      if (!mail) throw new ApiError(404, "This email is unavailable.");
      const invite = await db()
        .prepare(
          "SELECT * FROM cv_invites WHERE id=? AND club=? AND used_at IS NULL AND revoked_at IS NULL AND expires>?",
        )
        .bind(mail.invite_id, ctx.club.id, Date.now())
        .first<any>();
      if (!invite)
        throw new ApiError(
          410,
          "Create a new invitation; the previous invitation is inactive.",
        );
      requireInviteRole(a,invite.role);
      await sendInvite(mail.id);
      return json({ ok: true });
    }
    if (b.action === "revoke-user" || b.action === "transfer-owner") {
      ownerOnly(a);
      const target = await db()
        .prepare(
          "SELECT * FROM cv_memberships WHERE id=? AND club=? AND active=1",
        )
        .bind(b.id, ctx.club.id)
        .first<any>();
      if (!target || target.role === "Owner")
        throw new ApiError(
          409,
          "The owner cannot be revoked. Transfer ownership first.",
        );
      if (b.action === "transfer-owner") {
        if (target.role !== "Admin" || b.confirm !== ctx.club.name)
          throw new ApiError(
            422,
            "Choose an active admin and type the workspace name to confirm.",
          );
        await db().batch([
          db()
            .prepare(
              "INSERT INTO cv_revision_guard(value) SELECT CASE WHEN role='Owner' AND active=1 THEN 1 ELSE 0 END FROM cv_memberships WHERE id=?",
            )
            .bind(a.id),
          db()
            .prepare(
              "INSERT INTO cv_revision_guard(value) SELECT CASE WHEN role='Admin' AND active=1 THEN 1 ELSE 0 END FROM cv_memberships WHERE id=?",
            )
            .bind(target.id),
          db()
            .prepare("UPDATE cv_memberships SET role='Admin' WHERE id=?")
            .bind(a.id),
          db()
            .prepare("UPDATE cv_memberships SET role='Owner' WHERE id=?")
            .bind(target.id),
          db()
            .prepare(
              "UPDATE cv_clubs SET organization_id=NULL,revision=revision+1 WHERE id=?",
            )
            .bind(ctx.club.id),
          db().prepare("DELETE FROM cv_revision_guard"),
        ]);
      } else
        await db().batch([
          db()
            .prepare(
              "INSERT INTO cv_revision_guard(value) SELECT CASE WHEN role='Owner' AND active=1 THEN 1 ELSE 0 END FROM cv_memberships WHERE id=?",
            )
            .bind(a.id),
          db()
            .prepare(
              "INSERT INTO cv_revision_guard(value) SELECT CASE WHEN role!='Owner' AND active=1 THEN 1 ELSE 0 END FROM cv_memberships WHERE id=?",
            )
            .bind(target.id),
          db()
            .prepare("UPDATE cv_memberships SET active=0 WHERE id=?")
            .bind(target.id),
          db()
            .prepare("UPDATE cv_clubs SET revision=revision+1 WHERE id=?")
            .bind(ctx.club.id),
          db().prepare("DELETE FROM cv_revision_guard"),
        ]);
      await audit(
        ctx.club.id,
        who.email,
        b.action === "transfer-owner"
          ? "Kepemilikan ditransfer"
          : "User access revoked",
        target.id,
      );
      return json({ ok: true });
    }
    if (b.action === "settings") {
      ownerOnly(a);
      writable(ctx.club);
      const name = clean(b.clubName),
        group = clean(b.groupLabel),
        zone = clean(b.timezone);
      if (!name || !GROUPS.includes(group) || !validTimezone(zone))
        throw new ApiError(422, "Invalid workspace settings.");
      const country = clean(b.country) || ctx.club.country,
        locale = "en";
      if (!COUNTRIES.includes(country) || !validLocale(locale))
        throw new ApiError(422, "Invalid country setting.");
      await db()
        .prepare(
          "UPDATE cv_clubs SET name=?,group_label=?,timezone=?,bank_name=?,bank_account=?,bank_holder=?,country=?,locale=?,location=?,revision=revision+1 WHERE id=?",
        )
        .bind(
          name,
          group,
          zone,
          clean(b.bankName, 80),
          clean(b.bankAccount, 40),
          clean(b.bankHolder),
          country,
          locale,
          clean(b.location) || ctx.club.location,
          ctx.club.id,
        )
        .run();
      await audit(ctx.club.id, who.email, "Workspace settings updated");
      return json({ ok: true });
    }
    if (b.action === "subscribe") {
      ownerOnly(a);
      if (!PLANS[b.plan]) throw new ApiError(422, "Plan unavailable.");
      if (
        await db()
          .prepare(
            "SELECT id FROM cv_billing WHERE club=? AND status IN ('Pending','Review')",
          )
          .bind(ctx.club.id)
          .first()
      )
        throw new ApiError(
          409,
          "Resolve the open subscription invoice before creating another.",
        );
      const id = uid();
      await db()
        .prepare(
          "INSERT INTO cv_billing(id,club,plan,amount,status,created_at) VALUES(?,?,?,?,'Pending',?)",
        )
        .bind(id, ctx.club.id, b.plan, PLANS[b.plan], now())
        .run();
      await audit(
        ctx.club.id,
        who.email,
        "Subscription invoice created",
        b.plan,
      );
      return json({ ok: true }, 201);
    }
    if (b.action === "subscription-proof") {
      ownerOnly(a);
      if (
        !settings().COURVIX_BANK_ACCOUNT ||
        !settings().COURVIX_BANK_HOLDER ||
        !settings().COURVIX_BANK_NAME
      )
        throw new ApiError(
          503,
          "Subscription bank details are not configured. Contact support before transferring.",
        );
      const ref = clean(b.reference),
        note = clean(b.note, 1000);
      if (ref.length < 4)
        throw new ApiError(
          422,
          "Enter a transfer reference of at least four characters.",
        );
      const r = await db()
        .prepare(
          "UPDATE cv_billing SET status='Review',reference=?,note=? WHERE id=? AND club=? AND status IN ('Pending','Rejected')",
        )
        .bind(ref, note, b.id, ctx.club.id)
        .run();
      if (!r.meta.changes)
        throw new ApiError(409, "This invoice cannot be submitted.");
      await audit(
        ctx.club.id,
        who.email,
        "Subscription payment submitted",
        b.id,
      );
      return json({ ok: true });
    }
    if (b.action === "cancel-subscription-invoice") {
      ownerOnly(a);
      const r = await db()
        .prepare(
          "UPDATE cv_billing SET status='Cancelled' WHERE id=? AND club=? AND status IN ('Pending','Rejected')",
        )
        .bind(b.id, ctx.club.id)
        .run();
      if (!r.meta.changes)
        throw new ApiError(409, "This invoice cannot be cancelled.");
      return json({ ok: true });
    }
    throw new ApiError(404, "Action unavailable.");
  } catch (e) {
    return failure(e);
  }
}
function clubCookie(req: Request, id: string) {
  return (
    "courvix_club=" +
    id +
    "; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000" +
    (new URL(req.url).protocol === "https:" ? "; Secure" : "")
  );
}
