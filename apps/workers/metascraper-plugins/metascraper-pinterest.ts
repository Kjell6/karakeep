import type { CheerioAPI } from "cheerio";
import type { Rules, RulesOptions } from "metascraper";
import { fetchWithProxy } from "network";
import { z } from "zod";

import logger from "@karakeep/shared/logger";

/**
 * Pinterest pages expose a lot of shell UI copy (search autocomplete hints, etc.)
 * that Readability and generic meta pick up as the "article" body.
 *
 * Official oEmbed returns the pin title/description in `title` plus author and thumbnail.
 *
 * @see https://www.pinterest.com/oembed.json (standard oEmbed `url` query param)
 */

const pinterestOembedResponseSchema = z.object({
  title: z.string().optional(),
  author_name: z.string().optional(),
  author_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
  description: z.string().optional(),
});

type PinterestOembedData = z.infer<typeof pinterestOembedResponseSchema>;

const OEMBED_ENDPOINT = "https://www.pinterest.com/oembed.json";

const PINTEREST_CACHE_TTL_MS = 60 * 1000;

interface PinterestCacheEntry {
  expiresAt: number;
  promise: Promise<PinterestOembedData | undefined>;
}

const oembedCache = new Map<string, PinterestCacheEntry>();

const inflightOembed = new Map<
  string,
  Promise<PinterestOembedData | undefined>
>();

const purgeExpiredCacheEntries = (now: number) => {
  for (const [key, entry] of oembedCache.entries()) {
    if (entry.expiresAt <= now) {
      oembedCache.delete(key);
    }
  }
};

/** UI copy that leaks into scraped text when oEmbed is unavailable or wrong. */
function isPinterestUiBoilerplate(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) {
    return true;
  }
  if (
    t.includes("when autocomplete results are available") &&
    t.includes("up and down arrows")
  ) {
    return true;
  }
  if (t.includes("touch device users, explore by touch")) {
    return true;
  }
  if (t.includes("swipe gestures")) {
    return true;
  }
  return false;
}

function pickBestText(data: PinterestOembedData): string | undefined {
  const candidates = [data.title, data.description]
    .map((s) => s?.trim())
    .filter((s): s is string => !!s && !isPinterestUiBoilerplate(s));
  const longest = candidates.sort((a, b) => b.length - a.length)[0];
  return longest;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToReadableHtml(text: string): string {
  const escaped = escapeHtml(text.trim());
  return `<p>${escaped.replace(/\r\n|\r|\n/g, "<br/>")}</p>`;
}

function metaDescriptionFromDom(htmlDom: CheerioAPI): string | undefined {
  const og = htmlDom('meta[property="og:description"]').attr("content");
  const name = htmlDom('meta[name="description"]').attr("content");
  for (const raw of [og, name]) {
    if (!raw) {
      continue;
    }
    const t = raw.trim();
    if (t && !isPinterestUiBoilerplate(t)) {
      return t;
    }
  }
  return undefined;
}

function metaTitleFromDom(htmlDom: CheerioAPI): string | undefined {
  const og = htmlDom('meta[property="og:title"]').attr("content");
  if (og) {
    const t = og.trim();
    if (t && !isPinterestUiBoilerplate(t)) {
      return t;
    }
  }
  return undefined;
}

const test = ({ url }: { url: string }): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "pinterest.com" ||
      host.endsWith(".pinterest.com") ||
      host === "pin.it" ||
      host.endsWith(".pin.it")
    );
  } catch {
    return false;
  }
};

async function fetchPinterestOembed(
  pageUrl: string,
): Promise<PinterestOembedData | undefined> {
  const now = Date.now();
  purgeExpiredCacheEntries(now);

  const inFlight = inflightOembed.get(pageUrl);
  if (inFlight) {
    return inFlight;
  }

  const cached = oembedCache.get(pageUrl);
  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const oembedUrl = `${OEMBED_ENDPOINT}?url=${encodeURIComponent(pageUrl)}`;

  const promise = (async (): Promise<PinterestOembedData | undefined> => {
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
        `[MetascraperPinterest] oEmbed request failed for ${oembedUrl}`,
        error,
      );
      return undefined;
    }

    if (response.status === 400 || response.status === 404) {
      logger.warn(
        `[MetascraperPinterest] oEmbed returned ${response.status} for ${pageUrl}`,
      );
      return undefined;
    }

    if (!response.ok) {
      logger.warn(
        `[MetascraperPinterest] oEmbed request failed with status ${response.status} for ${pageUrl}`,
      );
      return undefined;
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      logger.warn(
        `[MetascraperPinterest] Failed to parse oEmbed JSON for ${pageUrl}`,
        error,
      );
      return undefined;
    }

    const parsed = pinterestOembedResponseSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn(
        "[MetascraperPinterest] oEmbed schema validation failed",
        parsed.error,
      );
      return undefined;
    }

    if (!pickBestText(parsed.data)) {
      return undefined;
    }

    return parsed.data;
  })();

  inflightOembed.set(pageUrl, promise);
  promise
    .then((data) => {
      if (data) {
        oembedCache.set(pageUrl, {
          promise: Promise.resolve(data),
          expiresAt: Date.now() + PINTEREST_CACHE_TTL_MS,
        });
      }
    })
    .finally(() => {
      inflightOembed.delete(pageUrl);
    });

  return promise;
}

const metascraperPinterest = () => {
  const rules: Rules = {
    pkgName: "metascraper-pinterest",
    test,
    title: (async ({ url, htmlDom }: { url: string; htmlDom: CheerioAPI }) => {
      const data = await fetchPinterestOembed(url);
      const fromOembed = data ? pickBestText(data) : undefined;
      if (fromOembed) {
        return fromOembed;
      }
      return metaTitleFromDom(htmlDom) ?? metaDescriptionFromDom(htmlDom);
    }) as unknown as RulesOptions,
    description: (async ({
      url,
      htmlDom,
    }: {
      url: string;
      htmlDom: CheerioAPI;
    }) => {
      const data = await fetchPinterestOembed(url);
      const fromOembed = data ? pickBestText(data) : undefined;
      if (fromOembed) {
        return fromOembed;
      }
      return metaDescriptionFromDom(htmlDom) ?? metaTitleFromDom(htmlDom);
    }) as unknown as RulesOptions,
    author: (async ({ url }: { url: string }) => {
      const data = await fetchPinterestOembed(url);
      return data?.author_name?.trim() || undefined;
    }) as unknown as RulesOptions,
    publisher: (async ({ url }: { url: string }) => {
      const data = await fetchPinterestOembed(url);
      if (data && pickBestText(data)) {
        return "Pinterest";
      }
      return undefined;
    }) as unknown as RulesOptions,
    image: (async ({ url, htmlDom }: { url: string; htmlDom: CheerioAPI }) => {
      const data = await fetchPinterestOembed(url);
      const thumb = data?.thumbnail_url?.trim();
      if (thumb) {
        return thumb;
      }
      const og = htmlDom('meta[property="og:image"]').attr("content");
      return og?.trim() || undefined;
    }) as unknown as RulesOptions,
    readableContentHtml: (async ({
      url,
      htmlDom,
    }: {
      url: string;
      htmlDom: CheerioAPI;
    }) => {
      const data = await fetchPinterestOembed(url);
      let text = data ? pickBestText(data) : undefined;
      if (!text) {
        text = metaDescriptionFromDom(htmlDom) ?? metaTitleFromDom(htmlDom);
      }
      if (text) {
        return textToReadableHtml(text);
      }
      return undefined;
    }) as unknown as RulesOptions,
  };

  return rules;
};

export default metascraperPinterest;
