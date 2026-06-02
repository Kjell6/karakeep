"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "karakeep-list-view-options";
const CHANGE_EVENT = "karakeep-list-view-options-change";

interface PerListOptions {
  showFullTitles?: boolean;
}

function readAllOptions(): Record<string, PerListOptions> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PerListOptions>) : {};
  } catch {
    return {};
  }
}

function writeAllOptions(options: Record<string, PerListOptions>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
}

export function useListShowFullTitles(defaultValue: boolean): boolean {
  const pathname = usePathname();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const all = readAllOptions();
    setValue(all[pathname]?.showFullTitles ?? defaultValue);
  }, [pathname, defaultValue]);

  useEffect(() => {
    const handler = () => {
      const all = readAllOptions();
      setValue(all[pathname]?.showFullTitles ?? defaultValue);
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, [pathname, defaultValue]);

  return value;
}

export function useUpdateListShowFullTitles() {
  const pathname = usePathname();
  return useCallback(
    (value: boolean) => {
      const all = readAllOptions();
      all[pathname] = { ...all[pathname], showFullTitles: value };
      writeAllOptions(all);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [pathname],
  );
}
