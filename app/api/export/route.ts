import { requireFeature } from "@/lib/access-control-server";
import { canFeature } from "@/lib/feature-access";
import { loadStore, json, failure, db } from "@/lib/v1";
import { scoped } from "@/lib/access-policy";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const s = await loadStore(req);
    requireFeature(s.identity,"Reports");
    return json(
      {
        exportedAt: new Date().toISOString(),
        club: s.club.name,
        data: scoped(s.data, s.identity),
        renewalChoices:
          s.identity.role === "Coach" || !canFeature(s.identity,"Invoices")
            ? []
            : (
                await db()
                  .prepare(
                    "SELECT member,period,decision,note,updated_at FROM cv_renewal_choices WHERE club=?" +
                      (s.identity.role === "Member" ? " AND member=?" : ""),
                  )
                  .bind(
                    s.club.id,
                    ...(s.identity.role === "Member"
                      ? [s.identity.member]
                      : []),
                  )
                  .all()
              ).results,
      },
      200,
      { "Content-Disposition": 'attachment; filename="courvix-export.json"' },
    );
  } catch (e) {
    return failure(e);
  }
}
