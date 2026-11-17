import assert from "node:assert/strict";
const base = process.env.COURVIX_TEST_URL || "http://localhost:8788";
const key = process.env.COURVIX_TEST_JOB_KEY;
assert.ok(
  ["localhost", "127.0.0.1"].includes(new URL(base).hostname),
  "This scheduler test requires local-only synthetic data.",
);
assert.ok(
  key?.startsWith("local-only-"),
  "Supply the synthetic local-only job key.",
);
const denied = await fetch(base + "/api/reminders/run", { method: "POST" });
assert.equal(denied.status, 401);
await denied.arrayBuffer();
const run = await fetch(base + "/api/reminders/run", {
  method: "POST",
  headers: { "X-Courvix-Job-Key": key },
});
const result = await run.json();
assert.equal(run.status, 200, JSON.stringify(result));
assert.equal(result.ok, true);
assert.equal(result.sent, 0, "The local fixture must not send real email.");
const signIn = await fetch(base + "/api/local-session", {
  method: "POST",
  headers: { Origin: base, "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "owner@courvix.test",
    name: "Synthetic operator",
  }),
});
assert.equal(signIn.status, 200);
await signIn.arrayBuffer();
const cookie = signIn.headers
  .getSetCookie()
  .map((c) => c.split(";")[0])
  .join("; ");
const response = await fetch(base + "/api/operator", {
  headers: { Cookie: cookie },
});
const dashboard = await response.json();
assert.equal(response.status, 200);
assert.ok(dashboard.jobRuns.length > 0);
assert.equal(dashboard.jobRuns[0].created, result.created);
assert.equal(dashboard.jobRuns[0].blocked, result.blocked);
assert.ok(
  !JSON.stringify(dashboard).includes(key),
  "A job secret must not leak into operator responses.",
);
console.log(
  "PASS scheduler API: unauthorized denial, synthetic local run, no real email, persisted completion receipt and secret exclusion.",
);
