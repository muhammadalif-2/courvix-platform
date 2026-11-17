CREATE TABLE `cv_auth_account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `cv_auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cv_auth_account_user` ON `cv_auth_account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cv_auth_account_provider` ON `cv_auth_account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE TABLE `cv_auth_rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cv_auth_rate_limit_key_unique` ON `cv_auth_rate_limit` (`key`);--> statement-breakpoint
CREATE TABLE `cv_auth_session` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `cv_auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cv_auth_session_token_unique` ON `cv_auth_session` (`token`);--> statement-breakpoint
CREATE INDEX `cv_auth_session_user` ON `cv_auth_session` (`user_id`);--> statement-breakpoint
CREATE TABLE `cv_auth_test_mail` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cv_auth_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cv_auth_user_email_unique` ON `cv_auth_user` (`email`);--> statement-breakpoint
CREATE TABLE `cv_auth_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cv_auth_verification_identifier` ON `cv_auth_verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `cv_join_links` (
	`id` text PRIMARY KEY NOT NULL,
	`club` text NOT NULL,
	`role` text NOT NULL,
	`team` text,
	`name` text NOT NULL,
	`token_hash` text NOT NULL,
	`permissions` text DEFAULT '{}' NOT NULL,
	`expires` integer NOT NULL,
	`max_uses` integer NOT NULL,
	`uses` integer DEFAULT 0 NOT NULL,
	`revoked_at` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`club`) REFERENCES `cv_clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cv_join_links_token_hash_unique` ON `cv_join_links` (`token_hash`);--> statement-breakpoint
CREATE INDEX `cv_join_links_club` ON `cv_join_links` (`club`);--> statement-breakpoint
CREATE TABLE `cv_join_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`link_id` text NOT NULL,
	`club` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`link_id`) REFERENCES `cv_join_links`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`club`) REFERENCES `cv_clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `cv_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cv_join_requests_person` ON `cv_join_requests` (`link_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `cv_join_requests_club` ON `cv_join_requests` (`club`,`status`);--> statement-breakpoint
CREATE TABLE `cv_role_defaults` (
	`club` text NOT NULL,
	`role` text NOT NULL,
	`permissions` text DEFAULT '{}' NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`club`, `role`),
	FOREIGN KEY (`club`) REFERENCES `cv_clubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `cv_invites` ADD `permissions` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `cv_memberships` ADD `permissions` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `cv_memberships` ADD `can_invite_admin` integer DEFAULT 0 NOT NULL;