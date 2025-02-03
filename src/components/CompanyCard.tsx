import React from 'react';
import { TrendingUp, Users, DollarSign } from 'lucide-react';
import numeral from 'numeral';

interface CompanyCardProps {
  name: string;
  totalIncome: number;
  profit: number;
  employeeCount: number;
  averagePay?: number | string;
  onClick?: () => void;
}

export const CompanyCard = ({ name, totalIncome, profit, employeeCount, averagePay, onClick }: CompanyCardProps) => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{name}</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <DollarSign className="text-blue-500" size={20} />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
            <p className="font-semibold text-gray-900 dark:text-white">{numeral(totalIncome).format('0,0')}€</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <TrendingUp className="text-green-500" size={20} />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Profit</p>
            <p className="font-semibold text-gray-900 dark:text-white">{numeral(profit).format('0,0')}€</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Users className="text-purple-500" size={20} />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Employees</p>
            <p className="font-semibold text-gray-900 dark:text-white">{employeeCount}</p>
          </div>
        </div>
        {averagePay && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Average Monthly Salary</p>
            <p className="font-semibold text-gray-900 dark:text-white">{numeral(averagePay).format('0,0')}€</p>
          </div>
        )}
      </div>
    </div>
  );
};