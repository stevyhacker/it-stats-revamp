import React from "react";
import { ArrowPathIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";
import { SiteNav } from "./SiteNav";

interface HeaderProps {
  year: string;
  companyCount: number;
  totalRevenue: number;
  totalEmployees: number;
  concentrationStats: Array<{ label: string; value: number }>;
}

const compactCurrency = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const Header = ({
  year,
  companyCount,
  totalRevenue,
  totalEmployees,
  concentrationStats,
}: HeaderProps) => {
  return (
    <header className="relative isolate overflow-hidden bg-[hsl(var(--hero-background))]">
      <div className="dashboard-grid absolute inset-0 opacity-75" />
      <div className="grain-overlay absolute inset-0 opacity-55" />

      <div className="relative mx-auto max-w-[1440px] px-4 pb-3 pt-4 sm:px-6 lg:px-8">
        <SiteNav />

        <div className="grid gap-8 py-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:items-start lg:py-8">
          <div className="pt-1">
            <h1 className="max-w-4xl font-display text-[2.9rem] font-bold leading-[0.95] text-foreground sm:text-[3.65rem] lg:text-[3.95rem]">
              <span className="block">Montenegro companies.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Explore official company financials, employment and salary data from
              public filings.
            </p>
          </div>

          <aside className="analytics-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/75 px-4 py-3">
              <h2 className="font-display text-xl font-bold uppercase leading-none">
                Market intelligence
              </h2>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">Selected year</span>
                <span className="font-display text-2xl font-bold">{year}</span>
              </div>
            </div>

            <div className="grid border-b border-border/75 md:grid-cols-[1fr_1fr_1.45fr]">
              <div className="border-b border-border/75 p-4 md:border-b-0 md:border-r">
                <p className="font-display text-base font-bold uppercase leading-none">
                  Market revenue
                </p>
                <p className="mt-5 text-3xl font-semibold tabular-nums">
                  {compactCurrency.format(totalRevenue)}€
                </p>
                <p className="mt-2 font-mono text-[0.68rem] text-muted-foreground">
                  official filings
                </p>
              </div>

              <div className="border-b border-border/75 p-4 md:border-b-0 md:border-r">
                <p className="font-display text-base font-bold uppercase leading-none">
                  Total employees
                </p>
                <p className="mt-5 text-3xl font-semibold tabular-nums">
                  {compactNumber.format(totalEmployees)}
                </p>
                <p className="mt-2 font-mono text-[0.68rem] text-muted-foreground">
                  {companyCount} companies
                </p>
              </div>

              <div className="p-4">
                <p className="font-display text-base font-bold uppercase leading-none">
                  Market concentration
                </p>
                <div className="mt-4 space-y-3">
                  {concentrationStats.map((item) => (
                    <div key={item.label} className="grid grid-cols-[7.2rem_1fr_3rem] items-center gap-3">
                      <span className="text-xs text-foreground">{item.label}</span>
                      <span className="h-3 overflow-hidden rounded-sm bg-muted">
                        <span
                          className="block h-full rounded-sm bg-primary"
                          style={{ width: `${Math.min(item.value * 100, 100)}%` }}
                        />
                      </span>
                      <span className="text-right font-mono text-xs">
                        {(item.value * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
              <span>Currency: EUR</span>
              <span>Source: CRPS</span>
            </div>
          </aside>
        </div>

        <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-border/80 bg-card/80 px-3 py-2 font-mono text-xs text-muted-foreground lg:hidden">
          <BuildingOffice2Icon className="h-4 w-4 text-primary" />
          {companyCount} companies in {year}
          <ArrowPathIcon className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
};
