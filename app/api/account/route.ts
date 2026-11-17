import {canFeature,effectivePermissions} from "@/lib/feature-access";
import { env } from "cloudflare:workers";
import {
  viewer,
  db,
  json,
  failure,
  body,
  clean,
  ApiError,
  limit,
  origin,
  now,
  uid,
  memberships,
} from "@/lib/v1";
import { canonicalSport, COUNTRIES, validTimezone } from "@/lib/sports";
import { validLocale } from "@/lib/locales";
export const dynamic = "force-dynamic";
const bucket = () => {
  const b = (env as any).BUCKET as R2Bucket;
  if (!b) throw new ApiError(503, "Photo storage is unavailable.");
  return b;
};
export async function GET(req: Request) {
  try {
    const u = await viewer(req),
      url = new URL(req.url),
      photo = url.searchParams.get("photo"),
      person = url.searchParams.get("user");
    const target = photo || person || u.id;
    if (target !== u.id && !u.platformAdmin) {
      const allowed = await db()
        .prepare(
          `SELECT mine.club,mine.role,mine.permissions,peer.role as peer_role FROM cv_memberships mine JOIN cv_memberships peer ON peer.club=mine.club
   WHERE mine.user_id=? AND peer.user_id=? AND mine.active=1 AND peer.active=1 AND (mine.role IN ('Owner','Admin') OR (mine.role='Coach' AND EXISTS(SELECT 1 FROM cv_clubs c WHERE c.id=mine.club AND c.workspace_type='Trainer' AND (EXISTS(SELECT 1 FROM cv_records r WHERE r.club=mine.club AND r.module='Members' AND r.id=peer.subject AND json_extract(r.payload,'$.coachId')=mine.subject) OR EXISTS(SELECT 1 FROM cv_records r WHERE r.club=mine.club AND r.module='PTSessions' AND json_extract(r.payload,'$.client')=peer.subject AND json_extract(r.payload,'$.coachId')=mine.subject)))) OR (mine.role='Coach' AND COALESCE((SELECT json_extract(payload,'$.team') FROM cv_records WHERE club=peer.club AND id=peer.subject AND module='Members'),peer.team) IN (SELECT id FROM cv_records WHERE club=mine.club AND module='Teams' AND (id=mine.team OR json_extract(payload,'$.coachId')=mine.subject)))) LIMIT 1`,
        )
        .bind(u.id, target)
        .first<any>();
      if (allowed) {
        const defaults=await db().prepare("SELECT permissions FROM cv_role_defaults WHERE club=? AND role=?").bind(allowed.club,allowed.role).first<any>();
        const a={role:allowed.role,isOwner:allowed.role==="Owner",permissions:effectivePermissions(allowed.role,defaults?.permissions,allowed.permissions)};
        if(!canFeature(a,allowed.peer_role==="Coach"?"Coaches":"Members"))throw new ApiError(403,"This profile is unavailable to your account.");
      }
      if (!allowed)
        throw new ApiError(403, "This profile is unavailable to your account.");
    }
    const p = await db()
      .prepare("SELECT * FROM cv_user_profiles WHERE user_id=?")
      .bind(target)
      .first<any>();
    if (photo) {
      if (!p?.avatar_key) throw new ApiError(404, "No photo is available.");
      const obj = await bucket().get(p.avatar_key);
      if (!obj) throw new ApiError(404, "No photo is available.");
      return new Response(obj.body, {
        headers: {
          "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
          "Cache-Control": "private, max-age=60",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const base =
      target === u.id
        ? u
        : await db()
            .prepare("SELECT id,name,email FROM cv_users WHERE id=?")
            .bind(target)
            .first<any>();
    if (!base) throw new ApiError(404, "Profile unavailable.");
    const canPrivate =
      target === u.id ||
      u.platformAdmin ||
      !!(await db()
        .prepare(
          "SELECT 1 FROM cv_memberships a JOIN cv_memberships b ON a.club=b.club WHERE a.user_id=? AND b.user_id=? AND a.active=1 AND b.active=1 AND a.role IN ('Owner','Admin') LIMIT 1",
        )
        .bind(u.id, target)
        .first());
    const profile = { ...p, ...(!canPrivate ? { phone: "", city: "" } : {}) };
    delete profile.avatar_key;
    const allMemberships = await memberships(target);
    const mine =
      target === u.id || u.platformAdmin ? [] : await memberships(u.id);
    const visibleMemberships =
      target === u.id || u.platformAdmin
        ? allMemberships
        : allMemberships.filter((m) => mine.some((own) => own.club === m.club));
    return json({
      user: base,
      profile,
      avatarUrl: p?.avatar_key
        ? `/api/account?photo=${encodeURIComponent(target)}&v=${encodeURIComponent(p.updated_at)}`
        : "",
      memberships: visibleMemberships,
      editable: target === u.id,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(req: Request) {
  try {
    const b = await body(req),
      u = await viewer(req);
    await limit(req, "account-profile", 25);
    const name = clean(b.displayName) || u.name,
      sport = clean(b.sport, 80),
      country = clean(b.country) || "ID",
      locale = "en",
      zone = clean(b.timezone) || "Asia/Jakarta";
    if (
      !COUNTRIES.includes(country) ||
      !validLocale(locale) ||
      !validTimezone(zone) ||
      (sport && !canonicalSport(sport))
    )
      throw new ApiError(
        422,
        "Choose a valid country, time zone and sport from the lists.",
      );
    await db()
      .prepare(
        `INSERT INTO cv_user_profiles(user_id,display_name,phone,city,country,bio,title,sport,locale,timezone,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,phone=excluded.phone,city=excluded.city,country=excluded.country,bio=excluded.bio,title=excluded.title,sport=excluded.sport,locale=excluded.locale,timezone=excluded.timezone,updated_at=excluded.updated_at`,
      )
      .bind(
        u.id,
        name,
        clean(b.phone, 40),
        clean(b.city),
        country,
        clean(b.bio, 1000),
        clean(b.title, 100),
        sport ? canonicalSport(sport) : "",
        locale,
        zone,
        now(),
      )
      .run();
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    origin(req);
    const u = await viewer(req);
    await limit(req, "account-photo", 15);
    if (!req.headers.get("content-type")?.startsWith("image/"))
      throw new ApiError(415, "Choose a JPG, PNG or WebP photo.");
    const reader = req.body?.getReader();
    if (!reader) throw new ApiError(422, "Choose a photo.");
    let size = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 150000) {
        await reader.cancel();
        throw new ApiError(
          413,
          "This photo is too large. Use a photo under 150 KB after resizing.",
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.length;
    }
    const png =
      bytes[0] === 137 &&
      bytes[1] === 80 &&
      bytes[2] === 78 &&
      bytes[3] === 71 &&
      bytes[4] === 13 &&
      bytes[5] === 10 &&
      bytes[6] === 26 &&
      bytes[7] === 10;
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
    if (size < 24 || !(png || jpeg || webp))
      throw new ApiError(422, "Invalid photo. Choose JPG, PNG or WebP.");
    const old = await db()
      .prepare("SELECT avatar_key FROM cv_user_profiles WHERE user_id=?")
      .bind(u.id)
      .first<any>();
    const key = `avatars/${uid()}`,
      mime = png ? "image/png" : jpeg ? "image/jpeg" : "image/webp";
    await bucket().put(key, bytes, { httpMetadata: { contentType: mime } });
    try {
      await db()
        .prepare(
          "INSERT INTO cv_user_profiles(user_id,avatar_key,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET avatar_key=excluded.avatar_key,updated_at=excluded.updated_at",
        )
        .bind(u.id, key, now())
        .run();
    } catch (e) {
      await bucket().delete(key);
      throw e;
    }
    if (old?.avatar_key)
      await bucket()
        .delete(old.avatar_key)
        .catch(() => {});
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    origin(req);
    const u = await viewer(req);
    await limit(req, "account-photo", 15);
    const p = await db()
      .prepare("SELECT avatar_key FROM cv_user_profiles WHERE user_id=?")
      .bind(u.id)
      .first<any>();
    await db()
      .prepare(
        "UPDATE cv_user_profiles SET avatar_key=NULL,updated_at=? WHERE user_id=?",
      )
      .bind(now(), u.id)
      .run();
    if (p?.avatar_key) await bucket().delete(p.avatar_key);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
