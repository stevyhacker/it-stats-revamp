"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CompanyFilterOptions, CompanyFiltersState } from "@/lib/company-filters";

export type FiltersState = CompanyFiltersState;

interface FiltersProps {
  value: FiltersState;
  options: CompanyFilterOptions;
  onChange: (next: FiltersState) => void;
  onClear: () => void;
}

const ALL_VALUE = "all";

const inputClass =
  "h-10 w-full rounded-md border border-border/80 bg-background/80 px-3 font-mono text-xs text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none";

const selectTriggerClass =
  "h-10 w-full rounded-md border-border/80 bg-background/80 font-mono text-xs text-foreground";

export function Filters({ value, options, onChange, onClear }: FiltersProps) {
  return (
    <div className="control-shell w-full p-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1.1fr)_repeat(2,minmax(0,1fr))_repeat(3,minmax(180px,0.8fr))_auto] lg:items-end">
        <div className="space-y-2">
          <label className="font-mono text-xs text-muted-foreground">
            Search
          </label>
          <input
            type="search"
            placeholder="Name, PIB, activity"
            value={value.q ?? ""}
            onChange={(event) =>
              onChange({ ...value, q: event.target.value })
            }
            className={inputClass}
          />
        </div>

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

        <div className="space-y-2">
          <label className="font-mono text-xs text-muted-foreground">Sector</label>
          <Select
            value={value.sector ?? ALL_VALUE}
            onValueChange={(sector) =>
              onChange({
                ...value,
                sector: sector === ALL_VALUE ? undefined : sector,
              })
            }
          >
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="All sectors" />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value={ALL_VALUE}>All sectors</SelectItem>
              {options.sectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-xs text-muted-foreground">Category</label>
          <Select
            value={value.category ?? ALL_VALUE}
            onValueChange={(category) =>
              onChange({
                ...value,
                category: category === ALL_VALUE ? undefined : category,
              })
            }
          >
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="max-h-80 border-border bg-card">
              <SelectItem value={ALL_VALUE}>All categories</SelectItem>
              {options.categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-xs text-muted-foreground">Municipality</label>
          <Select
            value={value.municipality ?? ALL_VALUE}
            onValueChange={(municipality) =>
              onChange({
                ...value,
                municipality: municipality === ALL_VALUE ? undefined : municipality,
              })
            }
          >
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="All municipalities" />
            </SelectTrigger>
            <SelectContent className="max-h-80 border-border bg-card">
              <SelectItem value={ALL_VALUE}>All municipalities</SelectItem>
              {options.municipalities.map((municipality) => (
                <SelectItem key={municipality} value={municipality}>
                  {municipality}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
