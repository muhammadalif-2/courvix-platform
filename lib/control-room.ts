import type { DB, Row } from "./courvix.ts";
import { scoped, type Identity } from "./access-policy.ts";
const upcoming = (r: Row, today: string) =>
  r.date >= today && !["Cancelled", "Completed", "No-show"].includes(r.status);
const byDate = (a: Row, b: Row) =>
  ((a.date || "") + (a.time || "")).localeCompare(
    (b.date || "") + (b.time || ""),
  );
const total = (rows: Row[], key = "amount") =>
  rows.reduce(
    (n, r) => n + (Number.isFinite(Number(r[key])) ? Number(r[key]) : 0),
    0,
  );
export function clubControlRoom(data: DB, identity: Identity, today: string) {
  if (!["Admin", "Coach"].includes(identity.role))
    throw Error("The control room is available to workspace staff.");
  const records = scoped(data, identity).records;
  const get = (module: string) =>
    (records[module] || []).filter((r) => r.club === identity.club);
  const financial = identity.role === "Admin",
    teams = get("Teams"),
    coaches = get("Coaches"),
    sessions = get("Schedule").sort(byDate),
    attendance = get("Attendance"),
    programs = get("Training"),
    competitions = get("Competitions"),
    announcements = get("Announcements"),
    documents = get("Documents");
  const plans = financial ? get("Membership") : [];
  const invoices = financial ? get("Invoices") : [],
    payments = financial ? get("Payments") : [],
    expenses = financial ? get("Expenses") : [];
  const people = get("Members").map((m) => {
    const team = teams.find((t) => t.id === m.team),
      coach = coaches.find((c) => c.id === team?.coachId),
      schedule = sessions.filter((s) => s.team === m.team),
      history = attendance.filter((a) => a.member === m.id),
      training = programs.filter(
        (p) =>
          p.member === m.id ||
          p.team === m.team ||
          schedule.some((s) => s.id === p.session),
      );
    const { amount, membership, membershipName, ...publicMember } = m;
    return {
      person: financial ? m : publicMember,
      team,
      coach,
      schedule,
      upcoming: schedule.filter((s) => upcoming(s, today)),
      attendance: history,
      present: history.filter((a) => ["Present", "Hadir"].includes(a.status))
        .length,
      programs: training,
      competitions: competitions.filter((c) => !c.team || c.team === m.team),
      announcements: announcements.filter((a) => !a.team || a.team === m.team),
      documents: documents.filter((d) => !d.team || d.team === m.team),
      finance: financial
        ? {
            invoices: invoices.filter((i) => i.member === m.id),
            payments: payments.filter((p) => p.member === m.id),
            outstanding: total(
              invoices.filter(
                (i) =>
                  i.member === m.id &&
                  !["Paid", "Cancelled"].includes(i.status),
              ),
            ),
          }
        : null,
    };
  });
  return {
    financial,
    people,
    teams,
    coaches,
    plans,
    sessions,
    upcoming: sessions.filter((s) => upcoming(s, today)),
    attendance,
    programs,
    competitions,
    announcements,
    documents,
    finance: financial
      ? {
          invoices,
          payments,
          expenses,
          review: invoices.filter((i) => i.status === "Review"),
          overdue: invoices.filter(
            (i) =>
              i.due < today &&
              !["Paid", "Cancelled", "Review"].includes(i.status),
          ),
          outstanding: total(
            invoices.filter((i) => !["Paid", "Cancelled"].includes(i.status)),
          ),
          receipts: total(payments),
          expensesTotal: total(expenses),
        }
      : null,
  };
}
export function trainingControlRoom(view: any) {
  if (!["Admin", "Coach"].includes(view.session.role))
    throw Error("The control room is available to workspace staff.");
  const club = view.club.id,
    financial = view.session.role === "Admin",
    get = (key: string) =>
      (view[key] || []).filter((r: Row) => r.club === club);
  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: view.club.timezone || "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(view.now));
  const isUpcoming = (r: Row) =>
    upcoming(r, view.today) &&
    r.date + " " + r.endTime >= view.today + " " + localTime;
  const appointments = get("appointments").sort(byDate),
    classes = get("classes"),
    coaches = get("coaches"),
    orders = financial ? get("orders") : [];
  const people = get("clients").map((m: Row) => {
    const sessions = appointments.filter((a: Row) => a.client === m.id),
      packs = orders.filter((o: Row) => o.client === m.id),
      { amount, membership, membershipName, ...safe } = m;
    return {
      person: financial ? m : safe,
      coach: coaches.find((c: Row) => c.id === m.coachId),
      appointments: sessions,
      upcoming: sessions.filter(isUpcoming),
      progress: sessions.filter((a: Row) => !!a.progress),
      completed: sessions.filter((a: Row) => a.status === "Completed").length,
      finance: financial
        ? {
            orders: packs,
            available: packs.reduce(
              (n: number, o: Row) => n + (o.balance?.available || 0),
              0,
            ),
            reserved: packs.reduce(
              (n: number, o: Row) => n + (o.balance?.reserved || 0),
              0,
            ),
            outstanding: total(
              packs.filter(
                (o: Row) => !["Paid", "Cancelled"].includes(o.status),
              ),
            ),
          }
        : null,
    };
  });
  return {
    financial,
    people,
    coaches,
    appointments,
    classes,
    offers: financial ? get("plans") : [],
    upcoming: appointments.filter(isUpcoming),
    requested: appointments.filter((a: Row) => a.status === "Requested"),
    needsOutcome: appointments.filter(
      (a: Row) =>
        a.status === "Scheduled" &&
        a.date + " " + a.endTime < view.today + " " + localTime,
    ),
    finance: financial
      ? {
          orders,
          review: orders.filter((o: Row) => o.status === "Review"),
          receipts: total(orders.filter((o: Row) => o.status === "Paid")),
          outstanding: total(
            orders.filter(
              (o: Row) => !["Paid", "Cancelled"].includes(o.status),
            ),
          ),
          available: orders.reduce(
            (n: number, o: Row) => n + (o.balance?.available || 0),
            0,
          ),
          expiring: orders.filter(
            (o: Row) =>
              o.status === "Paid" &&
              o.balance?.available > 0 &&
              o.expires >= view.today &&
              o.expires <=
                new Date(Date.parse(view.today + "T12:00:00Z") + 7 * 86400000)
                  .toISOString()
                  .slice(0, 10),
          ),
        }
      : null,
  };
}
