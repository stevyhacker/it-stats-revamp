"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import numeral from "numeral";
import type { RegionTrendsResponse } from "@/lib/api";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
];

type TrendMetric = "revenue" | "companies" | "employees" | "avgPay" | "profit";

function normalizeTrendMetric(metric: string): TrendMetric {
  switch (metric) {
    case "companies":
      return "companies";
    case "employees":
    case "employeeCount":
      return "employees";
    case "avgPay":
    case "averagePay":
      return "avgPay";
    case "profit":
      return "profit";
    default:
      return "revenue";
  }
}

function compact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return numeral(value).format("0");
}

function formatTrendValue(value: number, metric: TrendMetric, compactAxis = false) {
  if (metric === "companies" || metric === "employees") {
    return compactAxis ? compact(value) : numeral(value).format("0,0");
  }

  if (metric === "avgPay") {
    return compactAxis ? `${compact(value)}€` : `${numeral(value).format("0,0")}€`;
  }

  return compactAxis ? `${compact(value)}€` : `${numeral(value).format("0,0")}€`;
}

export function RegionTrendLines({ data }: { data: RegionTrendsResponse }) {
  const chart = data.series.map((s) => ({ year: Number(s.year), ...s.values }));
  const names = data.municipalities.slice(0, 6);
  const metric = normalizeTrendMetric(data.metric);

  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={chart} margin={{ top: 12, right: 18, left: 0, bottom: 36 }}>
          <CartesianGrid strokeDasharray="1 5" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => formatTrendValue(Number(v), metric, true)}
          />
          <Tooltip
            formatter={(v: number, n: string) => [formatTrendValue(Number(v), metric), n]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              color: "hsl(var(--popover-foreground))",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-mono)", paddingTop: 12 }} />
          {names.map((n, i) => (
            <Line
              key={n}
              type="monotone"
              dataKey={n}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
