import { eq } from "drizzle-orm";

import { db } from "@karakeep/db";
import { assets, AssetTypes, bookmarkLinks } from "@karakeep/db/schema";
import { readAsset, ASSET_TYPES } from "@karakeep/shared/assetdb";
import type { EnqueueOptions } from "@karakeep/shared/queueing";
import { triggerSearchReindex } from "@karakeep/shared-server";
import logger from "@karakeep/shared/logger";

import { extractTextFromImageBuffer } from "./imageOcr";

/**
 * Run OCR on a link banner image and persist plain text on the bookmark link row.
 */
export async function extractAndPersistLinkBannerOcr(
  jobId: string,
  bookmarkId: string,
  userId: string,
  bannerAssetId: string,
  opts?: { triggerReindex?: EnqueueOptions },
): Promise<boolean> {
  const row = await db.query.assets.findFirst({
    where: eq(assets.id, bannerAssetId),
  });

  if (
    !row ||
    row.bookmarkId !== bookmarkId ||
    row.userId !== userId ||
    row.assetType !== AssetTypes.LINK_BANNER_IMAGE
  ) {
    logger.warn(
      `[linkBannerOcr][${jobId}] Skip OCR: banner asset ${bannerAssetId} is missing or not a link banner for bookmark ${bookmarkId}`,
    );
    return false;
  }

  const link = await db.query.bookmarkLinks.findFirst({
    where: eq(bookmarkLinks.id, bookmarkId),
  });
  if (!link) {
    logger.warn(
      `[linkBannerOcr][${jobId}] No bookmarkLinks row for ${bookmarkId}, skipping banner OCR`,
    );
    return false;
  }

  let buffer: Buffer;
  let contentType: string;
  try {
    const read = await readAsset({
      userId,
      assetId: bannerAssetId,
    });
    buffer = read.asset;
    contentType = read.metadata.contentType ?? "application/octet-stream";
  } catch (e) {
    logger.warn(
      `[linkBannerOcr][${jobId}] Failed to read banner asset ${bannerAssetId}: ${e}`,
    );
    await db
      .update(bookmarkLinks)
      .set({ bannerImageExtractedText: null })
      .where(eq(bookmarkLinks.id, bookmarkId));
    return false;
  }

  if (contentType === ASSET_TYPES.IMAGE_GIF) {
    await db
      .update(bookmarkLinks)
      .set({ bannerImageExtractedText: null })
      .where(eq(bookmarkLinks.id, bookmarkId));
    logger.info(
      `[linkBannerOcr][${jobId}] Skipping OCR for GIF banner on bookmark ${bookmarkId}`,
    );
    if (opts?.triggerReindex) {
      await triggerSearchReindex(bookmarkId, opts.triggerReindex);
    }
    return true;
  }

  logger.info(
    `[linkBannerOcr][${jobId}] Extracting text from link banner for bookmark ${bookmarkId}`,
  );

  const text = await extractTextFromImageBuffer(buffer, contentType);
  const normalized = text?.trim() ?? null;

  await db
    .update(bookmarkLinks)
    .set({
      bannerImageExtractedText:
        normalized && normalized.length > 0 ? normalized : null,
    })
    .where(eq(bookmarkLinks.id, bookmarkId));

  if (normalized && normalized.length > 0) {
    logger.info(
      `[linkBannerOcr][${jobId}] Stored ${normalized.length} characters of banner OCR for bookmark ${bookmarkId}`,
    );
  }

  if (opts?.triggerReindex) {
    await triggerSearchReindex(bookmarkId, opts.triggerReindex);
  }

  return true;
}
