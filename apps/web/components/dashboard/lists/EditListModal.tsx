"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useTranslation } from "@/lib/i18n/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  useCreateBookmarkList,
  useEditBookmarkList,
} from "@karakeep/shared-react/hooks/lists";
import { parseSearchQuery } from "@karakeep/shared/searchQueryParser";
import { bookmarkListIconTokenForUi } from "@karakeep/shared/listIcons";
import {
  ZBookmarkList,
  zNewBookmarkListSchema,
} from "@karakeep/shared/types/lists";

import QueryExplainerTooltip from "../search/QueryExplainerTooltip";
import { BookmarkListSelector } from "./BookmarkListSelector";
import { ListColorPicker } from "./ListColorPicker";
import { ListIconPicker } from "./ListIconPicker";

export function EditListModal({
  open: userOpen,
  setOpen: userSetOpen,
  list,
  prefill,
  children,
}: {
  open?: boolean;
  setOpen?: (v: boolean) => void;
  list?: ZBookmarkList;
  prefill?: Partial<Omit<ZBookmarkList, "id">>;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  if (
    (userOpen !== undefined && !userSetOpen) ||
    (userOpen === undefined && userSetOpen)
  ) {
    throw new Error("You must provide both open and setOpen or neither");
  }
  const [customOpen, customSetOpen] = useState(false);

  const creatingFolder = Boolean(prefill?.isFolder) && !list;
  const editingFolder = Boolean(list?.isFolder);

  const defaultIcon =
    (list ? bookmarkListIconTokenForUi(list) : undefined) ??
    prefill?.icon ??
    "📁";

  const form = useForm({
    resolver: zodResolver(zNewBookmarkListSchema),
    defaultValues: {
      name: list?.name ?? prefill?.name ?? "",
      description: list?.description ?? prefill?.description ?? "",
      icon: defaultIcon,
      color: list?.color ?? prefill?.color ?? null,
      parentId: list?.parentId ?? prefill?.parentId,
      type: list?.type ?? prefill?.type ?? "manual",
      query: list?.query ?? prefill?.query ?? undefined,
      thisListOnly: list?.thisListOnly ?? prefill?.thisListOnly ?? false,
      isFolder: list?.isFolder ?? Boolean(prefill?.isFolder),
    },
  });
  const [open, setOpen] = [
    userOpen ?? customOpen,
    userSetOpen ?? customSetOpen,
  ];

  useEffect(() => {
    form.reset({
      name: list?.name ?? prefill?.name ?? "",
      description: list?.description ?? prefill?.description ?? "",
      icon:
        (list ? bookmarkListIconTokenForUi(list) : undefined) ??
        prefill?.icon ??
        "📁",
      color: list?.color ?? prefill?.color ?? null,
      parentId: list?.parentId ?? prefill?.parentId,
      type: list?.type ?? prefill?.type ?? "manual",
      query: list?.query ?? prefill?.query ?? undefined,
      thisListOnly: list?.thisListOnly ?? prefill?.thisListOnly ?? false,
      isFolder: list?.isFolder ?? Boolean(prefill?.isFolder),
    });
  }, [open]);

  const parsedSearchQuery = useMemo(() => {
    const query = form.getValues().query;
    if (!query) {
      return undefined;
    }
    return parseSearchQuery(query);
  }, [form.watch("query")]);

  const { mutate: createList, isPending: isCreating } = useCreateBookmarkList({
    onSuccess: (resp) => {
      toast({
        description: t("toasts.lists.created"),
      });
      setOpen(false);
      router.push(`/dashboard/lists/${resp.id}`);
      form.reset();
    },
    onError: (e) => {
      if (e.data?.code == "BAD_REQUEST") {
        if (e.data.zodError) {
          toast({
            variant: "destructive",
            description: Object.values(e.data.zodError.fieldErrors)
              .flat()
              .join("\n"),
          });
        } else {
          toast({
            variant: "destructive",
            description: e.message,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: t("common.something_went_wrong"),
        });
      }
    },
  });

  const { mutate: editList, isPending: isEditing } = useEditBookmarkList({
    onSuccess: () => {
      toast({
        description: t("toasts.lists.updated"),
      });
      setOpen(false);
      form.reset();
    },
    onError: (e) => {
      if (e.data?.code == "BAD_REQUEST") {
        if (e.data.zodError) {
          toast({
            variant: "destructive",
            description: Object.values(e.data.zodError.fieldErrors)
              .flat()
              .join("\n"),
          });
        } else {
          toast({
            variant: "destructive",
            description: e.message,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: t("common.something_went_wrong"),
        });
      }
    },
  });
  const listType = form.watch("type");

  useEffect(() => {
    if (listType !== "smart") {
      form.resetField("query");
    }
  }, [listType]);

  useEffect(() => {
    if (listType === "smart") {
      form.setValue("thisListOnly", false);
    }
  }, [listType, form]);

  const isEdit = !!list;
  const isPending = isCreating || isEditing;

  const onSubmit = form.handleSubmit(
    (value: z.infer<typeof zNewBookmarkListSchema>) => {
      value.parentId = value.parentId === "" ? null : value.parentId;
      if (creatingFolder && !isEdit) {
        createList({
          ...value,
          type: "manual",
          query: undefined,
          isFolder: true,
          color: value.color ?? null,
          thisListOnly: false,
        });
        return;
      }
      value.query = value.type === "smart" ? value.query : undefined;
      value.isFolder = false;
      const payload = {
        ...value,
        color: value.color ?? null,
        thisListOnly: value.type === "manual" ? value.thisListOnly : false,
      };
      if (isEdit) {
        editList({
          listId: list!.id,
          name: payload.name,
          description: payload.description,
          icon: payload.icon,
          color: payload.color,
          parentId: payload.parentId,
          query: payload.type === "smart" ? payload.query : undefined,
          thisListOnly: payload.thisListOnly,
        });
      } else {
        createList(payload);
      }
    },
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(s) => {
        form.reset();
        setOpen(s);
      }}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>
                {isEdit
                  ? t("lists.edit_list")
                  : creatingFolder
                    ? t("lists.new_folder")
                    : t("lists.new_list")}
              </DialogTitle>
            </DialogHeader>
            <div className="flex w-full gap-2 py-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormControl>
                        <ListIconPicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => {
                  return (
                    <FormItem className="grow">
                      <FormControl>
                        <Input
                          type="text"
                          className="w-full"
                          placeholder={
                            creatingFolder
                              ? t("lists.folder_name_placeholder")
                              : t("lists.list_name_placeholder")
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => {
                return (
                  <FormItem className="grow pb-4">
                    <FormLabel>{t("lists.description")}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        className="w-full"
                        placeholder="Description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem className="grow pb-4">
                  <FormLabel>{t("lists.list_color")}</FormLabel>
                  <FormControl>
                    <ListColorPicker
                      value={field.value ?? null}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => {
                return (
                  <FormItem className="grow pb-4">
                    <FormLabel>{t("lists.parent_list")}</FormLabel>
                    <FormDescription>
                      {t("lists.parent_list_hint")}
                    </FormDescription>
                    <div className="flex items-center gap-1">
                      <FormControl>
                        <BookmarkListSelector
                          // Hide the current list from the list of parents
                          hideSubtreeOf={list ? list.id : undefined}
                          forParentListAssignment
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("lists.no_parent")}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          form.setValue("parentId", "");
                        }}
                      >
                        <X />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            {!creatingFolder && !editingFolder ? (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => {
                  return (
                    <FormItem className="grow pb-4">
                      <FormLabel>{t("lists.list_type")}</FormLabel>
                      <FormControl>
                        <Select
                          disabled={isEdit}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">
                              {t("lists.manual_list")}
                            </SelectItem>
                            <SelectItem value="smart">
                              {t("lists.smart_list")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            ) : null}
            {!creatingFolder && !editingFolder && listType === "smart" ? (
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => {
                  return (
                    <FormItem className="grow pb-4">
                      <FormLabel>{t("lists.search_query")}</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t("lists.search_query")}
                            endIcon={
                              parsedSearchQuery ? (
                                <QueryExplainerTooltip
                                  className="stroke-foreground p-1"
                                  parsedSearchQuery={parsedSearchQuery}
                                />
                              ) : undefined
                            }
                          />
                        </FormControl>
                      </div>
                      <FormDescription>
                        <Link
                          href="https://docs.karakeep.app/Guides/search-query-language"
                          className="italic"
                          target="_blank"
                        >
                          {t("lists.search_query_help")}
                        </Link>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            ) : null}
            {!creatingFolder && !editingFolder && listType === "manual" ? (
              <FormField
                control={form.control}
                name="thisListOnly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("lists.this_list_only")}</FormLabel>
                      <FormDescription>
                        {t("lists.this_list_only_description")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t("actions.close")}
                </Button>
              </DialogClose>
              <ActionButton
                type="submit"
                onClick={onSubmit}
                loading={isPending}
              >
                {list ? t("actions.save") : t("actions.create")}
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
