"use client";

import { useEffect, useState } from "react";

import type { MasonryBreakpointCols } from "./balancedMasonry";
import { getMasonryColumnCountForWindowWidth } from "./balancedMasonry";

export function useMasonryColumnCount(
  breakpointCols: MasonryBreakpointCols,
): number {
  const [count, setCount] = useState(breakpointCols.default);

  useEffect(() => {
    const update = () => {
      const w =
        typeof window !== "undefined" ? window.innerWidth : Number.POSITIVE_INFINITY;
      setCount(getMasonryColumnCountForWindowWidth(breakpointCols, w));
    };

    update();

    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, [breakpointCols]);

  return count;
}
