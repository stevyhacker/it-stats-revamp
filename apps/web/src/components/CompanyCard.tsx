import { TrendingUp, Users, DollarSign, Terminal } from "lucide-react";
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
        "group transition-all duration-200 hover:border-primary",
        onClick ? "cursor-pointer hover:scale-[1.02]" : undefined,
        className
      )}
      onClick={onClick}
    >
      {/* Terminal-style header */}
      <div className="terminal-header justify-between">
        <div className="flex items-center gap-2">
          <div className="terminal-dots" />
          <Terminal className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">
          company.db
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors flex items-center gap-2">
          <span className="text-primary">{'>'}</span>
          {name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-terminal-green" />
              <p className="text-[10px] text-muted-foreground font-mono uppercase">revenue</p>
            </div>
            <p className="font-bold text-lg font-mono">
              {numeral(totalIncome).format("0.0a")}€
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className={`h-3.5 w-3.5 ${
                profit >= 0 ? "text-success" : "text-destructive"
              }`} />
              <p className="text-[10px] text-muted-foreground font-mono uppercase">profit</p>
            </div>
            <p className={`font-bold text-lg font-mono ${
              profit >= 0 ? "text-success" : "text-destructive"
            }`}>
              {numeral(profit).format("0.0a")}€
            </p>
          </div>
        </div>
        
        {/* Details section */}
        <div className="pt-3 border-t-2 border-border space-y-2 text-sm">
          <div className="flex items-center justify-between font-mono">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-terminal-blue" />
              <span className="text-xs text-muted-foreground">employees</span>
            </div>
            <span className="font-bold">{employeeCount}</span>
          </div>
          
          {averagePay && (
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-muted-foreground">avg_salary</span>
              <span className="font-bold">
                {numeral(averagePay).format("0.0a")}€
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
