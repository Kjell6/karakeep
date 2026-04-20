import type { CheerioAPI } from "cheerio";
import type { Rules, RulesOptions } from "metascraper";
import { fetchWithProxy } from "network";
import { z } from "zod";

import logger from "@karakeep/shared/logger";

/**
 * YouTube Shorts pages often respond with a GDPR / cookie consent shell when
 * fetched server-side or via a headless browser, so Readability and generic
 * meta scrapers pick up that boilerplate instead of the video metadata.
 *
 * YouTube's oEmbed endpoint resolves Shorts URLs to the real title, author,
 * and thumbnail (same mechanism as embedding a Short elsewhere).
 *
 * @see https://oembed.com/providers.json (YouTube)
 */

const youtubeOembedResponseSchema = z.object({
  title: z.string().optional(),
  author_name: z.string().optional(),
  author_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
});

type YoutubeOembedData = z.infer<typeof youtubeOembedResponseSchema>;

const OEMBED_ENDPOINT = "https://www.youtube.com/oembed";

const YOUTUBE_SHORTS_CACHE_TTL_MS = 60 * 1000;

interface YoutubeShortsCacheEntry {
  expiresAt: number;
  promise: Promise<YoutubeOembedData | undefined>;
}

const oembedCache = new Map<string, YoutubeShortsCacheEntry>();

const inflightOembed = new Map<
  string,
  Promise<YoutubeOembedData | undefined>
>();

const purgeExpiredCacheEntries = (now: number) => {
  for (const [key, entry] of oembedCache.entries()) {
    if (entry.expiresAt <= now) {
      oembedCache.delete(key);
    }
  }
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function captionToReadableHtml(caption: string): string {
  const escaped = escapeHtml(caption.trim());
  return `<p>${escaped.replace(/\r\n|\r|\n/g, "<br/>")}</p>`;
}

const test = ({ url }: { url: string }): boolean => {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const isYoutubeHost =
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "www.music.youtube.com";
    if (!isYoutubeHost) {
      return false;
    }
    return u.pathname.toLowerCase().includes("/shorts/");
  } catch {
    return false;
  }
};

async function fetchYoutubeShortsOembed(
  videoPageUrl: string,
): Promise<YoutubeOembedData | undefined> {
  const now = Date.now();
  purgeExpiredCacheEntries(now);

  const inFlight = inflightOembed.get(videoPageUrl);
  if (inFlight) {
    return inFlight;
  }

  const cached = oembedCache.get(videoPageUrl);
  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const oembedUrl = `${OEMBED_ENDPOINT}?format=json&url=${encodeURIComponent(videoPageUrl)}`;

  const promise = (async (): Promise<YoutubeOembedData | undefined> => {
    let response: Awaited<ReturnType<typeof fetchWithProxy>>;
    try {
      response = await fetchWithProxy(oembedUrl, {
        headers: {
          accept: "application/json",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
      });
    } catch (error) {
      logger.warn(
        `[MetascraperYouTubeShorts] oEmbed request failed for ${oembedUrl}`,
        error,
      );
      return undefined;
    }

    if (response.status === 400 || response.status === 404) {
      logger.warn(
        `[MetascraperYouTubeShorts] oEmbed returned ${response.status} for ${videoPageUrl}`,
      );
      return undefined;
    }

    if (!response.ok) {
      logger.warn(
        `[MetascraperYouTubeShorts] oEmbed request failed with status ${response.status} for ${videoPageUrl}`,
      );
      return undefined;
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      logger.warn(
        `[MetascraperYouTubeShorts] Failed to parse oEmbed JSON for ${videoPageUrl}`,
        error,
      );
      return undefined;
    }

    const parsed = youtubeOembedResponseSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn(
        "[MetascraperYouTubeShorts] oEmbed schema validation failed",
        parsed.error,
      );
      return undefined;
    }

    if (!parsed.data.title?.trim()) {
      return undefined;
    }

    return parsed.data;
  })();

  inflightOembed.set(videoPageUrl, promise);
  promise
    .then((data) => {
      if (data) {
        oembedCache.set(videoPageUrl, {
          promise: Promise.resolve(data),
          expiresAt: Date.now() + YOUTUBE_SHORTS_CACHE_TTL_MS,
        });
      }
    })
    .finally(() => {
      inflightOembed.delete(videoPageUrl);
    });

  return promise;
}

const metascraperYoutubeShorts = () => {
  const rules: Rules = {
    pkgName: "metascraper-youtube-shorts",
    test,
    title: (async ({ url }: { url: string }) => {
      const data = await fetchYoutubeShortsOembed(url);
      return data?.title?.trim() || undefined;
    }) as unknown as RulesOptions,
    description: (async ({ url }: { url: string }) => {
      const data = await fetchYoutubeShortsOembed(url);
      return data?.title?.trim() || undefined;
    }) as unknown as RulesOptions,
    author: (async ({ url }: { url: string }) => {
      const data = await fetchYoutubeShortsOembed(url);
      return data?.author_name?.trim() || undefined;
    }) as unknown as RulesOptions,
    publisher: (async ({ url }: { url: string }) => {
      const data = await fetchYoutubeShortsOembed(url);
      if (data?.title?.trim()) {
        return "YouTube";
      }
      return undefined;
    }) as unknown as RulesOptions,
    image: (async ({
      url,
      htmlDom: _htmlDom,
    }: {
      url: string;
      htmlDom: CheerioAPI;
    }) => {
      const data = await fetchYoutubeShortsOembed(url);
      const thumb = data?.thumbnail_url?.trim();
      if (thumb) {
        return thumb;
      }
      return undefined;
    }) as unknown as RulesOptions,
    readableContentHtml: (async ({ url }: { url: string }) => {
      const data = await fetchYoutubeShortsOembed(url);
      const caption = data?.title?.trim();
      if (caption) {
        return captionToReadableHtml(caption);
      }
      return undefined;
    }) as unknown as RulesOptions,
  };

  return rules;
};

export default metascraperYoutubeShorts;
