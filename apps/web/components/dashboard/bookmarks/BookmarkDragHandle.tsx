"use client";

import { BOOKMARK_DRAG_MIME } from "@/lib/bookmark-drag";
import useBulkActionsStore from "@/lib/bulkActions";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

import { overlayGhostClasses } from "./BookmarkActionBar";

/**
 * HTML5 drag source for dropping bookmarks onto manual lists in the sidebar.
 * Shown on card hover (parent needs Tailwind `group`).
 * `image-overlay` + `imageRegionDark` match „Öffnen“ / „…“ on the image (top-right sample).
 */
export default function BookmarkDragHandle({
  bookmarkId,
  imageRegionDark = null,
  variant = "default",
}: {
  bookmarkId: string;
  /** From the same top-right luminance sample as {@link BookmarkActionBar} image-overlay. */
  imageRegionDark?: boolean | null;
  variant?: "default" | "image-overlay";
}) {
  const { t } = useTranslation();
  const isBulkEditEnabled = useBulkActionsStore((s) => s.isBulkEditEnabled);

  if (isBulkEditEnabled) {
    return null;
  }

  const title = t("lists.drag_bookmark_handle", {
    defaultValue: "Drag into a list in the sidebar",
  });

  const toneClasses =
    variant === "image-overlay"
      ? overlayGhostClasses(imageRegionDark ?? null)
      : cn(
          "text-gray-500",
          "hover:bg-accent hover:!text-foreground active:bg-accent/80",
        );

  return (
    <button
      type="button"
      draggable
      title={title}
      aria-label={title}
      onDragStart={(e) => {
        e.dataTransfer.setData(BOOKMARK_DRAG_MIME, bookmarkId);
        e.dataTransfer.setData("text/plain", bookmarkId);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className={cn(
        "absolute left-2 top-2 z-20",
        "flex size-8 cursor-grab items-center justify-center rounded-md p-0",
        variant === "image-overlay" &&
          "drop-shadow-sm [&_svg]:drop-shadow-sm",
        "opacity-0 transition-opacity duration-100",
        "group-hover:opacity-100",
        toneClasses,
        "active:cursor-grabbing",
        "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <GripVertical className="pointer-events-none size-4" aria-hidden />
    </button>
  );
}
