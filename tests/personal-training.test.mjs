import assert from "node:assert/strict";
import {
  createDemoState,
  simulateRequest,
  shiftDate,
} from "../lib/demo-engine.ts";
import { packBalance, slotInstant } from "../lib/personal-training.ts";
import { scoped, mergeScoped } from "../lib/access-policy.ts";
let s = createDemoState();
s.club = "demo-nusa";
s.role = "Owner";
const call = (path, method = "GET", body = {}) => {
    const next = structuredClone(s);
    const result = simulateRequest(next, path, method, {
      revision: s.revision,
      ...body,
    });
    s = next;
    return result.value;
  },
  pt = (action, b = {}) =>
    call("/api/personal-training", "POST", { action, ...b }),
  view = () => call("/api/personal-training");
const club = s.club,
  first = club + "-m1",
  second = club + "-m2",
  third = club + "-m3",
  fourth = club + "-m4",
  coach = club + "-coach",
  tomorrow = shiftDate(s.today, 1);
let d = view();
assert.deepEqual(
  d.plans.map((p) => p.sessions).sort((a, b) => a - b),
  [1, 4, 8, 16],
);
assert.equal(d.orders.length, 4);
assert.equal(d.clients.length, 4);
const legacy = s.data.records.Invoices.filter((i) => i.club === club).length;
s.role = "Member";
s.member = second;
d = view();
assert.equal(d.orders.length, 1);
assert.ok(d.orders.every((o) => o.client === second));
const order = d.orders[0].id;
assert.throws(
  () =>
    pt("book", {
      order,
      coachId: coach,
      date: tomorrow,
      time: "09:00",
      endTime: "10:00",
    }),
  /No unreserved/,
);
assert.throws(
  () => pt("submit-payment", { id: "pt-order-1", reference: "TX-12345" }),
  /outside your access/,
);
pt("submit-payment", { id: order, reference: "PT-TRANSFER-123" });
assert.equal(view().orders[0].status, "Review");
assert.equal(view().orders[0].balance.available, 0);
s.role = "Coach";
assert.equal(view().orders.length, 0);
assert.equal(view().credits.length, 0);
assert.equal(view().clients.length, 4);
assert.throws(
  () => pt("review-payment", { id: order, decision: "approve" }),
  /owner or admin/,
);
s.role = "Admin";
pt("review-payment", { id: order, decision: "approve" });
d = view();
assert.equal(d.orders.find((o) => o.id === order).balance.available, 4);
assert.throws(
  () => pt("review-payment", { id: order, decision: "approve" }),
  /already been reviewed/,
);
s.role = "Member";
s.member = second;
const booking = pt("book", {
  order,
  coachId: coach,
  date: tomorrow,
  time: "09:00",
  endTime: "10:00",
  venue: "Studio",
}).appointment;
assert.equal(
  view().appointments.find((a) => a.id === booking).status,
  "Requested",
);
assert.equal(view().orders[0].balance.available, 3);
assert.equal(view().orders[0].balance.reserved, 1);
assert.throws(
  () =>
    pt("book", {
      order,
      coachId: coach,
      date: tomorrow,
      time: "09:30",
      endTime: "10:30",
    }),
  /overlapping|class/,
);
s.role = "Coach";
pt("confirm", { id: booking });
assert.throws(
  () => pt("complete", { id: booking, progress: "Too early" }),
  /scheduled end/,
);
s.role = "Admin";
const cls = pt("create-class", {
  name: "Strength circuit",
  coachId: coach,
  date: tomorrow,
  time: "12:00",
  endTime: "13:00",
  capacity: 2,
  venue: "Studio A",
}).class;
s.role = "Member";
s.member = first;
pt("book", { order: "pt-order-1", classId: cls });
assert.throws(
  () => pt("book", { order: "pt-order-1", classId: cls }),
  /already booked/,
);
s.member = fourth;
pt("book", { order: "pt-order-4", classId: cls });
assert.equal(view().orders[0].balance.available, 0);
assert.throws(
  () =>
    pt("book", {
      order: "pt-order-4",
      coachId: coach,
      date: tomorrow,
      time: "15:00",
      endTime: "16:00",
    }),
  /No unreserved/,
);
s.member = second;
assert.throws(() => pt("book", { order, classId: cls }), /full or closed/);
s.member = first;
let classSession = view().appointments.find((a) => a.classId === cls);
pt("cancel", { id: classSession.id, note: "Change of plan" });
assert.equal(view().orders[0].balance.available, 7);
s.member = second;
const grouped = pt("book", { order, classId: cls }).appointment;
assert.equal(view().orders[0].balance.reserved, 2);
assert.equal(view().orders[0].balance.available, 2);
s.today = tomorrow;
s.role = "Coach";
pt("complete", {
  id: booking,
  progress: "Improved squat control; focus on bracing next session.",
  note: "Great consistency",
});
assert.throws(() => pt("complete", { id: booking }), /Only a scheduled/);
s.role = "Member";
s.member = second;
d = view();
assert.equal(d.orders[0].balance.credits, 3);
assert.equal(d.orders[0].balance.available, 2);
assert.ok(d.appointments.some((a) => a.progress?.includes("squat")));
s.role = "Admin";
pt("correct-session", {
  id: booking,
  note: "Coach recorded the wrong session in error.",
});
assert.throws(
  () =>
    pt("correct-session", {
      id: booking,
      note: "Duplicate correction attempt.",
    }),
  /no uncorrected/,
);
s.role = "Member";
d = view();
assert.equal(d.orders[0].balance.credits, 4);
assert.equal(d.orders[0].balance.reserved, 1);
assert.equal(d.credits.filter((c) => c.session === booking).length, 2);
s.role = "Coach";
const fourthSession = view().appointments.find(
  (a) => a.client === fourth && a.classId === cls,
);
pt("no-show", { id: fourthSession.id, note: "Client did not attend." });
s.role = "Admin";
assert.equal(view().orders.find((o) => o.client === fourth).balance.credits, 0);
pt("settings", {
  cancelHours: 12,
  noShowCharge: false,
  openTime: "07:00",
  closeTime: "21:00",
});
s.role = "Coach";
pt("no-show", {
  id: grouped,
  note: "Recorded under the original booking policy.",
});
s.role = "Member";
s.member = second;
// The booking keeps its original chargeable no-show policy after settings change.
assert.equal(view().orders[0].balance.available, 3);
const paidOrder = s.data.records.PTOrders.find((o) => o.id === order);
assert.equal(
  packBalance(s.data, paidOrder, shiftDate(paidOrder.expires, 1)).available,
  0,
);
assert.equal(
  s.data.records.Invoices.filter((i) => i.club === club).length,
  legacy,
);
assert.throws(
  () => call("/api/workspace", "PUT", { data: s.data }),
  /Personal Training/,
);
s.role = "Admin";
pt("save-plan", {
  name: "Custom 12-session pack",
  sessions: 12,
  amount: 1500000,
  duration: 45,
  validDays: 60,
});
assert.ok(view().plans.some((p) => p.sessions === 12));
s.club = "demo-batam";
s.role = "Owner";
assert.throws(() => view(), /Club Management/);
assert.throws(
  () => slotInstant("2026-03-08", "02:30", "America/New_York"),
  /does not exist/,
);
assert.equal(
  new Date(slotInstant("2026-11-13", "09:00", "Asia/Jakarta")).toISOString(),
  "2026-11-13T02:00:00.000Z",
);
console.log(
  "PASS Personal Training: product isolation, 1/4/8/16 offers, purchase verification, credit reservation and consumption, class capacity, conflicts, cancellation, no-show policy, correction audit, expiry, role scoping and DST validation.",
);

// Policy snapshots must survive configuration changes, cancellation and rescheduling.
{
  let policyState = createDemoState();
  policyState.club = "demo-nusa";
  policyState.role = "Owner";
  const run = (action, body = {}) => {
    const next = structuredClone(policyState);
    const result = simulateRequest(next, "/api/personal-training", "POST", {
      action,
      revision: policyState.revision,
      ...body,
    });
    policyState = next;
    return result.value;
  };
  const read = () =>
    simulateRequest(policyState, "/api/personal-training", "GET", {}).value;
  const nextDay = shiftDate(policyState.today, 1);
  run("settings", {
    cancelHours: 0,
    noShowCharge: false,
    openTime: "07:00",
    closeTime: "21:00",
  });
  const old = run("book", {
    client: "demo-nusa-m1",
    order: "pt-order-1",
    coachId: "demo-nusa-coach",
    date: nextDay,
    time: "09:00",
    endTime: "10:00",
  }).appointment;
  const cancelled = run("book", {
    client: "demo-nusa-m1",
    order: "pt-order-1",
    coachId: "demo-nusa-coach",
    date: nextDay,
    time: "14:00",
    endTime: "15:00",
  }).appointment;
  run("settings", {
    cancelHours: 72,
    noShowCharge: true,
    openTime: "07:00",
    closeTime: "21:00",
  });
  assert.equal(
    read().appointments.find((a) => a.id === old).policy.noShowCharge,
    false,
  );
  const legacy = read().appointments.find((a) => a.id === "pt-past-session");
  if (legacy) assert.equal(legacy.policy.noShowCharge, true);
  run("reschedule", {
    id: old,
    date: nextDay,
    time: "11:00",
    endTime: "12:00",
  });
  assert.equal(
    read().appointments.find((a) => a.id === old).policy.cancelHours,
    0,
  );
  policyState.role = "Member";
  policyState.member = "demo-nusa-m1";
  run("cancel", { id: cancelled }); // Valid under original policy, though new policy would reject it.
  policyState.role = "Coach";
  policyState.today = nextDay;
  const before = policyState.data.records.PTCredits.filter(
    (c) => c.order === "pt-order-1",
  ).reduce((n, c) => n + c.delta, 0);
  run("no-show", {
    id: old,
    note: "Recorded under the original booking terms.",
  });
  const after = policyState.data.records.PTCredits.filter(
    (c) => c.order === "pt-order-1",
  ).reduce((n, c) => n + c.delta, 0);
  assert.equal(after, before);
  console.log(
    "PASS policy snapshots: changed settings cannot retroactively charge bookings or block agreed cancellation; rescheduling preserves terms.",
  );
}

// Editing live class records must update linked reservations atomically without
// changing package credits or the booking policy that participants agreed to.
{
  let state = createDemoState();
  state.club = "demo-nusa";
  state.role = "Owner";
  const run = (action, body = {}) => {
    const next = structuredClone(state);
    const result = simulateRequest(next, "/api/personal-training", "POST", {
      revision: state.revision,
      action,
      ...body,
    });
    state = next;
    return result.value;
  };
  const read = () =>
    simulateRequest(state, "/api/personal-training", "GET", {}).value;
  const day = shiftDate(state.today, 2);
  const oldCoach = read().coaches[0];
  run("save-trainer", {
    id: oldCoach.id,
    name: "Updated Trainer",
    email: oldCoach.email,
    specialty: "Mobility",
  });
  assert.equal(
    read().coaches.find((c) => c.id === oldCoach.id).description,
    "Mobility",
  );
  assert.throws(
    () =>
      run("save-trainer", {
        id: oldCoach.id,
        name: "Identity swap",
        email: "new-person@example.test",
      }),
    /email unchanged/,
  );
  state.role = "Coach";
  assert.throws(
    () =>
      run("save-trainer", {
        id: oldCoach.id,
        name: "Blocked",
        email: oldCoach.email,
      }),
    /owner or admin/,
  );
  state.role = "Owner";
  const pending = read().orders.find((o) => o.status === "Review");
  run("review-payment", { id: pending.id, decision: "approve" });
  const cls = run("create-class", {
    name: "Shared strength",
    coachId: oldCoach.id,
    date: day,
    time: "14:00",
    endTime: "15:00",
    capacity: 3,
    venue: "Room A",
  }).class;
  for (const id of ["pt-order-1", "pt-order-4", pending.id]) {
    const order = read().orders.find((o) => o.id === id);
    run("book", { client: order.client, order: id, classId: cls });
  }
  const update = {
    id: cls,
    name: "Updated strength",
    coachId: oldCoach.id,
    date: day,
    time: "17:00",
    endTime: "18:00",
    capacity: 3,
    venue: "Room B",
  };
  assert.throws(
    () => run("update-class", { ...update, capacity: 2 }),
    /reserved places/,
  );
  assert.throws(
    () => run("update-class", { ...update, endTime: "17:45" }),
    /package/,
  );
  const ledger = JSON.stringify(state.data.records.PTCredits);
  const policies = read()
    .appointments.filter((s) => s.classId === cls)
    .map((s) => s.policy);
  run("update-class", update);
  const linked = read().appointments.filter((s) => s.classId === cls);
  assert.equal(linked.length, 3);
  assert.ok(linked.every((s) => s.time === "17:00" && s.venue === "Room B"));
  assert.deepEqual(
    linked.map((s) => s.policy),
    policies,
  );
  assert.equal(JSON.stringify(state.data.records.PTCredits), ledger);
  state.role = "Coach";
  assert.throws(() => run("update-class", update), /owner or admin/);
  console.log(
    "PASS contextual edits: trainer identity protection, admin-only class editing, capacity/duration guards and linked bookings without credit or policy changes.",
  );
}
