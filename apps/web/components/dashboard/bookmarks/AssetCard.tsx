"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

import type { ZBookmarkTypeAsset } from "@karakeep/shared/types/bookmarks";
import { getAssetUrl } from "@karakeep/shared/utils/assetUtils";
import { getSourceUrl } from "@karakeep/shared/utils/bookmarkUtils";

import { BookmarkLayoutAdaptingCard } from "./BookmarkLayoutAdaptingCard";
import FooterLinkURL from "./FooterLinkURL";

function AssetImage({
  bookmark,
  className,
}: {
  bookmark: ZBookmarkTypeAsset;
  className?: string;
}) {
  const bookmarkedAsset = bookmark.content;
  switch (bookmarkedAsset.assetType) {
    case "image": {
      // For masonry layout prefer a regular img so the natural height dictates
      // the card height. If a height class is provided use next/image with fill.
      const hasExplicitHeight =
        !!className && /(h-|min-h-|size-)/.test(className);
      if (hasExplicitHeight) {
        return (
          <Link href={`/dashboard/preview/${bookmark.id}`}>
            <Image
              alt="asset"
              src={getAssetUrl(bookmarkedAsset.assetId)}
              fill={true}
              className={className}
            />
          </Link>
        );
      }
      return (
        <Link href={`/dashboard/preview/${bookmark.id}`}>
          <img
            alt="asset"
            src={getAssetUrl(bookmarkedAsset.assetId)}
            className={cn(className ?? "", "h-auto w-full object-cover")}
          />
        </Link>
      );
    }
    case "pdf": {
      const screenshotAssetId = bookmark.assets.find(
        (r) => r.assetType === "assetScreenshot",
      )?.id;
      if (!screenshotAssetId) {
        return (
          <div
            className={cn(className, "flex items-center justify-center")}
            title="PDF screenshot not available. Run asset preprocessing job to generate one screenshot"
          >
            <FileText size={80} />
          </div>
        );
      }
      const hasExplicitHeight =
        !!className && /(h-|min-h-|size-)/.test(className);
      if (hasExplicitHeight) {
        return (
          <Link href={`/dashboard/preview/${bookmark.id}`}>
            <Image
              alt="asset"
              src={getAssetUrl(screenshotAssetId)}
              fill={true}
              className={className}
            />
          </Link>
        );
      }
      return (
        <Link href={`/dashboard/preview/${bookmark.id}`}>
          <img
            alt="asset"
            src={getAssetUrl(screenshotAssetId)}
            className={cn(className ?? "", "h-auto w-full object-cover")}
          />
        </Link>
      );
    }
    default: {
      const _exhaustiveCheck: never = bookmarkedAsset.assetType;
      return <span />;
    }
  }
}

export default function AssetCard({
  bookmark: bookmarkedAsset,
  className,
}: {
  bookmark: ZBookmarkTypeAsset;
  className?: string;
}) {
  return (
    <BookmarkLayoutAdaptingCard
      title={bookmarkedAsset.title ?? bookmarkedAsset.content.fileName}
      footer={
        getSourceUrl(bookmarkedAsset) && (
          <FooterLinkURL url={getSourceUrl(bookmarkedAsset)} />
        )
      }
      bookmark={bookmarkedAsset}
      className={className}
      wrapTags={true}
      image={(_layout, className) => (
        <div className="relative size-full flex-1">
          <AssetImage bookmark={bookmarkedAsset} className={className} />
        </div>
      )}
    />
  );
}
