import { memo, useEffect, useMemo } from "react";
import KeyboardShortcutsDialog from "@/components/dashboard/KeyboardShortcutsDialog";
import NoBookmarksBanner from "@/components/dashboard/bookmarks/NoBookmarksBanner";
import { ActionButton } from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import useBulkActionsStore from "@/lib/bulkActions";
import { useBookmarkKeyboardNavigation } from "@/lib/hooks/useBookmarkKeyboardNavigation";
import { useTranslation } from "@/lib/i18n/client";
import {
  EDITOR_CARD_ESTIMATE_HEIGHT_PX,
  estimateDashboardBookmarkHeight,
} from "@/lib/masonry/balancedMasonry";
import { useAnyColumnSentinelInView } from "@/lib/masonry/useAnyColumnSentinelInView";
import { useBalancedMasonry } from "@/lib/masonry/useBalancedMasonry";
import { useMasonryColumnCount } from "@/lib/masonry/useMasonryColumnCount";
import { useInBookmarkGridStore } from "@/lib/store/useInBookmarkGridStore";
import { useKeyboardNavigationStore } from "@/lib/store/useKeyboardNavigationStore";
import {
  useBookmarkLayout,
  useGridColumns,
} from "@/lib/userLocalSettings/bookmarksLayout";
import { cn } from "@/lib/utils";
import tailwindConfig from "@/tailwind.config";
import { Slot } from "@radix-ui/react-slot";
import { ErrorBoundary } from "react-error-boundary";
import resolveConfig from "tailwindcss/resolveConfig";

import type { ZBookmark } from "@karakeep/shared/types/bookmarks";
import { BookmarkTypes } from "@karakeep/shared/types/bookmarks";
import { useBookmarkListContext } from "@karakeep/shared-react/hooks/bookmark-list-context";

import BookmarkCard from "./BookmarkCard";
import EditorCard from "./EditorCard";
import UnknownCard from "./UnknownCard";

// Wrapper for each bookmark tile. Callers pass `bg-card` on text/note tiles only;
// link/asset cards stay chrome-less so hover borders on images read cleanly.
function StyledBookmarkCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const includeBorder = !!className && className.includes("bg-card");

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

const BookmarkGridItem = memo(function BookmarkGridItem({
  bookmark,
  bookmarkIndex,
}: {
  bookmark: ZBookmark;
  bookmarkIndex: number;
}) {
  const isFocused = useKeyboardNavigationStore(
    (state) => state.isNavigating && state.focusedIndex === bookmarkIndex,
  );
  const textCard = bookmark.content.type === BookmarkTypes.TEXT;

  return (
    <ErrorBoundary fallback={<UnknownCard bookmark={bookmark} />}>
      <StyledBookmarkCard
        className={cn(
          textCard ? "bg-card" : undefined,
          isFocused &&
            "ring-2 ring-primary ring-offset-2 ring-offset-background",
        )}
      >
        <BookmarkCard bookmark={bookmark} bookmarkIndex={bookmarkIndex} />
      </StyledBookmarkCard>
    </ErrorBoundary>
  );
});

function getBreakpointConfig(userColumns: number) {
  const fullConfig = resolveConfig(tailwindConfig);

  const breakpointColumnsObj: { [key: number]: number; default: number } = {
    default: userColumns,
  };

  const lgColumns = Math.max(1, Math.min(userColumns, userColumns - 1));
  const mdColumns = Math.max(1, Math.min(userColumns, 2));
  const smColumns = 1;

  breakpointColumnsObj[Number.parseInt(fullConfig.theme.screens.lg, 10)] =
    lgColumns;
  breakpointColumnsObj[Number.parseInt(fullConfig.theme.screens.md, 10)] =
    mdColumns;
  breakpointColumnsObj[Number.parseInt(fullConfig.theme.screens.sm, 10)] =
    smColumns;
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
  const { t } = useTranslation();
  const layout = useBookmarkLayout();
  const gridColumns = useGridColumns();
  const setVisibleBookmarks = useBulkActionsStore(
    (state) => state.setVisibleBookmarks,
  );
  const setListContext = useBulkActionsStore((state) => state.setListContext);
  const setInBookmarkGrid = useInBookmarkGridStore(
    (state) => state.setInBookmarkGrid,
  );
  const withinListContext = useBookmarkListContext();

  const breakpointConfig = useMemo(
    () => getBreakpointConfig(gridColumns),
    [gridColumns],
  );
  const masonryColumnCount = useMasonryColumnCount(breakpointConfig);
  const { inView: loadMoreButtonInView, getSentinelRef } =
    useAnyColumnSentinelInView("1500px");

  const isListLayout = layout === "list" || layout === "compact";
  const columnCountForMasonry = isListLayout ? 1 : masonryColumnCount;
  const navColumns = isListLayout ? 1 : masonryColumnCount;

  const bookmarkIndexById = useMemo(() => {
    const m = new Map<string, number>();
    bookmarks.forEach((b, i) => {
      m.set(b.id, i);
    });
    return m;
  }, [bookmarks]);

  const {
    helpDialogOpen,
    setHelpDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    isBulkDelete,
    deleteCount,
    confirmDelete,
    isDeletePending,
  } = useBookmarkKeyboardNavigation({
    bookmarks,
    columns: navColumns,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const { columns: bookmarkColumns, getItemRef } = useBalancedMasonry({
    items: bookmarks,
    columnCount: columnCountForMasonry,
    estimateHeight: estimateDashboardBookmarkHeight,
    itemGapPx: 16,
    leadFirstColumnHeightPx: showEditorCard
      ? EDITOR_CARD_ESTIMATE_HEIGHT_PX
      : 0,
  });

  useEffect(() => {
    setVisibleBookmarks(bookmarks);
    setListContext(withinListContext);

    return () => {
      setVisibleBookmarks([]);
      setListContext(undefined);
    };
  }, [bookmarks, setListContext, setVisibleBookmarks, withinListContext]);

  useEffect(() => {
    setInBookmarkGrid(true);
    return () => {
      setInBookmarkGrid(false);
    };
  }, [setInBookmarkGrid]);

  useEffect(() => {
    if (loadMoreButtonInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, loadMoreButtonInView]);

  if (bookmarks.length === 0 && !showEditorCard) {
    return (
      <>
        <NoBookmarksBanner />
        <KeyboardShortcutsDialog
          open={helpDialogOpen}
          setOpen={setHelpDialogOpen}
        />
      </>
    );
  }

  return (
    <>
      <div className="-ml-8 flex w-auto">
        {bookmarkColumns.map((columnBookmarks, colIdx) => (
          <div
            key={colIdx}
            className="pl-8"
            style={{ width: `${100 / bookmarkColumns.length}%` }}
          >
            {colIdx === 0 && showEditorCard && (
              <StyledBookmarkCard key="editor">
                <EditorCard />
              </StyledBookmarkCard>
            )}
            {columnBookmarks.map((b) => (
              <div key={b.id} ref={getItemRef(b.id)}>
                <BookmarkGridItem
                  bookmark={b}
                  bookmarkIndex={bookmarkIndexById.get(b.id) ?? 0}
                />
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

      <KeyboardShortcutsDialog
        open={helpDialogOpen}
        setOpen={setHelpDialogOpen}
      />

      <ActionConfirmingDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        title={t("dialogs.bookmarks.delete_confirmation_title")}
        description={
          isBulkDelete
            ? t("dialogs.bookmarks.bulk_delete_confirmation_description", {
                count: deleteCount,
              })
            : t("dialogs.bookmarks.delete_confirmation_description")
        }
        actionButton={() => (
          <ActionButton
            type="button"
            variant="destructive"
            loading={isDeletePending}
            onClick={confirmDelete}
          >
            {t("actions.delete")}
          </ActionButton>
        )}
      />
    </>
  );
}
