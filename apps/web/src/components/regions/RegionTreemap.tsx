"use client";

import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import numeral from "numeral";
import { regionMetricValue, type RegionMetric, type RegionRow } from "@/lib/api";

const Content = (props: any) => {
  const { x, y, width, height, name, depth } = props;
  if (depth !== 1) return null;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: "hsl(var(--primary))",
          fillOpacity: Math.max(0.25, Math.min(0.9, (width * height) / 90000)),
          stroke: "hsl(var(--card))",
          strokeWidth: 1,
        }}
      />
      {width > 46 && height > 24 && (
        <text x={x + 6} y={y + 16} fontSize={11} fontFamily="var(--font-mono)" fill="hsl(var(--primary-foreground))">
          {name}
        </text>
      )}
    </g>
  );
};

export function RegionTreemap({ rows, metric }: { rows: RegionRow[]; metric: RegionMetric }) {
  const data = rows
    .map((r) => ({ name: r.municipality, size: Math.max(1, regionMetricValue(r, metric)) }))
    .sort((a, b) => b.size - a.size);

  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <Treemap data={data} dataKey="size" content={<Content />} aspectRatio={4 / 3}>
          <Tooltip
            formatter={(v: number) => [numeral(v).format("0,0"), metric]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              color: "hsl(var(--popover-foreground))",
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
