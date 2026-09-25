CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`timeline_id` text NOT NULL,
	`taken_at` integer NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`timeline_id`) REFERENCES `timelines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `entries_timeline_taken_idx` ON `entries` (`timeline_id`,`taken_at`);--> statement-breakpoint
CREATE TABLE `metric_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`timeline_id` text NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`unit` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`timeline_id`) REFERENCES `timelines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `metric_definitions_timeline_idx` ON `metric_definitions` (`timeline_id`,`sort_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `metric_definitions_key_uq` ON `metric_definitions` (`timeline_id`,`key`);--> statement-breakpoint
CREATE TABLE `metric_values` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`metric_id` text NOT NULL,
	`value` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`metric_id`) REFERENCES `metric_definitions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `metric_values_entry_metric_uq` ON `metric_values` (`entry_id`,`metric_id`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`angle_id` text NOT NULL,
	`file_name` text NOT NULL,
	`thumb_file_name` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`source` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`angle_id`) REFERENCES `timeline_angles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `photos_entry_idx` ON `photos` (`entry_id`);--> statement-breakpoint
CREATE INDEX `photos_angle_idx` ON `photos` (`angle_id`);--> statement-breakpoint
CREATE TABLE `timeline_angles` (
	`id` text PRIMARY KEY NOT NULL,
	`timeline_id` text NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`overlay_key` text,
	`sort_order` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`timeline_id`) REFERENCES `timelines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `timeline_angles_timeline_idx` ON `timeline_angles` (`timeline_id`,`sort_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `timeline_angles_key_uq` ON `timeline_angles` (`timeline_id`,`key`);--> statement-breakpoint
CREATE TABLE `timelines` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`template_key` text NOT NULL,
	`color` text NOT NULL,
	`icon` text NOT NULL,
	`reminder_interval_days` integer,
	`reminder_time` text,
	`archived_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
