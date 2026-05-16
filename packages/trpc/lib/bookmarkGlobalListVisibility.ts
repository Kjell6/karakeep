import { and, eq, exists, not, notExists, SQL } from "drizzle-orm";

import type { DB } from "@karakeep/db";
import {
  bookmarkLists,
  bookmarks,
  bookmarksInLists,
} from "@karakeep/db/schema";

/** Same visibility as Home global feed: bookmarks only in manual thisListOnly lists are omitted. */
export function bookmarkVisibleOutsideThisListOnlySilos(
  database: DB,
  bookmarkRowIdColumn: typeof bookmarks.id,
): SQL {
  const exclusivelyOnlyThisListOnlyLists = and(
    exists(
      database
        .select({ bookmarkId: bookmarksInLists.bookmarkId })
        .from(bookmarksInLists)
        .innerJoin(bookmarkLists, eq(bookmarkLists.id, bookmarksInLists.listId))
        .where(
          and(
            eq(bookmarksInLists.bookmarkId, bookmarkRowIdColumn),
            eq(bookmarkLists.thisListOnly, true),
          ),
        ),
    ),
    notExists(
      database
        .select({ bookmarkId: bookmarksInLists.bookmarkId })
        .from(bookmarksInLists)
        .innerJoin(bookmarkLists, eq(bookmarkLists.id, bookmarksInLists.listId))
        .where(
          and(
            eq(bookmarksInLists.bookmarkId, bookmarkRowIdColumn),
            eq(bookmarkLists.thisListOnly, false),
          ),
        ),
    ),
  ) as SQL;
  return not(exclusivelyOnlyThisListOnlyLists);
}
