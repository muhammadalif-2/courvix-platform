import assert from "node:assert/strict";
import {
  RELEASE_VERSION,
  releaseReadiness,
  validateReleaseEvidence,
} from "../lib/release-readiness.ts";
import { createDemoState, simulateRequest } from "../lib/demo-engine.ts";
const row = (gate, verified, release = RELEASE_VERSION) => ({
  actor: "operator",
  created_at: "2026-11-16T01:00:00Z",
  detail: JSON.stringify({
    gate,
    verified,
    note: "Independent acceptance result recorded for this release.",
    release,
  }),
});
const checks = releaseReadiness([
  row("identity", false),
  row("identity", true),
  row("email", true, "old-release"),
  { detail: "invalid json" },
]);
assert.equal(checks.find((c) => c.id === "identity").verified, false);
assert.equal(checks.find((c) => c.id === "email").verified, false);
assert.equal(checks.filter((c) => c.verified).length, 0);
assert.ok(
  validateReleaseEvidence({
    gate: "unknown",
    verified: true,
    note: "A sufficiently long piece of evidence.",
  }),
);
assert.ok(
  validateReleaseEvidence({
    gate: "identity",
    verified: true,
    note: "Too short",
  }),
);
assert.equal(
  validateReleaseEvidence({
    gate: "identity",
    verified: false,
    note: "Independent login acceptance still needs verification.",
  }),
  null,
);
let s = createDemoState();
s.role = "Owner";
assert.throws(
  () =>
    simulateRequest(s, "/api/operator", "POST", {
      action: "launch-evidence",
      gate: "identity",
      verified: true,
      note: "Workspace owners cannot verify platform launch checks.",
    }),
  /Courvix owner/,
);
s.role = "Platform";
simulateRequest(s, "/api/operator", "POST", {
  action: "launch-evidence",
  gate: "identity",
  verified: true,
  note: "Synthetic demo acceptance, never real launch evidence.",
});
assert.equal(
  simulateRequest(s, "/api/operator", "GET", {}).value.launch.find(
    (c) => c.id === "identity",
  ).verified,
  true,
);
console.log(
  "PASS launch controls: evidence validation, current-release scope, reopening checks, and platform-only demo access.",
);

assert.ok(
  validateReleaseEvidence({
    gate: "identity",
    verified: true,
    note: '"'.repeat(600),
  }),
  "Escaped evidence must not be silently truncated in audit storage.",
);
