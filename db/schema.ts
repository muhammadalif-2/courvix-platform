import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  blob,
  index,
  unique,
  uniqueIndex,
  primaryKey,
  check,
} from "drizzle-orm/sqlite-core";
export const demoWorkspaces = sqliteTable("demo_workspaces", {
  owner: text("owner").primaryKey(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const profileFiles = sqliteTable(
  "profile_files",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    subject: text("subject").notNull(),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    category: text("category").notNull(),
    content: blob("content", { mode: "buffer" }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("profile_files_owner_subject").on(t.owner, t.subject, t.kind)],
);

// V1 shared-club schema. The historical demo tables above are retained for rollback.
export const cvUsers = sqliteTable("cv_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});
export const cvClubs = sqliteTable("cv_clubs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sport: text("sport").notNull(),
  timezone: text("timezone").notNull().default("Asia/Jakarta"),
  groupLabel: text("group_label").notNull().default("Kelompok"),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  trialEnds: text("trial_ends").notNull(),
  renewAt: text("renew_at"),
  revision: integer("revision").notNull().default(0),
  website: text("website").notNull().default("{}"),
  bankName: text("bank_name").notNull().default(""),
  bankAccount: text("bank_account").notNull().default(""),
  bankHolder: text("bank_holder").notNull().default(""),
  organizationId: text("organization_id"),
  workspaceType: text("workspace_type").notNull().default("Club"),
  country: text("country").notNull().default("ID"),
  currency: text("currency").notNull().default("IDR"),
  locale: text("locale").notNull().default("id"),
  location: text("location").notNull().default(""),
  createdAt: text("created_at").notNull(),
});
export const cvMemberships = sqliteTable(
  "cv_memberships",
  {
    id: text("id").primaryKey(),
    club: text("club")
      .notNull()
      .references(() => cvClubs.id),
    userId: text("user_id")
      .notNull()
      .references(() => cvUsers.id),
    role: text("role").notNull(),
    team: text("team"),
    subject: text("subject"),
    active: integer("active").notNull().default(1),
    permissions: text("permissions").notNull().default("{}"),
    canInviteAdmin: integer("can_invite_admin").notNull().default(0),
  },
  (t) => [
    unique("cv_memberships_club_user_id_unique").on(t.club, t.userId),
    index("cv_memberships_user").on(t.userId, t.active),
    check(
      "cv_memberships_role",
      sql`${t.role} IN ('Owner','Admin','Coach','Member')`,
    ),
  ],
);
export const cvRecords = sqliteTable(
  "cv_records",
  {
    club: text("club")
      .notNull()
      .references(() => cvClubs.id),
    module: text("module").notNull(),
    id: text("id").notNull(),
    payload: text("payload").notNull(),
  },
  (t) => [primaryKey({ columns: [t.club, t.module, t.id] })],
);
export const cvInvites = sqliteTable(
  "cv_invites",
  {
    id: text("id").primaryKey(),
    club: text("club")
      .notNull()
      .references(() => cvClubs.id),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    team: text("team"),
    subject: text("subject"),
    tokenHash: text("token_hash").notNull().unique(),
    permissions: text("permissions").notNull().default("{}"),
    expires: integer("expires").notNull(),
    usedAt: text("used_at"),
    revokedAt: text("revoked_at"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("cv_invites_club").on(t.club),
    uniqueIndex("cv_invites_live")
      .on(t.club, t.email)
      .where(sql`${t.usedAt} IS NULL AND ${t.revokedAt} IS NULL`),
    check("cv_invites_role", sql`${t.role} IN ('Admin','Coach','Member')`),
  ],
);
export const cvOutbox = sqliteTable("cv_outbox", {
  id: text("id").primaryKey(),
  club: text("club"),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  html: text("html").notNull(),
  status: text("status").notNull(),
  attempts: integer("attempts").notNull().default(0),
  error: text("error"),
  createdAt: text("created_at").notNull(),
  sentAt: text("sent_at"),
  inviteId: text("invite_id"),
});
export const cvBilling = sqliteTable(
  "cv_billing",
  {
    id: text("id").primaryKey(),
    club: text("club")
      .notNull()
      .references(() => cvClubs.id),
    plan: text("plan").notNull(),
    amount: integer("amount").notNull(),
    status: text("status").notNull(),
    reference: text("reference").notNull().default(""),
    note: text("note").notNull().default(""),
    reviewedBy: text("reviewed_by"),
    reviewedAt: text("reviewed_at"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("cv_billing_club").on(t.club, t.createdAt),
    uniqueIndex("cv_one_open_subscription")
      .on(t.club)
      .where(sql`${t.status} IN ('Pending','Review')`),
  ],
);
export const cvAudit = sqliteTable(
  "cv_audit",
  {
    id: text("id").primaryKey(),
    club: text("club").notNull(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    detail: text("detail").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("cv_audit_club").on(t.club, t.createdAt)],
);
export const cvRateLimits = sqliteTable("cv_rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: integer("reset_at").notNull(),
});
export const cvDevSessions = sqliteTable("cv_dev_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  expires: integer("expires").notNull(),
});
export const cvHistory = sqliteTable("cv_record_history", {
  id: text("id").primaryKey(),
  club: text("club").notNull(),
  module: text("module").notNull(),
  recordId: text("record_id").notNull(),
  payload: text("payload").notNull(),
  actor: text("actor").notNull(),
  createdAt: text("created_at").notNull(),
});
export const cvRevisionGuard = sqliteTable(
  "cv_revision_guard",
  { value: integer("value").notNull() },
  (t) => [check("cv_revision_guard_value", sql`${t.value}=1`)],
);

export const cvReminderPreferences = sqliteTable("cv_reminder_preferences", {
  club: text("club")
    .primaryKey()
    .references(() => cvClubs.id),
  enabled: integer("enabled").notNull().default(0),
  emailEnabled: integer("email_enabled").notNull().default(0),
  leadDays: integer("lead_days").notNull().default(3),
  intervalDays: integer("interval_days").notNull().default(3),
  updatedAt: text("updated_at").notNull(),
});
export const cvRenewalChoices = sqliteTable(
  "cv_renewal_choices",
  {
    club: text("club")
      .notNull()
      .references(() => cvClubs.id),
    member: text("member").notNull(),
    period: text("period").notNull(),
    decision: text("decision").notNull(),
    note: text("note").notNull().default(""),
    updatedBy: text("updated_by").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.club, t.member] })],
);
export const cvReminders = sqliteTable(
  "cv_reminders",
  {
    id: text("id").primaryKey(),
    club: text("club")
      .notNull()
      .references(() => cvClubs.id),
    invoice: text("invoice").notNull(),
    member: text("member").notNull(),
    slot: text("slot").notNull(),
    message: text("message").notNull(),
    delivery: text("delivery").notNull(),
    attempts: integer("attempts").notNull().default(0),
    createdAt: text("created_at").notNull(),
    sentAt: text("sent_at"),
    readAt: text("read_at"),
    error: text("error"),
  },
  (t) => [
    uniqueIndex("cv_reminder_once").on(t.club, t.invoice, t.slot),
    index("cv_reminder_club").on(t.club, t.createdAt),
  ],
);
export const cvJobs = sqliteTable("cv_jobs", {
  name: text("name").primaryKey(),
  leaseUntil: integer("lease_until").notNull(),
});

export const cvOrganizations = sqliteTable("cv_organizations", {
  id: text("id").primaryKey(),
  owner: text("owner")
    .notNull()
    .references(() => cvUsers.id),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("Club"),
  createdAt: text("created_at").notNull(),
});
export const cvUserProfiles = sqliteTable("cv_user_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => cvUsers.id),
  displayName: text("display_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  city: text("city").notNull().default(""),
  country: text("country").notNull().default("ID"),
  bio: text("bio").notNull().default(""),
  title: text("title").notNull().default(""),
  sport: text("sport").notNull().default(""),
  locale: text("locale").notNull().default("id"),
  timezone: text("timezone").notNull().default("Asia/Jakarta"),
  avatarKey: text("avatar_key"),
  updatedAt: text("updated_at").notNull(),
});

export { authUser, authSession, authAccount, authVerification, authRateLimit, authTestMail } from "./auth-schema";
export const cvRoleDefaults=sqliteTable("cv_role_defaults",{club:text("club").notNull().references(()=>cvClubs.id),role:text("role").notNull(),permissions:text("permissions").notNull().default("{}"),updatedBy:text("updated_by").notNull(),updatedAt:text("updated_at").notNull()},t=>[primaryKey({columns:[t.club,t.role]})]);
export const cvJoinLinks=sqliteTable("cv_join_links",{id:text("id").primaryKey(),club:text("club").notNull().references(()=>cvClubs.id),role:text("role").notNull(),team:text("team"),name:text("name").notNull(),tokenHash:text("token_hash").notNull().unique(),permissions:text("permissions").notNull().default("{}"),expires:integer("expires").notNull(),maxUses:integer("max_uses").notNull(),uses:integer("uses").notNull().default(0),revokedAt:text("revoked_at"),createdBy:text("created_by").notNull(),createdAt:text("created_at").notNull()},t=>[index("cv_join_links_club").on(t.club)]);
export const cvJoinRequests=sqliteTable("cv_join_requests",{id:text("id").primaryKey(),linkId:text("link_id").notNull().references(()=>cvJoinLinks.id),club:text("club").notNull().references(()=>cvClubs.id),userId:text("user_id").notNull().references(()=>cvUsers.id),status:text("status").notNull().default("Pending"),note:text("note").notNull().default(""),reviewedBy:text("reviewed_by"),reviewedAt:text("reviewed_at"),createdAt:text("created_at").notNull()},t=>[uniqueIndex("cv_join_requests_person").on(t.linkId,t.userId),index("cv_join_requests_club").on(t.club,t.status)]);
