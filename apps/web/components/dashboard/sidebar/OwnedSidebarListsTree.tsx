"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { bookmarkListIconTokenForUi } from "@karakeep/shared/listIcons";
import type { ZBookmarkList } from "@karakeep/shared/types/lists";
import { useAddBookmarkToList } from "@karakeep/shared-react/hooks/lists";
import { useTRPC } from "@karakeep/shared-react/trpc";
import {
  compareBookmarkLists,
  ZBookmarkListTreeNode,
} from "@karakeep/shared/utils/listUtils";

import { ListIcon } from "../lists/ListIcon";
import { ListOptions } from "../lists/ListOptions";

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

function OwnedSortableRow({
  node,
  level,
  open,
  numBookmarks,
  selectedListId,
  setSelectedListId,
}: {
  node: ZBookmarkListTreeNode;
  level: number;
  open: boolean;
  numBookmarks?: number;
  selectedListId: string | null;
  setSelectedListId: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.item.id,
    data: { sortParentId: node.item.parentId ?? null },
  });

  const canReceiveBookmarks =
    node.item.type === "manual" &&
    !node.item.isFolder &&
    (node.item.userRole === "owner" || node.item.userRole === "editor");

  const { dropHighlight, onDragOver, onDragEnter, onDragLeave, onDrop } =
    useDropTarget(node.item.id, node.item.name);

  const style = useMemo(
    () => ({
      marginLeft: `${level * 1}rem`,
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [level, transform, transition],
  );

  return (
    <SidebarItem
      ref={setNodeRef}
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
      style={style}
      isDragging={isDragging}
      right={
        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            size="none"
            variant="ghost"
            className={cn(
              "relative mr-0.5 cursor-grab touch-none rounded-md p-1 active:cursor-grabbing",
              "text-muted-foreground opacity-0 transition-opacity duration-100 group-hover:opacity-100",
            )}
            aria-label={t("lists.reorder_handle", {
              defaultValue: "Reorder list",
            })}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" strokeWidth={2} aria-hidden />
          </Button>
          <ListOptions
            onOpenChange={(isOpen) => {
              if (isOpen) {
                setSelectedListId(node.item.id);
              } else {
                setSelectedListId(null);
              }
            }}
            list={node.item}
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
                  selectedListId == node.item.id ||
                    numBookmarks === undefined ||
                    node.item.isFolder
                    ? "opacity-0"
                    : "opacity-100",
                )}
              >
                {numBookmarks}
              </span>
            </Button>
          </ListOptions>
        </div>
      }
      dropHighlight={canReceiveBookmarks && dropHighlight}
      onDragOver={canReceiveBookmarks ? onDragOver : undefined}
      onDragEnter={canReceiveBookmarks ? onDragEnter : undefined}
      onDragLeave={canReceiveBookmarks ? onDragLeave : undefined}
      onDrop={canReceiveBookmarks ? onDrop : undefined}
    />
  );
}

function isAnyChildOpen(
  node: ZBookmarkListTreeNode,
  isOpenFunc: (n: ZBookmarkListTreeNode) => boolean,
): boolean {
  if (isOpenFunc(node)) {
    return true;
  }
  return node.children.some((c) => isAnyChildOpen(c, isOpenFunc));
}

function OwnedTreeNode({
  node,
  level,
  indentOffset,
  isOpenFunc,
  listStats,
  selectedListId,
  setSelectedListId,
}: {
  node: ZBookmarkListTreeNode;
  level: number;
  indentOffset: number;
  isOpenFunc: (n: ZBookmarkListTreeNode) => boolean;
  listStats?: Map<string, number>;
  selectedListId: string | null;
  setSelectedListId: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen((curr) => curr || isAnyChildOpen(node, isOpenFunc));
  }, [node, isOpenFunc]);

  const sortedChildren = useMemo(
    () => [...node.children].sort((a, b) => compareBookmarkLists(a.item, b.item)),
    [node.children],
  );

  const childIds = sortedChildren.map((c) => c.item.id);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <OwnedSortableRow
        node={node}
        level={level + indentOffset}
        open={open}
        numBookmarks={listStats?.get(node.item.id)}
        selectedListId={selectedListId}
        setSelectedListId={setSelectedListId}
      />
      <CollapsibleContent>
        {childIds.length > 0 ? (
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            {sortedChildren.map((child) => (
              <OwnedTreeNode
                key={child.item.id}
                node={child}
                level={level + 1}
                indentOffset={indentOffset}
                isOpenFunc={isOpenFunc}
                listStats={listStats}
                selectedListId={selectedListId}
                setSelectedListId={setSelectedListId}
              />
            ))}
          </SortableContext>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function OwnedSidebarListsTree({
  rootNodes,
  ownedSiblingsByParent,
  isNodeOpen,
  selectedListId,
  setSelectedListId,
  reorderLists,
}: {
  rootNodes: ZBookmarkListTreeNode[];
  ownedSiblingsByParent: Map<string | null, ZBookmarkList[]>;
  isNodeOpen: (node: ZBookmarkListTreeNode) => boolean;
  selectedListId: string | null;
  setSelectedListId: (id: string | null) => void;
  reorderLists: (input: {
    parentId: string | null;
    orderedIds: string[];
  }) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const api = useTRPC();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const { data: listStats } = useQuery(
    api.lists.stats.queryOptions(undefined, {
      placeholderData: keepPreviousData,
    }),
  );

  const sortedRoots = useMemo(
    () => [...rootNodes].sort((a, b) => compareBookmarkLists(a.item, b.item)),
    [rootNodes],
  );

  const rootIds = sortedRoots.map((n) => n.item.id);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const ap = active.data.current?.sortParentId ?? null;
      const op = over.data.current?.sortParentId ?? null;
      if (ap !== op) {
        return;
      }
      const siblings = ownedSiblingsByParent.get(ap);
      if (!siblings?.length) {
        return;
      }
      const oldIndex = siblings.findIndex((s) => s.id === active.id);
      const newIndex = siblings.findIndex((s) => s.id === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return;
      }
      const orderedIds = arrayMove(
        siblings.map((s) => s.id),
        oldIndex,
        newIndex,
      );
      try {
        await reorderLists({ parentId: ap, orderedIds });
      } catch {
        toast({
          description: t("common.something_went_wrong", {
            defaultValue: "Something went wrong",
          }),
          variant: "destructive",
        });
      }
    },
    [ownedSiblingsByParent, reorderLists, t],
  );

  if (sortedRoots.length === 0) {
    return null;
  }

  return (
    <DndContext
      modifiers={[restrictToVerticalAxis]}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(e) => void handleDragEnd(e)}
    >
      <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
        {sortedRoots.map((node) => (
          <OwnedTreeNode
            key={node.item.id}
            node={node}
            level={0}
            indentOffset={0}
            isOpenFunc={isNodeOpen}
            listStats={listStats?.stats}
            selectedListId={selectedListId}
            setSelectedListId={setSelectedListId}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
