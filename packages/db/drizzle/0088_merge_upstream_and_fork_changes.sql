ALTER TABLE `bookmarkLists` ADD `isFolder` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `embeddingStatus` text DEFAULT 'pending';