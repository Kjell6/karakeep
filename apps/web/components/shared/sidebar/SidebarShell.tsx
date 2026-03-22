"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "karakeep:sidebarCollapsed";

export type SidebarShellContextValue = {
  collapsed: boolean;
  hydrated: boolean;
  peek: boolean;
  setPeek: (next: boolean) => void;
  persistCollapsed: (next: boolean) => void;
  edgeTriggerRef: RefObject<HTMLButtonElement | null>;
  /** Hauptinhalt ohne `container`-Maximalbreite (Sidebar nimmt keinen Platz ein). */
  mainUsesWideLayout: boolean;
};

const SidebarShellContext = createContext<SidebarShellContextValue | null>(
  null,
);

export function useSidebarShell(): SidebarShellContextValue {
  const ctx = useContext(SidebarShellContext);
  if (!ctx) {
    throw new Error("useSidebarShell must be used within SidebarShellProvider");
  }
  return ctx;
}

export function SidebarShellProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [peek, setPeek] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const edgeTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const persistCollapsed = useCallback((next: boolean) => {
    setCollapsed(next);
    if (next) {
      setPeek(false);
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  const mainUsesWideLayout = hydrated && collapsed;

  const value = useMemo(
    () => ({
      collapsed,
      hydrated,
      peek,
      setPeek,
      persistCollapsed,
      edgeTriggerRef,
      mainUsesWideLayout,
    }),
    [collapsed, hydrated, peek, persistCollapsed],
  );

  return (
    <SidebarShellContext.Provider value={value}>
      {children}
    </SidebarShellContext.Provider>
  );
}

export function CollapsibleSidebar({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const {
    collapsed,
    hydrated,
    peek,
    setPeek,
    persistCollapsed,
    edgeTriggerRef,
  } = useSidebarShell();

  const pinnedOpen = !hydrated || !collapsed;
  const showPeekSidebar = collapsed && peek;

  return (
    <>
      {collapsed && hydrated && (
        <button
          ref={edgeTriggerRef}
          type="button"
          className={cn(
            "fixed left-0 top-16 z-30 hidden h-[calc(100dvh-4rem)] w-3 cursor-pointer border-0 bg-transparent p-0",
            "transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "sm:block",
          )}
          aria-label={t("sidebar.open_from_edge")}
          aria-expanded={showPeekSidebar}
          onMouseEnter={() => setPeek(true)}
          onFocus={() => setPeek(true)}
          onClick={() => persistCollapsed(false)}
        />
      )}
      <div
        className={cn(
          "relative hidden shrink-0 sm:block",
          pinnedOpen ? "w-60" : "w-0 overflow-visible",
        )}
      >
        <aside
          className={cn(
            "flex h-[calc(100vh-64px)] w-60 flex-col gap-5 border-r bg-background p-4",
            collapsed &&
              hydrated &&
              "fixed left-0 top-16 z-40 shadow-lg transition-transform duration-200 ease-out",
            collapsed &&
              hydrated &&
              !peek &&
              "-translate-x-full pointer-events-none",
            collapsed && hydrated && peek && "translate-x-0",
          )}
          onMouseLeave={(e) => {
            if (!collapsed || !peek || !hydrated) {
              return;
            }
            const related = e.relatedTarget;
            if (related instanceof Node) {
              const edge = edgeTriggerRef.current;
              if (edge && (edge === related || edge.contains(related))) {
                return;
              }
            }
            setPeek(false);
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto">
            {children}
          </div>
        </aside>
      </div>
    </>
  );
}

export function SidebarCollapseToggle({
  className,
}: {
  className?: string;
}) {
  const { t } = useTranslation();
  const { collapsed, hydrated, persistCollapsed } = useSidebarShell();

  if (!hydrated) {
    return (
      <div
        className={cn("size-8 shrink-0", className)}
        aria-hidden
      />
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-8 shrink-0", className)}
      aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
      aria-expanded={!collapsed}
      onClick={() => {
        if (collapsed) {
          persistCollapsed(false);
        } else {
          persistCollapsed(true);
        }
      }}
    >
      {collapsed ? (
        <PanelLeft className="size-4" aria-hidden />
      ) : (
        <PanelLeftClose className="size-4" aria-hidden />
      )}
    </Button>
  );
}

export function SidebarMainContent({ children }: { children: ReactNode }) {
  const { mainUsesWideLayout } = useSidebarShell();

  return (
    <div
      className={cn(
        "min-h-30 p-4",
        mainUsesWideLayout ? "w-full max-w-none" : "container",
      )}
    >
      {children}
    </div>
  );
}
