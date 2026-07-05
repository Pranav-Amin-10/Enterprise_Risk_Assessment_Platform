CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`business_owner_id` text,
	`technical_owner_id` text,
	`department_id` text,
	`criticality` text DEFAULT 'low' NOT NULL,
	`cia_confidentiality` integer DEFAULT 1 NOT NULL,
	`cia_integrity` integer DEFAULT 1 NOT NULL,
	`cia_availability` integer DEFAULT 1 NOT NULL,
	`asset_value` real DEFAULT 0 NOT NULL,
	`data_classification` text DEFAULT 'internal' NOT NULL,
	`lifecycle_status` text DEFAULT 'active' NOT NULL,
	`tags` text,
	`review_date` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`business_owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`technical_owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`department_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`user_email` text NOT NULL,
	`action` text NOT NULL,
	`details` text NOT NULL,
	`ip_address` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`uploaded_by` text,
	`risk_id` text,
	`asset_id` text,
	`treatment_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`risk_id`) REFERENCES `risks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`treatment_id`) REFERENCES `treatments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`is_read` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`parent_id` text,
	`location` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `risk_controls` (
	`risk_id` text NOT NULL,
	`control_name` text NOT NULL,
	`control_description` text,
	`status` text DEFAULT 'implemented' NOT NULL,
	PRIMARY KEY(`control_name`, `risk_id`),
	FOREIGN KEY (`risk_id`) REFERENCES `risks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `risks` (
	`id` text PRIMARY KEY NOT NULL,
	`risk_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`asset_id` text NOT NULL,
	`threat_id` text,
	`vulnerability_id` text,
	`inherent_impact` integer DEFAULT 1 NOT NULL,
	`inherent_likelihood` integer DEFAULT 1 NOT NULL,
	`inherent_score` integer DEFAULT 1 NOT NULL,
	`residual_impact` integer DEFAULT 1 NOT NULL,
	`residual_likelihood` integer DEFAULT 1 NOT NULL,
	`residual_score` integer DEFAULT 1 NOT NULL,
	`treatment_strategy` text DEFAULT 'mitigate' NOT NULL,
	`risk_owner_id` text,
	`status` text DEFAULT 'identified' NOT NULL,
	`review_date` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`threat_id`) REFERENCES `threats`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vulnerability_id`) REFERENCES `vulnerabilities`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`risk_owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `threats` (
	`id` text PRIMARY KEY NOT NULL,
	`threat_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`is_custom` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `treatments` (
	`id` text PRIMARY KEY NOT NULL,
	`risk_id` text NOT NULL,
	`owner_id` text,
	`budget` real DEFAULT 0 NOT NULL,
	`due_date` integer NOT NULL,
	`progress_percent` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`risk_id`) REFERENCES `risks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user_organizations` (
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	PRIMARY KEY(`organization_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vulnerabilities` (
	`id` text PRIMARY KEY NOT NULL,
	`vuln_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`severity` text DEFAULT 'low' NOT NULL,
	`is_custom` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assets_asset_id_unique` ON `assets` (`asset_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `risks_risk_id_unique` ON `risks` (`risk_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `threats_threat_id_unique` ON `threats` (`threat_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `treatments_risk_id_unique` ON `treatments` (`risk_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `vulnerabilities_vuln_id_unique` ON `vulnerabilities` (`vuln_id`);