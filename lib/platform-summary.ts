export function platformSummary(
  input: {
    clubs: any[];
    users: any[];
    memberships: any[];
    records: any[];
    billing: any[];
    audit: any[];
  },
  today = new Date().toISOString(),
) {
  const records = input.records.map((r) =>
    r.payload
      ? { ...JSON.parse(r.payload), club: r.club, module: r.module }
      : r,
  );
  const clubs = input.clubs.map((c) => {
    const rows = records.filter((r) => r.club === c.id),
      count = (m: string) => rows.filter((r) => r.module === m);
    const active =
      (c.status === "Trial" ? c.trial_ends : c.renew_at || c.renewAt) || "";
    return {
      ...c,
      workspace_type: c.workspace_type || "Club",
      currency: c.currency || "IDR",
      members: count("Members").length,
      activeMembers: count("Members").filter((r) => r.status === "Active")
        .length,
      coaches: count("Coaches").length,
      teams: count(c.workspace_type === "Trainer" ? "PTClasses" : "Teams")
        .length,
      sessions:
        c.workspace_type === "Trainer"
          ? count("PTSessions").length
          : count("Schedule").length,
      users: input.memberships.filter((m) => m.club === c.id && m.active)
        .length,
      owner: input.memberships
        .filter((m) => m.club === c.id && m.role === "Owner" && m.active)
        .map((m) => {
          const u = input.users.find(
            (u) => u.id === (m.user_id || m.userId) || u.email === m.email,
          );
          return u ? { name: u.name, email: u.email } : null;
        })
        .filter(Boolean),
      outstanding: count(
        c.workspace_type === "Trainer" ? "PTOrders" : "Invoices",
      )
        .filter((r) => !["Paid", "Cancelled"].includes(r.status))
        .reduce((n, r) => n + (r.amount || 0), 0),
      collected:
        count("Payments").reduce((n, r) => n + (r.total ?? r.amount ?? 0), 0) +
        (c.workspace_type === "Trainer"
          ? count("PTOrders")
              .filter((o) => o.status === "Paid")
              .reduce((n, o) => n + o.amount, 0)
          : 0),
      effectiveStatus:
        Date.parse(active) > Date.parse(today) ? c.status : "Expired",
    };
  });
  const memberships = input.memberships.map((m) => ({
    ...m,
    clubName: clubs.find((c) => c.id === m.club)?.name,
  }));
  const users = input.users.map((u) => ({
    ...u,
    memberships: memberships.filter(
      (m) => (m.user_id || m.userId) === u.id || m.email === u.email,
    ),
  }));
  const history = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - (5 - i));
    const month = d.toISOString().slice(0, 7);
    return {
      month,
      clubs: clubs.filter((c) => c.created_at?.slice(0, 7) === month).length,
      users: users.filter((u) => u.created_at?.slice(0, 7) === month).length,
      revenue: input.billing
        .filter(
          (b) =>
            b.status === "Paid" &&
            (b.reviewed_at || b.created_at)?.slice(0, 7) === month,
        )
        .reduce((n, b) => n + b.amount, 0),
    };
  });
  return {
    clubs,
    users,
    memberships,
    billing: input.billing,
    audit: input.audit,
    history,
    summary: {
      clubs: clubs.length,
      users: users.length,
      members: clubs.reduce((n, c) => n + c.members, 0),
      activeMembers: clubs.reduce((n, c) => n + c.activeMembers, 0),
      active: clubs.filter((c) => c.effectiveStatus === "Active").length,
      trial: clubs.filter((c) => c.effectiveStatus === "Trial").length,
      expired: clubs.filter((c) => c.effectiveStatus === "Expired").length,
      review: input.billing.filter((b) => b.status === "Review").length,
      revenue: input.billing
        .filter((b) => b.status === "Paid")
        .reduce((n, b) => n + b.amount, 0),
      runRate: clubs
        .filter((c) => c.effectiveStatus === "Active")
        .reduce((n, c) => n + (c.plan === "Club Pro" ? 500000 : 250000), 0),
    },
  };
}
