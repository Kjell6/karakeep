"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  BOOKMARK_LIST_ICON_GROUPS,
  formatLucideListIcon,
} from "@karakeep/shared/listIcons";
import type { BookmarkListLucideIconName } from "@karakeep/shared/listIcons";

import { ListIcon } from "./ListIcon";

export function ListIconPicker({
  value,
  onChange,
  triggerClassName,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  triggerClassName?: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "flex h-10 min-w-10 shrink-0 items-center justify-center rounded-md border border-input px-2",
            triggerClassName,
          )}
        >
          <ListIcon icon={value} className="size-6" strokeWidth={2} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(22rem,calc(100vw-2rem))] p-3"
        align="start"
      >
        <Tabs defaultValue="symbols">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="symbols">
              {t("lists.icon_tab_icons")}
            </TabsTrigger>
            <TabsTrigger value="emoji">{t("lists.icon_tab_emoji")}</TabsTrigger>
          </TabsList>
          <TabsContent value="symbols" className="mt-2">
            <ScrollArea className="h-[min(20rem,calc(100vh-12rem))] pr-3">
              <div className="flex flex-col gap-4 pb-2">
                {BOOKMARK_LIST_ICON_GROUPS.map((group) => (
                  <div key={group.id}>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t(`lists.${group.i18nKey}`)}
                    </p>
                    <div className="grid grid-cols-7 gap-1">
                      {group.icons.map((name) => {
                        const token = formatLucideListIcon(
                          name as BookmarkListLucideIconName,
                        );
                        const selected = value === token;
                        return (
                          <button
                            key={name}
                            type="button"
                            aria-label={name}
                            className={cn(
                              "flex size-9 items-center justify-center rounded-md border border-transparent transition-colors",
                              "hover:bg-accent hover:text-accent-foreground",
                              selected && "border-primary bg-accent",
                            )}
                            onClick={() => {
                              onChange(token);
                              setOpen(false);
                            }}
                          >
                            <ListIcon
                              icon={token}
                              className="size-[18px]"
                              strokeWidth={2}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="emoji" className="mt-2">
            <Picker
              data={data}
              onEmojiSelect={(e: { native: string }) => {
                onChange(e.native);
                setOpen(false);
              }}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
