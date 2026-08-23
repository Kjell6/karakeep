const TWITTER_STATUS_URL_PATTERN =
  /^(?:https?:\/\/)?(?:mobile\.)?(?:twitter\.com|x\.com)\/(\w+)\/status(?:es)?\/(\d+)/i;

export function parseTwitterUrl(url: string): {
  isTwitter: boolean;
  screenName?: string;
  statusId?: string;
} {
  const match = url.match(TWITTER_STATUS_URL_PATTERN);
  if (match) {
    return { isTwitter: true, screenName: match[1], statusId: match[2] };
  }
  return { isTwitter: false };
}

export function isTwitterStatusUrl(url: string): boolean {
  return parseTwitterUrl(url).isTwitter;
}

export function collectTweetPhotoUrls(
  media?: {
    photos?: { url?: string | null }[] | null;
    videos?: { thumbnail_url?: string | null }[] | null;
  } | null,
): string[] {
  const photos = (media?.photos ?? [])
    .map((photo) => photo.url?.trim())
    .filter((url): url is string => !!url);
  if (photos.length > 0) {
    return [...new Set(photos)];
  }
  const thumbs = (media?.videos ?? [])
    .map((video) => video.thumbnail_url?.trim())
    .filter((url): url is string => !!url);
  return [...new Set(thumbs)];
}
