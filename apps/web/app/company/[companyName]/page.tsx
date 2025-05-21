"use client";

import { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { useRouter, useParams, useSearchParams } from 'next/navigation'; // Use Next.js router, Added useSearchParams
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, TrendingUp, Users, Wallet, ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react';
import numeral from 'numeral';
// import { data } from '@/data'; // REMOVED hardcoded data import
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import type { CompanyData } from '@/types'; // Adjust path if needed

// Define data structure for company year data
interface CompanyYearData {
  year: string; // Will be derived from yearValue
  // name: string; // Name will be part of each year's data from API
  totalIncome?: number;
  profit?: number;
  employeeCount?: number;
  averagePay?: number;
  incomePerEmployee?: number;
  // Add other fields from API if necessary, e.g., pib, maticniBroj
  websiteUrl?: string | null;
  companyDescription?: string | null;
}

// Interface for the raw API response item
interface ApiCompanyYearData {
  yearValue: number;
  name: string;
  totalIncome: number;
  profit: number;
  employeeCount: number;
  averagePay?: number; // Assuming API might not always provide this
  websiteUrl?: string | null;
  companyDescription?: string | null;
  // Add other fields from API like pib, maticniBroj if they exist in the response
}

// Define structure for sorting configuration
interface SortConfig {
  key: keyof CompanyYearData | null;
  direction: 'ascending' | 'descending';
}

// The Page Component
const CompanyPage = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const companyName = params.companyName;
  const decodedCompanyName = decodeURIComponent(companyName as string);
  const pib = searchParams.get('pib');

  const [companyHistoricalData, setCompanyHistoricalData] = useState<CompanyYearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for table sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'year', direction: 'ascending' });

  useEffect(() => {
    // Dark mode effect from original code, ensuring useEffect is imported
    if (typeof window !== 'undefined') {
      const darkMode = localStorage.getItem("darkMode") === "true";
      setIsDark(darkMode); // setIsDark should be defined, see below
      if (darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []); // Empty dependency array for one-time effect

  useEffect(() => {
    if (pib) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/companies/${pib}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch company data. Status: ${response.status}`);
          }
          const rawData: ApiCompanyYearData[] = await response.json();
          
          const processedData: CompanyYearData[] = rawData.map(item => {
            const totalIncome = Number(item.totalIncome) || undefined;
            const profit = Number(item.profit) || undefined;
            const employeeCount = Number(item.employeeCount) || undefined;
            const averagePay = item.averagePay != null ? Number(item.averagePay) : undefined;
            const incomePerEmployee = (employeeCount && employeeCount !== 0 && totalIncome) 
                                      ? totalIncome / employeeCount 
                                      : undefined;
            return {
              year: item.yearValue.toString(),
              // name: item.name, // Name is part of ApiCompanyYearData, not directly in CompanyYearData for the table structure
              totalIncome,
              profit,
              employeeCount,
              averagePay,
              incomePerEmployee,
              websiteUrl: item.websiteUrl,
              companyDescription: item.companyDescription,
            };
          }).sort((a, b) => parseInt(a.year) - parseInt(b.year)); // Sort by year ascending

          setCompanyHistoricalData(processedData);
        } catch (err) {
          setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setError("PIB is missing from URL parameters.");
      setLoading(false);
    }
  }, [pib]);

  // Function to handle sorting
  const handleSort = (key: keyof CompanyYearData) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Sort data based on current sort configuration
  const sortedData = useMemo(() => {
    let sortableItems = [...companyHistoricalData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        // Ensure values are numbers for comparison, default to 0 if undefined/null
        const numA = typeof aValue === 'number' ? aValue : 0;
        const numB = typeof bValue === 'number' ? bValue : 0;

        if (numA < numB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (numA > numB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [companyHistoricalData, sortConfig]);

  // Calculate key metrics for the latest year - use ?. for safety
  const latestYearData = companyHistoricalData[companyHistoricalData.length - 1]; // Might be undefined if no data
  const previousYearData = companyHistoricalData[companyHistoricalData.length - 2]; // Might be undefined

  // Change formatCurrency to display full numbers with EUR symbol at the end
  const formatCurrency = (value: number | undefined) => value ? `${numeral(value).format('0,0')}€` : 'N/A';
  const formatNumber = (value: number | undefined) => value ? numeral(value).format('0,0') : 'N/A';
  const formatPercentage = (value: number | undefined) => value ? `${numeral(value * 100).format('0.0')}%` : 'N/A';

  const calculateGrowth = (current: number | undefined, previous: number | undefined): number | undefined => {
    if (previous && current && previous !== 0) {
      return (current - previous) / previous;
    }
    return undefined;
  };

  // Use optional chaining (?.) for safer calculations
  const revenueGrowth = calculateGrowth(latestYearData?.totalIncome, previousYearData?.totalIncome);
  const profitGrowth = calculateGrowth(latestYearData?.profit, previousYearData?.profit);
  const employeeGrowth = calculateGrowth(latestYearData?.employeeCount, previousYearData?.employeeCount);
  // Use nullish coalescing (??) for safe division
  const profitMargin = (latestYearData?.totalIncome && latestYearData.totalIncome !== 0)
     ? (latestYearData.profit ?? 0) / latestYearData.totalIncome
     : undefined;

  // Define table columns
  const columns: { key: keyof CompanyYearData; label: string; format?: (value: any) => string }[] = [
    { key: 'year', label: 'Year' },
    { key: 'totalIncome', label: 'Total Income', format: formatCurrency },
    { key: 'profit', label: 'Profit', format: formatCurrency },
    { key: 'employeeCount', label: 'Employees', format: formatNumber },
    { key: 'averagePay', label: 'Avg. Pay', format: formatCurrency },
    { key: 'incomePerEmployee', label: 'Income/Employee', format: formatCurrency },
  ];

  // Add dark mode state
  const [isDark, setIsDark] = useState(false); // Initialized to false, useEffect will update

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8 text-foreground">
        <p>Loading company data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-foreground">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="absolute top-6 left-6 z-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="text-red-500">Error: {error}</p>
        <p>Could not load data for {decodedCompanyName}.</p>
      </div>
    );
  }

  if (companyHistoricalData.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-foreground">
         <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="absolute top-6 left-6 z-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        <p>No data available for {decodedCompanyName}.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-neu-dark-base text-neu-dark-text" : "bg-neu-base text-neu-text"} p-4 sm:p-6 lg:p-8 transition-colors duration-200`}>
      <div className="relative max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="absolute top-0 left-0 z-10 text-current" // Ensure text color matches theme
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{decodedCompanyName}</h1>
          {/* Website URL - Placed below company name */}
          {latestYearData?.websiteUrl && (
            <a
              href={latestYearData.websiteUrl.startsWith('http') ? latestYearData.websiteUrl : `http://${latestYearData.websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-blue-500 dark:text-blue-400 hover:underline mb-2 inline-block ${
                isDark ? "hover:text-blue-300" : "hover:text-blue-600"
              }`}
            >
              Visit Website
            </a>
          )}
          <p className="text-muted-foreground">Historical Performance Analysis</p>
        </div>

        {/* About the Company Section */}
        {latestYearData?.companyDescription && (
          <Card className={`mb-8 p-4 md:p-6 rounded-xl ${isDark ? "bg-neu-dark-base" : "bg-white"} shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200`}>
            <CardHeader>
              <CardTitle>About {decodedCompanyName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm md:text-base leading-relaxed">{latestYearData.companyDescription}</p>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics Summary - Use ?. and ?? for safety */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Revenue Card */}
          <Card className={`p-4 md:p-6 rounded-xl ${
              isDark ? "bg-neu-dark-base" : "bg-white"
            } shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200 transform hover:scale-[1.02]`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue ({latestYearData?.year ?? 'N/A'})</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(latestYearData?.totalIncome)}</div>
              {revenueGrowth !== undefined && (
                <p className={`text-xs ${revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                  {revenueGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {formatPercentage(revenueGrowth)} vs PY
                </p>
              )}
            </CardContent>
          </Card>

          {/* Profit Card */}
          <Card className={`p-4 md:p-6 rounded-xl ${
              isDark ? "bg-neu-dark-base" : "bg-white"
            } shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200 transform hover:scale-[1.02]`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit ({latestYearData?.year ?? 'N/A'})</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(latestYearData?.profit)}</div>
              {profitGrowth !== undefined && (
                <p className={`text-xs ${profitGrowth >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                  {profitGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {formatPercentage(profitGrowth)} vs PY
                </p>
              )}
            </CardContent>
          </Card>

          {/* Employees Card */}
          <Card className={`p-4 md:p-6 rounded-xl ${
              isDark ? "bg-neu-dark-base" : "bg-white"
            } shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200 transform hover:scale-[1.02]`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees ({latestYearData?.year ?? 'N/A'})</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(latestYearData?.employeeCount)}</div>
              {employeeGrowth !== undefined && (
                <p className={`text-xs ${employeeGrowth >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                  {employeeGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {formatPercentage(employeeGrowth)} vs PY
                </p>
              )}
            </CardContent>
          </Card>

          {/* Profit Margin Card */}
          <Card className={`p-4 md:p-6 rounded-xl ${
              isDark ? "bg-neu-dark-base" : "bg-white"
            } shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200 transform hover:scale-[1.02]`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin ({latestYearData?.year ?? 'N/A'})</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(profitMargin)}</div>
              <p className="text-xs text-muted-foreground">Profit / Total Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends Chart */}
        <Card className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-neu-dark-base" : "bg-white"} shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200 transform hover:scale-[1.02]`}>
          <CardHeader>
            <CardTitle>Financial Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {companyHistoricalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={companyHistoricalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#444" : "#ccc"} />
                  <XAxis dataKey="year" stroke={isDark ? "#999" : "#666"} />
                  <YAxis yAxisId="left" tickFormatter={(value) => numeral(value).format('0a')} stroke={isDark ? "#999" : "#666"} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => numeral(value).format('0,0')} stroke={isDark ? "#999" : "#666"} />
                  <Tooltip 
                    formatter={(value: number, name) => [
                      name === 'employeeCount' ? numeral(value).format('0,0') : numeral(value).format('0,0a'),
                      name === 'totalIncome' ? 'Total Income' : name === 'profit' ? 'Profit' : 'Employees'
                    ]} 
                    contentStyle={isDark ? { backgroundColor: '#333', border: 'none' } : {}}
                    labelStyle={isDark ? { color: '#fff' } : {}}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="totalIncome" stroke="#8884d8" strokeWidth={2} name="Total Income" dot={{ r: 3, fill: isDark ? "#6660A0" : "#8884d8" }} activeDot={{ r: 5 }} />
                  <Line yAxisId="left" type="monotone" dataKey="profit" stroke="#82ca9d" strokeWidth={2} name="Profit" dot={{ r: 3, fill: isDark ? "#5E9073" : "#82ca9d" }} activeDot={{ r: 5 }} />
                  <Line yAxisId="right" type="monotone" dataKey="employeeCount" stroke="#ffc658" strokeWidth={2} name="Employees" dot={{ r: 3, fill: isDark ? "#B08D3E" : "#ffc658" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>Not enough data to display trends.</p>
            )}
          </CardContent>
        </Card>

        {/* Historical Data Table */}
        <Card className={`p-4 mt-12 md:p-6 rounded-xl ${isDark ? "bg-neu-dark-base" : "bg-white"} shadow-neu-light-convex dark:shadow-neu-dark-convex border border-transparent dark:hover:border-neutral-700 hover:border-neutral-300 transition-all duration-200 transform hover:scale-[1.02]`}>
          <CardHeader>
            <CardTitle>Historical Data ({decodedCompanyName})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key} onClick={() => handleSort(column.key)} className="cursor-pointer">
                      {column.label}
                      {sortConfig.key === column.key ? (
                        sortConfig.direction === 'ascending' ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                      ) : null}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row) => (
                  <TableRow key={row.year}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {/* Use nullish coalescing for default value */}
                        {column.format ? column.format(row[column.key]) : row[column.key] ?? 'N/A'}
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
};
export default CompanyPage;
