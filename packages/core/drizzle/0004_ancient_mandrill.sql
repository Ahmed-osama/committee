CREATE TABLE `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`message` text NOT NULL,
	`agent_id` text,
	`task_id` text,
	`acknowledged` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `scheduler_state` ADD `paused` integer DEFAULT false NOT NULL;