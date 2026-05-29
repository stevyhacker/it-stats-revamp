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

export function RegionTrendLines({ data }: { data: RegionTrendsResponse }) {
  const chart = data.series.map((s) => ({ year: Number(s.year), ...s.values }));
  const names = data.municipalities.slice(0, 6);

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
            tickFormatter={(v) => (v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : (v / 1e3).toFixed(0) + "k")}
          />
          <Tooltip
            formatter={(v: number, n: string) => [numeral(v).format("0,0"), n]}
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
