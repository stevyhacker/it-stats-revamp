"use client";

import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import numeral from "numeral";
import type { SectorRow } from "@/lib/api";

// Treemap is always sized by revenue (market share). Profit margin is a ratio
// and can be negative, so it can never size an area.
const makeContent =
  (selected: string | null | undefined, onSelect?: (sector: string) => void) =>
  (props: any) => {
    const { x, y, width, height, name, depth } = props;
    if (depth !== 1) return null;
    const isSelected = selected === name;
    return (
      <g onClick={() => name && onSelect?.(name)} style={{ cursor: onSelect ? "pointer" : "default" }}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: isSelected ? "hsl(var(--chart-2))" : "hsl(var(--primary))",
            fillOpacity: isSelected ? 0.95 : Math.max(0.25, Math.min(0.9, (width * height) / 90000)),
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

export function SectorTreemap({
  rows,
  selected,
  onSelect,
}: {
  rows: SectorRow[];
  selected?: string | null;
  onSelect?: (sector: string) => void;
}) {
  const data = rows
    .map((r) => ({ name: r.sector, size: Math.max(1, r.totalRevenue) }))
    .sort((a, b) => b.size - a.size);

  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <Treemap data={data} dataKey="size" content={makeContent(selected, onSelect)} aspectRatio={4 / 3}>
          <Tooltip
            formatter={(v: number) => [numeral(v).format("0,0") + "€", "Revenue"]}
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
