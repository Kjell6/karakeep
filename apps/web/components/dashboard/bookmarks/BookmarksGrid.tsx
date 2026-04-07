import { useEffect, useMemo } from "react";
import NoBookmarksBanner from "@/components/dashboard/bookmarks/NoBookmarksBanner";
import { ActionButton } from "@/components/ui/action-button";
import useBulkActionsStore from "@/lib/bulkActions";
import { useInBookmarkGridStore } from "@/lib/store/useInBookmarkGridStore";
import { useGridColumns } from "@/lib/userLocalSettings/bookmarksLayout";
import { cn } from "@/lib/utils";
import tailwindConfig from "@/tailwind.config";
import { Slot } from "@radix-ui/react-slot";
import { ErrorBoundary } from "react-error-boundary";
import resolveConfig from "tailwindcss/resolveConfig";

import {
  EDITOR_CARD_ESTIMATE_HEIGHT_PX,
  estimateDashboardBookmarkHeight,
} from "@/lib/masonry/balancedMasonry";
import { useAnyColumnSentinelInView } from "@/lib/masonry/useAnyColumnSentinelInView";
import { useBalancedMasonry } from "@/lib/masonry/useBalancedMasonry";
import { useMasonryColumnCount } from "@/lib/masonry/useMasonryColumnCount";

import type { ZBookmark } from "@karakeep/shared/types/bookmarks";
import { BookmarkTypes } from "@karakeep/shared/types/bookmarks";

import BookmarkCard from "./BookmarkCard";
import EditorCard from "./EditorCard";
import UnknownCard from "./UnknownCard";

// Wrapper for each bookmark tile. We allow passing a `className` so callers
// can opt-in to a background (we keep the background only for text/note cards).
function StyledBookmarkCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // If the caller provided `bg-card` we keep the border, otherwise remove it
  // so non-text cards render without border/background as requested.
  const includeBorder = !!className && className.includes("bg-card");

  // Use "group" so inner elements (image wrapper) can react to hover via
  // `group-hover:*`. Remove card-level hover shadow – hover should only
  // display a border around the image.
  return (
    <Slot
      className={cn(
        "group mb-4 transition-all duration-300 ease-in",
        includeBorder ? "border border-border" : undefined,
        className,
      )}
    >
      {children}
    </Slot>
  );
}

function getBreakpointConfig(userColumns: number) {
  const fullConfig = resolveConfig(tailwindConfig);

  const breakpointColumnsObj: { [key: number]: number; default: number } = {
    default: userColumns,
  };

  // Responsive behavior: reduce columns on smaller screens
  const lgColumns = Math.max(1, Math.min(userColumns, userColumns - 1));
  const mdColumns = Math.max(1, Math.min(userColumns, 2));
  const smColumns = 1;

  breakpointColumnsObj[parseInt(fullConfig.theme.screens.lg)] = lgColumns;
  breakpointColumnsObj[parseInt(fullConfig.theme.screens.md)] = mdColumns;
  breakpointColumnsObj[parseInt(fullConfig.theme.screens.sm)] = smColumns;
  return breakpointColumnsObj;
}

export default function BookmarksGrid({
  bookmarks,
  hasNextPage = false,
  fetchNextPage = () => ({}),
  isFetchingNextPage = false,
  showEditorCard = false,
}: {
  bookmarks: ZBookmark[];
  showEditorCard?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}) {
  const gridColumns = useGridColumns();
  const bulkActionsStore = useBulkActionsStore();
  const inBookmarkGrid = useInBookmarkGridStore();
  const breakpointConfig = useMemo(
    () => getBreakpointConfig(gridColumns),
    [gridColumns],
  );
  const columnCount = useMasonryColumnCount(breakpointConfig);
  const { inView: loadMoreButtonInView, getSentinelRef } =
    useAnyColumnSentinelInView("1500px");

  useEffect(() => {
    bulkActionsStore.setVisibleBookmarks(bookmarks);
    return () => {
      bulkActionsStore.setVisibleBookmarks([]);
    };
  }, [bookmarks]);

  useEffect(() => {
    inBookmarkGrid.setInBookmarkGrid(true);
    return () => {
      inBookmarkGrid.setInBookmarkGrid(false);
    };
  }, []);

  useEffect(() => {
    if (loadMoreButtonInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [loadMoreButtonInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { columns: bookmarkColumns, getItemRef } = useBalancedMasonry({
    items: bookmarks,
    columnCount,
    estimateHeight: estimateDashboardBookmarkHeight,
    itemGapPx: 16,
    leadFirstColumnHeightPx: showEditorCard
      ? EDITOR_CARD_ESTIMATE_HEIGHT_PX
      : 0,
  });

  if (bookmarks.length == 0 && !showEditorCard) {
    return <NoBookmarksBanner />;
  }

  return (
    <>
      <div className="-ml-8 flex w-auto">
        {bookmarkColumns.map((columnBookmarks, colIdx) => (
          <div
            key={colIdx}
            className="pl-8"
            style={{ width: `${100 / columnCount}%` }}
          >
            {colIdx === 0 && showEditorCard && (
              <StyledBookmarkCard key="editor">
                <EditorCard />
              </StyledBookmarkCard>
            )}
            {columnBookmarks.map((b) => (
              <div key={b.id} ref={getItemRef(b.id)}>
                <ErrorBoundary fallback={<UnknownCard bookmark={b} />}>
                  <StyledBookmarkCard
                    className={
                      b.content.type === BookmarkTypes.TEXT
                        ? "bg-card"
                        : undefined
                    }
                  >
                    <BookmarkCard bookmark={b} />
                  </StyledBookmarkCard>
                </ErrorBoundary>
              </div>
            ))}
            {hasNextPage && (
              <div
                ref={getSentinelRef(colIdx)}
                className="pointer-events-none h-px w-full"
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center">
          <ActionButton
            ignoreDemoMode={true}
            loading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            variant="ghost"
          >
            Load More
          </ActionButton>
        </div>
      )}
    </>
  );
}
