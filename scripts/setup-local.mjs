import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
const root = new URL("../", import.meta.url);
process.chdir(fileURLToPath(root));
mkdirSync(".sites-runtime", { recursive: true });
if (!existsSync(".sites-runtime/execution-profile.json"))
  writeFileSync(
    ".sites-runtime/execution-profile.json",
    JSON.stringify({
      executionProfile:
        process.env.SITES_MANAGED_LINUX_CONTAINER === "1"
          ? "managed-linux"
          : "portable",
    }) + "\n",
  );
if (!existsSync(".dev.vars"))
  writeFileSync(
    ".dev.vars",
    'COURVIX_LOCAL_AUTH="1"\nCOURVIX_ADMIN_EMAILS="owner@courvix.test"\nCOURVIX_SUPPORT_EMAIL="courvix.id@gmail.com"\nCOURVIX_AUTH_SECRET="'+randomBytes(48).toString('hex')+'"\n',
  );
const config = {
  name: "courvix-local",
  compatibility_date: "2026-05-15",
  r2_buckets:[{binding:"BUCKET",bucket_name:"courvix-avatars-local"}],
  d1_databases: [
    {
      binding: "DB",
      database_name: "site-creator-d1",
      database_id: "00000000-0000-4000-8000-000000000000",
      migrations_dir: "drizzle",
    },
  ],
};
writeFileSync("wrangler.local.json", JSON.stringify(config));
const r = spawnSync(
  process.execPath,
  [
    "--import",
    "./scripts/sites-env.mjs",
    "node_modules/wrangler/bin/wrangler.js",
    "d1",
    "migrations",
    "apply",
    "DB",
    "--local",
    "--persist-to",
    ".wrangler/state",
    "--config",
    "wrangler.local.json",
  ],
  { stdio: "inherit" },
);
if (r.status) process.exit(r.status);
console.log(
  "Local setup complete. Run npm run dev. Production local auth remains disabled.",
);
