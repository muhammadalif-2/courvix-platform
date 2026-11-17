import { db, ApiError } from "./v1";
export async function organizationOwner(id: string, user: string) {
  const org = await db()
    .prepare("SELECT * FROM cv_organizations WHERE id=? AND owner=?")
    .bind(id, user)
    .first<any>();
  if (!org)
    throw new ApiError(403, "Headquarters is unavailable to this account.");
  return org;
}
export async function organizationOverview(user: string) {
  const organizations = (
    await db()
      .prepare(
        "SELECT * FROM cv_organizations WHERE owner=? ORDER BY created_at",
      )
      .bind(user)
      .all<any>()
  ).results;
  const clubs = (
    await db()
      .prepare(
        `SELECT c.* FROM cv_clubs c JOIN cv_memberships m ON m.club=c.id WHERE m.user_id=? AND m.role='Owner' AND m.active=1 ORDER BY c.created_at`,
      )
      .bind(user)
      .all<any>()
  ).results;
  const ids = clubs.map((c) => c.id);
  if (!ids.length) return { organizations, clubs: [], stats: [] };
  const rows = (
    await db()
      .prepare(
        `SELECT r.club,r.module,r.payload FROM cv_records r JOIN cv_memberships m ON m.club=r.club WHERE m.user_id=? AND m.role='Owner' AND m.active=1 AND r.module IN ('Members','Coaches','Schedule','Invoices','Payments','Attendance','PTOrders','PTSessions')`,
      )
      .bind(user)
      .all<any>()
  ).results;
  return {
    organizations,
    clubs,
    stats: clubs.map((c) => {
      const records = rows
        .filter((r) => r.club === c.id)
        .map((r) => ({ ...JSON.parse(r.payload), module: r.module }));
      const get = (m: string) => records.filter((r) => r.module === m);
      const attendance =
        c.workspace_type === "Trainer"
          ? get("PTSessions").filter((s) =>
              ["Completed", "No-show"].includes(s.status),
            )
          : get("Attendance");
      return {
        club: c.id,
        members: get("Members").length,
        activeMembers: get("Members").filter((r) => r.status === "Active")
          .length,
        coaches: get("Coaches").length,
        sessions: get(
          c.workspace_type === "Trainer" ? "PTSessions" : "Schedule",
        ).filter((r) => r.status !== "Cancelled").length,
        outstanding: get(
          c.workspace_type === "Trainer" ? "PTOrders" : "Invoices",
        )
          .filter((r) => !["Paid", "Cancelled"].includes(r.status))
          .reduce((n, r) => n + (r.amount || 0), 0),
        collected:
          get("Payments").reduce((n, r) => n + (r.total ?? r.amount ?? 0), 0) +
          (c.workspace_type === "Trainer"
            ? get("PTOrders")
                .filter((o) => o.status === "Paid")
                .reduce((n, o) => n + o.amount, 0)
            : 0),
        attendance: attendance.length
          ? Math.round(
              (attendance.filter(
                (r) =>
                  r.status ===
                  (c.workspace_type === "Trainer" ? "Completed" : "Present"),
              ).length /
                attendance.length) *
                100,
            )
          : null,
      };
    }),
  };
}
