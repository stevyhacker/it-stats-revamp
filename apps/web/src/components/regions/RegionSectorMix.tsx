"use client";

import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import numeral from "numeral";
import type { RegionSectorsResponse } from "@/lib/api";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

export function RegionSectorMix({ data }: { data: RegionSectorsResponse }) {
  const sectors = data.sectors.slice(0, 6);
  const chart = data.rows.map((r) => ({
    name: r.municipality,
    ...Object.fromEntries(sectors.map((s) => [s, r.bySector[s] ?? 0])),
  }));

  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }} stackOffset="expand">
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={92}
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            formatter={(v: number, n: string) => [numeral(v).format("0,0") + "€", n]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              color: "hsl(var(--popover-foreground))",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-mono)" }} />
          {sectors.map((s, i) => (
            <Bar key={s} dataKey={s} stackId="a" fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
