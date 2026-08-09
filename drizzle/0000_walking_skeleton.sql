CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stages` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`keys_taught` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY NOT NULL,
	`track` text NOT NULL,
	`stage_id` integer,
	`content` text,
	FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT `exercises_track_check` CHECK (`track` IN ('learn', 'speed_test')),
	CONSTRAINT `exercises_stage_check` CHECK (
		(`track` = 'learn' AND `stage_id` IS NOT NULL)
		OR (`track` = 'speed_test' AND `stage_id` IS NULL)
	)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_stage_id_unique` ON `exercises` (`stage_id`);
--> statement-breakpoint
CREATE TABLE `scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`exercise_id` integer,
	`nickname` text NOT NULL,
	`net_wpm` real NOT NULL,
	`gross_wpm` real NOT NULL,
	`accuracy` real NOT NULL,
	`elapsed_ms` integer NOT NULL,
	`char_count` integer NOT NULL,
	`error_count` integer NOT NULL,
	`leaderboard_eligible` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `scores_exercise_player_wpm_idx` ON `scores` (`exercise_id`, `player_id`, `net_wpm`);
--> statement-breakpoint
CREATE INDEX `scores_player_created_at_idx` ON `scores` (`player_id`, `created_at`);
--> statement-breakpoint
CREATE TABLE `weak_key_stats` (
	`player_id` text NOT NULL,
	`key` text NOT NULL,
	`attempts` real DEFAULT 0 NOT NULL,
	`errors` real DEFAULT 0 NOT NULL,
	`total_latency_ms` real DEFAULT 0 NOT NULL,
	PRIMARY KEY (`player_id`, `key`),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stage_unlocks` (
	`player_id` text NOT NULL,
	`stage_id` integer NOT NULL,
	`granted_at` integer NOT NULL,
	PRIMARY KEY (`player_id`, `stage_id`),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `attempt_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`exercise_id` integer,
	`generated_content` text,
	`served_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `attempt_tokens_player_served_at_idx` ON `attempt_tokens` (`player_id`, `served_at`);
--> statement-breakpoint
INSERT INTO `stages` (`id`, `name`, `keys_taught`) VALUES
	(1, 'Home row: F & J', '["f","j"]'),
	(2, 'Home row: G & H', '["g","h"]'),
	(3, 'Home row: D & K', '["d","k"]'),
	(4, 'Home row: S & L', '["s","l"]'),
	(5, 'Home row: A & ;', '["a",";"]'),
	(6, 'Top row: R & U', '["r","u"]'),
	(7, 'Top row: T & Y', '["t","y"]'),
	(8, 'Top row: E & I', '["e","i"]'),
	(9, 'Top row: W & O', '["w","o"]'),
	(10, 'Top row: Q & P', '["q","p"]'),
	(11, 'Bottom row: V & N', '["v","n"]'),
	(12, 'Bottom row: B & M', '["b","m"]'),
	(13, 'Bottom row: Z, X, C', '["z","x","c"]'),
	(14, 'Shift & capitalization', '["shift"]'),
	(15, 'Punctuation: comma & period', '[",","."]'),
	(16, 'Punctuation: apostrophe, ?, !', '["''","?","!"]'),
	(17, 'Numbers: 1 & 0', '["1","0"]'),
	(18, 'Numbers: 2 & 9', '["2","9"]'),
	(19, 'Numbers: 3 & 8', '["3","8"]'),
	(20, 'Numbers: 4 & 7', '["4","7"]'),
	(21, 'Numbers: 5 & 6', '["5","6"]');
--> statement-breakpoint
INSERT INTO `exercises` (`id`, `track`, `stage_id`, `content`) VALUES
	(1, 'learn', 1, NULL),
	(2, 'learn', 2, NULL),
	(3, 'learn', 3, NULL),
	(4, 'learn', 4, NULL),
	(5, 'learn', 5, NULL),
	(6, 'learn', 6, NULL),
	(7, 'learn', 7, NULL),
	(8, 'learn', 8, NULL),
	(9, 'learn', 9, NULL),
	(10, 'learn', 10, NULL),
	(11, 'learn', 11, NULL),
	(12, 'learn', 12, NULL),
	(13, 'learn', 13, NULL),
	(14, 'learn', 14, NULL),
	(15, 'learn', 15, NULL),
	(16, 'learn', 16, NULL),
	(17, 'learn', 17, NULL),
	(18, 'learn', 18, NULL),
	(19, 'learn', 19, NULL),
	(20, 'learn', 20, NULL),
	(21, 'learn', 21, NULL),
	(22, 'speed_test', NULL, 'small steps build steady skill. keep your hands relaxed and let each key arrive in its own time. accuracy grows into speed with calm practice.');
