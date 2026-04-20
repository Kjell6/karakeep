"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarItem from "@/components/shared/sidebar/SidebarItem";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTriggerTriangle,
} from "@/components/ui/collapsible";
import { toast } from "@/components/ui/sonner";
import { BOOKMARK_DRAG_MIME } from "@/lib/bookmark-drag";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { ClipboardList, MoreHorizontal, Plus, Star, Users } from "lucide-react";

import type { ZBookmarkList } from "@karakeep/shared/types/lists";
import {
  augmentBookmarkListsWithInitialData,
  useAddBookmarkToList,
  useBookmarkLists,
  useReorderBookmarkLists,
} from "@karakeep/shared-react/hooks/lists";
import {
  compareBookmarkLists,
  ZBookmarkListTreeNode,
} from "@karakeep/shared/utils/listUtils";

import { CollapsibleBookmarkLists } from "../lists/CollapsibleBookmarkLists";
import { EditListModal } from "../lists/EditListModal";
import { bookmarkListIconTokenForUi } from "@karakeep/shared/listIcons";

import { ListIcon } from "../lists/ListIcon";
import { ListOptions } from "../lists/ListOptions";
import { InvitationNotificationBadge } from "./InvitationNotificationBadge";

const noop = () => undefined;

/** Keeps list icons aligned with rows that show a nested expand control (same width as one `pl-3` step). */
const listLeadingPlaceholder = (
  <span className="pointer-events-none invisible size-2 shrink-0" aria-hidden />
);

function useDropTarget(listId: string, listName: string) {
  const { mutateAsync: addToList } = useAddBookmarkToList();
  const [dropHighlight, setDropHighlight] = useState(false);
  const dragCounterRef = useRef(0);
  const { t } = useTranslation();

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(BOOKMARK_DRAG_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(BOOKMARK_DRAG_MIME)) {
      e.preventDefault();
      dragCounterRef.current++;
      setDropHighlight(true);
    }
  }, []);

  const onDragLeave = useCallback(() => {
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDropHighlight(false);
    }
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      dragCounterRef.current = 0;
      setDropHighlight(false);
      const bookmarkId = e.dataTransfer.getData(BOOKMARK_DRAG_MIME);
      if (!bookmarkId) return;
      e.preventDefault();
      try {
        await addToList({ bookmarkId, listId });
        toast({
          description: t("lists.add_to_list_success", {
            list: listName,
            defaultValue: `Added to "${listName}"`,
          }),
        });
      } catch {
        toast({
          description: t("common.something_went_wrong", {
            defaultValue: "Something went wrong",
          }),
          variant: "destructive",
        });
      }
    },
    [addToList, listId, listName, t],
  );

  return { dropHighlight, onDragOver, onDragEnter, onDragLeave, onDrop };
}

function DroppableListSidebarItem({
  node,
  level,
  open,
  numBookmarks,
  selectedListId,
  setSelectedListId,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  node: ZBookmarkListTreeNode;
  level: number;
  open: boolean;
  numBookmarks?: number;
  selectedListId: string | null;
  setSelectedListId: (id: string | null) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const canDrop =
    node.item.type === "manual" &&
    (node.item.userRole === "owner" || node.item.userRole === "editor");
  const { dropHighlight, onDragOver, onDragEnter, onDragLeave, onDrop } =
    useDropTarget(node.item.id, node.item.name);

  return (
    <SidebarItem
      collapseButton={
        node.children.length > 0 ? (
          <CollapsibleTriggerTriangle className="size-2 shrink-0" open={open} />
        ) : (
          listLeadingPlaceholder
        )
      }
      logo={
        <ListIcon
          className="size-[18px] shrink-0"
          icon={bookmarkListIconTokenForUi(node.item)}
          strokeWidth={2}
          style={node.item.color ? { color: node.item.color } : undefined}
        />
      }
      name={node.item.name}
      path={`/dashboard/lists/${node.item.id}`}
      className="group"
      right={
        <ListOptions
          onOpenChange={(isOpen) => {
            if (isOpen) {
              setSelectedListId(node.item.id);
            } else {
              setSelectedListId(null);
            }
          }}
          list={node.item}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        >
          <Button size="none" variant="ghost" className="relative">
            <MoreHorizontal
              className={cn(
                "absolute inset-0 m-auto size-4 opacity-0 transition-opacity duration-100 group-hover:opacity-100",
                selectedListId == node.item.id ? "opacity-100" : "opacity-0",
              )}
            />
            <span
              className={cn(
                "px-2.5 text-xs font-light text-muted-foreground opacity-100 transition-opacity duration-100 group-hover:opacity-0",
                selectedListId == node.item.id || numBookmarks === undefined
                  ? "opacity-0"
                  : "opacity-100",
              )}
            >
              {numBookmarks}
            </span>
          </Button>
        </ListOptions>
      }
      style={{ marginLeft: `${level * 1}rem` }}
      dropHighlight={canDrop && dropHighlight}
      onDragOver={canDrop ? onDragOver : undefined}
      onDragEnter={canDrop ? onDragEnter : undefined}
      onDragLeave={canDrop ? onDragLeave : undefined}
      onDrop={canDrop ? onDrop : undefined}
    />
  );
}

export default function AllLists({
  initialData,
}: {
  initialData: { lists: ZBookmarkList[] };
}) {
  const { t } = useTranslation();
  const pathName = usePathname();
  const isNodeOpen = useCallback(
    (node: ZBookmarkListTreeNode) => pathName.includes(node.item.id),
    [pathName],
  );

  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const { mutateAsync: reorderLists } = useReorderBookmarkLists();

  const { data: listsData } = useBookmarkLists(undefined, {
    initialData: { lists: initialData.lists },
  });
  const lists = augmentBookmarkListsWithInitialData(
    listsData,
    initialData.lists,
  );

  const ownedSiblingsByParent = useMemo(() => {
    const siblings = new Map<string | null, ZBookmarkList[]>();
    lists.data
      .filter((list) => list.userRole === "owner")
      .forEach((list) => {
        const key = list.parentId ?? null;
        const current = siblings.get(key) ?? [];
        current.push(list);
        current.sort(compareBookmarkLists);
        siblings.set(key, current);
      });
    return siblings;
  }, [lists.data]);

  const moveList = useCallback(
    async (list: ZBookmarkList, direction: -1 | 1) => {
      const siblings = ownedSiblingsByParent.get(list.parentId ?? null);
      if (!siblings) return;

      const currentIndex = siblings.findIndex((item) => item.id === list.id);
      if (currentIndex === -1) return;

      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= siblings.length) return;

      const orderedIds = siblings.map((item) => item.id);
      const [movedId] = orderedIds.splice(currentIndex, 1);
      orderedIds.splice(targetIndex, 0, movedId);

      await reorderLists({
        parentId: list.parentId,
        orderedIds,
      });
    },
    [ownedSiblingsByParent, reorderLists],
  );

  const isViewingSharedList = useMemo(() => {
    return lists.data.some(
      (list) => list.userRole !== "owner" && pathName.includes(list.id),
    );
  }, [lists.data, pathName]);

  const hasSharedLists = useMemo(() => {
    return lists.data.some((list) => list.userRole !== "owner");
  }, [lists.data]);

  const [sharedListsOpen, setSharedListsOpen] = useState(isViewingSharedList);

  useEffect(() => {
    if (isViewingSharedList && !sharedListsOpen) {
      setSharedListsOpen(true);
    }
  }, [isViewingSharedList, sharedListsOpen]);

  return (
    <ul className="sidebar-scrollbar flex max-h-full flex-col gap-0 overflow-auto text-sm">
      <li className="mb-2 flex justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Lists
        </p>
        <EditListModal>
          <Link href="#">
            <Plus
              className="mr-2 size-4 text-muted-foreground"
              strokeWidth={2}
            />
          </Link>
        </EditListModal>
      </li>
      <SidebarItem
        collapseButton={listLeadingPlaceholder}
        logo={<ClipboardList size={18} strokeWidth={2} aria-hidden />}
        name={t("lists.all_lists")}
        path={`/dashboard/lists`}
        right={<InvitationNotificationBadge />}
      />
      <SidebarItem
        collapseButton={listLeadingPlaceholder}
        logo={<Star size={18} strokeWidth={2} aria-hidden />}
        name={t("lists.favourites")}
        path={`/dashboard/favourites`}
      />

      <div className="mt-2">
        <CollapsibleBookmarkLists
          listsData={lists}
          filter={(node) => node.item.userRole === "owner"}
          isOpenFunc={isNodeOpen}
          render={({ node, level, open, numBookmarks }) => {
            const siblings =
              ownedSiblingsByParent.get(node.item.parentId ?? null) ?? [];
            const index = siblings.findIndex(
              (item) => item.id === node.item.id,
            );

            return (
              <DroppableListSidebarItem
                node={node}
                level={level}
                open={open}
                numBookmarks={numBookmarks}
                selectedListId={selectedListId}
                setSelectedListId={setSelectedListId}
                canMoveUp={index > 0}
                canMoveDown={index >= 0 && index < siblings.length - 1}
                onMoveUp={() => void moveList(node.item, -1)}
                onMoveDown={() => void moveList(node.item, 1)}
              />
            );
          }}
        />
      </div>

      {hasSharedLists && (
        <Collapsible open={sharedListsOpen} onOpenChange={setSharedListsOpen}>
          <SidebarItem
            collapseButton={
              <CollapsibleTriggerTriangle
                className="size-2 shrink-0"
                open={sharedListsOpen}
              />
            }
            logo={<Users size={18} strokeWidth={2} aria-hidden />}
            name={t("lists.shared_lists")}
            path="#"
          />
          <CollapsibleContent>
            <CollapsibleBookmarkLists
              listsData={lists}
              filter={(node) => node.item.userRole !== "owner"}
              isOpenFunc={isNodeOpen}
              indentOffset={1}
              render={({ node, level, open, numBookmarks }) => (
                <DroppableListSidebarItem
                  node={node}
                  level={level}
                  open={open}
                  numBookmarks={numBookmarks}
                  selectedListId={selectedListId}
                  setSelectedListId={setSelectedListId}
                  canMoveUp={false}
                  canMoveDown={false}
                  onMoveUp={noop}
                  onMoveDown={noop}
                />
              )}
            />
          </CollapsibleContent>
        </Collapsible>
      )}
    </ul>
  );
}
