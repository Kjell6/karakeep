import { describe, expect, it } from "vitest";

import type { ZBookmarkedLink } from "../types/bookmarks";
import { BookmarkTypes } from "../types/bookmarks";
import { getTweetPhotoDisplayUrls } from "./bookmarkUtils";

function link(overrides: Partial<ZBookmarkedLink> = {}): ZBookmarkedLink {
  return {
    type: BookmarkTypes.LINK,
    url: "https://x.com/jack/status/20",
    ...overrides,
  };
}

describe("getTweetPhotoDisplayUrls", () => {
  it("returns all tweet photos in order", () => {
    expect(
      getTweetPhotoDisplayUrls(
        link({
          tweetPhotoUrls: [
            "https://pbs.twimg.com/a.jpg",
            "https://pbs.twimg.com/b.jpg",
          ],
        }),
      ),
    ).toEqual(["https://pbs.twimg.com/a.jpg", "https://pbs.twimg.com/b.jpg"]);
  });

  it("falls back to the remote banner when no tweet photos exist", () => {
    expect(
      getTweetPhotoDisplayUrls(
        link({ imageUrl: "https://pbs.twimg.com/banner.jpg" }),
      ),
    ).toEqual(["https://pbs.twimg.com/banner.jpg"]);
  });

  it("uses the local banner asset for the first photo", () => {
    expect(
      getTweetPhotoDisplayUrls(
        link({
          imageAssetId: "asset-1",
          tweetPhotoUrls: [
            "https://pbs.twimg.com/a.jpg",
            "https://pbs.twimg.com/b.jpg",
          ],
        }),
      ),
    ).toEqual(["/api/assets/asset-1", "https://pbs.twimg.com/b.jpg"]);
  });
});
