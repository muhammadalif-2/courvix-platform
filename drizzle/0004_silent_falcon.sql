CREATE TABLE `cv_jobs` (
	`name` text PRIMARY KEY NOT NULL,
	`lease_until` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cv_reminder_preferences` (
	`club` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`email_enabled` integer DEFAULT 0 NOT NULL,
	`lead_days` integer DEFAULT 3 NOT NULL,
	`interval_days` integer DEFAULT 3 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`club`) REFERENCES `cv_clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cv_reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`club` text NOT NULL,
	`invoice` text NOT NULL,
	`member` text NOT NULL,
	`slot` text NOT NULL,
	`message` text NOT NULL,
	`delivery` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`sent_at` text,
	`read_at` text,
	`error` text,
	FOREIGN KEY (`club`) REFERENCES `cv_clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cv_reminder_once` ON `cv_reminders` (`club`,`invoice`,`slot`);--> statement-breakpoint
CREATE INDEX `cv_reminder_club` ON `cv_reminders` (`club`,`created_at`);--> statement-breakpoint
CREATE TABLE `cv_renewal_choices` (
	`club` text NOT NULL,
	`member` text NOT NULL,
	`period` text NOT NULL,
	`decision` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`club`, `member`),
	FOREIGN KEY (`club`) REFERENCES `cv_clubs`(`id`) ON UPDATE no action ON DELETE no action
);
