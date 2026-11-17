import {
  viewer,
  db,
  json,
  failure,
  body,
  clean,
  ApiError,
  limit,
  uid,
  now,
  audit,
} from "@/lib/v1";
import { organizationOwner, organizationOverview } from "@/lib/organization";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const u = await viewer(req);
    return json(await organizationOverview(u.id));
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const b = await body(req),
      u = await viewer(req);
    await limit(req, "organization", 20);
    if (b.action === "create") {
      const name = clean(b.name),
        kind = clean(b.kind) || "Club";
      if (!name || !["Club", "Trainer"].includes(kind))
        throw new ApiError(422, "Complete the business name and type.");
      const count = await db()
        .prepare("SELECT COUNT(*) as n FROM cv_organizations WHERE owner=?")
        .bind(u.id)
        .first<any>();
      if (count.n >= 10)
        throw new ApiError(
          409,
          "Each account can create up to ten organizations. Contact support for help.",
        );
      const id = uid();
      await db()
        .prepare(
          "INSERT INTO cv_organizations(id,owner,name,kind,created_at) VALUES(?,?,?,?,?)",
        )
        .bind(id, u.id, name, kind, now())
        .run();
      return json({ ok: true, id }, 201);
    }
    const org = await organizationOwner(clean(b.organizationId), u.id);
    if (b.action === "rename") {
      const name = clean(b.name);
      if (!name) throw new ApiError(422, "Enter the organization name.");
      await db()
        .prepare("UPDATE cv_organizations SET name=? WHERE id=? AND owner=?")
        .bind(name, org.id, u.id)
        .run();
      return json({ ok: true });
    }
    if (b.action === "attach") {
      const club = clean(b.club);
      const owned = await db()
        .prepare(
          "SELECT c.id,c.organization_id FROM cv_clubs c JOIN cv_memberships m ON m.club=c.id WHERE c.id=? AND m.user_id=? AND m.role='Owner' AND m.active=1",
        )
        .bind(club, u.id)
        .first<any>();
      if (!owned || owned.organization_id)
        throw new ApiError(
          403,
          "Choose an owned workspace that is not linked to an organization.",
        );
      const changed = await db()
        .prepare(
          "UPDATE cv_clubs SET organization_id=?,revision=revision+1 WHERE id=? AND organization_id IS NULL AND EXISTS(SELECT 1 FROM cv_memberships WHERE club=? AND user_id=? AND role='Owner' AND active=1)",
        )
        .bind(org.id, club, club, u.id)
        .run();
      if (!changed.meta.changes)
        throw new ApiError(
          409,
          "Workspace access or organization changed. Refresh and try again.",
        );
      await audit(club, u.email, "Cabang ditautkan ke ruang utama", org.name);
      return json({ ok: true });
    }
    throw new ApiError(404, "Action unavailable.");
  } catch (e) {
    return failure(e);
  }
}
