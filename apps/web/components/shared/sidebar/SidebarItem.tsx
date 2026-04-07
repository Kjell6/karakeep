"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SidebarItem({
  name,
  logo,
  path,
  className,
  linkClassName,
  style,
  collapseButton,
  right = null,
  dropHighlight = false,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDragStart,
  onDragEnd,
  draggable,
  reorderDropEdge = null,
  isDragging = false,
}: {
  name: string;
  logo: React.ReactNode;
  path: string;
  style?: React.CSSProperties;
  className?: string;
  linkClassName?: string;
  right?: React.ReactNode;
  collapseButton?: React.ReactNode;
  dropHighlight?: boolean;
  onDrop?: React.DragEventHandler;
  onDragOver?: React.DragEventHandler;
  onDragEnter?: React.DragEventHandler;
  onDragLeave?: React.DragEventHandler;
  onDragStart?: React.DragEventHandler;
  onDragEnd?: React.DragEventHandler;
  draggable?: boolean;
  reorderDropEdge?: "top" | "bottom" | null;
  isDragging?: boolean;
}) {
  const currentPath = usePathname();
  return (
    <li
      className={cn(
        "relative flex justify-between rounded-lg text-sm transition-colors hover:bg-accent",
        path == currentPath
          ? "bg-accent/50 text-foreground"
          : "text-muted-foreground",
        dropHighlight && "bg-accent ring-2 ring-primary",
        reorderDropEdge === "top" &&
          "shadow-[inset_0_2px_0_0_hsl(var(--primary))]",
        reorderDropEdge === "bottom" &&
          "shadow-[inset_0_-2px_0_0_hsl(var(--primary))]",
        isDragging && "opacity-50",
        className,
      )}
      style={style}
      draggable={draggable}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center",
          collapseButton ? "gap-x-1.5" : undefined,
        )}
      >
        {collapseButton ? (
          <div className="flex w-3 shrink-0 items-center justify-center self-stretch">
            {collapseButton}
          </div>
        ) : null}
        <Link
          href={path}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-x-2 rounded-[inherit] py-2",
            collapseButton ? "pl-0 pr-3" : "px-3",
            linkClassName,
          )}
        >
          {logo}
          <span title={name} className="line-clamp-1 break-all">
            {name}
          </span>
        </Link>
      </div>
      {right}
    </li>
  );
}
