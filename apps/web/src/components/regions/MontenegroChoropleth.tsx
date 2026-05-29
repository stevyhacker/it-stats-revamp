"use client";

import React from "react";
import { geoMercator, geoPath } from "d3-geo";
import numeral from "numeral";
import { matchRegionName, prettyRegionName } from "@/lib/regions-geo";
import { regionMetricValue, type RegionMetric, type RegionRow } from "@/lib/api";

type GeoJson = { type: "FeatureCollection"; features: any[] };

const NAME_PROP_CANDIDATES = ["shapeName", "NAME_1", "name"];
const featureName = (f: any): string => {
  for (const k of NAME_PROP_CANDIDATES) if (f.properties?.[k]) return String(f.properties[k]);
  return "";
};

const isCurrency = (m: RegionMetric) => m === "revenue" || m === "avgPay";

export function MontenegroChoropleth({
  rows,
  metric,
  geo,
}: {
  rows: RegionRow[];
  metric: RegionMetric;
  geo: GeoJson;
}) {
  const [hover, setHover] = React.useState<{ name: string; value: number; x: number; y: number } | null>(null);
  const W = 640;
  const H = 420;

  const geoNames = geo.features.map(featureName);
  const valueByGeoName = new Map<string, number>();
  let matched = 0;
  for (const r of rows) {
    const gn = matchRegionName(r.municipality, geoNames);
    if (gn) {
      valueByGeoName.set(gn, regionMetricValue(r, metric));
      matched++;
    }
  }
  const max = Math.max(1, ...Array.from(valueByGeoName.values()));

  const projection = geoMercator().fitSize([W, H], geo as never);
  const path = geoPath(projection);
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
        {geo.features.map((f, i) => {
          const name = featureName(f);
          const v = valueByGeoName.get(name) ?? 0;
          const d = path(f) ?? undefined;
          return (
            <path
              key={i}
              d={d}
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
