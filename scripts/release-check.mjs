import { pathToFileURL } from "node:url";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";
const hosting = JSON.parse(readFileSync(".openai/hosting.json", "utf8"));
const required = [
  "dist/server/index.js",
  "dist/server/wrangler.json",
  "drizzle/0002_v1_clubs.sql",
  "docs/RELEASE.md",
  "docs/ACCOUNT-ONBOARDING.md",
  "drizzle/0006_broken_young_avengers.sql",
];
const missing = required.filter((f) => !existsSync(f));
if (missing.length) throw Error("Missing release files: " + missing.join(", "));
if (process.env.COURVIX_RELEASE_TARGET === "sites" && !hosting.project_id) throw Error("Site identity missing for the Sites release target.");
const manifest = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
if (manifest.vars?.COURVIX_LOCAL_AUTH || manifest.vars?.COURVIX_AUTH_SECRET)
  throw Error(
    "Local authentication must never be included in release configuration.",
  );
const {default: assets} = await import(pathToFileURL(path.resolve("dist/server/__vite_rsc_assets_manifest.js")).href);
const referenced = new Set(Object.values(assets.clientReferenceDeps).flatMap(deps => [...deps.js, ...deps.css]));
const missingAssets = [...referenced].filter(file => !existsSync(path.join("dist/client", file)));
if (missingAssets.length) throw Error("Client reference assets are missing: " + missingAssets.join(", "));
console.log("PASS: " + referenced.size + " client reference assets exist; no dangling CSS-only JavaScript preloads.");
console.log(
  "PASS: artifact, migrations, runbook and local-auth separation. Live configuration, backup activation and acceptance checks remain explicit release gates.",
);
