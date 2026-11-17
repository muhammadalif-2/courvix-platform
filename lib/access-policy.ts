import { canFeature, type FeaturePermissions } from "./feature-access.ts";
function canonical(value: any): string | undefined {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  );
}
export type Identity = {
  id: string;
  name: string;
  email: string;
  role: "Administrator" | "Admin" | "Coach" | "Member";
  club: string;
  member?: string;
  coach?: string;
  team?: string;
  userId?: string;
  isOwner?: boolean;
  teams?: string[];
  authMode?: "local" | "sites" | "account";
  permissions?: FeaturePermissions;
  canInviteAdmin?: boolean;
};
export function visibleRow(key: string, r: any, a: Identity, data?: any) {
  if (key === "Profiles") return false;
  if (!canFeature(a, key)) return false;
  if (a.role === "Administrator") return true;
  if (r.club !== a.club) return false;
  const training = data?.records.Clubs.some(
    (c: any) => c.id === a.club && c.workspace_type === "Trainer",
  );
  if (training) {
    if (a.role === "Admin") return key !== "Projects";
    const sessions = data.records.PTSessions || [],
      assigned = (id: string) =>
        data.records.Members.some(
          (m: any) => m.id === id && m.coachId === a.coach,
        ) ||
        sessions.some((s: any) => s.client === id && s.coachId === a.coach);
    if (key === "Clubs") return true;
    if (key === "Support") return r.createdBy === a.email;
    if (key === "Members")
      return a.role === "Member" ? r.id === a.member : assigned(r.id);
    if (key === "Coaches") return true;
    if (key === "PTPlans") return a.role === "Member" && r.status === "Active";
    if (key === "PTClasses")
      return a.role === "Member" || r.coachId === a.coach;
    if (key === "PTSessions")
      return a.role === "Member"
        ? r.client === a.member
        : r.coachId === a.coach;
    if (["PTOrders", "PTCredits"].includes(key))
      return a.role === "Member" && r.client === a.member;
    if (["Invoices", "Payments", "Attendance"].includes(key))
      return a.role === "Member" && r.member === a.member;
    return false;
  }
  if (key === "Support") return a.role === "Admin" || r.createdBy === a.email;
  if (a.role === "Member") {
    if (["Members", "Invoices", "Payments", "Attendance"].includes(key))
      return r.id === a.member || r.member === a.member;
    if (key === "Teams") return r.id === a.team;
    if (["Schedule", "Training", "Competitions", "Documents"].includes(key))
      return !r.team || r.team === a.team;
    return ["Announcements", "Membership", "Clubs"].includes(key);
  }
  if (a.role === "Coach") {
    if (key === "Coaches") return r.id === a.coach;
    if (
      [
        "Teams",
        "Members",
        "Schedule",
        "Training",
        "Attendance",
        "Competitions",
      ].includes(key)
    )
      return (
        (a.teams || [a.team]).includes(r.id) ||
        (a.teams || [a.team]).includes(r.team) ||
        (key === "Attendance" &&
          data?.records.Members.some(
            (m: any) =>
              m.id === r.member &&
              m.club === a.club &&
              (a.teams || [a.team]).includes(m.team),
          ))
      );
    return ["Announcements", "Documents", "Competitions", "Clubs"].includes(
      key,
    );
  }
  return key !== "Projects";
}
export function scoped(data: any, a: Identity) {
  return {
    records: Object.fromEntries(
      Object.entries(data.records).map(([key, rows]) => [
        key,
        (rows as any[]).filter((r) => visibleRow(key, r, a, data)),
      ]),
    ),
    fee: data.fee,
    websites:
      a.role === "Administrator"
        ? data.websites
        : { [a.club]: data.websites[a.club] },
  };
}
export function mergeScoped(old: any, incoming: any, a: Identity) {
  if (a.role === "Administrator")
    return {
      ...incoming,
      records: {
        ...incoming.records,
        Profiles: old.records.Profiles,
        Payments: old.records.Payments,
      },
      _access: old._access,
    };
  if (canonical(incoming.fee) !== canonical(old.fee))
    throw Error("Only the platform administrator can change fees.");
  const allowed =
    a.role === "Admin"
      ? [
          "Members",
          "Teams",
          "Coaches",
          "Schedule",
          "Attendance",
          "Training",
          "Competitions",
          "Membership",
          "Invoices",
          "Expenses",
          "Announcements",
          "Documents",
          "Support",
        ]
      : a.role === "Coach"
        ? ["Attendance", "Training", "Support"]
        : ["Support"];
  const current = scoped(old, a);
  const next = structuredClone(old);
  for (const key of Object.keys(incoming.records)) {
    const rows = incoming.records[key];
    if (key === "Audit logs") continue;
    if (canonical(rows) === canonical(current.records[key] || [])) continue;
    if (!allowed.includes(key) || !canFeature(a, key, true))
      throw Error("Your role cannot edit this module.");
    if (rows.some((r: any) => !visibleRow(key, r, a, old)))
      throw Error("These records are outside your workspace or group access.");
    const hidden = old.records[key].filter(
      (r: any) => !visibleRow(key, r, a, old),
    );
    if (rows.some((r: any) => hidden.some((h: any) => h.id === r.id)))
      throw Error("This record ID is unavailable.");
    if (a.role === "Member" && key === "Invoices") {
      if (rows.length !== current.records[key].length)
        throw Error("Members cannot add or delete invoices.");
      for (const r of rows) {
        const prev = current.records[key].find((x: any) => x.id === r.id);
        if (!prev) throw Error("Invoice unavailable.");
        const editable = [
          "status",
          "method",
          "fee",
          "gateway",
          "reference",
          "feePayer",
        ];
        for (const k of new Set([...Object.keys(prev), ...Object.keys(r)]))
          if (!editable.includes(k) && canonical(prev[k]) !== canonical(r[k]))
            throw Error("Invoice details cannot be changed.");
        if (
          r.status !== prev.status &&
          !(
            ["Pending", "Expired", "Failed"].includes(prev.status) &&
            ["Paid", "Failed"].includes(r.status)
          )
        )
          throw Error("This member payment transition is not allowed.");
      }
    }
    next.records[key] = [...hidden, ...rows];
  }
  if (canonical(incoming.websites) !== canonical(current.websites))
    throw Error("Workspace website settings are unavailable in V1.0.");
  return next;
}
