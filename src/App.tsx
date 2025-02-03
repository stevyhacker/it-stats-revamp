import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CompanyCard } from './components/CompanyCard';
import { Charts } from './components/Charts';
import { CompanyPage } from './components/CompanyPage';
import { data, calculateGrowth, calculateEfficiency } from './data';
import { Moon, Sun, TrendingUp, Users, Building2, Briefcase } from 'lucide-react';
import numeral from 'numeral';

function App() {
  const years = data.map(d => d.year).sort((a, b) => b.localeCompare(a));
  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      document.documentElement.classList.toggle('dark', e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const selectedYearData = data.find(d => d.year === selectedYear);
  const previousYearData = data.find(d => d.year === years[years.indexOf(selectedYear) + 1]);
  const growthData = calculateGrowth(data);
  const efficiencyData = calculateEfficiency(selectedYearData!);

  // Calculate market statistics
  const calculateMarketStats = () => {
    const currentTotal = selectedYearData!.companyList.reduce((sum, company) => sum + company.totalIncome, 0);
    const currentEmployees = selectedYearData!.companyList.reduce((sum, company) => sum + company.employeeCount, 0);
    
    if (!previousYearData) {
      return {
        totalRevenue: currentTotal,
        revenueGrowth: 0,
        totalEmployees: currentEmployees,
        employeeGrowth: 0
      };
    }

    const previousTotal = previousYearData.companyList.reduce((sum, company) => sum + company.totalIncome, 0);
    const previousEmployees = previousYearData.companyList.reduce((sum, company) => sum + company.employeeCount, 0);

    return {
      totalRevenue: currentTotal,
      revenueGrowth: ((currentTotal - previousTotal) / previousTotal) * 100,
      totalEmployees: currentEmployees,
      employeeGrowth: ((currentEmployees - previousEmployees) / previousEmployees) * 100
    };
  };

  const marketStats = calculateMarketStats();

  // Sort companies by total income
  const topCompanies = [...selectedYearData!.companyList]
    .sort((a, b) => b.totalIncome - a.totalIncome)
    .slice(0, 6);

  if (selectedCompany) {
    return <CompanyPage companyName={selectedCompany} onClose={() => setSelectedCompany(null)} />;
  }

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
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${selectedYear === year
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Market Revenue</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {numeral(marketStats.totalRevenue).format('0,0')}€
                  </p>
                  <div className={`flex items-center mt-1 text-sm ${marketStats.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {marketStats.revenueGrowth >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingUp size={16} className="mr-1 transform rotate-180" />}
                    <span>{marketStats.revenueGrowth.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3">
                <Users className="text-purple-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {numeral(marketStats.totalEmployees).format('0,0')}
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
                <Briefcase className="text-green-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Companies</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedYearData!.companyList.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3">
                <Building2 className="text-orange-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average Revenue per Company</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {numeral(marketStats.totalRevenue / selectedYearData!.companyList.length).format('0,0')}€
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Top Performing Companies ({selectedYear})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topCompanies.map(company => (
              <CompanyCard
                key={company.name}
                name={company.name}
                totalIncome={company.totalIncome}
                profit={company.profit}
                employeeCount={company.employeeCount}
                averagePay={company.averagePay}
                onClick={() => setSelectedCompany(company.name)}
              />
            ))}
          </div>
        </section>

        <section className="mb-12">
          <Charts growthData={growthData} efficiencyData={efficiencyData} />
        </section>

        {/* Companies Table */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">All Companies ({selectedYear})</h2>
          </div>
          <div className="overflow-x-auto relative">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                    Company Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                    Total Income
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                    Profit
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                    Employees
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                    Avg Monthly Pay
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                    Income/Employee
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {selectedYearData!.companyList
                  .sort((a, b) => b.totalIncome - a.totalIncome)
                  .map((company) => (
                    <tr 
                      key={company.name}
                      onClick={() => setSelectedCompany(company.name)}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {company.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {numeral(company.totalIncome).format('0,0')}€
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {numeral(company.profit).format('0,0')}€
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {company.employeeCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {numeral(company.averagePay).format('0,0')}€
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {numeral(company.incomePerEmployee).format('0,0')}€
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;