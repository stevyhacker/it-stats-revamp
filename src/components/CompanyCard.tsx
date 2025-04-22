// import React from 'react'; // No longer needed with new JSX transform
import { TrendingUp, Users, DollarSign } from 'lucide-react';
import numeral from 'numeral';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Import shadcn Card components

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
    <Card 
      className="cursor-pointer hover:border-primary transition-colors" 
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-xl">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-3">
          <DollarSign className="text-blue-500 h-5 w-5" />
          <div>
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="font-semibold">{numeral(totalIncome).format('0,0')}€</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <TrendingUp className="text-green-500 h-5 w-5" />
          <div>
            <p className="text-sm text-muted-foreground">Profit</p>
            <p className="font-semibold">{numeral(profit).format('0,0')}€</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Users className="text-purple-500 h-5 w-5" />
          <div>
            <p className="text-sm text-muted-foreground">Employees</p>
            <p className="font-semibold">{employeeCount}</p>
          </div>
        </div>
        {averagePay && (
          <div className="flex items-center space-x-3 pt-3 mt-3 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Average Monthly Salary</p>
              <p className="font-semibold">{numeral(averagePay).format('0,0')}€</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};