ALTER TABLE cv_outbox ADD COLUMN invite_id TEXT;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS cv_one_open_subscription ON cv_billing(club) WHERE status IN ('Pending','Review');
