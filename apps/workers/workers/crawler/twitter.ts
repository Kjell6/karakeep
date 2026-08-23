// Twitter/X support via the fxtwitter API. Instead of launching a browser
// (which gets blocked by X), we call api.fxtwitter.com to receive the tweet
// text, author, media and stats, and synthesize an HTML document that feeds
// the regular metadata extraction pipeline.
import { getTracer, withSpan } from "@karakeep/shared-server";
import logger from "@karakeep/shared/logger";
import {
  collectTweetPhotoUrls,
  parseTwitterUrl,
} from "@karakeep/shared/utils/twitter";

import { fetchWithProxy } from "network";
import type { CrawlPageResult } from "./crawlPage";

export { parseTwitterUrl };

const tracer = getTracer("@karakeep/workers");

interface FxTwitterResponse {
  code: number;
  tweet?: {
    url: string;
    text: string;
    author: {
      name: string;
      screen_name: string;
      avatar_url?: string;
    };
    media?: {
      photos?: { url: string; altText?: string }[];
      videos?: { thumbnail_url: string; url: string }[];
    };
    likes?: number;
    retweets?: number;
    replies?: number;
  };
}

/** Minimal escaping for synthetic crawl HTML (<title>/<description> text nodes). */
function escapeHtmlTextForSyntheticDocument(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttributeValue(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function twitterCrawlPage(
  jobId: string,
  url: string,
  abortSignal: AbortSignal,
): Promise<CrawlPageResult> {
  return await withSpan(
    tracer,
    "crawlerWorker.twitterCrawlPage",
    { attributes: { "bookmark.url": url, "job.id": jobId } },
    async () => {
      const parsed = parseTwitterUrl(url);
      if (!parsed.isTwitter || !parsed.screenName || !parsed.statusId) {
        throw new Error(`Invalid Twitter URL: ${url}`);
      }

      const apiUrl = `https://api.fxtwitter.com/${parsed.screenName}/status/${parsed.statusId}`;
      logger.info(
        `[Crawler][${jobId}] Detected Twitter URL. Calling fxtwitter API: ${apiUrl}`,
      );

      const response = await fetchWithProxy(apiUrl, {
        signal: AbortSignal.any([AbortSignal.timeout(10000), abortSignal]),
      });

      if (!response.ok) {
        const status = response.status;
        const text = await response.text().catch(() => "unknown");
        logger.error(
          `[Crawler][${jobId}] fxtwitter API returned error ${status}: ${text}`,
        );
        throw new Error(`fxtwitter API error: ${status}`);
      }

      const data = (await response.json()) as FxTwitterResponse;

      if (!data.tweet) {
        throw new Error(`fxtwitter API returned no tweet data for ${url}`);
      }

      const { tweet } = data;
      const authorName = tweet.author?.name?.trim() ?? "";
      const screenName = tweet.author?.screen_name?.trim() ?? "";
      const authorLine =
        authorName && screenName
          ? `${authorName} (@${screenName})`
          : authorName || (screenName ? `@${screenName}` : "");

      const tweetText = (tweet.text ?? "").trim();
      const tweetPhotoUrls = collectTweetPhotoUrls(tweet.media);
      const ogImageUrl = tweetPhotoUrls[0];

      // Title = tweet body (what users expect in bookmark lists); description = author when it adds context.
      const titlePlain = tweetText || authorLine || "Tweet";
      const safeTitle = escapeHtmlTextForSyntheticDocument(titlePlain);

      const descPlain =
        authorLine.length > 0 && authorLine !== titlePlain ? authorLine : "";
      const safeDescription = descPlain
        ? escapeHtmlTextForSyntheticDocument(descPlain)
        : "";
      const descriptionBlock = safeDescription
        ? `\n<description>${safeDescription}</description>`
        : "";

      const ogImageTag = ogImageUrl
        ? `\n<meta property="og:image" content="${escapeHtmlAttributeValue(ogImageUrl)}">`
        : "";

      // Build HTML content similar to what browserlessCrawlPage returns.
      // Include stats as they may be useful for AI tagging.
      const htmlContent = `<title>${safeTitle}</title>${descriptionBlock}${ogImageTag}${tweet.likes !== undefined || tweet.retweets !== undefined ? `\n<meta name="twitter:data" content="likes:${tweet.likes ?? 0}, retweets:${tweet.retweets ?? 0}, replies:${tweet.replies ?? 0}">` : ""}`;

      logger.info(
        `[Crawler][${jobId}] Successfully fetched tweet via fxtwitter: @${tweet.author?.screen_name} (${tweet.likes ?? 0} likes)`,
      );

      return {
        htmlContent,
        statusCode: 200,
        screenshot: undefined,
        pdf: undefined,
        url: tweet.url ?? url,
        tweetPhotoUrls,
      };
    },
  );
}
