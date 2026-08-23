import { describe, expect, it } from "vitest";

import {
  collectTweetPhotoUrls,
  isTwitterStatusUrl,
  parseTwitterUrl,
} from "./twitter";

describe("parseTwitterUrl", () => {
  it("parses x.com and twitter.com status URLs", () => {
    expect(parseTwitterUrl("https://x.com/jack/status/20")).toEqual({
      isTwitter: true,
      screenName: "jack",
      statusId: "20",
    });
    expect(
      parseTwitterUrl("https://mobile.twitter.com/jack/statuses/20"),
    ).toEqual({
      isTwitter: true,
      screenName: "jack",
      statusId: "20",
    });
  });

  it("rejects non-status URLs", () => {
    expect(parseTwitterUrl("https://x.com/jack")).toEqual({ isTwitter: false });
    expect(isTwitterStatusUrl("https://example.com/status/20")).toBe(false);
  });
});

describe("collectTweetPhotoUrls", () => {
  it("returns all photo URLs and dedupes", () => {
    expect(
      collectTweetPhotoUrls({
        photos: [
          { url: "https://pbs.twimg.com/a.jpg" },
          { url: "https://pbs.twimg.com/b.jpg" },
          { url: "https://pbs.twimg.com/a.jpg" },
        ],
      }),
    ).toEqual(["https://pbs.twimg.com/a.jpg", "https://pbs.twimg.com/b.jpg"]);
  });

  it("falls back to video thumbnails when there are no photos", () => {
    expect(
      collectTweetPhotoUrls({
        photos: [],
        videos: [{ thumbnail_url: "https://pbs.twimg.com/thumb.jpg" }],
      }),
    ).toEqual(["https://pbs.twimg.com/thumb.jpg"]);
  });
});
