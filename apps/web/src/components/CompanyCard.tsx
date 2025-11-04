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
  return (
    <Card
      className={cn(
        "group transition-all duration-200 hover:border-primary/50 hover:shadow-lg",
        onClick ? "cursor-pointer hover:scale-[1.01]" : undefined,
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary/60 flex-shrink-0" />
            {name}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Revenue</p>
            </div>
            <p className="font-display font-semibold text-xl text-foreground">
              {numeral(totalIncome).format("0.0a")}€
            </p>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className={`h-4 w-4 ${
                profit >= 0 ? "text-success" : "text-destructive"
              }`} />
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Profit</p>
            </div>
            <p className={`font-display font-semibold text-xl ${
              profit >= 0 ? "text-success" : "text-destructive"
            }`}>
              {numeral(profit).format("0.0a")}€
            </p>
          </div>
        </div>
        
        <div className="pt-3 border-t border-border/50 space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary/70" />
              <span className="text-xs text-muted-foreground font-medium">Employees</span>
            </div>
            <span className="font-semibold text-foreground">{employeeCount}</span>
          </div>
          
          {averagePay && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Avg. Salary</span>
              <span className="font-semibold text-foreground">
                {numeral(averagePay).format("0.0a")}€
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
