import type { ZBookmarkList } from "../types/lists";

/**
 * Removes folder rows and lifts lists out from under folder parents so pickers
 * (extension, mobile, bookmark-target selectors) stay a flat list behaviour.
 */
export function flattenBookmarkListFoldersForBookmarkPickers(
  lists: ZBookmarkList[],
): ZBookmarkList[] {
  const byId = new Map(lists.map((l) => [l.id, l]));

  function firstNonFolderAncestorId(parentId: string | null): string | null {
    if (parentId === null) {
      return null;
    }
    const p = byId.get(parentId);
    if (!p) {
      return null;
    }
    if (p.isFolder) {
      return firstNonFolderAncestorId(p.parentId);
    }
    return parentId;
  }

  return lists
    .filter((l) => !l.isFolder)
    .map((l) => ({
      ...l,
      parentId: firstNonFolderAncestorId(l.parentId),
    }));
}
