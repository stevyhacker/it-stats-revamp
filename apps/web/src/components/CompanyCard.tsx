import numeral from "numeral";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CompanyCardProps {
  rank?: number;
  name: string;
  totalIncome: number | null;
  profit: number | null;
  employeeCount: number | null;
  averagePay?: number | string | null;
  onClick?: () => void;
  className?: string;
}

export const CompanyCard = ({
  rank,
  name,
  totalIncome,
  profit,
  employeeCount,
  averagePay,
  onClick,
  className,
}: CompanyCardProps) => {
  const profitValue = profit ?? 0;
  const revenueValue = totalIncome ?? 0;
  const margin = revenueValue ? profitValue / revenueValue : 0;

  return (
    <Card
      className={cn(
        "group min-h-[13rem] cursor-pointer border-border/80 bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50",
        !onClick && "cursor-default",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {rank && (
              <div className="mb-3 inline-flex rounded-lg bg-foreground px-2.5 py-1 font-mono text-xs font-semibold text-background">
                #{rank}
              </div>
            )}
            <CardTitle className="text-xl font-semibold leading-tight transition-colors duration-200 group-hover:text-primary">
              {name}
            </CardTitle>
          </div>
          <div
            className={cn(
              "rounded-lg px-2.5 py-1 font-mono text-xs font-semibold",
              profitValue >= 0
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {numeral(margin).format("0.0%")}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <div>
            <p className="font-mono text-xs text-muted-foreground">Revenue</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {numeral(revenueValue).format("0.0a")}€
            </p>
          </div>
          <div>
            <p className="font-mono text-xs text-muted-foreground">Profit</p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold tabular-nums",
                profitValue >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {numeral(profitValue).format("0.0a")}€
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 font-mono text-xs text-muted-foreground">
          <span>{employeeCount ?? 0} employees</span>
          {averagePay !== null && averagePay !== undefined && (
            <span>{numeral(averagePay).format("0a")}€ avg pay</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
