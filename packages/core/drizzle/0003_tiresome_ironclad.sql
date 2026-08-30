CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`from_agent_id` text NOT NULL,
	`to_agent_id` text,
	`intent` text NOT NULL,
	`payload` text NOT NULL,
	`correlation_id` text,
	`tick` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_verdicts` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`verdict` text NOT NULL,
	`feedback` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scheduler_state` (
	`id` text PRIMARY KEY NOT NULL,
	`current_tick` integer NOT NULL
);
