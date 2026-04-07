"use client";

import { useEffect, useState } from "react";
import { ButtonWithTooltip } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "@/lib/i18n/client";
import { useGridColumns } from "@/lib/userLocalSettings/bookmarksLayout";
import { updateGridColumns } from "@/lib/userLocalSettings/userLocalSettings";
import { Settings } from "lucide-react";

export default function ViewOptions() {
  const { t } = useTranslation();
  const gridColumns = useGridColumns();
  const [tempColumns, setTempColumns] = useState(gridColumns);

  useEffect(() => {
    setTempColumns(gridColumns);
  }, [gridColumns]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ButtonWithTooltip
          tooltip={t("view_options.title")}
          delayDuration={100}
          variant="ghost"
        >
          <Settings size={18} />
        </ButtonWithTooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <div className="px-2 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">
              {t("view_options.columns")}
            </span>
            <span className="text-sm text-muted-foreground">{tempColumns}</span>
          </div>
          <Slider
            value={[tempColumns]}
            onValueChange={([value]) => setTempColumns(value)}
            onValueCommit={([value]) => updateGridColumns(value)}
            min={1}
            max={6}
            step={1}
            className="w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>6</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
