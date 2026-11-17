import {
  localPreview,
  db,
  hash,
  token,
  body,
  limit,
  clean,
  email,
  now,
  json,
  ApiError,
  failure,
} from "@/lib/v1";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    if (!localPreview(req)) throw new ApiError(404, "Page unavailable.");
    const b = await body(req);
    await limit(req, "local-login", 20);
    const address = email(b.email),
      name = clean(b.name);
    if (!/^\S+@\S+\.\S+$/.test(address) || !name)
      throw new ApiError(422, "Enter a name and email for local testing.");
    const t = token();
    await db()
      .prepare(
        "INSERT INTO cv_dev_sessions(token_hash,email,name,expires) VALUES(?,?,?,?)",
      )
      .bind(await hash(t), address, name, Date.now() + 86400000)
      .run();
    return json({ ok: true }, 200, {
      "Set-Cookie":
        "courvix_dev_session=" +
        t +
        "; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400",
    });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    if (!localPreview(req)) throw new ApiError(404, "Unavailable.");
    await body(req);
    return json({ ok: true }, 200, {
      "Set-Cookie":
        "courvix_dev_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    });
  } catch (e) {
    return failure(e);
  }
}
