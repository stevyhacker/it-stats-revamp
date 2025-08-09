"use client";

import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface FiltersState {
  municipality?: string;
  activityCode?: string;
  minRevenue?: string; // use string for inputs to handle empty
  maxRevenue?: string;
  minEmployees?: string;
  maxEmployees?: string;
  profitOnly?: boolean;
}

interface FiltersProps {
  companies: Array<{
    municipality: string | null;
    activityCode: string | null;
    totalIncome: number | null;
    employeeCount: number | null;
    profit: number | null;
  }>;
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onClear: () => void;
}

export function Filters({ companies, value, onChange, onClear }: FiltersProps) {
  const municipalities = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.municipality) set.add(c.municipality);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [companies]);

  const activityCodes = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.activityCode) set.add(c.activityCode);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [companies]);

  return (
    <div className="w-full glass-card border rounded-xl p-3 md:p-4 flex flex-col gap-3 md:gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Municipality</label>
          <Select value={value.municipality ?? ""} onValueChange={(v) => onChange({ ...value, municipality: v || undefined })}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {municipalities.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Activity code</label>
          <Select value={value.activityCode ?? ""} onValueChange={(v) => onChange({ ...value, activityCode: v || undefined })}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {activityCodes.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Profitability</label>
          <div className="flex items-center gap-2 h-9">
            <input
              id="profitOnly"
              type="checkbox"
              checked={!!value.profitOnly}
              onChange={(e) => onChange({ ...value, profitOnly: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            <label htmlFor="profitOnly" className="text-sm">Profit only</label>
          </div>
        </div>
      </div>

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
