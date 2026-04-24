"use client";

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { TrendLineChart } from "./TrendLineChart";
import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import numeral from "numeral";
import CompanyTable from "./CompanyTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filters, FiltersState } from "./Filters";
import { useSearchParams, useRouter as useNextRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

interface Company {
  id: number;
  pib: string;
  maticniBroj: string;
  name: string;
  address: string | null;
  municipality: string | null;
  activityCode: string | null;
  activityName: string | null;
  employeeCount: number | null;
  averagePay: number | null;
  yearId: number;
  totalIncome: number | null;
  profit: number | null;
  incomePerEmployee: number | null;
}
interface YearData {
  year: string;
  companyList: Company[];
}

export function Dashboard({
  years,
  data,
}: {
  years: string[];
  data: YearData[];
}) {
  const router = useRouter();
  const nextRouter = useNextRouter();
  const searchParams = useSearchParams();

  const [selectedYear, setSelectedYear] = useState<string>(searchParams.get('year') || years[0] || "");
  const [filters, setFilters] = useState<FiltersState>({
    minRevenue: searchParams.get('minRevenue') || undefined,
    maxRevenue: searchParams.get('maxRevenue') || undefined,
    minEmployees: searchParams.get('minEmployees') || undefined,
    maxEmployees: searchParams.get('maxEmployees') || undefined,
  });
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const selectedYearDataRaw = data.find((d) => d.year === selectedYear);
  const selectedYearData = React.useMemo(() => {
    if (!selectedYearDataRaw) return undefined;

    return {
      ...selectedYearDataRaw,
      companyList: selectedYearDataRaw.companyList.filter((c) => {
      const rev = c.totalIncome ?? 0;
      const emp = c.employeeCount ?? 0;
      const minRev = filters.minRevenue ? Number(filters.minRevenue) : undefined;
      const maxRev = filters.maxRevenue ? Number(filters.maxRevenue) : undefined;
      const minEmp = filters.minEmployees ? Number(filters.minEmployees) : undefined;
      const maxEmp = filters.maxEmployees ? Number(filters.maxEmployees) : undefined;
      if (minRev !== undefined && rev < minRev) return false;
      if (maxRev !== undefined && rev > maxRev) return false;
      if (minEmp !== undefined && emp < minEmp) return false;
      if (maxEmp !== undefined && emp > maxEmp) return false;
      return true;
      })
    };
  }, [
    selectedYearDataRaw,
    filters.minRevenue,
    filters.maxRevenue,
    filters.minEmployees,
    filters.maxEmployees,
  ]);
  const previousYearData = data.find(
    (d) => d.year === years[years.indexOf(selectedYear) + 1]
  );

  const calculateMarketStats = (): {
    totalRevenue: number;
    revenueGrowth: number;
    totalEmployees: number;
    employeeGrowth: number;
  } => {
    if (!selectedYearData)
      return { totalRevenue: 0, revenueGrowth: 0, totalEmployees: 0, employeeGrowth: 0 };
    const currentTotal = selectedYearData.companyList.reduce(
      (sum, company) => sum + (company.totalIncome ?? 0),
      0
    );
    const currentEmployees = selectedYearData.companyList.reduce(
      (sum, company) => sum + (company.employeeCount ?? 0),
      0
    );

    if (!previousYearData) {
      return {
        totalRevenue: currentTotal,
        revenueGrowth: 0,
        totalEmployees: currentEmployees,
        employeeGrowth: 0,
      };
    }

    const previousTotal = previousYearData.companyList.reduce(
      (sum, company) => sum + (company.totalIncome ?? 0),
      0
    );
    const previousEmployees = previousYearData.companyList.reduce(
      (sum, company) => sum + (company.employeeCount ?? 0),
      0
    );

    return {
      totalRevenue: currentTotal,
      revenueGrowth: previousTotal === 0
        ? (currentTotal === 0 ? 0 : Infinity)
        : ((currentTotal - previousTotal) / previousTotal) * 100,
      totalEmployees: currentEmployees,
      employeeGrowth: previousEmployees === 0
        ? (currentEmployees === 0 ? 0 : Infinity)
        : ((currentEmployees - previousEmployees) / previousEmployees) * 100,
    };
  };

  const marketStats = calculateMarketStats();
  const tableFilterOptions = React.useMemo(() => {
    const companies = selectedYearDataRaw?.companyList ?? [];
    const municipalities = new Set(
      companies
        .map((company) => company.municipality?.trim())
        .filter((municipality): municipality is string => Boolean(municipality))
    );
    const activities = new Set(
      companies
        .map((company) => company.activityName?.trim())
        .filter((activity): activity is string => Boolean(activity))
    );

    return {
      hasMunicipalities: municipalities.size > 1,
      hasActivities: activities.size > 1,
    };
  }, [selectedYearDataRaw]);

  const topCompanies = selectedYearData
    ? [...selectedYearData.companyList]
        .sort((a, b) => (b.totalIncome ?? -Infinity) - (a.totalIncome ?? -Infinity))
        .slice(0, 5)
    : [];

  const handleCompanySelect = (companyName: string) => {
    router.push(`/company/${encodeURIComponent(companyName)}`);
  };

  const handleToggleCompany = (companyName: string) => {
    setSelectedCompanies((prev) => prev.includes(companyName)
      ? prev.filter((n) => n !== companyName)
      : [...prev, companyName]
    );
  };

  // Sync state to URL (client-only guard + no-op if unchanged)
  React.useEffect(() => {
    try {
      const params = new URLSearchParams();
      params.set('year', selectedYear);
      if (filters.minRevenue) params.set('minRevenue', filters.minRevenue);
      if (filters.maxRevenue) params.set('maxRevenue', filters.maxRevenue);
      if (filters.minEmployees) params.set('minEmployees', filters.minEmployees);
      if (filters.maxEmployees) params.set('maxEmployees', filters.maxEmployees);
    // removed profitOnly
      const nextHref = `/?${params.toString()}`;
      const current = `${window.location.pathname}${window.location.search}`;
      if (nextHref !== current) {
        nextRouter.replace(nextHref);
      }
    } catch (e) {
      // noop
    }
  }, [selectedYear, filters, nextRouter]);

  // Compute per-company quality metrics for current year (percentiles & margin)
  const qualityMetrics = React.useMemo(() => {
    if (!selectedYearData?.companyList?.length) return { rpePercentile: new Map<string, number>(), profitMargin: new Map<string, number>() };
    const list = selectedYearData.companyList;
    const revenuePerEmployee: Array<{ name: string; value: number }> = list.map((c) => ({
      name: c.name,
      value: typeof c.incomePerEmployee === 'string' ? Number(c.incomePerEmployee) || 0 : (c.incomePerEmployee ?? 0)
    }));
    const sorted = [...revenuePerEmployee].sort((a, b) => a.value - b.value);
    const rpePercentile = new Map<string, number>();
    const profitMargin = new Map<string, number>();
    const n = sorted.length;
    const indexByName = new Map(sorted.map((item, idx) => [item.name, idx] as const));
    list.forEach((c) => {
      const idx = indexByName.get(c.name) ?? 0;
      const pct = Math.round(((idx + 1) / n) * 100);
      rpePercentile.set(c.name, pct);
      const margin = (c.totalIncome && c.totalIncome !== 0) ? (c.profit ?? 0) / c.totalIncome : 0;
      profitMargin.set(c.name, margin);
    });
    return { rpePercentile, profitMargin };
  }, [selectedYearData]);

  // Export CSV of filtered companies
  const exportCsv = React.useCallback(() => {
    if (!selectedYearData?.companyList) return;
    const headers = [
      'Company', 'Total Income', 'Profit', 'Employees', 'Avg Pay', 'Income/Employee', 'RPE Percentile', 'Profit Margin'
    ];
    const rows = selectedYearData.companyList.map((c) => [
      c.name,
      c.totalIncome ?? 0,
      c.profit ?? 0,
      c.employeeCount ?? 0,
      c.averagePay ?? 0,
      typeof c.incomePerEmployee === 'string' ? Number(c.incomePerEmployee) || 0 : (c.incomePerEmployee ?? 0),
      qualityMetrics.rpePercentile.get(c.name) ?? 0,
      (qualityMetrics.profitMargin.get(c.name) ?? 0).toFixed(4),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `companies_${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [selectedYearData, selectedYear, qualityMetrics]);

  const [showFilters, setShowFilters] = React.useState(false);
  const hasActiveFilters = filters.minRevenue || filters.maxRevenue || filters.minEmployees || filters.maxEmployees;
  const filteredCompanyCount = selectedYearData?.companyList.length ?? 0;
  const averageRevenue = filteredCompanyCount
    ? marketStats.totalRevenue / filteredCompanyCount
    : 0;
  const averageTeamSize = filteredCompanyCount
    ? marketStats.totalEmployees / filteredCompanyCount
    : 0;
  const formatGrowth = (value: number) =>
    isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}%` : "N/A";
  const overviewStats = [
    {
      label: "Market revenue",
      value: `${numeral(marketStats.totalRevenue).format("0,0")}€`,
      detail: `${formatGrowth(marketStats.revenueGrowth)} YoY`,
      trend: marketStats.revenueGrowth,
    },
    {
      label: "Total employees",
      value: numeral(marketStats.totalEmployees).format("0,0"),
      detail: `${formatGrowth(marketStats.employeeGrowth)} YoY`,
      trend: marketStats.employeeGrowth,
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
  const resetFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <main
        id="dashboard"
        className="relative mx-auto w-full max-w-[1440px] overflow-x-hidden px-4 pb-14 pt-2 sm:px-6 lg:px-8"
      >
        <section className="control-shell sticky top-3 z-30 mb-4 flex flex-col gap-0 overflow-hidden sm:flex-row sm:items-stretch sm:justify-between">
          <Tabs
            value={selectedYear}
            onValueChange={setSelectedYear}
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
            <Select value={selectedYear} onValueChange={setSelectedYear}>
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
            {tableFilterOptions.hasMunicipalities && (
              <div className="hidden h-12 min-w-44 items-center justify-between gap-4 px-4 text-sm text-foreground xl:flex">
                <span>All municipalities</span>
                <span className="text-muted-foreground">v</span>
              </div>
            )}
            {tableFilterOptions.hasActivities && (
              <div className="hidden h-12 min-w-44 items-center justify-between gap-4 px-4 text-sm text-foreground xl:flex">
                <span>All activities (IT)</span>
                <span className="text-muted-foreground">v</span>
              </div>
            )}
            {selectedYearDataRaw && (
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
            )}
          </div>
        </section>

        {selectedYearDataRaw && showFilters && (
          <div className="mb-4 animate-slide-down">
            <Filters
              value={filters}
              onChange={setFilters}
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
                data={data}
                selectedYear={selectedYear}
                selectedCompanies={selectedCompanies}
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
                    {topCompanies.map((company, index) => {
                      const revenue = company.totalIncome ?? 0;
                      const profit = company.profit ?? 0;
                      const margin = revenue ? profit / revenue : 0;

                      return (
                        <tr
                          key={company.pib || company.name}
                          onClick={() => handleCompanySelect(company.name)}
                          className="cursor-pointer border-b border-border/55 transition-colors hover:bg-primary/10"
                        >
                          <td className="px-3 py-2">
                            <span className="grid h-6 w-6 place-items-center rounded-sm bg-primary font-mono text-xs font-semibold text-primary-foreground">
                              {index + 1}
                            </span>
                          </td>
                          <td className="max-w-44 truncate px-3 py-2 font-semibold text-foreground">
                            {company.name}
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
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCsv}
                  className="w-full rounded-md border-border/80 bg-background/70 text-xs sm:w-auto"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <CompanyTable
                selectedYearData={selectedYearData}
                onCompanySelect={handleCompanySelect}
                selectedCompanies={selectedCompanies}
                onToggleCompany={handleToggleCompany}
                profitMarginByName={qualityMetrics.profitMargin}
              />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
