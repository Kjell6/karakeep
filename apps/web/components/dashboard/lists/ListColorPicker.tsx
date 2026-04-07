"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

export const LIST_COLOR_PRESETS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
] as const;

export function ListColorPicker({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  
  const isPreset = value ? LIST_COLOR_PRESETS.includes(value as any) : false;
  const isCustom = value && !isPreset;
  const display = value ?? "#64748b";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {LIST_COLOR_PRESETS.map((hex) => (
          <button
            key={hex}
            type="button"
            disabled={disabled}
            title={hex}
            onClick={() => onChange(value === hex ? null : hex)}
            className={cn(
              "size-8 shrink-0 rounded-md border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              value === hex
                ? "scale-110 border-foreground"
                : "border-transparent hover:scale-105",
            )}
            style={{
              backgroundColor: hex,
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label
            title={t("lists.list_color_custom")}
            className={cn(
              "relative flex size-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 transition-transform focus-within:ring-2 focus-within:ring-ring",
              isCustom
                ? "scale-110 border-foreground"
                : "border-transparent hover:scale-105",
            )}
            style={{
              background: isCustom
                ? value
                : "conic-gradient(from 90deg, red, yellow, lime, aqua, blue, magenta, red)",
            }}
          >
            <input
              type="color"
              disabled={disabled}
              value={display}
              onChange={(e) => onChange(e.target.value)}
              className="absolute -inset-4 size-16 cursor-pointer opacity-0"
            />
          </label>
          <span className="text-sm font-medium text-muted-foreground">
            {t("lists.list_color_custom")}
          </span>
        </div>

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange(null)}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {t("lists.list_color_clear")}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {t("lists.list_color_hint")}
      </p>
    </div>
  );
}
