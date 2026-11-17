import assert from "node:assert/strict";
const base = process.env.COURVIX_TEST_URL || "http://localhost:8788",
  suffix = Date.now();
function browser() {
  const jar = new Map();
  return {
    jar,
    async req(path, method = "GET", data, type) {
      const headers = {
        Origin: base,
        Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
      };
      if (data !== undefined)
        headers["Content-Type"] = type || "application/json";
      const r = await fetch(base + path, {
        method,
        headers,
        body:
          data === undefined ? undefined : type ? data : JSON.stringify(data),
      });
      for (const c of r.headers.getSetCookie()) {
        const p = c.split(";")[0],
          i = p.indexOf("=");
        jar.set(p.slice(0, i), p.slice(i + 1));
      }
      const ct = r.headers.get("content-type") || "";
      const value = ct.includes("json")
        ? await r.json()
        : new Uint8Array(await r.arrayBuffer());
      return { status: r.status, data: value, headers: r.headers };
    },
    async ok(path, method = "GET", data, status = 200, type) {
      const r = await this.req(path, method, data, type);
      assert.equal(r.status, status, JSON.stringify(r.data));
      return r.data;
    },
    async login(email, name) {
      await this.ok("/api/local-session", "POST", {
        email,
        name: name || email,
      });
    },
    async save(fn, expected = 200) {
      const s = await this.ok("/api/workspace");
      fn(s.data, s);
      return this.ok(
        "/api/workspace",
        "PUT",
        { data: s.data, revision: s.revision },
        expected,
      );
    },
  };
}
const owner = browser(),
  other = browser(),
  admin = browser(),
  coach = browser(),
  member = browser(),
  operator = browser(),
  anon = browser();
for (const path of ["/api/account", "/api/organization", "/api/operator"])
  assert.equal((await anon.req(path)).status, 401);
const unsupported = await anon.req(
  "/api/access",
  "POST",
  "not json",
  "text/plain",
);
assert.equal(unsupported.status, 415);
assert.equal(unsupported.data.error, "Send a JSON request.");
const invalidJson = await anon.req(
  "/api/access",
  "POST",
  "{",
  "application/json",
);
assert.equal(invalidJson.status, 400);
assert.equal(invalidJson.data.error, "Invalid JSON.");
await owner.login(`network-owner${suffix}@example.test`, "Network Owner");
let account = await owner.ok("/api/account");
assert.equal(account.editable, true);
assert.equal(account.memberships.length, 0);
const ownerId = account.user.id;
await owner.ok("/api/account", "PUT", {
  displayName: "Alex Morgan",
  title: "Sports director",
  country: "US",
  locale: "en",
  timezone: "America/New_York",
  sport: "Basketball",
  phone: "+12125550100",
  city: "New York",
  bio: "Building a better training experience.",
});
account = await owner.ok("/api/account");
assert.equal(account.profile.display_name, "Alex Morgan");
assert.equal(account.profile.sport, "Basket");
assert.equal((await owner.ok("/api/access")).viewer.name, "Alex Morgan");
assert.equal(
  (
    await owner.req("/api/account", "PUT", {
      country: "XX",
      locale: "en",
      timezone: "America/New_York",
    })
  ).status,
  422,
);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=",
  "base64",
);
await owner.ok("/api/account", "POST", png, 200, "image/png");
account = await owner.ok("/api/account");
assert.ok(account.avatarUrl);
assert.deepEqual(await owner.ok(account.avatarUrl), new Uint8Array(png));
assert.equal((await anon.req(account.avatarUrl)).status, 401);
await other.login(`network-other${suffix}@example.test`);
assert.equal((await other.req(account.avatarUrl)).status, 403);
assert.equal(
  (await owner.req("/api/account", "POST", "<svg/>", "image/svg+xml")).status,
  422,
);
assert.equal(
  (await owner.req("/api/account", "POST", Buffer.alloc(150001), "image/png"))
    .status,
  413,
);
await owner.ok(
  "/api/access",
  "POST",
  {
    action: "register",
    terms: true,
    clubName: "Network Main " + suffix,
    sport: "Basketball",
    workspaceType: "Club",
    country: "US",
    currency: "USD",
    locale: "en",
    timezone: "America/New_York",
    plan: "Starter",
    groupLabel: "Tim",
    location: "Manhattan",
  },
  201,
);
let s = await owner.ok("/api/workspace");
const club = s.session.club;
assert.equal(s.data.records.Clubs[0].sport, "Basket");
assert.equal(s.data.records.Clubs[0].currency, "USD");
let hub = await owner.ok("/api/organization");
assert.equal(hub.clubs.length, 1);
assert.equal(hub.organizations.length, 1);
const org = hub.organizations[0].id;
assert.equal(
  (
    await other.req("/api/access", "POST", {
      action: "register",
      terms: true,
      clubName: "Unauthorized",
      sport: "Basket",
      plan: "Starter",
      organizationId: org,
    })
  ).status,
  403,
);
assert.equal(
  (
    await other.req("/api/organization", "POST", {
      action: "attach",
      organizationId: org,
      club,
    })
  ).status,
  403,
);
await owner.ok(
  "/api/access",
  "POST",
  {
    action: "register",
    terms: true,
    clubName: "Network Studio " + suffix,
    sport: "Fitness",
    workspaceType: "Trainer",
    country: "SG",
    currency: "SGD",
    locale: "en",
    timezone: "Asia/Singapore",
    plan: "Starter",
    groupLabel: "Private",
    organizationId: org,
    location: "Orchard",
  },
  201,
);
const branch = (await owner.ok("/api/workspace")).session.club;
hub = await owner.ok("/api/organization");
assert.equal(hub.clubs.length, 2);
assert.equal(hub.stats.length, 2);
await owner.ok("/api/access", "POST", { action: "switch", club });
const team = "network-team-" + suffix;
await owner.save((d) => {
  d.records.Teams.push({
    id: team,
    club,
    name: "Fundamentals",
    sport: "Basket",
    status: "Active",
  });
});
for (const [role, actor] of [
  ["Admin", admin],
  ["Coach", coach],
  ["Member", member],
]) {
  const email = `network-${role.toLowerCase()}${suffix}@example.test`;
  const invite = await owner.ok(
    "/api/access",
    "POST",
    { action: "invite", role, name: role + " Person", email, team },
    201,
  );
  await actor.login(email, role + " Person");
  await actor.ok("/api/access", "POST", {
    action: "join",
    code: new URL(invite.inviteUrl).searchParams.get("code"),
  });
  const a = await actor.ok("/api/account");
  assert.ok(a.memberships.some((m) => m.role === role));
  await actor.ok("/api/account", "PUT", {
    displayName: role + " Display",
    country: "US",
    locale: "en",
    timezone: "America/New_York",
    sport: "Basket",
  });
  assert.equal(
    (await actor.ok("/api/account")).profile.display_name,
    role + " Display",
  );
  assert.equal((await actor.req("/api/operator")).status, 403);
  assert.equal(
    (await actor.req("/api/access", "POST", { action: "switch", club: branch }))
      .status,
    403,
  );
  const h = await actor.ok("/api/organization");
  assert.equal(h.organizations.length, 0);
  assert.equal(h.clubs.length, 0);
  assert.equal(
    (
      await actor.req("/api/organization", "POST", {
        action: "rename",
        organizationId: org,
        name: "No access",
      })
    ).status,
    403,
  );
}
s = await owner.ok("/api/workspace");
const memberId = s.data.records.Members[0].id;
const period = new Date().toISOString().slice(0, 7);
await owner.save((d) => {
  d.records.Invoices.push({
    id: "dollars-" + suffix,
    club,
    member: memberId,
    name: "Member Person",
    period,
    amount: 1.25,
    date: "2026-11-13",
    due: "2026-12-01",
    status: "Pending",
    fee: 0,
    gateway: 0,
  });
});
await owner.save((d) => {
  d.records.Invoices[0].amount = 1.234;
}, 422);
hub = await owner.ok("/api/organization");
assert.equal(hub.stats.find((s) => s.club === club).outstanding, 1.25);
assert.equal(hub.stats.find((s) => s.club === branch).outstanding, 0);
const memberAccount = await member.ok("/api/account");
await member.ok("/api/account", "POST", png, 200, "image/png");
let directory = (await owner.ok("/api/workspace")).directory;
assert.ok(directory.find((u) => u.subject === memberId).avatarUrl);
assert.equal(
  (
    await coach.req(
      "/api/account?user=" + encodeURIComponent(memberAccount.user.id),
    )
  ).status,
  200,
);
const visible = await coach.ok(
  "/api/account?user=" + encodeURIComponent(memberAccount.user.id),
);
assert.equal(visible.profile.phone, "");
assert.equal(
  (await member.req("/api/account?user=" + encodeURIComponent(ownerId))).status,
  403,
);
await owner.ok("/api/account", "DELETE");
assert.equal(
  (await owner.req("/api/account?photo=" + encodeURIComponent(ownerId))).status,
  404,
);
await operator.login("owner@courvix.test", "Platform Owner");
const platform = await operator.ok("/api/operator");
assert.equal(platform.launch.length, 8);
assert.equal(
  (
    await owner.req("/api/operator", "POST", {
      action: "launch-evidence",
      gate: "identity",
      verified: true,
      note: "A workspace owner must not change platform launch checks.",
    })
  ).status,
  403,
);
assert.equal(
  (
    await operator.req("/api/operator", "POST", {
      action: "launch-evidence",
      gate: "identity",
      verified: true,
      note: "Too short",
    })
  ).status,
  422,
);
await operator.ok("/api/operator", "POST", {
  action: "launch-evidence",
  gate: "identity",
  verified: true,
  note: "Synthetic local acceptance evidence; does not establish real production readiness.",
});
let evidence = (await operator.ok("/api/operator")).launch.find(
  (g) => g.id === "identity",
);
assert.equal(evidence.verified, true);
assert.ok(evidence.checkedAt);
await operator.ok("/api/operator", "POST", {
  action: "launch-evidence",
  gate: "identity",
  verified: false,
  note: "Reopened synthetic check to verify that older approvals cannot override the current result.",
});
evidence = (await operator.ok("/api/operator")).launch.find(
  (g) => g.id === "identity",
);
assert.equal(evidence.verified, false);
const c = platform.clubs.find((c) => c.id === club);
assert.equal(c.members, 1);
assert.equal(c.users, 4);
assert.equal(c.currency, "USD");
assert.equal(c.outstanding, 1.25);
assert.ok(platform.users.some((u) => u.name === "Alex Morgan"));
assert.equal(platform.history.length, 6);
assert.equal(
  (
    await operator.req(
      "/api/account?user=" + encodeURIComponent(memberAccount.user.id),
    )
  ).status,
  200,
);
// Changing ownership must remove the old headquarters relationship and visibility.
const access = await owner.ok("/api/access"),
  target = access.users.find((u) => u.role === "Admin");
await owner.ok("/api/access", "POST", {
  action: "transfer-owner",
  id: target.id,
  confirm: "Network Main " + suffix,
});
hub = await owner.ok("/api/organization");
assert.ok(!hub.clubs.some((c) => c.id === club));
const newHub = await admin.ok("/api/organization");
assert.equal(newHub.clubs.find((c) => c.id === club).organization_id, null);
console.log(
  "PASS network API: persistent profiles for every role, R2 upload/read/delete and access control, canonical sports, international time zones/currencies, decimal invoices, owner-only HQ, branch isolation, operator aggregates and ownership transfer.",
);
