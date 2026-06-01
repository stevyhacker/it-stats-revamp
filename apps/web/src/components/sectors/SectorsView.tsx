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
  buildCompanyParams,
  buildSectorParams,
  fetchApi,
  SECTOR_METRICS,
  type SectorActivitiesResponse,
  type SectorMetric,
  type SectorsResponse,
  type SectorTrendsResponse,
  type SummaryResponse,
} from "@/lib/api";
import { SectorKpiStrip } from "./SectorKpiStrip";
import { SectorRankBars } from "./SectorRankBars";
import { SectorTreemap } from "./SectorTreemap";
import { SectorMarginChart } from "./SectorMarginChart";
import { SectorTrendLines } from "./SectorTrendLines";
import { SectorActivityPanel } from "./SectorActivityPanel";
import { AveragePayFootnote } from "@/components/AveragePayFootnote";

const METRIC_LABEL: Record<SectorMetric, string> = {
  revenue: "Revenue",
  employees: "Employees",
  avgPay: "Avg pay*",
  margin: "Profit margin",
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

export function SectorsView({
  years,
  summary: initialSummary,
  initial,
}: {
  years: string[];
  summary: SummaryResponse;
  initial: {
    year: string;
    metric: SectorMetric;
    sector: string | null;
    sectors: SectorsResponse;
    trends: SectorTrendsResponse;
    activities: SectorActivitiesResponse | null;
  };
}) {
  const router = useRouter();
  const [year, setYear] = React.useState(initial.year);
  const [metric, setMetric] = React.useState<SectorMetric>(initial.metric);
  const [sector, setSector] = React.useState<string | null>(initial.sector);
  const [summary, setSummary] = React.useState(initialSummary);
  const [sectors, setSectors] = React.useState(initial.sectors);
  const [trends, setTrends] = React.useState(initial.trends);
  const [activities, setActivities] = React.useState(initial.activities);
  const [loading, setLoading] = React.useState(false);
  const [activitiesLoading, setActivitiesLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const didLoadInitialSectors = React.useRef(false);
  const didLoadInitialTrends = React.useRef(false);
  const didLoadInitialActivities = React.useRef(false);

  React.useEffect(() => {
    const params = new URLSearchParams({ year, metric });
    if (sector) params.set("sector", sector);
    const next = `/sectors?${params.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      router.replace(next, { scroll: false });
    }
  }, [year, metric, sector, router]);

  // Keep the header summary in sync with the selected year. The initial summary
  // already matches initial.year, so this only fires once the year actually changes.
  React.useEffect(() => {
    if (summary.year === year) return;
    let cancelled = false;
    fetchApi<SummaryResponse>("/summary", buildCompanyParams({ year }))
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch((e) => {
        if (!cancelled) console.error(e);
      });
    return () => {
      cancelled = true;
    };
  }, [year, summary.year]);

  React.useEffect(() => {
    if (!didLoadInitialSectors.current) {
      didLoadInitialSectors.current = true;
      return;
    }
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });
    fetchApi<SectorsResponse>("/sectors", buildSectorParams({ year }))
      .then((s) => {
        if (!cancelled) setSectors(s);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setError("Could not load sector data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  React.useEffect(() => {
    if (!didLoadInitialTrends.current) {
      didLoadInitialTrends.current = true;
      return;
    }
    let cancelled = false;
    fetchApi<SectorTrendsResponse>("/sectors/trends", buildSectorParams({ metric, limit: 6 }))
      .then((t) => {
        if (!cancelled) setTrends(t);
      })
      .catch((e) => {
        if (!cancelled) console.error(e);
      });
    return () => {
      cancelled = true;
    };
  }, [metric]);

  React.useEffect(() => {
    if (!didLoadInitialActivities.current) {
      didLoadInitialActivities.current = true;
      return;
    }
    if (!sector) {
      return;
    }
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      setActivitiesLoading(true);
    });
    fetchApi<SectorActivitiesResponse>("/sectors/activities", buildSectorParams({ year, sector }))
      .then((a) => {
        if (!cancelled) setActivities(a);
      })
      .catch((e) => {
        if (!cancelled) console.error(e);
      })
      .finally(() => {
        if (!cancelled) setActivitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, sector]);

  const toggleSector = (s: string) => setSector((cur) => (cur === s ? null : s));
  const activeActivities =
    sector && activities?.sector === sector && activities.year === year ? activities : null;

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
            <h1 className="font-display text-2xl font-bold uppercase leading-none">Sectors</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Company activity across Montenegro by sector
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
              {SECTOR_METRICS.map((m) => (
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
        <AveragePayFootnote className="mb-3" />

        <div className="mb-3">
          <SectorKpiStrip data={sectors} />
        </div>

        <div className="mb-3 grid gap-3 xl:grid-cols-2">
          <Panel title={`Top sectors · ${METRIC_LABEL[metric]}`}>
            <SectorRankBars rows={sectors.sectors} metric={metric} selected={sector} onSelect={toggleSector} />
          </Panel>
          <Panel title="Market share · Revenue">
            <SectorTreemap rows={sectors.sectors} selected={sector} onSelect={toggleSector} />
          </Panel>
        </div>

        <div className="mb-3">
          <Panel title="Profit margin by sector">
            <SectorMarginChart rows={sectors.sectors} nationalMargin={sectors.national.profitMargin} />
          </Panel>
        </div>

        <div className="mb-3">
          <Panel title="Activity drilldown">
            <SectorActivityPanel
              data={activeActivities}
              metric={metric}
              sector={sector}
              loading={Boolean(sector && activitiesLoading)}
            />
          </Panel>
        </div>

        <Panel title={`Year-over-year · ${METRIC_LABEL[metric]}`}>
          <SectorTrendLines data={trends} />
        </Panel>
      </main>
    </div>
  );
}
