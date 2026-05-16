"use client";

// Gleiche Spaltenbreite wie das echte Dashboard-Raster (balanced masonry), damit
// Skeleton und geladene Karten dieselbe Aufteilung haben — nicht react-masonry-css.
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMasonryColumnCount } from "@/lib/masonry/useMasonryColumnCount";
import { useGridColumns } from "@/lib/userLocalSettings/bookmarksLayout";
import tailwindConfig from "@/tailwind.config";
import resolveConfig from "tailwindcss/resolveConfig";

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

function BookmarkCardSkeleton({ height }: { height: string }) {
  return (
    <div className="mb-4 border border-border bg-card p-4">
      <div className="space-y-3">
        <Skeleton className={`w-full ${height}`} />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export default function BookmarksGridSkeleton({
  count = 12,
}: {
  count?: number;
}) {
  const gridColumns = useGridColumns();
  const breakpointConfig = useMemo(
    () => getBreakpointConfig(gridColumns),
    [gridColumns],
  );
  const columnCount = useMasonryColumnCount(breakpointConfig);

  const columns = useMemo(() => {
    const cols: number[][] = Array.from({ length: columnCount }, () => []);
    for (let i = 0; i < count; i++) {
      cols[i % columnCount].push(i);
    }
    return cols;
  }, [count, columnCount]);

  return (
    <div className="-ml-8 flex w-auto">
      {columns.map((indices, colIdx) => (
        <div
          key={colIdx}
          className="pl-8"
          style={{ width: `${100 / columnCount}%` }}
        >
          {indices.map((i) => (
            <BookmarkCardSkeleton key={i} height="h-48" />
          ))}
        </div>
      ))}
    </div>
  );
}
