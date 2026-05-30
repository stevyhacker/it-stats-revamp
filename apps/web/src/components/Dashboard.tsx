"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { TrendLineChart } from "./TrendLineChart";
import {
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import numeral from "numeral";
import CompanyTable from "./CompanyTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filters, FiltersState } from "./Filters";
import { Button } from "@/components/ui/button";
import type { CompanyData, YearData } from "@/types";
import {
  buildCompanyParams,
  fetchApi,
  type CompaniesResponse,
  type CompanySortKey,
  type SortDirection,
  type SummaryResponse,
  type TrendResponse,
} from "@/lib/api";

const PAGE_SIZE = 50;
type ChartMetric = "revenue" | "employees" | "profit";

export type DashboardInitialParams = {
  year?: string;
  q?: string;
  minRevenue?: string;
  maxRevenue?: string;
  minEmployees?: string;
  maxEmployees?: string;
  sector?: string;
  category?: string;
  municipality?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

function parseSort(value: string | null): CompanySortKey {
  const allowed = ["name", "totalIncome", "profit", "employeeCount", "averagePay", "incomePerEmployee"];
  return allowed.includes(value ?? "") ? (value as CompanySortKey) : "totalIncome";
}

function parseDirection(value: string | null): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

function chartMetricToSort(metric: ChartMetric): CompanySortKey {
  if (metric === "employees") return "employeeCount";
  if (metric === "profit") return "profit";
  return "totalIncome";
}

function growth(current: number, previous?: number) {
  if (!previous) return current ? Infinity : 0;
  return ((current - previous) / previous) * 100;
}

export function Dashboard({
  years,
  initialParams,
  initialSummary,
  initialCompanies,
  initialTrends,
}: {
  years: string[];
  initialParams: DashboardInitialParams;
  initialSummary: SummaryResponse;
  initialCompanies: CompaniesResponse;
  initialTrends: TrendResponse;
}) {
  const router = useRouter();
  const requestedYear = initialParams.year;
  const defaultYear = requestedYear && years.includes(requestedYear) ? requestedYear : initialSummary.year;
  const [selectedYear, setSelectedYear] = React.useState<string>(defaultYear);
  const [filters, setFilters] = React.useState<FiltersState>({
    q: initialParams.q || undefined,
    minRevenue: initialParams.minRevenue || undefined,
    maxRevenue: initialParams.maxRevenue || undefined,
    minEmployees: initialParams.minEmployees || undefined,
    maxEmployees: initialParams.maxEmployees || undefined,
    sector: initialParams.sector || undefined,
    category: initialParams.category || undefined,
    municipality: initialParams.municipality || undefined,
  });
  const [sortColumn, setSortColumn] = React.useState<CompanySortKey>(parseSort(initialParams.sort ?? null));
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(parseDirection(initialParams.dir ?? null));
  const [page, setPage] = React.useState(() => {
    const parsed = Number(initialParams.page);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  });
  const [summary, setSummary] = React.useState(initialSummary);
  const [companyPage, setCompanyPage] = React.useState(initialCompanies);
  const [trendData, setTrendData] = React.useState<YearData[]>(initialTrends);
  const [chartMetric, setChartMetric] = React.useState<ChartMetric>("revenue");
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = React.useState<string[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);
  const debouncedSearch = useDebouncedValue(filters.q ?? "", 250);
  const didLoadInitialSummary = React.useRef(false);
  const didLoadInitialCompanies = React.useRef(false);
  const didLoadInitialTrends = React.useRef(false);
  const effectiveFilters = React.useMemo<FiltersState>(
    () => ({
      minRevenue: filters.minRevenue,
      maxRevenue: filters.maxRevenue,
      minEmployees: filters.minEmployees,
      maxEmployees: filters.maxEmployees,
      sector: filters.sector,
      category: filters.category,
      municipality: filters.municipality,
      q: debouncedSearch.trim() || undefined,
    }),
    [
      debouncedSearch,
      filters.minRevenue,
      filters.maxRevenue,
      filters.minEmployees,
      filters.maxEmployees,
      filters.sector,
      filters.category,
      filters.municipality,
    ],
  );

  React.useEffect(() => {
    const params = buildCompanyParams({
      year: selectedYear,
      page,
      pageSize: PAGE_SIZE,
      sort: sortColumn,
      dir: sortDirection,
      filters: effectiveFilters,
    });
    const nextHref = `/?${params.toString()}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (nextHref !== current) {
      router.replace(nextHref, { scroll: false });
    }
  }, [selectedYear, page, sortColumn, sortDirection, effectiveFilters, router]);

  React.useEffect(() => {
    if (!didLoadInitialSummary.current) {
      didLoadInitialSummary.current = true;
      return;
    }
    let cancelled = false;
    const summaryParams = buildCompanyParams({
      year: selectedYear,
      filters: effectiveFilters,
    });

    fetchApi<SummaryResponse>("/summary", summaryParams)
      .then((nextSummary) => {
        if (!cancelled) setSummary(nextSummary);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load dashboard summary:", error);
        setLoadError("Could not load the selected market summary.");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear, effectiveFilters]);

  React.useEffect(() => {
    if (!didLoadInitialCompanies.current) {
      didLoadInitialCompanies.current = true;
      return;
    }
    let cancelled = false;
    const companyParams = buildCompanyParams({
      year: selectedYear,
      page,
      pageSize: PAGE_SIZE,
      sort: sortColumn,
      dir: sortDirection,
      filters: effectiveFilters,
    });

    window.queueMicrotask(() => {
      if (cancelled) return;
      setIsLoading(true);
      setLoadError(null);
    });

    fetchApi<CompaniesResponse>("/companies", companyParams)
      .then((nextCompanyPage) => {
        if (!cancelled) setCompanyPage(nextCompanyPage);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load dashboard companies:", error);
        setLoadError("Could not load the selected company data.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear, page, sortColumn, sortDirection, effectiveFilters]);

  React.useEffect(() => {
    if (!didLoadInitialTrends.current) {
      didLoadInitialTrends.current = true;
      return;
    }
    let cancelled = false;
    const trendParams = buildCompanyParams({
      year: selectedYear,
      sort: chartMetricToSort(chartMetric),
      dir: "desc",
      filters: effectiveFilters,
    });
    trendParams.set("metric", chartMetricToSort(chartMetric));

    fetchApi<TrendResponse>("/trends", trendParams)
      .then((nextTrendData) => {
        if (!cancelled) setTrendData(nextTrendData);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load dashboard trends:", error);
        setLoadError("Could not load the selected trend data.");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear, effectiveFilters, chartMetric]);

  const filterOptions = React.useMemo(
    () => ({
      sectors: summary.filterOptions.sectors.map((item) => item.value),
      categories: summary.filterOptions.categories.map((item) => item.value),
      municipalities: summary.filterOptions.municipalities.map((item) => item.value),
    }),
    [summary.filterOptions],
  );

  const selectedYearData = React.useMemo(
    () => ({
      year: companyPage.year,
      companyList: companyPage.companies,
    }),
    [companyPage],
  );

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setPage(1);
  };

  const handleFiltersChange = (nextFilters: FiltersState) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleSort = (column: CompanySortKey) => {
    setPage(1);
    if (sortColumn === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDirection(column === "name" ? "asc" : "desc");
  };

  const handleCompanySelect = (company: CompanyData) => {
    if (!company.pib) return;
    router.push(`/company/${company.pib}`);
  };

  const handleToggleCompany = (companyName: string) => {
    setSelectedCompanies((prev) => prev.includes(companyName)
      ? prev.filter((name) => name !== companyName)
      : [...prev, companyName]
    );
  };

  const hasActiveFilters = Boolean(
    effectiveFilters.q ||
      effectiveFilters.minRevenue ||
      effectiveFilters.maxRevenue ||
      effectiveFilters.minEmployees ||
      effectiveFilters.maxEmployees ||
      effectiveFilters.sector ||
      effectiveFilters.category ||
      effectiveFilters.municipality,
  );
  const filteredCompanyCount = companyPage.total;
  const averageRevenue = summary.companyCount ? summary.totalRevenue / summary.companyCount : 0;
  const averageTeamSize = summary.companyCount ? summary.totalEmployees / summary.companyCount : 0;
  const revenueGrowth = growth(summary.totalRevenue, summary.previousYear?.totalRevenue);
  const employeeGrowth = growth(summary.totalEmployees, summary.previousYear?.totalEmployees);
  const formatGrowth = (value: number) =>
    isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}%` : "N/A";
  const overviewStats = [
    {
      label: "Market revenue",
      value: `${numeral(summary.totalRevenue).format("0,0")}€`,
      detail: `${formatGrowth(revenueGrowth)} YoY`,
      trend: revenueGrowth,
    },
    {
      label: "Total employees",
      value: numeral(summary.totalEmployees).format("0,0"),
      detail: `${formatGrowth(employeeGrowth)} YoY`,
      trend: employeeGrowth,
    },
    {
      label: "Average revenue",
      value: `${numeral(averageRevenue).format("0,0")}€`,
      detail: "Per company",
      trend: undefined,
    },
    {
      label: "Average team size",
      value: numeral(Math.round(averageTeamSize)).format("0,0"),
      detail: "Employees per company",
      trend: undefined,
    },
  ];
  const profitMargin = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const company of companyPage.companies) {
      const revenue = company.totalIncome ?? 0;
      map.set(company.name, revenue ? (company.profit ?? 0) / revenue : 0);
    }
    return map;
  }, [companyPage.companies]);

  const resetFilters = () => {
    setFilters({});
    setPage(1);
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header
        year={summary.year}
        companyCount={summary.companyCount}
        totalRevenue={summary.totalRevenue}
        totalEmployees={summary.totalEmployees}
        concentrationStats={summary.concentrationStats}
      />
      <main
        id="dashboard"
        className="relative mx-auto w-full max-w-[1440px] overflow-x-hidden px-4 pb-14 pt-2 sm:px-6 lg:px-8"
      >
        <section className="control-shell sticky top-3 z-30 mb-4 flex flex-col gap-0 overflow-hidden sm:flex-row sm:items-stretch sm:justify-between">
          <Tabs
            value={selectedYear}
            onValueChange={handleYearChange}
            className="hidden min-w-0 flex-1 md:block"
          >
            <div className="flex h-full items-center">
              <span className="border-r border-border/80 px-4 font-display text-lg font-bold uppercase">
                Year
              </span>
              <TabsList className="h-full rounded-none border-0 bg-transparent p-0">
                {years.map((year) => (
                  <TabsTrigger
                    key={year}
                    value={year}
                    className="h-12 rounded-none border-r border-border/60 px-4 text-sm font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {year}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          <div className="block w-full p-2 md:hidden">
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-full rounded-md border-border/80 bg-background/80">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {years.map((year) => (
                  <SelectItem key={year} value={year} className="cursor-pointer">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col divide-y divide-border/80 border-t border-border/80 sm:flex-row sm:items-stretch sm:divide-x sm:divide-y-0 sm:border-t-0">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex h-12 min-w-44 items-center justify-between gap-4 px-4 text-sm text-foreground transition-colors hover:bg-muted/50"
            >
              <span>{filteredCompanyCount} companies in view</span>
              <AdjustmentsHorizontalIcon className="h-4 w-4 text-muted-foreground" />
            </button>
            {filterOptions.sectors.length > 1 && (
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="hidden h-12 min-w-44 items-center justify-between gap-4 px-4 text-sm text-foreground transition-colors hover:bg-muted/50 xl:flex"
              >
                <span>{filters.sector ?? "All sectors"}</span>
                <span className="text-muted-foreground">{filterOptions.sectors.length}</span>
              </button>
            )}
            {filterOptions.categories.length > 1 && (
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="hidden h-12 min-w-44 items-center justify-between gap-4 px-4 text-sm text-foreground transition-colors hover:bg-muted/50 xl:flex"
              >
                <span className="max-w-40 truncate">{filters.category ?? "All categories"}</span>
                <span className="text-muted-foreground">{filterOptions.categories.length}</span>
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-12 justify-center rounded-none px-4 text-xs"
            >
              Reset filters
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </div>
        </section>

        {showFilters && (
          <div className="mb-4 animate-slide-down">
            <Filters
              value={filters}
              options={filterOptions}
              onChange={handleFiltersChange}
              onClear={resetFilters}
            />
          </div>
        )}

        <section className="mb-3" aria-labelledby="market-overview-heading">
          <h2 id="market-overview-heading" className="sr-only">
            {selectedYear} market snapshot
          </h2>
          <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-md border border-border/80 bg-card/80 sm:grid-cols-2 lg:grid-cols-4">
            {overviewStats.map((stat) => (
              <article
                key={stat.label}
                className="group min-h-28 border-b border-border/80 p-4 transition-colors hover:bg-muted/35 sm:odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0"
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-display text-base font-bold uppercase leading-none">
                      {stat.label}
                    </div>
                    {typeof stat.trend === "number" && (
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-full ${
                          stat.trend >= 0
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        <ArrowTrendingUpIcon
                          className={`h-4 w-4 ${
                            stat.trend >= 0 ? "" : "rotate-180"
                          }`}
                        />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="mt-5 break-words text-3xl font-medium leading-none tabular-nums">
                      {stat.value}
                    </div>
                    <div
                      className={`mt-3 font-mono text-[0.7rem] ${
                        typeof stat.trend === "number"
                          ? stat.trend >= 0
                            ? "text-success"
                            : "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {stat.detail}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="trend"
          className="mb-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]"
          aria-labelledby="trend-heading"
        >
          <Card className="analytics-panel border-border/80 bg-card/90">
            <CardContent className="p-4 sm:p-6 lg:p-7">
              <TrendLineChart
                data={trendData}
                selectedYear={selectedYear}
                selectedCompanies={selectedCompanies}
                metricType={chartMetric}
                onMetricTypeChange={setChartMetric}
              />
            </CardContent>
          </Card>

          <Card className="analytics-panel border-border/80 bg-card/90">
            <CardHeader className="border-b border-border/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <CardTitle
                  id="top-companies-heading"
                  className="font-display text-xl font-bold uppercase leading-none"
                >
                  Top companies by revenue
                </CardTitle>
                <a href="#companies" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                  View all
                </a>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-xs">
                  <thead className="border-b border-border/70 bg-muted/40">
                    <tr className="text-left font-mono text-[0.68rem] uppercase text-muted-foreground">
                      <th className="w-12 px-3 py-2">#</th>
                      <th className="px-3 py-2">Company</th>
                      <th className="px-3 py-2 text-right">Revenue</th>
                      <th className="px-3 py-2 text-right">Profit</th>
                      <th className="px-3 py-2 text-right">Margin</th>
                      <th className="px-3 py-2 text-right">Employees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topCompanies.map((company, index) => {
                      const revenue = company.totalIncome ?? 0;
                      const profit = company.profit ?? 0;
                      const margin = revenue ? profit / revenue : 0;

                      return (
                        <tr
                          key={company.pib || company.name}
                          onClick={() => handleCompanySelect(company)}
                          className="cursor-pointer border-b border-border/55 transition-colors hover:bg-primary/10"
                        >
                          <td className="px-3 py-2">
                            <span className="grid h-6 w-6 place-items-center rounded-sm bg-primary font-mono text-xs font-semibold text-primary-foreground">
                              {index + 1}
                            </span>
                          </td>
                          <td className="max-w-44 truncate px-3 py-2 font-semibold text-foreground">
                            {company.pib ? (
                              <Link
                                href={`/company/${company.pib}/`}
                                onClick={(event) => event.stopPropagation()}
                                className="block truncate underline-offset-4 hover:text-primary hover:underline"
                              >
                                {company.name}
                              </Link>
                            ) : (
                              company.name
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">
                            {numeral(revenue).format("0,0")}€
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-success tabular-nums">
                            {numeral(profit).format("0,0")}€
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">
                            {numeral(margin).format("0.0%")}
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">
                            {company.employeeCount ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
                <span>
                  Concentration by revenue: Top 5 companies are shown above
                </span>
                <span>Source: CRPS</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section
          id="companies"
          aria-labelledby="all-companies-heading"
          className="pb-6"
        >
          <Card className="analytics-panel border-border/80 bg-card/90">
            <CardHeader className="border-b border-border/70 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle
                    id="all-companies-heading"
                    className="font-display text-xl font-bold uppercase leading-none"
                  >
                    Companies ({filteredCompanyCount})
                  </CardTitle>
                  <span className="hidden h-5 w-px bg-border sm:block" />
                  <span className="text-xs text-muted-foreground">
                    Compare companies by official filing metrics
                  </span>
                  {isLoading && (
                    <span className="font-mono text-xs text-muted-foreground">Loading...</span>
                  )}
                  {loadError && (
                    <span className="font-mono text-xs text-destructive">{loadError}</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <CompanyTable
                selectedYearData={selectedYearData}
                onCompanySelect={handleCompanySelect}
                selectedCompanies={selectedCompanies}
                onToggleCompany={handleToggleCompany}
                profitMarginByName={profitMargin}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                page={companyPage.page}
                pageSize={companyPage.pageSize}
                total={companyPage.total}
                onPageChange={setPage}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
