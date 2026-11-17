CREATE TABLE `cv_organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'Club' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner`) REFERENCES `cv_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cv_user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`country` text DEFAULT 'ID' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`sport` text DEFAULT '' NOT NULL,
	`locale` text DEFAULT 'id' NOT NULL,
	`timezone` text DEFAULT 'Asia/Jakarta' NOT NULL,
	`avatar_key` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `cv_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `cv_clubs` ADD `organization_id` text;--> statement-breakpoint
ALTER TABLE `cv_clubs` ADD `workspace_type` text DEFAULT 'Club' NOT NULL;--> statement-breakpoint
ALTER TABLE `cv_clubs` ADD `country` text DEFAULT 'ID' NOT NULL;--> statement-breakpoint
ALTER TABLE `cv_clubs` ADD `currency` text DEFAULT 'IDR' NOT NULL;--> statement-breakpoint
ALTER TABLE `cv_clubs` ADD `locale` text DEFAULT 'id' NOT NULL;--> statement-breakpoint
ALTER TABLE `cv_clubs` ADD `location` text DEFAULT '' NOT NULL;