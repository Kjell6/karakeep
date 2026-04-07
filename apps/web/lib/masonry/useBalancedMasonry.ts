"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { distributeIntoShortestColumns } from "./balancedMasonry";

export function useBalancedMasonry<T extends { id: string }>({
  items,
  columnCount,
  estimateHeight,
  itemGapPx = 0,
  leadFirstColumnHeightPx = 0,
}: {
  items: T[];
  columnCount: number;
  estimateHeight: (item: T) => number;
  itemGapPx?: number;
  leadFirstColumnHeightPx?: number;
}) {
  const [measuredHeights, setMeasuredHeights] = useState<
    Record<string, number>
  >({});
  const observersRef = useRef(new Map<string, ResizeObserver>());
  const refCallbacksRef = useRef(
    new Map<string, (node: HTMLDivElement | null) => void>(),
  );

  const updateHeight = useCallback(
    (id: string, node: HTMLDivElement) => {
      const nextHeight = Math.ceil(
        node.getBoundingClientRect().height + itemGapPx,
      );

      setMeasuredHeights((prev) => {
        if (prev[id] === nextHeight) {
          return prev;
        }

        return {
          ...prev,
          [id]: nextHeight,
        };
      });
    },
    [itemGapPx],
  );

  const getItemRef = useCallback(
    (id: string) => {
      const existing = refCallbacksRef.current.get(id);
      if (existing) {
        return existing;
      }

      const callback = (node: HTMLDivElement | null) => {
        const previousObserver = observersRef.current.get(id);
        if (previousObserver) {
          previousObserver.disconnect();
          observersRef.current.delete(id);
        }

        if (!node) {
          return;
        }

        updateHeight(id, node);

        const observer = new ResizeObserver(() => {
          updateHeight(id, node);
        });

        observer.observe(node);
        observersRef.current.set(id, observer);
      };

      refCallbacksRef.current.set(id, callback);
      return callback;
    },
    [updateHeight],
  );

  useEffect(() => {
    return () => {
      for (const observer of observersRef.current.values()) {
        observer.disconnect();
      }
      observersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const validIds = new Set(items.map((item) => item.id));

    setMeasuredHeights((prev) => {
      let changed = false;
      const next: Record<string, number> = {};

      for (const [id, height] of Object.entries(prev)) {
        if (validIds.has(id)) {
          next[id] = height;
        } else {
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [items]);

  const columns = useMemo(
    () =>
      distributeIntoShortestColumns(
        items,
        columnCount,
        (item) => measuredHeights[item.id] ?? estimateHeight(item),
        leadFirstColumnHeightPx > 0 ? { leadFirstColumnHeightPx } : undefined,
      ),
    [
      items,
      columnCount,
      measuredHeights,
      estimateHeight,
      leadFirstColumnHeightPx,
    ],
  );

  return {
    columns,
    getItemRef,
  };
}
