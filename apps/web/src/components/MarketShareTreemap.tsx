import React from 'react';
import { 
  Treemap, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { CompanyData } from '../types';
import numeral from 'numeral';

interface MarketShareTreemapProps {
  companies: CompanyData[];
  width?: number;
  height?: number;
  className?: string;
}

// Color scale function to generate colors based on market share
const getColorForPercentage = (percentage: number): string => {
  // Darker blue-to-purple gradient based on market share percentage
  if (percentage >= 20) return '#1e1b4b'; // Darker indigo for major players (20%+)
  if (percentage >= 10) return '#2e1065'; // Darker purple for large companies (10-20%)
  if (percentage >= 5) return '#3730a3';  // Darker indigo for medium (5-10%)
  if (percentage >= 2) return '#4338ca';  // Dark purple for small (2-5%)
  return '#6366f1';                       // Purple for tiny (<2%)
};

// Custom content component for the treemap cells
const CustomizedContent = (props: any) => {
  const { depth, x, y, width, height, index, name, totalIncome, percentage } = props;
  
  // Get color based on market share percentage
  const fillColor = percentage !== undefined ? getColorForPercentage(percentage) : '#374151';
  
  // Use white text for all cells with appropriate opacity
  const textColor = '#ffffff';
  const textShadow = '0 1px 2px rgba(0,0,0,0.8)';
  
  // Determine if we should display text based on available space
  const shouldDisplayText = width > 40 && height > 30;
  
  // Calculate font size based on available space and market share
  const getFontSize = () => {
    if (width > 120 && height > 80) return '0.85rem';
    if (width > 80 && height > 60) return '0.75rem';
    return '0.65rem';
  };
  
  // Truncate company name if too long for the space
  const truncateName = (name: string) => {
    if (!name) return '';
    const maxChars = Math.floor(width / 8);
    return name.length > maxChars ? `${name.substring(0, maxChars-2)}..` : name;
  };
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth < 2 ? fillColor : '#1f2937',
          stroke: '#111827',
          strokeWidth: 1,
          strokeOpacity: 1,
        }}
      />
      {shouldDisplayText && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: 'sans-serif',
            fontSize: getFontSize(),
            fill: textColor,
            pointerEvents: 'none',
            fontWeight: percentage >= 5 ? 'bold' : 'normal',
            textShadow,
            opacity: 0.95,
          }}
        >
          <tspan x={x + width / 2} dy="-0.6em">{truncateName(name || '')}</tspan>
          {width > 50 && height > 40 && (
            <tspan x={x + width / 2} dy="1.4em" style={{ 
              fontSize: percentage >= 5 ? getFontSize() : '0.6rem',
              opacity: 0.85
            }}>
              {percentage !== undefined ? `${percentage.toFixed(1)}%` : ''}
            </tspan>
          )}
        </text>
      )}
    </g>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="rounded-md border bg-popover text-popover-foreground p-3 shadow-md">
        <p className="font-bold">{data.name || ''}</p>
        <p>Revenue: {numeral(data.totalIncome || 0).format('0,0')}€</p>
        <p>Market Share: {data.percentage !== undefined ? `${data.percentage.toFixed(2)}%` : '0.00%'}</p>
      </div>
    );
  }
  return null;
};

export const MarketShareTreemap = ({ companies, height = 500, className = '' }: MarketShareTreemapProps) => {
  // Calculate total market size
  const totalMarketSize = companies.reduce((sum, company) => sum + company.totalIncome, 0);
  
  // Prepare data for treemap with safeguards
  const data = [
    {
      name: 'ICT Market',
      children: companies.map(company => ({
        name: company.name,
        totalIncome: company.totalIncome,
        percentage: totalMarketSize > 0 ? (company.totalIncome / totalMarketSize) * 100 : 0,
        size: company.totalIncome > 0 ? company.totalIncome : 1 // Avoid zero values that can cause rendering issues
      }))
    }
  ];

  return (
    <div style={{ height }} className={`w-full p-4 rounded-lg glass-card border ${className}`}>
      <div className="mb-4 flex justify-end">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#6366f1' }}></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">&lt;2%</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#4338ca' }}></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">2-5%</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#3730a3' }}></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">5-10%</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#2e1065' }}></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">10-20%</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#1e1b4b' }}></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">&gt;20%</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="#111827"
          fill="#3730a3"
          content={<CustomizedContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}; 