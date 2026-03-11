"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Building2, TrendingUp, Users, Wallet, ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, ArrowLeft } from "lucide-react";
import numeral from "numeral";
import { companyData } from "@/lib/company-data";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { CompanyData } from "@/types";

interface CompanyYearData {
  year: string;
  name: string;
  totalIncome?: number;
  profit?: number;
  employeeCount?: number;
  averagePay?: number;
  incomePerEmployee?: number;
}

interface SortConfig {
  key: keyof CompanyYearData | null;
  direction: "ascending" | "descending";
}

export function CompanyPage({ companyName }: { companyName: string }) {
  const router = useRouter();

  const companyHistoricalData: CompanyYearData[] = useMemo(
    () =>
      companyData
        .flatMap((yearData) => {
          const foundCompany = yearData.companyList.find((company) => company.name === companyName);
          if (!foundCompany) {
            return [];
          }

          const company = foundCompany as CompanyData;
          const totalIncome = company.totalIncome != null ? Number(company.totalIncome) : undefined;
          const profit = company.profit != null ? Number(company.profit) : undefined;
          const employeeCount = company.employeeCount != null ? Number(company.employeeCount) : undefined;
          const averagePay = company.averagePay != null ? Number(company.averagePay) : undefined;
          const incomePerEmployee = employeeCount && employeeCount !== 0 && totalIncome ? totalIncome / employeeCount : undefined;

          return [
            {
              year: yearData.year,
              name: company.name,
              totalIncome,
              profit,
              employeeCount,
              averagePay,
              incomePerEmployee,
            },
          ];
        })
        .sort((a, b) => parseInt(a.year, 10) - parseInt(b.year, 10)),
    [companyName],
  );

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "year", direction: "ascending" });

  const handleSort = (key: keyof CompanyYearData) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    const items = [...companyHistoricalData];
    if (sortConfig.key === null) {
      return items;
    }

    const getNumeric = (row: CompanyYearData) => {
      if (sortConfig.key === "year") {
        return parseInt(row.year, 10) || 0;
      }
      const value = row[sortConfig.key];
      if (typeof value === "number") {
        return value;
      }
      return value != null ? Number(value) || 0 : 0;
    };

    items.sort((a, b) => {
      const aNum = getNumeric(a);
      const bNum = getNumeric(b);
      if (aNum < bNum) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aNum > bNum) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
    return items;
  }, [companyHistoricalData, sortConfig]);

  const latestYearData = companyHistoricalData[companyHistoricalData.length - 1];
  const previousYearData = companyHistoricalData[companyHistoricalData.length - 2];

  const formatCurrency = (value: number | undefined) => (value ? `${numeral(value).format("0,0")}€` : "N/A");
  const formatNumber = (value: number | undefined) => (value ? numeral(value).format("0,0") : "N/A");
  const formatPercentage = (value: number | undefined) => (value ? `${numeral(value * 100).format("0.0")}%` : "N/A");

  const calculateGrowth = (current: number | undefined, previous: number | undefined): number | undefined => {
    if (previous && current && previous !== 0) {
      return (current - previous) / previous;
    }
    return undefined;
  };

  const revenueGrowth = calculateGrowth(latestYearData?.totalIncome, previousYearData?.totalIncome);
  const profitGrowth = calculateGrowth(latestYearData?.profit, previousYearData?.profit);
  const employeeGrowth = calculateGrowth(latestYearData?.employeeCount, previousYearData?.employeeCount);
  const profitMargin =
    latestYearData?.totalIncome && latestYearData.totalIncome !== 0
      ? (latestYearData.profit ?? 0) / latestYearData.totalIncome
      : undefined;

  const columns: { key: keyof CompanyYearData; label: string; format?: (value: any) => string }[] = [
    { key: "year", label: "Year" },
    { key: "totalIncome", label: "Total Income", format: formatCurrency },
    { key: "profit", label: "Profit", format: formatCurrency },
    { key: "employeeCount", label: "Employees", format: formatNumber },
    { key: "averagePay", label: "Avg. Pay", format: formatCurrency },
    { key: "incomePerEmployee", label: "Income/Employee", format: formatCurrency },
  ];

  if (companyHistoricalData.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8 text-foreground">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute top-6 left-6 z-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p>No data available for {companyName}.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="relative max-w-7xl mx-auto">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute top-0 left-0 z-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="text-center mb-12 pt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{companyName}</h1>
          <p className="text-muted-foreground">Historical Performance Analysis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-4 md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 hover:scale-[1.02] animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue ({latestYearData?.year ?? "N/A"})</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(latestYearData?.totalIncome)}</div>
              {revenueGrowth !== undefined && (
                <p className={`text-xs ${revenueGrowth >= 0 ? "text-green-500" : "text-red-500"} flex items-center`}>
                  {revenueGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {formatPercentage(revenueGrowth)} vs PY
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="p-4 md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 hover:scale-[1.02] animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit ({latestYearData?.year ?? "N/A"})</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(latestYearData?.profit)}</div>
              {profitGrowth !== undefined && (
                <p className={`text-xs ${profitGrowth >= 0 ? "text-green-500" : "text-red-500"} flex items-center`}>
                  {profitGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {formatPercentage(profitGrowth)} vs PY
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="p-4 md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 hover:scale-[1.02] animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees ({latestYearData?.year ?? "N/A"})</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(latestYearData?.employeeCount)}</div>
              {employeeGrowth !== undefined && (
                <p className={`text-xs ${employeeGrowth >= 0 ? "text-green-500" : "text-red-500"} flex items-center`}>
                  {employeeGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {formatPercentage(employeeGrowth)} vs PY
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="p-4 md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 hover:scale-[1.02] animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin ({latestYearData?.year ?? "N/A"})</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(profitMargin)}</div>
              <p className="text-xs text-muted-foreground">Profit / Total Revenue</p>
            </CardContent>
          </Card>
        </div>

        <Card className="p-4 md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 animate-slide-up">
          <CardHeader>
            <CardTitle>Financial Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={companyHistoricalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" tickFormatter={(value) => numeral(value).format("0a")} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => numeral(value).format("0,0")} />
                <Tooltip
                  formatter={(value: number, name) => [
                    name === "Employees" ? numeral(value).format("0,0") : `${numeral(value).format("0,0")}€`,
                    name,
                  ]}
                />
                <Line yAxisId="left" type="monotone" dataKey="totalIncome" stroke="#8884d8" strokeWidth={2} name="Total Income" dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="profit" stroke="#82ca9d" strokeWidth={2} name="Profit" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="employeeCount" stroke="#ffc658" strokeWidth={2} name="Employees" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="p-4 mt-12 md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 animate-slide-up">
          <CardHeader>
            <CardTitle>Historical Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      onClick={() => handleSort(column.key)}
                      aria-sort={sortConfig.key === column.key ? (sortConfig.direction === "ascending" ? "ascending" : "descending") : "none"}
                      className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-all duration-300 font-semibold text-xs uppercase tracking-wider rounded-t-md"
                    >
                      {column.label}
                      {sortConfig.key === column.key ? (
                        sortConfig.direction === "ascending" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                      ) : null}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row) => (
                  <TableRow key={row.year} className="hover:bg-gradient-to-r hover:from-primary/5 hover:via-chart-1/3 hover:to-primary/5 hover:border-l-4 hover:border-l-primary/60 transition-all duration-300 group relative overflow-hidden">
                    {columns.map((column, cellIndex) => (
                      <TableCell
                        key={column.key}
                        className="group-hover:text-foreground/90 group-hover:font-medium transition-all duration-300 relative z-10"
                        style={{ "--cell-index": cellIndex } as CSSProperties}
                      >
                        {column.format ? column.format(row[column.key]) : row[column.key] ?? "N/A"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
