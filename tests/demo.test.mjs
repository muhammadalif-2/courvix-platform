import assert from "node:assert/strict";
import {
  createDemoState,
  simulateRequest,
  advanceDemo,
  demoIdentity,
  shiftDate,
} from "../lib/demo-engine.ts";
import {
  reminderSlot,
  defaultReminderPreference,
} from "../lib/reminder-policy.ts";
const s = createDemoState(),
  call = (path, method = "GET", body = {}) =>
    simulateRequest(s, path, method, body).value;
for (const role of ["Owner", "Admin", "Coach", "Member"]) {
  s.role = role;
  const value = call("/api/workspace");
  assert.ok(value.session);
  if (role === "Coach") assert.equal(value.data.records.Invoices.length, 0);
  if (role === "Member") assert.equal(value.data.records.Members.length, 1);
}
s.role = "Owner";
let inv = call("/api/access", "POST", {
  action: "invite",
  email: "invited@example.test",
  name: "Member Baru",
  role: "Member",
  team: "t-1",
});
assert.ok(inv.inviteUrl);
call("/api/access", "POST", {
  action: "join",
  code: new URL(inv.inviteUrl).searchParams.get("code"),
});
assert.equal(s.role, "Member");
assert.equal(demoIdentity(s).email, "invited@example.test");
assert.throws(() =>
  call("/api/access", "POST", {
    action: "join",
    code: new URL(inv.inviteUrl).searchParams.get("code"),
  }),
);
s.role = "Admin";
const first = call("/api/reminders", "POST", { action: "run" });
assert.ok(first.created > 0);
assert.equal(call("/api/reminders", "POST", { action: "run" }).created, 0);
s.role = "Member";
s.member = "m-1";
let state = call("/api/workspace");
const invoice = state.data.records.Invoices.find((i) => i.status === "Pending");
assert.ok(invoice);
call("/api/payments", "POST", {
  action: "submit",
  id: invoice.id,
  revision: s.revision,
  reference: "DEMO-1234",
});
assert.equal(
  s.data.records.Invoices.find((i) => i.id === invoice.id).status,
  "Review",
);
assert.throws(() =>
  call("/api/payments", "POST", {
    action: "approve",
    id: invoice.id,
    revision: s.revision,
  }),
);
const memberMessages = () =>
  s.mail.filter(
    (m) => m.type === "Reminder" && m.to_email === "member@example.test",
  ).length;
const count = memberMessages();
advanceDemo(s, 3);
assert.equal(memberMessages(), count);
s.role = "Admin";
call("/api/payments", "POST", {
  action: "approve",
  id: invoice.id,
  revision: s.revision,
});
advanceDemo(s, 7);
assert.equal(memberMessages(), count);
s.role = "Member";
s.member = "m-2";
const i2 = s.data.records.Invoices.find((i) => i.member === "m-2");
call("/api/reminders", "POST", {
  action: "choice",
  member: "m-2",
  period: i2.period,
  decision: "Stop",
});
const stopped = s.mail.filter(
  (m) => m.type === "Reminder" && m.to_email === "member2@example.test",
).length;
advanceDemo(s, 7);
assert.equal(
  s.mail.filter(
    (m) => m.type === "Reminder" && m.to_email === "member2@example.test",
  ).length,
  stopped,
);
assert.equal(i2.status, "Pending");
s.role = "Platform";
const platform = call("/api/operator");
assert.ok(platform.clubs.length);
call("/api/operator", "POST", {
  action: "review-subscription",
  id: "bill-1",
  decision: "approve",
});
assert.equal(s.data.records.Clubs[0].status, "Active");
const blank = createDemoState(false);
simulateRequest(blank, "/api/access", "POST", {
  action: "register",
  clubName: "Klub Baru",
  sport: "Renang",
  plan: "Starter",
  groupLabel: "Kelas",
});
assert.equal(blank.data.records.Members.length, 0);
assert.equal(blank.data.records.Clubs[0].groupLabel, "Kelas");
assert.ok(demoIdentity(blank).isOwner);
const p = { ...defaultReminderPreference, enabled: true },
  i = { id: "test", club: "c", due: "2026-11-15", status: "Pending" },
  m = { id: "m", club: "c", status: "Active" };
assert.equal(reminderSlot(i, m, "Undecided", "2026-11-11", p), null);
assert.equal(reminderSlot(i, m, "Undecided", "2026-11-12", p), "before");
assert.equal(reminderSlot(i, m, "Undecided", "2026-11-15", p), "due");
assert.equal(reminderSlot(i, m, "Continue", "2026-11-18", p), "late-1");
assert.equal(reminderSlot(i, m, "Stop", "2026-11-18", p), null);
assert.equal(
  reminderSlot({ ...i, status: "Paid" }, m, "Continue", "2026-11-18", p),
  null,
);
console.log(
  "PASS demo/policy: all roles, invitations and replay, empty onboarding, operator package approval, manual payment verification, clock progression, reminder deduplication, pause during review, stop after paid/decline, no invoice erasure.",
);
