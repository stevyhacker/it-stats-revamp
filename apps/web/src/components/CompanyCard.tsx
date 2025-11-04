
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
        "group transition-colors border-border hover:border-primary/50",
        onClick ? "cursor-pointer" : undefined,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4">
        <div className="mb-3">
          <CardTitle className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </CardTitle>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Revenue</p>
            <p className="font-semibold text-lg">
              {numeral(totalIncome).format("0.0a")}€
            </p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Profit</p>
            <p className={`font-semibold text-lg ${
              profit >= 0 ? "text-success" : "text-destructive"
            }`}>
              {numeral(profit).format("0.0a")}€
            </p>
          </div>
        </div>
        
        <div className="pt-2 border-t border-border/30 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{employeeCount} employees</span>
          {averagePay && (
            <span className="text-muted-foreground">
              {numeral(averagePay).format("0a")}€ avg
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
