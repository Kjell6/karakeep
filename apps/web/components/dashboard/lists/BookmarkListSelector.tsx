import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import LoadingSpinner from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

import { listIconToPlainLabel } from "@karakeep/shared/listIcons";
import { useBookmarkLists } from "@karakeep/shared-react/hooks/lists";
import { ZBookmarkList } from "@karakeep/shared/types/lists";

import { ListIcon } from "./ListIcon";

export function BookmarkListSelector({
  value,
  onChange,
  hideSubtreeOf,
  hideBookmarkIds = [],
  placeholder = "Select a list",
  className,
  listTypes = ["manual", "smart"],
}: {
  className?: string;
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  hideSubtreeOf?: string;
  hideBookmarkIds?: string[];
  listTypes?: ZBookmarkList["type"][];
}) {
  const [open, setOpen] = useState(false);
  const { data, isPending: isFetchingListsPending } = useBookmarkLists();
  let { allPaths } = data ?? {};

  if (isFetchingListsPending) {
    return <LoadingSpinner />;
  }

  allPaths = allPaths?.filter((path) => {
    const lastItem = path[path.length - 1];
    if (hideBookmarkIds.includes(lastItem.id)) {
      return false;
    }
    if (!listTypes.includes(lastItem.type)) {
      return false;
    }
    // Hide lists where user is a viewer (can't add/remove bookmarks)
    if (lastItem.userRole === "viewer") {
      return false;
    }
    if (!hideSubtreeOf) {
      return true;
    }
    return !path.map((p) => p.id).includes(hideSubtreeOf);
  });

  // Find the selected list's display name
  const selectedListPath = allPaths?.find(
    (path) => path[path.length - 1].id === value,
  );
  const selectedListName = selectedListPath ? (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-left">
      {selectedListPath.map((p, i) => (
        <Fragment key={p.id}>
          {i > 0 ? (
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
          ) : null}
          <span className="inline-flex min-w-0 items-center gap-1">
            <ListIcon
              className="size-4 shrink-0"
              icon={p.icon}
              strokeWidth={2}
              style={p.color ? { color: p.color } : undefined}
            />
            <span className="truncate">{p.name}</span>
          </span>
        </Fragment>
      ))}
    </span>
  ) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedListName || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        onWheel={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Search lists..." />
          <CommandList>
            <CommandEmpty>
              {allPaths && allPaths.length === 0
                ? "You don't currently have any lists."
                : "No lists found."}
            </CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              {allPaths?.map((path) => {
                const l = path[path.length - 1];
                return (
                  <CommandItem
                    key={l.id}
                    value={l.id}
                    keywords={[
                      l.name,
                      l.icon,
                      listIconToPlainLabel(l.icon),
                      ...path.flatMap((p) => [
                        p.name,
                        listIconToPlainLabel(p.icon),
                      ]),
                    ]}
                    onSelect={(currentValue) => {
                      onChange(currentValue);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === l.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
                      {path.map((p, i) => (
                        <Fragment key={p.id}>
                          {i > 0 ? (
                            <span className="text-muted-foreground" aria-hidden>
                              /
                            </span>
                          ) : null}
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <ListIcon
                              className="size-4 shrink-0"
                              icon={p.icon}
                              strokeWidth={2}
                              style={p.color ? { color: p.color } : undefined}
                            />
                            <span className="truncate">{p.name}</span>
                          </span>
                        </Fragment>
                      ))}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
