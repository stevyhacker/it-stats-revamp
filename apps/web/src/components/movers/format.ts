import numeral from "numeral";
import type { MoverMetric } from "@/lib/api";

export const MOVER_METRIC_LABEL: Record<MoverMetric, string> = {
  revenue: "Revenue",
  profit: "Profit",
  employees: "Employees",
  pay: "Avg pay",
};

export function fmtMoverValue(v: number, metric: MoverMetric): string {
  if (metric === "employees") return numeral(v).format("0,0");
  if (metric === "pay") return numeral(v).format("0,0") + "€";
  return numeral(v).format("0.0a") + "€"; // revenue, profit (compact)
}

export function fmtDelta(v: number, metric: MoverMetric): string {
  return (v > 0 ? "+" : "") + fmtMoverValue(v, metric);
}

export function fmtPct(p: number | null): string {
  return p == null ? "—" : numeral(p).format("+0.0%");
}
