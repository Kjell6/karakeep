"use client";

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
  staticLogo,
}: {
  name: string;
  icon?: string;
  path: string;
  style?: React.CSSProperties;
  list?: ZBookmarkList;
  open?: boolean;
  collapsible: boolean;
  staticLogo?: React.ReactNode;
}) {
  return (
    <li
      className="my-2 flex items-center justify-between rounded-md border border-border p-2 hover:bg-accent/50"
      style={style}
    >
      <span className="flex flex-1 items-center gap-1">
        {collapsible && (
          <CollapsibleTriggerChevron className="size-5" open={open ?? false} />
        )}
        <Link href={path} className="flex flex-1 items-center gap-2">
          {staticLogo ? (
            <span className="flex shrink-0 items-center text-muted-foreground">
              {staticLogo}
            </span>
          ) : (
            icon && (
              <ListIcon
                icon={icon}
                className="size-5 shrink-0 text-muted-foreground"
                emojiClassName="text-xl"
              />
            )
          )}
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
        path={`/dashboard/favourites`}
        staticLogo={<Star className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <ListItem
        collapsible={false}
        name={t("common.archive")}
        path={`/dashboard/archive`}
        staticLogo={<Archive className="size-5 stroke-[1.5]" aria-hidden />}
      />

      {/* Owned Lists */}
      <CollapsibleBookmarkLists
        listsData={lists}
        filter={(node) => node.item.userRole === "owner"}
        render={({ node, level, open }) => (
          <ListItem
            name={node.item.name}
            icon={node.item.icon}
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
            path="#"
            open={sharedListsOpen}
            staticLogo={<Users className="size-5 stroke-[1.5]" aria-hidden />}
          />
          <CollapsibleContent>
            <CollapsibleBookmarkLists
              listsData={lists}
              filter={(node) => node.item.userRole !== "owner"}
              indentOffset={1}
              render={({ node, level, open }) => (
                <ListItem
                  name={node.item.name}
                  icon={node.item.icon}
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
