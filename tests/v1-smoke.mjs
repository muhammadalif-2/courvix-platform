import assert from "node:assert/strict";
const base = process.env.COURVIX_TEST_URL || "http://localhost:5174",
  suffix = Date.now();
const today = new Date().toLocaleDateString("sv-SE", {
  timeZone: "Asia/Jakarta",
});
function browser() {
  const jar = new Map();
  return {
    jar,
    async req(path, method = "GET", data) {
      const headers = {
        Connection: "close",
        Origin: base,
        Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
      };
      if (data) headers["Content-Type"] = "application/json";
      const r = await fetch(base + path, {
        method,
        headers,
        signal: AbortSignal.timeout(20000),
        body: data ? JSON.stringify(data) : undefined,
      });
      for (const c of r.headers.getSetCookie()) {
        const p = c.split(";")[0],
          i = p.indexOf("=");
        jar.set(p.slice(0, i), p.slice(i + 1));
      }
      let value;
      const responseText = await r.text();
      try {
        value = JSON.parse(responseText);
      } catch {
        value = {
          unstructured: responseText,
          status: r.status,
          contentType: r.headers.get("content-type"),
        };
      }
      return { status: r.status, data: value };
    },
    async ok(path, method = "GET", data, status = 200) {
      const r = await this.req(path, method, data);
      assert.equal(r.status, status, JSON.stringify(r.data));
      return r.data;
    },
    async login(email, name = email) {
      await this.ok("/api/local-session", "POST", { email, name });
    },
    async state() {
      return this.ok("/api/workspace");
    },
    async save(fn, expected = 200) {
      const s = await this.state();
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
  peer = browser(),
  coach = browser(),
  member = browser(),
  other = browser(),
  operator = browser(),
  anonymous = browser();
assert.equal((await anonymous.req("/api/workspace")).status, 401);
await owner.login(`owner${suffix}@example.test`, "Owner Uji");
await owner.ok(
  "/api/access",
  "POST",
  {
    action: "register",
    terms: true,
    clubName: "Klub V1 " + suffix,
    sport: "Renang",
    groupLabel: "Kelas",
    timezone: "Asia/Jakarta",
    plan: "Starter",
  },
  201,
);
let s = await owner.state();
const club = s.session.club;
assert.ok(s.session.isOwner);
assert.equal(s.data.records.Members.length, 0);
assert.equal(s.data.records.Invoices.length, 0);
assert.equal(s.data.fee.flat, 0);
assert.equal(s.data.records.Clubs[0].sport, "Renang");
await owner.ok("/api/access", "POST", {
  action: "settings",
  clubName: "Klub V1 " + suffix,
  groupLabel: "Kelas",
  timezone: "Asia/Jakarta",
  bankName: "Bank Uji",
  bankAccount: "00000000",
  bankHolder: "Klub Uji",
});
const group = "group-" + suffix,
  coachId = "coach-" + suffix,
  memberId = "member-" + suffix,
  plan = "plan-" + suffix,
  session = "session-" + suffix,
  invoice = "invoice-" + suffix;
await owner.save((d) => {
  d.records.Coaches.push({
    id: coachId,
    club,
    name: "Coach Uji",
    email: `coach${suffix}@example.test`,
    status: "Active",
    team: group,
  });
  d.records.Teams.push({
    id: group,
    club,
    name: "Kelas Dasar",
    sport: "Renang",
    coachId,
    status: "Active",
  });
  d.records.Membership.push({
    id: plan,
    club,
    name: "Iuran Bulanan",
    amount: 350000,
    status: "Active",
  });
  d.records.Members.push({
    id: memberId,
    club,
    name: "Member Uji",
    email: `member${suffix}@example.test`,
    team: group,
    membership: plan,
    status: "Active",
  });
  d.records.Schedule.push({
    id: session,
    club,
    name: "Latihan pertama",
    team: group,
    coachId,
    date: "2027-01-05",
    time: "16:00",
    endTime: "17:00",
    venue: "Kolam Uji",
    status: "Scheduled",
  });
  d.records.Invoices.push({
    id: invoice,
    club,
    member: memberId,
    name: "Member Uji",
    amount: 350000,
    period: today.slice(0, 7),
    due: today,
    date: today,
    status: "Pending",
    fee: 0,
    gateway: 0,
  });
});
const invAdmin = await owner.ok(
  "/api/access",
  "POST",
  {
    action: "invite",
    email: `admin${suffix}@example.test`,
    name: "Admin Uji",
    role: "Admin",
  },
  201,
);
await peer.login(`admin${suffix}@example.test`, "Admin Uji");
await peer.ok("/api/access", "POST", {
  action: "join",
  code: new URL(invAdmin.inviteUrl).searchParams.get("code"),
});
assert.equal((await peer.state()).data.records.Members.length, 1);
assert.equal((await peer.state()).session.role, "Admin");
const invCoach = await owner.ok(
  "/api/access",
  "POST",
  {
    action: "invite",
    email: `coach${suffix}@example.test`,
    name: "Coach Uji",
    role: "Coach",
    team: group,
  },
  201,
);
const invMember = await owner.ok(
  "/api/access",
  "POST",
  {
    action: "invite",
    email: `member${suffix}@example.test`,
    name: "Member Uji",
    role: "Member",
    team: group,
  },
  201,
);
await coach.login(`coach${suffix}@example.test`);
await coach.ok("/api/access", "POST", {
  action: "join",
  code: new URL(invCoach.inviteUrl).searchParams.get("code"),
});
await member.login(`member${suffix}@example.test`);
await member.ok("/api/access", "POST", {
  action: "join",
  code: new URL(invMember.inviteUrl).searchParams.get("code"),
});
assert.equal((await member.state()).data.records.Members.length, 1);
assert.equal((await coach.state()).data.records.Invoices.length, 0);
await coach.save((d) =>
  d.records.Attendance.push({
    id: "att-" + suffix,
    club,
    session,
    member: memberId,
    status: "Present",
  }),
);
assert.equal(
  (await owner.state()).data.records.Attendance[0].recordedBy.includes("coach"),
  true,
);
await owner.ok("/api/reminders", "POST", {
  action: "configure",
  enabled: true,
  emailEnabled: true,
  leadDays: 3,
  intervalDays: 3,
});
const reminderRun = await owner.ok("/api/reminders", "POST", { action: "run" });
assert.equal(reminderRun.created, 1);
assert.equal(reminderRun.sent, 0);
assert.equal(reminderRun.blocked, 1);
assert.equal(
  (await owner.ok("/api/reminders", "POST", { action: "run" })).created,
  0,
);
const memberReminders = await member.ok("/api/reminders");
assert.equal(memberReminders.logs.length, 1);
assert.equal(memberReminders.logs[0].delivery, "Blocked");
await coach.ok("/api/reminders", "GET", undefined, 403);
await member.ok(
  "/api/reminders",
  "POST",
  {
    action: "configure",
    enabled: true,
    emailEnabled: true,
    leadDays: 3,
    intervalDays: 3,
  },
  403,
);
const jobUnauthorized = await fetch(base + "/api/reminders/run", {
  method: "POST",
});
assert.equal(jobUnauthorized.status, 401);
await member.save((d) => {
  d.records.Invoices[0].status = "Paid";
}, 403);
s = await member.state();
await member.ok("/api/payments", "POST", {
  action: "submit",
  id: invoice,
  revision: s.revision,
  reference: "TRF-1234",
  note: "Transfer dari rekening uji",
});
s = await member.state();
await member.ok(
  "/api/payments",
  "POST",
  { action: "approve", id: invoice, revision: s.revision },
  403,
);
s = await peer.state();
await peer.ok("/api/payments", "POST", {
  action: "approve",
  id: invoice,
  revision: s.revision,
});
s = await member.state();
assert.equal(s.data.records.Invoices[0].status, "Paid");
assert.equal(s.data.records.Payments[0].total, 350000);
assert.equal(s.data.records.Payments[0].fee, 0);
s = await peer.state();
await peer.ok(
  "/api/payments",
  "POST",
  { action: "approve", id: invoice, revision: s.revision },
  409,
);
await owner.save((d) => {
  d.records.Payments[0].amount = 1;
}, 403);
s = await owner.state();
const stale = structuredClone(s);
await peer.save((d) =>
  d.records.Announcements.push({
    id: "news-" + suffix,
    club,
    name: "Jadwal baru",
    status: "Active",
  }),
);
await owner.ok(
  "/api/workspace",
  "PUT",
  { data: stale.data, revision: stale.revision },
  409,
);
await other.login(`other${suffix}@example.test`);
await other.ok(
  "/api/access",
  "POST",
  {
    action: "register",
    terms: true,
    clubName: "Klub Lain " + suffix,
    sport: "Basket",
    groupLabel: "Tim",
    timezone: "Asia/Jakarta",
    plan: "Starter",
  },
  201,
);
assert.equal((await other.state()).data.records.Members.length, 0);
await other.save(
  (d) => d.records.Members.push({ id: "cross", club, name: "Attack" }),
  403,
);
await other.ok(
  "/api/access",
  "POST",
  {
    action: "join",
    code: new URL(invMember.inviteUrl).searchParams.get("code"),
  },
  410,
);
const wrong = await owner.ok(
  "/api/access",
  "POST",
  {
    action: "invite",
    email: `wrong${suffix}@example.test`,
    name: "Wrong",
    role: "Member",
    team: group,
  },
  201,
);
await other.ok(
  "/api/access",
  "POST",
  { action: "join", code: new URL(wrong.inviteUrl).searchParams.get("code") },
  403,
);
await peer.ok(
  "/api/access",
  "POST",
  {
    action: "invite",
    role: "Admin",
    email: "escalate@example.test",
    name: "Escalate",
  },
  403,
);
const access = await owner.ok("/api/access");
const target = access.users.find(
  (u) => u.email === `coach${suffix}@example.test`,
);
await owner.ok("/api/access", "POST", { action: "revoke-user", id: target.id });
assert.equal((await coach.req("/api/workspace")).status, 403);
await owner.ok(
  "/api/access",
  "POST",
  { action: "subscribe", plan: "Starter" },
  201,
);
const bill = (await owner.ok("/api/access")).billing[0];
await owner.ok("/api/access", "POST", {
  action: "subscription-proof",
  id: bill.id,
  reference: "SUB-1234",
});
await peer.ok("/api/operator", "GET", undefined, 403);
await operator.login("owner@courvix.test");
await operator.ok("/api/operator", "POST", {
  action: "review-subscription",
  id: bill.id,
  decision: "approve",
});
assert.equal((await owner.ok("/api/access")).club.status, "Active");
const exportData = await owner.ok("/api/export");
assert.equal(exportData.data.records.Members.length, 1);
assert.equal(exportData.data._access, undefined);
await member.ok("/api/profile?kind=Members&subject=" + memberId, "PUT", {
  phone: "08000000",
  city: "Batam",
});
assert.equal(
  (await owner.ok("/api/profile?kind=Members&subject=" + memberId)).profile
    .city,
  "Batam",
);
await member.ok(
  "/api/profile?kind=Members&subject=" + memberId,
  "POST",
  { file: "fake" },
  405,
);
s = await owner.state();
await owner.ok("/api/payments", "POST", {
  action: "reverse",
  id: invoice,
  revision: s.revision,
  note: "Koreksi rekening penerima pada pencatatan uji",
});
s = await owner.state();
assert.equal(
  s.data.records.Payments.reduce((n, p) => n + p.amount, 0),
  0,
);
assert.equal(s.data.records.Payments.length, 2);
assert.equal(s.data.records.Invoices[0].status, "Pending");

// Stop prevents new-period billing while preserving existing debt, and can be reversed by the member.
await member.ok("/api/reminders", "POST", {
  action: "choice",
  period: today.slice(0, 7),
  decision: "Stop",
});
const futurePeriod = new Date(
  Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 1),
)
  .toISOString()
  .slice(0, 7);
await owner.save(
  (d) =>
    d.records.Invoices.push({
      id: "future-" + suffix,
      club,
      member: memberId,
      name: "Member Uji",
      amount: 350000,
      period: futurePeriod,
      due: futurePeriod + "-28",
      date: today,
      status: "Pending",
      fee: 0,
      gateway: 0,
    }),
  409,
);
assert.ok(
  (await member.state()).data.records.Invoices.some((i) => i.id === invoice),
);
await member.ok("/api/reminders", "POST", {
  action: "choice",
  period: today.slice(0, 7),
  decision: "Continue",
});
// Additional lifecycle checks: support, single-use revocation, ownership and expiry.
await member.save((d) =>
  d.records.Support.push({
    id: "help-" + suffix,
    club,
    name: "Butuh bantuan jadwal",
    description: "Mohon bantu mengecek jadwal latihan.",
    status: "Open",
  }),
);
let help = (await operator.ok("/api/operator")).support.find(
  (t) => t.id === "help-" + suffix,
);
assert.ok(help);
await operator.ok("/api/operator", "POST", {
  action: "support",
  id: help.id,
  club,
  status: "Resolved",
  response: "Jadwal sudah diperiksa.",
});
assert.equal(
  (await member.state()).data.records.Support.find((t) => t.id === help.id)
    .response,
  "Jadwal sudah diperiksa.",
);
const revokeInvite = await owner.ok(
  "/api/access",
  "POST",
  {
    action: "invite",
    email: "revoked" + suffix + "@example.test",
    name: "Dicabut",
    role: "Member",
    team: group,
  },
  201,
);
const invitation = (await owner.ok("/api/access")).invites.find(
  (i) => i.email === "revoked" + suffix + "@example.test",
);
await owner.ok("/api/access", "POST", { action: "revoke", id: invitation.id });
await other.ok(
  "/api/access",
  "POST",
  {
    action: "join",
    code: new URL(revokeInvite.inviteUrl).searchParams.get("code"),
  },
  410,
);
const currentAccess = await owner.ok("/api/access");
const replacement = currentAccess.users.find(
  (u) => u.email === `admin${suffix}@example.test`,
);
await owner.ok("/api/access", "POST", {
  action: "transfer-owner",
  id: replacement.id,
  confirm: "Klub V1 " + suffix,
});
assert.ok((await peer.state()).session.isOwner);
assert.ok(!(await owner.state()).session.isOwner);
await owner.ok(
  "/api/access",
  "POST",
  {
    action: "invite",
    email: "cannot-admin" + suffix + "@example.test",
    name: "No",
    role: "Admin",
  },
  403,
);
await peer.ok(
  "/api/access",
  "POST",
  { action: "revoke-user", id: replacement.id },
  409,
);
const { spawnSync } = await import("node:child_process");
const sql = spawnSync(
  process.execPath,
  [
    "--import",
    "./scripts/sites-env.mjs",
    "node_modules/wrangler/bin/wrangler.js",
    "d1",
    "execute",
    "DB",
    "--local",
    "--persist-to",
    ".wrangler/state",
    "--config",
    "wrangler.local.json",
    "--command",
    `UPDATE cv_clubs SET status='Active',renew_at='2020-01-01T00:00:00.000Z' WHERE id='${club}'`,
  ],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      WRANGLER_REGISTRY_PATH:
        process.cwd() + "/.sites-runtime/expiry-test/dev-registry",
      MINIFLARE_REGISTRY_PATH:
        process.cwd() + "/.sites-runtime/expiry-test/registry",
    },
  },
);
assert.equal(sql.status, 0, sql.stderr);
// The external D1 fixture uses an isolated registry so it cannot replace the API worker.
assert.equal((await peer.state()).readOnly, true);
await peer.save(
  (d) =>
    d.records.Announcements.push({ id: "expired-" + suffix, club, name: "No" }),
  402,
);
// Wrangler can cancel the first non-GET while its local D1 simulator restarts.
// Retry only this denied, idempotent profile check and only its explicit restart response.
let expiredProfileResult;
for (let attempt = 0; attempt < 6; attempt++) {
  expiredProfileResult = await member.req(
    "/api/profile?kind=Members&subject=" + memberId,
    "PUT",
    { city: "Blocked" },
  );
  if (
    expiredProfileResult.status !== 503 ||
    !expiredProfileResult.data?.unstructured?.includes(
      "Your worker restarted mid-request",
    )
  )
    break;
  await new Promise((resolve) => setTimeout(resolve, 500));
}
assert.equal(
  expiredProfileResult.status,
  402,
  JSON.stringify(expiredProfileResult.data),
);
assert.equal((await peer.ok("/api/export")).data.records.Members.length, 1);
console.log(
  "PASS lifecycle: member support reaches operator and response returns to member; revoked invitations fail; ownership transfer preserves one Owner; old Owner loses privileged actions; expired subscriptions allow read/export and reject writes.",
);
console.log(
  "PASS V1: empty club onboarding; shared accounts across cookie jars; Admin/Coach/Member invites; email binding; replay rejection; attendance; manual submission + admin verification; immutable ledger + reversal; revision conflicts; club isolation; revocation; operator-only subscription approval; role-scoped export/profile; sensitive uploads disabled.",
);
