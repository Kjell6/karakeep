"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTriggerChevron,
} from "@/components/ui/collapsible";
import { useTranslation } from "@/lib/i18n/client";
import { Archive, MoreHorizontal, Star, Users } from "lucide-react";

import type { ZBookmarkList } from "@karakeep/shared/types/lists";
import {
  augmentBookmarkListsWithInitialData,
  useBookmarkLists,
} from "@karakeep/shared-react/hooks/lists";

import { CollapsibleBookmarkLists } from "./CollapsibleBookmarkLists";
import { ListIcon } from "./ListIcon";
import { ListOptions } from "./ListOptions";

function ListItem({
  name,
  icon,
  path,
  style,
  list,
  open,
  collapsible,
}: {
  name: string;
  icon: ReactNode;
  path: string;
  style?: CSSProperties;
  list?: ZBookmarkList;
  open?: boolean;
  collapsible: boolean;
}) {
  return (
    <li
      className="my-2 flex items-center justify-between rounded-md border border-input p-2 hover:bg-accent/50"
      style={style}
    >
      <span className="flex flex-1 items-center gap-1">
        {collapsible && (
          <CollapsibleTriggerChevron className="size-5" open={open ?? false} />
        )}
        <Link href={path} className="flex min-h-8 flex-1 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-lg leading-none [&>svg]:shrink-0 [&>svg]:-translate-x-0.5">
            {icon}
          </span>
          <p className="text-nowrap text-lg">{name}</p>
        </Link>
      </span>
      {list && (
        <ListOptions list={list}>
          <Button
            className="flex h-full items-center justify-end"
            variant="ghost"
          >
            <MoreHorizontal />
          </Button>
        </ListOptions>
      )}
    </li>
  );
}

export default function AllListsView({
  initialData,
}: {
  initialData: ZBookmarkList[];
}) {
  const { t } = useTranslation();

  // Fetch live lists data
  const { data: listsData } = useBookmarkLists(undefined, {
    initialData: { lists: initialData },
  });
  const lists = augmentBookmarkListsWithInitialData(listsData, initialData);

  // Check if there are any shared lists
  const hasSharedLists = useMemo(() => {
    return lists.data.some((list) => list.userRole !== "owner");
  }, [lists.data]);

  const [sharedListsOpen, setSharedListsOpen] = useState(true);

  return (
    <ul>
      <ListItem
        collapsible={false}
        name={t("lists.favourites")}
        icon={<Star className="size-5.5" strokeWidth={2} aria-hidden />}
        path={`/dashboard/favourites`}
      />
      <ListItem
        collapsible={false}
        name={t("common.archive")}
        icon={<Archive className="size-5.5" strokeWidth={2} aria-hidden />}
        path={`/dashboard/archive`}
      />

      {/* Owned Lists */}
      <CollapsibleBookmarkLists
        listsData={lists}
        filter={(node) => node.item.userRole === "owner"}
        render={({ node, level, open }) => (
          <ListItem
            name={node.item.name}
            icon={
              <ListIcon
                className="size-5.5"
                icon={node.item.icon}
                strokeWidth={2}
                style={node.item.color ? { color: node.item.color } : undefined}
              />
            }
            list={node.item}
            path={`/dashboard/lists/${node.item.id}`}
            collapsible={node.children.length > 0}
            open={open}
            style={{ marginLeft: `${level * 1}rem` }}
          />
        )}
      />

      {/* Shared Lists */}
      {hasSharedLists && (
        <Collapsible open={sharedListsOpen} onOpenChange={setSharedListsOpen}>
          <ListItem
            collapsible={true}
            name={t("lists.shared_lists")}
            icon={<Users className="size-5.5" strokeWidth={2} aria-hidden />}
            path="#"
            open={sharedListsOpen}
          />
          <CollapsibleContent>
            <CollapsibleBookmarkLists
              listsData={lists}
              filter={(node) => node.item.userRole !== "owner"}
              indentOffset={1}
              render={({ node, level, open }) => (
                <ListItem
                  name={node.item.name}
                  icon={
                    <ListIcon
                      className="size-5.5"
                      icon={node.item.icon}
                      strokeWidth={2}
                      style={
                        node.item.color ? { color: node.item.color } : undefined
                      }
                    />
                  }
                  list={node.item}
                  path={`/dashboard/lists/${node.item.id}`}
                  collapsible={node.children.length > 0}
                  open={open}
                  style={{ marginLeft: `${level * 1}rem` }}
                />
              )}
            />
          </CollapsibleContent>
        </Collapsible>
      )}
    </ul>
  );
}
