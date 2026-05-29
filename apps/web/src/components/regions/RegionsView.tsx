"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Header } from "../Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildRegionParams,
  fetchApi,
  REGION_METRICS,
  type RegionMetric,
  type RegionsResponse,
  type RegionSectorsResponse,
  type RegionTrendsResponse,
  type SummaryResponse,
} from "@/lib/api";
import { RegionKpiStrip } from "./RegionKpiStrip";
import { RegionRankBars } from "./RegionRankBars";
import { RegionTreemap } from "./RegionTreemap";
import { RegionAvgPayChart } from "./RegionAvgPayChart";
import { RegionBubbleChart } from "./RegionBubbleChart";
import { RegionSectorMix } from "./RegionSectorMix";
import { RegionTrendLines } from "./RegionTrendLines";
import { MontenegroChoropleth } from "./MontenegroChoropleth";

const METRIC_LABEL: Record<RegionMetric, string> = {
  revenue: "Revenue",
  companies: "Companies",
  employees: "Employees",
  avgPay: "Avg pay",
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="analytics-panel border-border/80 bg-card/90">
      <CardHeader className="border-b border-border/70 p-4">
        <CardTitle className="font-display text-lg font-bold uppercase leading-none">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

export function RegionsView({
  years,
  summary,
  geo,
  initial,
}: {
  years: string[];
  summary: SummaryResponse;
  geo: { type: "FeatureCollection"; features: unknown[] };
  initial: {
    year: string;
    metric: RegionMetric;
    regions: RegionsResponse;
    sectors: RegionSectorsResponse;
    trends: RegionTrendsResponse;
  };
}) {
  const router = useRouter();
  const [year, setYear] = React.useState(initial.year);
  const [metric, setMetric] = React.useState<RegionMetric>(initial.metric);
  const [regions, setRegions] = React.useState(initial.regions);
  const [sectors, setSectors] = React.useState(initial.sectors);
  const [trends, setTrends] = React.useState(initial.trends);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams({ year, metric });
    const next = `/regions?${params.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      router.replace(next, { scroll: false });
    }
  }, [year, metric, router]);

  React.useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });
    Promise.all([
      fetchApi<RegionsResponse>("/regions", buildRegionParams({ year })),
      fetchApi<RegionSectorsResponse>("/regions/sectors", buildRegionParams({ year, limit: 8 })),
      fetchApi<RegionTrendsResponse>("/regions/trends", buildRegionParams({ metric, limit: 6 })),
    ])
      .then(([r, s, t]) => {
        if (cancelled) return;
        setRegions(r);
        setSectors(s);
        setTrends(t);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setError("Could not load region data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, metric]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header
        year={summary.year}
        companyCount={summary.companyCount}
        totalRevenue={summary.totalRevenue}
        totalEmployees={summary.totalEmployees}
        concentrationStats={summary.concentrationStats}
      />
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-2 sm:px-6 lg:px-8">
        <section className="control-shell sticky top-3 z-30 mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase leading-none">Regions</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Company activity across Montenegro by municipality
              {loading ? " · loading…" : ""}
              {error ? ` · ${error}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32 rounded-md border-border/80 bg-background/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="inline-flex rounded-md border border-border/80 bg-background/70 p-1">
              {REGION_METRICS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className={`h-8 rounded-sm px-3 text-xs font-semibold transition-colors ${
                    metric === m.key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-3">
          <RegionKpiStrip data={regions} />
        </div>

        <div className="mb-3 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel title={`Map · ${METRIC_LABEL[metric]}`}>
            <MontenegroChoropleth rows={regions.municipalities} metric={metric} geo={geo} />
          </Panel>
          <Panel title={`Top regions · ${METRIC_LABEL[metric]}`}>
            <RegionRankBars rows={regions.municipalities} metric={metric} />
          </Panel>
        </div>

        <div className="mb-3 grid gap-3 xl:grid-cols-2">
          <Panel title={`Market share · ${METRIC_LABEL[metric]}`}>
            <RegionTreemap rows={regions.municipalities} metric={metric} />
          </Panel>
          <Panel title="Average pay by region">
            <RegionAvgPayChart rows={regions.municipalities} nationalAvg={regions.national.avgPay} />
          </Panel>
        </div>

        <div className="mb-3 grid gap-3 xl:grid-cols-2">
          <Panel title="Scale vs pay (bubble = revenue)">
            <RegionBubbleChart rows={regions.municipalities} />
          </Panel>
          <Panel title="Sector mix in top regions">
            <RegionSectorMix data={sectors} />
          </Panel>
        </div>

        <Panel title={`Year-over-year · ${METRIC_LABEL[metric]}`}>
          <RegionTrendLines data={trends} />
        </Panel>
      </main>
    </div>
  );
}
