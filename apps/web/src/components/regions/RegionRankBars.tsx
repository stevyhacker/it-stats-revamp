"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import numeral from "numeral";
import { regionMetricValue, type RegionMetric, type RegionRow } from "@/lib/api";

const fmt = (v: number, m: RegionMetric) =>
  m === "companies"
    ? numeral(v).format("0,0")
    : m === "employees"
      ? numeral(v).format("0,0")
      : m === "avgPay"
        ? numeral(v).format("0,0") + "€"
        : numeral(v).format("0.0a") + "€";

export function RegionRankBars({ rows, metric }: { rows: RegionRow[]; metric: RegionMetric }) {
  const data = [...rows]
    .map((r) => ({ name: r.municipality, value: regionMetricValue(r, metric) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={92}
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
            formatter={(v: number) => [fmt(v, metric), ""]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              color: "hsl(var(--popover-foreground))",
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 3, 3, 0]}
            label={{
              position: "right",
              formatter: (v: number) => fmt(v, metric),
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
            }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={`hsl(var(--primary) / ${1 - i * 0.05})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
