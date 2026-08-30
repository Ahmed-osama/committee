CREATE TABLE `provider_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`model_id` text NOT NULL,
	`input_tokens` integer NOT NULL,
	`output_tokens` integer NOT NULL,
	`cost_usd` real NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `agents` ADD `model_by_provider` text NOT NULL;