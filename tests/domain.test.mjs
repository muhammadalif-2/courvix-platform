import assert from "node:assert/strict";
import { emptyWorkspace, feeFor, clubNet } from "../lib/courvix.ts";
import { scoped, mergeScoped, visibleRow } from "../lib/access-policy.ts";
const empty = emptyWorkspace();
assert.ok(Object.values(empty.records).every((v) => v.length === 0));
assert.equal(empty.fee.flat, 0);
for (const amount of [1, 10000, 350000, 10000000])
  assert.equal(feeFor(amount), 0);
assert.equal(
  clubNet({ id: "p", club: "a", amount: 350000, fee: 0, gateway: 0 }),
  350000,
);
const data = emptyWorkspace();
data.records.Members = [
  { id: "m1", club: "a", team: "t1" },
  { id: "m2", club: "b", team: "t2" },
];
data.records.Invoices = [
  { id: "i1", club: "a", member: "m1", status: "Pending", amount: 350000 },
];
data.websites = {
  a: { title: "A", headline: "", about: "" },
  b: { title: "B", headline: "", about: "" },
};
const member = {
  id: "user",
  name: "Member",
  email: "m@example.test",
  role: "Member",
  club: "a",
  team: "t1",
  member: "m1",
};
assert.equal(scoped(data, member).records.Members.length, 1);
assert.ok(!visibleRow("Members", data.records.Members[1], member, data));
const attack = structuredClone(scoped(data, member));
attack.records.Invoices[0].status = "Paid";
assert.throws(() => mergeScoped(data, attack, member));
const coach = { ...member, role: "Coach", teams: ["t1", "t3"], coach: "c1" };
assert.ok(
  visibleRow("Schedule", { id: "s1", club: "a", team: "t3" }, coach, data),
);
assert.ok(
  !visibleRow("Schedule", { id: "s2", club: "a", team: "other" }, coach, data),
);
console.log(
  "PASS domain: empty onboarding, no per-invoice fee, scoped club/member visibility, member cannot mark invoices paid, multi-group coach access.",
);
