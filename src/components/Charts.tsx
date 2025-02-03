import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CompanyGrowth, CompanyEfficiency } from '../types';

interface ChartsProps {
  growthData: CompanyGrowth[];
  efficiencyData: CompanyEfficiency[];
}

export const Charts = ({ growthData, efficiencyData }: ChartsProps) => {
  const topGrowth = growthData.slice(0, 10);
  const topEfficiency = efficiencyData.slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top 10 Companies by Growth Rate</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" label={{ value: 'Growth Rate (%)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="growthRate" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top 10 Companies by Profit Margin</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topEfficiency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" label={{ value: 'Profit Margin (%)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="profitMargin" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};