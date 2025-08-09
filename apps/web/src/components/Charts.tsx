import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CompanyGrowth } from '../types';

interface ChartsProps {
  growthData: CompanyGrowth[];
}

export const Charts = ({ growthData }: ChartsProps) => {
  const topGrowth = growthData.slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-lg glass-card shadow-soft border">
        <h2 className="text-xl font-semibold mb-4">Top 10 Companies by Growth Rate</h2>
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
    </div>
  );
};