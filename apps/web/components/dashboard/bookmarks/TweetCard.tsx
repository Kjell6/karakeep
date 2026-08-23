"use client";

import Link from "next/link";
import { useUserSettings } from "@/lib/userSettings";
import {
  bookmarkLayoutSwitch,
  useBookmarkLayout,
} from "@/lib/userLocalSettings/bookmarksLayout";
import { cn } from "@/lib/utils";

import type {
  ZBookmark,
  ZBookmarkTypeLink,
} from "@karakeep/shared/types/bookmarks";
import { BookmarkTypes } from "@karakeep/shared/types/bookmarks";
import {
  getBookmarkTitle,
  getTweetPhotoDisplayUrls,
  isBookmarkStillCrawling,
} from "@karakeep/shared/utils/bookmarkUtils";
import { isTwitterStatusUrl } from "@karakeep/shared/utils/twitter";

import BookmarkActionBar from "./BookmarkActionBar";
import BookmarkDragHandle from "./BookmarkDragHandle";
import { MultiBookmarkSelector } from "./BookmarkLayoutAdaptingCard";

const useOnClickUrl = (bookmark: ZBookmarkTypeLink) => {
  const userSettings = useUserSettings();
  return {
    urlTarget:
      userSettings.bookmarkClickAction === "open_original_link"
        ? ("_blank" as const)
        : ("_self" as const),
    onClickUrl:
      userSettings.bookmarkClickAction === "expand_bookmark_preview"
        ? `/dashboard/preview/${bookmark.id}`
        : bookmark.content.url,
  };
};

function formatTweetLink(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

function TweetMediaGrid({
  urls,
  className,
  fill = false,
}: {
  urls: string[];
  className?: string;
  fill?: boolean;
}) {
  const count = Math.min(urls.length, 4);
  if (count === 0) {
    return null;
  }
  const shown = urls.slice(0, 4);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border",
        count === 1 && "block",
        count === 2 && "grid grid-cols-2 gap-0.5",
        count === 3 && "grid grid-cols-2 grid-rows-2 gap-0.5",
        count === 4 && "grid grid-cols-2 gap-0.5",
        fill && "h-full",
        className,
      )}
    >
      {shown.map((url, index) => (
        <img
          key={`${url}-${index}`}
          src={url}
          alt=""
          className={cn(
            "w-full object-cover",
            fill && "h-full",
            !fill && count === 1 && "max-h-64",
            !fill && count === 2 && "h-40",
            !fill &&
              count === 3 &&
              (index === 0 ? "row-span-2 h-[13.75rem]" : "h-[6.75rem]"),
            !fill && count === 4 && "h-[6.75rem]",
            fill && count === 3 && index === 0 && "row-span-2",
          )}
        />
      ))}
    </div>
  );
}

function TweetText({ bookmark }: { bookmark: ZBookmarkTypeLink }) {
  const text = getBookmarkTitle(bookmark) ?? "";
  if (!text) {
    return null;
  }
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-snug">
      {text}
    </p>
  );
}

function TweetUrlLine({
  bookmark,
  className,
}: {
  bookmark: ZBookmarkTypeLink;
  className?: string;
}) {
  const { onClickUrl, urlTarget } = useOnClickUrl(bookmark);
  return (
    <Link
      href={onClickUrl}
      target={urlTarget}
      rel="noreferrer"
      className={cn(
        "line-clamp-1 overflow-hidden text-ellipsis break-words text-center text-sm",
        className,
      )}
    >
      {formatTweetLink(bookmark.content.url)}
    </Link>
  );
}

function TweetMedia({ bookmark }: { bookmark: ZBookmarkTypeLink }) {
  if (isBookmarkStillCrawling(bookmark)) {
    return (
      <img
        src="/blur.gif"
        alt=""
        className="h-40 w-full rounded-2xl object-cover"
      />
    );
  }
  return <TweetMediaGrid urls={getTweetPhotoDisplayUrls(bookmark.content)} />;
}

export function bookmarkIsTweetCard(bookmark: ZBookmark): boolean {
  return (
    bookmark.content.type === BookmarkTypes.LINK &&
    isTwitterStatusUrl(bookmark.content.url)
  );
}

function TweetGridCard({
  bookmark,
  className,
  bookmarkIndex,
}: {
  bookmark: ZBookmarkTypeLink;
  className?: string;
  bookmarkIndex?: number;
}) {
  const { onClickUrl, urlTarget } = useOnClickUrl(bookmark);
  return (
    <div
      className={cn("relative flex flex-col", className)}
      data-bookmark-index={bookmarkIndex}
    >
      <MultiBookmarkSelector bookmark={bookmark} />
      {/* The tweet body is the card; the URL sits under it like titles under image cards. */}
      <div className="relative overflow-hidden rounded-lg border border-border bg-card transition-all group-hover:ring-1 group-hover:ring-border">
        <BookmarkDragHandle bookmarkId={bookmark.id} variant="image-overlay" />
        <div className="absolute right-2 top-2 z-30">
          <BookmarkActionBar bookmark={bookmark} variant="image-overlay" />
        </div>
        <Link
          href={onClickUrl}
          target={urlTarget}
          rel="noreferrer"
          className="flex flex-col gap-2 py-3"
        >
          <div className="px-4 pr-14">
            <TweetText bookmark={bookmark} />
          </div>
          <div className="px-2">
            <TweetMedia bookmark={bookmark} />
          </div>
        </Link>
      </div>
      <div className="p-2">
        <TweetUrlLine bookmark={bookmark} />
      </div>
    </div>
  );
}

export default function TweetCard({
  bookmark,
  className,
  bookmarkIndex,
}: {
  bookmark: ZBookmarkTypeLink;
  className?: string;
  bookmarkIndex?: number;
}) {
  const layout = useBookmarkLayout();
  const { onClickUrl, urlTarget } = useOnClickUrl(bookmark);

  return bookmarkLayoutSwitch(layout, {
    masonry: (
      <TweetGridCard
        bookmark={bookmark}
        className={className}
        bookmarkIndex={bookmarkIndex}
      />
    ),
    grid: (
      <TweetGridCard
        bookmark={bookmark}
        className={className}
        bookmarkIndex={bookmarkIndex}
      />
    ),
    list: (
      <div
        className={cn(
          "relative flex max-h-96 gap-4 overflow-hidden rounded-lg p-2",
          className,
        )}
        data-bookmark-index={bookmarkIndex}
      >
        <MultiBookmarkSelector bookmark={bookmark} />
        <BookmarkDragHandle bookmarkId={bookmark.id} />
        {getTweetPhotoDisplayUrls(bookmark.content).length > 0 &&
          !isBookmarkStillCrawling(bookmark) && (
            <div className="size-32 shrink-0 overflow-hidden rounded-lg">
              <TweetMediaGrid
                urls={getTweetPhotoDisplayUrls(bookmark.content)}
                fill
              />
            </div>
          )}
        <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden pr-16">
          <Link href={onClickUrl} target={urlTarget} rel="noreferrer">
            <TweetText bookmark={bookmark} />
          </Link>
          <TweetUrlLine bookmark={bookmark} className="text-left" />
        </div>
        <div className="absolute right-2 top-2 z-30">
          <BookmarkActionBar bookmark={bookmark} />
        </div>
      </div>
    ),
    compact: (
      <div
        className={cn(
          "relative flex max-h-96 overflow-hidden rounded-lg p-2",
          className,
        )}
        data-bookmark-index={bookmarkIndex}
      >
        <MultiBookmarkSelector bookmark={bookmark} />
        <BookmarkDragHandle bookmarkId={bookmark.id} />
        <p className="min-w-0 flex-1 truncate text-sm">
          {getBookmarkTitle(bookmark)}
        </p>
        <BookmarkActionBar bookmark={bookmark} />
      </div>
    ),
  });
}
