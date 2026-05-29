"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import numeral from "numeral";
import { sectorMetricValue, type SectorMetric, type SectorRow } from "@/lib/api";

export const fmtSector = (v: number, m: SectorMetric) =>
  m === "employees"
    ? numeral(v).format("0,0")
    : m === "avgPay"
      ? numeral(v).format("0,0") + "€"
      : m === "margin"
        ? numeral(v).format("0.0%")
        : numeral(v).format("0.0a") + "€";

export function SectorRankBars({
  rows,
  metric,
  selected,
  onSelect,
}: {
  rows: SectorRow[];
  metric: SectorMetric;
  selected?: string | null;
  onSelect?: (sector: string) => void;
}) {
  const data = [...rows]
    .map((r) => ({ name: r.sector, value: sectorMetricValue(r, metric) }))
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
            width={104}
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
            onClick={(d: { name?: string }) => d?.name && onSelect?.(d.name)}
            cursor={onSelect ? "pointer" : undefined}
            label={{
              position: "right",
              formatter: (v: number) => fmtSector(v, metric),
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
            }}
          >
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  selected === d.name
                    ? "hsl(var(--chart-2))"
                    : `hsl(var(--primary) / ${1 - i * 0.05})`
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
