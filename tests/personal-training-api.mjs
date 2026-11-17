import assert from "node:assert/strict";
const base = process.env.COURVIX_TEST_URL || "http://localhost:8788",
  suffix = Date.now();
function browser() {
  const jar = new Map();
  return {
    jar,
    async req(path, method = "GET", body) {
      const r = await fetch(base + path, {
        method,
        headers: {
          Origin: base,
          Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      for (const c of r.headers.getSetCookie()) {
        const p = c.split(";")[0],
          i = p.indexOf("=");
        jar.set(p.slice(0, i), p.slice(i + 1));
      }
      const text = await r.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { text };
      }
      return { status: r.status, data };
    },
    async ok(path, method = "GET", body, status = 200) {
      const r = await this.req(path, method, body);
      assert.equal(r.status, status, JSON.stringify(r.data));
      return r.data;
    },
    async login(email, name = email) {
      await this.ok("/api/local-session", "POST", { email, name });
    },
    async view() {
      return this.ok("/api/personal-training");
    },
    async pt(action, b = {}, expected = 200) {
      const d = await this.view();
      return this.ok(
        "/api/personal-training",
        "POST",
        { action, revision: d.revision, ...b },
        expected,
      );
    },
  };
}
const owner = browser(),
  client = browser(),
  coach = browser(),
  other = browser(),
  operator = browser(),
  anon = browser();
assert.equal((await anon.req("/api/personal-training")).status, 401);
await owner.login(`pt-owner-${suffix}@example.test`, "Training Owner");
await owner.ok(
  "/api/access",
  "POST",
  {
    action: "register",
    terms: true,
    workspaceType: "Trainer",
    clubName: "PT Studio " + suffix,
    sport: "Fitness",
    country: "US",
    currency: "USD",
    timezone: "Asia/Jakarta",
    groupLabel: "Private",
    plan: "Starter",
  },
  201,
);
let d = await owner.view();
assert.equal(d.clients.length, 0);
assert.equal(d.plans.length, 0);
const club = d.club.id;
await owner.ok("/api/access", "POST", {
  action: "settings",
  clubName: "PT Studio " + suffix,
  groupLabel: "Private",
  timezone: "Asia/Jakarta",
  bankName: "Training fixture bank",
  bankAccount: "00000000",
  bankHolder: "Studio fixture",
});
const coachEmail = `pt-coach-${suffix}@example.test`,
  clientEmail = `pt-client-${suffix}@example.test`;
const trainer = await owner.pt("save-trainer", {
  name: "Trainer One",
  email: coachEmail,
  specialty: "Strength",
});
const trainerId = trainer.trainer;
const saved = await owner.pt("save-client", {
  name: "Client One",
  email: clientEmail,
  coachId: trainerId,
  goal: "Consistent training",
  level: "Beginner",
});
const clientId = saved.client;
const plans = [];
for (const n of [1, 4, 8, 16])
  plans.push({
    sessions: n,
    id: (
      await owner.pt("save-plan", {
        name: n === 1 ? "Single visit" : n + " sessions",
        sessions: n,
        amount: n * 20,
        duration: 60,
        validDays: 30,
        description: "Coaching",
      })
    ).plan,
  });
for (const [role, email, actor] of [
  ["Coach", coachEmail, coach],
  ["Member", clientEmail, client],
]) {
  const inv = await owner.ok(
    "/api/access",
    "POST",
    { action: "invite", role, email, name: role + " user" },
    201,
  );
  await actor.login(email);
  await actor.ok("/api/access", "POST", {
    action: "join",
    code: new URL(inv.inviteUrl).searchParams.get("code"),
  });
}
const photo = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=",
  "base64",
);
const uploaded = await fetch(base + "/api/account", {
  method: "POST",
  headers: {
    Origin: base,
    Cookie: [...client.jar].map(([k, v]) => `${k}=${v}`).join("; "),
    "Content-Type": "image/png",
  },
  body: photo,
});
assert.equal(uploaded.status, 200);
const avatar = (await client.ok("/api/account")).avatarUrl;
assert.equal((await coach.req(avatar)).status, 200);
d = await client.view();
assert.equal(d.clients.length, 1);
assert.equal(d.clients[0].id, clientId);
assert.equal(d.plans.length, 4);
assert.equal(d.orders.length, 0);
const order = (
  await client.pt("order", {
    plan: plans.find((p) => p.sessions === 4).id,
    client: "forged-other-client",
  })
).order;
d = await client.view();
assert.equal(d.orders[0].client, clientId);
assert.equal(d.orders[0].status, "Pending");
assert.equal(d.orders[0].balance.available, 0);
await client.pt("submit-payment", { id: order, reference: "PT-BANK-12345" });
assert.equal((await client.view()).orders[0].status, "Review");
await coach.pt("review-payment", { id: order, decision: "approve" }, 403);
const revision = (await owner.view()).revision;
const reviews = await Promise.all([
  owner.req("/api/personal-training", "POST", {
    action: "review-payment",
    id: order,
    decision: "approve",
    revision,
  }),
  owner.req("/api/personal-training", "POST", {
    action: "review-payment",
    id: order,
    decision: "approve",
    revision,
  }),
]);
assert.deepEqual(reviews.map((r) => r.status).sort(), [200, 409]);
d = await owner.view();
assert.equal(
  d.credits.filter((c) => c.order === order && c.reason === "Purchase").length,
  1,
);
assert.equal(d.orders[0].balance.available, 4);
const tomorrow = new Date(Date.parse(d.today + "T12:00:00Z") + 2 * 86400000)
  .toISOString()
  .slice(0, 10);
const booking = (
  await client.pt("book", {
    order,
    coachId: trainerId,
    date: tomorrow,
    time: "09:00",
    endTime: "10:00",
    venue: "Studio",
  })
).appointment;
d = await client.view();
assert.equal(d.orders[0].balance.available, 3);
assert.equal(d.orders[0].balance.reserved, 1);
assert.equal(d.appointments[0].status, "Requested");
assert.equal(d.appointments[0].policy.cancelHours, 12);
await owner.pt("settings", {
  cancelHours: 72,
  noShowCharge: false,
  openTime: "07:00",
  closeTime: "21:00",
});
const preserved = (await client.view()).appointments.find(
  (a) => a.id === booking,
);
assert.equal(preserved.policy.cancelHours, 12);
assert.equal(preserved.policy.noShowCharge, true);
// Restore current policy so subsequent fixture appointments retain their intended timing.
await owner.pt("settings", {
  cancelHours: 12,
  noShowCharge: true,
  openTime: "07:00",
  closeTime: "21:00",
});
await coach.pt("confirm", { id: booking });
await coach.pt("complete", { id: booking, progress: "Too early" }, 409);
await client.pt(
  "book",
  {
    order,
    coachId: trainerId,
    date: tomorrow,
    time: "09:30",
    endTime: "10:30",
  },
  409,
);
const cls = (
  await owner.pt("create-class", {
    name: "Strength class",
    coachId: trainerId,
    date: tomorrow,
    time: "11:00",
    endTime: "12:00",
    capacity: 2,
    venue: "Room A",
  })
).class;
await client.pt("book", { order, classId: cls });
assert.equal((await client.view()).orders[0].balance.available, 2);
await owner.pt("update-class", {
  id: cls,
  name: "Updated strength class",
  coachId: trainerId,
  date: tomorrow,
  time: "12:00",
  endTime: "13:00",
  capacity: 3,
  venue: "Room B",
});
const updatedClassBooking = (await client.view()).appointments.find(
  (s) => s.classId === cls,
);
assert.equal(updatedClassBooking.time, "12:00");
assert.equal(updatedClassBooking.venue, "Room B");
assert.equal(updatedClassBooking.policy.cancelHours, 12);
await coach.pt("update-class", { id: cls }, 403);
await owner.pt("save-trainer", {
  id: trainerId,
  name: "Trainer One updated",
  email: coachEmail,
  specialty: "Mobility",
});
assert.equal((await owner.view()).coaches.length, 1);
assert.equal(
  (await coach.view()).coaches.find((c) => c.id === trainerId).description,
  "Mobility",
);
await owner.pt(
  "save-trainer",
  { id: trainerId, name: "Trainer One", email: "different@example.test" },
  409,
);

await owner.pt("cancel-class", { id: cls, note: "Studio rescheduling" });
assert.equal((await client.view()).orders[0].balance.available, 3);
await client.pt("cancel", {
  id: booking,
  note: "A different day works better",
});
d = await client.view();
assert.equal(d.orders[0].balance.available, 4);
assert.equal(d.credits.length, 1);
await client.pt("support", {
  name: "Training question",
  description: "Please help me choose the next plan.",
});
assert.equal((await client.view()).support.length, 1);
const raw = await client.ok("/api/workspace");
assert.ok(raw.data.records.PTOrders.every((o) => o.client === clientId));
assert.equal(
  (
    await client.req("/api/workspace", "PUT", {
      data: raw.data,
      revision: raw.revision,
    })
  ).status,
  409,
);
assert.equal(
  (
    await client.req("/api/payments", "POST", {
      action: "approve",
      revision: raw.revision,
      id: order,
    })
  ).status,
  409,
);
const trainerView = await coach.view();
assert.equal(trainerView.orders.length, 0);
assert.equal(trainerView.credits.length, 0);
assert.equal(trainerView.clients.length, 1);
await other.login(`pt-other-${suffix}@example.test`);
await other.ok(
  "/api/access",
  "POST",
  {
    action: "register",
    terms: true,
    workspaceType: "Trainer",
    clubName: "Other studio",
    sport: "Fitness",
    timezone: "Asia/Jakarta",
    groupLabel: "Private",
    plan: "Starter",
  },
  201,
);
assert.equal((await other.view()).orders.length, 0);
assert.equal((await other.req(avatar)).status, 403);
await other.pt("submit-payment", { id: order, reference: "WRONG-OWNER" }, 404);
await owner.pt("save-plan", {
  id: plans.find((p) => p.sessions === 4).id,
  name: "Repriced pack",
  sessions: 4,
  amount: 999,
  duration: 45,
  validDays: 7,
});
d = await client.view();
assert.equal(d.orders[0].amount, 80);
assert.equal(d.orders[0].duration, 60);
assert.equal(d.orders[0].validDays, 30);
await owner.ok("/api/reminders", "POST", {
  action: "configure",
  enabled: true,
  emailEnabled: true,
  leadDays: 3,
  intervalDays: 3,
});
const reminders = await owner.ok("/api/reminders");
assert.equal(reminders.invoices.length, 1);
assert.equal(reminders.invoices[0].id, order);
assert.equal(reminders.invoices[0].status, "Paid");
await operator.login("owner@courvix.test");
const platform = await operator.ok("/api/operator");
assert.equal(
  platform.clubs.find((c) => c.id === club).workspace_type,
  "Trainer",
);
assert.equal(platform.clubs.find((c) => c.id === club).collected, 80);
console.log(
  "PASS training API: persistent separate product, team-free invitations, per-visit/4/8/16 offers, client checkout, exactly-once concurrent verification, paid credits, bookings, conflicts, classes, cancellation, immutable purchase terms, scoped exports, support, product guards and platform totals.",
);
