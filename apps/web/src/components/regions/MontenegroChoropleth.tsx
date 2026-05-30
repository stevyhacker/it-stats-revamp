"use client";

import React from "react";
import numeral from "numeral";
import { matchRegionName, prettyRegionName } from "@/lib/regions-geo";
import { regionMetricValue, type RegionMetric, type RegionRow } from "@/lib/api";

export type MontenegroMapFeature = { name: string; path: string };

const isCurrency = (m: RegionMetric) => m === "revenue" || m === "avgPay";

export function MontenegroChoropleth({
  rows,
  metric,
  features,
}: {
  rows: RegionRow[];
  metric: RegionMetric;
  features: MontenegroMapFeature[];
}) {
  const [hover, setHover] = React.useState<{ name: string; value: number; x: number; y: number } | null>(null);
  const W = 640;
  const H = 420;

  const geoNames = React.useMemo(() => features.map((feature) => feature.name), [features]);
  const { valueByGeoName, matched, max } = React.useMemo(() => {
    const values = new Map<string, number>();
    let matchedRows = 0;
    for (const row of rows) {
      const geoName = matchRegionName(row.municipality, geoNames);
      if (geoName) {
        values.set(geoName, regionMetricValue(row, metric));
        matchedRows++;
      }
    }
    return {
      valueByGeoName: values,
      matched: matchedRows,
      max: Math.max(1, ...Array.from(values.values())),
    };
  }, [geoNames, metric, rows]);
  const opacity = (v: number) => 0.12 + 0.83 * Math.sqrt(v / max);
  const notOnMap = rows.length - matched;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Map of Montenegro shaded by the selected metric"
      >
        {features.map((feature) => {
          const name = feature.name;
          const v = valueByGeoName.get(name) ?? 0;
          return (
            <path
              key={name}
              d={feature.path}
              fill={v > 0 ? `hsl(var(--primary) / ${opacity(v)})` : "hsl(var(--muted))"}
              stroke="hsl(var(--card))"
              strokeWidth={0.8}
              onMouseEnter={(e) =>
                setHover({ name: prettyRegionName(name), value: v, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })
              }
              onMouseMove={(e) =>
                setHover((h) => (h ? { ...h, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : h))
              }
              onMouseLeave={() => setHover(null)}
              style={{ transition: "fill 150ms" }}
            />
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <div className="font-semibold">{hover.name}</div>
          <div>{isCurrency(metric) ? numeral(hover.value).format("0,0") + "€" : numeral(hover.value).format("0,0")}</div>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[0.7rem] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>low</span>
          <span
            className="h-2 w-24 rounded-sm"
            style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.12), hsl(var(--primary)))" }}
          />
          <span>high</span>
        </div>
        {notOnMap > 0 && (
          <span>
            {notOnMap} region{notOnMap === 1 ? "" : "s"} not shown on map
          </span>
        )}
      </div>
    </div>
  );
}
