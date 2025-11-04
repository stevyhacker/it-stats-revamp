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

export function Filters({ value, onChange, onClear }: FiltersProps) {

  return (
    <div className="w-full border border-border bg-card rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Revenue Range (€)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={value.minRevenue ?? ""}
              onChange={(e) => onChange({ ...value, minRevenue: e.target.value })}
              className="h-9 w-full border border-border rounded bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={value.maxRevenue ?? ""}
              onChange={(e) => onChange({ ...value, maxRevenue: e.target.value })}
              className="h-9 w-full border border-border rounded bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Employees Range</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={value.minEmployees ?? ""}
              onChange={(e) => onChange({ ...value, minEmployees: e.target.value })}
              className="h-9 w-full border border-border rounded bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={value.maxEmployees ?? ""}
              onChange={(e) => onChange({ ...value, maxEmployees: e.target.value })}
              className="h-9 w-full border border-border rounded bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-end">
          <Button variant="outline" size="sm" onClick={onClear} className="w-full">
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
