import type { Tiktoken } from "js-tiktoken";

import type { ZTagStyle } from "./types/users";
import {
  getCuratedTagsPrompt,
  getTagStylePrompt,
  getPotentialRelevantTagsPrompt,
} from "./utils/tag";

let encoding: Tiktoken | null = null;

/**
 * Lazy load the encoding to avoid loading the tiktoken data into memory
 * until it's actually needed
 */
async function getEncodingInstance(): Promise<Tiktoken> {
  if (!encoding) {
    // Dynamic import to lazy load the tiktoken module
    const { getEncoding } = await import("js-tiktoken");
    encoding = getEncoding("o200k_base");
  }
  return encoding;
}

/**
 * Remove duplicate whitespaces to avoid tokenization issues
 */
function preprocessContent(content: string) {
  return content.replace(/(\s){10,}/g, "$1");
}

async function calculateNumTokens(text: string): Promise<number> {
  const enc = await getEncodingInstance();
  return enc.encode(text).length;
}

async function truncateContent(
  content: string,
  length: number,
): Promise<string> {
  const enc = await getEncodingInstance();
  const tokens = enc.encode(content);
  if (tokens.length <= length) {
    return content;
  }
  const truncatedTokens = tokens.slice(0, length);
  return enc.decode(truncatedTokens);
}

export function buildImagePrompt(
  lang: string,
  customPrompts: string[],
  tagStyle: ZTagStyle,
  curatedTags?: string[],
  potentialRelevantTags?: string[],
) {
  const tagStyleInstruction = getTagStylePrompt(tagStyle);
  const curatedInstruction = getCuratedTagsPrompt(curatedTags);
  const potentialRelevantTagsInstruction = getPotentialRelevantTagsPrompt(
    potentialRelevantTags,
  );

  return `
You are an expert whose responsibility is to help with automatic tagging for a read-it-later/bookmarking app.
Analyze the attached image and suggest relevant tags that describe its key themes, topics, and main ideas. The rules are:
- Prefer concrete, durable tags: named products, technologies, projects, standards, subject areas, and important concepts.
- Include only retrieval-worthy tags that describe the saved item's intended content, not incidental UI or page chrome.
- The tags must be in ${lang}.
- Keep each tag short: ideally 1-3 words. Do not include parenthetical explanations, comma-separated examples, or long descriptive phrases inside a tag.
- Prefer durable subject tags over one-off facts, examples, source organizations, page sections, or implementation details unless they are central to the whole item.
- Do NOT generate any tags if the image is mainly:
    - A screenshot of an error, unavailable, forbidden, unauthorized, not found, DNS, timeout, or service failure page
    - A Cloudflare/security check, CAPTCHA, bot check, anti-DDoS challenge, browser verification, or access-blocked page
    - Boilerplate content such as cookie consent, login walls, GDPR notices, navigation menus, or a blank/empty image
  In these cases, return an empty tags array. Do not tag the failure/interstitial page itself.
- Aim for 10-15 tags.
- If there are no good tags, leave the array empty.
${curatedInstruction}
${potentialRelevantTagsInstruction}
${tagStyleInstruction}
${customPrompts && customPrompts.map((p) => `- ${p}`).join("\n")}
You must respond in valid JSON with the key "tags" and the value is list of tags. Don't wrap the response in a markdown code.`;
}

/**
 * Construct tagging prompt for text content
 */
export function constructTextTaggingPrompt(
  lang: string,
  customPrompts: string[],
  content: string,
  tagStyle: ZTagStyle,
  curatedTags?: string[],
  potentialRelevantTags?: string[],
): string {
  const tagStyleInstruction = getTagStylePrompt(tagStyle);
  const curatedInstruction = getCuratedTagsPrompt(curatedTags);
  const potentialRelevantTagsInstruction = getPotentialRelevantTagsPrompt(
    potentialRelevantTags,
  );

  return `
You are an expert whose responsibility is to help with automatic tagging for a read-it-later/bookmarking app.
Analyze the TEXT_CONTENT below and suggest relevant tags that describe its key themes, topics, and main ideas. The rules are:
- Prefer concrete, durable tags: named products, technologies, projects, standards, subject areas, and important concepts.
- Include only retrieval-worthy tags that describe the saved item's intended content, not incidental page chrome.
- The tags must be in ${lang}.
- Keep each tag short: ideally 1-3 words. Do not include parenthetical explanations, comma-separated examples, or long descriptive phrases inside a tag.
- Prefer durable subject tags over one-off facts, examples, source organizations, page sections, or implementation details unless they are central to the whole item.
- Ignore any part of the content that is:
    - An error, unavailable, forbidden, unauthorized, not found, DNS, timeout, or service failure page
    - A Cloudflare/security check, CAPTCHA, bot check, anti-DDoS challenge, browser verification, or access-blocked page
    - Boilerplate content such as cookie consent, login walls, GDPR notices, navigation menus, or empty pages
  If useful metadata or other legitimate content remains, generate tags using only that information. Otherwise, return an empty tags array. Never tag the failure, interstitial, or boilerplate content itself.
- Aim for around 10 tags.
- If there are no good tags, leave the array empty.
${curatedInstruction}
${potentialRelevantTagsInstruction}
${tagStyleInstruction}
${customPrompts && customPrompts.map((p) => `- ${p}`).join("\n")}

<TEXT_CONTENT>
${content}
</TEXT_CONTENT>
You must respond in JSON with the key "tags" and the value is an array of string tags.`;
}

/**
 * Construct summary prompt
 */
export function constructSummaryPrompt(
  lang: string,
  customPrompts: string[],
  content: string,
): string {
  return `
Summarize the following content responding ONLY with the summary. You MUST follow the following rules:
- Summary must be in 3-4 sentences.
- The summary must be in ${lang}.
${customPrompts && customPrompts.map((p) => `- ${p}`).join("\n")}
    ${content}`;
}

/**
 * Build text tagging prompt without truncation (for previews/UI)
 */
export function buildTextPromptUntruncated(
  lang: string,
  customPrompts: string[],
  content: string,
  tagStyle: ZTagStyle,
  curatedTags?: string[],
): string {
  return constructTextTaggingPrompt(
    lang,
    customPrompts,
    preprocessContent(content),
    tagStyle,
    curatedTags,
  );
}

/**
 * Build summary prompt without truncation (for previews/UI)
 */
export function buildSummaryPromptUntruncated(
  lang: string,
  customPrompts: string[],
  content: string,
): string {
  return constructSummaryPrompt(
    lang,
    customPrompts,
    preprocessContent(content),
  );
}

export async function buildTextPrompt(
  lang: string,
  customPrompts: string[],
  content: string,
  contextLength: number,
  tagStyle: ZTagStyle,
): Promise<string> {
  content = preprocessContent(content);
  const promptTemplate = constructTextTaggingPrompt(
    lang,
    customPrompts,
    "",
    tagStyle,
  );
  const promptSize = await calculateNumTokens(promptTemplate);
  const truncatedContent = await truncateContent(
    content,
    contextLength - promptSize,
  );
  return constructTextTaggingPrompt(
    lang,
    customPrompts,
    truncatedContent,
    tagStyle,
  );
}

function constructLinkBannerPrompt(
  lang: string,
  customPrompts: string[],
  metadata: string,
  content: string,
  tagStyle: ZTagStyle,
) {
  const tagStyleInstruction = getTagStylePrompt(tagStyle);

  return `
You are an expert whose responsibility is to help with automatic tagging for a read-it-later/bookmarking app.
Analyze the TEXT_CONTENT below and the attached banner image to suggest relevant tags that describe the bookmark's key themes, topics, and main ideas. The rules are:
- Aim for a variety of tags, including broad categories, specific keywords, and potential sub-genres.
- The tags must be in ${lang}.
- If the tag is not generic enough, don't include it.
- Do NOT generate tags related to:
    - An error page (404, 403, blocked, not found, dns errors)
    - Boilerplate content (cookie consent, login walls, GDPR notices, Data Protection)
- Aim for around 10 tags.
- If there are no good tags, leave the array empty.
${tagStyleInstruction}
${customPrompts && customPrompts.map((p) => `- ${p}`).join("\n")}

<BOOKMARK_METADATA>
${metadata}
</BOOKMARK_METADATA>

<TEXT_CONTENT>
${content}
</TEXT_CONTENT>
You must respond in JSON with the key "tags" and the value is an array of string tags.`;
}

export async function buildLinkBannerPrompt(
  lang: string,
  customPrompts: string[],
  metadata: string,
  content: string,
  contextLength: number,
  tagStyle: ZTagStyle,
) {
  const processedContent = preprocessContent(content);
  const promptTemplate = constructLinkBannerPrompt(
    lang,
    customPrompts,
    metadata,
    "",
    tagStyle,
  );
  const promptSize = await calculateNumTokens(promptTemplate);
  const truncatedContent = await truncateContent(
    processedContent,
    contextLength - promptSize,
  );
  return constructLinkBannerPrompt(
    lang,
    customPrompts,
    metadata,
    truncatedContent,
    tagStyle,
  );
}

export async function buildSummaryPrompt(
  lang: string,
  customPrompts: string[],
  content: string,
  contextLength: number,
): Promise<string> {
  content = preprocessContent(content);
  const promptTemplate = constructSummaryPrompt(lang, customPrompts, "");
  const promptSize = await calculateNumTokens(promptTemplate);
  const truncatedContent = await truncateContent(
    content,
    contextLength - promptSize,
  );
  return constructSummaryPrompt(lang, customPrompts, truncatedContent);
}

/**
 * Build OCR prompt for extracting text from images using LLM
 */
export function buildOCRPrompt(): string {
  return `You are an OCR (Optical Character Recognition) expert. Your task is to extract ALL text from this image.

Rules:
- Extract every piece of text visible in the image, including titles, body text, captions, labels, watermarks, and any other textual content.
- Preserve the original structure and formatting as much as possible (e.g., paragraphs, lists, headings).
- If text appears in multiple columns, read from left to right, top to bottom.
- If text is partially obscured or unclear, make your best attempt and indicate uncertainty with [unclear] if needed.
- Do not add any commentary, explanations, or descriptions of non-text elements.
- If there is no text in the image, respond with an empty string.
- Output ONLY the extracted text, nothing else.`;
}
