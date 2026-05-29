import { Suspense } from "react";
import { MoversView } from "@/components/movers/MoversView";
import {
  buildCompanyParams,
  buildMoverParams,
  fetchApi,
  type CagrResponse,
  type MoverMetric,
  type MoversResponse,
  type SummaryResponse,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const METRICS: MoverMetric[] = ["revenue", "profit", "employees", "pay"];

export default async function MoversPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const requestedYear = typeof sp.year === "string" ? sp.year : undefined;
  const metric: MoverMetric =
    typeof sp.metric === "string" && METRICS.includes(sp.metric as MoverMetric)
      ? (sp.metric as MoverMetric)
      : "revenue";

  let initialData: {
    summary: SummaryResponse;
    year: string;
    movers: MoversResponse;
    cagr: CagrResponse;
  };

  try {
    const summaryBase = await fetchApi<SummaryResponse>("/summary", undefined, {
      next: { revalidate: 300 },
    });
    const year =
      requestedYear && summaryBase.availableYears.includes(requestedYear)
        ? requestedYear
        : summaryBase.year;
    const summary =
      year === summaryBase.year
        ? summaryBase
        : await fetchApi<SummaryResponse>(
            "/summary",
            buildCompanyParams({ year, sort: "totalIncome", dir: "desc" }),
            { next: { revalidate: 300 } },
          );

    const [movers, cagr] = await Promise.all([
      fetchApi<MoversResponse>("/movers", buildMoverParams({ year, metric }), {
        next: { revalidate: 300 },
      }),
      fetchApi<CagrResponse>("/movers/cagr", buildMoverParams({ limit: 15 }), {
        next: { revalidate: 300 },
      }),
    ]);

    initialData = { summary, year, movers, cagr };
  } catch (error) {
    console.error("Failed to load movers data:", error);
    return (
      <main className="min-h-screen bg-background p-4 text-foreground">
        Failed to load movers data.
      </main>
    );
  }

  return (
    <Suspense fallback={<div className="p-4">Loading movers…</div>}>
      <MoversView
        years={initialData.summary.availableYears}
        summary={initialData.summary}
        initial={{
          year: initialData.year,
          metric,
          movers: initialData.movers,
          cagr: initialData.cagr,
        }}
      />
    </Suspense>
  );
}
