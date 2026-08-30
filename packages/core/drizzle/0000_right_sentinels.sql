CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`system_prompt` text NOT NULL,
	`provider_preference` text NOT NULL,
	`model_by_provider` text NOT NULL,
	`tool_allow_list` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`goal` text NOT NULL,
	`status` text NOT NULL,
	`linear_epic_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`from_agent_id` text NOT NULL,
	`to_agent_id` text,
	`intent` text NOT NULL,
	`content` text NOT NULL,
	`payload` text,
	`turn` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
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
