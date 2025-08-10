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
    <div className="w-full glass-card border rounded-xl p-3 md:p-4 flex flex-col gap-3 md:gap-4">
      {/* Profitability filter removed */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Revenue range (€)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={value.minRevenue ?? ""}
              onChange={(e) => onChange({ ...value, minRevenue: e.target.value })}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={value.maxRevenue ?? ""}
              onChange={(e) => onChange({ ...value, maxRevenue: e.target.value })}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Employees range</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={value.minEmployees ?? ""}
              onChange={(e) => onChange({ ...value, minEmployees: e.target.value })}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={value.maxEmployees ?? ""}
              onChange={(e) => onChange({ ...value, maxEmployees: e.target.value })}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <Button variant="outline" onClick={onClear} className="w-full">Clear</Button>
        </div>
      </div>
    </div>
  );
}
