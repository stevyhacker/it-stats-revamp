import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, TrendingUp, Users, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import numeral from 'numeral';
import { data } from '../data';

interface CompanyPageProps {
  companyName: string;
  onClose: () => void;
}

export const CompanyPage = ({ companyName, onClose }: CompanyPageProps) => {
  const companyData = data
    .map(yearData => ({
      year: yearData.year,
      ...yearData.companyList.find(company => company.name === companyName)
    }))
    .filter(d => d.totalIncome !== undefined)
    .sort((a, b) => Number(a.year) - Number(b.year));

  const latestData = companyData[companyData.length - 1];
  const previousYearData = companyData[companyData.length - 2];

  const calculateGrowth = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100;
  };

  const growthMetrics = previousYearData ? {
    incomeGrowth: calculateGrowth(latestData.totalIncome, previousYearData.totalIncome),
    profitGrowth: calculateGrowth(latestData.profit, previousYearData.profit),
    employeeGrowth: calculateGrowth(latestData.employeeCount, previousYearData.employeeCount)
  } : null;

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 overflow-y-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{companyName}</h1>
            <p className="text-gray-500 dark:text-gray-400">Historical Performance Analysis</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to Overview
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="text-blue-500 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{numeral(latestData.totalIncome).format('0,0')}€</p>
                </div>
              </div>
              {growthMetrics && (
                <div className={`flex items-center ${growthMetrics.incomeGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {growthMetrics.incomeGrowth >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  <span className="ml-1">{Math.abs(growthMetrics.incomeGrowth).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="text-green-500 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Profit</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{numeral(latestData.profit).format('0,0')}€</p>
                </div>
              </div>
              {growthMetrics && (
                <div className={`flex items-center ${growthMetrics.profitGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {growthMetrics.profitGrowth >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  <span className="ml-1">{Math.abs(growthMetrics.profitGrowth).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="text-purple-500 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Employees</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{latestData.employeeCount}</p>
                </div>
              </div>
              {growthMetrics && (
                <div className={`flex items-center ${growthMetrics.employeeGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {growthMetrics.employeeGrowth >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  <span className="ml-1">{Math.abs(growthMetrics.employeeGrowth).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Wallet className="text-orange-500 mr-3" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Average Monthly Pay</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{numeral(latestData.averagePay).format('0,0')}€</p>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income & Profit Trends</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={companyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="year" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(17, 24, 39, 0.8)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                    formatter={(value) => numeral(value).format('0,0') + '€'} 
                  />
                  <Line type="monotone" dataKey="totalIncome" stroke="#3B82F6" name="Total Income" />
                  <Line type="monotone" dataKey="profit" stroke="#10B981" name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employee Count & Efficiency</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={companyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="year" stroke="#9CA3AF" />
                  <YAxis yAxisId="left" stroke="#9CA3AF" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(17, 24, 39, 0.8)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="employeeCount" stroke="#8B5CF6" name="Employees" />
                  <Line yAxisId="right" type="monotone" dataKey="incomePerEmployee" stroke="#F59E0B" name="Income per Employee" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Yearly Data Table */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <h3 className="text-lg font-semibold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">Historical Data</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Income</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employees</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Pay</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Income/Employee</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {companyData.reverse().map((yearData) => (
                  <tr key={yearData.year}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{yearData.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{numeral(yearData.totalIncome).format('0,0')}€</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{numeral(yearData.profit).format('0,0')}€</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{yearData.employeeCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{numeral(yearData.averagePay).format('0,0')}€</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{numeral(yearData.incomePerEmployee).format('0,0')}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};