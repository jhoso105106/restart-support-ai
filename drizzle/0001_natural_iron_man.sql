CREATE TABLE `interview_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jobTitle` varchar(255) NOT NULL,
	`jobDescription` text,
	`questions` text NOT NULL,
	`answers` text NOT NULL,
	`feedback` text,
	`sessionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`activityType` varchar(100) NOT NULL,
	`activityTitle` varchar(255) NOT NULL,
	`description` text,
	`completionStatus` varchar(50) DEFAULT 'in_progress',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `learning_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mood_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moodLevel` int NOT NULL,
	`moodText` varchar(100),
	`context` varchar(100),
	`situation` text,
	`aiResponse` text,
	`suggestedAction` varchar(100),
	`crisisFlag` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mood_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`targetArea` varchar(100),
	`address` text,
	`phone` varchar(20),
	`email` varchar(255),
	`website` varchar(500),
	`businessHours` text,
	`targetAge` varchar(100),
	`lastVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bio` text,
	`targetJobTitle` varchar(255),
	`yearsOfExperience` int,
	`skills` text,
	`preferredArea` varchar(100),
	`prefectureCode` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `interview_sessions` ADD CONSTRAINT `interview_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_logs` ADD CONSTRAINT `learning_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mood_logs` ADD CONSTRAINT `mood_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;