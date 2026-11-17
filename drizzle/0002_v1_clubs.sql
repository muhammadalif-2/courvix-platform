-- V1 is deliberately separate from historical visitor demo snapshots.
PRAGMA foreign_keys = ON;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cv_users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cv_clubs(id TEXT PRIMARY KEY,name TEXT NOT NULL,sport TEXT NOT NULL,timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',group_label TEXT NOT NULL DEFAULT 'Kelompok',plan TEXT NOT NULL,status TEXT NOT NULL,trial_ends TEXT NOT NULL,renew_at TEXT,revision INTEGER NOT NULL DEFAULT 0,website TEXT NOT NULL DEFAULT '{}',bank_name TEXT NOT NULL DEFAULT '',bank_account TEXT NOT NULL DEFAULT '',bank_holder TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cv_memberships(id TEXT PRIMARY KEY,club TEXT NOT NULL REFERENCES cv_clubs(id),user_id TEXT NOT NULL REFERENCES cv_users(id),role TEXT NOT NULL CHECK(role IN ('Owner','Admin','Coach','Member')),team TEXT,subject TEXT,active INTEGER NOT NULL DEFAULT 1,UNIQUE(club,user_id));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS cv_memberships_user ON cv_memberships(user_id,active);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cv_records(club TEXT NOT NULL REFERENCES cv_clubs(id),module TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(club,module,id));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cv_invites(id TEXT PRIMARY KEY,club TEXT NOT NULL REFERENCES cv_clubs(id),email TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('Admin','Coach','Member')),team TEXT,subject TEXT,token_hash TEXT NOT NULL UNIQUE,expires INTEGER NOT NULL,used_at TEXT,revoked_at TEXT,created_by TEXT NOT NULL,created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS cv_invites_club ON cv_invites(club);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS cv_invites_live ON cv_invites(club,email) WHERE used_at IS NULL AND revoked_at IS NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cv_outbox(id TEXT PRIMARY KEY,club TEXT,to_email TEXT NOT NULL,subject TEXT NOT NULL,html TEXT NOT NULL,status TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,error TEXT,created_at TEXT NOT NULL,sent_at TEXT);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cv_billing(id TEXT PRIMARY KEY,club TEXT NOT NULL REFERENCES cv_clubs(id),plan TEXT NOT NULL,amount INTEGER NOT NULL,status TEXT NOT NULL,reference TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',reviewed_by TEXT,reviewed_at TEXT,created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS cv_billing_club ON cv_billing(club,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cv_audit(id TEXT PRIMARY KEY,club TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS cv_audit_club ON cv_audit(club,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cv_rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cv_dev_sessions(token_hash TEXT PRIMARY KEY,email TEXT NOT NULL,name TEXT NOT NULL,expires INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cv_record_history(id TEXT PRIMARY KEY,club TEXT NOT NULL,module TEXT NOT NULL,record_id TEXT NOT NULL,payload TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cv_revision_guard(value INTEGER NOT NULL CHECK(value=1));
