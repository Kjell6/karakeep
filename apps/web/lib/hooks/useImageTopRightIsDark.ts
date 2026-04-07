import type { RefObject } from "react";
import { useEffect, useState } from "react";

/**
 * Maps a point from container coordinates (object-fit: cover) to natural image
 * pixel coordinates.
 */
function getObjectCoverMapping(
  containerW: number,
  containerH: number,
  nw: number,
  nh: number,
) {
  const scale = Math.max(containerW / nw, containerH / nh);
  const dispW = nw * scale;
  const dispH = nh * scale;
  const left = (containerW - dispW) / 2;
  const top = (containerH - dispH) / 2;
  return { scale, left, top };
}

/**
 * Average relative luminance (0–1) of the top-right region of the *visible*
 * image (respecting object-fit: cover). Returns null if sampling is not possible.
 */
export function sampleTopRightRegionLuminance(
  img: HTMLImageElement,
  sampleSizePx = 44,
): number | null {
  const rect = img.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh || W < 1 || H < 1) {
    return null;
  }

  const { scale, left, top } = getObjectCoverMapping(W, H, nw, nh);

  const sx = Math.max(0, W - sampleSizePx);
  const sy = 0;
  const sw = Math.min(sampleSizePx, W);
  const sh = Math.min(sampleSizePx, H);

  const srcX = (sx - left) / scale;
  const srcY = (sy - top) / scale;
  const srcW = sw / scale;
  const srcH = sh / scale;

  const clampedSrcX = Math.max(0, Math.min(nw - 0.001, srcX));
  const clampedSrcY = Math.max(0, Math.min(nh - 0.001, srcY));
  const clampedSrcW = Math.min(nw - clampedSrcX, Math.max(0.001, srcW));
  const clampedSrcH = Math.min(nh - clampedSrcY, Math.max(0.001, srcH));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return null;
  }

  canvas.width = Math.max(1, Math.ceil(sw));
  canvas.height = Math.max(1, Math.ceil(sh));

  try {
    ctx.drawImage(
      img,
      clampedSrcX,
      clampedSrcY,
      clampedSrcW,
      clampedSrcH,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  } catch {
    return null;
  }

  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return null;
  }

  const pixels = data.data;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (a < 8) {
      continue;
    }
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    sum += (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    count += 1;
  }

  if (count === 0) {
    return null;
  }
  return sum / count;
}

/**
 * `true` = top-right image region is dark → use light foreground.
 * `false` = region is light → use dark foreground.
 * `null` = unknown (no img, pending, or CORS-tainted canvas).
 */
export function useImageTopRightIsDark(
  containerRef: RefObject<HTMLElement | null>,
  deps: unknown[],
): boolean | null {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let observedImg: HTMLImageElement | null = null;

    const run = () => {
      const img = container.querySelector("img");
      if (!img || !img.naturalWidth) {
        setIsDark(null);
        return;
      }
      const lum = sampleTopRightRegionLuminance(img);
      if (lum === null) {
        setIsDark(null);
        return;
      }
      setIsDark(lum < 0.45);
    };

    const syncImgListener = () => {
      const img = container.querySelector("img");
      if (img === observedImg) {
        return;
      }
      if (observedImg) {
        observedImg.removeEventListener("load", run);
      }
      observedImg = img;
      if (img) {
        img.addEventListener("load", run);
      }
    };

    const schedule = () => {
      syncImgListener();
      run();
    };

    schedule();

    const ro = new ResizeObserver(schedule);
    ro.observe(container);

    const mo = new MutationObserver(schedule);
    mo.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src"],
    });

    return () => {
      if (observedImg) {
        observedImg.removeEventListener("load", run);
      }
      ro.disconnect();
      mo.disconnect();
    };
  }, deps);

  return isDark;
}
