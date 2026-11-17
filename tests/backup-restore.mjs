const v1Tables = [
  "cv_organizations",
  "cv_user_profiles",
  "cv_reminder_preferences",
  "cv_renewal_choices",
  "cv_reminders",
  "cv_jobs",
  "cv_users",
  "cv_clubs",
  "cv_memberships",
  "cv_records",
  "cv_invites",
  "cv_outbox",
  "cv_billing",
  "cv_audit",
  "cv_rate_limits",
  "cv_record_history",
  "cv_revision_guard",
];
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
const run = (args) => {
  const r = spawnSync(
    process.execPath,
    [
      "--import",
      "./scripts/sites-env.mjs",
      "node_modules/wrangler/bin/wrangler.js",
      ...args,
    ],
    { encoding: "utf8" },
  );
  if (r.status) throw Error(r.stderr + "\n" + r.stdout);
  return r.stdout;
};
mkdirSync("work/backups", { recursive: true });
const testId = crypto.randomUUID();
const backup = path.resolve("work/backups/restore-test-" + testId + ".sql");
run([
  "d1",
  "export",
  "DB",
  "--local",
  "--config",
  "wrangler.local.json",
  "--output",
  backup,
  ...v1Tables.flatMap((t) => ["--table", t]),
]);
const target = path.resolve("work/restore-test-" + testId + ".json");
writeFileSync(
  target,
  JSON.stringify({
    name: "courvix-restore-test",
    compatibility_date: "2026-05-15",
    d1_databases: [
      {
        binding: "DB",
        database_name: "courvix-restore-test",
        database_id: crypto.randomUUID(),
      },
    ],
  }),
);
const isolated = path.resolve("work/restore-state-" + testId);
try {
  run([
    "d1",
    "execute",
    "DB",
    "--local",
    "--persist-to",
    isolated,
    "--config",
    target,
    "--file",
    backup,
  ]);
  const query =
    "SELECT (SELECT COUNT(*) FROM cv_organizations) organizations,(SELECT COUNT(*) FROM cv_user_profiles) profiles,(SELECT COUNT(*) FROM cv_clubs) clubs,(SELECT COUNT(*) FROM cv_memberships) memberships,(SELECT COUNT(*) FROM cv_records) records,(SELECT COUNT(*) FROM cv_billing) billing,(SELECT COUNT(*) FROM cv_reminders) reminders,(SELECT COUNT(*) FROM cv_renewal_choices) choices";
  const original = JSON.parse(
    run([
      "d1",
      "execute",
      "DB",
      "--local",
      "--persist-to",
      ".wrangler/state",
      "--config",
      "wrangler.local.json",
      "--command",
      query,
      "--json",
    ]),
  )[0].results;
  const restored = JSON.parse(
    run([
      "d1",
      "execute",
      "DB",
      "--local",
      "--persist-to",
      isolated,
      "--config",
      target,
      "--command",
      query,
      "--json",
    ]),
  )[0].results;
  assert.deepEqual(restored, original);
  assert.ok(original[0].clubs > 0);
  console.log(
    "PASS: exported local D1 and restored into a separate database; club, membership, record and billing counts match.",
  );
} finally {
  rmSync(isolated, { recursive: true, force: true });
  rmSync(target, { force: true });
  rmSync(backup, { force: true });
}
