import type { Metadata } from "next";
import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import { useTranslation } from "@/lib/i18n/server";
import { Star } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  // oxlint-disable-next-line rules-of-hooks
  const { t } = await useTranslation();
  return {
    title: `${t("lists.favourites")} | Karakeep`,
  };
}

export default async function FavouritesBookmarkPage() {
  // oxlint-disable-next-line rules-of-hooks
  const { t } = await useTranslation();

  return (
    <Bookmarks
      header={
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-2xl">
            <Star
              className="size-6 shrink-0 -translate-x-0.5"
              strokeWidth={2}
              aria-hidden
            />
            {t("lists.favourites")}
          </p>
        </div>
      }
      query={{ favourited: true }}
      showDivider={true}
      showEditorCard={true}
    />
  );
}
