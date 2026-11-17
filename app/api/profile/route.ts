import {requireFeature} from "@/lib/access-control-server";
import {
  db,
  loadStore,
  commitStore,
  ApiError,
  body,
  limit,
  writable,
  json,
  failure,
} from "@/lib/v1";
export const dynamic = "force-dynamic";
const fields = [
  "phone",
  "birthDate",
  "city",
  "parentName",
  "parentPhone",
  "emergencyName",
  "emergencyPhone",
  "position",
  "jersey",
  "licenseName",
  "licenseIssuer",
  "licenseExpires",
  "experience",
  "specialty",
  "notes",
];
async function context(req: Request) {
  const s = await loadStore(req),
    u = new URL(req.url),
    kind = u.searchParams.get("kind") || "",
    subject = u.searchParams.get("subject");
  if (!["Members", "Coaches"].includes(kind))
    throw new ApiError(404, "Profile unavailable.");
  const base = s.data.records[kind].find((r) => r.id === subject);
  if (!base) throw new ApiError(404, "Profile unavailable.");
  const a = s.identity;
  requireFeature(a,kind,req.method === "PUT" && a.role === "Admin");
  if (
    a.role !== "Admin" &&
    !(
      (kind === "Members" && a.role === "Member" && a.member === subject) ||
      (kind === "Coaches" && a.role === "Coach" && a.coach === subject)
    )
  )
    throw new ApiError(403, "You do not have access to this profile.");
  return { s, kind, subject, base };
}
export async function GET(req: Request) {
  try {
    const { s, kind, subject, base } = await context(req);
    const user = await db()
      .prepare(
        "SELECT m.user_id,p.avatar_key,p.updated_at FROM cv_memberships m LEFT JOIN cv_user_profiles p ON p.user_id=m.user_id WHERE m.club=? AND m.subject=? AND m.active=1 LIMIT 1",
      )
      .bind(s.club.id, subject)
      .first<any>();
    return json({
      base: {
        ...base,
        avatarUrl: user?.avatar_key
          ? `/api/account?photo=${encodeURIComponent(user.user_id)}&v=${encodeURIComponent(user.updated_at)}`
          : "",
      },
      sport: s.club.sport,
      profile:
        s.data.records.Profiles.find(
          (p) => p.id === subject && p.kind === kind,
        ) || {},
      documents: [],
      documentsEnabled: false,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(req: Request) {
  try {
    const b = await body(req, 16000);
    await limit(req, "profile", 30);
    const { s, kind, subject, base } = await context(req);
    writable(s.club);
    const p: any = { id: subject, club: s.club.id, kind };
    for (const k of fields) {
      if (b[k] !== undefined && typeof b[k] !== "string")
        throw new ApiError(422, "Invalid profile fields.");
      p[k] = (b[k] || "").trim().slice(0, k === "notes" ? 1000 : 300);
    }
    for (const k of ["birthDate", "licenseExpires"])
      if (
        p[k] &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(p[k]) ||
          !Number.isFinite(Date.parse(p[k])))
      )
        throw new ApiError(422, "Invalid date.");
    const next = structuredClone(s.data);
    const i = next.records.Profiles.findIndex(
      (r) => r.id === subject && r.kind === kind,
    );
    if (i < 0) next.records.Profiles.push(p);
    else next.records.Profiles[i] = p;
    await commitStore(s, next, "Profile updated · " + base.name);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
async function discardUnsupportedBody(req: Request) {
  const reader = req.body?.getReader();
  if (!reader) return;
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 16000) {
        await reader.cancel();
        break;
      }
    }
  } catch {
    /* A disconnected sender must not enable the upload action. */
  }
}
export async function POST(req: Request) {
  await discardUnsupportedBody(req);
  return json(
    { error: "Private document uploads are not enabled in V1.0." },
    405,
  );
}
export async function DELETE(req: Request) {
  await discardUnsupportedBody(req);
  return json(
    { error: "Private document uploads are not enabled in V1.0." },
    405,
  );
}
