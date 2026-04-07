import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Maximize2 } from "lucide-react";

import type { ZBookmark } from "@karakeep/shared/types/bookmarks";

import BookmarkOptions from "./BookmarkOptions";
import { FavouritedActionIcon } from "./icons";

function overlayGhostClasses(imageRegionDark: boolean | null): string {
  if (imageRegionDark === true) {
    return cn(
      "text-white/90 hover:bg-white/15 hover:!text-white active:bg-white/20",
    );
  }
  if (imageRegionDark === false) {
    return cn(
      "text-gray-900 hover:bg-black/10 hover:!text-gray-900 active:bg-black/15",
    );
  }
  return cn(
    "text-white mix-blend-difference hover:bg-white/20 hover:!text-white active:bg-white/25",
  );
}

export default function BookmarkActionBar({
  bookmark,
  variant = "default",
  imageRegionDark = null,
}: {
  bookmark: ZBookmark;
  variant?: "default" | "image-overlay";
  /**
   * Sampled from the top-right of the card image: `true` if that region is dark
   * (use light controls). `false` if light. `null` if unknown — uses blend fallback.
   */
  imageRegionDark?: boolean | null;
}) {
  const overlayGhost =
    variant === "image-overlay"
      ? overlayGhostClasses(imageRegionDark ?? null)
      : undefined;

  return (
    <div
      className={cn(
        "flex items-center",
        variant === "default" && "text-gray-500",
        variant === "image-overlay" && "drop-shadow-sm [&_svg]:drop-shadow-sm",
      )}
    >
      {bookmark.favourited && (
        <FavouritedActionIcon
          className="m-1 size-8 rounded p-1"
          favourited
        />
      )}
      <Link
        href={`/dashboard/preview/${bookmark.id}`}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "px-2",
          overlayGhost,
        )}
      >
        <Maximize2 size={16} />
      </Link>
      <BookmarkOptions
        bookmark={bookmark}
        triggerClassName={overlayGhost}
      />
    </div>
  );
}
