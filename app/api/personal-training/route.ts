import { canFeature } from "@/lib/feature-access";
import { requireFeature } from "@/lib/access-control-server";
import {
  loadStore,
  commitStore,
  body,
  limit,
  writable,
  json,
  failure,
  ApiError,
  db,
} from "@/lib/v1";
import { applyPT, trainerView, PTError } from "@/lib/personal-training";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const s = await loadStore(req);
    const value = trainerView(s.data, s.identity, new Date().toISOString());
    const directory = (
      await db()
        .prepare(
          "SELECT m.subject,m.user_id,p.avatar_key,p.updated_at FROM cv_memberships m LEFT JOIN cv_user_profiles p ON p.user_id=m.user_id WHERE m.club=? AND m.active=1",
        )
        .bind(s.club.id)
        .all<any>()
    ).results;
    value.clients = value.clients.map((c) => {
      const u = directory.find((u) => u.subject === c.id);
      return {
        ...c,
        avatarUrl: u?.avatar_key
          ? `/api/account?photo=${encodeURIComponent(u.user_id)}&v=${encodeURIComponent(u.updated_at)}`
          : "",
      };
    });
    const fields:Record<string,string>={clients:"Members",coaches:"Coaches",plans:"PTPlans",orders:"PTOrders",appointments:"PTSessions",classes:"PTClasses",credits:"PTCredits",support:"Support"};
    for(const [field,module] of Object.entries(fields))if(!canFeature(s.identity,module))(value as any)[field]=[];
    if(!canFeature(s.identity,"PTSettings"))(value as any).settings={};
    return json({
      ...value,
      revision: s.revision,
      readOnly: !(
        (s.club.status === "Trial" &&
          Date.parse(s.club.trial_ends) > Date.now()) ||
        (s.club.status === "Active" && Date.parse(s.club.renew_at) > Date.now())
      ),
    });
  } catch (e) {
    return failure(
      e instanceof PTError ? new ApiError(e.status, e.message) : e,
    );
  }
}
export async function POST(req: Request) {
  try {
    const b = await body(req, 16000);
    await limit(req, "personal-training", 80);
    const s = await loadStore(req);
    writable(s.club);
    const modules:Record<string,string>={support:"Support","save-plan":"PTPlans","save-client":"Members","save-trainer":"Coaches",order:"PTOrders","submit-payment":"PTOrders","review-payment":"PTOrders","cancel-order":"PTOrders",settings:"PTSettings","create-class":"PTClasses","update-class":"PTClasses",book:"PTSessions",confirm:"PTSessions",reschedule:"PTSessions",complete:"PTSessions","no-show":"PTSessions",cancel:"PTSessions","cancel-class":"PTClasses","correct-session":"PTSessions"};
    if(!modules[b.action])throw new ApiError(422,"Unknown training action.");
    requireFeature(s.identity,modules[b.action],true);
    if (b.revision !== s.revision)
      throw new ApiError(409, "Records changed. Refresh before trying again.");
    const next = structuredClone(s.data),
      result = applyPT(next, s.identity, b, new Date().toISOString());
    await commitStore(s, next, result.message);
    return json({ ok: true, ...result, revision: s.revision + 1 });
  } catch (e) {
    return failure(
      e instanceof PTError ? new ApiError(e.status, e.message) : e,
    );
  }
}
