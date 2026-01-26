import { describe, expect, it } from "vitest";

import { buildLinkBannerPrompt } from "./prompts";
import type { ZTagStyle } from "./types/users";

describe("buildLinkBannerPrompt", () => {
  it("includes metadata and text sections", async () => {
    const tagStyle: ZTagStyle = "as-generated";
    const prompt = await buildLinkBannerPrompt(
      "de",
      ["Focus on tone", "Include audience hints"],
      "URL: https://example.com\nTitle: Example Title\nDescription: Short desc",
      "This is some sample content that should appear in the prompt.",
      1000,
      tagStyle,
    );

    expect(prompt).toContain("<BOOKMARK_METADATA>");
    expect(prompt).toContain("URL: https://example.com");
    expect(prompt).toContain("<TEXT_CONTENT>");
    expect(prompt).toContain("This is some sample content");
    expect(prompt).toContain('"tags"');
  });
});
