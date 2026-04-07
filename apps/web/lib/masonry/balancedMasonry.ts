import type { ZBookmark, ZPublicBookmark } from "@karakeep/shared/types/bookmarks";
import { BookmarkTypes } from "@karakeep/shared/types/bookmarks";
import { getBookmarkLinkImageUrl } from "@karakeep/shared/utils/bookmarkUtils";

/** Card chrome: title row, padding, `mb-4` between cards (matches StyledBookmarkCard). */
const CARD_MARGIN_BOTTOM_PX = 16;
const BASE_CHROME_PX = 72;

export const EDITOR_CARD_ESTIMATE_HEIGHT_PX = 220;

/** Deterministic 0..1 from a string (spreads masonry height estimates so ties break naturally). */
export function stableHash01(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

export interface MasonryBreakpointCols {
  default: number;
  [minWidth: number]: number;
}

export function getMasonryColumnCountForWindowWidth(
  breakpointCols: MasonryBreakpointCols,
  windowWidth: number,
): number {
  let matchedBreakpoint = Infinity;
  let columns = breakpointCols.default;

  for (const key of Object.keys(breakpointCols)) {
    if (key === "default") {
      continue;
    }
    const optBreakpoint = Number.parseInt(key, 10);
    const isCurrentBreakpoint = optBreakpoint > 0 && windowWidth <= optBreakpoint;

    if (isCurrentBreakpoint && optBreakpoint < matchedBreakpoint) {
      matchedBreakpoint = optBreakpoint;
      columns = breakpointCols[optBreakpoint] as number;
    }
  }

  return Math.max(1, Number.parseInt(String(columns), 10) || 1);
}

export function estimateDashboardBookmarkHeight(bookmark: ZBookmark): number {
  const base = BASE_CHROME_PX + CARD_MARGIN_BOTTOM_PX;
  const v = stableHash01(bookmark.id);

  switch (bookmark.content.type) {
    case BookmarkTypes.LINK: {
      const image = getBookmarkLinkImageUrl(bookmark.content);
      if (image) {
        // Real banner heights vary a lot; spread estimates so columns do not tie on one value.
        return Math.round(base + 140 + v * 420);
      }
      return base + 48;
    }
    case BookmarkTypes.TEXT: {
      const textLen = bookmark.content.text?.length ?? 0;
      return base + Math.min(340, 100 + textLen * 0.12);
    }
    case BookmarkTypes.ASSET: {
      if (bookmark.content.assetType === "image") {
        return Math.round(base + 120 + v * 400);
      }
      return base + 180 + Math.round(v * 120);
    }
    default:
      return base + 120;
  }
}

export function estimatePublicBookmarkHeight(bookmark: ZPublicBookmark): number {
  const base = BASE_CHROME_PX + CARD_MARGIN_BOTTOM_PX;
  const v = stableHash01(bookmark.id);

  switch (bookmark.content.type) {
    case BookmarkTypes.LINK:
      return bookmark.bannerImageUrl
        ? Math.round(base + 140 + v * 420)
        : base + 48;
    case BookmarkTypes.TEXT: {
      const textLen = bookmark.content.text?.length ?? 0;
      return base + Math.min(340, 100 + textLen * 0.12);
    }
    case BookmarkTypes.ASSET:
      return bookmark.bannerImageUrl
        ? Math.round(base + 120 + v * 400)
        : base + 140 + Math.round(v * 80);
    default:
      return base + 120;
  }
}

/**
 * Places items into columns so the column with the smallest running sum of
 * estimated heights gets the next item (greedy). Matches how CSS masonry
 * should balance when column count is fixed.
 */
export function distributeIntoShortestColumns<T>(
  items: T[],
  columnCount: number,
  estimateHeight: (item: T) => number,
  options?: {
    /** Extra height reserved for the first column (e.g. editor card above items). */
    leadFirstColumnHeightPx?: number;
  },
): T[][] {
  const n = Math.max(1, columnCount);
  const columns: T[][] = Array.from({ length: n }, () => []);
  const heights = Array.from({ length: n }, () => 0);

  if (options?.leadFirstColumnHeightPx) {
    heights[0] += options.leadFirstColumnHeightPx;
  }

  let tieRoundRobin = 0;
  const heightEpsilon = 1e-4;

  for (const item of items) {
    const minH = Math.min(...heights);
    const candidates: number[] = [];
    for (let c = 0; c < n; c++) {
      if (Math.abs(heights[c] - minH) <= heightEpsilon) {
        candidates.push(c);
      }
    }
    const colIdx =
      candidates[tieRoundRobin % candidates.length] ?? 0;
    tieRoundRobin++;

    columns[colIdx].push(item);
    heights[colIdx] += estimateHeight(item);
  }

  return columns;
}
