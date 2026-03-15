CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`feed_id` text NOT NULL,
	`guid` text NOT NULL,
	`title` text,
	`url` text,
	`author` text,
	`content` text,
	`description` text,
	`published_at` integer NOT NULL,
	`read_at` integer,
	`starred` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entries_feed_guid_unique` ON `entries` (`feed_id`,`guid`);--> statement-breakpoint
CREATE TABLE `feed_categories` (
	`feed_id` text NOT NULL,
	`category_id` text NOT NULL,
	PRIMARY KEY(`feed_id`, `category_id`),
	FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `feeds` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`url` text NOT NULL,
	`site_url` text,
	`description` text,
	`image_url` text,
	`last_fetched_at` integer,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feeds_url_unique` ON `feeds` (`url`);--> statement-breakpoint
CREATE TABLE `summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`summary` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `summaries_entry_language_unique` ON `summaries` (`entry_id`,`language`);--> statement-breakpoint
CREATE TABLE `translations` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`title` text,
	`content` text,
	`language` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `translations_entry_language_unique` ON `translations` (`entry_id`,`language`);