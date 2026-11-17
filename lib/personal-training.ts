import type { DB, Row } from "./courvix.ts";
import type { Identity } from "./access-policy.ts";
import { validAmount, validTimezone } from "./sports.ts";
export const PT_MODULES = [
  "PTPlans",
  "PTOrders",
  "PTSessions",
  "PTClasses",
  "PTCredits",
  "PTSettings",
] as const;
export class PTError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
const fail = (message: string, status = 422): never => {
  throw new PTError(status, message);
};
const trim = (v: unknown, max = 200) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const uid = () => crypto.randomUUID();
const holding = (r: Row) => ["Requested", "Scheduled"].includes(r.status);
export function ensurePT(data: DB) {
  for (const mod of PT_MODULES) data.records[mod] ||= [];
}
export function localDay(now: string, zone: string) {
  return new Date(now).toLocaleDateString("sv-SE", { timeZone: zone });
}
export function slotInstant(date: string, time: string, zone: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}$/.test(time) ||
    !validTimezone(zone)
  )
    return fail("Choose a valid date, time, and time zone.");
  const [y, m, d] = date.split("-").map(Number),
    [h, min] = time.split(":").map(Number);
  if (
    h > 23 ||
    min > 59 ||
    new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10) !== date
  )
    return fail("Invalid appointment date or time.");
  const target = Date.UTC(y, m - 1, d, h, min),
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
  let result = target;
  for (let i = 0; i < 4; i++) {
    const p = Object.fromEntries(
      formatter.formatToParts(new Date(result)).map((p) => [p.type, p.value]),
    );
    const actual = Date.UTC(
      +p.year,
      +p.month - 1,
      +p.day,
      +p.hour,
      +p.minute,
      +p.second,
    );
    const delta = target - actual;
    if (!delta) return result;
    result += delta;
  }
  return fail(
    "This time does not exist in this time zone. Choose another slot.",
  );
}
export function ptSettings(data: DB, club: string) {
  return (
    data.records.PTSettings?.find((r) => r.club === club) || {
      id: "settings",
      club,
      cancelHours: 12,
      noShowCharge: true,
      openTime: "07:00",
      closeTime: "21:00",
    }
  );
}
export function appointmentPolicy(data: DB, session: Row) {
  const current = ptSettings(data, session.club);
  return (
    session.policy || {
      cancelHours: current.cancelHours,
      noShowCharge: current.noShowCharge,
      recordedAt: null,
      legacy: true,
    }
  );
}
export function packBalance(data: DB, order: Row, today: string) {
  const credits = (data.records.PTCredits || [])
      .filter((c) => c.order === order.id)
      .reduce((n, c) => n + c.delta, 0),
    reserved = (data.records.PTSessions || []).filter(
      (s) => s.order === order.id && holding(s),
    ).length;
  const expired = !!order.expires && order.expires < today;
  return {
    credits,
    reserved,
    available:
      order.status === "Paid" && !expired ? Math.max(0, credits - reserved) : 0,
    expired,
    used: order.status === "Paid" ? Math.max(0, order.sessions - credits) : 0,
  };
}
export function trainerView(data: DB, a: Identity, now: string) {
  ensurePT(data);
  const club = data.records.Clubs.find((c) => c.id === a.club);
  if (club?.workspace_type !== "Trainer")
    return fail("This workspace uses Club Management.", 409);
  const sessions = data.records.PTSessions.filter((r) => r.club === a.club),
    isAdmin = a.role === "Admin",
    clientAllowed = (id: string) =>
      isAdmin ||
      a.member === id ||
      (a.role === "Coach" &&
        (data.records.Members.some(
          (m) => m.id === id && m.coachId === a.coach,
        ) ||
          sessions.some((s) => s.client === id && s.coachId === a.coach))),
    today = localDay(now, club.timezone || "Asia/Jakarta");
  const clients = data.records.Members.filter(
    (r) => r.club === a.club && clientAllowed(r.id),
  );
  const orders = data.records.PTOrders.filter(
    (r) => r.club === a.club && (isAdmin || a.member === r.client),
  );
  const classes = data.records.PTClasses.filter(
    (r) => r.club === a.club && (a.role !== "Coach" || r.coachId === a.coach),
  ).map((r) => ({
    ...r,
    booked: sessions.filter((s) => s.classId === r.id && holding(s)).length,
  }));
  return {
    club,
    session: a,
    now,
    today,
    settings: ptSettings(data, a.club),
    clients,
    coaches: data.records.Coaches.filter(
      (r) => r.club === a.club && r.status === "Active",
    ),
    plans: data.records.PTPlans.filter(
      (r) => r.club === a.club && (isAdmin || r.status === "Active"),
    ),
    orders: orders.map((o) => ({ ...o, balance: packBalance(data, o, today) })),
    appointments: sessions
      .filter(
        (r) =>
          clientAllowed(r.client) &&
          (a.role !== "Coach" || r.coachId === a.coach),
      )
      .map((r) => ({ ...r, policy: appointmentPolicy(data, r) })),
    classes,
    credits: data.records.PTCredits.filter(
      (r) => r.club === a.club && (isAdmin || r.client === a.member),
    ),
    support: data.records.Support.filter(
      (r) => r.club === a.club && (isAdmin || r.createdBy === a.email),
    ),
    legacyCount: isAdmin
      ? data.records.Invoices.filter((r) => r.club === a.club).length
      : 0,
  };
}
export function applyPT(data: DB, a: Identity, b: any, now: string) {
  ensurePT(data);
  const club = data.records.Clubs.find((c) => c.id === a.club);
  if (club?.workspace_type !== "Trainer")
    return fail(
      "Personal Training is a separate product. Open a training workspace.",
      409,
    );
  const records = data.records,
    isAdmin = a.role === "Admin",
    today = localDay(now, club.timezone),
    settings = ptSettings(data, a.club),
    needAdmin = () => {
      if (!isAdmin) fail("Only a workspace owner or admin can do this.", 403);
    },
    get = (mod: string, id: unknown) =>
      records[mod].find((r) => r.id === id && r.club === a.club) ||
      fail("This record is not available.", 404),
    newRow = (mod: string, row: any) => {
      const value = { ...row, id: uid(), club: a.club };
      records[mod].unshift(value);
      return value;
    },
    clientAccess = (client: string) => {
      if (!isAdmin && a.member !== client)
        fail("This client is outside your access.", 403);
    },
    coachAccess = (session: Row) => {
      if (!isAdmin && !(a.role === "Coach" && session.coachId === a.coach))
        fail(
          "Only the assigned trainer or an admin can update this appointment.",
          403,
        );
    },
    clientActive = (id: unknown) => {
      const c = get("Members", id);
      if (c.status !== "Active")
        fail("Activate this client before continuing.");
      return c;
    },
    activeCoach = (id: unknown) => {
      const c = get("Coaches", id);
      if (c.status !== "Active") fail("Choose an active trainer.");
      return c;
    };
  const logCredit = (
    order: Row,
    delta: number,
    reason: string,
    session?: Row,
  ) =>
    newRow("PTCredits", {
      order: order.id,
      client: order.client,
      delta,
      reason,
      session: session?.id || null,
      actor: a.email,
      date: now,
    });
  // Preserve the policy on existing appointments before any settings change.
  // New bookings always take their own immutable snapshot below.
  for (const session of records.PTSessions.filter(
    (r) => r.club === a.club && !r.policy,
  )) {
    session.policy = { ...appointmentPolicy(data, session), recordedAt: now };
  }
  let result: any = {};
  let message = "Personal Training updated";
  switch (b.action) {
    case "support": {
      const name = trim(b.name),
        description = trim(b.description, 2000);
      if (!name || !description)
        fail("Enter a subject and describe the issue.");
      newRow("Support", {
        name,
        description,
        status: "Open",
        createdBy: a.email,
        date: today,
      });
      message = "Support request created";
      break;
    }
    case "save-plan": {
      needAdmin();
      const name = trim(b.name),
        count = Number(b.sessions),
        amount = Number(b.amount),
        duration = Number(b.duration),
        validDays = Number(b.validDays);
      if (
        !name ||
        !Number.isInteger(count) ||
        count < 1 ||
        count > 200 ||
        !validAmount(amount, club.currency) ||
        !Number.isInteger(duration) ||
        duration < 15 ||
        duration > 240 ||
        !Number.isInteger(validDays) ||
        validDays < 1 ||
        validDays > 730
      )
        fail(
          "Set a name, 1–200 sessions, a positive price, a 15–240 minute duration, and 1–730 validity days.",
        );
      const values = {
        name,
        sessions: count,
        amount,
        duration,
        validDays,
        description: trim(b.description, 1000),
        status: b.status === "Archived" ? "Archived" : "Active",
        kind: count === 1 ? "Per visit" : "Session pack",
      };
      if (b.id) Object.assign(get("PTPlans", b.id), values);
      else result.plan = newRow("PTPlans", values).id;
      message = "Training offer saved";
      break;
    }
    case "save-client": {
      needAdmin();
      const name = trim(b.name),
        email = trim(b.email, 254).toLowerCase();
      if (!name || !/^\S+@\S+\.\S+$/.test(email))
        fail("Enter the client name and a valid email address.");
      const prev = b.id ? get("Members", b.id) : null;
      if (
        records.Members.some(
          (m) => m.club === a.club && m.email === email && m.id !== prev?.id,
        )
      )
        fail("A client with this email already exists.", 409);
      if (prev && prev.email !== email)
        fail(
          "Keep the invited email unchanged. Contact support to correct account identity.",
          409,
        );
      if (b.coachId) activeCoach(b.coachId);
      const values = {
        name,
        email,
        coachId: trim(b.coachId) || null,
        goal: trim(b.goal, 1000),
        level: ["Beginner", "Intermediate", "Advanced"].includes(b.level)
          ? b.level
          : "Beginner",
        status: b.status === "Archived" ? "Archived" : "Active",
        date: prev?.date || today,
      };
      if (
        values.status === "Archived" &&
        records.PTSessions.some((s) => s.client === prev?.id && holding(s))
      )
        fail("Cancel upcoming appointments before archiving this client.", 409);
      if (prev) Object.assign(prev, values);
      else result.client = newRow("Members", values).id;
      message = "Client profile saved";
      break;
    }
    case "save-trainer": {
      needAdmin();
      const name = trim(b.name),
        email = trim(b.email, 254).toLowerCase();
      if (!name || !/^\S+@\S+\.\S+$/.test(email))
        fail("Enter the trainer name and email.");
      const previous = b.id ? get("Coaches", b.id) : null;
      if (previous && previous.email !== email)
        fail(
          "Keep the invited email unchanged. Contact support to correct account identity.",
          409,
        );
      if (
        records.Coaches.some(
          (c) =>
            c.club === a.club && c.email === email && c.id !== previous?.id,
        )
      )
        fail("This trainer is already listed.", 409);
      const values = {
        name,
        email,
        description: trim(b.specialty) || "Personal training",
      };
      if (previous) {
        Object.assign(previous, values);
        result.trainer = previous.id;
      } else
        result.trainer = newRow("Coaches", { ...values, status: "Active" }).id;
      message = previous ? "Trainer details updated" : "Trainer added";
      break;
    }
    case "order": {
      if (a.role === "Coach")
        fail("Trainers cannot access client checkout.", 403);
      const client = clientActive(a.role === "Member" ? a.member : b.client);
      clientAccess(client.id);
      const plan = get("PTPlans", b.plan);
      if (plan.status !== "Active")
        fail("This offer is no longer available.", 409);
      if (
        records.PTOrders.some(
          (o) =>
            o.club === a.club &&
            o.client === client.id &&
            o.plan === plan.id &&
            ["Pending", "Review", "Rejected"].includes(o.status),
        )
      )
        fail(
          "An unpaid order for this offer already exists. Open it in Payments.",
          409,
        );
      result.order = newRow("PTOrders", {
        client: client.id,
        member: client.id,
        name: client.name,
        plan: plan.id,
        planName: plan.name,
        sessions: plan.sessions,
        amount: plan.amount,
        duration: plan.duration,
        validDays: plan.validDays,
        status: "Pending",
        date: today,
        due: new Date(Date.parse(today + "T12:00:00Z") + 3 * 86400000)
          .toISOString()
          .slice(0, 10),
        createdAt: now,
        reference: "",
        note: "",
      }).id;
      message = "Training package order created";
      break;
    }
    case "submit-payment": {
      const order = get("PTOrders", b.id);
      clientAccess(order.client);
      if (a.role === "Coach") fail("Trainers cannot submit payments.", 403);
      if (!["Pending", "Rejected"].includes(order.status))
        fail("This order is not awaiting a payment submission.", 409);
      if (!club.bank_name || !club.bank_account || !club.bank_holder)
        fail(
          "The owner must configure the business receiving bank account first.",
          503,
        );
      const reference = trim(b.reference, 150);
      if (reference.length < 4)
        fail("Enter a transfer reference of at least four characters.");
      Object.assign(order, {
        reference,
        note: trim(b.note, 1000),
        submittedAt: now,
        status: "Review",
      });
      message = "Training payment submitted for review";
      break;
    }
    case "review-payment": {
      needAdmin();
      const order = get("PTOrders", b.id);
      if (order.status !== "Review")
        fail("This payment has already been reviewed or is not ready.", 409);
      if (!["approve", "reject"].includes(b.decision))
        fail("Choose approve or reject.");
      const note = trim(b.note, 1000);
      if (b.decision === "reject" && !note)
        fail("Give a reason for rejecting this payment.");
      Object.assign(order, {
        status: b.decision === "approve" ? "Paid" : "Rejected",
        reviewedAt: now,
        reviewedBy: a.email,
        reviewNote: note,
      });
      if (b.decision === "approve") {
        if (
          records.PTCredits.some(
            (c) => c.order === order.id && c.reason === "Purchase",
          )
        )
          fail("Session credits have already been granted.", 409);
        order.paidAt = now;
        order.expires = new Date(
          Date.parse(today + "T12:00:00Z") + (order.validDays - 1) * 86400000,
        )
          .toISOString()
          .slice(0, 10);
        logCredit(order, order.sessions, "Purchase");
      }
      message =
        b.decision === "approve"
          ? "Training payment verified and sessions activated"
          : "Training payment rejected";
      break;
    }
    case "cancel-order": {
      const order = get("PTOrders", b.id);
      clientAccess(order.client);
      if (a.role === "Coach" || !["Pending", "Rejected"].includes(order.status))
        fail("Only an unsubmitted, unpaid order can be cancelled.", 409);
      order.status = "Cancelled";
      message = "Unpaid training order cancelled";
      break;
    }
    case "settings": {
      needAdmin();
      const cancelHours = Number(b.cancelHours),
        openTime = trim(b.openTime),
        closeTime = trim(b.closeTime);
      if (
        !Number.isInteger(cancelHours) ||
        cancelHours < 0 ||
        cancelHours > 168 ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(openTime) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(closeTime) ||
        openTime >= closeTime
      )
        fail("Set a 0–168 hour cancellation window and valid opening hours.");
      const prev = records.PTSettings.find((r) => r.club === a.club),
        values = {
          cancelHours,
          noShowCharge: !!b.noShowCharge,
          openTime,
          closeTime,
        };
      if (prev) Object.assign(prev, values);
      else newRow("PTSettings", values);
      message = "Training policies updated";
      break;
    }
    case "create-class": {
      needAdmin();
      const coach = activeCoach(b.coachId),
        date = trim(b.date),
        time = trim(b.time),
        endTime = trim(b.endTime),
        capacity = Number(b.capacity),
        name = trim(b.name),
        venue = trim(b.venue);
      if (
        !name ||
        !venue ||
        !Number.isInteger(capacity) ||
        capacity < 2 ||
        capacity > 50
      )
        fail("Name the class, set its location, and choose 2–50 places.");
      validateSlot(date, time, endTime, coach.id, null);
      result.class = newRow("PTClasses", {
        name,
        coachId: coach.id,
        date,
        time,
        endTime,
        capacity,
        venue,
        status: "Scheduled",
      }).id;
      message = "Small-group class published";
      break;
    }
    case "update-class": {
      needAdmin();
      const cls = get("PTClasses", b.id);
      if (
        cls.status !== "Scheduled" ||
        slotInstant(cls.date, cls.time, club.timezone) <= Date.parse(now)
      )
        fail("Only an upcoming scheduled class can be updated.", 409);
      const coach = activeCoach(b.coachId),
        date = trim(b.date),
        time = trim(b.time),
        endTime = trim(b.endTime),
        capacity = Number(b.capacity),
        name = trim(b.name),
        venue = trim(b.venue);
      const participants = records.PTSessions.filter(
        (r) => r.club === a.club && r.classId === cls.id && holding(r),
      );
      if (
        !name ||
        !venue ||
        !Number.isInteger(capacity) ||
        capacity < 2 ||
        capacity > 50
      )
        fail("Name the class, set its location, and choose 2–50 places.");
      if (capacity < participants.length)
        fail(
          "Capacity cannot be lower than the number of reserved places.",
          409,
        );
      const start = validateSlot(date, time, endTime, coach.id, cls.id);
      const duration =
        (slotInstant(date, endTime, club.timezone) - start) / 60000;
      for (const session of participants) {
        const order = get("PTOrders", session.order);
        if (date > order.expires || duration !== order.duration)
          fail(
            "Every reserved package must cover the updated class date and duration.",
            409,
          );
        validateSlot(
          date,
          time,
          endTime,
          coach.id,
          cls.id,
          session.client,
          session.id,
        );
      }
      Object.assign(cls, {
        name,
        coachId: coach.id,
        date,
        time,
        endTime,
        capacity,
        venue,
        updatedAt: now,
      });
      for (const session of participants)
        Object.assign(session, {
          name,
          coachId: coach.id,
          date,
          time,
          endTime,
          venue,
          rescheduledAt: now,
          rescheduledBy: a.email,
        });
      message =
        "Class updated; participant bookings retain their credits and policies";
      break;
    }
    case "book": {
      const client = clientActive(a.role === "Member" ? a.member : b.client);
      clientAccess(client.id);
      if (a.role === "Coach")
        fail("Only clients or administrators can create bookings.", 403);
      const order = get("PTOrders", b.order);
      if (order.client !== client.id)
        fail("Choose this client’s own package.", 403);
      const balance = packBalance(data, order, today);
      if (balance.available < 1)
        fail(
          balance.expired
            ? "This package has expired. Buy a new pack."
            : "No unreserved paid sessions remain in this package.",
          409,
        );
      const cls = b.classId ? get("PTClasses", b.classId) : null;
      if (
        cls &&
        (cls.status !== "Scheduled" ||
          records.PTSessions.filter((s) => s.classId === cls.id && holding(s))
            .length >= cls.capacity)
      )
        fail("This class is full or closed.", 409);
      if (
        cls &&
        records.PTSessions.some(
          (s) =>
            s.classId === cls.id &&
            s.client === client.id &&
            s.status !== "Cancelled",
        )
      )
        fail("This client is already booked into this class.", 409);
      const coach = activeCoach(cls?.coachId || b.coachId),
        date = cls?.date || trim(b.date),
        time = cls?.time || trim(b.time),
        endTime = cls?.endTime || trim(b.endTime);
      const start = validateSlot(
        date,
        time,
        endTime,
        coach.id,
        cls?.id || null,
        client.id,
      );
      if (date > order.expires)
        fail("The appointment must fall within the package validity period.");
      const duration =
        (slotInstant(date, endTime, club.timezone) - start) / 60000;
      if (duration !== order.duration)
        fail(
          `This package covers ${order.duration}-minute sessions. Choose a matching slot or class.`,
        );
      result.appointment = newRow("PTSessions", {
        client: client.id,
        order: order.id,
        coachId: coach.id,
        classId: cls?.id || null,
        type: cls ? "Small group" : "Private",
        name: cls?.name || "Personal training",
        date,
        time,
        endTime,
        venue:
          cls?.venue || trim(b.venue) || club.location || "Training studio",
        status: a.role === "Member" && !cls ? "Requested" : "Scheduled",
        createdAt: now,
        note: "",
        progress: "",
        requestedBy: a.email,
        policy: {
          cancelHours: settings.cancelHours,
          noShowCharge: settings.noShowCharge,
          recordedAt: now,
          legacy: false,
        },
      }).id;
      message = "Session reserved";
      break;
    }
    case "confirm": {
      const session = get("PTSessions", b.id);
      coachAccess(session);
      if (session.status !== "Requested")
        fail("This appointment is no longer waiting for confirmation.", 409);
      session.status = "Scheduled";
      message = "Appointment confirmed";
      break;
    }
    case "reschedule": {
      const session = get("PTSessions", b.id);
      coachAccess(session);
      if (!holding(session) || session.classId)
        fail("Only an upcoming private appointment can be rescheduled.", 409);
      const order = get("PTOrders", session.order),
        date = trim(b.date),
        time = trim(b.time),
        endTime = trim(b.endTime);
      if (date > order.expires || date < today)
        fail("Choose a future date within the package validity.");
      validateSlot(
        date,
        time,
        endTime,
        session.coachId,
        null,
        session.client,
        session.id,
      );
      if (
        (slotInstant(date, endTime, club.timezone) -
          slotInstant(date, time, club.timezone)) /
          60000 !==
        order.duration
      )
        fail("Keep the duration covered by this package.");
      Object.assign(session, {
        date,
        time,
        endTime,
        rescheduledAt: now,
        rescheduledBy: a.email,
      });
      message = "Private appointment rescheduled";
      break;
    }
    case "complete":
    case "no-show": {
      const session = get("PTSessions", b.id);
      coachAccess(session);
      if (session.status !== "Scheduled")
        fail(
          "Only a scheduled session can be completed or marked no-show.",
          409,
        );
      if (
        slotInstant(session.date, session.endTime, club.timezone) >
        Date.parse(now)
      )
        fail(
          "Wait until the scheduled end time before closing this session.",
          409,
        );
      const order = get("PTOrders", session.order);
      if (packBalance(data, order, today).credits < 1)
        fail("The package has no remaining session credit.", 409);
      const consume =
        b.action === "complete" ||
        appointmentPolicy(data, session).noShowCharge;
      if (
        records.PTCredits.some((c) => c.session === session.id && c.delta < 0)
      )
        fail("This session has already been charged.", 409);
      if (consume)
        logCredit(
          order,
          -1,
          b.action === "complete" ? "Completed session" : "No-show",
          session,
        );
      Object.assign(session, {
        status: b.action === "complete" ? "Completed" : "No-show",
        closedAt: now,
        closedBy: a.email,
        note: trim(b.note, 1000),
        progress: trim(b.progress, 2000),
        charged: consume,
      });
      message =
        b.action === "complete"
          ? "Session completed; one credit used"
          : "No-show recorded under the cancellation policy";
      break;
    }
    case "cancel": {
      const session = get("PTSessions", b.id);
      if (a.role === "Member") clientAccess(session.client);
      else coachAccess(session);
      if (!holding(session))
        fail("This appointment can no longer be cancelled.", 409);
      const late =
        (slotInstant(session.date, session.time, club.timezone) -
          Date.parse(now)) /
          3600000 <
        appointmentPolicy(data, session).cancelHours;
      if (a.role === "Member" && late)
        fail(
          `Online cancellation closes ${appointmentPolicy(data, session).cancelHours} hours before training. Contact your trainer.`,
          409,
        );
      if (late && !trim(b.note))
        fail("Add a reason for cancelling inside the cancellation window.");
      const charge = late && b.charge === true && isAdmin;
      if (charge)
        logCredit(
          get("PTOrders", session.order),
          -1,
          "Late cancellation",
          session,
        );
      Object.assign(session, {
        status: "Cancelled",
        cancelledAt: now,
        cancelledBy: a.email,
        note: trim(b.note, 1000),
        charged: charge,
      });
      message = charge
        ? "Late cancellation recorded; one credit used"
        : "Appointment cancelled; reserved credit released";
      break;
    }
    case "cancel-class": {
      needAdmin();
      const cls = get("PTClasses", b.id);
      if (cls.status !== "Scheduled")
        fail("This class is already closed.", 409);
      if (!trim(b.note)) fail("Add a cancellation reason.");
      cls.status = "Cancelled";
      for (const s of records.PTSessions.filter(
        (s) => s.classId === cls.id && holding(s),
      ))
        Object.assign(s, {
          status: "Cancelled",
          cancelledAt: now,
          note: trim(b.note, 1000),
          charged: false,
        });
      message = "Class cancelled and all reserved credits released";
      break;
    }
    case "correct-session": {
      needAdmin();
      const session = get("PTSessions", b.id);
      if (
        !["Completed", "No-show", "Cancelled"].includes(session.status) ||
        !session.charged ||
        records.PTCredits.some(
          (c) => c.session === session.id && c.reason === "Correction",
        )
      )
        fail("There is no uncorrected session charge to restore.", 409);
      const note = trim(b.note, 1000);
      if (note.length < 10)
        fail("Explain this correction in at least ten characters.");
      logCredit(get("PTOrders", session.order), 1, "Correction", session);
      Object.assign(session, {
        status: "Cancelled",
        correctedAt: now,
        correctionNote: note,
        charged: false,
      });
      message = "Session credit restored with an audit entry";
      break;
    }
    default:
      fail("Unknown Personal Training action.", 404);
  }
  return { ...result, message };
  function validateSlot(
    date: string,
    time: string,
    endTime: string,
    coachId: string,
    classId: string | null,
    client?: string,
    ignore?: string,
  ) {
    const start = slotInstant(date, time, club!.timezone),
      end = slotInstant(date, endTime, club!.timezone);
    if (start <= Date.parse(now) || end <= start || end - start > 4 * 3600000)
      fail(
        "Choose a future appointment with an end after its start (maximum four hours).",
      );
    if (time < settings.openTime || endTime > settings.closeTime)
      fail(`Training hours are ${settings.openTime}–${settings.closeTime}.`);
    const overlap = (r: Row) =>
      r.date === date && time < r.endTime && endTime > r.time;
    if (
      records.PTClasses.some(
        (r) =>
          r.club === a.club &&
          r.id !== classId &&
          r.status === "Scheduled" &&
          r.coachId === coachId &&
          overlap(r),
      )
    )
      fail("The trainer already has a class at this time.", 409);
    if (
      records.PTSessions.some(
        (r) =>
          r.club === a.club &&
          r.id !== ignore &&
          holding(r) &&
          overlap(r) &&
          ((r.coachId === coachId && !(classId && r.classId === classId)) ||
            (client &&
              r.client === client &&
              !(classId && r.classId === classId))),
      )
    )
      fail(
        "This trainer or client already has an overlapping appointment.",
        409,
      );
    return start;
  }
}
