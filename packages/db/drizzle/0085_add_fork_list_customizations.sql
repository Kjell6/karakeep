ALTER TABLE `bookmarkLists` ADD `sortOrder` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `bookmarkLists` ADD `color` text;
--> statement-breakpoint
ALTER TABLE `bookmarkLists` ADD `thisListOnly` integer DEFAULT false NOT NULL;
