"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAnyColumnSentinelInView(rootMargin: string) {
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodesRef = useRef(new Map<number, HTMLDivElement>());
  const visibilityRef = useRef(new Map<number, boolean>());
  const refCallbacksRef = useRef(
    new Map<number, (node: HTMLDivElement | null) => void>(),
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number.parseInt(
            (entry.target as HTMLElement).dataset.columnSentinelIndex ?? "-1",
            10,
          );

          if (index >= 0) {
            visibilityRef.current.set(index, entry.isIntersecting);
          }
        }

        setInView(Array.from(visibilityRef.current.values()).some(Boolean));
      },
      { rootMargin },
    );

    observerRef.current = observer;

    for (const node of nodesRef.current.values()) {
      observer.observe(node);
    }

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [rootMargin]);

  const getSentinelRef = useCallback((index: number) => {
    const existing = refCallbacksRef.current.get(index);
    if (existing) {
      return existing;
    }

    const callback = (node: HTMLDivElement | null) => {
      const previousNode = nodesRef.current.get(index);
      if (previousNode && observerRef.current) {
        observerRef.current.unobserve(previousNode);
      }

      if (!node) {
        nodesRef.current.delete(index);
        visibilityRef.current.delete(index);
        setInView(Array.from(visibilityRef.current.values()).some(Boolean));
        return;
      }

      node.dataset.columnSentinelIndex = String(index);
      nodesRef.current.set(index, node);
      visibilityRef.current.set(index, false);
      observerRef.current?.observe(node);
    };

    refCallbacksRef.current.set(index, callback);
    return callback;
  }, []);

  return {
    inView,
    getSentinelRef,
  };
}
