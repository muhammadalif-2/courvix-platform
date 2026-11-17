import { RELEASE_VERSION } from "@/lib/release-readiness";
import { db, json } from "@/lib/v1";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await db().prepare("SELECT id FROM cv_clubs LIMIT 1").first();
    return json({ status: "ok", version: RELEASE_VERSION });
  } catch {
    return json({ status: "unavailable" }, 503);
  }
}
