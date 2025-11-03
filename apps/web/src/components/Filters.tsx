"use client";

import { useMemo } from "react";
// Note: Select imports removed since only range inputs remain
import { Button } from "@/components/ui/button";

export interface FiltersState {
  minRevenue?: string; // use string for inputs to handle empty
  maxRevenue?: string;
  minEmployees?: string;
  maxEmployees?: string;
}

interface FiltersProps {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onClear: () => void;
}

export function Filters({ value, onChange, onClear }: FiltersProps) {

  return (
    <div className="w-full border-2 border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary font-mono font-bold">$</span>
        <span className="text-xs font-mono text-muted-foreground uppercase">filter_data</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase">revenue_range (€)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="min"
              value={value.minRevenue ?? ""}
              onChange={(e) => onChange({ ...value, minRevenue: e.target.value })}
              className="h-10 w-full border-2 border-border bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none transition-colors"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="max"
              value={value.maxRevenue ?? ""}
              onChange={(e) => onChange({ ...value, maxRevenue: e.target.value })}
              className="h-10 w-full border-2 border-border bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase">employees_range</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="min"
              value={value.minEmployees ?? ""}
              onChange={(e) => onChange({ ...value, minEmployees: e.target.value })}
              className="h-10 w-full border-2 border-border bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none transition-colors"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="max"
              value={value.maxEmployees ?? ""}
              onChange={(e) => onChange({ ...value, maxEmployees: e.target.value })}
              className="h-10 w-full border-2 border-border bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <Button variant="outline" onClick={onClear} className="w-full">
            <span>clear_filters</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
