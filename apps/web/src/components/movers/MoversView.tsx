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
  buildMoverParams,
  fetchApi,
  MOVER_METRICS,
  type CagrResponse,
  type MoverMetric,
  type MoversResponse,
  type SummaryResponse,
} from "@/lib/api";
import { MoverKpiStrip } from "./MoverKpiStrip";
import { MoverLeaderboard } from "./MoverLeaderboard";
import { CagrLeaderboard } from "./CagrLeaderboard";
import { MOVER_METRIC_LABEL } from "./format";

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

export function MoversView({
  years,
  summary: initialSummary,
  initial,
}: {
  years: string[];
  summary: SummaryResponse;
  initial: {
    year: string;
    metric: MoverMetric;
    movers: MoversResponse;
    cagr: CagrResponse;
  };
}) {
  const router = useRouter();
  const [year, setYear] = React.useState(initial.year);
  const [metric, setMetric] = React.useState<MoverMetric>(initial.metric);
  const [summary, setSummary] = React.useState(initialSummary);
  const [movers, setMovers] = React.useState(initial.movers);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const didLoadInitialMovers = React.useRef(false);
  // CAGR spans the full dataset, so it never changes with year/metric.
  const cagr = initial.cagr;

  React.useEffect(() => {
    const params = new URLSearchParams({ year, metric });
    const next = `/movers?${params.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      router.replace(next, { scroll: false });
    }
  }, [year, metric, router]);

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
    if (!didLoadInitialMovers.current) {
      didLoadInitialMovers.current = true;
      return;
    }
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });
    fetchApi<MoversResponse>("/movers", buildMoverParams({ year, metric }))
      .then((m) => {
        if (!cancelled) setMovers(m);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setError("Could not load movers data.");
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
            <h1 className="font-display text-2xl font-bold uppercase leading-none">Movers</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Year-over-year risers &amp; fallers and the fastest growers
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
              {MOVER_METRICS.map((m) => (
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
          <MoverKpiStrip movers={movers} cagr={cagr} />
        </div>

        <div className="mb-3 grid gap-3 xl:grid-cols-2">
          <Panel title={`Top gainers · ${MOVER_METRIC_LABEL[metric]} · ${movers.prevYear ?? "—"}→${movers.year}`}>
            <MoverLeaderboard rows={movers.gainers} metric={metric} variant="gain" />
          </Panel>
          <Panel title={`Top losers · ${MOVER_METRIC_LABEL[metric]} · ${movers.prevYear ?? "—"}→${movers.year}`}>
            <MoverLeaderboard rows={movers.losers} metric={metric} variant="loss" />
          </Panel>
        </div>

        <Panel title="Fastest-growing · Revenue CAGR (full span)">
          <CagrLeaderboard rows={cagr.rows} />
        </Panel>
      </main>
    </div>
  );
}
