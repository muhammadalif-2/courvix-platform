import assert from "node:assert/strict";
import {
  createDemoState,
  simulateRequest,
  upgradeDemoState,
} from "../lib/demo-engine.ts";
import {
  canonicalSport,
  validTimezone,
  validAmount,
  COUNTRIES,
} from "../lib/sports.ts";
import { translate } from "../lib/locales.ts";
const s = createDemoState(),
  call = (path, method = "GET", body = {}) =>
    simulateRequest(s, path, method, body).value;
assert.equal(s.version, 3);
assert.equal(s.organizations.length, 2);
let hub = call("/api/organization");
assert.equal(hub.clubs.length, 3);
assert.equal(hub.organizations[0].name, "Batam Sports Group");
assert.equal(
  hub.stats.reduce((n, c) => n + c.activeMembers, 0),
  24,
);
call("/api/access", "POST", { action: "switch", club: "demo-nusa" });
assert.equal(s.club, "demo-nusa");
let workspace = call("/api/workspace");
assert.equal(workspace.data.records.Clubs[0].workspace_type, "Trainer");
assert.equal(workspace.data.records.Teams[0].name, "Strength · Personal class");
assert.equal(workspace.data.records.Members.length, 4);
call("/api/account", "PUT", {
  displayName: "Review Owner",
  country: "GB",
  locale: "en",
  timezone: "Europe/London",
  sport: "Fitness",
});
assert.equal(call("/api/account").profile.display_name, "Review Owner");
call("/api/account", "POST", { avatarData: "data:image/jpeg;base64,AA==" });
assert.ok(call("/api/account").avatarUrl.startsWith("data:"));
call("/api/access", "POST", { action: "switch", club: "demo-batam" });
assert.equal(call("/api/account").profile.display_name, "Review Owner");
assert.ok(call("/api/account").avatarUrl);
s.role = "Coach";
assert.throws(() => call("/api/organization"));
assert.throws(() => call("/api/operator"));
assert.throws(() =>
  call("/api/access", "POST", { action: "switch", club: "demo-nusa" }),
);
s.role = "Platform";
const p = call("/api/operator");
assert.equal(p.summary.members, 24);
assert.equal(
  p.clubs.find((c) => c.id === "demo-nusa").workspace_type,
  "Trainer",
);
assert.ok(p.clubs.every((c) => c.owner.length));
assert.equal(p.history.length, 6);
assert.equal(p.summary.review, 1);
assert.ok(p.users.find((u) => u.name === "Review Owner"));
const old = structuredClone(s);
old.version = 2;
delete old.organizations;
delete old.accountProfiles;
const upgraded = upgradeDemoState(old);
assert.equal(upgraded.version, 3);
assert.equal(upgraded.data.records.Clubs.length, 3);
assert.equal(upgraded.data.records.Members.length, 24);
assert.equal(canonicalSport("Basketball"), "Basket");
assert.equal(canonicalSport("free typed spelling"), "");
assert.equal(COUNTRIES.length, 249);
assert.equal(validTimezone("America/New_York"), true);
assert.equal(validTimezone("fake/zone"), false);
assert.equal(validAmount(1.25, "USD"), true);
assert.equal(validAmount(1.234, "USD"), false);
assert.equal(validAmount(0.125, "KWD"), true);
assert.equal(validAmount(1.5, "JPY"), false);
assert.equal(validAmount(1.5, "IDR"), false);
assert.equal(translate("Ruang utama", "en"), "Headquarters");
assert.equal(translate("Profil saya", "ja"), "My profile");
assert.equal(translate("Cabang & lokasi", "ar"), "Branches & locations");
assert.equal(translate("My custom team name", "en"), "My custom team name");
console.log(
  "PASS network/domain: trainer and club branches, role isolation, shared account photo/profile, upgrade preservation, platform counts, currency precision, country/timezone catalogs and language fallback.",
);
