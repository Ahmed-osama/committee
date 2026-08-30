CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`system_prompt` text NOT NULL,
	`provider_preference` text NOT NULL,
	`tool_allow_list` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`status` text NOT NULL,
	`review_note` text,
	`created_at` text NOT NULL,
	`resolved_at` text
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`task_id` text,
	`tick` integer NOT NULL,
	`kind` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`acceptance_criteria` text NOT NULL,
	`repo_path` text NOT NULL,
	`base_branch` text NOT NULL,
	`status` text NOT NULL,
	`assigned_agent_id` text,
	`workspace_path` text,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
