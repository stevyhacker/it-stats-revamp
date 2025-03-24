import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { YearData } from '../types';
import numeral from 'numeral';

interface TrendLineChartProps {
  data: YearData[];
  selectedCompanies?: string[];
}

export const TrendLineChart = ({ data, selectedCompanies = [] }: TrendLineChartProps) => {
  const [metricType, setMetricType] = useState<'revenue' | 'employees' | 'profit'>('revenue');
  const years = data.map(d => d.year).sort();
  
  // Get a list of all companies that appear in any year
  const allCompanies = new Set<string>();
  data.forEach(yearData => {
    yearData.companyList.forEach(company => {
      allCompanies.add(company.name);
    });
  });
  
  // If no companies are selected, use the top 5 by latest year revenue
  const companiesForChart = selectedCompanies.length > 0 
    ? selectedCompanies 
    : [...allCompanies]
        .filter(name => data[0].companyList.some(c => c.name === name))
        .sort((a, b) => {
          const companyA = data[0].companyList.find(c => c.name === a);
          const companyB = data[0].companyList.find(c => c.name === b);
          return (companyB?.totalIncome || 0) - (companyA?.totalIncome || 0);
        })
        .slice(0, 5);
  
  // Prepare data for the chart
  const chartData = years.map(year => {
    const yearData = data.find(d => d.year === year);
    if (!yearData) return { year };
    
    const result: any = { year };
    
    companiesForChart.forEach(companyName => {
      const company = yearData.companyList.find(c => c.name === companyName);
      if (company) {
        if (metricType === 'revenue') {
          result[companyName] = company.totalIncome;
        } else if (metricType === 'employees') {
          result[companyName] = company.employeeCount;
        } else {
          result[companyName] = company.profit;
        }
      } else {
        result[companyName] = 0;
      }
    });
    
    return result;
  });

  // Random color generator for lines
  const getLineColor = (index: number) => {
    const colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B'];
    return colors[index % colors.length];
  };

  // Custom tooltip formatter
  const formatTooltipValue = (value: number) => {
    if (metricType === 'employees') {
      return value.toFixed(0);
    }
    return numeral(value).format('0,0') + '€';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {metricType === 'revenue' ? 'Revenue Trends' : metricType === 'employees' ? 'Employee Count Trends' : 'Profit Trends'}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setMetricType('revenue')}
            className={`px-3 py-1 text-sm rounded-md ${
              metricType === 'revenue' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setMetricType('employees')}
            className={`px-3 py-1 text-sm rounded-md ${
              metricType === 'employees' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Employees
          </button>
          <button
            onClick={() => setMetricType('profit')}
            className={`px-3 py-1 text-sm rounded-md ${
              metricType === 'profit' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Profit
          </button>
        </div>
      </div>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="year" 
              stroke="#9CA3AF" 
              angle={0} 
              tickMargin={10}
            />
            <YAxis 
              stroke="#9CA3AF" 
              tickFormatter={(value) => {
                if (metricType === 'employees') {
                  return value;
                }
                return value >= 1000000 
                  ? (value / 1000000).toFixed(1) + 'M' 
                  : (value / 1000).toFixed(0) + 'k';
              }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [formatTooltipValue(value), name]}
              contentStyle={{ 
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                border: 'none',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Legend verticalAlign="bottom" height={36} />
            {companiesForChart.map((company, index) => (
              <Line 
                key={company}
                type="monotone" 
                dataKey={company} 
                stroke={getLineColor(index)} 
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 