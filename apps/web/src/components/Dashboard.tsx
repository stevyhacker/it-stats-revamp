"use client";

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { CompanyCard } from "./CompanyCard";
import { TrendLineChart } from "./TrendLineChart";
import {
  TrendingUp,
  Users,
  Building2,
  Briefcase,
} from "lucide-react";
import numeral from "numeral";
import CompanyTable from "./CompanyTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "./ThemeToggle";
import { Filters, FiltersState } from "./Filters";
import { useSearchParams, useRouter as useNextRouter } from 'next/navigation';

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
    municipality: searchParams.get('municipality') || undefined,
    activityCode: searchParams.get('activity') || undefined,
    minRevenue: searchParams.get('minRevenue') || undefined,
    maxRevenue: searchParams.get('maxRevenue') || undefined,
    minEmployees: searchParams.get('minEmployees') || undefined,
    maxEmployees: searchParams.get('maxEmployees') || undefined,
    profitOnly: searchParams.get('profitOnly') === '1' ? true : undefined,
  });
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const selectedYearDataRaw = data.find((d) => d.year === selectedYear);
  const selectedYearData = selectedYearDataRaw ? {
    ...selectedYearDataRaw,
    companyList: selectedYearDataRaw.companyList.filter((c) => {
      if (filters.municipality && c.municipality !== filters.municipality) return false;
      if (filters.activityCode && c.activityCode !== filters.activityCode) return false;
      if (filters.profitOnly && (c.profit ?? 0) < 0) return false;
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
      if (filters.municipality) params.set('municipality', filters.municipality);
      if (filters.activityCode) params.set('activity', filters.activityCode);
      if (filters.minRevenue) params.set('minRevenue', filters.minRevenue);
      if (filters.maxRevenue) params.set('maxRevenue', filters.maxRevenue);
      if (filters.minEmployees) params.set('minEmployees', filters.minEmployees);
      if (filters.maxEmployees) params.set('maxEmployees', filters.maxEmployees);
      if (filters.profitOnly) params.set('profitOnly', '1');
      const nextHref = `/?${params.toString()}`;
      const current = `${window.location.pathname}${window.location.search}`;
      if (nextHref !== current) {
        nextRouter.replace(nextHref);
      }
    } catch (e) {
      // noop
    }
  }, [selectedYear, filters, nextRouter]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 ease-in-out">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-surface-2 to-surface-3 -z-10" />
      <main className="relative max-w-7xl mx-auto px-4 py-8">
        <ThemeToggle variant="floating" />

        {/* Year Selection - Conditional Rendering */}
        <div className="mb-8">
          {/* Tabs for Medium and Up */}
          <Tabs
            value={selectedYear}
            onValueChange={setSelectedYear}
            className="hidden md:block" // Hide on small screens
          >
            <TabsList className="overflow-x-auto h-auto p-1 md:overflow-x-visible justify-start rounded-lg bg-muted/30 backdrop-blur-sm">
              {years.map((year) => (
                <TabsTrigger
                  key={year}
                  value={year}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out relative text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-soft hover:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {year}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Select Dropdown for Small Screens */}
          <div className="block md:hidden">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full rounded-lg bg-card/80 backdrop-blur-sm border shadow-soft px-4 py-2 text-sm font-medium">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="rounded-lg bg-popover/95 backdrop-blur-sm border shadow-medium">
                {years.map((year) => (
                  <SelectItem
                    key={year}
                    value={year}
                    className="cursor-pointer px-4 py-2 hover:bg-accent/50 data-[state=checked]:bg-accent"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        {selectedYearDataRaw && (
          <div className="mb-8">
            <Filters
              companies={selectedYearDataRaw.companyList}
              value={filters}
              onChange={setFilters}
              onClear={() => setFilters({})}
            />
          </div>
        )}

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            Market Overview ({selectedYear})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            <Card className="p-4 md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 hover:scale-[1.02] animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Market Revenue
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {numeral(marketStats.totalRevenue).format("0,0")}€
                </div>
                <p
                  className={`text-xs mt-1 ${
                    marketStats.revenueGrowth >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  } flex items-center`}
                >
                  {marketStats.revenueGrowth >= 0 ? (
                    <TrendingUp size={14} className="mr-1" />
                  ) : (
                    <TrendingUp
                      size={14}
                      className="mr-1 transform rotate-180 scale-x-[-1]"
                    />
                  )}
                  {isFinite(marketStats.revenueGrowth)
                    ? marketStats.revenueGrowth.toFixed(2)
                    : "N/A"}
                  % vs PY
                </p>
              </CardContent>
            </Card>

            <Card className="p-4 md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 hover:scale-[1.02] animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Employees
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {numeral(marketStats.totalEmployees).format("0,0")}
                </div>
                <p
                  className={`text-xs mt-1 ${
                    marketStats.employeeGrowth >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  } flex items-center`}
                >
                  {marketStats.employeeGrowth >= 0 ? (
                    <TrendingUp size={14} className="mr-1" />
                  ) : (
                    <TrendingUp
                      size={14}
                      className="mr-1 transform rotate-180 scale-x-[-1]"
                    />
                  )}
                  {isFinite(marketStats.employeeGrowth)
                    ? marketStats.employeeGrowth.toFixed(2)
                    : "N/A"}
                  % vs PY
                </p>
              </CardContent>
            </Card>

            <Card className="p-4 md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 hover:scale-[1.02] animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Company Revenue
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedYearData?.companyList.length
                    ? numeral(
                        marketStats.totalRevenue / selectedYearData.companyList.length
                      ).format("0,0")
                    : 0}
                  €
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  per company
                </p>
              </CardContent>
            </Card>

            <Card className="p-4 md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 hover:scale-[1.02] animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Team Size
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedYearData?.companyList.length
                    ? Math.round(
                        marketStats.totalEmployees /
                          selectedYearData.companyList.length
                      )
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  employees per company
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            Top Companies ({selectedYear})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
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

        <section className="mb-12">
          <Card className="md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 animate-slide-up">
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
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
          <Card className="md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 animate-slide-up">
            <CardHeader>
              <CardTitle id="all-companies-heading">All Companies ({selectedYear})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CompanyTable
                selectedYearData={selectedYearData}
                onCompanySelect={handleCompanySelect}
                selectedCompanies={selectedCompanies}
                onToggleCompany={handleToggleCompany}
              />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
