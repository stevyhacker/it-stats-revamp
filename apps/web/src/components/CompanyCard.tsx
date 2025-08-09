import { TrendingUp, Users, DollarSign, Building2 } from "lucide-react";
import numeral from "numeral";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CompanyCardProps {
  name: string;
  totalIncome: number;
  profit: number;
  employeeCount: number;
  averagePay?: number | string;
  onClick?: () => void;
  className?: string;
}

export const CompanyCard = ({
  name,
  totalIncome,
  profit,
  employeeCount,
  averagePay,
  onClick,
  className,
}: CompanyCardProps) => {
  // Theme is now handled globally via ThemeProvider

  return (
    <Card
      className={cn(
        "p-4 md:p-6 rounded-xl glass-card shadow-soft hover:shadow-medium border transition-all duration-300 group",
        "hover:scale-[1.02] animate-slide-up",
        onClick ? "cursor-pointer" : undefined,
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </CardTitle>
        <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-chart-1" />
              <p className="text-xs text-muted-foreground font-medium">Revenue</p>
            </div>
            <p className="font-bold text-lg">
              {numeral(totalIncome).format("0.0a")}€
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <TrendingUp className={`h-4 w-4 ${
                profit >= 0 ? "text-chart-2" : "text-destructive"
              }`} />
              <p className="text-xs text-muted-foreground font-medium">Profit</p>
            </div>
            <p className={`font-bold text-lg ${
              profit >= 0 ? "text-success" : "text-destructive"
            }`}>
              {numeral(profit).format("0.0a")}€
            </p>
          </div>
        </div>
        
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-chart-4" />
              <span className="text-sm text-muted-foreground">Team Size</span>
            </div>
            <span className="font-semibold">{employeeCount}</span>
          </div>
          
          {averagePay && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">Avg. Salary</span>
              <span className="font-semibold text-sm">
                {numeral(averagePay).format("0.0a")}€/mo
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
