import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
// import { Header } from "./components/Header"; // Keep for now, might be replaced later
import { CompanyCard } from "./components/CompanyCard";
import { TrendLineChart } from "./components/TrendLineChart";
import { data as rawData } from "./data";
import { YearData, CompanyData } from "./types";
import {
  Moon,
  Sun,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
} from "lucide-react";
import numeral from "numeral";
import CompanyTable from "./components/CompanyTable";
import { CompanyPage } from "./components/CompanyPage";
import { Button } from "@/components/ui/button"; 
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"; 

// Cast rawData to the correct type
const data: YearData[] = rawData as YearData[];

// Main Dashboard Component
function Dashboard({
  years,
  selectedYear,
  setSelectedYear,
  isDark,
  toggleDarkMode,
  data,
}: {
  years: string[];
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  isDark: boolean;
  toggleDarkMode: () => void;
  data: YearData[];
}) {
  const navigate = useNavigate();

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
      (sum, company) => sum + company.totalIncome,
      0
    );
    const currentEmployees = selectedYearData.companyList.reduce(
      (sum, company) => sum + company.employeeCount,
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
      (sum, company) => sum + company.totalIncome,
      0
    );
    const previousEmployees = previousYearData.companyList.reduce(
      (sum, company) => sum + company.employeeCount,
      0
    );

    return {
      totalRevenue: currentTotal,
      revenueGrowth: previousTotal === 0 ? 0 : ((currentTotal - previousTotal) / previousTotal) * 100,
      totalEmployees: currentEmployees,
      employeeGrowth: previousEmployees === 0 ? 0 : ((currentEmployees - previousEmployees) / previousEmployees) * 100,
    };
  };

  const marketStats = calculateMarketStats();

  // Handle company selection for navigation
  const handleCompanySelect = (companyName: string) => {
    navigate(`/company/${encodeURIComponent(companyName)}`);
  };

  // Sort companies by total income
  const topCompanies = selectedYearData
    ? [...selectedYearData.companyList]
        .sort((a, b) => b.totalIncome - a.totalIncome)
        .slice(0, 6)
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* <Header /> Maybe replace later */} 

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dark Mode Toggle using shadcn Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleDarkMode}
          className="fixed bottom-4 right-4 z-50"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Year Tabs using shadcn Tabs */}
        <Tabs value={selectedYear} onValueChange={setSelectedYear} className="mb-8">
          <TabsList className="overflow-x-auto h-auto p-1 md:overflow-x-visible justify-start">
            {years.map((year) => (
              <TabsTrigger key={year} value={year} className="whitespace-nowrap">
                {year}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Market Overview using shadcn Card */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            Market Overview ({selectedYear})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Market Revenue
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {numeral(marketStats.totalRevenue).format("0,0")}€
                </div>
                <p className={`text-xs mt-1 ${ marketStats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500" } flex items-center`}>
                   {marketStats.revenueGrowth >= 0 ? (
                      <TrendingUp size={14} className="mr-1" />
                    ) : (
                      <TrendingUp size={14} className="mr-1 transform rotate-180 scale-x-[-1]" /> 
                    )}
                  {marketStats.revenueGrowth.toFixed(2)}% vs PY
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {numeral(marketStats.totalEmployees).format("0,0")}
                </div>
                 <p className={`text-xs mt-1 ${ marketStats.employeeGrowth >= 0 ? "text-green-500" : "text-red-500" } flex items-center`}>
                   {marketStats.employeeGrowth >= 0 ? (
                      <TrendingUp size={14} className="mr-1" />
                    ) : (
                      <TrendingUp size={14} className="mr-1 transform rotate-180 scale-x-[-1]" /> 
                    )}
                  {marketStats.employeeGrowth.toFixed(2)}% vs PY
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Company Revenue</CardTitle>
                 <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 <div className="text-2xl font-bold">
                    {selectedYearData?.companyList.length
                       ? numeral(marketStats.totalRevenue / selectedYearData.companyList.length).format('0,0')
                       : 0}€
                 </div>
                 <p className="text-xs text-muted-foreground mt-1">per company</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Team Size</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedYearData?.companyList.length
                     ? Math.round(marketStats.totalEmployees / selectedYearData.companyList.length)
                     : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">employees per company</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Top Companies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Top Companies
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topCompanies.map((company) => (
              <CompanyCard
                key={company.name}
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

         {/* Revenue Trend Line Chart using shadcn Card */}
         <section className="mb-12">
           <Card>
             <CardHeader>
                <CardTitle>Trends Over Years</CardTitle>
             </CardHeader>
             <CardContent>
                <TrendLineChart data={data} selectedYear={selectedYear} />
             </CardContent>
           </Card>
         </section>

        {/* All Companies Table using shadcn Card */}
        <section className="mb-12">
          <Card>
            <CardHeader>
               <CardTitle>All Companies ({selectedYear})</CardTitle>
            </CardHeader>
            <CardContent>
               {/* The CompanyTable component itself handles layout now */}
               <CompanyTable
                selectedYearData={selectedYearData}
                onCompanySelect={handleCompanySelect}
               />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

function App() {
  const years = data.map((d) => d.year).sort((a, b) => b.localeCompare(a));
  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      document.documentElement.classList.toggle("dark", e.matches);
    };

    // Add listener using addEventListener for modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }


    return () => {
       if (mediaQuery.removeEventListener) {
            mediaQuery.removeEventListener('change', handleChange);
        } else {
            // Fallback for older browsers
            mediaQuery.removeListener(handleChange);
        }
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };


  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              years={years}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              isDark={isDark}
              toggleDarkMode={toggleDarkMode}
              data={data} 
            />
          }
        />
        <Route path="/company/:companyName" element={<CompanyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
