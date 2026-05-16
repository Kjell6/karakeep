import os from "os";
import { createWorker } from "tesseract.js";

import { InferenceClientFactory } from "@karakeep/shared/inference";
import serverConfig from "@karakeep/shared/config";
import logger from "@karakeep/shared/logger";
import { buildOCRPrompt } from "@karakeep/shared/prompts";

export async function readImageTextWithTesseract(
  buffer: Buffer,
): Promise<string | null> {
  if (serverConfig.ocr.langs.length == 1 && serverConfig.ocr.langs[0] == "") {
    return null;
  }
  const worker = await createWorker(serverConfig.ocr.langs, undefined, {
    cachePath: serverConfig.ocr.cacheDir ?? os.tmpdir(),
  });
  try {
    const ret = await worker.recognize(buffer);
    if (ret.data.confidence <= serverConfig.ocr.confidenceThreshold) {
      return null;
    }
    return ret.data.text;
  } finally {
    await worker.terminate();
  }
}

async function readImageTextWithLLM(
  buffer: Buffer,
  contentType: string,
): Promise<string | null> {
  const inferenceClient = InferenceClientFactory.build();
  if (!inferenceClient) {
    logger.warn(
      "[imageOcr] LLM OCR is enabled but no inference client is configured. Falling back to Tesseract.",
    );
    return readImageTextWithTesseract(buffer);
  }

  const base64 = buffer.toString("base64");
  const prompt = buildOCRPrompt();

  const response = await inferenceClient.inferFromImage(
    prompt,
    contentType,
    base64,
    {
      schema: null,
    },
  );

  const extractedText = response.response.trim();
  if (!extractedText) {
    return null;
  }

  return extractedText;
}

/**
 * Extract printable text from an image buffer using configured OCR (Tesseract and/or LLM).
 */
export async function extractTextFromImageBuffer(
  buffer: Buffer,
  contentType: string,
): Promise<string | null> {
  if (serverConfig.ocr.useLLM) {
    try {
      return await readImageTextWithLLM(buffer, contentType);
    } catch (e) {
      logger.error(`[imageOcr] Failed to read image text with LLM: ${e}`);
      return null;
    }
  }

  try {
    return await readImageTextWithTesseract(buffer);
  } catch (e) {
    logger.error(`[imageOcr] Failed to read image text: ${e}`);
    return null;
  }
}
