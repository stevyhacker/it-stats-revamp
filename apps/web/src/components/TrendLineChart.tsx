import React, { useState, useMemo } from 'react';
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
  selectedYear: string;
}

export const TrendLineChart = ({ data, selectedCompanies = [], selectedYear }: TrendLineChartProps) => {
  const [metricType, setMetricType] = useState<'revenue' | 'employees' | 'profit'>('revenue');
  
  // Filter data up to the selected year
  const filteredData = useMemo(() => {
    const numericSelectedYear = parseInt(selectedYear, 10); // Parse selectedYear to number
    return data.filter(yearData => parseInt(yearData.year, 10) <= numericSelectedYear); // Parse yearData.year
  }, [data, selectedYear]);

  // Determine the companies to display on the chart
  const companiesForChart = useMemo(() => {
    if (selectedCompanies.length > 0) {
      return selectedCompanies;
    }

    if (filteredData.length === 0) {
      return [];
    }

    // Find the latest year's data in the filtered set
    const latestYearData = filteredData.reduce((latest, current) => 
      parseInt(current.year, 10) > parseInt(latest.year, 10) ? current : latest
    );

    // Sort companies from the latest year based on the selected metric
    const sortedCompanies = [...latestYearData.companyList].sort((a, b) => {
      let valueA = 0;
      let valueB = 0;

      if (metricType === 'revenue') {
        valueA = a.totalIncome;
        valueB = b.totalIncome;
      } else if (metricType === 'employees') {
        valueA = a.employeeCount;
        valueB = b.employeeCount;
      } else { // profit
        valueA = a.profit;
        valueB = b.profit;
      }
      return valueB - valueA; // Descending order
    });

    // Return the names of the top 5 companies
    return sortedCompanies.slice(0, 5).map(company => company.name);

  }, [selectedCompanies, filteredData, metricType]);

  // Prepare data for the chart
  const chartData = useMemo(() => {
    return filteredData
      .map(yearData => { // Use filteredData here
        const result: { year: number; [key: string]: number } = { year: parseInt(yearData.year, 10) }; // Parse yearData.year
        
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
      })
      .sort((a, b) => a.year - b.year); // Sort by year ascending

  }, [filteredData, companiesForChart, metricType]);

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