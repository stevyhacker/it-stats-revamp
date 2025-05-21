"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { CompanyCard } from "./CompanyCard";
import { TrendLineChart } from "./TrendLineChart";
import {
  Moon,
  Sun,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
} from "lucide-react";
import numeral from "numeral";
import CompanyTable from "./CompanyTable";
import { Button } from "@/components/ui/button"; 
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 

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

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });
  const [selectedYear, setSelectedYear] = useState<string>(years[0] || "");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  const selectedYearData = data.find((d) => d.year === selectedYear);
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

  const handleCompanySelect = (companyName: string, pib: string) => {
    router.push(`/company/${encodeURIComponent(companyName)}?pib=${pib}`);
  };

  return (
    <div
      className={`min-h-screen text-foreground transition-colors duration-200 ${
        isDark ? "bg-neu-dark-base" : "bg-neu-light-base"
      }`}
    >
      <main className="relative max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleDarkMode}
          className={`fixed bottom-8 right-8 z-50 rounded-full shadow-neu-light-convex dark:shadow-neu-dark-convex ${
            isDark ? "bg-neu-dark-base" : "bg-neu-light-base"
          } border-none hover:bg-opacity-80`}
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Year Selection - Conditional Rendering */}
        <div className="mb-8">
          {/* Tabs for Medium and Up */}
          <Tabs
            value={selectedYear}
            onValueChange={setSelectedYear}
            className="hidden md:block" // Hide on small screens
          >
            <TabsList
              className={`overflow-x-auto h-auto p-1 md:overflow-x-visible justify-start rounded-lg shadow-neu-light-inset dark:shadow-neu-dark-inset ${
                isDark ? "bg-neu-dark-base" : "bg-neu-light-base"
              }`}
            >
              {years.map((year) => (
                <TabsTrigger
                  key={year}
                  value={year}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out relative 
                            ${
                              isDark
                                ? "text-gray-300"
                                : "text-gray-700"
                            } 
                            data-[state=active]:${
                              isDark
                                ? "bg-neu-dark-base text-white"
                                : "bg-neu-light-base text-black"
                            } 
                            data-[state=active]:shadow-neu-light-convex dark:data-[state=active]:shadow-neu-dark-convex 
                            hover:bg-opacity-70 
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                >
                  {year}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Select Dropdown for Small Screens */}
          <div className="block md:hidden"> {/* Show only on small screens */}
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className={`w-full rounded-lg shadow-neu-light-convex dark:shadow-neu-dark-convex border-none px-4 py-2 text-sm font-medium ${ isDark ? "bg-neu-dark-base text-gray-300" : "bg-neu-light-base text-gray-700" }`}>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className={`rounded-lg shadow-neu-light-convex dark:shadow-neu-dark-convex border-none ${ isDark ? "bg-neu-dark-base" : "bg-neu-light-base" }`}>
                {years.map((year) => (
                  <SelectItem
                    key={year}
                    value={year}
                    className={`cursor-pointer px-4 py-2 ${ isDark ? "text-gray-300 hover:bg-gray-700 data-[state=checked]:bg-gray-600" : "text-gray-700 hover:bg-gray-200 data-[state=checked]:bg-gray-300" }`}
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            Market Overview ({selectedYear})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            <Card
              className={`p-4 md:p-6 rounded-xl ${
                isDark ? "bg-neu-dark-base" : "bg-white"
              } shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200 transform hover:scale-[1.02]`}
            >
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

            <Card
              className={`p-4 md:p-6 rounded-xl ${
                isDark ? "bg-neu-dark-base" : "bg-white"
              } shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200 transform hover:scale-[1.02]`}
            >
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

            <Card
              className={`p-4 md:p-6 rounded-xl ${
                isDark ? "bg-neu-dark-base" : "bg-white"
              } shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200 transform hover:scale-[1.02]`}
            >
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

            <Card
              className={`p-4 md:p-6 rounded-xl ${
                isDark ? "bg-neu-dark-base" : "bg-white"
              } shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200 transform hover:scale-[1.02]`}
            >
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
                onClick={() => handleCompanySelect(company.name, company.pib)}
                isDark={isDark} // Pass isDark prop
              />
            ))}
          </div>
        </section>

        <section className="mb-12">
          <Card
            className={`md:p-6 rounded-xl ${
              isDark ? "bg-neu-dark-base" : "bg-white"
            } shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200 transform hover:scale-[1.02]`}
          >
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={data} // Pass the full data (containing all years)
                selectedYear={selectedYear} // Pass the currently selected year
                isDark={isDark} // Pass isDark prop
              />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="all-companies-heading">
          <Card className={`md:p-6 rounded-xl ${
              isDark ? "bg-neu-dark-base" : "bg-white"
            } shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200 transform hover:scale-[1.02]`}>
            <CardHeader>
              <CardTitle id="all-companies-heading">All Companies ({selectedYear})</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyTable
                selectedYearData={selectedYearData} 
                onCompanySelect={handleCompanySelect} 
                isDark={isDark} // Pass isDark prop
              />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
