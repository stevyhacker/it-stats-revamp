"use client";

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { CompanyCard } from "./CompanyCard";
import { TrendLineChart } from "./TrendLineChart";
import {
  TrendingUp,
  BarChart3,
} from "lucide-react";
import numeral from "numeral";
import CompanyTable from "./CompanyTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "./ThemeToggle";
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
  const selectedYearData = selectedYearDataRaw ? {
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
  } : undefined;
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

  const topCompanies = selectedYearData
    ? [...selectedYearData.companyList]
        .sort((a, b) => (b.totalIncome ?? -Infinity) - (a.totalIncome ?? -Infinity))
        .slice(0, 6)
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

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <main className="relative max-w-7xl mx-auto px-4 py-6">
        <ThemeToggle variant="floating" />

        {/* Compact Year Selection + Filter Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Tabs for Medium and Up */}
          <Tabs
            value={selectedYear}
            onValueChange={setSelectedYear}
            className="hidden md:block"
          >
            <TabsList className="h-auto p-1 bg-muted/30 border border-border">
              {years.map((year) => (
                <TabsTrigger
                  key={year}
                  value={year}
                  className="px-3 py-1.5 text-sm font-medium transition-all duration-150 
                             data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {year}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Select Dropdown for Small Screens */}
          <div className="block md:hidden w-full sm:w-auto">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full border border-border bg-background">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="border border-border bg-card">
                {years.map((year) => (
                  <SelectItem
                    key={year}
                    value={year}
                    className="cursor-pointer"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Toggle */}
          {selectedYearDataRaw && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Filters
              {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
            </Button>
          )}
        </div>

        {/* Collapsible Filters */}
        {selectedYearDataRaw && showFilters && (
          <div className="mb-6">
            <Filters
              value={filters}
              onChange={setFilters}
              onClear={() => setFilters({})}
            />
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
            Market Overview — {selectedYear}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-border">
              <CardContent className="pt-4 pb-4">
                <div className="text-xs text-muted-foreground mb-1">Total Revenue</div>
                <div className="text-2xl font-bold">
                  {numeral(marketStats.totalRevenue).format("0,0")}€
                </div>
                <div
                  className={`text-xs mt-1 flex items-center gap-1 ${
                    marketStats.revenueGrowth >= 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {marketStats.revenueGrowth >= 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingUp
                      size={12}
                      className="transform rotate-180 scale-x-[-1]"
                    />
                  )}
                  {isFinite(marketStats.revenueGrowth)
                    ? marketStats.revenueGrowth.toFixed(1)
                    : "N/A"}
                  % YoY
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-4 pb-4">
                <div className="text-xs text-muted-foreground mb-1">Total Employees</div>
                <div className="text-2xl font-bold">
                  {numeral(marketStats.totalEmployees).format("0,0")}
                </div>
                <div
                  className={`text-xs mt-1 flex items-center gap-1 ${
                    marketStats.employeeGrowth >= 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {marketStats.employeeGrowth >= 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingUp
                      size={12}
                      className="transform rotate-180 scale-x-[-1]"
                    />
                  )}
                  {isFinite(marketStats.employeeGrowth)
                    ? marketStats.employeeGrowth.toFixed(1)
                    : "N/A"}
                  % YoY
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-4 pb-4">
                <div className="text-xs text-muted-foreground mb-1">Avg Revenue</div>
                <div className="text-2xl font-bold">
                  {selectedYearData?.companyList.length
                    ? numeral(
                        marketStats.totalRevenue / selectedYearData.companyList.length
                      ).format("0,0")
                    : 0}
                  €
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Per company
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-4 pb-4">
                <div className="text-xs text-muted-foreground mb-1">Avg Team Size</div>
                <div className="text-2xl font-bold">
                  {selectedYearData?.companyList.length
                    ? Math.round(
                        marketStats.totalEmployees /
                          selectedYearData.companyList.length
                      )
                    : 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Employees per company
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
            Top 6 Companies — {selectedYear}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topCompanies.map((company) => (
              <CompanyCard
                key={company.pib}
                name={company.name}
                totalIncome={company.totalIncome}
                profit={company.profit}
                employeeCount={company.employeeCount}
                averagePay={company.averagePay}
                onClick={() => handleCompanySelect(company.name)}
              />
            ))}
          </div>
        </section>

        <section className="mb-8">
          <Card className="border-border">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-muted-foreground">
                  Market Trends
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={data}
                selectedYear={selectedYear}
                selectedCompanies={selectedCompanies}
              />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="all-companies-heading">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle id="all-companies-heading" className="text-lg font-semibold text-muted-foreground">
                  All Companies — {selectedYear}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={exportCsv} className="text-xs">
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
