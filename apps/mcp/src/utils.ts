import { CallToolResult } from "@modelcontextprotocol/sdk/types";

import { KarakeepAPISchemas } from "@karakeep/sdk";

type McpToolError =
  | string
  | { code?: string; message?: string }
  | { error?: string; message?: string }
  | undefined;

export function toMcpToolError(error: McpToolError): CallToolResult {
  const objectError =
    typeof error === "object" && error !== null ? error : undefined;
  const errorMessage =
    objectError && "error" in objectError
      ? (objectError as { error?: string }).error
      : undefined;
  const text =
    typeof error === "string"
      ? error
      : objectError?.message ?? errorMessage ?? JSON.stringify(error ?? null);

  return {
    isError: true,
    content: [
      {
        type: "text",
        text: text || "Something went wrong",
      },
    ],
  };
}

export function compactBookmark(
  bookmark: KarakeepAPISchemas["Bookmark"],
): string {
  let content: string;
  if (bookmark.content.type === "link") {
    content = `Bookmark type: link
Bookmarked URL: ${bookmark.content.url}
description: ${bookmark.content.description ?? ""}
author: ${bookmark.content.author ?? ""}
publisher: ${bookmark.content.publisher ?? ""}`;
  } else if (bookmark.content.type === "text") {
    content = `Bookmark type: text
  Source URL: ${bookmark.content.sourceUrl ?? ""}`;
  } else if (bookmark.content.type === "asset") {
    content = `Bookmark type: media
Asset ID: ${bookmark.content.assetId}
Asset type: ${bookmark.content.assetType}
Source URL: ${bookmark.content.sourceUrl ?? ""}`;
  } else {
    content = `Bookmark type: unknown`;
  }

  return `Bookmark ID: ${bookmark.id}
  Created at: ${bookmark.createdAt}
  Title: ${
    bookmark.title
      ? bookmark.title
      : ((bookmark.content.type === "link" ? bookmark.content.title : "") ?? "")
  }
  Summary: ${bookmark.summary ?? ""}
  Note: ${bookmark.note ?? ""}
  ${content}
  Tags: ${bookmark.tags.map((t) => t.name).join(", ")}`;
}
