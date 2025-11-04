"use client";

import { useMemo } from "react";
import { Filter } from "lucide-react";
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
    <div className="w-full border border-border bg-card rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-primary" />
        <span className="text-sm font-display font-semibold text-foreground">Filter Data</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenue Range (€)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={value.minRevenue ?? ""}
              onChange={(e) => onChange({ ...value, minRevenue: e.target.value })}
              className="h-10 w-full border border-border rounded-lg bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={value.maxRevenue ?? ""}
              onChange={(e) => onChange({ ...value, maxRevenue: e.target.value })}
              className="h-10 w-full border border-border rounded-lg bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Employees Range</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={value.minEmployees ?? ""}
              onChange={(e) => onChange({ ...value, minEmployees: e.target.value })}
              className="h-10 w-full border border-border rounded-lg bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={value.maxEmployees ?? ""}
              onChange={(e) => onChange({ ...value, maxEmployees: e.target.value })}
              className="h-10 w-full border border-border rounded-lg bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <Button variant="outline" onClick={onClear} className="w-full">
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
