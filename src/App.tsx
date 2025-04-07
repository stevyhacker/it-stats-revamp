import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { Header } from "./components/Header";
import { CompanyCard } from "./components/CompanyCard";
// import { MarketShareTreemap } from "./components/MarketShareTreemap";
import { TrendLineChart } from "./components/TrendLineChart";
import { data as rawData } from "./data"; // Rename to avoid conflict
import { YearData, CompanyData } from "./types"; // Import types
import {
  Moon,
  Sun,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
} from "lucide-react";
import numeral from "numeral";
import CompanyTable from "./components/CompanyTable"; // Import the new component
import { CompanyPage } from "./components/CompanyPage"; // Re-import CompanyPage

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="fixed bottom-4 right-4 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun className="w-6 h-6 text-yellow-500" />
          ) : (
            <Moon className="w-6 h-6 text-gray-700" />
          )}
        </button>

        {/* Year Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto md:overflow-x-visible">
            <nav className="-mb-px flex space-x-8 px-4 md:px-0">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      selectedYear === year
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
                    }
                  `}
                >
                  {year}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Market Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Market Overview ({selectedYear})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3">
                <Building2 className="text-blue-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Market Revenue
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {numeral(marketStats.totalRevenue).format("0,0")}€
                  </p>
                  <div
                    className={`flex items-center mt-1 text-sm ${
                      marketStats.revenueGrowth >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {marketStats.revenueGrowth >= 0 ? (
                      <TrendingUp size={16} className="mr-1" />
                    ) : (
                      <TrendingUp
                        size={16}
                        className="mr-1 transform rotate-180"
                      />
                    )}
                    <span>{marketStats.revenueGrowth.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3">
                <Users className="text-purple-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Employees
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {numeral(marketStats.totalEmployees).format("0,0")}
                  </p>
                  <div className={`flex items-center mt-1 text-sm ${marketStats.employeeGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {marketStats.employeeGrowth >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingUp size={16} className="mr-1 transform rotate-180" />}
                    <span>{marketStats.employeeGrowth.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3">
                <Briefcase className="text-emerald-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average Company Revenue</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {numeral(marketStats.totalRevenue / selectedYearData!.companyList.length).format('0,0')}€
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3">
                <Users className="text-amber-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average Team Size</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {Math.round(marketStats.totalEmployees / selectedYearData!.companyList.length)}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Top Companies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
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

        {/* Market Share Treemap
        {selectedYearData && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Market Share Distribution ({selectedYear})
            </h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-96">
              <MarketShareTreemap companies={selectedYearData.companyList} />
            </div>
          </section>
        )} */}

         {/* Revenue Trend Line Chart */}
         <section className="mb-12">
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
             Trends Over Years
           </h2>
           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md" style={{  }}>
              <TrendLineChart data={data} selectedYear={selectedYear} />
           </div>
         </section>

        {/* All Companies Table */}
        <section className="mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                All Companies ({selectedYear})
              </h2>
            </div>
            <div className="overflow-x-auto relative">
              <CompanyTable
                selectedYearData={selectedYearData} // Pass the data for the selected year
                onCompanySelect={handleCompanySelect} // Pass the navigation handler
              />
            </div>
          </div>
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
              data={data} // Pass the full data
            />
          }
        />
        <Route path="/company/:companyName" element={<CompanyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
