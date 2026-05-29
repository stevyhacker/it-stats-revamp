"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  type SectorActivitiesResponse,
  type SectorActivityRow,
  type SectorMetric,
} from "@/lib/api";
import { fmtSector } from "./SectorRankBars";

function activityValue(r: SectorActivityRow, metric: SectorMetric): number {
  switch (metric) {
    case "employees":
      return r.totalEmployees;
    case "avgPay":
      return r.avgPay;
    case "margin":
      return r.profitMargin;
    default:
      return r.totalRevenue;
  }
}

export function SectorActivityPanel({
  data,
  metric,
  sector,
  loading,
}: {
  data: SectorActivitiesResponse | null;
  metric: SectorMetric;
  sector: string | null;
  loading?: boolean;
}) {
  if (!sector) {
    return (
      <div className="grid h-[20rem] place-items-center text-center text-sm text-muted-foreground">
        Select a sector (click a bar or treemap tile above) to see its activity breakdown.
      </div>
    );
  }

  const rows = data?.rows ?? [];
  if (!loading && rows.length === 0) {
    return (
      <div className="grid h-[20rem] place-items-center text-center text-sm text-muted-foreground">
        No activity data for <span className="ml-1 font-semibold text-foreground">{sector}</span>.
      </div>
    );
  }

  const chartData = [...rows]
    .map((r) => ({ name: r.activityName, value: activityValue(r, metric) }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <div className="mb-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{sector}</span> · activity breakdown
        {loading ? " · loading…" : ""}
      </div>
      <div className="h-[24rem] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 64, left: 8, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={220}
              tick={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
              formatter={(v: number) => [fmtSector(v, metric), ""]}
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
                formatter: (v: number) => fmtSector(v, metric),
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
            >
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.name === "Other" ? "hsl(var(--muted-foreground) / 0.5)" : `hsl(var(--chart-1) / ${1 - i * 0.04})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
