"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import numeral from "numeral";
import type { RegionRow } from "@/lib/api";

export function RegionBubbleChart({ rows }: { rows: RegionRow[] }) {
  const data = rows
    .filter((r) => r.companyCount > 0 && r.avgPay > 0)
    .map((r) => ({ x: r.companyCount, y: r.avgPay, z: Math.max(1, r.totalRevenue), name: r.municipality }));

  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <ScatterChart margin={{ top: 12, right: 18, left: 4, bottom: 28 }}>
          <CartesianGrid strokeDasharray="1 5" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="x"
            name="Companies"
            scale="log"
            domain={["auto", "auto"]}
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }}
            label={{
              value: "Companies",
              position: "insideBottom",
              offset: -12,
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Avg pay*"
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => numeral(v).format("0,0")}
          />
          <ZAxis type="number" dataKey="z" range={[40, 900]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }: any) =>
              active && payload?.length ? (
                <div className="rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground">
                  <div className="font-semibold">{payload[0].payload.name}</div>
                  <div>{payload[0].payload.x} companies</div>
                  <div>{numeral(payload[0].payload.y).format("0,0")}€ avg pay*</div>
                  <div>{numeral(payload[0].payload.z).format("0,0")}€ revenue</div>
                </div>
              ) : null
            }
          />
          <Scatter data={data} fill="hsl(var(--primary) / 0.55)" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
