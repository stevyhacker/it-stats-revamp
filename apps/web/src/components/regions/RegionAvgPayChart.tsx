"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import numeral from "numeral";
import type { RegionRow } from "@/lib/api";

export function RegionAvgPayChart({ rows, nationalAvg }: { rows: RegionRow[]; nationalAvg: number }) {
  const data = [...rows]
    .filter((r) => r.totalEmployees >= 5)
    .map((r) => ({ name: r.municipality, avgPay: r.avgPay }))
    .sort((a, b) => b.avgPay - a.avgPay)
    .slice(0, 14);

  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 56 }}>
          <CartesianGrid strokeDasharray="1 5" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="name"
            angle={-40}
            textAnchor="end"
            height={64}
            interval={0}
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => numeral(v).format("0,0")}
          />
          <Tooltip
            formatter={(v: number) => [numeral(v).format("0,0") + "€", "Avg pay*"]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              color: "hsl(var(--popover-foreground))",
            }}
          />
          <ReferenceLine
            y={nationalAvg}
            stroke="hsl(var(--chart-2))"
            strokeDasharray="4 4"
            label={{
              value: `Nat'l ${numeral(nationalAvg).format("0,0")}€`,
              position: "insideTopRight",
              fontSize: 10,
              fill: "hsl(var(--chart-2))",
            }}
          />
          <Bar dataKey="avgPay" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.avgPay >= nationalAvg ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.5)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
