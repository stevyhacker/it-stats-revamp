"use client";

import { Button } from "@/components/ui/button";

export interface FiltersState {
  minRevenue?: string;
  maxRevenue?: string;
  minEmployees?: string;
  maxEmployees?: string;
}

interface FiltersProps {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onClear: () => void;
}

const inputClass =
  "h-10 w-full rounded-md border border-border/80 bg-background/80 px-3 font-mono text-xs text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none";

export function Filters({ value, onChange, onClear }: FiltersProps) {
  return (
    <div className="control-shell w-full p-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-2">
          <label className="font-mono text-xs text-muted-foreground">
            Revenue range (€)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={value.minRevenue ?? ""}
              onChange={(event) =>
                onChange({ ...value, minRevenue: event.target.value })
              }
              className={inputClass}
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={value.maxRevenue ?? ""}
              onChange={(event) =>
                onChange({ ...value, maxRevenue: event.target.value })
              }
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-xs text-muted-foreground">
            Employee range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={value.minEmployees ?? ""}
              onChange={(event) =>
                onChange({ ...value, minEmployees: event.target.value })
              }
              className={inputClass}
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={value.maxEmployees ?? ""}
              onChange={(event) =>
                onChange({ ...value, maxEmployees: event.target.value })
              }
              className={inputClass}
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="h-10 rounded-md border-border/80 bg-background/75 px-5 text-xs"
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
