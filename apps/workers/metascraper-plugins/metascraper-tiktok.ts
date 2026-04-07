import type { CheerioAPI } from "cheerio";
import type { Rules, RulesOptions } from "metascraper";
import { fetchWithProxy } from "network";
import { z } from "zod";

import logger from "@karakeep/shared/logger";

/**
 * TikTok embeds legal / GDPR copy in the HTML and meta tags that generic
 * scrapers (Readability, metascraper-description) pick up as the main text,
 * while og:image still points at the video thumbnail.
 *
 * TikTok's oEmbed endpoint returns the real video caption in the `title`
 * field, which we use for title, description, and stored HTML content.
 *
 * @see https://developers.tiktok.com/doc/embed-videos/
 */

const tiktokOembedResponseSchema = z.object({
  title: z.string().optional(),
  author_name: z.string().optional(),
  author_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
});

type TiktokOembedData = z.infer<typeof tiktokOembedResponseSchema>;

const OEMBED_ENDPOINT = "https://www.tiktok.com/oembed";

const TIKTOK_CACHE_TTL_MS = 60 * 1000;

interface TiktokCacheEntry {
  expiresAt: number;
  promise: Promise<TiktokOembedData | undefined>;
}

const oembedCache = new Map<string, TiktokCacheEntry>();

/** Parallel metascraper rules call fetch concurrently; dedupe the HTTP request. */
const inflightOembed = new Map<string, Promise<TiktokOembedData | undefined>>();

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
    const host = new URL(url).hostname.toLowerCase();
    return host === "tiktok.com" || host.endsWith(".tiktok.com");
  } catch {
    return false;
  }
};

async function fetchTiktokOembed(
  videoPageUrl: string,
): Promise<TiktokOembedData | undefined> {
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

  const oembedUrl = `${OEMBED_ENDPOINT}?url=${encodeURIComponent(videoPageUrl)}`;

  const promise = (async (): Promise<TiktokOembedData | undefined> => {
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
        `[MetascraperTikTok] oEmbed request failed for ${oembedUrl}`,
        error,
      );
      return undefined;
    }

    if (response.status === 400 || response.status === 404) {
      logger.warn(
        `[MetascraperTikTok] oEmbed returned ${response.status} for ${videoPageUrl}`,
      );
      return undefined;
    }

    if (!response.ok) {
      logger.warn(
        `[MetascraperTikTok] oEmbed request failed with status ${response.status} for ${videoPageUrl}`,
      );
      return undefined;
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      logger.warn(
        `[MetascraperTikTok] Failed to parse oEmbed JSON for ${videoPageUrl}`,
        error,
      );
      return undefined;
    }

    const parsed = tiktokOembedResponseSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn(
        "[MetascraperTikTok] oEmbed schema validation failed",
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
          expiresAt: Date.now() + TIKTOK_CACHE_TTL_MS,
        });
      }
    })
    .finally(() => {
      inflightOembed.delete(videoPageUrl);
    });

  return promise;
}

const metascraperTiktok = () => {
  const rules: Rules = {
    pkgName: "metascraper-tiktok",
    test,
    title: (async ({ url }: { url: string }) => {
      const data = await fetchTiktokOembed(url);
      return data?.title?.trim() || undefined;
    }) as unknown as RulesOptions,
    description: (async ({ url }: { url: string }) => {
      const data = await fetchTiktokOembed(url);
      return data?.title?.trim() || undefined;
    }) as unknown as RulesOptions,
    author: (async ({ url }: { url: string }) => {
      const data = await fetchTiktokOembed(url);
      return data?.author_name?.trim() || undefined;
    }) as unknown as RulesOptions,
    publisher: (async ({ url }: { url: string }) => {
      const data = await fetchTiktokOembed(url);
      if (data?.title?.trim()) {
        return "TikTok";
      }
      return undefined;
    }) as unknown as RulesOptions,
    /**
     * When oEmbed succeeds, prefer its thumbnail if present (often same as og:image).
     */
    image: (async ({
      url,
      htmlDom: _htmlDom,
    }: {
      url: string;
      htmlDom: CheerioAPI;
    }) => {
      const data = await fetchTiktokOembed(url);
      const thumb = data?.thumbnail_url?.trim();
      if (thumb) {
        return thumb;
      }
      return undefined;
    }) as unknown as RulesOptions,
    readableContentHtml: (async ({ url }: { url: string }) => {
      const data = await fetchTiktokOembed(url);
      const caption = data?.title?.trim();
      if (caption) {
        return captionToReadableHtml(caption);
      }
      return undefined;
    }) as unknown as RulesOptions,
  };

  return rules;
};

export default metascraperTiktok;
