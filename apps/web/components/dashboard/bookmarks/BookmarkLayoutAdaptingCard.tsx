import type { BookmarksLayoutTypes } from "@/lib/userLocalSettings/types";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useBulkActionsStore from "@/lib/bulkActions";
import {
  bookmarkLayoutSwitch,
  useBookmarkLayout,
} from "@/lib/userLocalSettings/bookmarksLayout";
import { cn } from "@/lib/utils";
import { Check, Image as ImageIcon, NotebookPen } from "lucide-react";
import { useTheme } from "next-themes";

import type { ZBookmark } from "@karakeep/shared/types/bookmarks";
import { BookmarkTypes } from "@karakeep/shared/types/bookmarks";
import { isBookmarkStillTagging } from "@karakeep/shared/utils/bookmarkUtils";

import BookmarkActionBar from "./BookmarkActionBar";
import BookmarkFormattedCreatedAt from "./BookmarkFormattedCreatedAt";
import TagList from "./TagList";

interface Props {
  bookmark: ZBookmark;
  image: (layout: BookmarksLayoutTypes, className: string) => React.ReactNode;
  title?: React.ReactNode;
  content?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  fitHeight?: boolean;
  wrapTags: boolean;
}

function BottomRow({
  footer,
  bookmark,
}: {
  footer?: React.ReactNode;
  bookmark: ZBookmark;
}) {
  // Only render bottom action bar for text (notes) cards. For image cards
  // (LINK / ASSET) the action buttons are shown over the image (top-right).
  if (bookmark.content.type === BookmarkTypes.TEXT) {
    return (
      <div className="justify flex w-full shrink-0 justify-between text-gray-500">
        <div className="flex items-center gap-2 overflow-hidden text-nowrap font-light">
          {footer && <>{footer}•</>}
          <Link
            href={`/dashboard/preview/${bookmark.id}`}
            suppressHydrationWarning
          >
            <BookmarkFormattedCreatedAt createdAt={bookmark.createdAt} />
          </Link>
        </div>
        <BookmarkActionBar bookmark={bookmark} />
      </div>
    );
  }

  // For other types (images/links) render an empty bottom row — actions live
  // on top of the image instead.
  return <div className="h-0 w-full shrink-0" />;
}

function MultiBookmarkSelector({ bookmark }: { bookmark: ZBookmark }) {
  const { selectedBookmarks, isBulkEditEnabled } = useBulkActionsStore();
  const toggleBookmark = useBulkActionsStore((state) => state.toggleBookmark);
  const [isSelected, setIsSelected] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsSelected(selectedBookmarks.some((item) => item.id === bookmark.id));
  }, [selectedBookmarks]);

  if (!isBulkEditEnabled) return null;

  const getIconColor = () => {
    if (theme === "dark") {
      return isSelected ? "black" : "white";
    }
    return isSelected ? "white" : "black";
  };

  const getIconBackgroundColor = () => {
    if (theme === "dark") {
      return isSelected ? "bg-white" : "bg-white bg-opacity-10";
    }
    return isSelected ? "bg-black" : "bg-white bg-opacity-40";
  };

  return (
    <button
      className={cn(
        "absolute left-0 top-0 z-50 h-full w-full bg-opacity-0",
        {
          "bg-opacity-10": isSelected,
        },
        theme === "dark" ? "bg-white" : "bg-black",
      )}
      onClick={() => toggleBookmark(bookmark)}
    >
      <div className="absolute right-2 top-2 z-50 opacity-100">
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full border border-gray-600",
            getIconBackgroundColor(),
          )}
        >
          <Check size={12} color={getIconColor()} />
        </div>
      </div>
    </button>
  );
}

function ListView({
  bookmark,
  image,
  title,
  content,
  footer,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative flex max-h-96 gap-4 overflow-hidden rounded-lg p-2",
        className,
      )}
    >
      <MultiBookmarkSelector bookmark={bookmark} />
      {/* Image wrapper — make relative so we can position action buttons over the image
          and show a border (via ring) around the image when the parent card is hovered.
       */}
      <div className="relative flex size-32 items-center justify-center overflow-hidden transition-all group-hover:ring-1 group-hover:ring-border">
        {image("list", "object-cover rounded-lg size-32")}
        {/* Show action buttons over image for non-text bookmarks (top-right) */}
        {bookmark.content.type !== BookmarkTypes.TEXT && (
          <div className="absolute right-2 top-2 z-40">
            <BookmarkActionBar bookmark={bookmark} />
          </div>
        )}
      </div>
      {/* Reduce vertical gap between content and action buttons */}
      <div className="flex h-full flex-1 flex-col justify-between gap-1 overflow-hidden">
        <div className="flex flex-col gap-2 overflow-hidden">
          {title && (
            // Title: limit to a single line to avoid multi-row titles
            <div className="line-clamp-1 flex-none shrink-0 overflow-hidden text-ellipsis break-words text-center text-sm">
              {title}
            </div>
          )}
          {content && <div className="shrink-1 overflow-hidden">{content}</div>}
          <div className="flex shrink-0 flex-wrap gap-1 overflow-hidden">
            <TagList
              bookmark={bookmark}
              loading={isBookmarkStillTagging(bookmark)}
            />
          </div>
        </div>
        <BottomRow footer={footer} bookmark={bookmark} />
      </div>
    </div>
  );
}

function GridView({
  bookmark,
  image,
  title,
  content,
  footer,
  className,
  wrapTags: _wrapTags,
  layout,
  fitHeight = false,
}: Props & { layout: BookmarksLayoutTypes }) {
  const imgClass =
    layout === "masonry"
      ? "w-full object-cover rounded-b-lg"
      : "h-56 min-h-56 w-full object-cover rounded-b-lg";

  const img = image(layout, imgClass);

  const containerHeightClass =
    layout === "masonry"
      ? ""
      : fitHeight && layout != "grid"
        ? "max-h-96"
        : "h-96";

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-lg",
        className,
        containerHeightClass,
      )}
    >
      <MultiBookmarkSelector bookmark={bookmark} />
      {img && (
        // Image container made relative so overlay (action buttons) can be
        // positioned at the top-right of the image for non-text bookmarks.
        // Also add `group-hover:ring` so hovering the parent card highlights
        // only the image area (no card-level hover effects).
        <div
          className={cn(
            layout === "masonry"
              ? "relative w-full shrink-0 overflow-hidden rounded-b-lg transition-all group-hover:ring-1 group-hover:ring-border"
              : "relative h-56 w-full shrink-0 overflow-hidden rounded-b-lg transition-all group-hover:ring-1 group-hover:ring-border",
          )}
        >
          {img}
          {bookmark.content.type !== BookmarkTypes.TEXT && (
            <div className="absolute right-2 top-2 z-40">
              <BookmarkActionBar bookmark={bookmark} />
            </div>
          )}
        </div>
      )}
      {/* Reduce vertical gap between content and action buttons */}
      <div className="flex h-full flex-col justify-between gap-1 overflow-hidden p-2">
        <div className="grow-1 flex flex-col gap-2 overflow-hidden">
          {title && (
            // Title: limit to a single line to avoid multi-row titles
            <div className="line-clamp-1 flex-none shrink-0 overflow-hidden text-ellipsis break-words text-center text-sm">
              {title}
            </div>
          )}
          {content && <div className="shrink-1 overflow-hidden">{content}</div>}
          {/* Tags hidden for masonry/grid cards as requested */}
          {/* TagList intentionally removed to keep card footer minimal */}
        </div>
        <BottomRow footer={footer} bookmark={bookmark} />
      </div>
    </div>
  );
}

function CompactView({ bookmark, title, footer, className }: Props) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-lg",
        className,
        "max-h-96",
      )}
    >
      <MultiBookmarkSelector bookmark={bookmark} />
      <div className="flex h-full justify-between gap-2 overflow-hidden p-2">
        <div className="flex items-center gap-2">
          {bookmark.content.type === BookmarkTypes.LINK &&
            bookmark.content.favicon && (
              <Image
                src={bookmark.content.favicon}
                alt="favicon"
                width={5}
                unoptimized
                height={5}
                className="size-5"
              />
            )}
          {bookmark.content.type === BookmarkTypes.TEXT && (
            <NotebookPen className="size-5" />
          )}
          {bookmark.content.type === BookmarkTypes.ASSET && (
            <ImageIcon className="size-5" />
          )}
          {
            <div className="shrink-1 text-md line-clamp-1 overflow-hidden text-ellipsis break-words text-center">
              {title ?? "Untitled"}
            </div>
          }
          {footer && (
            <p className="flex shrink-0 gap-2 text-gray-500">•{footer}</p>
          )}
          <p className="text-gray-500">•</p>
          <Link
            href={`/dashboard/preview/${bookmark.id}`}
            suppressHydrationWarning
            className="shrink-0 gap-2 text-gray-500"
          >
            <BookmarkFormattedCreatedAt createdAt={bookmark.createdAt} />
          </Link>
        </div>
        <BookmarkActionBar bookmark={bookmark} />
      </div>
    </div>
  );
}

export function BookmarkLayoutAdaptingCard(props: Props) {
  const layout = useBookmarkLayout();

  return bookmarkLayoutSwitch(layout, {
    masonry: <GridView layout={layout} {...props} />,
    grid: <GridView layout={layout} {...props} />,
    list: <ListView {...props} />,
    compact: <CompactView {...props} />,
  });
}
