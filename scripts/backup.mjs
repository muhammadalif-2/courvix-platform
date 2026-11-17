const v1Tables = [
  "cv_organizations", "cv_user_profiles",
  "cv_reminder_preferences", "cv_renewal_choices", "cv_reminders", "cv_jobs",
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
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import path from "node:path";
const [operation = "export", input] = process.argv.slice(2);
const local = process.env.COURVIX_BACKUP_LOCAL === "1";
const dir = path.resolve("work/backups");
mkdirSync(dir, { recursive: true });
const config = process.env.COURVIX_WRANGLER_CONFIG || "wrangler.local.json";
const database = process.env.COURVIX_D1_DATABASE || "DB";
const run = (args) => {
  const r = spawnSync(
    process.execPath,
    [
      "--import",
      "./scripts/sites-env.mjs",
      "node_modules/wrangler/bin/wrangler.js",
      "d1",
      ...args,
      "--config",
      config,
      ...(local ? ["--local"] : ["--remote"]),
    ],
    { stdio: "inherit" },
  );
  if (r.status) throw Error("Wrangler failed: " + r.status);
};
if (operation === "export") {
  const file = path.join(
    dir,
    "courvix-" + new Date().toISOString().replace(/[:.]/g, "-") + ".sql",
  );
  if (!local && !process.env.COURVIX_BACKUP_KEY)
    throw Error(
      "Remote backups require COURVIX_BACKUP_KEY (base64, 32 bytes).",
    );
  run([
    "export",
    database,
    "--output",
    file,
    ...v1Tables.flatMap((t) => ["--table", t]),
  ]);
  if (local) {
    console.log("Local backup:", file);
    process.exit(0);
  }
  const key = Buffer.from(process.env.COURVIX_BACKUP_KEY, "base64");
  if (key.length !== 32)
    throw Error("Backup key must contain 32 random bytes.");
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv),
    data = Buffer.concat([cipher.update(readFileSync(file)), cipher.final()]);
  writeFileSync(
    file + ".enc",
    Buffer.concat([Buffer.from("CVBACKUP1"), iv, cipher.getAuthTag(), data]),
  );
  rmSync(file);
  console.log("Encrypted backup:", file + ".enc");
} else if (operation === "decrypt") {
  if (!input || !process.env.COURVIX_BACKUP_KEY)
    throw Error("Supply encrypted file and COURVIX_BACKUP_KEY.");
  const bytes = readFileSync(input);
  if (bytes.subarray(0, 9).toString() !== "CVBACKUP1")
    throw Error("Unknown backup format.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(process.env.COURVIX_BACKUP_KEY, "base64"),
    bytes.subarray(9, 21),
  );
  decipher.setAuthTag(bytes.subarray(21, 37));
  const plain = Buffer.concat([
    decipher.update(bytes.subarray(37)),
    decipher.final(),
  ]);
  const output = path.join(dir, "restore.sql");
  writeFileSync(output, plain, { mode: 0o600 });
  console.log("Decrypted locally:", output);
} else
  throw Error(
    "Use export or decrypt. Restore into an isolated database before touching production.",
  );
