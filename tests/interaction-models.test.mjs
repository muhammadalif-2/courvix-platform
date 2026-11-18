import assert from "node:assert/strict";
import { creditExample, changeCreditExample, workspaceEstimate, productRecommendation, setupEnquiry } from "../lib/interaction-models.ts";

// Reserve/release cannot consume a purchased credit; only completing a reservation can.
let balance = creditExample({ purchased: 4, completed: 0, reserved: 0 });
for (let i = 0; i < 10; i++) balance = changeCreditExample(balance, "reserve");
assert.deepEqual(balance, { purchased: 4, completed: 0, reserved: 4, remaining: 4, available: 0 });
balance = changeCreditExample(balance, "release");
assert.equal(balance.remaining, 4);
assert.equal(balance.available, 1);
for (let i = 0; i < 10; i++) balance = changeCreditExample(balance, "complete");
assert.deepEqual(balance, { purchased: 4, completed: 3, reserved: 0, remaining: 1, available: 1 });
balance = changeCreditExample(changeCreditExample(balance, "reserve"), "complete");
assert.equal(balance.completed, 4);
assert.equal(changeCreditExample(balance, "complete").completed, 4);
for (const value of [
  { purchased: -1, completed: 99, reserved: 2 },
  { purchased: 8.8, completed: 2.9, reserved: 20 },
  { purchased: NaN, completed: Infinity, reserved: -3 },
]) {
  const s = creditExample(value);
  assert.ok(s.purchased >= 1 && s.completed >= 0 && s.available >= 0);
  assert.equal(s.completed + s.reserved + s.available, s.purchased);
  assert.equal(s.reserved + s.available, s.remaining);
}
assert.equal(workspaceEstimate(2, 1, "Starter").total, 750000);
assert.equal(workspaceEstimate(2, 1, "Pro").total, 1500000);
assert.equal(workspaceEstimate(0, 0, "Starter").total, 0);
assert.equal(workspaceEstimate(25, 25, "Pro").count, 25);
assert.equal(workspaceEstimate(-10, NaN, "Starter").count, 0);
assert.equal(productRecommendation("dues"), "club");
assert.equal(productRecommendation("sessions"), "training");
const draft = setupEnquiry("training", 99, "Injected\r\nBcc: unexpected@example.test");
assert.ok(draft.body.includes("Locations: 25"));
assert.ok(draft.subject.includes("Personal Training"));
assert.ok(!draft.body.includes("Bcc:"));
console.log("PASS interactive models: credit movement/exhaustion, invariant balances, current workspace prices/caps and safe enquiry options.");
